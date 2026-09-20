// 성취 배지 정의 (2026-09-19 신규). GET /users/{id}/stats 응답을 기준으로
// client-side에서 조건을 판정함 -- 배지 종류/조건이 늘어나도 백엔드 안 건드리고
// 여기 목록만 늘리면 됨.
import type { UserStats } from "@/types/emotion";

export interface Badge {
  id: string;
  title: string;
  emoji: string;
  isEarned: (stats: UserStats) => boolean;
}

export const BADGES: Badge[] = [
  { id: "first_step", title: "첫 걸음", emoji: "🌱", isEarned: (s) => s.total_logs >= 1 },
  { id: "streak_3", title: "3일 연속 기록", emoji: "🔥", isEarned: (s) => s.distinct_days_streak >= 3 },
  { id: "first_levelup", title: "첫 레벨업", emoji: "⭐", isEarned: (s) => s.current_level >= 2 },
  { id: "quest_master", title: "퀘스트 마스터", emoji: "🏆", isEarned: (s) => s.completed_quests_count >= 5 },
  { id: "emotion_explorer", title: "감정 탐험가", emoji: "🌈", isEarned: (s) => s.distinct_emotions_count >= 6 },
  { id: "steady_heart", title: "꾸준한 마음", emoji: "📔", isEarned: (s) => s.total_logs >= 10 },
];
