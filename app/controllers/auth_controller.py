import logging
import secrets
import hashlib
import hmac
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, Header

from app.config import (
    ROLES_MAP,
    ROLE_TEACHER,
    ROLE_MONITOR,
    ROLE_PARENT_STUDENT,
    ROLE_STUDENT,
    ROLE_ADMIN,
    CLASS_DUTIES,
    SUPABASE_URL
)
from app.database import query_all, query_one, execute_commit
from app.models.schemas import UserRegisterRequest, UserLoginRequest
from app.supabase_client import get_supabase_admin
from app.middleware.rbac_guard import record_gateway_log, ACTIVE_SESSIONS

logger = logging.getLogger("homeroom.auth")

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Management"])

# ==============================================================
# Hashing & Verification Utilities (PBKDF2-SHA256)
# ==============================================================
def hash_password(password: str) -> str:
    """
    Băm mật khẩu sử dụng PBKDF2-HMAC-SHA256 với Salt ngẫu nhiên 16 bytes
    Định dạng lưu trữ an toàn: salt:hash_hex
    """
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"{salt}:{key}"

def verify_password(plain_password: str, stored_hash: Optional[str]) -> bool:
    """
    Xác thực mật khẩu đã băm.
    Hỗ trợ mật khẩu mặc định (123456 hoặc 07074418) cho tài khoản mẫu demo chưa có hash.
    """
    if not stored_hash:
        # Nếu chưa có hash trong DB, chấp nhận mật khẩu mặc định cho các tài khoản demo
        return plain_password in ["123456", "07074418"]
    
    if ":" not in stored_hash:
        # Mật khẩu dạng plain text cũ (nếu có)
        return hmac.compare_digest(plain_password, stored_hash)
    
    salt, expected_key = stored_hash.split(":", 1)
    test_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return hmac.compare_digest(expected_key, test_key)

# Session token store được chia sẻ với RBAC Guard

def get_user_display_label(role: str, duty: Optional[str] = None) -> str:
    """
    Tạo nhãn hiển thị trực quan cho người dùng, nêu rõ chức danh nếu là cán bộ lớp/Mod
    """
    if duty:
        return f"⭐ {duty}"
    if role == ROLE_ADMIN:
        return "🛡️ Quản Trị Viên (Admin)"
    elif role == ROLE_TEACHER:
        return "👑 Giáo Viên Chủ Nhiệm"
    elif role == ROLE_MONITOR:
        return "⭐ Lớp Trưởng (Mod)"
    elif role == ROLE_PARENT_STUDENT:
        return "👨‍👩‍👧 Phụ Huynh Học Sinh"
    elif role == ROLE_STUDENT:
        return "🎓 Học Sinh"
    return ROLES_MAP.get(role, role)


def sync_user_to_supabase(user_data: Dict[str, Any]) -> bool:
    """
    Đồng bộ thông tin tài khoản người dùng trực tiếp lên Supabase Cloud qua REST API
    Tự động xử lý và fallback thông minh nếu schema trên Supabase thiếu cột
    """
    supabase = get_supabase_admin()
    if not supabase:
        return False
    
    payload = {
        "username": user_data["username"],
        "email": user_data.get("email"),
        "duty": user_data.get("duty"),
        "password_hash": user_data.get("password_hash"),
        "full_name": user_data["full_name"],
        "role": user_data["role"],
        "student_id": user_data.get("student_id"),
        "avatar": user_data.get("avatar")
    }

    # Thử upsert tối đa 4 lần, tự động loại bỏ các cột chưa tồn tại trên Supabase nếu gặp lỗi schema
    for _ in range(4):
        try:
            supabase.table("users").upsert(payload, on_conflict="username").execute()
            logger.info(f"Đã đồng bộ user '{user_data['username']}' lên Supabase thành công")
            return True
        except Exception as e:
            err_str = str(e)
            dropped = False
            for col in ["duty", "email", "password_hash", "student_id", "avatar"]:
                if col in payload and f"'{col}' column" in err_str:
                    del payload[col]
                    dropped = True
            if not dropped:
                logger.warning(f"Lỗi khi đồng bộ user '{user_data.get('username')}' lên Supabase: {e}")
                return False
    return False


