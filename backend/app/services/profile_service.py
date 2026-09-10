"""
4단계 일부: 감정 프로필 요약 배치 로직
- 매 기록마다 요약을 다시 생성하면 LLM 호출 비용 낭비 -> N번째 기록마다 한 번씩만 갱신
- 갱신 실패해도 emotion_logs 저장 자체는 이미 끝난 뒤라 조용히 넘어감 (부가 기능 취급)
- LLM: Google Gemini (google-genai SDK)
"""
from google import genai
from google.genai import types
from google.genai.errors import ServerError
from app.core.config import settings
from app.services import db_service

_client = genai.Client(api_key=settings.google_api_key)

MODEL_NAME = settings.gemini_model

# 5번째, 10번째, ... 기록마다 한 번씩 요약 갱신
UPDATE_EVERY_N_LOGS = 5

PROFILE_SYSTEM_PROMPT = """너는 유저의 최근 감정 기록들을 보고 성향을 요약하는 역할이야.
아래 최근 기록 목록을 참고해서, 이 유저가 어떤 상황에서 어떤 감정을 자주 느끼는지
3문장 이내로 담백하게 요약해. 이건 유저에게 보내는 말이 아니라, 다른 요정이 다음 편지를
쓸 때 참고할 내부 메모야. 다정한 말투 필요 없이 사실 위주로 써.
"""


def maybe_update_profile(user_id: str) -> None:
    """기록 개수가 N의 배수일 때만 프로필 요약을 갱신. 그 외엔 아무 것도 하지 않음."""
    total_logs = db_service.count_emotion_logs(user_id)
    if total_logs == 0 or total_logs % UPDATE_EVERY_N_LOGS != 0:
        return

    recent_logs = db_service.get_recent_emotion_logs(user_id, limit=UPDATE_EVERY_N_LOGS)
    if not recent_logs:
        return

    lines = [f"- {log['emotion']}({log.get('intensity') or '-'}단계): {(log['raw_text'] or '')[:80]}" for log in recent_logs]
    user_message = "\n".join(lines)

    try:
        response = _client.models.generate_content(
            model=MODEL_NAME,
            contents=user_message,
            config=types.GenerateContentConfig(system_instruction=PROFILE_SYSTEM_PROMPT),
        )
        db_service.upsert_emotion_profile(user_id, response.text)
    except ServerError as e:
        print(f"[WARN] 프로필 요약 갱신 실패(user={user_id}): {e}")
