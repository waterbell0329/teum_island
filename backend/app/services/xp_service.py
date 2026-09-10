"""
4단계 일부: XP 지급 / 레벨업 계산
(감정 프로필 요약은 profile_service.py 에서 별도 처리)
"""
from app.core.config import settings

XP_BY_INTENSITY = {1: 10, 2: 15, 3: 20}
LEVEL_MULTIPLIER = 1.15
BASE_XP_TO_LEVEL_2 = 100


def xp_for_record(intensity: int | None) -> int:
    """실제 지급 XP = 기본값 * 데모 배율.
    평소엔 DEMO_XP_MULTIPLIER=1(.env 기본값)이라 기본 로직과 동일하고,
    발표 당일에만 .env에서 배율을 올려서 레벨업이 눈에 띄게 빨리 보이도록 쓰는 용도.
    """
    base = XP_BY_INTENSITY.get(intensity, 10)
    return round(base * settings.demo_xp_multiplier)


def xp_required_for_level(level: int) -> int:
    """해당 레벨에서 다음 레벨로 가기 위해 필요한 XP"""
    if level < 1:
        return 0
    required = BASE_XP_TO_LEVEL_2
    for _ in range(level - 1):
        required = round(required * LEVEL_MULTIPLIER)
    return required


def apply_xp(current_level: int, current_xp: int, earned_xp: int) -> dict:
    """XP 지급 후 레벨업 여부 계산 (여러 레벨 한번에 오르는 경우도 처리)"""
    level = max(current_level, 1)  # 튜토리얼(0단계) 끝나면 1부터 시작
    xp = current_xp + earned_xp
    leveled_up = False

    while xp >= xp_required_for_level(level):
        xp -= xp_required_for_level(level)
        level += 1
        leveled_up = True

    return {"new_level": level, "remaining_xp": xp, "leveled_up": leveled_up}
