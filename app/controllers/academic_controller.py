from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
from app.database import query_all, query_one, get_db_connection
from app.middleware.rbac_guard import require_roles, get_current_user_context
from app.config import ROLE_TEACHER, ROLE_MONITOR, ROLE_PARENT_STUDENT
from app.models.schemas import AdminGradeUpdateRequest

router = APIRouter(prefix="/api/academic", tags=["Academic & Conduct Controller"])

@router.get("/overview")
def get_academic_overview(context: Dict[str, Any] = Depends(get_current_user_context)):
    """
    Thống kê tổng quan học lực và hạnh kiểm của lớp 11A5
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

@router.get("/all-grades")
def get_all_grades(context: Dict[str, Any] = Depends(get_current_user_context)):
    """
    Trả về toàn bộ danh sách điểm số theo từng môn của tất cả học sinh
    """
    students = query_all("SELECT id, student_code, full_name, seat_row, seat_col, gpa, academic_rank FROM students ORDER BY seat_row, seat_col")
    all_grades = query_all("SELECT * FROM academic_grades ORDER BY student_id, subject")

    grades_by_student = {}
    for g in all_grades:
        sid = g["student_id"]
        if sid not in grades_by_student:
            grades_by_student[sid] = []
        grades_by_student[sid].append(g)

    result = []
    for s in students:
        s_copy = dict(s)
        s_copy["subjects"] = grades_by_student.get(s["id"], [])
        result.append(s_copy)

    return result

@router.put("/grades/{grade_id}")
def update_grade(
    grade_id: int,
    body: AdminGradeUpdateRequest,
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER, ROLE_MONITOR]))
):
    """
    Sửa / Cập nhật điểm học tập (Dành cho Giáo viên và Ban Cán Sự Lớp: Lớp Trưởng, Lớp Phó Học Tập)
    Tự động tính lại điểm trung bình môn, GPA chung và Xếp loại học lực của học sinh
    """
    grade = query_one("SELECT * FROM academic_grades WHERE id = ?", (grade_id,))
    if not grade:
        raise HTTPException(status_code=404, detail="Không tìm thấy điểm môn học")

    tx1 = body.tx1 if body.tx1 is not None else grade["tx1"]
    tx2 = body.tx2 if body.tx2 is not None else grade["tx2"]
    gk = body.gk if body.gk is not None else grade["gk"]
    ck = body.ck if body.ck is not None else grade["ck"]

    # Công thức tính trung bình môn: (tx1 + tx2 + gk*2 + ck*3) / 7.0
    scores = []
    weights = []
    if tx1 is not None:
        scores.append(tx1 * 1.0)
        weights.append(1.0)
    if tx2 is not None:
        scores.append(tx2 * 1.0)
        weights.append(1.0)
    if gk is not None:
        scores.append(gk * 2.0)
        weights.append(2.0)
    if ck is not None:
        scores.append(ck * 3.0)
        weights.append(3.0)

    if weights:
        subject_avg = round(sum(scores) / sum(weights), 1)
    else:
        subject_avg = 8.0

    warning_flag = 1 if subject_avg < 6.5 else 0
    old_avg = grade.get("average") or 8.0
    trend = "down" if subject_avg < old_avg else ("up" if subject_avg > old_avg else "stable")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE academic_grades 
        SET tx1 = ?, tx2 = ?, gk = ?, ck = ?, average = ?, trend = ?, warning_flag = ?
        WHERE id = ?
    """, (tx1, tx2, gk, ck, subject_avg, trend, warning_flag, grade_id))

    # Tự động tính toán lại GPA và Xếp loại học lực của học sinh
    student_id = grade["student_id"]
    cursor.execute("SELECT average FROM academic_grades WHERE student_id = ? AND average IS NOT NULL", (student_id,))
    all_avgs = [row[0] for row in cursor.fetchall() if row[0] is not None]
    if all_avgs:
        new_gpa = round(sum(all_avgs) / len(all_avgs), 2)
        if new_gpa >= 9.0:
            new_rank = "Xuất sắc"
        elif new_gpa >= 8.0:
            new_rank = "Giỏi"
        elif new_gpa >= 6.5:
            new_rank = "Khá"
        elif new_gpa >= 5.0:
            new_rank = "Trung bình"
        else:
            new_rank = "Yếu"
        cursor.execute("UPDATE students SET gpa = ?, academic_rank = ? WHERE id = ?", (new_gpa, new_rank, student_id))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": f"Đã cập nhật điểm môn {grade['subject']} thành công (ĐTB môn: {subject_avg})",
        "average": subject_avg,
        "warning_flag": warning_flag,
        "grade_id": grade_id
    }

@router.delete("/grades/{grade_id}")
def delete_grade(
    grade_id: int,
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER, ROLE_MONITOR]))
):
    """
    Xóa điểm môn học (Dành cho Giáo viên và Ban Cán Sự Lớp / Mod)
    """
    grade = query_one("SELECT * FROM academic_grades WHERE id = ?", (grade_id,))
    if not grade:
        raise HTTPException(status_code=404, detail="Không tìm thấy điểm môn học")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM academic_grades WHERE id = ?", (grade_id,))
    conn.commit()
    conn.close()

    return {"success": True, "message": "Đã xóa điểm môn học thành công", "id": grade_id}
