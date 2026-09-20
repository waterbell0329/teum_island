// 감정별 파스텔 색상 매핑 (2026-09-19 신규). 편지함 카드 왼쪽 색 점 표시용.
import type { Emotion } from "@/types/emotion";

export const EMOTION_COLORS: Record<Emotion, string> = {
  분노: "#F2A6A0",
  억울함: "#E8C4A0",
  무기력: "#C9C2D9",
  막막함: "#A8A8C0",
  서운함: "#F4B8C8",
  불안함: "#B8C9E0",
  지침: "#C4B8A8",
  뿌듯함: "#F6D97A",
  설렘: "#F6B8D0",
  안심: "#A8D5BA",
  감사함: "#F0C97A",
  홀가분함: "#A8E0D5",
};
