"use client";

// 펫 캐릭터. 3레이어 구조(몸통 / 얼굴(눈+입) / 사지(팔+다리))를 animationState 하나로 제어.
// 새 리액션이 필요해도 이 3레이어 안에서 확장할 것 -- 레이어를 더 쪼개지 말 것 (CLAUDE_1.md 참고).
//
// 실제 아트가 아직 없어서 지금은 색깔 도형으로 대체(placeholder). 파일이 오면 아래
// *_ASSET 상수에 경로만 채우면 됨 (컴포넌트 로직은 그대로 재사용됨).
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  bodyVariants,
  eyeVariants,
  mouthVariants,
  armVariants,
  legVariants,
  crumbVariants,
  sparkleVariants,
  EAT_PHASE_ORDER,
  EAT_PHASE_DURATION,
  type EatPhase,
} from "@/lib/animations";

export type CharacterAnimationState = "idle" | "listening" | "eating" | "celebrating";
export type CharacterColor = "green" | "beige" | "brown";

interface CharacterProps {
  animationState: CharacterAnimationState;
  color?: CharacterColor;
  size?: number;
  /** eating 6단계 시퀀스가 다 끝나면 호출됨 (부모가 celebrating으로 넘기는 타이밍 등에 사용) */
  onEatingComplete?: () => void;
}

// --- 실제 아트 경로 (파일 준비되면 여기만 채우기) -------------------------------
// frontend/public/assets/character/ 아래 이 이름으로 저장하면 자동으로 반영됨.
const BODY_ASSET: Record<CharacterColor, string | null> = {
  green: null, // "/assets/character/body-green.png"
  beige: null, // "/assets/character/body-beige.png"
  brown: null, // "/assets/character/body-brown.png"
};
const EYES_ASSET: string | null = null; // "/assets/character/eyes.png"
const MOUTH_ASSET: Record<"closed" | "open", string | null> = {
  closed: null, // "/assets/character/mouth-closed.png"
  open: null, // "/assets/character/mouth-open.png"
};
const ARM_ASSET: string | null = null; // "/assets/character/arm-down.png" (뻗은 포즈는 회전으로 표현, 별도 파일 필요하면 arm-rest.png 추가 매핑)
const LEGS_ASSET: string | null = null; // "/assets/character/legs.png"

const BODY_COLOR_HEX: Record<CharacterColor, string> = {
  green: "#A8D5BA", // 세이지 그린
  beige: "#F5EFE0", // 아이보리
  brown: "#B08968", // 웜 브라운
};

