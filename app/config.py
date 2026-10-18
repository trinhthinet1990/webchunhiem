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
# RBAC Roles
# ==============================================================
ROLE_TEACHER = "teacher"
ROLE_MONITOR = "monitor"
ROLE_PARENT_STUDENT = "parent_student"

ROLES_MAP = {
    ROLE_TEACHER: "Giáo Viên Chủ Nhiệm (Toàn quyền quản lý)",
    ROLE_MONITOR: "Cán sự lớp (Hỗ trợ điểm danh & nề nếp)",
    ROLE_PARENT_STUDENT: "Cổng Phụ Huynh & Học Sinh (Tra cứu & Tương tác)"
}
