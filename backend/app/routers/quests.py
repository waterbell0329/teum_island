"""
⚠️ 보류된 기능: DB에 저장/추적되는 퀘스트(quests/user_quests 테이블, AI가 하루 단위로
추천하는 방식 - 기획 원안)는 이 라우터만 있고 생성/완료 로직이 없어 실질적으로 미구현 상태.

지금 실제로 쓰는 건 기록할 때마다 즉석으로 내려주는 규칙기반 루틴 퀘스트
(app/services/quest_service.py + app/data/quest_bank.py, POST /emotion-logs 응답의
today_quests) 쪽으로 정리함. 이 라우터는 당장 지우진 않았지만 더 투자하지 않기로 함.
"""
from fastapi import APIRouter
from app.services import db_service

router = APIRouter()


@router.get("/{user_id}")
def get_user_quests(user_id: str):
    return db_service.get_user_quests(user_id)
