// 레벨업 = "옷 갈아입기" (PROJECT_SUMMARY 2번 섹션: 캐릭터는 진화가 아니라 옷 갈아입기로 성장 표현).
// 1~12레벨: 시작 단계 의상 12종 (2026-09-13 반영, "시작 단계 의상들" 폴더 크롭).
// 13~20레벨: 도전 단계 의상 8종 (2026-09-13 반영, "도전 단계 의상들" 폴더 크롭).
// 21~28레벨: 성공 단계 의상 8종 (2026-09-13 반영, "성공 단계 의상들" 폴더 크롭).

export interface Outfit {
  level: number;
  slug: string;
  name: string;
  front: string;
  back: string;
  side: string;
  /** front.png 원본 픽셀 크기 -- Character.tsx가 body와 같은 scale로 비율 맞춰 그릴 때 씀 */
  frontNative: { w: number; h: number };
}

const BASE = "/assets/closet/level1";

export const LEVEL1_OUTFITS: Outfit[] = [
  { level: 1, slug: "01-winter-cloak", name: "겨울용 망토", front: `${BASE}/01-winter-cloak-front.png`, back: `${BASE}/01-winter-cloak-back.png`, side: `${BASE}/01-winter-cloak-side.png`, frontNative: { w: 138, h: 121 } },
  { level: 2, slug: "02-plaid-cloak", name: "격자무늬 망토", front: `${BASE}/02-plaid-cloak-front.png`, back: `${BASE}/02-plaid-cloak-back.png`, side: `${BASE}/02-plaid-cloak-side.png`, frontNative: { w: 168, h: 120 } },
  { level: 3, slug: "03-plaid-tunic", name: "격자무늬 튜닉", front: `${BASE}/03-plaid-tunic-front.png`, back: `${BASE}/03-plaid-tunic-back.png`, side: `${BASE}/03-plaid-tunic-side.png`, frontNative: { w: 165, h: 111 } },
  { level: 4, slug: "04-basic-shirt", name: "기본 셔츠", front: `${BASE}/04-basic-shirt-front.png`, back: `${BASE}/04-basic-shirt-back.png`, side: `${BASE}/04-basic-shirt-side.png`, frontNative: { w: 160, h: 113 } },
  { level: 5, slug: "05-leaf-cloak-beige", name: "나뭇잎 망토 (베이지 끈)", front: `${BASE}/05-leaf-cloak-beige-front.png`, back: `${BASE}/05-leaf-cloak-beige-back.png`, side: `${BASE}/05-leaf-cloak-beige-side.png`, frontNative: { w: 174, h: 122 } },
  { level: 6, slug: "06-leaf-cloak-red", name: "나뭇잎 망토 (빨간끈)", front: `${BASE}/06-leaf-cloak-red-front.png`, back: `${BASE}/06-leaf-cloak-red-back.png`, side: `${BASE}/06-leaf-cloak-red-side.png`, frontNative: { w: 175, h: 128 } },
  { level: 7, slug: "07-leaf-vest", name: "나뭇잎 패턴 조끼", front: `${BASE}/07-leaf-vest-front.png`, back: `${BASE}/07-leaf-vest-back.png`, side: `${BASE}/07-leaf-vest-side.png`, frontNative: { w: 114, h: 123 } },
  { level: 8, slug: "08-maple-cloak", name: "단풍 패턴 망토", front: `${BASE}/08-maple-cloak-front.png`, back: `${BASE}/08-maple-cloak-back.png`, side: `${BASE}/08-maple-cloak-side.png`, frontNative: { w: 172, h: 124 } },
  { level: 9, slug: "09-plain-cloak", name: "민무늬 망토", front: `${BASE}/09-plain-cloak-front.png`, back: `${BASE}/09-plain-cloak-back.png`, side: `${BASE}/09-plain-cloak-side.png`, frontNative: { w: 169, h: 128 } },
  { level: 10, slug: "10-plain-tunic", name: "민무늬 튜닉", front: `${BASE}/10-plain-tunic-front.png`, back: `${BASE}/10-plain-tunic-back.png`, side: `${BASE}/10-plain-tunic-side.png`, frontNative: { w: 166, h: 113 } },
  { level: 11, slug: "11-pink-tshirt", name: "핑크 티셔츠", front: `${BASE}/11-pink-tshirt-front.png`, back: `${BASE}/11-pink-tshirt-back.png`, side: `${BASE}/11-pink-tshirt-side.png`, frontNative: { w: 167, h: 120 } },
  { level: 12, slug: "12-shoulder-leaf-top", name: "어깨 나뭇잎 상의", front: `${BASE}/12-shoulder-leaf-top-front.png`, back: `${BASE}/12-shoulder-leaf-top-back.png`, side: `${BASE}/12-shoulder-leaf-top-side.png`, frontNative: { w: 157, h: 124 } },
];

