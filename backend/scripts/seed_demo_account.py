"""
데모용 시드 데이터 스크립트
- 발표 당일 "이미 한동안 써온 계정"처럼 보이도록, 12개 감정을 각각 한 번씩 담은
  가짜 기록을 미리 채워넣는다.
- Gemini API는 절대 호출하지 않는다 (편지/분석은 전부 미리 손으로 써둔 고정 문구) --
  안 그래도 무료 쿼터가 빠듯한데 시드 데이터 만드느라 쿼터를 태울 이유가 없음.
- 실행: backend/ 디렉토리에서 `python scripts/seed_demo_account.py [옵션]`

사용 예시:
  # 새 데모 전용 계정을 만들어서 시딩 (이메일/비번 기반 Auth 계정, 구글로그인 아님)
  python scripts/seed_demo_account.py

  # 발표 때 실제 로그인할 구글 계정(이미 auth.users에 있는 uuid)에 시딩
  python scripts/seed_demo_account.py --user-id <실제 구글로그인 유저의 uuid>

  # 이미 시딩한 계정을 지우고 다시 채우고 싶을 때
  python scripts/seed_demo_account.py --user-id <uuid> --reset
"""
import argparse
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase_client import get_supabase  # noqa: E402
from app.services import db_service, xp_service  # noqa: E402

DEFAULT_EMAIL = "demo@teumisland.local"
DEFAULT_PASSWORD = "TeumIslandDemo!2026"
DEFAULT_NICKNAME = "데모"

PROFILE_SUMMARY = (
    "직장/알바에서의 스트레스와 인간관계에서 오는 서운함을 자주 겪지만, "
    "그때마다 인내심과 배려심으로 잘 버텨내는 편. 학업/진로 관련해서는 불안함을 "
    "느끼면서도 꾸준히 노력하는 모습을 보임. 작은 성취에도 크게 기뻐할 줄 아는 사람."
)

