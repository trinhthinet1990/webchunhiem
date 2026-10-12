from fastapi import Request, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
from typing import List, Optional, Dict, Any
from app.config import ROLE_TEACHER, ROLE_MONITOR, ROLE_PARENT_STUDENT, ROLES_MAP

API_KEY_HEADER = APIKeyHeader(name="X-User-Role", auto_error=False)
STUDENT_ID_HEADER = APIKeyHeader(name="X-Student-Id", auto_error=False)

# Audit log for API Gateway & RBAC Guard to display in the Architecture Explorer
GATEWAY_AUDIT_LOGS: List[Dict[str, Any]] = []

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
    role: Optional[str] = Depends(API_KEY_HEADER),
    student_id: Optional[str] = Depends(STUDENT_ID_HEADER)
) -> Dict[str, Any]:
    # Default to teacher if not specified (for ease of initial exploration)
    user_role = role or ROLE_TEACHER
    sid = int(student_id) if student_id and student_id.isdigit() else (2 if user_role == ROLE_PARENT_STUDENT else 1)

    role_label = ROLES_MAP.get(user_role, "Khách")

    return {
        "role": user_role,
        "role_label": role_label,
        "student_id": sid,
        "is_authenticated": True
    }

def require_roles(allowed_roles: List[str]):
    def role_checker(
        request: Request,
        context: Dict[str, Any] = Depends(get_current_user_context)
    ):
        user_role = context["role"]
        method = request.method
        path = request.url.path

        if user_role not in allowed_roles:
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
