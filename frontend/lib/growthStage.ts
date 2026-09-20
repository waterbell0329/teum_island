// 성장 단계(옷) 매핑. 2026-09-19: 레벨마다 다른 옷(28종, lib/outfits.ts)을 입히던 방식에서
// 캐릭터/레벨업 연출 전용으로 훨씬 단순한 "3단계 통짜 이미지 스위칭"으로 전환함.
// 경계값은 기존 옷장 시스템의 시작(1~12)/도전(13~20)/성공(21~28) 3단계 구분을 그대로 따름
// -- 옷장 화면(lib/outfits.ts)은 컬렉션용으로 별개로 남겨두고 건드리지 않음.
export type GrowthStage = 0 | 1 | 2 | 3; // 0 = 레벨 0(온보딩 튜토리얼 중), 아직 옷 없음

const STAGE1_MAX_LEVEL = 12; // 시작 단계
const STAGE2_MAX_LEVEL = 20; // 도전 단계 (그 이상은 성공 단계)

export function getGrowthStage(level: number): GrowthStage {
  if (level < 1) return 0;
  if (level <= STAGE1_MAX_LEVEL) return 1;
  if (level <= STAGE2_MAX_LEVEL) return 2;
  return 3;
}

const STAGE_OUTFIT_ASSET: Record<1 | 2 | 3, string> = {
  1: "/assets/character/stage1.png",
  2: "/assets/character/stage2.png",
  3: "/assets/character/stage3.png",
};

/** Character.tsx가 몸통 이미지 위에 겹쳐 그릴 단계별 옷 오버레이 경로. 0단계(레벨 0)는 옷 없음. */
export function getStageOutfitAsset(stage: GrowthStage): string | null {
  return stage === 0 ? null : STAGE_OUTFIT_ASSET[stage];
}

// 각 단계를 대표하는 레벨 -- LevelUpScreen이 "이전 단계 옷"을 미리 보여줄 때
// getGrowthStage에 되돌려 넣을 대표값이 필요해서 둠 (실제 레벨 값 자체는 중요하지 않음).
const STAGE_REPRESENTATIVE_LEVEL: Record<1 | 2 | 3, number> = { 1: 1, 2: 13, 3: 21 };

export function representativeLevelForStage(stage: GrowthStage): number {
  return stage === 0 ? 0 : STAGE_REPRESENTATIVE_LEVEL[stage];
}
