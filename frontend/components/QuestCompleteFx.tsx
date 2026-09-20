"use client";

// 퀘스트 완료 버튼 연출 (2026-09-19 신규): 체크마크 드로잉 -> XP 텍스트 상승 페이드 ->
// 컨페티 방사형 튐. 카드 위에 절대위치로 얹어서 씀 (QuestsPage 참고).
import { motion } from "framer-motion";

const CONFETTI_COLORS = ["#A8D5BA", "#F6C453", "#E8A19C"];

export default function QuestCompleteFx({ xpReward }: { xpReward: number }) {
  const confetti = Array.from({ length: 9 }, (_, i) => i);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3,
      }}
    >
      {/* 체크마크: stroke-dasharray/dashoffset 기반 드로잉 (framer-motion pathLength) */}
      <svg width="36" height="36" viewBox="0 0 36 36" style={{ position: "absolute" }}>
        <motion.path
          d="M8 19 L15 26 L28 11"
          fill="none"
          stroke="var(--color-main-green)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </svg>

      {/* XP 상승 페이드아웃 */}
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          position: "absolute",
          top: -16,
          fontFamily: "var(--font-heading)",
          fontSize: 14,
          color: "#F6C453",
        }}
      >
        +{xpReward} XP
      </motion.div>

      {/* 컨페티 사각형 방사형 튐 */}
      {confetti.map((i) => {
        const angle = (i / confetti.length) * Math.PI * 2;
        const dist = 26 + (i % 3) * 8;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ position: "absolute", width: 6, height: 6, background: color }}
          />
        );
      })}
    </div>
  );
}
