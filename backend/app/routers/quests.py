"""
⚠️ 예전엔 이 라우터가 스텁이었음(퀘스트 생성/완료 로직 없음). 2026-09-13부터:
- POST /emotion-logs 응답으로 나가는 루틴 퀘스트가 이제 실제로 quests/user_quests에 저장됨
- 여기서는 그 저장된 것 중 미완료만 조회 + 완료 처리를 담당
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import db_service, xp_service

router = APIRouter()


class CompleteQuestRequest(BaseModel):
    user_id: str


@router.get("/{user_id}")
def get_user_quests(user_id: str):
    return db_service.get_user_quests(user_id, incomplete_only=True)


@router.post("/{quest_id}/complete")
def complete_quest(quest_id: str, payload: CompleteQuestRequest):
    user_id = payload.user_id
    user_quest = db_service.get_user_quest(user_id, quest_id)
    if user_quest is None:
        raise HTTPException(status_code=404, detail="배정된 퀘스트를 찾을 수 없음")
    if user_quest["completed"]:
        raise HTTPException(status_code=400, detail="이미 완료한 퀘스트예요")

    user = db_service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없음")

    # 튜토리얼(온보딩 미완료) 중엔 XP 시스템 자체를 적용 안 하는 원칙(PROJECT_SUMMARY 9번)이
    # emotion_logs.py에는 있는데 여기엔 빠져있어서, 온보딩 끝내기 전에 퀘스트 완료로 레벨이
    # 올라가버리는 구멍이 있었음 (2026-09-14 발견, 여기서 같은 체크 추가해서 막음)
    if user["level"] < 1 or not user["onboarding_completed"]:
        raise HTTPException(status_code=400, detail="온보딩을 먼저 끝내야 퀘스트를 완료할 수 있어요")

    xp_reward = user_quest["quests"]["xp_reward"] or 0

    db_service.complete_user_quest(user_id, quest_id)

    xp_result = xp_service.apply_xp(
        current_level=user["level"], current_xp=user["current_xp"], earned_xp=xp_reward
    )
    updated_user = db_service.update_user_xp_level(
        user_id, xp_result["new_level"], xp_result["remaining_xp"], xp_reward
    )

    return {
        "xp_earned": xp_reward,
        "leveled_up": xp_result["leveled_up"],
        "new_level": xp_result["new_level"],
        "user": updated_user,
    }
