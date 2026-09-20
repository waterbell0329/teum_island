"use client";

// 레벨업 전용 풀스크린 오버레이 (2026-09-19 신규). 홈 화면 위에 라우팅 이동 없이 뜨는
// 모달/오버레이 -- Duolingo 스타일 "짜잔" 리빌: 화면이 어두워지고 -> 빛이 반짝이며
// 모이고 -> 이전 단계 옷(실루엣)이 보였다가 -> 플래시 -> 새 옷이 색을 되찾으며 등장.
// 이 화면이 떠 있는 동안은 뒤에 깔린 하단 네비/버튼이 전부 fixed 오버레이 아래 깔려서
// 클릭이 통과하지 않음 (별도 disabled prop 없이 그냥 화면을 통째로 덮는 것으로 해결).
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Character from "@/components/Character";
import { getGrowthStage, representativeLevelForStage } from "@/lib/growthStage";

type Phase = "dark" | "sparkle" | "silhouette" | "flash" | "reveal";

// 각 단계가 얼마나 지속되는지(ms). "reveal"은 유저가 "계속하기"를 누를 때까지 유지.
const PHASE_DURATION: Record<Exclude<Phase, "reveal">, number> = {
  dark: 350,
  sparkle: 650,
  silhouette: 850,
  flash: 220,
};
const PHASE_ORDER: Phase[] = ["dark", "sparkle", "silhouette", "flash", "reveal"];

const CONFETTI_COLORS = ["#A8D5BA", "#F6C453", "#E8A19C", "#8FD3E8", "#F5EFE0"];

interface LevelUpScreenProps {
  newLevel: number;
  onContinue: () => void;
}

export default function LevelUpScreen({ newLevel, onContinue }: LevelUpScreenProps) {
  const [phase, setPhase] = useState<Phase>("dark");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    for (let i = 1; i < PHASE_ORDER.length; i++) {
      elapsed += PHASE_DURATION[PHASE_ORDER[i - 1] as Exclude<Phase, "reveal">];
      const p = PHASE_ORDER[i];
      timers.push(setTimeout(() => setPhase(p), elapsed));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  // 새 레벨이 몇 단계를 건너뛰지 않는 한(보통 1레벨씩 오름) 직전 레벨의 단계를 "이전 옷"으로 씀
  const prevStageLevel = representativeLevelForStage(getGrowthStage(Math.max(0, newLevel - 1)));
  const reveal = phase === "reveal";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, overflow: "hidden" }}>
      {/* 배경 암전 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "flash" ? 0.2 : 0.86 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        style={{ position: "absolute", inset: 0, background: "#241a10" }}
      />

      {/* 반짝이는 빛 (sparkle~silhouette 구간) */}
      <AnimatePresence>
        {(phase === "sparkle" || phase === "silhouette") && (
          <motion.div
            key="glow"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 50% 44%, rgba(246,196,83,0.6) 0%, rgba(246,196,83,0.15) 45%, transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div style={{ position: "relative", width: 240, height: 240 }}>
          {/* 이전 단계 옷 실루엣 */}
          <AnimatePresence>
            {phase === "silhouette" && (
              <motion.div
                key="silhouette"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.55 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ position: "absolute", inset: 0, filter: "brightness(0) invert(1)" }}
              >
                <Character animationState="idle" size={240} level={prevStageLevel} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 플래시 */}
          <AnimatePresence>
            {phase === "flash" && (
              <motion.div
                key="flash"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "#fff",
                }}
              />
            )}
          </AnimatePresence>

          {/* 새 옷 리빌 */}
          <AnimatePresence>
            {reveal && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ position: "absolute", inset: 0 }}
              >
                <Character animationState="celebrating" size={240} level={newLevel} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {reveal && (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}
            >
              <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, color: "#fff", margin: 0 }}>
                Lv.{newLevel} 달성!
              </p>
              <button
                onClick={onContinue}
                style={{
                  padding: "14px 40px",
                  borderRadius: 999,
                  border: "none",
                  background: "var(--color-main-green)",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-heading)",
                  fontSize: 15,
                  cursor: "pointer",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                계속하기
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {reveal && <Confetti />}
    </div>
  );
}

// 가벼운 자체 제작 색종이 이펙트 (별도 라이브러리 없이 div 40개를 떨어뜨림)
// 렌더 중 Math.random()을 직접 부르면(불순 함수) 리렌더마다 값이 바뀌어버리니,
// 각 조각의 랜덤값은 최초 한 번만 useState 초기화 함수로 고정해둠.
function makeConfettiPieces() {
  return Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.6 + Math.random() * 1.4,
    rotateEnd: 180 + Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    isCircle: i % 3 === 0,
  }));
}

function Confetti() {
  const [pieces] = useState(makeConfettiPieces);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {pieces.map(({ id, left, delay, duration, rotateEnd, color, isCircle }) => {
        return (
          <motion.div
            key={id}
            initial={{ top: "-5%", left: `${left}%`, opacity: 1, rotate: 0 }}
            animate={{ top: "105%", rotate: rotateEnd, opacity: [1, 1, 0.8] }}
            transition={{ duration, delay, ease: "easeIn" }}
            style={{
              position: "absolute",
              width: 8,
              height: isCircle ? 8 : 14,
              background: color,
              borderRadius: isCircle ? "50%" : 2,
            }}
          />
        );
      })}
    </div>
  );
}
