from fastapi import APIRouter, HTTPException
from app.schemas.emotion import (
    EmotionLogCreateFreeText,
    EmotionLogCreateStructured,
    EmotionLogResponse,
)
from app.services import (
    letter_service,
    xp_service,
    safety_service,
    db_service,
    quest_service,
)

router = APIRouter()

# 공개(공모전) 버전은 구조화입력만 지원. 편지는 미리 생성된 풀에서 서빙하고,
# 자유텍스트 분류(LoRA)와 실시간 Gemini 호출(analysis/letter/profile)은 이 경로에서 안 씀.
# classifier_service / analysis_service / profile_service / letter_service.generate_letter 는
# 코드에 남아있지만 여기서 호출하지 않음.
ENABLE_FREE_TEXT = False


@router.post("", response_model=EmotionLogResponse)
def create_emotion_log(payload: EmotionLogCreateFreeText | EmotionLogCreateStructured):
    raw_text = payload.raw_text or ""
    user_id = payload.user_id

    user = db_service.get_or_create_user(user_id)

    # --- 안전장치: 위기신호 감지 (키워드 기반, LLM 무관) ---
    if safety_service.check_crisis(raw_text):
        db_service.log_crisis_flag(user_id, raw_text)
        return EmotionLogResponse(
            id="crisis",
            emotion="무기력",
            intensity=None,
            letter_text=safety_service.SAFETY_MESSAGE,
            xp_earned=0,
            leveled_up=False,
            new_level=user["level"],
            food_icon="none",
            today_quests=[{
                "title": "괜찮아, 오늘은 쉬어도 돼",
                "description": "지금은 리스트보다 너를 돌보는 게 먼저야.",
                "xp": 0, "duration": "-", "category": "휴식",
            }],
        )

    if payload.input_type == "free_text":
        if not ENABLE_FREE_TEXT:
            raise HTTPException(status_code=400, detail="이 버전은 자유텍스트 입력을 지원하지 않아요. 감정을 골라서 전해주세요.")
        raise HTTPException(status_code=501, detail="free_text 경로 미구현")

    emotion = payload.emotion
    intensity = payload.intensity
    situation_category = payload.situation_category

    # --- 편지: 미리 생성된 풀에서 조합 매칭 후 랜덤 선택 (Gemini 호출 없음) ---
    letter = letter_service.pick_letter(emotion, situation_category, intensity)

    # --- XP / 레벨 ---
    xp_earned = xp_service.xp_for_record(intensity)
    xp_result = xp_service.apply_xp(
        current_level=user["level"], current_xp=user["current_xp"], earned_xp=xp_earned
    )

    log_row = db_service.insert_emotion_log(
        user_id=user_id,
        input_type=payload.input_type,
        emotion=emotion,
        letter_text=letter,
        xp_earned=xp_earned,
        intensity=intensity,
        situation_category=situation_category,
        raw_text=raw_text,
        analysis_json={
            "situation_category": situation_category,
            "emotion": emotion,
            "intensity": intensity,
            "source": "structured",
        },
    )
    db_service.update_user_xp_level(user_id, xp_result["new_level"], xp_result["remaining_xp"], xp_earned)

    # --- 루틴 퀘스트 선정 (규칙기반, AI 호출 없음) ---
    quests = quest_service.get_routine_quests(emotion, count=3, recent_quest_titles=None)

    return EmotionLogResponse(
        id=log_row["id"],
        emotion=emotion,
        intensity=intensity,
        letter_text=letter,
        xp_earned=xp_earned,
        leveled_up=xp_result["leveled_up"],
        new_level=xp_result["new_level"],
        food_icon=emotion,
        today_quests=quests,
    )
