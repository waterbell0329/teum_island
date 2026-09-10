from typing import Literal, Optional
from pydantic import BaseModel

Emotion = Literal[
    "분노", "억울함", "무기력", "막막함", "서운함", "불안함", "지침",
    "뿌듯함", "설렘", "안심", "감사함", "홀가분함",
]
SituationCategory = Literal["직장/알바", "인간관계", "학업/진로", "미래불안", "기타"]
Intensity = Literal[1, 2, 3]


class EmotionLogCreateFreeText(BaseModel):
    """경로 A: 자유텍스트 입력"""
    user_id: str
    input_type: Literal["free_text"] = "free_text"
    raw_text: str


class EmotionLogCreateStructured(BaseModel):
    """경로 B: 구조화 입력"""
    user_id: str
    input_type: Literal["structured"] = "structured"
    situation_category: SituationCategory
    emotion: Emotion
    intensity: Intensity
    raw_text: Optional[str] = None  # 선택적 한 줄 설명


class RoutineQuest(BaseModel):
    title: str
    description: str
    xp: int
    duration: str
    category: str


class EmotionLogResponse(BaseModel):
    id: str
    emotion: Emotion
    intensity: Optional[Intensity]
    letter_text: str          # 요정이 써준 편지 (유저에게 보여줄 것)
    xp_earned: int
    leveled_up: bool
    new_level: int
    food_icon: str            # 먹이 아이콘 키 (감정명과 매핑, 소모품이라 저장은 안 함)
    today_quests: list[RoutineQuest]  # 오늘 하루 시작할 가벼운 루틴 퀘스트 2~3개
