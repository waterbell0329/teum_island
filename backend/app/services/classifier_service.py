"""
1단계: 감정 분류
- 자유텍스트 입력만 여기를 거침 (구조화 입력은 유저가 이미 감정을 골랐으므로 스킵)
- LoRA 파인튜닝된 Qwen2.5-1.5B-Instruct로 "문장 -> 12개 세부감정 라벨" 생성 (LoRA v2)
- 프롬프트/후처리(라벨 포함 매칭 안전장치)는 Colab 학습 노트북의 predict_emotion()과
  반드시 동일해야 함 -- 학습 때 본 형태와 다르면 정확도가 크게 떨어짐
"""
from app.core.config import settings

_model = None
_tokenizer = None

# synthetic_data_12class_v2.csv의 라벨을 sorted()한 것과 동일한 순서로 고정
# (Colab에서 `LABELS = sorted(df["label"].unique())`로 프롬프트를 만들었기 때문에
#  순서가 달라지면 모델이 학습 때 본 프롬프트와 미묘하게 달라짐)
LABELS = ["감사함", "막막함", "무기력", "분노", "불안함", "뿌듯함", "서운함", "설렘", "안심", "억울함", "지침", "홀가분함"]
LABEL_LIST_STR = ", ".join(LABELS)

# 목록에 없는 답이 나왔을 때(안전장치도 못 잡았을 때) 쓸 최후 폴백. 완전히 틀릴 바엔
# "확실친 않지만 부정적인 감정" 정도의 가장 무난한 값으로 둔다.
FALLBACK_LABEL = "막막함"


def _load():
    global _model, _tokenizer
    if _model is None:
        # torch/transformers/peft는 여기서 지연 임포트 (classifier_service를 안 쓰는
        # 요청에서도 서버 기동 시마다 무거운 임포트 비용을 물지 않기 위함)
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel

        _tokenizer = AutoTokenizer.from_pretrained(settings.emotion_lora_base_model)
        base_model = AutoModelForCausalLM.from_pretrained(
            settings.emotion_lora_base_model, torch_dtype=torch.float32
        )
        _model = PeftModel.from_pretrained(base_model, settings.emotion_lora_adapter_path)
        _model.eval()
    return _model, _tokenizer


def _build_prompt(text: str) -> str:
    return (
        f"다음 문장에서 느껴지는 감정을 아래 목록 중 하나로만 답해줘.\n"
        f"목록: {LABEL_LIST_STR}\n"
        f"규칙: 반드시 목록에 있는 단어 중 하나만 그대로 답해. 목록에 없는 새로운 단어를 만들지 마.\n"
        f"문장: {text}\n"
        f"감정:"
    )


def classify_emotion(text: str) -> dict:
    """자유텍스트 -> {predicted_group, confidence}"""
    import torch

    model, tokenizer = _load()
    prompt = _build_prompt(text)

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    with torch.no_grad():
        output = model.generate(**inputs, max_new_tokens=10, do_sample=False)
    generated = tokenizer.decode(output[0], skip_special_tokens=True)
    answer = generated.split("감정:")[-1].strip()

    # 안전장치: 정확히 일치하지 않아도 답변 안에 라벨 문자열이 포함되어 있으면 그걸로 매핑
    for label in LABELS:
        if label in answer:
            return {"predicted_group": label, "confidence": None}

    # 그래도 못 찾으면 원인 파악용으로 로그를 남기고 폴백 라벨 반환
    # (EmotionLogResponse.emotion이 Literal[12개]라서 목록 밖 값을 그대로 반환하면 응답 검증에서 500 남)
    print(f"[WARN] LoRA 분류기가 목록에 없는 답변을 냄: '{answer}' (문장: {text})")
    return {"predicted_group": FALLBACK_LABEL, "confidence": None}
