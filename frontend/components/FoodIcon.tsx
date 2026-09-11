"use client";

// 먹이 아이콘. 백엔드 EmotionLogResponse.food_icon 값(한글 감정명)으로 매핑해서 보여줌.
// ⚠️ 실제 아이콘 파일 12개 개별 매핑 미확정 (받은 시트는 16개 과일이라 감정별 확정 필요,
// 사용자에게 확인 요청함). 지금은 컨셉표에 나온 색상 느낌만 살린 placeholder.
import type { Emotion } from "@/types/emotion";

interface FoodIconEntry {
  /** 확정되면 "/assets/food/food-xxx.png" 채우기 */
  asset: string | null;
  color: string;
  emoji: string;
}

// 컨셉표(감정->과일형태->색상)의 색감만 우선 반영. 파일 오면 asset 채우고 emoji는 안 씀.
export const FOOD_ICON_MAP: Record<Emotion, FoodIconEntry> = {
  분노: { asset: null, color: "#BFE3E8", emoji: "🍌" }, // 바나나, 민트블루
  억울함: { asset: null, color: "#D4AF37", emoji: "🍈" }, // 석류, 골드
  무기력: { asset: null, color: "#E8845A", emoji: "🥭" }, // 망고, 주황빨강
  막막함: { asset: null, color: "#F5E1A4", emoji: "🍊" }, // 자몽, 연노랑
  서운함: { asset: null, color: "#F4B6C2", emoji: "🍑" }, // 복숭아, 소프트핑크
  불안함: { asset: null, color: "#C9B6E4", emoji: "🍇" }, // 패션프루트, 라벤더
  지침: { asset: null, color: "#C7E5A4", emoji: "🥝" }, // 키위, 연두
  뿌듯함: { asset: null, color: "#E3C567", emoji: "🍎" }, // 사과, 골드+리본
  설렘: { asset: null, color: "#F3A6C1", emoji: "🍇" }, // 라즈베리, 핑크
  안심: { asset: null, color: "#BFE0C0", emoji: "🍐" }, // 배, 파스텔그린
  감사함: { asset: null, color: "#F2A65A", emoji: "🍊" }, // 감, 따뜻한주황
  홀가분함: { asset: null, color: "#A9D4E8", emoji: "🍉" }, // 수박, 하늘색
};

interface FoodIconProps {
  emotion: Emotion;
  size?: number;
}

export default function FoodIcon({ emotion, size = 40 }: FoodIconProps) {
  const entry = FOOD_ICON_MAP[emotion];
  if (!entry) return null;

  return (
    <div
      title={emotion}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: entry.asset ? "transparent" : entry.color,
        backgroundImage: entry.asset ? `url(${entry.asset})` : undefined,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
      }}
    >
      {!entry.asset && entry.emoji}
    </div>
  );
}
