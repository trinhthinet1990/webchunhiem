import logging
from typing import Optional
from supabase import create_client, Client
from app.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY

logger = logging.getLogger("homeroom.supabase")

_supabase_client: Optional[Client] = None
_supabase_admin: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    """
    Khởi tạo hoặc trả về Supabase Client sử dụng Anon Key (cho client thông thường)
    """
    global _supabase_client
    if _supabase_client is None and SUPABASE_URL and SUPABASE_KEY:
        try:
            _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            logger.warning(f"Không thể khởi tạo Supabase Client: {e}")
    return _supabase_client

def get_supabase_admin() -> Optional[Client]:
    """
    Khởi tạo hoặc trả về Supabase Admin Client sử dụng Service Role Key (toàn quyền bypass RLS)
    """
    global _supabase_admin
    key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY
    if _supabase_admin is None and SUPABASE_URL and key:
        try:
            _supabase_admin = create_client(SUPABASE_URL, key)
        except Exception as e:
            logger.warning(f"Không thể khởi tạo Supabase Admin Client: {e}")
    return _supabase_admin
