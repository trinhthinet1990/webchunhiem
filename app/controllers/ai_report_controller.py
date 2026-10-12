from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List, Optional
import os
import json
from app.database import query_all, query_one, get_db_connection
from app.middleware.rbac_guard import require_roles, get_current_user_context
from app.config import ROLE_TEACHER, ROLE_MONITOR, ROLE_PARENT_STUDENT
from app.models.schemas import AIReportRequest

router = APIRouter(prefix="/api/ai-report", tags=["AI Report Writer Engine"])

def generate_pedagogical_report(student: Dict[str, Any], grades: List[Dict[str, Any]], points: int, attendance_stats: Dict[str, Any], tone: str, extra_notes: str = "") -> Dict[str, str]:
    """
    Hệ thống phân tích đa chiều dữ liệu (Học lực + Chuyên cần + Thi đua nề nếp)
    Sinh nhận xét cá nhân hóa theo văn phong sư phạm chuẩn mực.
    """
    name = student["full_name"]
    gpa = student["gpa"]
    conduct = student["conduct"]
    rank = student["academic_rank"]
    badge = student["badge"]

    # Analyze strong and weak subjects
    strong_subjects = [g["subject"] for g in grades if g.get("average", 0) >= 8.5]
    weak_subjects = [g["subject"] for g in grades if g.get("average", 0) < 6.5]

    late_cnt = attendance_stats.get("late", 0)
    unexcused_cnt = attendance_stats.get("unexcused", 0)

    # Tone logic
    if tone == "praise" or (gpa >= 9.0 and conduct == "Tốt"):
        overview = f"Em {name} là một trong những gương mặt tiêu biểu và xuất sắc nhất của tập thể lớp 12A1. Với tinh thần tự giác cao độ và tư duy học tập vượt trội, em đạt điểm trung bình chung {gpa} (Xếp loại {rank}). Nề nếp tác phong luôn mẫu mực, tích cực lan tỏa năng lượng tích cực cho bạn bè."
        strengths = f"Tư duy xuất sắc ở các môn {', '.join(strong_subjects) if strong_subjects else 'tự nhiên và xã hội'}; đạt danh hiệu '{badge}' với {points} điểm thi đua rèn luyện."
        areas = "Tiếp tục giữ vững phong độ ổn định, bồi dưỡng thêm kỹ năng mềm và mở rộng giao lưu học thuật cấp cao."
        action_plan = "Tập trung ôn luyện chuyên sâu cho kỳ thi Đánh giá năng lực và các kỳ thi Học sinh giỏi các cấp."

    elif tone == "strict" or gpa < 6.5 or unexcused_cnt > 0:
        overview = f"Trong thời gian qua, sự tiến bộ của em {name} còn chưa đạt kỳ vọng của thầy cô. Điểm trung bình {gpa} cho thấy kiến thức cơ bản còn nhiều lỗ hổng, đặc biệt cần chấn chỉnh ngay ý thức chuyên cần ({f'đã đi muộn {late_cnt} lần' if late_cnt > 0 else 'cần cải thiện sự tập trung'})."
        strengths = "Có khả năng tiếp thu bài nhanh khi thực sự tập trung; hòa đồng với bạn bè."
        areas = f"Còn xao nhãng trong giờ học, bài tập về nhà môn {', '.join(weak_subjects) if weak_subjects else 'chính'} chưa được đầu tư đúng mức."
        action_plan = f"GVCN chỉ định học sinh kèm cặp tại chỗ ngồi; gia đình kiểm tra việc tự học mỗi tối và ký sổ liên lạc định kỳ."

    elif tone == "motivational":
        overview = f"Em {name} có nhiều tiềm năng và tố chất rất đáng khen ngợi. Điểm trung bình hiện tại {gpa} phản ánh sự nỗ lực không ngừng nghỉ. Thầy cô tin rằng nếu em tự tin hơn và kiên trì với mục tiêu, em hoàn toàn có thể bứt phá mạnh mẽ trong kỳ tới."
        strengths = f"Thái độ lễ phép, tinh thần cầu thị; có thế mạnh ở môn {strong_subjects[0] if strong_subjects else 'học tập'} và tích cực tham gia phong trào lớp."
        areas = f"Cần phân bổ thời gian học tập khoa học hơn, tự tin giơ tay phát biểu đóng góp ý kiến xây dựng bài."
        action_plan = "Đặt mục tiêu nâng điểm trung bình lên trên 8.5; chủ động trao đổi với giáo viên bộ môn khi gặp bài toán khó."

    else: # constructive (default)
        overview = f"Em {name} có thái độ học tập nghiêm túc, chấp hành tốt nội quy nhà trường và nề nếp lớp (Hạnh kiểm: {conduct}). Kết quả học tập đạt mức {rank} với GPA {gpa}. Em luôn hoàn thành tốt các nhiệm vụ được giao."
        strengths = f"Học tập đồng đều, ý thức kỷ luật tốt; đạt {points} điểm rèn luyện ({badge})."
        areas = f"Cần rèn luyện thêm kỹ năng làm bài thi trắc nghiệm và đào sâu kiến thức môn {weak_subjects[0] if weak_subjects else 'chưa đạt điểm tuyệt đối'}."
        action_plan = "Lập kế hoạch ôn tập theo tuần; phối hợp cùng bạn cùng bàn trong sơ đồ lớp để cùng tiến bộ."

    if extra_notes:
        overview += f" (Ghi chú bổ sung từ GVCN: {extra_notes})"

    return {
        "generated_text": overview,
        "strengths": strengths,
        "areas_for_improvement": areas,
        "action_plan": action_plan
    }

