"""
Supabase CRUD 함수 모음
- 라우터/다른 서비스에서 이 파일만 통해서 DB에 접근 (쿼리 로직 한 곳에 모으기)
- 테이블: users, emotion_logs, emotion_profiles, crisis_flags, quests, user_quests
  (food_collection은 "먹이 소모품화" 결정 이후 더 이상 쓰지 않음 — 테이블 삭제 여부는 별도 확인 필요)
"""
from datetime import datetime, timezone
from typing import Optional
from app.core.supabase_client import get_supabase


# ---------- users ----------

def get_user(user_id: str) -> Optional[dict]:
    res = get_supabase().table("users").select("*").eq("id", user_id).maybe_single().execute()
    return res.data if res else None


def get_or_create_user(user_id: str) -> dict:
    """유저 조회, 없으면 기본값(레벨1, XP0, 온보딩 미완료)으로 새로 만듦.
    emotion_logs 라우터가 매 요청마다 호출 -- 온보딩을 안 거쳤어도 기록 자체는 막히지 않게 방어.
    주의: users.id는 auth.users를 참조하는 FK라서, 구글 로그인으로 실제 auth 유저가
    먼저 만들어져 있어야만 성공함 (없는 uuid로 호출하면 FK 위반 에러)."""
    user = get_user(user_id)
    if user is not None:
        return user
    payload = {
        "id": user_id,
        "onboarding_completed": False,
        "level": 1,
        "current_xp": 0,
        "total_xp": 0,
    }
    res = get_supabase().table("users").insert(payload).execute()
    return res.data[0]


def complete_onboarding(user_id: str, nickname: str) -> dict:
    """최초 유저 온보딩 완료 처리. 유저 행이 없으면 새로 만듦(구글 로그인 시 auth 트리거로
    이미 만들어져 있는 게 이상적이지만, 없을 경우를 대비해 upsert로 방어)."""
    payload = {
        "id": user_id,
        "nickname": nickname,
        "onboarding_completed": True,
        "level": 1,
        "current_xp": 0,
        "total_xp": 0,
    }
    res = get_supabase().table("users").upsert(payload).execute()
    return res.data[0]


def update_user_xp_level(user_id: str, new_level: int, remaining_xp: int, xp_earned: int) -> dict:
    """XP 지급 후 유저의 level/current_xp/total_xp 갱신 (total_xp는 누적 합산)."""
    user = get_user(user_id)
    total_xp = (user.get("total_xp", 0) if user else 0) + xp_earned
    res = (
        get_supabase()
        .table("users")
        .update({"level": new_level, "current_xp": remaining_xp, "total_xp": total_xp})
        .eq("id", user_id)
        .execute()
    )
    return res.data[0]


# ---------- emotion_logs ----------

def insert_emotion_log(
    user_id: str,
    input_type: str,
    emotion: str,
    intensity: Optional[int],
    raw_text: str,
    analysis_json: dict,
    letter_text: str,
    xp_earned: int,
    situation_category: Optional[str] = None,
    created_at: Optional[str] = None,
) -> dict:
    payload = {
        "user_id": user_id,
        "input_type": input_type,
        "situation_category": situation_category,
        "emotion": emotion,
        "intensity": intensity,
        "raw_text": raw_text,
        "analysis_json": analysis_json,
        "letter_text": letter_text,
        "xp_earned": xp_earned,
    }
    if created_at is not None:
        # 시드 스크립트 등에서 "예전에 쓴 기록"처럼 보이게 날짜를 흩뿌릴 때만 사용.
        # 실제 서비스 흐름(emotion_logs 라우터)에서는 항상 생략 -> DB 기본값(now()) 사용
        payload["created_at"] = created_at
    res = get_supabase().table("emotion_logs").insert(payload).execute()
    return res.data[0]


def get_recent_emotion_logs(user_id: str, limit: int = 10) -> list[dict]:
    res = (
        get_supabase()
        .table("emotion_logs")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


def count_emotion_logs(user_id: str) -> int:
    res = (
        get_supabase()
        .table("emotion_logs")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    return res.count or 0


# ---------- emotion_profiles ----------
# summary_text 갱신은 profile_service.py가 N개 기록마다 트리거함 (매번 하면 비용 낭비).
# 여기 함수들은 그 배치 로직이 쓰는 읽기/쓰기 CRUD만 담당한다.

def get_emotion_profile(user_id: str) -> Optional[dict]:
    res = (
        get_supabase()
        .table("emotion_profiles")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return res.data if res else None


def get_profile_summary(user_id: str) -> Optional[str]:
    """편지 생성 시 넘길 요약 텍스트만 뽑아옴 (프로필 자체가 없으면 None)."""
    profile = get_emotion_profile(user_id)
    return profile["summary_text"] if profile else None


def upsert_emotion_profile(user_id: str, summary_text: str) -> dict:
    payload = {
        "user_id": user_id,
        "summary_text": summary_text,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    res = get_supabase().table("emotion_profiles").upsert(payload).execute()
    return res.data[0]


def delete_emotion_logs_for_user(user_id: str) -> None:
    """시드 스크립트의 --reset 옵션 등에서 재시딩 전에 정리할 때만 사용."""
    get_supabase().table("emotion_logs").delete().eq("user_id", user_id).execute()


def delete_emotion_profile(user_id: str) -> None:
    get_supabase().table("emotion_profiles").delete().eq("user_id", user_id).execute()


# ---------- crisis_flags ----------

def log_crisis_flag(user_id: str, raw_text: str) -> dict:
    payload = {"user_id": user_id, "raw_text_snippet": raw_text[:200], "handled": False}
    res = get_supabase().table("crisis_flags").insert(payload).execute()
    return res.data[0]


# ---------- quests ----------

def get_all_quests() -> list[dict]:
    res = get_supabase().table("quests").select("*").execute()
    return res.data or []


def get_user_quests(user_id: str) -> list[dict]:
    """유저의 퀘스트 진행상황 + 퀘스트 상세정보 조인."""
    res = (
        get_supabase()
        .table("user_quests")
        .select("*, quests(*)")
        .eq("user_id", user_id)
        .execute()
    )
    return res.data or []
