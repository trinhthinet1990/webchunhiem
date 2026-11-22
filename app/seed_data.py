"""
Seed Data & System Bootstrapper
Không tạo bất kỳ dữ liệu mô phỏng (mock data) nào.
Chỉ đảm bảo tài khoản SuperAdmin tồn tại để quản trị hệ thống.
"""
from app.database import get_db_connection, init_db, query_one
from app.controllers.auth_controller import hash_password

def seed_database(force: bool = False):
    """
    Khởi tạo cấu trúc bảng CSDL và bảo đảm tài khoản SuperAdmin mặc định tồn tại.
    Toàn bộ dữ liệu lớp học (học sinh, điểm danh, nề nếp, điểm số) sẽ do người dùng thực đăng ký.
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    if force:
        cursor.execute("DELETE FROM attendance_logs")
        cursor.execute("DELETE FROM gamified_points_logs")
        cursor.execute("DELETE FROM academic_grades")
        cursor.execute("DELETE FROM ai_reports")
        cursor.execute("DELETE FROM parent_communications")
        cursor.execute("DELETE FROM absence_requests")
        cursor.execute("DELETE FROM students")
        cursor.execute("DELETE FROM users WHERE username != 'admin'")

    # Đảm bảo tài khoản admin luôn tồn tại
    admin = query_one("SELECT id FROM users WHERE username = 'admin'")
    if not admin:
        pwd_hash = hash_password("123456")
        cursor.execute("""
            INSERT INTO users (username, email, duty, password_hash, full_name, role, student_id, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "admin",
            "admin@homeroom360.edu.vn",
            "Quản Trị Viên Hệ Thống",
            pwd_hash,
            "Admin Quản Trị Hệ Thống",
            "admin",
            None,
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        ))
        conn.commit()

    conn.commit()
    conn.close()

if __name__ == "__main__":
    seed_database(force=True)
    print("Database bootstrap verified (Clean state - no mock data).")
