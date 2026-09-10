"""
2단계: 구조화된 분석 (신설 단계)
- 상황요약/핵심감정/숨은강점후보/맥락키워드를 JSON으로 추출
- 강점은 미리 정의된 후보군 중에서 고르게 강제 (완전 자유생성보다 안정적)
- 자유텍스트 입력일 때 감정 강도(1~3)도 함께 추론 (구조화 입력은 유저가 이미 골랐으므로 라우터에서 무시함) --
  이미 호출하는 김에 같은 응답에 필드만 추가하는 것이라 API 호출 비용이 늘지 않음
- LLM: Google Gemini (google-genai SDK — 구 google-generativeai는 지원 종료됨)
"""
import json
import time
from google import genai
from google.genai import types
from google.genai.errors import ServerError
from app.core.config import settings

_client = genai.Client(api_key=settings.google_api_key)

# gemini-2.0-flash가 서비스 종료되어 alias로 교체 (Google이 모델을 교체/폐기해도 코드 수정 불필요)
MODEL_NAME = settings.gemini_model

STRENGTH_CANDIDATES = ["인내심", "책임감", "유연성", "경계설정", "노력", "회복탄력성", "배려심"]

ANALYSIS_SYSTEM_PROMPT = f"""너는 사용자의 하루 이야기를 분석하는 역할이야.
아래 JSON 형식으로만 답해. 다른 텍스트는 절대 추가하지 마.

{{
  "situation_summary": "상황을 한 문장으로 요약",
  "core_emotion": "핵심 감정 한 단어",
  "possible_strengths": ["이 후보군 중에서만 1~2개 선택: {', '.join(STRENGTH_CANDIDATES)}"],
  "context_keywords": ["관련 키워드 2~3개"],
  "intensity": "감정의 강도를 1~3 중 하나로: 1=약간 힘듦(또는 약간 좋음), 2=많이 힘듦(또는 많이 좋음), 3=정말 힘듦(또는 정말 좋음)"
}}
"""


def _generate_with_retry(user_message: str, config: types.GenerateContentConfig, retries: int = 3):
    """Gemini 무료 할당량 특성상 503(과부하)이 종종 뜸 -- 잠깐 쉬었다 재시도."""
    for attempt in range(retries):
        try:
            return _client.models.generate_content(model=MODEL_NAME, contents=user_message, config=config)
        except ServerError:
            if attempt == retries - 1:
                raise
            time.sleep(1.5 * (attempt + 1))


def analyze(raw_text: str, emotion: str, situation_category: str | None = None) -> dict:
    user_message = f"감정: {emotion}\n상황카테고리: {situation_category or '미지정'}\n이야기: {raw_text}"

    response = _generate_with_retry(
        user_message,
        types.GenerateContentConfig(
            system_instruction=ANALYSIS_SYSTEM_PROMPT,
            response_mime_type="application/json",  # JSON 강제 출력
        ),
    )

    try:
        return json.loads(response.text)
    except (json.JSONDecodeError, ValueError) as e:
        # TODO: 파싱 실패 시 재시도 로직 또는 기본값 반환 추가
        print(f"[WARN] 분석 결과 JSON 파싱 실패: {e}, raw={response.text}")
        return {
            "situation_summary": raw_text[:50],
            "core_emotion": emotion,
            "possible_strengths": ["인내심"],
            "context_keywords": [],
            "intensity": 2,
        }


def infer_intensity(analysis: dict, default: int = 2) -> int:
    """analyze() 결과에서 intensity를 안전하게 뽑아냄 (LLM이 문자열/범위밖 값을 줄 수 있어 방어)."""
    try:
        value = int(analysis.get("intensity", default))
    except (TypeError, ValueError):
        return default
    return value if value in (1, 2, 3) else default
