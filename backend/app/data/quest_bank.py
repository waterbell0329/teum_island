"""
루틴 퀘스트 뱅크
- 카테고리 6개, 매번 2~3개씩 랜덤 제공
- 각 퀘스트: title(할 일) + description(왜/어떻게 하면 좋은지 짧은 설명) + xp + duration(예상 소요시간)
- 완료 안 해도 벌칙 없음(Finch 철학) -- 문구도 부담 주지 않는 톤으로 통일

⚠️ 이 파일은 원래 다른 세션에서 만든 버전이 복사 과정에서 인코딩이 깨져 복구가
불가능해서, 같은 구조(감정->카테고리 매핑, 카테고리별 퀘스트풀)로 새로 작성한 버전임.
원본 문구와 100% 동일하지는 않음 (2026-09-07).
"""
import uuid

# quests 테이블에 저장할 때 쓰는 고정 UUID -- title이 같으면 항상 같은 id가 나옴
# (2026-09-13: 퀘스트 완료/저장 기능 추가하면서 도입)
_QUEST_NAMESPACE = uuid.UUID("2f6a1b00-0000-4000-8000-000000000000")


def quest_uuid(title: str) -> str:
    return str(uuid.uuid5(_QUEST_NAMESPACE, title))

EMOTION_TO_QUEST_CATEGORY = {
    "분노": "휴식",
    "지침": "휴식",
    "안심": "휴식",
    "무기력": "회복",
    "홀가분함": "회복",
    "억울함": "정리",
    "막막함": "정리",
    "불안함": "안정",
    "서운함": "연결",
    "감사함": "연결",
    "뿌듯함": "확장",
    "설렘": "확장",
}

