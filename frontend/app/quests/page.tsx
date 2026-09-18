"use client";

// 퀘스트 화면. GET /quests/{id}(미완료만) + POST /quests/{quest_id}/complete 실제로 붙임 (2026-09-13).
import { useEffect, useState } from "react";
import IslandBackground from "@/components/IslandBackground";
import BottomNav from "@/components/BottomNav";
import { getUserQuests, completeQuest, ApiError } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import type { UserQuest } from "@/types/emotion";

export default function QuestsPage() {
  const { userId, refreshUser } = useUser();
  const [quests, setQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function load() {
    if (!userId) return;
    setLoading(true);
    getUserQuests(userId)
      .then(setQuests)
      .catch(() => setQuests([]))
      .finally(() => setLoading(false));
  }

  async function handleComplete(questId: string) {
    if (!userId) return;
    setCompletingId(questId);
    try {
      const res = await completeQuest(questId, userId);
      setQuests((prev) => prev.filter((q) => q.quest_id !== questId));
      setToast(`+${res.xp_earned} XP${res.leveled_up ? ` · 레벨 ${res.new_level} 달성!` : ""}`);
      await refreshUser();
      setTimeout(() => setToast(""), 2500);
    } catch (e) {
      setToast(e instanceof ApiError ? e.message : "얼룩이가 잠깐 딴 데를 봤나봐, 다시 해볼래?");
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <IslandBackground>
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 18, padding: "var(--space-4)", margin: 0 }}>퀘스트</h1>

        {toast && (
          <div style={{ margin: "0 var(--space-4) var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-control)", background: "var(--color-yellow)", color: "var(--color-text)", fontSize: 13, textAlign: "center" }}>
            {toast}
          </div>
        )}

        <div style={{ flex: 1, padding: "0 var(--space-4)", display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? (
            <p style={{ color: "var(--color-brown)", fontSize: 14 }}>얼룩이가 오늘의 루틴을 찾는 중...</p>
          ) : quests.length === 0 ? (
            <p style={{ color: "var(--color-brown)", fontSize: 14 }}>
              아직 준비된 퀘스트가 없네, 오늘 하루를 먼저 얘기해볼까?
            </p>
          ) : (
            quests.map((uq) => (
              <div
                key={uq.quest_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-card)",
                  background: "#fff",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 14 }}>{uq.quests.title}</strong>
                  <p style={{ fontSize: 12, color: "var(--color-brown)", margin: "4px 0 0" }}>{uq.quests.description}</p>
                  <p style={{ fontSize: 11, color: "var(--color-brown)", margin: "4px 0 0" }}>+{uq.quests.xp_reward} XP</p>
                </div>
                <button
                  onClick={() => handleComplete(uq.quest_id)}
                  disabled={completingId === uq.quest_id}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "var(--radius-control)",
                    border: "none",
                    background: "var(--color-main-green)",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-heading)",
                    fontSize: 13,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  완료
                </button>
              </div>
            ))
          )}
        </div>

        <BottomNav />
      </div>
    </IslandBackground>
  );
}
