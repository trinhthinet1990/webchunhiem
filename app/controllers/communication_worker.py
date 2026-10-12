from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.database import query_all, query_one, get_db_connection
from app.middleware.rbac_guard import require_roles, get_current_user_context
from app.config import ROLE_TEACHER, ROLE_MONITOR, ROLE_PARENT_STUDENT
from app.models.schemas import ParentCommunicationRequest, AbsenceRequestCreate, AbsenceRequestReview

router = APIRouter(prefix="/api/communication", tags=["Parent Communication Worker"])

@router.get("/logs")
def get_communication_logs(
    student_id: Optional[int] = None,
    channel: Optional[str] = None,
    context: Dict[str, Any] = Depends(get_current_user_context)
):
    query = """
        SELECT c.*, s.full_name as student_name, s.student_code, s.avatar
        FROM parent_communications c
        JOIN students s ON c.student_id = s.id
        WHERE 1=1
    """
    params = []
    if student_id:
        query += " AND c.student_id = ?"
        params.append(student_id)
    if channel:
        query += " AND c.channel = ?"
        params.append(channel)
    query += " ORDER BY c.sent_at DESC LIMIT 50"

    logs = query_all(query, tuple(params))
    return logs

@router.post("/send")
def send_parent_message(
    body: ParentCommunicationRequest,
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER]))
):
    student = query_one("SELECT * FROM students WHERE id = ?", (body.student_id,))
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy học sinh")

    recipient = f"{student['parent_phone']} ({student['parent_name']})"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO parent_communications (student_id, channel, recipient, subject, message, status, trigger_type)
        VALUES (?, ?, ?, ?, ?, 'Đã gửi', ?)
    """, (body.student_id, body.channel, recipient, body.subject, body.message, body.trigger_type))
    comm_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "success": True,
        "comm_id": comm_id,
        "student_name": student["full_name"],
        "recipient": recipient,
        "channel": body.channel,
        "status": "Đã gửi thành công",
        "message": f"Worker đã phát tin thành công qua kênh '{body.channel}' tới phụ huynh em {student['full_name']}."
    }

@router.post("/auto-weekly-dispatch")
def auto_weekly_dispatch(
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER]))
):
    """
    Parent Communication Worker: Kích hoạt gửi báo cáo tổng hợp tuần tự động qua Zalo/SMS cho toàn bộ phụ huynh
    """
    students = query_all("SELECT * FROM students")
    conn = get_db_connection()
    cursor = conn.cursor()

    count = 0
    now_str = datetime.now().strftime("%d/%m/%Y")

    for s in students:
        msg = f"[BÁO CÁO TUẦN {now_str}] Kính gửi PH em {s['full_name']} (Lớp 12A1): Điểm thi đua tuần: {s['gamified_points']}đ ({s['badge']}). GPA hiện tại: {s['gpa']}. Kính mời phụ huynh truy cập Cổng Phụ Huynh để xem chi tiết."
        recipient = f"{s['parent_phone']} ({s['parent_name']})"
        cursor.execute("""
            INSERT INTO parent_communications (student_id, channel, recipient, subject, message, status, trigger_type)
            VALUES (?, 'Zalo Oa', ?, 'Báo cáo rèn luyện tuần tự động', ?, 'Đã gửi', 'Hệ thống tự động')
        """, (s["id"], recipient, msg))
        count += 1

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": f"Worker đã tự động dispatch báo cáo tuần thành công tới {count} phụ huynh học sinh.",
        "total_dispatched": count
    }

# ==================== ABSENCE REQUESTS (PORTAL) ====================
absence_router = APIRouter(prefix="/api/absence", tags=["Absence Request Management"])

@absence_router.get("/requests")
def list_absence_requests(context: Dict[str, Any] = Depends(get_current_user_context)):
    role = context["role"]
    student_id = context.get("student_id")

    query = """
        SELECT r.*, s.full_name as student_name, s.student_code, s.seat_row, s.seat_col, s.avatar
        FROM absence_requests r
        JOIN students s ON r.student_id = s.id
    """
    params = []
    # If parent role, only see their own student requests
    if role == ROLE_PARENT_STUDENT and student_id:
        query += " WHERE r.student_id = ?"
        params.append(student_id)
    
    query += " ORDER BY r.created_at DESC"
    requests = query_all(query, tuple(params))
    return requests

@absence_router.post("/requests")
def create_absence_request(
    body: AbsenceRequestCreate,
    context: Dict[str, Any] = Depends(require_roles([ROLE_PARENT_STUDENT, ROLE_TEACHER]))
):
    student = query_one("SELECT * FROM students WHERE id = ?", (body.student_id,))
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy học sinh")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO absence_requests (student_id, parent_name, from_date, to_date, reason, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
    """, (body.student_id, body.parent_name, body.from_date, body.to_date, body.reason))
    req_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "success": True,
        "request_id": req_id,
        "message": "Đơn xin nghỉ phép đã được gửi thành công đến Giáo viên Chủ nhiệm."
    }

@absence_router.put("/requests/review")
def review_absence_request(
    body: AbsenceRequestReview,
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER]))
):
    req = query_one("SELECT * FROM absence_requests WHERE id = ?", (body.request_id,))
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn xin nghỉ")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE absence_requests 
        SET status = ?, teacher_reply = ?
        WHERE id = ?
    """, (body.status, body.teacher_reply, body.request_id))

    # If approved, automatically update attendance log for that student
    if body.status == "approved":
        cursor.execute("""
            INSERT INTO attendance_logs (student_id, date, session, status, note, recorded_by)
            VALUES (?, ?, 'Sáng', 'excused', ?, 'teacher')
        """, (req["student_id"], req["from_date"], f"Nghỉ có phép theo đơn: {req['reason']}"))

        # Send notification to parent
        stu = query_one("SELECT parent_phone, parent_name, full_name FROM students WHERE id = ?", (req["student_id"],))
        if stu:
            cursor.execute("""
                INSERT INTO parent_communications (student_id, channel, recipient, subject, message, trigger_type)
                VALUES (?, 'Cổng Phụ Huynh', ?, 'Thông báo duyệt đơn xin nghỉ phép', ?, 'GVCN phản hồi')
            """, (req["student_id"], stu["parent_phone"], f"GVCN đã DUYỆT đơn xin phép nghỉ cho em {stu['full_name']}. Lời nhắn: {body.teacher_reply}"))

    conn.commit()
    conn.close()

    status_vn = "ĐÃ DUYỆT" if body.status == "approved" else "TỪ CHỐI"
    return {
        "success": True,
        "message": f"Đã cập nhật trạng thái đơn: {status_vn}",
        "status": body.status
    }
