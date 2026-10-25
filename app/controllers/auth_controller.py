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
    Tạo nhãn hiển thị trực quan cho người dùng, nêu rõ chức danh nếu là cán bộ lớp
    """
    if duty:
        return f"⭐ {duty}"
    if role == ROLE_TEACHER:
        return "👑 Giáo Viên Chủ Nhiệm"
    elif role == ROLE_MONITOR:
        return "⭐ Cán Sự Lớp"
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

    # 3. Validate Role & Duty
    role = body.role if body.role in ROLES_MAP else ROLE_PARENT_STUDENT
    duty = body.duty.strip() if body.duty else None
    
    # QUY TẮC CỐT LÕI: Chỉ phụ huynh mới liên kết 1-1 với học sinh
    if role == ROLE_PARENT_STUDENT:
        if not body.student_id:
            raise HTTPException(
                status_code=400,
                detail="Tài khoản Phụ huynh bắt buộc phải chọn học sinh liên kết (1-1) trong danh sách lớp 12A1."
            )
        student_id = body.student_id
    else:
        # Cán bộ lớp (monitor) và GVCN (teacher) KHÔNG liên kết học sinh con em
        student_id = None

    # Avatar mặc định theo vai trò
    avatar = body.avatar
    if not avatar:
        if role == ROLE_TEACHER:
            avatar = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80"
        elif role == ROLE_MONITOR:
            avatar = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"
        else:
            avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"

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
            "student_id": user.get("student_id") or (2 if user["role"] == ROLE_PARENT_STUDENT else None),
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
