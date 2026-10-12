from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
from app.database import query_all, query_one, get_db_connection
from app.middleware.rbac_guard import require_roles, get_current_user_context
from app.config import ROLE_TEACHER, ROLE_MONITOR, ROLE_PARENT_STUDENT

router = APIRouter(prefix="/api/academic", tags=["Academic & Conduct Controller"])

@router.get("/overview")
def get_academic_overview(context: Dict[str, Any] = Depends(get_current_user_context)):
    """
    Thống kê tổng quan học lực và hạnh kiểm của lớp 12A1
    """
    students = query_all("SELECT * FROM students")
    total = len(students)

    # GPA distribution
    rank_counts = {"Xuất sắc": 0, "Giỏi": 0, "Khá": 0, "Trung bình": 0}
    conduct_counts = {"Tốt": 0, "Khá": 0, "Trung bình": 0}
    gpa_sum = 0.0

    for s in students:
        r = s["academic_rank"]
        c = s["conduct"]
        rank_counts[r] = rank_counts.get(r, 0) + 1
        conduct_counts[c] = conduct_counts.get(c, 0) + 1
        gpa_sum += s["gpa"]

    class_avg_gpa = round(gpa_sum / max(1, total), 2)

    # Count warnings
    warning_students = query_all("""
        SELECT DISTINCT s.id, s.student_code, s.full_name, s.avatar, s.gpa, s.academic_rank, s.parent_phone
        FROM students s
        JOIN academic_grades g ON s.id = g.student_id
        WHERE g.warning_flag = 1 OR s.gpa < 7.0
    """)

    return {
        "total_students": total,
        "class_avg_gpa": class_avg_gpa,
        "rank_distribution": rank_counts,
        "conduct_distribution": conduct_counts,
        "at_risk_count": len(warning_students),
        "warning_students": warning_students
    }

@router.get("/drop-warnings")
def get_drop_warnings(context: Dict[str, Any] = Depends(get_current_user_context)):
    """
    Cảnh báo học tập sút giảm: phân tích các môn có xu hướng tụt dốc, điểm dưới 6.5
    """
    warning_records = query_all("""
        SELECT 
            s.id as student_id,
            s.student_code,
            s.full_name,
            s.avatar,
            s.seat_row,
            s.seat_col,
            s.parent_name,
            s.parent_phone,
            g.subject,
            g.tx1,
            g.tx2,
            g.gk,
            g.ck,
            g.average,
            g.trend
        FROM academic_grades g
        JOIN students s ON g.student_id = s.id
        WHERE g.warning_flag = 1 OR g.trend = 'down' OR g.average < 6.5
        ORDER BY g.average ASC
    """)

    return {
        "count": len(warning_records),
        "warnings": warning_records
    }

@router.get("/student/{student_id}")
def get_student_academic(
    student_id: int,
    context: Dict[str, Any] = Depends(get_current_user_context)
):
    student = query_one("SELECT * FROM students WHERE id = ?", (student_id,))
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy học sinh")

    grades = query_all("SELECT * FROM academic_grades WHERE student_id = ? ORDER BY subject ASC", (student_id,))

    return {
        "student_id": student_id,
        "student_name": student["full_name"],
        "gpa": student["gpa"],
        "academic_rank": student["academic_rank"],
        "conduct": student["conduct"],
        "grades": grades
    }
