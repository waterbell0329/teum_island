"use client";

// 퀘스트 화면. GET /quests/{id}(미완료만) + POST /quests/{quest_id}/complete 실제로 붙임 (2026-09-13).
// 2026-09-19: 완료 버튼에 체크마크/XP상승/컨페티 연출(QuestCompleteFx) 추가 -- 연출이
// 다 끝난 뒤(약 700ms)에 카드를 스케일다운+페이드로 접고, 그 다음에야 목록에서 실제로 제거함.
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import IslandBackground from "@/components/IslandBackground";
import BottomNav from "@/components/BottomNav";
import QuestCompleteFx from "@/components/QuestCompleteFx";
import { getUserQuests, completeQuest, ApiError } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import type { UserQuest } from "@/types/emotion";

const FX_DURATION_MS = 700;
const COLLAPSE_DURATION_MS = 300;

export default function QuestsPage() {
  const { userId, refreshUser } = useUser();
  const [quests, setQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [collapsingId, setCollapsingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!userId) return;
    getUserQuests(userId)
      .then(setQuests)
      .catch(() => setQuests([]))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleComplete(questId: string) {
    if (!userId || completingId) return;
    setCompletingId(questId);
    const resultPromise = completeQuest(questId, userId);

    // 체크마크+XP+컨페티 연출이 재생되는 동안 기다렸다가, 그 다음 카드를 접음
    setTimeout(async () => {
      setCollapsingId(questId);
      try {
        const res = await resultPromise;
        setTimeout(async () => {
          setQuests((prev) => prev.filter((q) => q.quest_id !== questId));
          setToast(`+${res.xp_earned} XP${res.leveled_up ? ` · 레벨 ${res.new_level} 달성!` : ""}`);
          await refreshUser();
          setCompletingId(null);
          setCollapsingId(null);
          setTimeout(() => setToast(""), 2500);
        }, COLLAPSE_DURATION_MS);
      } catch (e) {
        setToast(e instanceof ApiError ? e.message : "얼룩이가 잠깐 딴 데를 봤나봐, 다시 해볼래?");
        setCompletingId(null);
        setCollapsingId(null);
      }
    }, FX_DURATION_MS);
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
            quests.map((uq) => {
              const isCompleting = completingId === uq.quest_id;
              const isCollapsing = collapsingId === uq.quest_id;
              return (
                <motion.div
                  key={uq.quest_id}
                  animate={{ scaleY: isCollapsing ? 0 : 1, opacity: isCollapsing ? 0 : 1 }}
                  transition={{ duration: COLLAPSE_DURATION_MS / 1000, ease: "easeIn" }}
                  style={{ transformOrigin: "top", overflow: "hidden" }}
                >
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius-card)",
                      background: "#fff",
                      boxShadow: "var(--shadow-soft)",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: 14 }}>{uq.quests.title}</strong>
                      <p style={{ fontSize: 12, color: "var(--color-brown)", margin: "4px 0 0" }}>{uq.quests.description}</p>
                      <p style={{ fontSize: 11, color: "var(--color-brown)", margin: "4px 0 0" }}>+{uq.quests.xp_reward} XP</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleComplete(uq.quest_id)}
                      disabled={!!completingId}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "var(--radius-control)",
                        border: "none",
                        background: "var(--color-main-green)",
                        color: "var(--color-text)",
                        fontFamily: "var(--font-heading)",
                        fontSize: 13,
                        cursor: completingId ? "default" : "pointer",
                        whiteSpace: "nowrap",
                        opacity: isCompleting ? 0 : 1,
                      }}
                    >
                      완료
                    </motion.button>

                    {isCompleting && <QuestCompleteFx xpReward={uq.quests.xp_reward} />}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <BottomNav />
      </div>
    </IslandBackground>
  );
}
