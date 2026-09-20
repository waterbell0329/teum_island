// /input에서 레벨업이 발생하면 여기 적어두고, 홈 화면이 도착 직후 읽어서 LevelUpScreen을
// 띄움 (라우팅 이동 자체는 /input에서 바로 하고, 리빌 연출만 홈 화면에서 따로 재생).
export const PENDING_LEVELUP_KEY = "teum:pending-levelup";

export interface PendingLevelUp {
  newLevel: number;
}
