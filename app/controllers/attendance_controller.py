from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.database import query_all, query_one, get_db_connection
from app.middleware.rbac_guard import require_roles, get_current_user_context
from app.config import ROLE_TEACHER, ROLE_MONITOR, ROLE_PARENT_STUDENT
from app.models.schemas import AttendanceBatchUpdateRequest, GamifiedPointRequest

router = APIRouter(tags=["Attendance & Gamified Point Controller"])

# ==================== ATTENDANCE APIS ====================

@router.get("/api/attendance/today")
def get_today_attendance(
    date: Optional[str] = None,
    session: str = "Sáng",
    context: Dict[str, Any] = Depends(get_current_user_context)
):
    query_date = date or datetime.now().strftime("%Y-%m-%d")

    records = query_all("""
        SELECT 
            s.id as student_id,
            s.student_code,
            s.full_name,
            s.seat_row,
            s.seat_col,
            s.avatar,
            COALESCE(a.status, 'present') as status,
            COALESCE(a.note, '') as note,
            a.recorded_by,
            a.created_at
        FROM students s
        LEFT JOIN attendance_logs a 
            ON s.id = a.student_id AND a.date = ? AND a.session = ?
        ORDER BY s.seat_row ASC, s.seat_col ASC
    """, (query_date, session))

    # Stats
    total = len(records)
    present_cnt = sum(1 for r in records if r["status"] == "present")
    late_cnt = sum(1 for r in records if r["status"] == "late")
    excused_cnt = sum(1 for r in records if r["status"] == "excused")
    unexcused_cnt = sum(1 for r in records if r["status"] == "unexcused")

    return {
        "date": query_date,
        "session": session,
        "total": total,
        "stats": {
            "present": present_cnt,
            "late": late_cnt,
            "excused": excused_cnt,
            "unexcused": unexcused_cnt,
            "attendance_rate": round(((present_cnt + late_cnt) / max(1, total)) * 100, 1)
        },
        "records": records
    }

@router.post("/api/attendance/quick-mark")
def quick_mark_attendance(
    student_id: int = Query(...),
    status: str = Query(..., pattern="^(present|late|excused|unexcused)$"),
    note: str = Query(""),
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER, ROLE_MONITOR]))
):
    """
    Điểm danh nhanh 1 học sinh (Hỗ trợ cả Cán sự lớp và GVCN)
    """
    today = datetime.now().strftime("%Y-%m-%d")
    role = context["role"]

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if record exists for today
    cursor.execute("""
        SELECT id FROM attendance_logs 
        WHERE student_id = ? AND date = ? AND session = 'Sáng'
    """, (student_id, today))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
            UPDATE attendance_logs 
            SET status = ?, note = ?, recorded_by = ?, created_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (status, note, role, existing["id"]))
    else:
        cursor.execute("""
            INSERT INTO attendance_logs (student_id, date, session, status, note, recorded_by)
            VALUES (?, ?, 'Sáng', ?, ?, ?)
        """, (student_id, today, status, note, role))

    # Auto trigger Parent Notification if unexcused absence
    if status == "unexcused":
        cursor.execute("""
            SELECT full_name, parent_phone, parent_name FROM students WHERE id = ?
        """, (student_id,))
        stu = cursor.fetchone()
        if stu:
            cursor.execute("""
                INSERT INTO parent_communications (student_id, channel, recipient, subject, message, trigger_type)
                VALUES (?, 'SMS Gateway', ?, 'Cảnh báo vắng học khẩn cấp', ?, 'Tự động bởi Điểm danh')
            """, (student_id, stu["parent_phone"], f"Kính gửi {stu['parent_name']}: Hệ thống ghi nhận em {stu['full_name']} chưa có mặt tại lớp sáng nay. Vui lòng xác nhận với nhà trường."))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "student_id": student_id,
        "new_status": status,
        "recorded_by": role,
        "message": f"Đã cập nhật trạng thái điểm danh: {status}"
    }

