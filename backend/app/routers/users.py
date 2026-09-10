from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import db_service

router = APIRouter()


class CompleteOnboardingRequest(BaseModel):
    nickname: str


@router.get("/{user_id}")
def get_user(user_id: str):
    user = db_service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없음")
    return user


@router.post("/{user_id}/complete-onboarding")
def complete_onboarding(user_id: str, payload: CompleteOnboardingRequest):
    return db_service.complete_onboarding(user_id, payload.nickname)
