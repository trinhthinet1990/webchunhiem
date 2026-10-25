import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env
load_dotenv(BASE_DIR / ".env")

DB_PATH = BASE_DIR / "homeroom.db"
STATIC_DIR = BASE_DIR / "static"

APP_TITLE = "Hệ Thống Quản Lý Lớp Chủ Nhiệm Thông Minh (Homeroom 360°)"
APP_VERSION = "2.5.0"
APP_DESCRIPTION = "Nền tảng quản trị lớp học thông minh theo sơ đồ kiến trúc AI Architecture Studio"

# ==============================================================
# Supabase & PostgreSQL Configuration
# ==============================================================
# 1. Direct connection string (URI):
#    Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
#    Hoặc direct: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
DATABASE_URL = os.getenv("DATABASE_URL", os.getenv("SUPABASE_DB_URL", "")).strip()

# 2. Individual connection params (nếu không dùng URI):
SUPABASE_DB_HOST = os.getenv("SUPABASE_DB_HOST", "").strip()
SUPABASE_DB_PORT = os.getenv("SUPABASE_DB_PORT", "5432").strip()
SUPABASE_DB_NAME = os.getenv("SUPABASE_DB_NAME", "postgres").strip()
SUPABASE_DB_USER = os.getenv("SUPABASE_DB_USER", "postgres").strip()
SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD", "").strip()

# 3. Supabase REST API & SDK (tùy chọn):
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", os.getenv("SUPABASE_ANON_KEY", "")).strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

# Tự động xác định chế độ database: PostgreSQL (Supabase) hay SQLite (cục bộ)
USE_POSTGRES = bool(DATABASE_URL or SUPABASE_DB_HOST)

# ==============================================================
# RBAC Roles & Class Officer Duties
# ==============================================================
ROLE_TEACHER = "teacher"
ROLE_MONITOR = "monitor"
ROLE_PARENT_STUDENT = "parent_student"
ROLE_STUDENT = "student"

ROLES_MAP = {
    ROLE_TEACHER: "Giáo Viên Chủ Nhiệm (Toàn quyền quản lý)",
    ROLE_MONITOR: "Ban Cán Sự Lớp (Quản lý nề nếp & thi đua)",
    ROLE_PARENT_STUDENT: "Phụ Huynh Học Sinh (Tra cứu & Tương tác)",
    ROLE_STUDENT: "Học Sinh (Tra cứu điểm & rèn luyện)"
}

# Các chức danh và nhiệm vụ cụ thể của Ban cán sự lớp (tách riêng từng nhiệm vụ)
CLASS_DUTIES = [
    {
        "id": "leader",
        "title": "Lớp trưởng",
        "description": "Quản lý chung toàn lớp, điều hành sinh hoạt, tổng hợp thi đua",
        "icon": "fa-crown",
        "color": "amber"
    },
    {
        "id": "academic",
        "title": "Lớp phó Học tập",
        "description": "Theo dõi học tập, kiểm tra bài đầu giờ, hỗ trợ đôi bạn cùng tiến",
        "icon": "fa-book-open",
        "color": "sky"
    },
    {
        "id": "discipline",
        "title": "Lớp phó Nề nếp & Kỷ luật",
        "description": "Chấm điểm thi đua nề nếp, kiểm tra đồng phục, giờ giấc ra vào lớp",
        "icon": "fa-scale-balanced",
        "color": "rose"
    },
    {
        "id": "activities",
        "title": "Lớp phó Phong trào (Văn - Thể - Mỹ)",
        "description": "Tổ chức hoạt động văn nghệ, thể thao, báo tường, phong trào Đoàn",
        "icon": "fa-palette",
        "color": "pink"
    },
    {
        "id": "labor",
        "title": "Lớp phó Lao động & CSVC",
        "description": "Phân công trực nhật, bảo quản bàn ghế, máy chiếu và vệ sinh lớp",
        "icon": "fa-broom",
        "color": "teal"
    },
    {
        "id": "treasurer",
        "title": "Thủ quỹ lớp",
        "description": "Quản lý thu chi quỹ lớp, chuẩn bị phần thưởng thi đua nề nếp",
        "icon": "fa-coins",
        "color": "emerald"
    },
    {
        "id": "group_1",
        "title": "Tổ trưởng Tổ 1",
        "description": "Quản lý nề nếp, điểm danh và học tập của các thành viên Tổ 1 (Bàn 1-2)",
        "icon": "fa-users",
        "color": "indigo"
    },
    {
        "id": "group_2",
        "title": "Tổ trưởng Tổ 2",
        "description": "Quản lý nề nếp, điểm danh và học tập của các thành viên Tổ 2 (Bàn 3-4)",
        "icon": "fa-users",
        "color": "indigo"
    },
    {
        "id": "group_3",
        "title": "Tổ trưởng Tổ 3",
        "description": "Quản lý nề nếp, điểm danh và học tập của các thành viên Tổ 3 (Bàn 5-6)",
        "icon": "fa-users",
        "color": "indigo"
    },
    {
        "id": "group_4",
        "title": "Tổ trưởng Tổ 4",
        "description": "Quản lý nề nếp, điểm danh và học tập của các thành viên Tổ 4",
        "icon": "fa-users",
        "color": "indigo"
    }
]
