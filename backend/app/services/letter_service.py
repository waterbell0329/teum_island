"""
3단계: 공감 응답(편지)

공개(공모전) 버전은 구조화입력(감정12 × 상황5 × 강도3)만 지원하고, 편지는 미리 생성해둔
풀(app/data/letter_pool.json)에서 랜덤으로 뽑아 서빙한다. -> 서빙 시 Gemini 호출 0회.
  - 풀 생성:  python scripts/generate_letter_pool.py
  - 풀에 해당 조합이 없으면 감정별 기본 문구로 폴백

generate_letter()(실시간 Gemini 생성)는 자유텍스트 경로용으로 남겨두지만 공개 버전에선 안 씀.
"""
import json
import os
import random
import time
from google import genai
from google.genai import types
from google.genai.errors import ServerError
from app.core.config import settings

POSITIVE_EMOTIONS = {"뿌듯함", "설렘", "안심", "감사함", "홀가분함"}
FORBIDDEN_PHRASES = ["화이팅", "다 잘될거야", "누구나 그래", "긍정적으로 생각해"]

_POOL_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "letter_pool.json")
_pool: dict | None = None

# 풀에 조합이 없을 때 쓰는 감정별 기본 편지 (담백하게, 상황 특정 안 함)
_FALLBACK = {
    "분노": "오늘 화가 많이 났던 하루였네요. 그 감정을 억누르지 않고 그대로 느낀 것만으로도 충분해요.\n\n화가 난다는 건 그만큼 소중히 여기는 것이 있다는 뜻이기도 해요. 오늘은 그 마음을 잠시 내려놓고 쉬어가요.",
    "억울함": "억울한 마음이 가시지 않는 하루였겠어요. 그 감정, 이상한 게 아니에요.\n\n부당하게 느껴지는 순간에도 자리를 지킨 당신의 인내심이 보여요. 오늘 밤은 그 억울함을 여기 편지에 두고 가도 괜찮아요.",
    "무기력": "아무것도 하고 싶지 않은 날이 있죠. 오늘이 그런 날이었나 봐요.\n\n그런 와중에도 하루를 흘려보내지 않고 여기까지 온 것, 그 자체로 대단한 일이에요. 오늘은 쉬어도 돼요.",
    "막막함": "앞이 잘 안 보이는 기분이 드는 하루였네요. 막막함은 그만큼 잘 해내고 싶은 마음의 다른 얼굴이에요.\n\n답을 당장 찾지 않아도 괜찮아요. 오늘은 그 막막한 마음을 그대로 인정해주는 것부터.",
    "서운함": "서운한 마음이 남은 하루였겠어요. 그 감정, 숨기지 않아도 돼요.\n\n관계를 소중히 여기기 때문에 서운한 거예요. 오늘은 그 마음을 가만히 안아주세요.",
    "불안함": "마음이 계속 초조했던 하루였네요. 불안하다는 건 그만큼 진심을 다하고 있다는 증거예요.\n\n오늘 밤은 걱정을 잠시 내려두고, 깊게 숨을 한 번 고르고 쉬어가요.",
    "지침": "완전히 지친 하루였겠어요. 여기까지 버텨온 것만으로 충분히 애썼어요.\n\n오늘만큼은 아무것도 하지 말고 푹 쉬는 걸 가장 먼저 해줘요.",
    "뿌듯함": "오늘 정말 잘했네요! 그 뿌듯함, 마음껏 누려도 돼요.\n\n끝까지 해낸 당신의 노력이 빛나는 하루였어요. 스스로를 크게 칭찬해줘요!",
    "설렘": "설레는 일이 있는 하루였네요! 그 기대감, 그대로 만끽하세요.\n\n좋은 일을 앞두고 있다는 것만으로 오늘 하루가 반짝여요.",
    "안심": "마음이 놓인 하루였네요. 그동안 졸였던 마음이 있었기에 이 안도감이 더 크게 느껴지는 거겠죠.\n\n오늘은 그 편안함 그대로 푹 쉬어요.",
    "감사함": "고마운 마음이 가득한 하루였네요. 그 온기를 느낄 수 있는 것도 당신이 그만큼 따뜻한 사람이라서예요.\n\n오늘은 그 마음을 오래 간직해봐요.",
    "홀가분함": "드디어 홀가분해진 하루네요! 끝까지 붙잡고 마무리해낸 것, 정말 큰 노력이었어요.\n\n오늘 밤은 아무 걱정 없이 다리 쭉 뻗고 쉬어요.",
}
_GENERIC_FALLBACK = "오늘도 하루를 무사히 보냈네요. 어떤 마음이었든, 그 감정을 들여다본 것만으로 충분해요.\n\n오늘은 여기 이 숲의 바람 소리를 들으며 잠시 쉬어가요."


