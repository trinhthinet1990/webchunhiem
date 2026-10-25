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

def sync_user_to_supabase(user_data: Dict[str, Any]) -> bool:
    """
    Đồng bộ thông tin tài khoản người dùng trực tiếp lên Supabase Cloud qua REST API
    Có cơ chế tự động fallback nếu Supabase chưa bổ sung cột password_hash
    """
    supabase = get_supabase_admin()
    if not supabase:
        return False
    
    payload = {
        "username": user_data["username"],
        "password_hash": user_data.get("password_hash"),
        "full_name": user_data["full_name"],
        "role": user_data["role"],
        "student_id": user_data.get("student_id"),
        "avatar": user_data.get("avatar")
    }

    try:
        res = supabase.table("users").upsert(payload, on_conflict="username").execute()
        logger.info(f"Đã đồng bộ user '{user_data['username']}' lên Supabase thành công")
        return True
    except Exception as e:
        err_str = str(e)
        logger.warning(f"Lỗi khi đồng bộ user '{user_data.get('username')}' lên Supabase: {e}")
        # Nếu cột password_hash chưa có trong bảng users trên Supabase, đồng bộ fallback các trường còn lại
        if "password_hash" in err_str:
            try:
                fallback_payload = {
                    "username": user_data["username"],
                    "full_name": user_data["full_name"],
                    "role": user_data["role"],
                    "student_id": user_data.get("student_id"),
                    "avatar": user_data.get("avatar")
                }
                supabase.table("users").upsert(fallback_payload, on_conflict="username").execute()
                logger.info(f"Đã đồng bộ user '{user_data['username']}' lên Supabase (fallback)")
                return True
            except Exception as e2:
                logger.warning(f"Lỗi fallback đồng bộ Supabase: {e2}")
        return False

# ==============================================================
# Authentication Endpoints
# ==============================================================

@router.post("/register")
def register(body: UserRegisterRequest):
    """
    Đăng ký tài khoản người dùng mới:
    - Kiểm tra username trùng lặp
    - Băm mật khẩu bảo mật PBKDF2
    - Lưu vào CSDL
    - Tự động đồng bộ lên Supabase Cloud
    """
    username = body.username.strip().lower()
    
    # 1. Kiểm tra username đã tồn tại trong DB chưa
    existing = query_one("SELECT id, username FROM users WHERE username = ?", (username,))
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Tên đăng nhập '{username}' đã được sử dụng. Vui lòng chọn tên khác."
        )
    
    # 2. Kiểm tra thêm trên Supabase nếu có kết nối
    supabase = get_supabase_admin()
    if supabase:
        try:
            sb_check = supabase.table("users").select("id").eq("username", username).execute()
            if sb_check.data and len(sb_check.data) > 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Tên đăng nhập '{username}' đã tồn tại trên Supabase Cloud."
                )
        except HTTPException:
            raise
        except Exception:
            pass

    # 3. Validate Role
    role = body.role if body.role in ROLES_MAP else ROLE_PARENT_STUDENT
    
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
        INSERT INTO users (username, password_hash, full_name, role, student_id, avatar)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (username, hashed_password, body.full_name.strip(), role, body.student_id, avatar))

    # 6. Đồng bộ trực tiếp lên Supabase Cloud
    user_payload = {
        "id": new_id,
        "username": username,
        "password_hash": hashed_password,
        "full_name": body.full_name.strip(),
        "role": role,
        "student_id": body.student_id,
        "avatar": avatar
    }
    synced_supabase = sync_user_to_supabase(user_payload)

    # 7. Tạo session token
    token = secrets.token_hex(24)
    ACTIVE_SESSIONS[token] = user_payload

    record_gateway_log(
        method="POST",
        path="/api/auth/register",
        role=role,
        status="ALLOWED",
        detail=f"Đăng ký thành công: {username} ({role}) • Supabase Sync: {'OK' if synced_supabase else 'Pending'}"
    )

    return {
        "success": True,
        "message": "Đăng ký tài khoản thành công và đã đồng bộ với Supabase!",
        "token": token,
        "synced_supabase": synced_supabase,
        "user": {
            "id": new_id,
            "username": username,
            "full_name": body.full_name.strip(),
            "role": role,
            "role_label": ROLES_MAP.get(role, role),
            "student_id": body.student_id,
            "avatar": avatar
        }
    }


