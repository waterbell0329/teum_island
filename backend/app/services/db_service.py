"""
Supabase CRUD 함수 모음
- 라우터/다른 서비스에서 이 파일만 통해서 DB에 접근 (쿼리 로직 한 곳에 모으기)
- 테이블: users, emotion_logs, emotion_profiles, crisis_flags, quests, user_quests
  (food_collection은 "먹이 소모품화" 결정 이후 더 이상 쓰지 않음 — 테이블 삭제 여부는 별도 확인 필요)
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.core.supabase_client import get_supabase


# ---------- users ----------

def get_user(user_id: str) -> Optional[dict]:
    res = get_supabase().table("users").select("*").eq("id", user_id).maybe_single().execute()
    return res.data if res else None


def get_or_create_user(user_id: str) -> dict:
    """유저 조회, 없으면 기본값(레벨0=튜토리얼 중, XP0, 온보딩 미완료)으로 새로 만듦.
    emotion_logs 라우터가 매 요청마다 호출 -- 온보딩을 안 거쳤어도 기록 자체는 막히지 않게 방어
    (먹이주기 튜토리얼도 결국 이 경로를 타므로).
    주의: users.id는 auth.users를 참조하는 FK라서, 구글 로그인으로 실제 auth 유저가
    먼저 만들어져 있어야만 성공함 (없는 uuid로 호출하면 FK 위반 에러)."""
    user = get_user(user_id)
    if user is not None:
        return user
    payload = {
        "id": user_id,
        "onboarding_completed": False,
        "level": 0,  # 0단계: 튜토리얼 중 (XP 시스템 미적용, PROJECT_SUMMARY 9번 섹션)
        "current_xp": 0,
        "total_xp": 0,
    }
    res = get_supabase().table("users").insert(payload).execute()
    return res.data[0]


def save_nickname(user_id: str, nickname: str) -> dict:
    """온보딩 1단계: 닉네임만 저장. 레벨/온보딩완료 여부는 안 건드림
    (유저 행이 없으면 get_or_create_user와 같은 기본값으로 새로 만들면서 닉네임만 얹음)."""
    payload = {
        "id": user_id,
        "nickname": nickname,
        "onboarding_completed": False,
        "level": 0,
        "current_xp": 0,
        "total_xp": 0,
    }
    existing = get_user(user_id)
    if existing:
        # 이미 있는 행이면 닉네임 말고는 기존 값(레벨 등) 건드리지 않음
        res = get_supabase().table("users").update({"nickname": nickname}).eq("id", user_id).execute()
    else:
        res = get_supabase().table("users").insert(payload).execute()
    return res.data[0]


def complete_onboarding(user_id: str, pet_name: str) -> dict:
    """온보딩 마지막 단계(먹이주기 튜토리얼 + 펫 이름짓기 이후): pet_name 저장,
    onboarding_completed=true, level 0 -> 1 전환. 이미 1 이상이면 레벨은 그대로 둠
    (재호출 방어 -- 실수로 두 번 눌러도 레벨이 다시 리셋되지 않게)."""
    user = get_user(user_id)
    current_level = user["level"] if user else 0
    new_level = 1 if current_level < 1 else current_level
    payload = {
        "id": user_id,
        "pet_name": pet_name,
        "onboarding_completed": True,
        "level": new_level,
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


def get_user_stats(user_id: str) -> dict:
    """설정 화면 '나의 배지' 판정용 통계 (2026-09-19 신규, /users/{id}/stats).
    emotion_logs를 한 번만 조회해서 total/연속일수/감정종류를 전부 계산 -- 배지 조건이
    바뀌어도 새 쿼리 없이 여기 값만으로 client-side에서 판정하게(lib/badges.ts)."""
    logs = (
        get_supabase()
        .table("emotion_logs")
        .select("emotion, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    ).data or []

    total_logs = len(logs)
    distinct_emotions_count = len({row["emotion"] for row in logs if row.get("emotion")})

    # 연속 기록일수: 오늘(또는 아직 오늘치가 없으면 어제)부터 거꾸로 보면서 하루도
    # 안 빠지고 이어진 날짜 수만 셈 (하루에 여러 번 기록해도 날짜 단위로만 셈)
    log_dates = sorted(
        {datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")).date() for row in logs if row.get("created_at")},
        reverse=True,
    )
    streak = 0
    if log_dates:
        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)
        if log_dates[0] in (today, yesterday):
            expected = log_dates[0]  # 오늘치가 아직 없으면 어제부터 거꾸로 셈
            for d in log_dates:
                if d == expected:
                    streak += 1
                    expected -= timedelta(days=1)
                elif d < expected:
                    break

    quests = (
        get_supabase()
        .table("user_quests")
        .select("user_id", count="exact")
        .eq("user_id", user_id)
        .eq("completed", True)
        .execute()
    )
    completed_quests_count = quests.count or 0

    user = get_user(user_id)
    current_level = user["level"] if user else 0

    return {
        "total_logs": total_logs,
        "distinct_days_streak": streak,
        "distinct_emotions_count": distinct_emotions_count,
        "completed_quests_count": completed_quests_count,
        "current_level": current_level,
    }


def get_weekly_summary(user_id: str) -> dict:
    """홈 화면 상단 주간 요약 (2026-09-19 신규, /users/{id}/weekly-summary)."""
    from collections import Counter

    since = datetime.now(timezone.utc).timestamp() - 7 * 24 * 60 * 60
    since_iso = datetime.fromtimestamp(since, tz=timezone.utc).isoformat()

    res = (
        get_supabase()
        .table("emotion_logs")
        .select("emotion")
        .eq("user_id", user_id)
        .gte("created_at", since_iso)
        .execute()
    )
    rows = res.data or []
    if not rows:
        return {"total_count": 0, "top_emotion": None}

    counts = Counter(row["emotion"] for row in rows if row.get("emotion"))
    top_emotion = counts.most_common(1)[0][0] if counts else None
    return {"total_count": len(rows), "top_emotion": top_emotion}


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


def get_user_quests(user_id: str, incomplete_only: bool = False) -> list[dict]:
    """유저의 퀘스트 진행상황 + 퀘스트 상세정보 조인."""
    q = get_supabase().table("user_quests").select("*, quests(*)").eq("user_id", user_id)
    if incomplete_only:
        q = q.eq("completed", False)
    res = q.execute()
    return res.data or []


def upsert_quest(quest_id: str, title: str, description: str, category: str, xp_reward: int) -> dict:
    """quest_bank.py의 퀘스트를 quests 테이블에 반영 (같은 title -> 같은 id라서 여러 번 불려도 안전)."""
    payload = {
        "id": quest_id,
        "title": title,
        "description": description,
        "target_emotion_category": category,
        "xp_reward": xp_reward,
    }
    res = get_supabase().table("quests").upsert(payload).execute()
    return res.data[0]


def assign_quest_to_user(user_id: str, quest_id: str) -> None:
    """이미 배정(또는 완료)된 적 있으면 건드리지 않음 -- 완료된 걸 다시 미완료로 되돌리지 않기 위해."""
    existing = (
        get_supabase()
        .table("user_quests")
        .select("user_id")
        .eq("user_id", user_id)
        .eq("quest_id", quest_id)
        .maybe_single()
        .execute()
    )
    if existing and existing.data:
        return
    get_supabase().table("user_quests").insert(
        {"user_id": user_id, "quest_id": quest_id, "progress": 0, "completed": False}
    ).execute()


def get_user_quest(user_id: str, quest_id: str) -> Optional[dict]:
    res = (
        get_supabase()
        .table("user_quests")
        .select("*, quests(*)")
        .eq("user_id", user_id)
        .eq("quest_id", quest_id)
        .maybe_single()
        .execute()
    )
    return res.data if res else None


def complete_user_quest(user_id: str, quest_id: str) -> dict:
    payload = {"completed": True, "completed_at": datetime.now(timezone.utc).isoformat()}
    res = (
        get_supabase()
        .table("user_quests")
        .update(payload)
        .eq("user_id", user_id)
        .eq("quest_id", quest_id)
        .execute()
    )
    return res.data[0]
