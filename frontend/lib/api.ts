// 백엔드 fetch 래퍼. backend/app/schemas/emotion.py 와 1:1 대응 (types/emotion.ts 참고).
import type { EmotionLogCreate, EmotionLogResponse, EmotionLog, User, UserQuest, QuestCompleteResult } from "@/types/emotion";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // 응답이 JSON이 아닐 수도 있음, statusText로 대체
    }
    throw new ApiError(detail, res.status);
  }
  return res.json();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export function getUser(userId: string): Promise<User> {
  return request<User>(`/users/${userId}`);
}

// 온보딩 1단계: 닉네임만 저장 (레벨/온보딩완료 상태 안 바뀜)
export function saveNickname(userId: string, nickname: string): Promise<User> {
  return request<User>(`/users/${userId}/nickname`, {
    method: "POST",
    body: JSON.stringify({ nickname }),
  });
}

// 온보딩 마지막 단계: 먹이주기 튜토리얼 + 펫 이름짓기 끝난 뒤. pet_name 저장 + level 0->1
export function completeOnboarding(userId: string, petName: string): Promise<User> {
  return request<User>(`/users/${userId}/complete-onboarding`, {
    method: "POST",
    body: JSON.stringify({ pet_name: petName }),
  });
}

export function getRecentLogs(userId: string, limit = 20): Promise<EmotionLog[]> {
  return request<EmotionLog[]>(`/users/${userId}/recent-logs?limit=${limit}`);
}

export function createEmotionLog(payload: EmotionLogCreate): Promise<EmotionLogResponse> {
  return request<EmotionLogResponse>(`/emotion-logs`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getUserQuests(userId: string): Promise<UserQuest[]> {
  return request<UserQuest[]>(`/quests/${userId}`);
}

export function completeQuest(questId: string, userId: string): Promise<QuestCompleteResult> {
  return request<QuestCompleteResult>(`/quests/${questId}/complete`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}