export default function Character({
  animationState,
  color = "green",
  size = 160,
  onEatingComplete,
}: CharacterProps) {
  const [eatPhase, setEatPhase] = useState<EatPhase>("idle");
  const [showCrumb, setShowCrumb] = useState(false);
  const [blink, setBlink] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // --- eating 상태가 되면 PROJECT_SUMMARY 13번 섹션의 6단계 시퀀스를 순서대로 재생 ---
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (animationState !== "eating") {
      setEatPhase("idle");
      setShowCrumb(false);
      return;
    }

    let elapsed = 0;
    EAT_PHASE_ORDER.forEach((phase) => {
      const t = setTimeout(() => {
        setEatPhase(phase);
        if (phase === "crumble") setShowCrumb(true);
      }, elapsed);
      timers.current.push(t);
      elapsed += EAT_PHASE_DURATION[phase];
    });
    const done = setTimeout(() => {
      setEatPhase("idle");
      setShowCrumb(false);
      onEatingComplete?.();
    }, elapsed);
    timers.current.push(done);

    return () => timers.current.forEach(clearTimeout);
    // onEatingComplete는 의도적으로 deps에서 제외 (부모 리렌더마다 새 함수여도 시퀀스 재시작 안 되게)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationState]);

  // --- idle일 때 랜덤 간격으로 눈 깜빡임 ---
  useEffect(() => {
    if (animationState !== "idle") {
      setBlink(false);
      return;
    }
    let cancelled = false;
    const loop = () => {
      const delay = 2200 + Math.random() * 2500;
      const t = setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        setTimeout(() => !cancelled && setBlink(false), 180);
        loop();
      }, delay);
      timers.current.push(t);
    };
    loop();
    return () => {
      cancelled = true;
    };
  }, [animationState]);

  const bodyState: string =
    animationState === "eating"
      ? eatPhase
      : animationState === "celebrating"
        ? "celebrating"
        : animationState;

  const armState: string =
    eatPhase === "reach"
      ? "reach"
      : eatPhase === "toMouth" || eatPhase === "chew1" || eatPhase === "chew2"
        ? "toMouth"
        : animationState === "celebrating"
          ? "celebrateWave"
          : "down";

  const legState: string = animationState === "celebrating" ? "celebrateKick" : "idle";
  const mouthState: "open" | "closed" = eatPhase === "chew1" || eatPhase === "chew2" ? "open" : "closed";
  const eyeState: string = blink ? "blink" : animationState === "celebrating" ? "happy" : "open";

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <Limbs armState={armState} legState={legState} size={size} />

      <motion.div
        variants={bodyVariants}
        animate={bodyState}
        style={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          width: size * 0.72,
          height: size * 0.72,
          borderRadius: "42% 42% 46% 46% / 50% 50% 40% 40%",
          background: BODY_ASSET[color] ? "transparent" : BODY_COLOR_HEX[color],
          backgroundImage: BODY_ASSET[color] ? `url(${BODY_ASSET[color]})` : undefined,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />

      <Face eyeState={eyeState} mouthState={mouthState} size={size} />

      <AnimatePresence>
        {showCrumb && (
          <motion.div
            key="crumb"
            variants={crumbVariants}
            initial="hidden"
            animate="scatter"
            exit="hidden"
            style={{ position: "absolute", left: "50%", top: "38%", fontSize: size * 0.12 }}
          >
            ✦˚
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {animationState === "celebrating" && (
          <motion.div
            key="sparkle"
            variants={sparkleVariants}
            initial="hidden"
            animate="burst"
            exit="hidden"
            style={{
              position: "absolute",
              inset: -size * 0.15,
              pointerEvents: "none",
              fontSize: size * 0.18,
              textAlign: "center",
              lineHeight: `${size}px`,
            }}
          >
            ✨
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- 사지 레이어: 팔 2개 + 다리 -----------------------------------------------
function Limbs({ armState, legState, size }: { armState: string; legState: string; size: number }) {
  const armBase = (side: "left" | "right") => ({
    position: "absolute" as const,
    top: size * 0.42,
    [side]: size * 0.08,
    width: size * 0.14,
    height: size * 0.28,
    borderRadius: 999,
    background: ARM_ASSET ? "transparent" : "#B08968",
    backgroundImage: ARM_ASSET ? `url(${ARM_ASSET})` : undefined,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    transformOrigin: side === "left" ? "top right" : "top left",
  });

  return (
    <>
      <motion.div variants={armVariants} animate={armState} style={armBase("left")} />
      <motion.div variants={armVariants} animate={armState} style={{ ...armBase("right"), scaleX: -1 }} />
      <motion.div
        variants={legVariants}
        animate={legState}
        style={{
          position: "absolute",
          bottom: size * 0.1,
          left: "50%",
          marginLeft: -size * 0.16,
          width: size * 0.32,
          height: size * 0.14,
          borderRadius: 999,
          background: LEGS_ASSET ? "transparent" : "#8B6F47",
          backgroundImage: LEGS_ASSET ? `url(${LEGS_ASSET})` : undefined,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          transformOrigin: "top center",
        }}
      />
    </>
  );
}

// --- 얼굴 레이어: 눈 2개 + 입 --------------------------------------------------
function Face({ eyeState, mouthState, size }: { eyeState: string; mouthState: "open" | "closed"; size: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        margin: "auto",
        width: size * 0.5,
        height: size * 0.3,
        top: size * 0.22,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", padding: `0 ${size * 0.04}px` }}>
        {EYES_ASSET ? (
          <>
            <motion.img src={EYES_ASSET} variants={eyeVariants} animate={eyeState} style={{ width: size * 0.16 }} alt="" />
            <motion.img
              src={EYES_ASSET}
              variants={eyeVariants}
              animate={eyeState}
              style={{ width: size * 0.16, scaleX: -1 }}
              alt=""
            />
          </>
        ) : (
          <>
            <motion.div
              variants={eyeVariants}
              animate={eyeState}
              style={{ width: size * 0.09, height: size * 0.11, borderRadius: "50%", background: "#4A3F35" }}
            />
            <motion.div
              variants={eyeVariants}
              animate={eyeState}
              style={{ width: size * 0.09, height: size * 0.11, borderRadius: "50%", background: "#4A3F35" }}
            />
          </>
        )}
      </div>
      <motion.div
        variants={mouthVariants}
        animate={mouthState}
        style={{
          margin: "0 auto",
          marginTop: size * 0.05,
          width: size * 0.1,
          height: size * 0.06,
          borderRadius: "0 0 50% 50%",
          background: MOUTH_ASSET[mouthState] ? "transparent" : "#8B5E4A",
          backgroundImage: MOUTH_ASSET[mouthState] ? `url(${MOUTH_ASSET[mouthState]})` : undefined,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
        }}
      />
    </div>
  );
}