# (emotion, situation_category, intensity, raw_text, situation_summary, strengths, keywords, letter_text)
SEED_RECORDS = [
    ("분노", "직장/알바", 3,
     "알바하다가 손님이 반말로 소리질러서 진짜 화났다",
     "알바 중 손님에게 이유 없이 반말과 고성을 들어 화가 난 상황",
     ["인내심"], ["알바", "손님", "무례함"],
     "손님이 대뜸 반말로 소리를 질렀다니, 그 순간 얼마나 황당하고 분했을지 짐작이 가요.\n\n"
     "그런 무례함 앞에서도 자리를 지키고 상황을 넘긴 건, 감정에 휩쓸리지 않으려는 단단한 인내심 덕분이었을 거예요.\n\n"
     "오늘만큼은 그 화, 참지 말고 이 편지에다 다 쏟아버려도 괜찮아요."),
    ("억울함", "직장/알바", 2,
     "내가 안 한 실수인데 나만 혼났다",
     "본인이 하지 않은 실수로 혼자 질책을 받은 상황",
     ["유연성"], ["직장", "오해", "질책"],
     "내가 하지도 않은 실수로 혼자 혼났다니, 억울함이 마음 한켠에 계속 남아있을 것 같아요.\n\n"
     "그 상황에서도 굳이 나서서 반박하지 않고 상황을 정리한 건, 갈등을 키우지 않으려는 유연함이 있었기 때문이겠죠.\n\n"
     "오늘 하루는 억울했던 마음, 잠시 내려놓고 쉬어가요."),
    ("무기력", "기타", 2,
     "요즘 뭘 해도 손이 안 가고 그냥 눕고 싶다",
     "무기력감에 아무 일에도 의욕이 나지 않는 상황",
     ["회복탄력성"], ["무기력", "의욕저하"],
     "요즘 뭘 해도 손이 잘 안 간다니, 마음의 배터리가 많이 닳아있는 것 같아요.\n\n"
     "그런 와중에도 하루하루를 그냥 흘려보내지 않고 버텨낸 것 자체가 회복탄력성이 있다는 증거예요.\n\n"
     "오늘은 억지로 뭔가 하려 하지 말고, 눕고 싶은 만큼 눕는 것도 좋은 선택이에요."),
    ("막막함", "학업/진로", 3,
     "이제 뭐부터 해야될지 하나도 모르겠음 진짜",
     "진로에 대해 무엇부터 해야 할지 갈피를 못 잡는 상황",
     ["책임감"], ["진로", "막막함", "계획"],
     "뭐부터 해야 할지 하나도 안 보인다니, 눈앞이 캄캄한 기분이었겠어요.\n\n"
     "그런 막막함 속에서도 손 놓지 않고 계속 고민하고 있다는 것 자체가 책임감의 증거예요.\n\n"
     "오늘은 답을 찾으려 애쓰기보다, 그냥 막막한 마음을 그대로 인정해주는 것부터 시작해봐요."),
    ("서운함", "인간관계", 1,
     "연락 잘 안 하는 애 때문에 살짝 서운했음",
     "연락이 뜸한 친구 때문에 서운함을 느낀 상황",
     ["배려심"], ["친구", "연락", "서운함"],
     "연락이 뜸한 친구 때문에 마음 한구석이 살짝 서운했겠어요.\n\n"
     "그럼에도 크게 티내지 않고 넘어간 건, 관계를 소중히 여기는 배려심 덕분이었을 거예요.\n\n"
     "서운한 마음, 굳이 숨기지 않아도 괜찮으니 오늘은 그 감정 그대로 인정해줘요."),
    ("불안함", "학업/진로", 2,
     "발표 앞두고 계속 초조한 느낌이 든다",
     "발표를 앞두고 긴장과 불안을 느끼는 상황",
     ["노력"], ["발표", "불안", "긴장"],
     "발표를 앞두고 계속 초조한 마음이 든다니, 그만큼 잘 해내고 싶은 마음이 큰 거겠죠.\n\n"
     "불안한 와중에도 준비를 손에서 놓지 않은 건 꾸준한 노력 덕분이에요.\n\n"
     "오늘 밤은 걱정은 잠시 내려두고 편하게 쉬어가요."),
    ("지침", "직장/알바", 3,
     "이번주 계속 야근해서 완전 방전됐다",
     "연속된 야근으로 심신이 완전히 지친 상황",
     ["노력"], ["야근", "번아웃", "체력"],
     "이번 주 내내 야근했다니, 몸도 마음도 완전히 방전됐겠어요.\n\n"
     "그럼에도 끝까지 자리를 지켜낸 건 정말 큰 노력이었어요.\n\n"
     "오늘만큼은 아무것도 하지 말고 푹 쉬는 걸 최우선으로 둬요."),
    ("뿌듯함", "학업/진로", 2,
     "드디어 끝냈다 나 진짜 잘한듯",
     "오래 준비한 일을 마침내 끝낸 상황",
     ["노력"], ["성취", "완료", "뿌듯함"],
     "드디어 끝냈다고요?! 정말 축하해요!\n\n"
     "그 긴 과정을 끝까지 밀고 나간 거, 진짜 대단한 일이에요.\n\n"
     "오늘 하루는 마음껏 뿌듯해하고 스스로를 칭찬해줘도 돼요, 진짜 잘했어요!"),
    ("설렘", "기타", 2,
     "내일 여행가는데 벌써부터 기분 좋다",
     "다가올 여행을 앞두고 설레는 상황",
     ["회복탄력성"], ["여행", "설렘", "기대감"],
     "내일 여행이라니, 벌써부터 설레는 게 눈에 보여요!\n\n"
     "그 기대감 그대로 만끽하면서 오늘 밤 푹 자고 내일을 맞이해요.\n\n"
     "좋은 일 앞두고 있다는 것만으로도 오늘 하루가 반짝반짝 빛나요!"),
    ("안심", "학업/진로", 1,
     "결과 나왔는데 다행히 잘 됐다 마음 편해짐",
     "걱정하던 결과가 잘 나와 안도한 상황",
     ["회복탄력성"], ["결과", "안도", "합격"],
     "결과가 잘 나왔다니 정말 다행이에요!\n\n"
     "그동안 마음 졸였던 시간들이 있었기에 이 안도감이 더 크게 느껴지는 거겠죠.\n\n"
     "오늘은 그 편안한 마음 그대로 즐기면서 푹 쉬어요."),
    ("감사함", "인간관계", 2,
     "챙겨줘서 진짜 고마웠다 눈물날뻔",
     "주변 사람의 배려에 큰 고마움을 느낀 상황",
     ["배려심"], ["고마움", "관계", "챙김"],
     "누군가 그렇게 챙겨줬다니, 마음이 몽글몽글해지네요.\n\n"
     "그 고마움을 온전히 느낄 수 있는 것도 배려심 많은 당신이기에 가능한 일이에요.\n\n"
     "오늘 하루는 그 따뜻한 마음을 오래 간직해봐요."),
    ("홀가분함", "직장/알바", 2,
     "드디어 다 끝나서 발 뻗고 잘 수 있을듯",
     "오래 끌던 업무를 마무리해 홀가분해진 상황",
     ["책임감"], ["마무리", "홀가분함", "휴식"],
     "드디어 다 끝났다니, 그 홀가분함이 여기까지 느껴져요!\n\n"
     "끝까지 붙잡고 마무리해낸 거, 정말 큰 노력이었어요.\n\n"
     "오늘 밤은 아무 걱정 없이 다리 쭉 뻗고 푹 자요."),
]


