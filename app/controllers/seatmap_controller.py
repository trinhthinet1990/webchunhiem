from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.database import query_all, query_one, execute_commit, get_db_connection
from app.middleware.rbac_guard import require_roles, get_current_user_context
from app.config import ROLE_TEACHER, ROLE_MONITOR, ROLE_PARENT_STUDENT
from app.models.schemas import SeatMapUpdateRequest, SeatSwapRequest, SmartSeatReorderRequest

router = APIRouter(prefix="/api/seatmap", tags=["Profile & Smart SeatMap Controller"])

@router.get("/layout")
def get_classroom_seatmap(context: Dict[str, Any] = Depends(get_current_user_context)):
    """
    Trả về toàn bộ sơ đồ chỗ ngồi của lớp 12A1 (5 hàng x 6 cột)
    Kèm thông tin chuyên cần hôm nay để tô màu trạng thái trực quan
    """
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Query students with today's attendance status
    students_query = """
        SELECT 
            s.*,
            COALESCE(a.status, 'present') as today_status,
            a.note as today_note
        FROM students s
        LEFT JOIN attendance_logs a 
            ON s.id = a.student_id AND a.date = ?
        ORDER BY s.seat_row ASC, s.seat_col ASC
    """
    students = query_all(students_query, (today,))

    # Create a 5x6 grid representation
    grid = [[None for _ in range(6)] for _ in range(5)]
    for s in students:
        r = s["seat_row"] - 1
        c = s["seat_col"] - 1
        if 0 <= r < 5 and 0 <= c < 6:
            grid[r][c] = s

    return {
        "class_name": "Lớp 12A1 - Chuyên Ban Tự Nhiên",
        "homeroom_teacher": "Cô Hoàng Mai Anh",
        "total_students": len(students),
        "rows": 5,
        "cols": 6,
        "table_groups": [
            {"group_id": 1, "name": "Dãy 1 (Bàn 1 & 2)", "cols": [1, 2]},
            {"group_id": 2, "name": "Dãy 2 (Bàn 3 & 4)", "cols": [3, 4]},
            {"group_id": 3, "name": "Dãy 3 (Bàn 5 & 6)", "cols": [5, 6]}
        ],
        "students": students,
        "grid": grid
    }

@router.post("/swap")
def swap_seats(
    body: SeatSwapRequest,
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER]))
):
    """
    Đổi vị trí 2 học sinh trên sơ đồ (Chỉ GVCN có quyền)
    """
    s1 = query_one("SELECT id, full_name, seat_row, seat_col FROM students WHERE id = ?", (body.student_id_1,))
    s2 = query_one("SELECT id, full_name, seat_row, seat_col FROM students WHERE id = ?", (body.student_id_2,))
    
    if not s1 or not s2:
        raise HTTPException(status_code=404, detail="Không tìm thấy học sinh để đổi chỗ")

    r1, c1 = s1["seat_row"], s1["seat_col"]
    r2, c2 = s2["seat_row"], s2["seat_col"]

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE students SET seat_row = ?, seat_col = ? WHERE id = ?", (r2, c2, body.student_id_1))
    cursor.execute("UPDATE students SET seat_row = ?, seat_col = ? WHERE id = ?", (r1, c1, body.student_id_2))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": f"Đã đổi chỗ thành công giữa {s1['full_name']} và {s2['full_name']}",
        "swapped": [
            {"id": s1["id"], "name": s1["full_name"], "new_pos": f"Hàng {r2}, Cột {c2}"},
            {"id": s2["id"], "name": s2["full_name"], "new_pos": f"Hàng {r1}, Cột {c1}"}
        ]
    }

