"""
루틴 퀘스트 선정 서비스
- 감정 -> 카테고리 고정 매핑(규칙기반), AI 호출 불필요
- 카테고리 풀에서 2~3개를 랜덤 선택 (중복 없이)
"""
import random
from app.data.quest_bank import EMOTION_TO_QUEST_CATEGORY, get_quest_pool, quest_uuid


def get_routine_quests(
    emotion: str,
    count: int = 3,
    recent_quest_titles: list[str] | None = None,
) -> list[dict]:
    """
    감정에 맞는 가벼운 루틴 퀘스트 여러 개(기본 3개) 반환.
    recent_quest_titles: 최근에 쓴 퀘스트 제목 목록 (있으면 중복 방지, 풀이 부족하면 무시)
    """
    category = EMOTION_TO_QUEST_CATEGORY.get(emotion, "휴식")
    pool = get_quest_pool(category)

    if recent_quest_titles:
        fresh_pool = [q for q in pool if q["title"] not in recent_quest_titles]
        if len(fresh_pool) >= count:
            pool = fresh_pool

    picked = random.sample(pool, k=min(count, len(pool)))
    return [{**q, "category": category, "id": quest_uuid(q["title"])} for q in picked]