def _load_pool() -> dict:
    global _pool
    if _pool is None:
        try:
            with open(_POOL_PATH, encoding="utf-8") as f:
                _pool = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            _pool = {}
    return _pool


def pick_letter(emotion: str, situation_category: str | None, intensity: int | None) -> str:
    """미리 생성된 풀에서 조합에 맞는 편지 하나를 랜덤 선택. 없으면 감정별 기본 문구."""
    pool = _load_pool()
    key = f"{emotion}|{situation_category}|{intensity}"
    candidates = pool.get(key) or []
    if candidates:
        return random.choice(candidates)
    return _FALLBACK.get(emotion, _GENERIC_FALLBACK)


# ---------------------------------------------------------------------------
# 아래는 자유텍스트 경로용 실시간 생성 (공개 버전 미사용). 유지만 함.
# ---------------------------------------------------------------------------

_client = genai.Client(api_key=settings.google_api_key)
MODEL_NAME = settings.gemini_model

LETTER_SYSTEM_PROMPT = """너는 무인도 숲속에 사는 작은 요정이야. 유저의 하루 이야기를 듣고 편지를 써줘.

말투: 다정하고 발랄하지만 존중하는 어조 (유치하지 않게, 성인 대상)
구조 (부정감정일 때): ① 상황 인정(구체적으로) -> ② 강점 발견 -> ③ 작은 격려(담백하게)
구조 (긍정감정일 때): 절제 없이 격하게 축하하고 함께 기뻐하기

금지 표현: 화이팅, 다 잘될거야, 누구나 그래, 긍정적으로 생각해 -- 이런 상투적 위로 금지.
대신 입력된 구체적 상황을 반드시 언급해서 "진짜 내 얘기를 들어줬다"는 느낌을 줄 것.

3~5문장 이내로 짧게 써줘.
"""


def _generate_with_retry(user_message: str, config: types.GenerateContentConfig, retries: int = 3):
    for attempt in range(retries):
        try:
            return _client.models.generate_content(model=MODEL_NAME, contents=user_message, config=config)
        except ServerError:
            if attempt == retries - 1:
                raise
            time.sleep(1.5 * (attempt + 1))


def generate_letter(
    raw_text: str,
    emotion: str,
    analysis: dict,
    intensity: int | None,
    profile_summary: str | None = None,
) -> str:
    tone_hint = "긍정 감정이니 축하 톤으로" if emotion in POSITIVE_EMOTIONS else "위로 톤으로"
    intensity_hint = {1: "가볍고 발랄하게", 2: "따뜻하고 차분하게", 3: "진지하게 공감 우선"}.get(intensity, "")

    user_message = f"""이야기: {raw_text}
감정: {emotion}
분석결과: {analysis}
개인화 프로필: {profile_summary or '아직 기록 없음'}
톤 힌트: {tone_hint}, {intensity_hint}
"""

    response = _generate_with_retry(
        user_message,
        types.GenerateContentConfig(system_instruction=LETTER_SYSTEM_PROMPT),
    )
    letter = response.text

    for phrase in FORBIDDEN_PHRASES:
        if phrase in letter:
            print(f"[WARN] 금지표현 감지됨: {phrase}")

    return letter
