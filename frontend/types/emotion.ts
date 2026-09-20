// backend/app/schemas/emotion.py 와 1:1 대응. 백엔드 스키마가 바뀌면 여기도 같이 고칠 것.

export type Emotion =
  | "분노"
  | "억울함"
  | "무기력"
  | "막막함"
  | "서운함"
  | "불안함"
  | "지침"
  | "뿌듯함"
  | "설렘"
  | "안심"
  | "감사함"
  | "홀가분함";

export const POSITIVE_EMOTIONS: readonly Emotion[] = [
  "뿌듯함",
  "설렘",
  "안심",
  "감사함",
  "홀가분함",
];

export type SituationCategory = "직장/알바" | "인간관계" | "학업/진로" | "미래불안" | "기타";

export type Intensity = 1 | 2 | 3;

export interface EmotionLogCreateFreeText {
  user_id: string;
  input_type: "free_text";
  raw_text: string;
}

export interface EmotionLogCreateStructured {
  user_id: string;
  input_type: "structured";
  situation_category: SituationCategory;
  emotion: Emotion;
  intensity: Intensity;
  raw_text?: string;
}

export type EmotionLogCreate = EmotionLogCreateFreeText | EmotionLogCreateStructured;

// user_id를 아직 모르는 폼 단계(InputFlow)에서 쓰는 타입. Omit<유니온, K>은 각 분기별로
// 따로 적용해야 함(유니온 전체에 바로 Omit하면 공통 키만 남아서 situation_category 등이 사라짐).
export type EmotionLogSubmit = Omit<EmotionLogCreateFreeText, "user_id"> | Omit<EmotionLogCreateStructured, "user_id">;

// ⚠️ 지금 백엔드는 공모전 공개 버전 기준으로 input_type: "free_text" 요청을 400으로 거부함
// (자유텍스트 분류기(LoRA)가 이 환경에서 너무 느려서 공개 버전에서 뺌 -- PROJECT_SUMMARY 참고)
// "편하게 쓰기" 입력 경로 UI를 보여줄지는 별도로 결정 필요.

export interface RoutineQuest {
  id: string; // quests 테이블 고정 UUID (POST /quests/{id}/complete에 씀)
  title: string;
  description: string;
  xp: number;
  duration: string;
  category: string;
}

export interface EmotionLogResponse {
  id: string;
  emotion: Emotion;
  intensity: Intensity | null;
  letter_text: string;
  xp_earned: number;
  leveled_up: boolean;
  new_level: number;
  food_icon: string;
  today_quests: RoutineQuest[];
}

// 위기신호 응답은 별도 is_crisis 필드가 없고 id === "crisis" 로만 구분됨 (백엔드 emotion_logs.py 참고)
export function isCrisisResponse(res: EmotionLogResponse): boolean {
  return res.id === "crisis";
}

export interface User {
  id: string;
  nickname: string | null;
  pet_name: string | null;
  onboarding_completed: boolean;
  level: number;
  current_xp: number;
  total_xp: number;
  created_at: string;
}

// GET /users/{id}/recent-logs 응답 항목 (편지함 목록용)
export interface EmotionLog {
  id: string;
  user_id: string;
  emotion: Emotion;
  intensity: Intensity | null;
  raw_text: string | null;
  letter_text: string;
  xp_earned: number;
  created_at: string;
}

// GET /quests/{user_id} 응답 항목 (user_quests + quests 조인)
export interface UserQuest {
  user_id: string;
  quest_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  quests: {
    id: string;
    title: string;
    description: string;
    target_emotion_category: string;
    xp_reward: number;
  };
}

// POST /quests/{quest_id}/complete 응답
export interface QuestCompleteResult {
  xp_earned: number;
  leveled_up: boolean;
  new_level: number;
  user: User;
}

// GET /users/{id}/stats 응답 (설정 화면 "나의 배지" 판정용, 2026-09-19)
export interface UserStats {
  total_logs: number;
  distinct_days_streak: number;
  distinct_emotions_count: number;
  completed_quests_count: number;
  current_level: number;
}

// GET /users/{id}/weekly-summary 응답 (홈 화면 상단 주간 요약 카드용, 2026-09-19)
export interface WeeklySummary {
  total_count: number;
  top_emotion: Emotion | null;
}