const BASE2 = "/assets/closet/level2";

export const CHALLENGE_OUTFITS: Outfit[] = [
  { level: 13, slug: "13-leather-strap-tunic", name: "사선 가죽끈 상의", front: `${BASE2}/13-leather-strap-tunic-front.png`, back: `${BASE2}/13-leather-strap-tunic-back.png`, side: `${BASE2}/13-leather-strap-tunic-side.png`, frontNative: { w: 166, h: 120 } },
  { level: 14, slug: "14-plaid-vest-tunic", name: "녹색 격자 조끼", front: `${BASE2}/14-plaid-vest-tunic-front.png`, back: `${BASE2}/14-plaid-vest-tunic-back.png`, side: `${BASE2}/14-plaid-vest-tunic-side.png`, frontNative: { w: 166, h: 124 } },
  { level: 15, slug: "15-leaf-epaulette-tunic", name: "어깨 나뭇잎 상의 (녹색)", front: `${BASE2}/15-leaf-epaulette-tunic-front.png`, back: `${BASE2}/15-leaf-epaulette-tunic-back.png`, side: `${BASE2}/15-leaf-epaulette-tunic-side.png`, frontNative: { w: 170, h: 123 } },
  { level: 16, slug: "16-quilted-stitch-tunic", name: "사각형 패턴 상의", front: `${BASE2}/16-quilted-stitch-tunic-front.png`, back: `${BASE2}/16-quilted-stitch-tunic-back.png`, side: `${BASE2}/16-quilted-stitch-tunic-side.png`, frontNative: { w: 164, h: 112 } },
  { level: 17, slug: "17-vine-strap-tunic", name: "소매 덩굴 상의", front: `${BASE2}/17-vine-strap-tunic-front.png`, back: `${BASE2}/17-vine-strap-tunic-back.png`, side: `${BASE2}/17-vine-strap-tunic-side.png`, frontNative: { w: 165, h: 117 } },
  { level: 18, slug: "18-rollup-sleeve-tunic", name: "소매 롤업 셔츠", front: `${BASE2}/18-rollup-sleeve-tunic-front.png`, back: `${BASE2}/18-rollup-sleeve-tunic-back.png`, side: `${BASE2}/18-rollup-sleeve-tunic-side.png`, frontNative: { w: 172, h: 121 } },
  { level: 19, slug: "19-embroidered-tunic", name: "목선 자수 상의", front: `${BASE2}/19-embroidered-tunic-front.png`, back: `${BASE2}/19-embroidered-tunic-back.png`, side: `${BASE2}/19-embroidered-tunic-side.png`, frontNative: { w: 163, h: 121 } },
  { level: 20, slug: "20-colorful-leaf-cloak", name: "단풍 나뭇잎 망토", front: `${BASE2}/20-colorful-leaf-cloak-front.png`, back: `${BASE2}/20-colorful-leaf-cloak-back.png`, side: `${BASE2}/20-colorful-leaf-cloak-side.png`, frontNative: { w: 163, h: 122 } },
];