@router.post("/generate")
def generate_ai_report(
    body: AIReportRequest,
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER]))
):
    """
    Sinh nhận xét học sinh tự động bằng AI Report Writer Engine (Chỉ GVCN)
    """
    student = query_one("SELECT * FROM students WHERE id = ?", (body.student_id,))
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy học sinh")

    grades = query_all("SELECT * FROM academic_grades WHERE student_id = ?", (body.student_id,))
    
    # Attendance stats
    att_logs = query_all("SELECT status FROM attendance_logs WHERE student_id = ?", (body.student_id,))
    late_cnt = sum(1 for a in att_logs if a["status"] == "late")
    unexcused_cnt = sum(1 for a in att_logs if a["status"] == "unexcused")
    attendance_stats = {"late": late_cnt, "unexcused": unexcused_cnt}

    result = generate_pedagogical_report(
        student=student,
        grades=grades,
        points=student["gamified_points"],
        attendance_stats=attendance_stats,
        tone=body.tone,
        extra_notes=body.extra_notes or ""
    )

    # Save to ai_reports table
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO ai_reports (
            student_id, term, tone, generated_text, strengths, areas_for_improvement, action_plan, approved_by_teacher
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    """, (
        body.student_id, body.term, body.tone,
        result["generated_text"], result["strengths"], result["areas_for_improvement"], result["action_plan"]
    ))
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "success": True,
        "report_id": report_id,
        "student_id": body.student_id,
        "student_name": student["full_name"],
        "term": body.term,
        "tone": body.tone,
        **result
    }

@router.post("/batch-generate-all")
def batch_generate_all_reports(
    term: str = Query("Học kỳ 1 - 2026"),
    context: Dict[str, Any] = Depends(require_roles([ROLE_TEACHER]))
):
    """
    Tự động quét toàn bộ 30 học sinh và sinh báo cáo nhận xét AI hàng loạt
    """
    students = query_all("SELECT * FROM students")
    count = 0

    for s in students:
        sid = s["id"]
        grades = query_all("SELECT * FROM academic_grades WHERE student_id = ?", (sid,))
        att_logs = query_all("SELECT status FROM attendance_logs WHERE student_id = ?", (sid,))
        late_cnt = sum(1 for a in att_logs if a["status"] == "late")
        unexcused_cnt = sum(1 for a in att_logs if a["status"] == "unexcused")
        attendance_stats = {"late": late_cnt, "unexcused": unexcused_cnt}

        # Select tone based on performance
        if s["gpa"] >= 9.0:
            tone = "praise"
        elif s["gpa"] < 7.0 or late_cnt > 1:
            tone = "strict"
        elif s["gpa"] >= 8.0:
            tone = "constructive"
        else:
            tone = "motivational"

        result = generate_pedagogical_report(
            student=s,
            grades=grades,
            points=s["gamified_points"],
            attendance_stats=attendance_stats,
            tone=tone
        )

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO ai_reports (
                student_id, term, tone, generated_text, strengths, areas_for_improvement, action_plan, approved_by_teacher
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            sid, term, tone,
            result["generated_text"], result["strengths"], result["areas_for_improvement"], result["action_plan"]
        ))
        conn.commit()
        conn.close()
        count += 1

    return {
        "success": True,
        "message": f"AI Report Writer Engine đã hoàn thành tự động phân tích và tạo nhận xét cho toàn bộ {count} học sinh lớp 12A1.",
        "term": term,
        "generated_count": count
    }

@router.get("/student/{student_id}")
def get_student_reports(student_id: int, context: Dict[str, Any] = Depends(get_current_user_context)):
    reports = query_all("""
        SELECT * FROM ai_reports WHERE student_id = ? ORDER BY created_at DESC
    """, (student_id,))
    return reports
