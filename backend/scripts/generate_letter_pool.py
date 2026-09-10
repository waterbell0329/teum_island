"""
편지 풀 생성 스크립트 (공모전 공개 버전용)
- 공개 버전은 구조화입력(감정12 × 상황5 × 강도3 = 180조합)만 지원 -> 조합별로 편지 N개를 미리 생성
- 결과는 backend/app/data/letter_pool.json 에 저장, 서빙 시 여기서 랜덤 선택 (실시간 LLM 호출 0)
- **재개 가능**: 이미 N개 채운 조합은 건너뜀. 429(rate limit) 만나면 잠깐 쉬었다 재시도, 계속 막히면 저장하고 종료
- 실행: backend/ 에서  python scripts/generate_letter_pool.py  [--per-combo 3] [--limit N]

LLM: Groq (openai/gpt-oss-120b, reasoning_effort=low). Gemini 무료 쿼터가 하루 ~20회로
너무 낮아서 풀 생성엔 Groq 무료 티어를 씀. 배포된 서버는 이 JSON만 읽고 LLM 호출은 안 함.
"""
import argparse
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from groq import Groq
from groq import RateLimitError, APIStatusError
from app.core.config import settings

EMOTIONS = ["분노", "억울함", "무기력", "막막함", "서운함", "불안함", "지침",
            "뿌듯함", "설렘", "안심", "감사함", "홀가분함"]
SITUATIONS = ["직장/알바", "인간관계", "학업/진로", "미래불안", "기타"]
INTENSITIES = [1, 2, 3]

POSITIVE_EMOTIONS = {"뿌듯함", "설렘", "안심", "감사함", "홀가분함"}
FORBIDDEN_PHRASES = ["화이팅", "다 잘될거야", "누구나 그래", "긍정적으로 생각해"]
STRENGTH_CANDIDATES = ["인내심", "책임감", "유연성", "경계설정", "노력", "회복탄력성", "배려심"]

INTENSITY_LABEL = {1: "약간 힘듦(좋음)", 2: "많이 힘듦(좋음)", 3: "정말 힘듦(좋음)"}
INTENSITY_TONE = {1: "가볍고 발랄하게", 2: "따뜻하고 차분하게", 3: "진지하게 공감 우선, 과한 명랑함 자제"}

SYSTEM_PROMPT = """너는 무인도 숲속에 사는 작은 요정이야. 유저가 고른 오늘의 감정을 듣고 짧은 편지를 써줘.

말투: 다정하고 담백한 존댓말(~요/~예요체). 20~30대 사회초년생이 읽는 편지라 유치하지도, 과장되지도 않게. 반말 쓰지 마.
구조 (부정 감정): ① 그 감정을 느꼈을 상황을 담담히 인정 → ② 그 안에서 보이는 강점 하나 언급 → ③ 담백한 격려
구조 (긍정 감정): 절제 없이 격하게 축하하고 함께 기뻐하기 (그래도 존댓말 유지)

중요 규칙:
- 유저는 감정/상황범주/강도만 골랐고, 직접 쓴 문장은 없어. 그러니 구체적인 사건(누가 뭐라고 했는지, "그때/오늘 아침" 같은 특정 시점 등)을 절대 지어내지 마.
- 상황 "범주"에 공감하되 두루뭉술하게, "이런 날도 있죠" 정도의 결로.
- 과한 미사여구·비유·시적인 표현 자제. "당신의 고운 영혼", "가시 돋친 순간" 같은 표현 쓰지 마. 일상어로 담백하게.
- 마크다운 기호(**, *, # 등) 절대 쓰지 마. 강점 단어도 그냥 평문으로.
- 숲/바람 같은 요정 세계 배경은 편지당 최대 한 번만 살짝, 안 써도 됨.
- 금지 표현: 화이팅, 다 잘될거야, 누구나 그래, 긍정적으로 생각해
- 3~4문장, 문단 사이 빈 줄로 구분.
- 편지 본문만 출력 (인사말 머리/서명 없이)."""


# 편지마다 다른 각도로 쓰게 유도 (반복 방지)
ANGLES = [
    "첫 문장을 감정에 대한 공감이 아니라 '오늘 하루'나 '요즘' 같은 시간 이야기로 시작해봐.",
    "강점을 앞부분에 먼저 짚어주고 시작해봐.",
    "질문을 던지듯 부드럽게 시작해봐.",
    "차분하게 상황을 묘사하는 문장으로 담담하게 시작해봐.",
    "짧고 단정한 문장들로, 위로하는 느낌보다 곁에 있어주는 느낌으로 써봐.",
]