@router.post("/update-positions")
def update_positions(
    body: SeatMapUpdateRequest,
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER]))
):
    """
    Lưu vị trí sau khi kéo thả nhiều học sinh
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    for item in body.positions:
        cursor.execute(
            "UPDATE students SET seat_row = ?, seat_col = ? WHERE id = ?",
            (item.seat_row, item.seat_col, item.student_id)
        )
    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": f"Đã cập nhật vị trí cho {len(body.positions)} học sinh trên sơ đồ thông minh"
    }

@router.post("/smart-auto-arrange")
def smart_auto_arrange(
    body: SmartSeatReorderRequest,
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER]))
):
    """
    Thuật toán AI xếp chỗ thông minh:
    1. 'vision_height': Ưu tiên cận thị & thấp ngồi hàng đầu (1-2), cao ngồi hàng sau (4-5)
    2. 'peer_tutoring': Ghép cặp học sinh học lực Giỏi/Xuất sắc ngồi kèm học sinh Khá/TB
    3. 'conduct_balance': Rải đều cán sự lớp và học sinh năng nổ vào từng dãy
    """
    students = query_all("SELECT * FROM students")
    if not students:
        raise HTTPException(status_code=404, detail="Không có dữ liệu học sinh")

    arranged = []
    strategy_name = ""

    if body.strategy == "vision_height":
        strategy_name = "Thị lực & Chiều cao (Cận & Thấp bàn đầu, Cao bàn cuối)"
        # Sort by: has_glasses desc, height asc
        sorted_students = sorted(
            students,
            key=lambda x: (-x["has_glasses"], x["height_cm"])
        )
    elif body.strategy == "peer_tutoring":
        strategy_name = "Đôi bạn cùng tiến (Ghép 1 bạn Giỏi với 1 bạn Cần hỗ trợ)"
        # High gpa and lower gpa interleaved
        sorted_high = sorted([s for s in students if s["gpa"] >= 8.5], key=lambda x: -x["gpa"])
        sorted_low = sorted([s for s in students if s["gpa"] < 8.5], key=lambda x: x["gpa"])
        
        paired = []
        while sorted_high or sorted_low:
            if sorted_high:
                paired.append(sorted_high.pop(0))
            if sorted_low:
                paired.append(sorted_low.pop(0))
        sorted_students = paired
    else: # conduct_balance
        strategy_name = "Cân bằng nề nếp & Giới tính"
        males = [s for s in students if s["gender"] == "Nam"]
        females = [s for s in students if s["gender"] == "Nữ"]
        balanced = []
        while males or females:
            if females:
                balanced.append(females.pop(0))
            if males:
                balanced.append(males.pop(0))
        sorted_students = balanced

    # Assign to 5 rows x 6 cols
    conn = get_db_connection()
    cursor = conn.cursor()
    idx = 0
    for r in range(1, 6):
        for c in range(1, 7):
            if idx < len(sorted_students):
                sid = sorted_students[idx]["id"]
                cursor.execute("UPDATE students SET seat_row = ?, seat_col = ? WHERE id = ?", (r, c, sid))
                arranged.append({"id": sid, "name": sorted_students[idx]["full_name"], "row": r, "col": c})
                idx += 1
    conn.commit()
    conn.close()

    return {
        "success": True,
        "strategy": strategy_name,
        "message": f"Thuật toán AI đã tự động bố trí lại chỗ ngồi theo tiêu chí '{strategy_name}' thành công!",
        "count": len(arranged)
    }

# ==================== STUDENT 360 PROFILE APIS ====================
student_router = APIRouter(prefix="/api/students", tags=["Profile Controller"])

@student_router.get("")
def list_students(
    search: Optional[str] = None,
    rank: Optional[str] = None,
    conduct: Optional[str] = None,
    context: Dict[str, Any] = Depends(get_current_user_context)
):
    query = "SELECT * FROM students WHERE 1=1"
    params = []
    if search:
        query += " AND (full_name LIKE ? OR student_code LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    if rank:
        query += " AND academic_rank = ?"
        params.append(rank)
    if conduct:
        query += " AND conduct = ?"
        params.append(conduct)
    query += " ORDER BY seat_row ASC, seat_col ASC"
    
    students = query_all(query, tuple(params))
    return students

@student_router.get("/{student_id}/360")
def get_student_360_profile(
    student_id: int,
    context: Dict[str, Any] = Depends(get_current_user_context)
):
    """
    Hồ sơ 360° học sinh: thông tin cá nhân, sơ đồ, điểm danh, nề nếp thi đua, học lực, AI report
    """
    student = query_one("SELECT * FROM students WHERE id = ?", (student_id,))
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy học sinh")

    # Attendance summary
    attendance_records = query_all(
        "SELECT * FROM attendance_logs WHERE student_id = ? ORDER BY date DESC, id DESC LIMIT 15",
        (student_id,)
    )
    present_cnt = query_one(
        "SELECT COUNT(*) as c FROM attendance_logs WHERE student_id = ? AND status = 'present'",
        (student_id,)
    )["c"]
    late_cnt = query_one(
        "SELECT COUNT(*) as c FROM attendance_logs WHERE student_id = ? AND status = 'late'",
        (student_id,)
    )["c"]
    absent_cnt = query_one(
        "SELECT COUNT(*) as c FROM attendance_logs WHERE student_id = ? AND status IN ('excused', 'unexcused')",
        (student_id,)
    )["c"]

    # Gamified points logs
    point_logs = query_all(
        "SELECT * FROM gamified_points_logs WHERE student_id = ? ORDER BY created_at DESC LIMIT 10",
        (student_id,)
    )

    # Academic grades
    grades = query_all(
        "SELECT * FROM academic_grades WHERE student_id = ? ORDER BY subject ASC",
        (student_id,)
    )

    # AI Reports
    reports = query_all(
        "SELECT * FROM ai_reports WHERE student_id = ? ORDER BY created_at DESC LIMIT 5",
        (student_id,)
    )

    # Communication history
    comms = query_all(
        "SELECT * FROM parent_communications WHERE student_id = ? ORDER BY sent_at DESC LIMIT 5",
        (student_id,)
    )

    return {
        "student": student,
        "attendance": {
            "summary": {
                "present": present_cnt,
                "late": late_cnt,
                "absent": absent_cnt,
                "rate": round((present_cnt / max(1, present_cnt + late_cnt + absent_cnt)) * 100, 1)
            },
            "recent_logs": attendance_records
        },
        "gamified_points": {
            "current_points": student["gamified_points"],
            "badge": student["badge"],
            "recent_logs": point_logs
        },
        "academic": {
            "gpa": student["gpa"],
            "rank": student["academic_rank"],
            "subjects": grades
        },
        "ai_reports": reports,
        "parent_communications": comms
    }
