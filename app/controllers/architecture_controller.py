from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.database import query_one, query_all
from app.middleware.rbac_guard import GATEWAY_AUDIT_LOGS, get_current_user_context

router = APIRouter(prefix="/api/architecture", tags=["Architecture & System Flow Explorer"])

@router.get("/status")
def get_architecture_status(context: Dict[str, Any] = Depends(get_current_user_context)):
    """
    Trả về toàn bộ trạng thái sống động của 4 Tầng Kiến Trúc theo đúng sơ đồ
    """
    students_count = query_one("SELECT COUNT(*) as c FROM students")["c"]
    att_today = query_one("SELECT COUNT(*) as c FROM attendance_logs WHERE date = date('now')")["c"]
    points_total = query_one("SELECT COUNT(*) as c FROM gamified_points_logs")["c"]
    ai_reports_cnt = query_one("SELECT COUNT(*) as c FROM ai_reports")["c"]
    comm_cnt = query_one("SELECT COUNT(*) as c FROM parent_communications")["c"]
    pending_absence = query_one("SELECT COUNT(*) as c FROM absence_requests WHERE status = 'pending'")["c"]

    return {
        "system_title": "Luồng Hoạt Động Mới - Homeroom AI Platform",
        "author": "Nết Trình • AI Architecture Studio",
        "published_date": "05/10/2026",
        "domain": "homeroom.alphacap.vn",
        "tiers": {
            "frontend": {
                "name": "TẦNG GIAO DIỆN (FRONTEND)",
                "color": "#8b5cf6",
                "components": [
                    {
                        "id": "gvcn_dashboard",
                        "title": "Dashboard GVCN (Toàn quyền Quản lý)",
                        "desc": "Giao diện quản lý sơ đồ lớp, điểm danh, xem báo cáo, nhận xét AI, thi đua",
                        "status": "ONLINE",
                        "target_role": "teacher",
                        "metrics": f"{students_count} học sinh • 5x6 chỗ ngồi"
                    },
                    {
                        "id": "parent_portal",
                        "title": "Cổng Phụ huynh & Học sinh",
                        "desc": "Giao diện tra cứu kết quả rèn luyện, chuyên cần, thông báo & gửi đơn nghỉ phép",
                        "status": "ONLINE",
                        "target_role": "parent_student",
                        "metrics": f"{pending_absence} đơn cần duyệt"
                    },
                    {
                        "id": "monitor_portal",
                        "title": "Cổng Cán sự lớp (Hỗ trợ Điểm danh)",
                        "desc": "Giao diện hỗ trợ cán sự lớp thực hiện điểm danh nhanh và ghi nhận nề nếp thi đua",
                        "status": "ONLINE",
                        "target_role": "monitor",
                        "metrics": "Chế độ điểm danh 1-chạm"
                    }
                ]
            },
            "security": {
                "name": "TẦNG BẢO MẬT & MIDDLEWARE",
                "color": "#f59e0b",
                "components": [
                    {
                        "id": "api_gateway_rbac",
                        "title": "API Gateway & RBAC Auth Guard",
                        "desc": "Xác thực người dùng và phân quyền truy cập rõ ràng theo vai trò (Teacher / Monitor / Parent)",
                        "status": "ACTIVE",
                        "recent_audits": GATEWAY_AUDIT_LOGS[:8],
                        "active_current_role": context["role"]
                    }
                ]
            },
            "backend": {
                "name": "TẦNG NGHIỆP VỤ (BACKEND API)",
                "color": "#3b82f6",
                "components": [
                    {
                        "id": "seatmap_ctrl",
                        "title": "Profile & Smart SeatMap Controller",
                        "desc": "Quản lý hồ sơ 360° học sinh và vị trí sơ đồ lớp học tương tác (Auto-arrange)",
                        "endpoint": "/api/seatmap/*",
                        "status": "READY"
                    },
                    {
                        "id": "attendance_ctrl",
                        "title": "Attendance & Gamified Point Controller",
                        "desc": "Xử lý điểm danh chuyên cần, cộng/trừ điểm thi đua nề nếp sống & danh hiệu",
                        "endpoint": "/api/attendance/* & /api/gamification/*",
                        "status": "READY",
                        "metrics": f"{att_today} lượt hôm nay • {points_total} sự kiện thi đua"
                    },
                    {
                        "id": "academic_ctrl",
                        "title": "Academic & Conduct Controller",
                        "desc": "Tổng hợp điểm số học lực, phân tích xu hướng và cảnh báo học tập sút giảm",
                        "endpoint": "/api/academic/*",
                        "status": "READY"
                    },
                    {
                        "id": "ai_report_engine",
                        "title": "AI Report Writer Engine",
                        "desc": "Phân tích dữ liệu học lực, nề nếp sống để tự động sinh nhận xét học sinh đa sắc thái",
                        "endpoint": "/api/ai-report/*",
                        "status": "READY",
                        "metrics": f"{ai_reports_cnt} nhận xét đã sinh"
                    },
                    {
                        "id": "parent_comm_worker",
                        "title": "Parent Communication Worker",
                        "desc": "Tự động gửi báo cáo tuần/tháng và cảnh báo vắng học qua Zalo OA, SMS Gateway",
                        "endpoint": "/api/communication/*",
                        "status": "READY",
                        "metrics": f"{comm_cnt} thông báo đã phát"
                    }
                ]
            },
            "database": {
                "name": "TẦNG CƠ SỞ DỮ LIỆU (DATABASE)",
                "color": "#10b981",
                "components": [
                    {
                        "id": "homeroom_db",
                        "title": "Main Homeroom DB",
                        "desc": "Lưu trữ tập trung hồ sơ học sinh, sơ đồ chỗ ngồi, lịch sử điểm danh, điểm thi đua, học bạ",
                        "engine": "SQLite Relational Storage",
                        "status": "CONNECTED",
                        "tables": ["users", "students", "attendance_logs", "gamified_points_logs", "academic_grades", "ai_reports", "parent_communications", "absence_requests"]
                    }
                ]
            }
        }
    }
