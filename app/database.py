import os
import re
import sqlite3
import logging
from typing import Any, Dict, List, Optional
from app.config import (
    DB_PATH,
    USE_POSTGRES,
    DATABASE_URL,
    SUPABASE_DB_HOST,
    SUPABASE_DB_PORT,
    SUPABASE_DB_NAME,
    SUPABASE_DB_USER,
    SUPABASE_DB_PASSWORD
)

logger = logging.getLogger("homeroom.database")

# Kiểm tra thư viện psycopg2 cho PostgreSQL / Supabase
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False


def is_postgres_active() -> bool:
    """
    Kiểm tra xem hệ thống có đang sử dụng Supabase PostgreSQL không
    """
    return USE_POSTGRES and PSYCOPG2_AVAILABLE


def adapt_query(query: str) -> str:
    """
    Tự động chuẩn hóa câu lệnh SQL:
    - Khi dùng PostgreSQL: đổi '?' thành '%s', đổi date('now') thành CURRENT_DATE
    - Khi dùng SQLite: giữ nguyên '?'
    """
    if is_postgres_active():
        # Đổi tham số placeholder từ ? sang %s
        q = query.replace("?", "%s")
        # Đổi hàm lấy ngày hôm nay SQLite date('now') sang chuẩn ANSI PostgreSQL CURRENT_DATE
        q = re.sub(r"date\(\s*['\"]now['\"]\s*\)", "CURRENT_DATE", q, flags=re.I)
        return q
    return query


class PostgresCursorWrapper:
    """
    Cursor wrapper giúp tương thích 100% giữa sqlite3 và psycopg2:
    - Hỗ trợ tham số '?' tự động chuyển sang '%s'
    - Hỗ trợ cursor.lastrowid cho lệnh INSERT
    - Hỗ trợ trả về dict thay vì tuple
    """
    def __init__(self, cursor):
        self._cursor = cursor
        self.lastrowid = None

    def execute(self, query: str, params: tuple = ()):
        q = adapt_query(query)
        q_stripped = q.strip()
        is_insert = q_stripped.upper().startswith("INSERT INTO")

        # Với PostgreSQL, tự động gắn RETURNING id để lấy lastrowid nếu là lệnh INSERT
        if is_insert and "RETURNING" not in q_stripped.upper():
            q_with_ret = q_stripped.rstrip().rstrip(";") + " RETURNING id"
            try:
                self._cursor.execute(q_with_ret, params)
                res = self._cursor.fetchone()
                if res and "id" in res:
                    self.lastrowid = res["id"]
                return self
            except Exception:
                # Nếu bảng không có cột id hoặc RETURNING lỗi, rollback trong transaction và chạy câu lệnh gốc
                if hasattr(self._cursor, "connection") and self._cursor.connection:
                    try:
                        self._cursor.connection.rollback()
                    except Exception:
                        pass
                self._cursor.execute(q, params)
                return self

        self._cursor.execute(q, params)
        return self

    def executemany(self, query: str, seq_of_params):
        q = adapt_query(query)
        self._cursor.executemany(q, seq_of_params)
        return self

    def fetchone(self) -> Optional[Dict[str, Any]]:
        row = self._cursor.fetchone()
        return dict(row) if row is not None else None

    def fetchall(self) -> List[Dict[str, Any]]:
        rows = self._cursor.fetchall()
        return [dict(r) for r in rows] if rows else []

    def fetchmany(self, size: Optional[int] = None):
        rows = self._cursor.fetchmany(size) if size is not None else self._cursor.fetchmany()
        return [dict(r) for r in rows] if rows else []

    @property
    def rowcount(self):
        return self._cursor.rowcount

    def close(self):
        return self._cursor.close()

    def __iter__(self):
        for r in self._cursor:
            yield dict(r)

    def __getattr__(self, name):
        return getattr(self._cursor, name)


class PostgresConnectionWrapper:
    """
    Connection wrapper đồng nhất giữa sqlite3 và psycopg2
    """
    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return PostgresCursorWrapper(self._conn.cursor(cursor_factory=RealDictCursor))

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self._conn.rollback()
        else:
            self._conn.commit()
        self._conn.close()

    def __getattr__(self, name):
        return getattr(self._conn, name)


