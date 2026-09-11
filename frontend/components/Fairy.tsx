"use client";

// 요정(얼룩이) = 새 캐릭터. Character.tsx와 같은 원칙으로 레이어 리깅:
//   몸통 / 얼굴(눈+부리) / 날개(좌우) / 꼬리 / 다리 -- 총 5레이어, 파츠시트(표정·부리·날개L,R·다리·꼬리3종) 기준.
// state 하나(hidden/summon/listening/deliver)로 전 레이어가 반응.
//   hidden -> summon(반짝이며 등장, 날개 빠르게 퍼덕) -> listening(느긋한 날개짓+깜빡임, 듣는 포즈)
//   -> deliver(꼬리 부채짓 + 부리로 말하듯 뻐끔거림) -> hidden
//
// 실제 파츠 파일 아직 못 받아서 색깔 도형 placeholder. *_ASSET에 경로만 채우면 전환됨.
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

export type FairyState = "hidden" | "summon" | "listening" | "deliver";

interface FairyProps {
  state: FairyState;
  size?: number;
  mini?: boolean; // 홈 화면 우상단 상시노출용 미니 아이콘
}

// --- 실제 아트 경로 (파일 준비되면 채우기) -------------------------------------
const BODY_ASSET: string | null = null; // "/assets/fairy/body.png"
const EYE_ASSET: string | null = null; // "/assets/fairy/eye.png" (감은눈은 애니메이션으로 표현, 별도파일이면 여기 open/closed 나눠도 됨)
const BEAK_ASSET: Record<"closed" | "open", string | null> = { closed: null, open: null }; // beak-closed.png / beak-open.png
const WING_ASSET: string | null = null; // "/assets/fairy/wing.png" (L/R은 scaleX(-1)로 반전)
const TAIL_ASSET: Record<"neutral" | "fanned", string | null> = { neutral: null, fanned: null };
const LEG_ASSET: string | null = null; // "/assets/fairy/leg.png"

const FEATHER = "#F6DFA0"; // 몸통 크림옐로
const FEATHER_DARK = "#E8C46B"; // 날개/꼬리 진한 톤
const BEAK_COLOR = "#E28B4A";

