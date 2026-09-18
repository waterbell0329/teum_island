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
from app.data.quest_bank import quest_uuid

router = APIRouter()

# 2026-09-18: 자유텍스트 경로 실제로 켬 -- LoRA 분류기(느려서 못 씀) 대신
# letter_service.analyze_free_text()가 Groq로 분류+편지작성을 한 번에 실시간 처리함.
# classifier_service / analysis_service / profile_service / letter_service.generate_letter(Gemini)는
# 코드에 남아있지만 여기서 호출 안 함(무료 쿼터 문제로 계속 보류).
ENABLE_FREE_TEXT = True


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
                "id": quest_uuid("괜찮아, 오늘은 쉬어도 돼"),
                "title": "괜찮아, 오늘은 쉬어도 돼",
                "description": "지금은 리스트보다 너를 돌보는 게 먼저야.",
                "xp": 0, "duration": "-", "category": "휴식",
            }],
        )

    if payload.input_type == "free_text":
        if not ENABLE_FREE_TEXT:
            raise HTTPException(status_code=400, detail="이 버전은 자유텍스트 입력을 지원하지 않아요. 감정을 골라서 전해주세요.")
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="무슨 일이 있었는지 한 줄이라도 적어줘야 편지를 쓸 수 있어요.")
        # --- 편지: Groq로 감정 분류 + 편지작성 실시간 처리 (구조화입력과 달리 풀을 못 씀) ---
        analysis = letter_service.analyze_free_text(raw_text)
        emotion = analysis["emotion"]
        intensity = analysis["intensity"]
        situation_category = analysis["situation_category"]
        letter = analysis["letter_text"]
        analysis_source = "free_text"
    else:
        emotion = payload.emotion
        intensity = payload.intensity
        situation_category = payload.situation_category
        # --- 편지: 미리 생성된 풀에서 조합 매칭 후 랜덤 선택 (실시간 LLM 호출 없음) ---
        letter = letter_service.pick_letter(emotion, situation_category, intensity)
        analysis_source = "structured"

    # --- XP / 레벨 ---
    # 0단계(튜토리얼, 온보딩 미완료)에서는 XP 시스템 자체를 적용하지 않음 (PROJECT_SUMMARY 9번 섹션)
    is_tutorial = user["level"] < 1 or not user["onboarding_completed"]
    if is_tutorial:
        xp_earned = 0
        xp_result = {"new_level": user["level"], "remaining_xp": user["current_xp"], "leveled_up": False}
    else:
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
            "source": analysis_source,
        },
    )
    if not is_tutorial:
        db_service.update_user_xp_level(user_id, xp_result["new_level"], xp_result["remaining_xp"], xp_earned)

    # --- 루틴 퀘스트 선정 (규칙기반, AI 호출 없음) + DB에 배정 ---
    quests = quest_service.get_routine_quests(emotion, count=3, recent_quest_titles=None)
    for q in quests:
        db_service.upsert_quest(q["id"], q["title"], q["description"], q["category"], q["xp"])
        db_service.assign_quest_to_user(user_id, q["id"])

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