def build_user_msg(emotion, situation, intensity, existing=None, angle=None):
    tone = "긍정 감정이니 축하 톤으로" if emotion in POSITIVE_EMOTIONS else "위로 톤으로"
    msg = (
        f"감정: {emotion}\n"
        f"상황 범주: {situation}\n"
        f"강도: {INTENSITY_LABEL[intensity]}\n"
        f"톤: {tone}, {INTENSITY_TONE[intensity]}"
    )
    if emotion not in POSITIVE_EMOTIONS:
        msg += f"\n언급할 강점은 이 중에서 하나 골라: {', '.join(STRENGTH_CANDIDATES)}"
    if angle:
        msg += f"\n이번 편지는 이렇게: {angle}"
    if existing:
        joined = "\n".join(f"- {e[:60]}..." for e in existing)
        msg += f"\n\n아래는 같은 상황에 이미 쓴 편지들이야. 시작 문장과 표현이 확실히 다르게 써:\n{joined}"
    return msg


def _clean(text: str) -> str:
    """마크다운 기호 제거 + 문단 간 빈 줄 정리."""
    text = text.replace("**", "").replace("__", "")
    lines = [ln.strip().lstrip("*# ").rstrip() for ln in text.splitlines()]
    out, blank = [], False
    for ln in lines:
        if ln:
            out.append(ln); blank = False
        elif not blank:
            out.append(""); blank = True
    return "\n".join(out).strip()


def _save(pool, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(pool, f, ensure_ascii=False, indent=1)


def _generate(client, emotion, situation, intensity, existing=None, angle=None, max_429=6):
    """한 번 생성. rate limit이면 백오프 재시도, 계속 막히면 RateLimitError 재발생."""
    for attempt in range(max_429):
        try:
            resp = client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": build_user_msg(emotion, situation, intensity, existing, angle)},
                ],
                temperature=1.0,
                top_p=0.95,
                max_tokens=700,
                reasoning_effort="low",
            )
            return _clean((resp.choices[0].message.content or "").strip())
        except RateLimitError:
            if attempt == max_429 - 1:
                raise
            wait = 15 * (attempt + 1)
            print(f"    rate limit -> {wait}초 대기")
            time.sleep(wait)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--per-combo", type=int, default=3, help="조합당 생성할 편지 수")
    parser.add_argument("--sleep", type=float, default=1.5, help="호출 간 대기(초)")
    parser.add_argument("--limit", type=int, default=0, help="이번 실행에서 최대 생성 수 (0=제한없음)")
    args = parser.parse_args()

    out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            "app", "data", "letter_pool.json")

    pool = {}
    if os.path.exists(out_path):
        with open(out_path, encoding="utf-8") as f:
            pool = json.load(f)
        print(f"기존 풀 로드: {len(pool)}개 조합")

    client = Groq(api_key=settings.groq_api_key)

    total = len(EMOTIONS) * len(SITUATIONS) * len(INTENSITIES)
    made = 0

    for emotion in EMOTIONS:
        for situation in SITUATIONS:
            for intensity in INTENSITIES:
                key = f"{emotion}|{situation}|{intensity}"
                have = pool.get(key, [])
                need = args.per_combo - len(have)
                if need <= 0:
                    continue

                for _ in range(need):
                    if args.limit and made >= args.limit:
                        pool[key] = have
                        _save(pool, out_path)
                        print(f"\n--limit {args.limit} 도달. {made}개 생성 후 저장하고 종료.")
                        return
                    angle = ANGLES[len(have) % len(ANGLES)]
                    try:
                        text = _generate(client, emotion, situation, intensity, existing=have, angle=angle)
                    except RateLimitError:
                        pool[key] = have
                        _save(pool, out_path)
                        print(f"\nrate limit 지속. 지금까지 {made}개 생성. 저장됨: {out_path}")
                        print("잠시 후(또는 내일) 다시 실행하면 이어서 채움.")
                        return
                    except APIStatusError as e:
                        print(f"  [{key}] API 오류 {e.status_code}, 건너뜀")
                        continue

                    if not text:
                        print(f"  [{key}] 빈 응답, 건너뜀")
                        continue
                    if any(p in text for p in FORBIDDEN_PHRASES):
                        print(f"  [{key}] 금지표현 감지, 건너뜀")
                        continue
                    have.append(text)
                    made += 1
                    time.sleep(args.sleep)

                pool[key] = have
                _save(pool, out_path)
                filled = sum(1 for k in pool if len(pool[k]) >= args.per_combo)
                print(f"[{key}] {len(have)}개  (완료 조합 {filled}/{total}, 이번 세션 {made}개)")

    print(f"\n전체 완료. 조합 {len(pool)}개, 이번 세션 {made}개 생성.")


if __name__ == "__main__":
    main()
