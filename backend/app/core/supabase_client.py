"""
Supabase 클라이언트 싱글톤
- service_role 키 사용 (백엔드 전용, RLS 우회 — 절대 프론트에 노출 금지)
"""
from supabase import create_client, Client
from app.core.config import settings

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _client