# ==============================================================
# Authentication Endpoints
# ==============================================================

@router.post("/register")
def register(body: UserRegisterRequest):
    """
    Đăng ký tài khoản người dùng mới:
    - Đăng ký bằng Email (hoặc username)
    - Phân tách rõ ràng nhiệm vụ cán bộ lớp (Lớp trưởng, Lớp phó học tập, Lớp phó nề nếp...)
    - Chỉ tài khoản Phụ huynh mới liên kết 1-1 với học sinh
    """
    email = body.email.strip().lower()
    username = body.username.strip().lower() if body.username else email
    
    # 1. Kiểm tra email hoặc username đã tồn tại chưa
    existing = query_one(
        "SELECT id, username, email FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?",
        (username, email)
    )
    if existing:
        matched = "Email" if existing.get("email") == email else "Tên đăng nhập"
        raise HTTPException(
            status_code=400,
            detail=f"{matched} '{email if matched == 'Email' else username}' đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác."
        )
    
    # 2. Kiểm tra thêm trên Supabase nếu có kết nối
    supabase = get_supabase_admin()
    if supabase:
        try:
            sb_check = supabase.table("users").select("id").eq("username", username).execute()
            if sb_check.data and len(sb_check.data) > 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tài khoản '{username}' đã tồn tại trên Supabase Cloud."
                )
        except HTTPException:
            raise
        except Exception:
            pass

    # 3. Phân loại vai trò người dùng (Giáo viên, Học sinh, Phụ huynh)
    # Đặc biệt: Ban Cán Sự Lớp (Lớp Trưởng, Lớp Phó Học Tập, Lớp Phó Nề Nếp) là Mod (role: monitor)
    raw_role = body.role
    is_class_mod = bool(
        body.is_class_leader 
        or (raw_role == ROLE_MONITOR) 
        or (body.duty and any(k in body.duty for k in ["Lớp Trưởng", "Học Tập", "Nề Nếp", "Kỷ Luật", "Cán Sự", "Mod"]))
    )
    
    student_id = None
    duty = None

    if raw_role == ROLE_TEACHER:
        role = ROLE_TEACHER
        duty = None
        student_id = None

    elif raw_role in [ROLE_STUDENT, ROLE_MONITOR]:
        # Người dùng đăng ký là HỌC SINH
        if is_class_mod:
            role = ROLE_MONITOR  # Mod quản lý lớp 11A5
            duty = body.duty.strip() if body.duty else "Lớp Trưởng (Mod)"
        else:
            role = ROLE_STUDENT  # Học sinh thông thường (Chỉ có quyền xem)
            duty = None

        # TỰ ĐỘNG TẠO / LIÊN KẾT HỒ SƠ HỌC SINH TRONG BẢNG students:
        existing_student = query_one(
            "SELECT id FROM students WHERE LOWER(full_name) = ?",
            (body.full_name.strip().lower(),)
        )

        if role == ROLE_MONITOR:
            if duty and "Học Tập" in duty:
                badge = "Lớp Phó Học Tập"
            elif duty and ("Nề Nếp" in duty or "Kỷ Luật" in duty):
                badge = "Lớp Phó Nề Nếp"
            else:
                badge = "Lớp Trưởng Gương Mẫu"
        else:
            badge = "Học Sinh Tiêu Biểu"

        if existing_student:
            student_id = existing_student["id"]
            if role == ROLE_MONITOR:
                execute_commit("UPDATE students SET badge = ? WHERE id = ?", (badge, student_id))
        else:
            # Tìm vị trí ghế ngồi còn trống (5 hàng x 6 cột)
            occupied = query_all("SELECT seat_row, seat_col FROM students")
            occupied_set = {(s["seat_row"], s["seat_col"]) for s in occupied}

            assigned_row, assigned_col = 1, 1
            found_seat = False
            for r in range(1, 6):
                for c in range(1, 7):
                    if (r, c) not in occupied_set:
                        assigned_row, assigned_col = r, c
                        found_seat = True
                        break
                if found_seat:
                    break
            if not found_seat:
                assigned_row, assigned_col = 5, 6

            # Sinh mã học sinh HS...
            st_count = query_one("SELECT COUNT(*) as c FROM students")["c"]
            student_code = f"HS{str(st_count + 1).zfill(2)}"

            student_avatar = body.avatar or f"https://api.dicebear.com/7.x/bottts/svg?seed={username}"

            student_id = execute_commit("""
                INSERT INTO students (
                    student_code, full_name, gender, seat_row, seat_col,
                    conduct, academic_rank, gpa, gamified_points, badge,
                    parent_name, parent_email, avatar, health_notes, teacher_notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                student_code,
                body.full_name.strip(),
                "Nam",
                assigned_row,
                assigned_col,
                "Tốt",
                "Khá",
                8.0,
                100,
                badge,
                f"Phụ huynh em {body.full_name.strip()}",
                email,
                student_avatar,
                "Bình thường",
                "Học sinh tự đăng ký tài khoản"
            ))

            # Khởi tạo 5 môn học mặc định trong academic_grades
            for subj in ["Toán", "Ngữ Văn", "Tiếng Anh", "Vật Lý", "Hóa Học"]:
                execute_commit("""
                    INSERT INTO academic_grades (student_id, subject, tx1, tx2, gk, ck, average, trend, warning_flag)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (student_id, subj, 8.0, 8.0, 8.0, 8.0, 8.0, "stable", 0))

    elif raw_role == ROLE_PARENT_STUDENT:
        role = ROLE_PARENT_STUDENT
        duty = None
        # Phụ huynh liên kết con em trong lớp
        if body.student_id:
            student_id = body.student_id
            execute_commit(
                "UPDATE students SET parent_name = ?, parent_email = ? WHERE id = ?",
                (body.full_name.strip(), email, student_id)
            )
        elif body.child_name and body.child_name.strip():
            # Con em chưa có tài khoản, phụ huynh nhập tên con để tạo hồ sơ
            child_name = body.child_name.strip()
            existing_child = query_one("SELECT id FROM students WHERE LOWER(full_name) = ?", (child_name.lower(),))
            if existing_child:
                student_id = existing_child["id"]
                execute_commit(
                    "UPDATE students SET parent_name = ?, parent_email = ? WHERE id = ?",
                    (body.full_name.strip(), email, student_id)
                )
            else:
                occupied = query_all("SELECT seat_row, seat_col FROM students")
                occupied_set = {(s["seat_row"], s["seat_col"]) for s in occupied}
                assigned_row, assigned_col = 1, 1
                found_seat = False
                for r in range(1, 6):
                    for c in range(1, 7):
                        if (r, c) not in occupied_set:
                            assigned_row, assigned_col = r, c
                            found_seat = True
                            break
                    if found_seat:
                        break
                st_count = query_one("SELECT COUNT(*) as c FROM students")["c"]
                student_code = f"HS{str(st_count + 1).zfill(2)}"
                student_avatar = f"https://api.dicebear.com/7.x/bottts/svg?seed={student_code}"

                student_id = execute_commit("""
                    INSERT INTO students (
                        student_code, full_name, gender, seat_row, seat_col,
                        conduct, academic_rank, gpa, gamified_points, badge,
                        parent_name, parent_email, avatar, health_notes, teacher_notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    student_code,
                    child_name,
                    "Nam",
                    assigned_row,
                    assigned_col,
                    "Tốt",
                    "Khá",
                    8.0,
                    100,
                    "Học Sinh Tiêu Biểu",
                    body.full_name.strip(),
                    email,
                    student_avatar,
                    "Bình thường",
                    "Hồ sơ do phụ huynh tạo khi đăng ký"
                ))

                for subj in ["Toán", "Ngữ Văn", "Tiếng Anh", "Vật Lý", "Hóa Học"]:
                    execute_commit("""
                        INSERT INTO academic_grades (student_id, subject, tx1, tx2, gk, ck, average, trend, warning_flag)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (student_id, subj, 8.0, 8.0, 8.0, 8.0, 8.0, "stable", 0))
        else:
            all_st = query_all("SELECT id FROM students LIMIT 1")
            if all_st:
                raise HTTPException(
                    status_code=400,
                    detail="Vui lòng chọn con em học sinh trong danh sách hoặc nhập họ tên con em."
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Lớp học chưa có học sinh nào. Vui lòng nhập họ tên con em để hệ thống tạo hồ sơ liên kết."
                )
    else:
        role = ROLE_STUDENT
        duty = None

    # Avatar mặc định theo vai trò
    avatar = body.avatar
    if not avatar:
        if role == ROLE_TEACHER:
            avatar = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80"
        elif role == ROLE_MONITOR:
            avatar = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"
        else:
            avatar = f"https://api.dicebear.com/7.x/bottts/svg?seed={username}"

    # 4. Băm mật khẩu
    hashed_password = hash_password(body.password)

    # 5. Lưu vào CSDL
    new_id = execute_commit("""
        INSERT INTO users (username, email, duty, password_hash, full_name, role, student_id, avatar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (username, email, duty, hashed_password, body.full_name.strip(), role, student_id, avatar))

    # 6. Đồng bộ trực tiếp lên Supabase Cloud
    user_payload = {
        "id": new_id,
        "username": username,
        "email": email,
        "duty": duty,
        "password_hash": hashed_password,
        "full_name": body.full_name.strip(),
        "role": role,
        "student_id": student_id,
        "avatar": avatar
    }
    synced_supabase = sync_user_to_supabase(user_payload)

    # 7. Tạo session token
    token = secrets.token_hex(24)
    ACTIVE_SESSIONS[token] = user_payload

    display_duty = f" ({duty})" if duty else ""
    record_gateway_log(
        method="POST",
        path="/api/auth/register",
        role=role,
        status="ALLOWED",
        detail=f"Đăng ký thành công: {email} [{role}{display_duty}] • Supabase: {'OK' if synced_supabase else 'Pending'}"
    )

    return {
        "success": True,
        "message": "Đăng ký tài khoản thành công và đã đồng bộ với Supabase!",
        "token": token,
        "synced_supabase": synced_supabase,
        "user": {
            "id": new_id,
            "username": username,
            "email": email,
            "duty": duty,
            "full_name": body.full_name.strip(),
            "role": role,
            "role_label": get_user_display_label(role, duty),
            "student_id": student_id,
            "avatar": avatar
        }
    }


@router.post("/login")
def login(body: UserLoginRequest):
    """
    Đăng nhập bằng Email hoặc Username và mật khẩu:
    - Tìm kiếm tài khoản trong CSDL và Supabase theo email hoặc username
    - Kiểm tra mật khẩu
    - Trả về token và thông tin vai trò, nhiệm vụ RBAC
    """
    ident = body.username.strip().lower()
    password = body.password

    # 1. Tìm tài khoản trong database cục bộ theo email hoặc username
    user = query_one(
        "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?",
        (ident, ident)
    )

    # 2. Nếu không thấy cục bộ, thử tìm trên Supabase Cloud
    if not user:
        supabase = get_supabase_admin()
        if supabase:
            try:
                res = supabase.table("users").select("*").eq("username", ident).execute()
                if not (res.data and len(res.data) > 0):
                    res = supabase.table("users").select("*").eq("email", ident).execute()
                if res.data and len(res.data) > 0:
                    sb_user = res.data[0]
                    # Lưu lại vào DB cục bộ
                    execute_commit("""
                        INSERT OR REPLACE INTO users (id, username, email, duty, password_hash, full_name, role, student_id, avatar)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        sb_user.get("id"),
                        sb_user["username"],
                        sb_user.get("email"),
                        sb_user.get("duty"),
                        sb_user.get("password_hash"),
                        sb_user["full_name"],
                        sb_user["role"],
                        sb_user.get("student_id"),
                        sb_user.get("avatar")
                    ))
                    user = query_one("SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?", (ident, ident))
            except Exception as e:
                logger.warning(f"Lỗi tìm kiếm user trên Supabase: {e}")

    if not user:
        record_gateway_log(
            method="POST",
            path="/api/auth/login",
            role="guest",
            status="DENIED",
            detail=f"Đăng nhập thất bại: Tài khoản '{ident}' không tồn tại"
        )
        raise HTTPException(
            status_code=401,
            detail="Email hoặc mật khẩu không chính xác."
        )

    # 3. Kiểm tra mật khẩu
    stored_hash = user.get("password_hash")
    if not verify_password(password, stored_hash):
        record_gateway_log(
            method="POST",
            path="/api/auth/login",
            role=user.get("role", "guest"),
            status="DENIED",
            detail=f"Đăng nhập thất bại: Sai mật khẩu cho user '{ident}'"
        )
        raise HTTPException(
            status_code=401,
            detail="Email hoặc mật khẩu không chính xác."
        )

    # 4. Nếu tài khoản demo chưa có hash mật khẩu, tự động cập nhật hash mới
    if not stored_hash:
        new_hash = hash_password(password)
        execute_commit("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user["id"]))
        user["password_hash"] = new_hash
        sync_user_to_supabase(user)

    # 5. Tạo Session Token
    token = secrets.token_hex(24)
    ACTIVE_SESSIONS[token] = user

    record_gateway_log(
        method="POST",
        path="/api/auth/login",
        role=user["role"],
        status="ALLOWED",
        detail=f"Đăng nhập thành công: {ident} ({user['role']})"
    )

    return {
        "success": True,
        "message": f"Chào mừng {user['full_name']} trở lại!",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user.get("email") or user["username"],
            "duty": user.get("duty"),
            "full_name": user["full_name"],
            "role": user["role"],
            "role_label": get_user_display_label(user["role"], user.get("duty")),
            "student_id": user.get("student_id"),
            "avatar": user.get("avatar")
        }
    }


