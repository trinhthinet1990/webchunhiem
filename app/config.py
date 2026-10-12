import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "homeroom.db"
STATIC_DIR = BASE_DIR / "static"

APP_TITLE = "Hệ Thống Quản Lý Lớp Chủ Nhiệm Thông Minh (Homeroom 360°)"
APP_VERSION = "2.5.0"
APP_DESCRIPTION = "Nền tảng quản trị lớp học thông minh theo sơ đồ kiến trúc AI Architecture Studio"

# RBAC Roles
ROLE_TEACHER = "teacher"
ROLE_MONITOR = "monitor"
ROLE_PARENT_STUDENT = "parent_student"

ROLES_MAP = {
    ROLE_TEACHER: "Giáo Viên Chủ Nhiệm (Toàn quyền quản lý)",
    ROLE_MONITOR: "Cán sự lớp (Hỗ trợ điểm danh & nề nếp)",
    ROLE_PARENT_STUDENT: "Cổng Phụ Huynh & Học Sinh (Tra cứu & Tương tác)"
}
