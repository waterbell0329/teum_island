"""
자유텍스트("편하게 쓰기") 경로 QA용 샘플 생성 스크립트
- 목적: 실제 서비스에 붙이기 전에, Groq가 다양한 자유글에 대해 감정분류+편지를
  얼마나 안정적으로 잘 뽑아내는지 100~200개 정도 미리 돌려서 눈으로 검수하기 위함
  (letter_service.analyze_free_text()를 그대로 쓰지 않고 이 스크립트가 직접 Groq를
  호출함 -- analyze_free_text()는 실패 시 조용히 폴백해버려서, 검수용으로는 진짜
  레이트리밋에 걸렸는지 안 걸렸는지가 안 보이기 때문)
- 무료 티어 한도(2026-09-18 기준, openai/gpt-oss-120b): RPM 30 / RPD 1,000 /
  TPM 8,000 / TPD 200,000. 병목은 TPM/TPD라서 호출 간격 기본 13초 + max_tokens
  400으로 줄여서 하루 200,000토큰 안에서 여유있게 100~200개 뽑을 수 있게 세팅함.
- **재개 가능**: 이미 만든 (샘플 인덱스, 반복회차) 조합은 건너뜀. 429(레이트리밋) 만나면
  잠깐 쉬었다 재시도, 계속 막히면 그때까지 만든 것 저장하고 종료.
- 실행: backend/ 에서
    python scripts/generate_free_text_samples.py --count 150
  (--count 는 만들 총 개수, 기본 150 -- 100~200 사이 원하는 값으로 조절)
"""
import argparse
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from groq import Groq, RateLimitError  # noqa: E402
from app.core.config import settings  # noqa: E402
from app.services.letter_service import FREE_TEXT_SYSTEM_PROMPT  # noqa: E402 (프롬프트는 실서비스와 동일한 걸 씀)

# 상황/감정/강도가 골고루 섞이도록 손으로 쓴 예시 자유글 -- 실제 유저가 쓸 법한 말투로
SAMPLE_TEXTS = [
    "알바하다가 손님이 대뜸 반말로 소리질러서 진짜 어이없었다. 하루종일 기분 안 좋음.",
    "팀장이 내가 안 한 실수를 나한테 뒤집어씌워서 억울해 죽겠다.",
    "요즘 뭘 해도 손이 안 가고 그냥 눕고만 싶다. 의욕이 하나도 없음.",
    "취업 준비 뭐부터 해야 될지 하나도 모르겠어서 눈앞이 캄캄하다.",
    "친구가 요즘 연락을 너무 안 받아서 살짝 서운했다.",
    "내일 발표인데 계속 초조하고 심장이 벌렁거린다.",
    "이번주 계속 야근해서 완전 방전됐다. 진짜 힘들다.",
    "드디어 프로젝트 끝냈다! 나 진짜 잘한 것 같음.",
    "내일 여행가는데 벌써부터 기분 좋아서 잠이 안 온다.",
    "면접 결과 나왔는데 다행히 붙었다. 마음이 진짜 편해졌다.",
    "친구가 힘들 때 옆에서 챙겨줘서 눈물날 뻔했다. 너무 고마움.",
    "드디어 다 끝내서 오늘은 발 뻗고 잘 수 있을 것 같다. 홀가분해.",
    "상사가 자꾸 퇴근시간 다 돼서 일 던져줘서 스트레스 받는다.",
    "동기가 뒤에서 내 얘기하고 다닌다는 거 알고 나서 관계에 회의감 든다.",
    "이직할지 말지 계속 고민만 하고 결정을 못 내리겠다.",
    "미래에 뭘 해야 될지 아직도 감이 안 잡혀서 불안하다.",
    "룸메이트랑 자꾸 사소한 걸로 부딪혀서 피곤하다.",
    "시험 공부 진짜 열심히 했는데 성적이 그대로라 허탈하다.",
    "오늘 처음으로 발표를 무사히 마쳤다. 스스로가 대견하다.",
    "가족이랑 오랜만에 통화했는데 그냥 다 괜찮다고 해줘서 마음이 놓였다.",
    "새로운 프로젝트 맡았는데 잘 해낼 수 있을지 걱정되면서도 설렌다.",
    "요즘 계속 야근에 주말출근까지 겹쳐서 몸도 마음도 지쳤다.",
    "친한 친구랑 크게 싸워서 마음이 계속 무겁다.",
    "드디어 자격증 시험에 합격했다는 문자를 받았다! 믿기지가 않는다.",
    "이번 학기 성적이 잘 나와서 부모님한테 자랑하고 싶다.",
]