QUEST_BANK = {
    "휴식": [
        {"title": "5분만 아무 생각 없이 걷기", "description": "목적지 없이 그냥 걸어보는 것만으로도 머리가 식어.", "xp": 10, "duration": "5분"},
        {"title": "좋아하는 노래 한 곡 크게 듣기", "description": "볼륨 높이고 한 곡만 제대로 들어봐.", "xp": 10, "duration": "4분"},
        {"title": "따뜻한 차 한 잔 마시기", "description": "따뜻한 걸 천천히 마시면서 잠깐 쉬어가.", "xp": 10, "duration": "5분"},
        {"title": "눈 감고 3분만 아무것도 안 하기", "description": "정말 아무것도 안 해도 괜찮아, 그 자체가 휴식이야.", "xp": 15, "duration": "3분"},
        {"title": "핸드폰 잠깐 멀리 두기", "description": "10분만이라도 화면에서 벗어나서 쉬어봐.", "xp": 10, "duration": "10분"},
        {"title": "창문 열고 환기시키기", "description": "바깥 공기가 들어오면 기분 전환에 도움이 돼.", "xp": 10, "duration": "2분"},
    ],
    "회복": [
        {"title": "물 한 잔 마시기", "description": "사소해 보여도, 몸이 움직이는 첫 단추가 될 수 있어.", "xp": 10, "duration": "1분"},
        {"title": "이불만 정리하기", "description": "딱 이불만 개보자. 하나 해내면 다음 것도 조금 쉬워져.", "xp": 10, "duration": "2분"},
        {"title": "가벼운 스트레칭 3분", "description": "몸을 조금이라도 움직이면 무기력함이 아주 조금 풀려.", "xp": 15, "duration": "3분"},
        {"title": "세수만 하고 오기", "description": "얼굴에 물 한 번 묻히는 것부터 시작해봐.", "xp": 10, "duration": "2분"},
        {"title": "내일 할 일 딱 1개만 정해두기", "description": "너무 많이 생각하지 말고, 제일 먼저 할 일 하나만 정해봐.", "xp": 15, "duration": "3분"},
        {"title": "다리 뻗고 3분 누워있기", "description": "다 끝났으니 아무 걱정 없이 늘어져 있어도 돼.", "xp": 10, "duration": "3분"},
    ],
    "정리": [
        {"title": "속상했던 상황 한 줄로 적어보기", "description": "머릿속에 있는 걸 글로 옮기면 마음이 조금 가벼워져.", "xp": 15, "duration": "5분"},
        {"title": "책상 위 물건 5개만 정리하기", "description": "딱 5개만. 손이 바쁘면 머릿속도 조금 정리돼.", "xp": 10, "duration": "5분"},
        {"title": "고민을 그림이나 화살표로 그려보기", "description": "글이 안 써지면 그림도 괜찮아. 눈에 보이게만 만들어도 가벼워져.", "xp": 15, "duration": "10분"},
        {"title": "이번 주 일정 한 번 훑어보기", "description": "전체 그림을 보면 막막함이 조금 줄어들어.", "xp": 15, "duration": "5분"},
        {"title": "가장 쉬운 일부터 딱 하나 처리하기", "description": "제일 쉬운 것부터 치우면 다음 흐름이 생겨.", "xp": 15, "duration": "10분"},
    ],
    "안정": [
        {"title": "지금 걱정되는 것 하나만 적어보기", "description": "머릿속에서 빙빙 도는 걱정을 글로 꺼내면 좀 가벼워져.", "xp": 15, "duration": "5분"},
        {"title": "1분 동안 천천히 숨쉬기", "description": "숨을 천천히 쉬는 것만으로도 몸이 안정 신호를 받아.", "xp": 10, "duration": "1분"},
        {"title": "믿을 수 있는 사람에게 안부 메시지 보내기", "description": "누군가와 연결되어 있다는 느낌이 불안을 줄여줘.", "xp": 15, "duration": "5분"},
        {"title": "지금 확실한 사실 3가지 적어보기", "description": "불안할 땐 확실한 것부터 붙잡는 게 도움이 돼.", "xp": 15, "duration": "5분"},
        {"title": "발바닥이 바닥에 닿는 감각에 집중해보기", "description": "지금 이 순간, 이 자리에 있다는 감각을 느껴봐.", "xp": 10, "duration": "2분"},
    ],
    "연결": [
        {"title": "고마운 사람에게 짧은 메시지 보내기", "description": "마음을 표현하면 그 온기가 다시 대화로 돌아와.", "xp": 15, "duration": "5분"},
        {"title": "친구나 가족에게 안부 전하기", "description": "목소리를 듣는 것만으로도 마음이 든든해질 수 있어.", "xp": 20, "duration": "10분"},
        {"title": "오늘 있었던 좋은 일 나누기", "description": "좋았던 순간을 누군가와 나누면 두 배로 남아.", "xp": 15, "duration": "5분"},
        {"title": "예전 사진 보며 좋았던 순간 떠올리기", "description": "고마웠던 순간을 다시 떠올리는 것만으로도 마음이 따뜻해져.", "xp": 10, "duration": "3분"},
        {"title": "누군가에게 칭찬 한마디 건네기", "description": "건넨 칭찬은 결국 나에게도 좋은 기분으로 돌아와.", "xp": 15, "duration": "3분"},
    ],
    "확장": [
        {"title": "오늘의 성취 한 줄로 기록하기", "description": "작은 성취라도 적어두면 나중에 큰 힘이 돼.", "xp": 15, "duration": "3분"},
        {"title": "내일 기대되는 일 하나 적어보기", "description": "기대할 일이 있으면 오늘의 좋은 기분도 계속 이어져.", "xp": 10, "duration": "3분"},
        {"title": "나에게 작은 선물 하나 하기", "description": "잘한 만큼 자신에게 보상해줘도 괜찮아.", "xp": 15, "duration": "10분"},
        {"title": "이 기분을 사진이나 메모로 남기기", "description": "좋은 순간을 기록해두면 힘들 때 다시 꺼내볼 수 있어.", "xp": 10, "duration": "3분"},
        {"title": "다음 목표 하나 가볍게 세워보기", "description": "지금의 좋은 에너지를 다음 걸음으로 이어가봐.", "xp": 15, "duration": "5분"},
    ],
}


def get_quest_pool(category: str) -> list[dict]:
    return QUEST_BANK.get(category, QUEST_BANK["휴식"])
