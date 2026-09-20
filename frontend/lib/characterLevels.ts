// 레벨별 캐릭터 통짜 사진 매핑. 2026-09-20: "옷 오버레이(stage1/2/3.png)" 방식에서
// "레벨마다 옷을 이미 입고 있는 캐릭터 사진 한 장을 통째로 교체"하는 방식으로 전환함.
// 채영님이 레벨별로 옷 입은 캐릭터 일러스트를 그려주면 그 사진으로 갈아끼움.
// (현재 레벨 1~6까지 반영. 그 이상은 최고 레벨 사진을 재사용.)
//
// 각 사진은 원본 픽셀 비율이 조금씩 다르므로(누끼+크롭 결과), 화면에서 캐릭터가
// 들쭉날쭉해 보이지 않도록 "가장 큰 세로 기준"으로 정규화해서 렌더링한다(Character.tsx).

export interface CharacterLevelImage {
  src: string;
  w: number;
  h: number;
}

// 실제 누끼+크롭 후 픽셀 크기 (public/assets/character/levels/*.png)
const LEVEL_IMAGES: Record<number, CharacterLevelImage> = {
  1: { src: "/assets/character/levels/level1.png", w: 913, h: 737 },
  2: { src: "/assets/character/levels/level2.png", w: 998, h: 758 },
  3: { src: "/assets/character/levels/level3.png", w: 971, h: 737 },
  4: { src: "/assets/character/levels/level4.png", w: 755, h: 754 },
  5: { src: "/assets/character/levels/level5.png", w: 915, h: 644 },
  6: { src: "/assets/character/levels/level6.png", w: 967, h: 677 },
};

export const MAX_LEVEL_IMAGE = 6;

/**
 * 유저 레벨에 맞는 캐릭터 사진을 반환.
 * - 레벨 0(온보딩 튜토리얼 등 아직 레벨 없음) 또는 1 미만 -> 1레벨 사진
 * - 레벨 1~6 -> 해당 사진
 * - 레벨 7 이상 -> 6레벨(현재 최고) 사진 재사용
 */
export function getCharacterImageForLevel(level?: number | null): CharacterLevelImage {
  const lv = typeof level === "number" && level >= 1 ? level : 1;
  const clamped = Math.min(lv, MAX_LEVEL_IMAGE);
  return LEVEL_IMAGES[clamped] ?? LEVEL_IMAGES[1];
}

// 6장 중 가장 큰 세로 픽셀 -- Character.tsx가 이 값을 기준으로 모든 레벨 사진을
// 동일 배율로 스케일해서, 레벨업으로 사진이 바뀌어도 캐릭터 크기가 튀지 않게 함.
export const REFERENCE_NATIVE_HEIGHT = Math.max(
  ...Object.values(LEVEL_IMAGES).map((i) => i.h)
); // = 758 (level2)
