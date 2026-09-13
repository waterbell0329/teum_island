"use client";

// 먹이 아이콘. 백엔드 EmotionLogResponse.food_icon 값(한글 감정명)으로 매핑해서 보여줌.
// "먹이 설명.png"(감정->과일형태->색상 컨셉표) 표 순서와 1:1 일치하도록 원본 시트("먹이들.png",
// 4x4=16종 중 앞 12개, 뒤 4개는 미사용 배리에이션)를 크롭+배경투명화해서 매핑 완료 (2026-09-13).
import type { Emotion } from "@/types/emotion";

interface FoodIconEntry {
  asset: string | null;
  color: string;
  emoji: string;
}

export const FOOD_ICON_MAP: Record<Emotion, FoodIconEntry> = {
  분노: { asset: "/assets/food/food-anger.png", color: "#BFE3E8", emoji: "🍌" }, // 바나나, 민트블루
  억울함: { asset: "/assets/food/food-wronged.png", color: "#D4AF37", emoji: "🍈" }, // 석류, 골드
  무기력: { asset: "/assets/food/food-lethargy.png", color: "#E8845A", emoji: "🥭" }, // 망고, 주황빨강
  막막함: { asset: "/assets/food/food-lost.png", color: "#F5E1A4", emoji: "🍊" }, // 자몽, 연노랑
  서운함: { asset: "/assets/food/food-hurt.png", color: "#F4B6C2", emoji: "🍑" }, // 복숭아, 소프트핑크
  불안함: { asset: "/assets/food/food-anxious.png", color: "#C9B6E4", emoji: "🍇" }, // 패션프루트, 라벤더
  지침: { asset: "/assets/food/food-exhausted.png", color: "#C7E5A4", emoji: "🥝" }, // 키위, 연두
  뿌듯함: { asset: "/assets/food/food-proud.png", color: "#E3C567", emoji: "🍎" }, // 사과, 골드+리본
  설렘: { asset: "/assets/food/food-excited.png", color: "#F3A6C1", emoji: "🍇" }, // 라즈베리, 핑크
  안심: { asset: "/assets/food/food-relief.png", color: "#BFE0C0", emoji: "🍐" }, // 배, 파스텔그린
  감사함: { asset: "/assets/food/food-grateful.png", color: "#F2A65A", emoji: "🍊" }, // 감, 따뜻한주황
  홀가분함: { asset: "/assets/food/food-light.png", color: "#A9D4E8", emoji: "🍉" }, // 수박, 하늘색
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