MAX_429_RETRIES = 6
DEFAULT_SLEEP = 13  # 초, TPM 8000 기준 여유있게 잡은 간격
DEFAULT_MAX_TOKENS = 400  # 편지 3~4문장이면 이 정도로 충분, 토큰 아끼기용


def _call_groq(client, text: str, max_tokens: int, max_429: int = MAX_429_RETRIES) -> dict:
    for attempt in range(max_429):
        try:
            resp = client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": FREE_TEXT_SYSTEM_PROMPT},
                    {"role": "user", "content": text},
                ],
                temperature=0.85,
                max_tokens=max_tokens,
                reasoning_effort="low",
                response_format={"type": "json_object"},
            )
            return json.loads(resp.choices[0].message.content or "{}")
        except RateLimitError:
            if attempt == max_429 - 1:
                raise
            wait = 15 * (attempt + 1)
            print(f"    rate limit -> {wait}초 대기")
            time.sleep(wait)


def _save(results, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=1)


def main():
    parser = argparse.ArgumentParser(description="자유텍스트 경로 QA용 샘플 대량 생성")
    parser.add_argument("--count", type=int, default=150, help="만들 총 개수 (100~200 권장)")
    parser.add_argument("--sleep", type=float, default=DEFAULT_SLEEP, help="호출 간 대기(초)")
    parser.add_argument("--max-tokens", type=int, default=DEFAULT_MAX_TOKENS)
    parser.add_argument("--out", default=None, help="결과 저장 경로 (기본: scripts/free_text_qa_results.json)")
    args = parser.parse_args()

    out_path = args.out or os.path.join(os.path.dirname(os.path.abspath(__file__)), "free_text_qa_results.json")

    results = []
    done_keys = set()
    if os.path.exists(out_path):
        with open(out_path, encoding="utf-8") as f:
            results = json.load(f)
        done_keys = {(r["sample_index"], r["repeat"]) for r in results}
        print(f"기존 결과 {len(results)}개 로드, 이어서 진행")

    client = Groq(api_key=settings.groq_api_key)

    made = 0
    repeat = 0
    while made < args.count:
        for i, text in enumerate(SAMPLE_TEXTS):
            if made >= args.count:
                break
            if (i, repeat) in done_keys:
                continue

            print(f"[{made + 1}/{args.count}] sample={i} repeat={repeat}: {text[:30]}...")
            try:
                data = _call_groq(client, text, args.max_tokens)
            except RateLimitError:
                print("레이트리밋 한도 도달. 지금까지 만든 것 저장하고 종료.")
                _save(results, out_path)
                return

            results.append({
                "sample_index": i,
                "repeat": repeat,
                "input_text": text,
                "emotion": data.get("emotion"),
                "situation_category": data.get("situation_category"),
                "intensity": data.get("intensity"),
                "letter_text": data.get("letter_text"),
            })
            made += 1
            _save(results, out_path)  # 매번 즉시 저장 (중간에 멈춰도 안 날아가게)
            time.sleep(args.sleep)
        repeat += 1

    print(f"\n완료: 총 {len(results)}개 -> {out_path}")


if __name__ == "__main__":
    main()
