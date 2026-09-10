"""
안전장치: 위기신호(자해/자살 관련) 감지
- 1차: 키워드 필터 (빠르고 확실한 것들)
- 2차: 감정강도(정말 힘듦) + 특정 상황 조합 시 LLM에게 한 번 더 확인 요청 (추후 고도화)
"""

CRISIS_KEYWORDS = [
    "죽고싶", "죽고 싶", "자살", "사라지고싶", "살기싫", "그만살고싶",
    "자해", "다 끝내고싶", "죽어버리고싶",
]

SAFETY_MESSAGE = (
    "혼자 감당하기 힘든 이야기같아. 지금 바로 도움받을 수 있는 곳이 있어.\n\n"
    "- 24시간 자살예방상담전화: 109 (전국 어디서나 무료)\n"
    "- 정신건강상담전화: 1577-0199"
)


def check_crisis(text: str) -> bool:
    if not text:
        return False
    return any(keyword in text for keyword in CRISIS_KEYWORDS)