@router.post("/api/attendance/batch")
def batch_update_attendance(
    body: AttendanceBatchUpdateRequest,
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER, ROLE_MONITOR]))
):
    role = context["role"]
    conn = get_db_connection()
    cursor = conn.cursor()

    for item in body.items:
        cursor.execute("""
            SELECT id FROM attendance_logs 
            WHERE student_id = ? AND date = ? AND session = ?
        """, (item.student_id, body.date, body.session))
        existing = cursor.fetchone()

        if existing:
            cursor.execute("""
                UPDATE attendance_logs 
                SET status = ?, note = ?, recorded_by = ?
                WHERE id = ?
            """, (item.status, item.note or "", role, existing["id"]))
        else:
            cursor.execute("""
                INSERT INTO attendance_logs (student_id, date, session, status, note, recorded_by)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (item.student_id, body.date, body.session, item.status, item.note or "", role))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": f"Đã cập nhật điểm danh thành công cho {len(body.items)} học sinh",
        "date": body.date
    }

# ==================== GAMIFIED POINT APIS ====================

BADGE_THRESHOLDS = [
    (200, "👑 Đại Sứ Gương Mẫu"),
    (170, "⭐ Ngôi Sao Sáng Toàn Diện"),
    (140, "🚀 Hiệp Sĩ Nỗ Lực"),
    (110, "🌱 Mầm Non Tích Cực"),
    (0, "🛡️ Chiến Binh Rèn Luyện")
]

def determine_badge(points: int) -> str:
    for threshold, badge_name in BADGE_THRESHOLDS:
        if points >= threshold:
            return badge_name
    return "🛡️ Chiến Binh Rèn Luyện"

@router.post("/api/gamification/award")
def award_points(
    body: GamifiedPointRequest,
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER, ROLE_MONITOR]))
):
    """
    Cộng hoặc trừ điểm thi đua nề nếp (GVCN hoặc Cán sự lớp thực hiện)
    Tự động cập nhật tổng điểm và nâng hạng Huy Hiệu (Gamification Badge)
    """
    student = query_one("SELECT id, full_name, gamified_points FROM students WHERE id = ?", (body.student_id,))
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy học sinh")

    new_points = max(0, student["gamified_points"] + body.points)
    new_badge = determine_badge(new_points)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Insert point log
    cursor.execute("""
        INSERT INTO gamified_points_logs (student_id, points, reason, category, recorded_by)
        VALUES (?, ?, ?, ?, ?)
    """, (body.student_id, body.points, body.reason, body.category, context["role"]))

    # Update student points & badge
    cursor.execute("""
        UPDATE students SET gamified_points = ?, badge = ? WHERE id = ?
    """, (new_points, new_badge, body.student_id))

    conn.commit()
    conn.close()

    sign_str = f"+{body.points}" if body.points > 0 else f"{body.points}"
    return {
        "success": True,
        "student_name": student["full_name"],
        "delta": body.points,
        "new_total": new_points,
        "badge": new_badge,
        "message": f"Đã ghi nhận {sign_str} điểm thi đua cho {student['full_name']} ({body.reason})"
    }

@router.get("/api/gamification/leaderboard")
def get_gamification_leaderboard(context: Dict[str, Any] = Depends(get_current_user_context)):
    """
    Bảng xếp hạng thi đua nề nếp của lớp
    """
    top_students = query_all("""
        SELECT id, student_code, full_name, seat_row, seat_col, gamified_points, badge, avatar, academic_rank
        FROM students
        ORDER BY gamified_points DESC
        LIMIT 10
    """)

    recent_logs = query_all("""
        SELECT g.*, s.full_name as student_name, s.avatar
        FROM gamified_points_logs g
        JOIN students s ON g.student_id = s.id
        ORDER BY g.created_at DESC
        LIMIT 10
    """)

    return {
        "top_students": top_students,
        "recent_activity": recent_logs
    }
