from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.services import db_service
from app.schemas.emotion import UserStats, WeeklySummary

router = APIRouter()


class SaveNicknameRequest(BaseModel):
    nickname: str


class CompleteOnboardingRequest(BaseModel):
    pet_name: str


@router.get("/{user_id}")
def get_user(user_id: str):
    user = db_service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없음")
    return user


@router.post("/{user_id}/nickname")
def save_nickname(user_id: str, payload: SaveNicknameRequest):
    """온보딩 1단계: 닉네임 저장 (레벨/온보딩완료 상태는 안 바뀜)."""
    return db_service.save_nickname(user_id, payload.nickname)


@router.post("/{user_id}/complete-onboarding")
def complete_onboarding(user_id: str, payload: CompleteOnboardingRequest):
    """온보딩 마지막 단계: 먹이주기 튜토리얼 + 펫 이름짓기 끝난 뒤 호출.
    pet_name 저장 + onboarding_completed=true + level 0 -> 1 전환."""
    return db_service.complete_onboarding(user_id, payload.pet_name)


@router.get("/{user_id}/recent-logs")
def recent_logs(user_id: str, limit: int = Query(default=20, le=100)):
    """편지 보관함 목록용 -- 최근 기록 emotion/letter_text/created_at 등 포함해서 그대로 반환."""
    return db_service.get_recent_emotion_logs(user_id, limit=limit)


@router.get("/{user_id}/stats", response_model=UserStats)
def get_stats(user_id: str):
    """설정 화면 '나의 배지' 판정용 통계 (2026-09-19 신규)."""
    return db_service.get_user_stats(user_id)


@router.get("/{user_id}/weekly-summary", response_model=WeeklySummary)
def get_weekly_summary(user_id: str):
    """홈 화면 상단 주간 요약 카드용 (2026-09-19 신규)."""
    return db_service.get_weekly_summary(user_id)
