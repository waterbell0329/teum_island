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
  name: string; // 옷장에 표시할 이름
}

// 실제 누끼+크롭 후 픽셀 크기 (public/assets/character/levels/*.png)
const LEVEL_IMAGES: Record<number, CharacterLevelImage> = {
  1: { src: "/assets/character/levels/level1.png", w: 913, h: 737, name: "하얀 셔츠" },
  2: { src: "/assets/character/levels/level2.png", w: 998, h: 758, name: "베이지 조끼" },
  3: { src: "/assets/character/levels/level3.png", w: 971, h: 737, name: "포근한 니트" },
  4: { src: "/assets/character/levels/level4.png", w: 755, h: 754, name: "나뭇잎 망토" },
  5: { src: "/assets/character/levels/level5.png", w: 915, h: 644, name: "산뜻한 셔츠" },
  6: { src: "/assets/character/levels/level6.png", w: 967, h: 677, name: "단풍 스카프" },
};

export const MAX_LEVEL_IMAGE = 6;

/** 옷장에 보여줄 전체 캐릭터 옷 목록 (레벨 순). */
export function getAllCharacterOutfits(): { level: number; image: CharacterLevelImage }[] {
  return Object.keys(LEVEL_IMAGES)
    .map(Number)
    .sort((a, b) => a - b)
    .map((level) => ({ level, image: LEVEL_IMAGES[level] }));
}



/**
 * 유저 레벨에 맞는 "기본" 캐릭터 사진(그 레벨에 도달하면 자동으로 입는 옷).
 * - 레벨 0/1미만 -> 1레벨, 1~6 -> 해당, 7+ -> 6레벨 재사용
 */
export function getCharacterImageForLevel(level?: number | null): CharacterLevelImage {
  const lv = typeof level === "number" && level >= 1 ? level : 1;
  const clamped = Math.min(lv, MAX_LEVEL_IMAGE);
  return LEVEL_IMAGES[clamped] ?? LEVEL_IMAGES[1];
}

// --- 옷 착용(갈아입기) 상태 ---------------------------------------------------
// 옷장에서 "해금한(현재 레벨 이하) 다른 레벨 옷"을 골라 입을 수 있게 함 (3레벨이어도
// 1레벨 옷 착용 가능). 선택은 localStorage에 저장(백엔드 스키마 안 건드리고 클라 전용).
const EQUIPPED_KEY = "teum:equipped-outfit-level";

/** 착용 선택 저장. null이면 "레벨 기본 옷"으로 되돌림. */
export function setEquippedOutfitLevel(level: number | null): void {
  if (typeof window === "undefined") return;
  try {
    if (level == null) window.localStorage.removeItem(EQUIPPED_KEY);
    else window.localStorage.setItem(EQUIPPED_KEY, String(level));
  } catch {
    /* localStorage 접근 불가(프라이빗 모드 등) 시 무시 */
  }
}

/** 저장된 착용 선택 레벨(없으면 null). */
export function getEquippedOutfitLevel(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(EQUIPPED_KEY);
    return v == null ? null : Number(v);
  } catch {
    return null;
  }
}

/**
 * 실제로 화면에 보여줄 캐릭터 사진 결정.
 * - 착용 선택(equippedLevel)이 있고, 그게 현재 레벨로 이미 해금된 것이면 그 옷을 입음.
 * - 아니면(선택 없음/미해금) 레벨 기본 옷.
 */
export function resolveCharacterImage(userLevel?: number | null, equippedLevel?: number | null): CharacterLevelImage {
  const lv = typeof userLevel === "number" && userLevel >= 1 ? userLevel : 1;
  if (equippedLevel != null) {
    const eq = Math.min(equippedLevel, MAX_LEVEL_IMAGE);
    // 해금 조건: 착용하려는 옷 레벨 <= 현재 유저 레벨
    if (eq >= 1 && eq <= lv && LEVEL_IMAGES[eq]) return LEVEL_IMAGES[eq];
  }
  return getCharacterImageForLevel(lv);
}

// 6장 중 가장 큰 세로 픽셀 -- Character.tsx가 이 값을 기준으로 모든 레벨 사진을
// 동일 배율로 스케일해서, 레벨업으로 사진이 바뀌어도 캐릭터 크기가 튀지 않게 함.
export const REFERENCE_NATIVE_HEIGHT = Math.max(
  ...Object.values(LEVEL_IMAGES).map((i) => i.h)
); // = 758 (level2)
