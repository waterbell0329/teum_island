"use client";

// 홈 화면 "오늘 받은 먹이" 미니 섹션 (2026-09-19 신규). 최근 기록 4개를 원형 배지로
// 가로 나열함 -- 새 그림 에셋 없이 기존 FoodIcon/FOOD_ICON_MAP만 재사용.
import { useEffect, useState } from "react";
import FoodIcon from "@/components/FoodIcon";
import { getRecentLogs } from "@/lib/api";
import type { EmotionLog } from "@/types/emotion";

export default function FoodPreview({ userId }: { userId: string | null }) {
  const [logs, setLogs] = useState<EmotionLog[]>([]);

  useEffect(() => {
    if (!userId) return;
    getRecentLogs(userId, 4)
      .then(setLogs)
      .catch(() => setLogs([]));
  }, [userId]);

  if (logs.length === 0) return null; // 기록 없으면 섹션 자체를 숨김

  return (
    <div style={{ width: "100%", padding: "0 var(--space-5)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 16,
          background: "#fff",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <p style={{ fontSize: 12, color: "var(--color-text)", fontFamily: "var(--font-jua)", margin: 0, whiteSpace: "nowrap" }}>
          오늘 받은 먹이
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {logs.map((log) => (
            <FoodIcon key={log.id} emotion={log.emotion} size={32} />
          ))}
        </div>
      </div>
    </div>
  );
}