const BASE3 = "/assets/closet/level3";

export const SUCCESS_OUTFITS: Outfit[] = [
  { level: 21, slug: "21-autumn-whisper", name: "가을의 속삭임", front: `${BASE3}/21-autumn-whisper-front.png`, back: `${BASE3}/21-autumn-whisper-back.png`, side: `${BASE3}/21-autumn-whisper-side.png`, frontNative: { w: 176, h: 125 } },
  { level: 22, slug: "22-sunset-march", name: "갈라진 노을의 행진", front: `${BASE3}/22-sunset-march-front.png`, back: `${BASE3}/22-sunset-march-back.png`, side: `${BASE3}/22-sunset-march-side.png`, frontNative: { w: 173, h: 121 } },
  { level: 23, slug: "23-burning-sunset", name: "불타는 저녁 노을", front: `${BASE3}/23-burning-sunset-front.png`, back: `${BASE3}/23-burning-sunset-back.png`, side: `${BASE3}/23-burning-sunset-side.png`, frontNative: { w: 163, h: 113 } },
  { level: 24, slug: "24-earth-breath-wrap", name: "얽혀있는 대지의 숨결", front: `${BASE3}/24-earth-breath-wrap-front.png`, back: `${BASE3}/24-earth-breath-wrap-back.png`, side: `${BASE3}/24-earth-breath-wrap-side.png`, frontNative: { w: 100, h: 123 } },
  { level: 25, slug: "25-leaf-memory-vest", name: "잎새에 새긴 대지의 기억", front: `${BASE3}/25-leaf-memory-vest-front.png`, back: `${BASE3}/25-leaf-memory-vest-back.png`, side: `${BASE3}/25-leaf-memory-vest-side.png`, frontNative: { w: 109, h: 117 } },
  { level: 26, slug: "26-shimmering-earth", name: "찬란하게 반짝이는 대지", front: `${BASE3}/26-shimmering-earth-front.png`, back: `${BASE3}/26-shimmering-earth-back.png`, side: `${BASE3}/26-shimmering-earth-side.png`, frontNative: { w: 164, h: 122 } },
  { level: 27, slug: "27-blooming-flower-dance", name: "피어나는 꽃의 춤", front: `${BASE3}/27-blooming-flower-dance-front.png`, back: `${BASE3}/27-blooming-flower-dance-back.png`, side: `${BASE3}/27-blooming-flower-dance-side.png`, frontNative: { w: 164, h: 120 } },
  { level: 28, slug: "28-golden-embroidery-glory", name: "황금 자수의 영광", front: `${BASE3}/28-golden-embroidery-glory-front.png`, back: `${BASE3}/28-golden-embroidery-glory-back.png`, side: `${BASE3}/28-golden-embroidery-glory-side.png`, frontNative: { w: 167, h: 122 } },
];

const ALL_TIERS: Outfit[][] = [LEVEL1_OUTFITS, CHALLENGE_OUTFITS, SUCCESS_OUTFITS];

/** 레벨에 맞는 옷 순서대로: 0=튜토리얼(옷 없음), 1~12=시작 단계, 13~20=도전 단계, 21~28=성공 단계.
 * 그 이상은 다음 단계 세트가 더 오기 전까지 마지막(성공 28) 옷 유지 */
export function getOutfitForLevel(level: number): Outfit | null {
  if (level < 1) return null;
  let remaining = level;
  for (const tier of ALL_TIERS) {
    if (remaining <= tier.length) return tier[remaining - 1];
    remaining -= tier.length;
  }
  const lastTier = ALL_TIERS[ALL_TIERS.length - 1];
  return lastTier[lastTier.length - 1];
}

/** 옷장 화면 등에서 "전부 순서대로" 보여줄 때 씀 */
export function getAllOutfits(): Outfit[] {
  return ALL_TIERS.flat();
}
