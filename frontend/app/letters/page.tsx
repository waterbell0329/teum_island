"use client";

// 편지 보관함. GET /users/{id}/recent-logs 실제로 붙임 (2026-09-13).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import IslandBackground from "@/components/IslandBackground";
import LetterEnvelope from "@/components/LetterEnvelope";
import { getRecentLogs } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import type { EmotionLog } from "@/types/emotion";

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

  return (
    <IslandBackground>
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "var(--space-4)" }}>
          <button onClick={() => router.push("/")} aria-label="뒤로" style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>
            ←
          </button>
          <span style={{ fontFamily: "var(--font-jua)", fontSize: 16 }}>편지 보관함</span>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--color-brown)", fontSize: 14 }}>얼룩이가 편지함을 찾는 중...</p>
        ) : logs.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <LetterEnvelope variant="list" size={72} />
            <p style={{ color: "var(--color-brown)", fontSize: 14 }}>아직 아무 말도 안 걸었네, 오늘 하루 얘기해볼까?</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 var(--space-4)" }}>
            {logs.map((log) => {
              const opened = openedId === log.id;
              return (
                <button
                  key={log.id}
                  onClick={() => setOpenedId(opened ? null : log.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-card)",
                    background: "#fff",
                    boxShadow: "var(--shadow-soft)",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <LetterEnvelope variant="list" size={40} opened={opened} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--color-brown)" }}>
                      <span>{log.emotion}</span>
                      <span>{new Date(log.created_at).toLocaleDateString("ko-KR")}</span>
                    </div>
                    <p
                      className="font-hand"
                      style={{
                        margin: "4px 0 0",
                        fontSize: 15,
                        lineHeight: 1.5,
                        whiteSpace: "pre-line",
                        color: "var(--color-text)",
                        ...(opened ? {} : { overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }),
                      }}
                    >
                      {log.letter_text}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </IslandBackground>
  );
}
