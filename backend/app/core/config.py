from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_service_key: str  # service_role key (백엔드 전용, 절대 프론트에 노출 X)

    # LLM API
    anthropic_api_key: str = ""   # Claude Haiku 쓸 경우
    google_api_key: str = ""      # Gemini 쓸 경우 (자유텍스트 경로용, 무료 쿼터 하루 ~20회로 매우 낮음)
    # 이 API 키는 gemini-2.x 안정 모델이 404("no longer available to new users")라
    # 3.x 라인만 사용 가능. gemini-3.5-flash가 품질/속도 균형 무난.
    gemini_model: str = "gemini-3.5-flash"

    # Groq — 편지 풀 생성용 (무료 티어). 서빙 시엔 안 씀(풀 JSON만 읽음)
    # gpt-oss-120b: reasoning/content 분리 깔끔, 한국어 자연스럽고 빠름. TPM 8000이라 분당 ~9콜.
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"

    # 감정 분류기 (베이스라인 모델, 현재 미사용) 로드 경로
    emotion_model_path: str = "./models/emotion_baseline_model.joblib"

    # 감정 분류기 LoRA 어댑터 경로 (Qwen2.5-1.5B-Instruct 베이스 + PEFT 어댑터)
    emotion_lora_base_model: str = "Qwen/Qwen2.5-1.5B-Instruct"
    emotion_lora_adapter_path: str = "./models/emotion_lora_adapter_v2"

    # 데모용 XP 배율 (평소 1.0, 발표 당일에만 .env에서 올려서 레벨업을 빨리 보여주는 용도)
    demo_xp_multiplier: float = 1.0

    class Config:
        env_file = ".env"


settings = Settings()