def get_db_connection():
    """
    Trả về kết nối database:
    - Supabase PostgreSQL nếu USE_POSTGRES = True và kết nối thành công
    - Tự động fallback sang SQLite (homeroom.db) nếu không cấu hình Supabase
    """
    if is_postgres_active():
        try:
            if DATABASE_URL:
                conn = psycopg2.connect(DATABASE_URL, sslmode="require")
            else:
                conn = psycopg2.connect(
                    host=SUPABASE_DB_HOST,
                    port=int(SUPABASE_DB_PORT or 5432),
                    dbname=SUPABASE_DB_NAME or "postgres",
                    user=SUPABASE_DB_USER or "postgres",
                    password=SUPABASE_DB_PASSWORD,
                    sslmode="require"
                )
            return PostgresConnectionWrapper(conn)
        except Exception as e:
            logger.warning(f"Chưa thể kết nối Supabase ({e}). Sử dụng SQLite cục bộ: {DB_PATH}")

    # Fallback SQLite
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """
    Khởi tạo cấu trúc 8 bảng dữ liệu:
    - Nếu dùng Supabase PostgreSQL: chạy DDL PostgreSQL (SERIAL PRIMARY KEY, ...)
    - Nếu dùng SQLite: chạy DDL SQLite
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    if is_postgres_active() and isinstance(conn, PostgresConnectionWrapper):
        # PostgreSQL DDL for Supabase
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT,
            duty TEXT,
            password_hash TEXT,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            student_id INTEGER,
            avatar TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS duty TEXT;")
        except Exception:
            pass

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id SERIAL PRIMARY KEY,
            student_code TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            gender TEXT NOT NULL,
            dob TEXT,
            height_cm INTEGER DEFAULT 160,
            has_glasses INTEGER DEFAULT 0,
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
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance_logs (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            date TEXT NOT NULL,
            session TEXT NOT NULL,
            status TEXT NOT NULL,
            note TEXT,
            recorded_by TEXT DEFAULT 'teacher',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS gamified_points_logs (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            points INTEGER NOT NULL,
            reason TEXT NOT NULL,
            category TEXT DEFAULT 'nề nếp',
            recorded_by TEXT DEFAULT 'monitor',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS academic_grades (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            subject TEXT NOT NULL,
            tx1 REAL,
            tx2 REAL,
            gk REAL,
            ck REAL,
            average REAL,
            trend TEXT DEFAULT 'stable',
            warning_flag INTEGER DEFAULT 0
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_reports (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            term TEXT NOT NULL,
            tone TEXT DEFAULT 'constructive',
            generated_text TEXT NOT NULL,
            strengths TEXT,
            areas_for_improvement TEXT,
            action_plan TEXT,
            approved_by_teacher INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS parent_communications (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            channel TEXT NOT NULL,
            recipient TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'Đã gửi',
            trigger_type TEXT DEFAULT 'Hệ thống',
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS absence_requests (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            parent_name TEXT NOT NULL,
            from_date TEXT NOT NULL,
            to_date TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            teacher_reply TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)
    else:
        # SQLite DDL
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT,
            duty TEXT,
            password_hash TEXT,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            student_id INTEGER,
            avatar TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT;")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN email TEXT;")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN duty TEXT;")
        except Exception:
            pass

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_code TEXT UNIQUE NOT NULL,
            full_name TEXT NOT NULL,
            gender TEXT NOT NULL,
            dob TEXT,
            height_cm INTEGER DEFAULT 160,
            has_glasses INTEGER DEFAULT 0,
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
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            session TEXT NOT NULL,
            status TEXT NOT NULL,
            note TEXT,
            recorded_by TEXT DEFAULT 'teacher',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS gamified_points_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            points INTEGER NOT NULL,
            reason TEXT NOT NULL,
            category TEXT DEFAULT 'nề nếp',
            recorded_by TEXT DEFAULT 'monitor',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
        );
        """)

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
            trend TEXT DEFAULT 'stable',
            warning_flag INTEGER DEFAULT 0,
            FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
        );
        """)

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
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS parent_communications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            channel TEXT NOT NULL,
            recipient TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'Đã gửi',
            trigger_type TEXT DEFAULT 'Hệ thống',
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS absence_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            parent_name TEXT NOT NULL,
            from_date TEXT NOT NULL,
            to_date TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            teacher_reply TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
        );
        """)

    conn.commit()
    conn.close()


def query_all(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows] if rows else []


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
    last_id = getattr(cursor, "lastrowid", None) or 0
    conn.commit()
    conn.close()
    return last_id