def find_or_create_auth_user(email: str, password: str) -> str:
    sb = get_supabase()
    try:
        res = sb.auth.admin.create_user(
            {"email": email, "email_confirm": True, "password": password}
        )
        print(f"새 Auth 계정 생성: {email}")
        return res.user.id
    except Exception as e:
        print(f"[INFO] 계정 생성 실패(이미 있을 수 있음): {e} -- 기존 계정 조회 시도")
        users = sb.auth.admin.list_users()
        for u in users:
            if u.email == email:
                print(f"기존 Auth 계정 재사용: {email} ({u.id})")
                return u.id
        raise RuntimeError(f"'{email}' 계정을 만들지도, 찾지도 못했음") from e


def seed(user_id: str, nickname: str, reset: bool) -> None:
    if reset:
        print("기존 기록/프로필 삭제 중...")
        db_service.delete_emotion_logs_for_user(user_id)
        db_service.delete_emotion_profile(user_id)

    db_service.complete_onboarding(user_id, nickname)

    level, xp = 1, 0
    now = datetime.now(timezone.utc)

    for i, (emotion, situation, intensity, raw_text, summary, strengths, keywords, letter) in enumerate(SEED_RECORDS):
        # 최근 것부터 거꾸로 하루~이틀씩 과거로 흩뿌려서 "예전부터 써온 계정"처럼 보이게 함
        created_at = (now - timedelta(days=(len(SEED_RECORDS) - i) * 1.5)).isoformat()

        analysis = {
            "situation_summary": summary,
            "core_emotion": emotion,
            "possible_strengths": strengths,
            "context_keywords": keywords,
            "intensity": intensity,
        }
        xp_earned = xp_service.xp_for_record(intensity)

        db_service.insert_emotion_log(
            user_id=user_id,
            input_type="structured",
            emotion=emotion,
            intensity=intensity,
            raw_text=raw_text,
            analysis_json=analysis,
            letter_text=letter,
            xp_earned=xp_earned,
            situation_category=situation,
            created_at=created_at,
        )

        result = xp_service.apply_xp(current_level=level, current_xp=xp, earned_xp=xp_earned)
        level, xp = result["new_level"], result["remaining_xp"]
        db_service.update_user_xp_level(user_id, level, xp, xp_earned)

    db_service.upsert_emotion_profile(user_id, PROFILE_SUMMARY)

    print(f"\n완료: user_id={user_id}, nickname={nickname}")
    print(f"최종 레벨={level}, 잔여 XP={xp}, 기록 {len(SEED_RECORDS)}개 시딩됨")


def main():
    parser = argparse.ArgumentParser(description="데모용 시드 데이터 채우기")
    parser.add_argument("--user-id", help="이미 존재하는 auth 유저 uuid (예: 발표 때 로그인할 구글 계정)")
    parser.add_argument("--email", default=DEFAULT_EMAIL, help="--user-id 없을 때 만들 이메일/비번 계정 이메일")
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    parser.add_argument("--nickname", default=DEFAULT_NICKNAME)
    parser.add_argument("--reset", action="store_true", help="기존 기록을 지우고 다시 채움")
    args = parser.parse_args()

    user_id = args.user_id or find_or_create_auth_user(args.email, args.password)
    seed(user_id, args.nickname, args.reset)


if __name__ == "__main__":
    main()
