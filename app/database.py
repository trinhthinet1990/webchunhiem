import sqlite3
from typing import Any, Dict, List, Optional
from app.config import DB_PATH

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users table (for RBAC Auth Guard)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL, -- 'teacher', 'monitor', 'parent_student'
        student_id INTEGER,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Students table (Profile & Smart SeatMap Controller)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_code TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        gender TEXT NOT NULL,
        dob TEXT,
        height_cm INTEGER DEFAULT 160,
        has_glasses INTEGER DEFAULT 0, -- 1 if wears glasses / nearsighted
        seat_row INTEGER DEFAULT 1,
        seat_col INTEGER DEFAULT 1,
        conduct TEXT DEFAULT 'Tốt',
        academic_rank TEXT DEFAULT 'Giỏi',
        gpa REAL DEFAULT 8.0,
        gamified_points INTEGER DEFAULT 100,
        badge TEXT DEFAULT 'Học Sinh Tiêu Biểu',
        parent_name TEXT,
        parent_phone TEXT,
        parent_email TEXT,
        avatar TEXT,
        health_notes TEXT,
        teacher_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 3. Attendance Logs (Attendance & Gamified Point Controller)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        session TEXT NOT NULL, -- 'Sáng', 'Chiều'
        status TEXT NOT NULL, -- 'present', 'late', 'excused', 'unexcused'
        note TEXT,
        recorded_by TEXT DEFAULT 'teacher',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )
    """)

    # 4. Gamified Points Logs (Attendance & Gamified Point Controller)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gamified_points_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        points INTEGER NOT NULL, -- positive or negative
        reason TEXT NOT NULL,
        category TEXT DEFAULT 'nề nếp', -- 'học tập', 'nề nếp', 'phát biểu', 'hoạt động'
        recorded_by TEXT DEFAULT 'monitor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )
    """)

    # 5. Academic Grades (Academic & Conduct Controller)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS academic_grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        tx1 REAL,
        tx2 REAL,
        gk REAL,
        ck REAL,
        average REAL,
        trend TEXT DEFAULT 'stable', -- 'up', 'stable', 'down'
        warning_flag INTEGER DEFAULT 0, -- 1 if drops significantly
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )
    """)

    # 6. AI Reports (AI Report Writer Engine)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        term TEXT NOT NULL,
        tone TEXT DEFAULT 'constructive',
        generated_text TEXT NOT NULL,
        strengths TEXT,
        areas_for_improvement TEXT,
        action_plan TEXT,
        approved_by_teacher INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )
    """)

    # 7. Parent Communications Logs (Parent Communication Worker)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS parent_communications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        channel TEXT NOT NULL, -- 'Zalo Oa', 'SMS Gateway', 'Email', 'Cổng Phụ Huynh'
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'Đã gửi',
        trigger_type TEXT DEFAULT 'Hệ thống',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )
    """)

    # 8. Absence Requests (Cổng Phụ huynh gửi xin nghỉ phép)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS absence_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        parent_name TEXT NOT NULL,
        from_date TEXT NOT NULL,
        to_date TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
        teacher_reply TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
    )
    """)

    conn.commit()
    conn.close()

def query_all(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def query_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def execute_commit(query: str, params: tuple = ()) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    last_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return last_id