@router.post("/login")
def login(body: UserLoginRequest):
    """
    Đăng nhập bằng username và mật khẩu:
    - Tìm kiếm tài khoản trong CSDL và Supabase
    - Kiểm tra mật khẩu
    - Trả về token và thông tin vai trò RBAC
    """
    username = body.username.strip().lower()
    password = body.password

    # 1. Tìm tài khoản trong database
    user = query_one("SELECT * FROM users WHERE username = ?", (username,))

    # 2. Nếu không thấy cục bộ, thử tìm trên Supabase Cloud
    if not user:
        supabase = get_supabase_admin()
        if supabase:
            try:
                res = supabase.table("users").select("*").eq("username", username).execute()
                if res.data and len(res.data) > 0:
                    sb_user = res.data[0]
                    # Lưu lại vào DB cục bộ
                    execute_commit("""
                        INSERT OR REPLACE INTO users (id, username, password_hash, full_name, role, student_id, avatar)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        sb_user.get("id"),
                        sb_user["username"],
                        sb_user.get("password_hash"),
                        sb_user["full_name"],
                        sb_user["role"],
                        sb_user.get("student_id"),
                        sb_user.get("avatar")
                    ))
                    user = query_one("SELECT * FROM users WHERE username = ?", (username,))
            except Exception as e:
                logger.warning(f"Lỗi tìm kiếm user trên Supabase: {e}")

    if not user:
        record_gateway_log(
            method="POST",
            path="/api/auth/login",
            role="guest",
            status="DENIED",
            detail=f"Đăng nhập thất bại: Tài khoản '{username}' không tồn tại"
        )
        raise HTTPException(
            status_code=401,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác."
        )

    # 3. Kiểm tra mật khẩu
    stored_hash = user.get("password_hash")
    if not verify_password(password, stored_hash):
        record_gateway_log(
            method="POST",
            path="/api/auth/login",
            role=user.get("role", "guest"),
            status="DENIED",
            detail=f"Đăng nhập thất bại: Sai mật khẩu cho user '{username}'"
        )
        raise HTTPException(
            status_code=401,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác."
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
        detail=f"Đăng nhập thành công: {username} ({user['role']})"
    )

    return {
        "success": True,
        "message": f"Chào mừng {user['full_name']} trở lại!",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"],
            "role_label": ROLES_MAP.get(user["role"], user["role"]),
            "student_id": user.get("student_id") or (2 if user["role"] == ROLE_PARENT_STUDENT else 1),
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
                    "full_name": u.get("full_name"),
                    "role": u.get("role"),
                    "role_label": ROLES_MAP.get(u.get("role"), u.get("role")),
                    "student_id": u.get("student_id"),
                    "avatar": u.get("avatar")
                }
            }
    
    return {"authenticated": False, "user": None}


@router.get("/users")
def get_auth_users():
    """
    Trả về danh sách tài khoản demo và tài khoản đã đăng ký (không trả về mật khẩu)
    """
    users = query_all("SELECT id, username, full_name, role, student_id, avatar, created_at FROM users ORDER BY id ASC")
    return {
        "roles": ROLES_MAP,
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
        
        payload = {
            "username": u["username"],
            "password_hash": pw_hash,
            "full_name": u["full_name"],
            "role": u["role"],
            "student_id": u.get("student_id"),
            "avatar": u.get("avatar")
        }
        try:
            supabase.table("users").upsert(payload, on_conflict="username").execute()
            synced_count += 1
        except Exception as e:
            if "password_hash" in str(e):
                try:
                    fallback_payload = {k: v for k, v in payload.items() if k != "password_hash"}
                    supabase.table("users").upsert(fallback_payload, on_conflict="username").execute()
                    synced_count += 1
                    continue
                except Exception as e2:
                    errors.append(f"{u['username']}: {str(e2)}")
            else:
                errors.append(f"{u['username']}: {str(e)}")

    return {
        "success": True,
        "total_local_users": len(users),
        "synced_to_supabase": synced_count,
        "errors": errors,
        "message": f"Đã đồng bộ thành công {synced_count}/{len(users)} tài khoản lên Supabase Cloud!"
    }
