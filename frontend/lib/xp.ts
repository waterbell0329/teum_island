// backend/app/services/xp_service.py 의 레벨 공식과 동일하게 유지할 것 (게이지바 계산용).
const BASE_XP_TO_LEVEL_2 = 100;
const LEVEL_MULTIPLIER = 1.15;

export function xpRequiredForLevel(level: number): number {
  if (level < 1) return 0;
  let required = BASE_XP_TO_LEVEL_2;
  for (let i = 0; i < level - 1; i++) {
    required = Math.round(required * LEVEL_MULTIPLIER);
  }
  return required;
}