@router.get("/me")
def get_me(authorization: Optional[str] = Header(None)):
    """
    Trả về thông tin phiên làm việc hiện tại
    """
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        if token in ACTIVE_SESSIONS:
            u = ACTIVE_SESSIONS[token]
            return {
                "authenticated": True,
                "user": {
                    "id": u.get("id"),
                    "username": u.get("username"),
                    "email": u.get("email") or u.get("username"),
                    "duty": u.get("duty"),
                    "full_name": u.get("full_name"),
                    "role": u.get("role"),
                    "role_label": get_user_display_label(u.get("role"), u.get("duty")),
                    "student_id": u.get("student_id"),
                    "avatar": u.get("avatar")
                }
            }
    
    return {"authenticated": False, "user": None}


@router.get("/users")
def get_auth_users():
    """
    Trả về danh sách tài khoản demo và tài khoản đã đăng ký (không trả về mật khẩu)
    Kèm danh mục các nhiệm vụ cụ thể của ban cán sự lớp (CLASS_DUTIES)
    """
    users = query_all("SELECT id, username, email, duty, full_name, role, student_id, avatar, created_at FROM users ORDER BY id ASC")
    return {
        "roles": ROLES_MAP,
        "class_duties": CLASS_DUTIES,
        "users": users
    }


@router.post("/sync-all-to-supabase")
def sync_all_users_to_supabase():
    """
    Đồng bộ toàn bộ danh sách users từ CSDL lên Supabase Cloud
    """
    supabase = get_supabase_admin()
    if not supabase:
        raise HTTPException(
            status_code=500,
            detail="Chưa cấu hình SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY."
        )

    users = query_all("SELECT * FROM users")
    synced_count = 0
    errors = []

    for u in users:
        # Nếu chưa có password hash, tự động hash mật khẩu mặc định 123456
        pw_hash = u.get("password_hash")
        if not pw_hash:
            pw_hash = hash_password("123456")
            execute_commit("UPDATE users SET password_hash = ? WHERE id = ?", (pw_hash, u["id"]))
            u["password_hash"] = pw_hash
        
        ok = sync_user_to_supabase(u)
        if ok:
            synced_count += 1
        else:
            errors.append(f"{u['username']}: Lỗi đồng bộ Supabase")

    return {
        "success": True,
        "total_local_users": len(users),
        "synced_to_supabase": synced_count,
        "errors": errors,
        "message": f"Đã đồng bộ thành công {synced_count}/{len(users)} tài khoản lên Supabase Cloud!"
    }
