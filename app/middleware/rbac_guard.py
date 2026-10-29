from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
from typing import List, Optional, Dict, Any
from app.config import ROLE_ADMIN, ROLE_TEACHER, ROLE_MONITOR, ROLE_PARENT_STUDENT, ROLES_MAP

API_KEY_HEADER = APIKeyHeader(name="X-User-Role", auto_error=False)
STUDENT_ID_HEADER = APIKeyHeader(name="X-Student-Id", auto_error=False)

# Audit log for API Gateway & RBAC Guard to display in the Architecture Explorer
GATEWAY_AUDIT_LOGS: List[Dict[str, Any]] = []

# Active session store for token authentication
ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}

def record_gateway_log(method: str, path: str, role: str, status: str, detail: str = ""):
    import datetime
    log_entry = {
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
        "method": method,
        "path": path,
        "role": role,
        "status": status, # 'ALLOWED', 'DENIED', 'AUTHENTICATED'
        "detail": detail
    }
    GATEWAY_AUDIT_LOGS.insert(0, log_entry)
    if len(GATEWAY_AUDIT_LOGS) > 50:
        GATEWAY_AUDIT_LOGS.pop()

def get_current_user_context(
    request: Request,
    role: Optional[str] = Depends(API_KEY_HEADER),
    student_id: Optional[str] = Depends(STUDENT_ID_HEADER)
) -> Dict[str, Any]:
    # 1. Kiểm tra session token qua Authorization header hoặc X-Session-Token
    auth_header = request.headers.get("Authorization", "")
    token = ""
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    elif "X-Session-Token" in request.headers:
        token = request.headers.get("X-Session-Token", "").strip()

    if token and token in ACTIVE_SESSIONS:
        session_user = ACTIVE_SESSIONS[token]
        user_role = session_user.get("role", ROLE_TEACHER)
        duty = session_user.get("duty")
        sid = session_user.get("student_id") or (2 if user_role == ROLE_PARENT_STUDENT else 1)
        role_label = f"⭐ {duty}" if duty else ROLES_MAP.get(user_role, "Khách")
        return {
            "role": user_role,
            "duty": duty,
            "role_label": role_label,
            "student_id": sid,
            "user_id": session_user.get("id"),
            "username": session_user.get("username"),
            "email": session_user.get("email") or session_user.get("username"),
            "full_name": session_user.get("full_name"),
            "avatar": session_user.get("avatar"),
            "is_authenticated": True
        }

    # 2. Dự phòng qua Header X-User-Role (hỗ trợ chuyển đổi vai trò trực tiếp trên giao diện)
    user_role = role or ROLE_TEACHER
    sid = int(student_id) if student_id and student_id.isdigit() else (2 if user_role == ROLE_PARENT_STUDENT else 1)
    role_label = ROLES_MAP.get(user_role, "Khách")

    return {
        "role": user_role,
        "role_label": role_label,
        "student_id": sid,
        "is_authenticated": False
    }

def require_roles(allowed_roles: List[str]):
    def role_checker(
        request: Request,
        context: Dict[str, Any] = Depends(get_current_user_context)
    ):
        user_role = context["role"]
        method = request.method
        path = request.url.path

        # Admin luôn có toàn quyền truy cập tất cả tài nguyên hệ thống
        if user_role != ROLE_ADMIN and user_role not in allowed_roles:
            record_gateway_log(
                method=method,
                path=path,
                role=user_role,
                status="DENIED",
                detail=f"Quyền bị từ chối: Yêu cầu {allowed_roles}, nhưng vai trò hiện tại là '{user_role}'"
            )
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "RBAC_PERMISSION_DENIED",
                    "message": f"Bạn không có quyền truy cập endpoint này. Vai trò yêu cầu: {', '.join(allowed_roles)}. Vai trò của bạn: {user_role}",
                    "current_role": user_role,
                    "allowed_roles": allowed_roles
                }
            )

        record_gateway_log(
            method=method,
            path=path,
            role=user_role,
            status="ALLOWED",
            detail=f"RBAC Guard hợp lệ ({user_role})"
        )
        return context

    return role_checker
