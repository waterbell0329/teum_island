"use client";

// 편지 보관함. GET /users/{id}/recent-logs 실제로 붙임 (2026-09-13).
// 2026-09-19: 카드형 리스트로 정리 -- 감정별 색점, 날짜 그룹 헤더(오늘/어제/이번주/이전),
// 탭하면 아코디언으로 펼쳐지는 건 기존 로직 그대로 유지.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import IslandBackground from "@/components/IslandBackground";
import LetterEnvelope from "@/components/LetterEnvelope";
import { getRecentLogs } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { EMOTION_COLORS } from "@/lib/emotionColors";
import type { EmotionLog } from "@/types/emotion";

type GroupLabel = "오늘" | "어제" | "이번주" | "이전";
const GROUP_ORDER: GroupLabel[] = ["오늘", "어제", "이번주", "이전"];

function groupLogsByDate(logs: EmotionLog[]): Record<GroupLabel, EmotionLog[]> {
  const groups: Record<GroupLabel, EmotionLog[]> = { 오늘: [], 어제: [], 이번주: [], 이전: [] };
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  for (const log of logs) {
    const created = new Date(log.created_at);
    if (created >= startOfToday) groups.오늘.push(log);
    else if (created >= startOfYesterday) groups.어제.push(log);
    else if (created >= sevenDaysAgo) groups.이번주.push(log);
    else groups.이전.push(log);
  }
  return groups;
}

export default function LettersPage() {
  const router = useRouter();
  const { userId } = useUser();
  const [logs, setLogs] = useState<EmotionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [openedId, setOpenedId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    getRecentLogs(userId)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const groups = groupLogsByDate(logs);

  return (
    <IslandBackground>
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "var(--space-4)" }}>
          <button onClick={() => router.push("/")} aria-label="뒤로" style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>
            ←
          </button>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>편지 보관함</span>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--color-brown)", fontSize: 14 }}>얼룩이가 편지함을 찾는 중...</p>
        ) : logs.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <LetterEnvelope variant="list" size={72} />
            <p style={{ color: "var(--color-brown)", fontSize: 14 }}>아직 아무 말도 안 걸었네, 오늘 하루 얘기해볼까?</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0 var(--space-4)" }}>
            {GROUP_ORDER.filter((label) => groups[label].length > 0).map((label) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h2 className="font-hand" style={{ fontSize: 18, margin: 0, color: "var(--color-text)" }}>
                  {label}
                </h2>
                {groups[label].map((log) => {
                  const opened = openedId === log.id;
                  const dotColor = EMOTION_COLORS[log.emotion] ?? "var(--color-brown)";
                  return (
                    <motion.button
                      key={log.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setOpenedId(opened ? null : log.id)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "var(--space-3)",
                        borderRadius: "var(--radius-card)",
                        background: "#fff",
                        boxShadow: "var(--shadow-soft)",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: dotColor,
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                      <LetterEnvelope variant="list" size={40} opened={opened} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-brown)" }}>
                          <span>{log.emotion}</span>
                          <span>{new Date(log.created_at).toLocaleDateString("ko-KR")}</span>
                        </div>
                        <p
                          className="font-letter"
                          style={{
                            margin: "4px 0 0",
                            fontSize: 15,
                            lineHeight: 1.5,
                            whiteSpace: "pre-line",
                            color: "var(--color-text)",
                            ...(opened
                              ? {}
                              : { overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }),
                          }}
                        >
                          {log.letter_text}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </IslandBackground>
  );
}