// --- variants ------------------------------------------------------------------
const bodyVariants: Variants = {
  idle: { y: [0, -3, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  pop: { scale: [0.4, 1.15, 1], transition: { duration: 0.45, ease: "backOut" } },
};

const wingVariants: Variants = {
  rest: { rotate: -6, transition: { duration: 0.3 } },
  flapSlow: { rotate: [-6, 12, -6], transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } },
  flapFast: { rotate: [-10, 30, -10], transition: { duration: 0.32, repeat: Infinity, ease: "easeInOut" } },
  flapOnce: { rotate: [-6, 32, -6, 18, -6], transition: { duration: 0.6, ease: "easeInOut" } },
};

const tailVariants: Variants = {
  neutral: { scaleX: 1, rotate: 0, transition: { duration: 0.3 } },
  fanned: { scaleX: 1.4, rotate: [0, 6, -6, 0], transition: { duration: 0.9, ease: "easeOut" } },
};

const legVariants: Variants = {
  stand: { scaleY: 1, transition: { duration: 0.2 } },
  bend: { scaleY: 0.7, transition: { duration: 0.2 } },
};

const eyeVariants: Variants = {
  open: { scaleY: 1 },
  blink: { scaleY: [1, 0.05, 1], transition: { duration: 0.16 } },
};

const beakVariants: Variants = {
  closed: { scaleY: 1 },
  open: { scaleY: 2.2, transition: { duration: 0.1 } },
};

// deliver 단계에서 부리 뻐끔거림(말하기) 시퀀스
const TALK_SEQUENCE: Array<"open" | "closed"> = ["open", "closed", "open", "closed"];
const TALK_STEP_MS = 150;

export default function Fairy({ state, size = 120, mini = false }: FairyProps) {
  const [blink, setBlink] = useState(false);
  const [talking, setTalking] = useState<"open" | "closed">("closed");
  const [tailFanned, setTailFanned] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // listening: 랜덤 간격 깜빡임 (Character.tsx idle 깜빡임과 동일 패턴)
  useEffect(() => {
    if (state !== "listening") {
      setBlink(false);
      return;
    }
    let cancelled = false;
    const loop = () => {
      const delay = 1800 + Math.random() * 2000;
      const t = setTimeout(() => {
        if (cancelled) return;
        setBlink(true);
        setTimeout(() => !cancelled && setBlink(false), 160);
        loop();
      }, delay);
      timers.current.push(t);
    };
    loop();
    return () => {
      cancelled = true;
    };
  }, [state]);

  // deliver: 꼬리 부채질 + 부리로 뻐끔거리며 "말하는" 시퀀스
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (state !== "deliver") {
      setTalking("closed");
      setTailFanned(false);
      return;
    }

    setTailFanned(true);
    TALK_SEQUENCE.forEach((mouth, i) => {
      const t = setTimeout(() => setTalking(mouth), i * TALK_STEP_MS);
      timers.current.push(t);
    });
    const settle = setTimeout(() => setTailFanned(false), TALK_SEQUENCE.length * TALK_STEP_MS + 400);
    timers.current.push(settle);

    return () => timers.current.forEach(clearTimeout);
  }, [state]);

  const wingState = state === "summon" ? "flapFast" : state === "deliver" ? "flapOnce" : state === "listening" ? "flapSlow" : "rest";
  const legState = state === "summon" ? "bend" : "stand";
  const eyeState = blink ? "blink" : "open";
  const tailState = tailFanned ? "fanned" : "neutral";
  const beakState = talking;

  return (
    <AnimatePresence>
      {state !== "hidden" && (
        <motion.div
          key="fairy"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.25 } }}
          style={{ position: "relative", width: size, height: size }}
        >
          {/* summon 반짝임 (미니 아이콘에서는 생략 -- 너무 작아서 안 예쁨) */}
          <AnimatePresence>
            {!mini && state === "summon" && (
              <motion.div
                key="sparkle"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.8], transition: { duration: 0.6 } }}
                exit={{ opacity: 0 }}
                style={{
                  position: "absolute", inset: -size * 0.2, textAlign: "center",
                  lineHeight: `${size}px`, fontSize: size * 0.2, pointerEvents: "none", zIndex: 5,
                }}
              >
                ✨
              </motion.div>
            )}
          </AnimatePresence>

          {/* 꼬리 (몸통 뒤) */}
          <motion.div
            variants={tailVariants}
            animate={tailState}
            style={{
              position: "absolute", left: "50%", bottom: size * 0.06, marginLeft: -size * 0.09,
              width: size * 0.18, height: size * 0.3, borderRadius: "40% 40% 10% 10%",
              background: TAIL_ASSET[tailFanned ? "fanned" : "neutral"] ? "transparent" : FEATHER_DARK,
              backgroundImage: TAIL_ASSET[tailFanned ? "fanned" : "neutral"]
                ? `url(${TAIL_ASSET[tailFanned ? "fanned" : "neutral"]})`
                : undefined,
              backgroundSize: "contain", backgroundRepeat: "no-repeat",
              transformOrigin: "top center", zIndex: 1,
            }}
          />

          {/* 날개 (좌/우, 몸통 옆) */}
          {(["left", "right"] as const).map((side) => (
            <motion.div
              key={side}
              variants={wingVariants}
              animate={wingState}
              style={{
                position: "absolute", top: size * 0.32, [side]: -size * 0.02,
                width: size * 0.32, height: size * 0.24, borderRadius: "50% 50% 60% 20%",
                background: WING_ASSET ? "transparent" : FEATHER_DARK,
                backgroundImage: WING_ASSET ? `url(${WING_ASSET})` : undefined,
                backgroundSize: "contain", backgroundRepeat: "no-repeat",
                transform: side === "right" ? "scaleX(-1)" : undefined,
                transformOrigin: side === "left" ? "top right" : "top left",
                zIndex: 2,
              }}
            />
          ))}

          {/* 다리 */}
          <motion.div
            variants={legVariants}
            animate={legState}
            style={{
              position: "absolute", left: "50%", bottom: 0, marginLeft: -size * 0.06,
              width: size * 0.12, height: size * 0.1, borderRadius: 4,
              background: LEG_ASSET ? "transparent" : BEAK_COLOR,
              backgroundImage: LEG_ASSET ? `url(${LEG_ASSET})` : undefined,
              backgroundSize: "contain", backgroundRepeat: "no-repeat",
              transformOrigin: "top center", zIndex: 1,
            }}
          />

          {/* 몸통 */}
          <motion.div
            variants={bodyVariants}
            animate={state === "summon" ? ["pop", "idle"] : "idle"}
            style={{
              position: "absolute", left: "50%", top: size * 0.12, marginLeft: -size * 0.28,
              width: size * 0.56, height: size * 0.56, borderRadius: "50% 50% 45% 45%",
              background: BODY_ASSET ? "transparent" : FEATHER,
              backgroundImage: BODY_ASSET ? `url(${BODY_ASSET})` : undefined,
              backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center",
              zIndex: 3,
            }}
          />

          {/* 얼굴: 눈 + 부리 */}
          <div
            style={{
              position: "absolute", left: "50%", top: size * 0.26, marginLeft: -size * 0.16,
              width: size * 0.32, height: size * 0.2, zIndex: 4,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", padding: `0 ${size * 0.03}px` }}>
              {[0, 1].map((i) =>
                EYE_ASSET ? (
                  <motion.img key={i} src={EYE_ASSET} variants={eyeVariants} animate={eyeState} style={{ width: size * 0.06 }} alt="" />
                ) : (
                  <motion.div
                    key={i}
                    variants={eyeVariants}
                    animate={eyeState}
                    style={{ width: size * 0.055, height: size * 0.07, borderRadius: "50%", background: "#4A3F35" }}
                  />
                )
              )}
            </div>
            <motion.div
              variants={beakVariants}
              animate={beakState}
              style={{
                margin: "0 auto",
                marginTop: size * 0.02,
                width: 0,
                height: 0,
                borderLeft: `${size * 0.035}px solid transparent`,
                borderRight: `${size * 0.035}px solid transparent`,
                borderTop: `${size * 0.05}px solid ${BEAK_ASSET[beakState] ? "transparent" : BEAK_COLOR}`,
                backgroundImage: BEAK_ASSET[beakState] ? `url(${BEAK_ASSET[beakState]})` : undefined,
                backgroundSize: "contain",
                transformOrigin: "top center",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
