"use client";

// 홈 화면 상단바 바로 아래 주간 요약 카드 (2026-09-19 신규). GET /users/{id}/weekly-summary.
import { useEffect, useState } from "react";
import { getWeeklySummary } from "@/lib/api";
import type { WeeklySummary } from "@/types/emotion";

export default function WeeklySummaryCard({ userId }: { userId: string | null }) {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);

  useEffect(() => {
    if (!userId) return;
    getWeeklySummary(userId)
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [userId]);

  if (!summary) return null;

  const text =
    summary.total_count > 0
      ? `이번주 ${summary.total_count}번 기록했어요, 가장 많이 느낀 감정은 '${summary.top_emotion}'이에요`
      : "이번주는 아직 기록이 없어요";

  return (
    <div style={{ margin: "0 var(--space-5) var(--space-3)" }}>
      <div
        style={{
          background: "#EAF6EE",
          borderRadius: 16,
          padding: "10px 14px",
          fontFamily: "var(--font-jua)",
          fontSize: 13,
          color: "var(--color-text)",
        }}
      >
        {text}
      </div>
    </div>
  );
}
