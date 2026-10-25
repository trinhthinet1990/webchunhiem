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
    username: str = Field(..., min_length=3, max_length=50, description="Tên đăng nhập (ít nhất 3 ký tự)")
    password: str = Field(..., min_length=6, description="Mật khẩu (ít nhất 6 ký tự)")
    full_name: str = Field(..., min_length=2, description="Họ và tên")
    role: str = Field(default="parent_student", description="Vai trò: teacher, monitor, parent_student")
    student_id: Optional[int] = Field(default=None, description="ID học sinh liên kết (cho cán sự / phụ huynh)")
    avatar: Optional[str] = Field(default=None, description="URL ảnh đại diện")

class UserLoginRequest(BaseModel):
    username: str = Field(..., description="Tên đăng nhập")
    password: str = Field(..., description="Mật khẩu")
