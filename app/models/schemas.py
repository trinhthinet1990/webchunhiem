from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SeatPosition(BaseModel):
    student_id: int
    seat_row: int
    seat_col: int

class SeatMapUpdateRequest(BaseModel):
    positions: List[SeatPosition]

class SeatSwapRequest(BaseModel):
    student_id_1: int
    student_id_2: int

class SmartSeatReorderRequest(BaseModel):
    strategy: str = Field(default="vision_height", description="Options: 'vision_height', 'peer_tutoring', 'balanced_gender'")

class AttendanceItem(BaseModel):
    student_id: int
    status: str # 'present', 'late', 'excused', 'unexcused'
    note: Optional[str] = ""

class AttendanceBatchUpdateRequest(BaseModel):
    date: str
    session: str = "Sáng"
    items: List[AttendanceItem]

class GamifiedPointRequest(BaseModel):
    student_id: int
    points: int
    reason: str
    category: str = "nề nếp"

class AIReportRequest(BaseModel):
    student_id: int
    term: str = "Học kỳ 1 - 2026"
    tone: str = "constructive" # 'constructive', 'motivational', 'strict', 'praise'
    extra_notes: Optional[str] = ""

class ParentCommunicationRequest(BaseModel):
    student_id: int
    channel: str = "Zalo Oa" # 'Zalo Oa', 'SMS Gateway', 'Email', 'Cổng Phụ Huynh'
    subject: str
    message: str
    trigger_type: str = "Thủ công"

class AbsenceRequestCreate(BaseModel):
    student_id: int
    parent_name: str
    from_date: str
    to_date: str
    reason: str

class AbsenceRequestReview(BaseModel):
    request_id: int
    status: str # 'approved', 'rejected'
    teacher_reply: str

class SwitchRoleRequest(BaseModel):
    role: str # 'teacher', 'monitor', 'parent_student'
    student_id: Optional[int] = None

class UserRegisterRequest(BaseModel):
    email: str = Field(..., description="Email đăng nhập của người dùng")
    username: Optional[str] = Field(default=None, description="Tên đăng nhập (nếu để trống sẽ dùng email)")
    password: str = Field(..., min_length=6, description="Mật khẩu (ít nhất 6 ký tự)")
    full_name: str = Field(..., min_length=2, description="Họ và tên người dùng")
    role: str = Field(default="parent_student", description="Vai trò: teacher, monitor, parent_student, student")
    duty: Optional[str] = Field(default=None, description="Nhiệm vụ cụ thể của cán bộ lớp (Lớp trưởng, Lớp phó học tập, Lớp phó nề nếp...)")
    student_id: Optional[int] = Field(default=None, description="ID học sinh liên kết 1-1 (CHỈ BẮT BUỘC KHI LÀ PHỤ HUYNH)")
    avatar: Optional[str] = Field(default=None, description="URL ảnh đại diện")

class UserLoginRequest(BaseModel):
    username: str = Field(..., description="Email hoặc Tên đăng nhập")
    password: str = Field(..., description="Mật khẩu")

# ==============================================================
# Admin Portal Management Schemas
# ==============================================================

class AdminUserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3)
    email: Optional[str] = None
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: str = "teacher"
    duty: Optional[str] = None
    student_id: Optional[int] = None
    avatar: Optional[str] = None

class AdminUserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    duty: Optional[str] = None
    student_id: Optional[int] = None
    avatar: Optional[str] = None

class AdminPasswordResetRequest(BaseModel):
    new_password: str = Field(..., min_length=6)

class AdminStudentCreateRequest(BaseModel):
    student_code: str
    full_name: str
    gender: str = "Nam"
    dob: Optional[str] = "2008-01-01"
    height_cm: Optional[int] = 165
    has_glasses: Optional[int] = 0
    seat_row: Optional[int] = 1
    seat_col: Optional[int] = 1
    conduct: Optional[str] = "Tốt"
    academic_rank: Optional[str] = "Giỏi"
    gpa: Optional[float] = 8.0
    gamified_points: Optional[int] = 100
    badge: Optional[str] = "Học Sinh Tiêu Biểu"
    parent_name: Optional[str] = ""
    parent_phone: Optional[str] = ""
    parent_email: Optional[str] = ""
    avatar: Optional[str] = ""
    health_notes: Optional[str] = ""
    teacher_notes: Optional[str] = ""

class AdminStudentUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    height_cm: Optional[int] = None
    has_glasses: Optional[int] = None
    seat_row: Optional[int] = None
    seat_col: Optional[int] = None
    conduct: Optional[str] = None
    academic_rank: Optional[str] = None
    gpa: Optional[float] = None
    gamified_points: Optional[int] = None
    badge: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    avatar: Optional[str] = None
    health_notes: Optional[str] = None
    teacher_notes: Optional[str] = None

class AdminAttendanceLogUpdateRequest(BaseModel):
    status: str
    note: Optional[str] = ""

class AdminGradeUpdateRequest(BaseModel):
    tx1: Optional[float] = None
    tx2: Optional[float] = None
    gk: Optional[float] = None
    ck: Optional[float] = None

class AdminAIReportUpdateRequest(BaseModel):
    tone: Optional[str] = None
    generated_text: Optional[str] = None
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    action_plan: Optional[str] = None
    approved_by_teacher: Optional[int] = None
