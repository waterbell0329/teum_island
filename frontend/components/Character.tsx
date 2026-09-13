"use client";

// 펫 캐릭터. 3레이어 구조(몸통 / 얼굴(눈+입) / 사지(팔+다리))를 animationState 하나로 제어.
// 새 리액션이 필요해도 이 3레이어 안에서 확장할 것 -- 레이어를 더 쪼개지 말 것 (CLAUDE_1.md 참고).
//
// 각 파츠는 원본 시트(all_parts.json 기준)의 실제 픽셀 크기 비율(NATIVE)로 스케일링해서
// 배치함 -- 예전엔 %로 대충 잡아서 팔/다리가 실제 그림보다 훨씬 크게 보이는 문제가 있었음.
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
import { FOOD_ICON_MAP } from "@/components/FoodIcon";
import { getOutfitForLevel } from "@/lib/outfits";
import type { Emotion } from "@/types/emotion";

export type CharacterAnimationState = "idle" | "listening" | "eating" | "celebrating";
export type CharacterColor = "green" | "beige" | "brown";

interface CharacterProps {
  animationState: CharacterAnimationState;
  color?: CharacterColor;
  size?: number;
  /** eating 6단계 시퀀스가 다 끝나면 호출됨 (부모가 celebrating으로 넘기는 타이밍 등에 사용) */
  onEatingComplete?: () => void;
  /** 지금 먹이고 있는 감정(=먹이 종류). 있으면 reach~toMouth 구간에 실제 먹이 아이콘이 손에서 입으로 이동함 */
  foodEmotion?: Emotion;
  /** 유저 레벨. 있으면 레벨에 맞는 옷(lib/outfits.ts)을 몸통 위에 겹쳐 입힘 (레벨업="옷 갈아입기" 원칙) */
  level?: number;
}

// --- 실제 아트 경로 (2026-09-12 반영) ------------------------------------------
// green/brown 색상 파일은 아직 없어서 beige만 채움 (색상 선택 시 나머지 둘은 도형 placeholder).
const BODY_ASSET: Record<CharacterColor, string | null> = {
  green: null, // "/assets/character/body-green.png"
  beige: "/assets/character/body-beige.png",
  brown: null, // "/assets/character/body-brown.png"
};
const EYES_ASSET: string | null = "/assets/character/eyes.png";
const EYES_HAPPY_ASSET: string | null = "/assets/character/eyes-happy.png"; // 감은(웃는) 눈, celebrating용
const MOUTH_ASSET: Record<"closed" | "open", string | null> = {
  closed: "/assets/character/mouth-closed.png",
  open: "/assets/character/mouth-open.png",
};
const ARM_ASSET: Record<"down" | "reach", string | null> = {
  down: "/assets/character/arm-down.png",
  reach: "/assets/character/arm-reach.png",
};
const LEGS_ASSET: string | null = "/assets/character/legs.png";

const BODY_COLOR_HEX: Record<CharacterColor, string> = {
  green: "#A8D5BA", // 세이지 그린
  beige: "#F5EFE0", // 아이보리
  brown: "#B08968", // 웜 브라운
};

// 원본 시트에서 각 파츠의 실제 픽셀 크기 (all_parts.json). 몸통 너비 기준으로 전부 같은
// 비율(scale)을 곱해서 배치 -> 실제 그림 비율 그대로 유지됨.
const NATIVE = {
  body: { w: 280, h: 368 }, // 2026-09-12: 잎사귀 장식 잘라내고 캐릭터만 남긴 크기로 갱신
  eyes: { w: 78, h: 77 },
  eyesHappy: { w: 77, h: 29 },
  mouthClosed: { w: 48, h: 19 },
  mouthOpen: { w: 73, h: 43 },
  armDown: { w: 47, h: 89 },
  armReach: { w: 95, h: 74 },
  legs: { w: 124, h: 55 },
};

export default function Character({
  animationState,
  color = "green",
  size = 160,
  onEatingComplete,
  foodEmotion,
  level,
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

  // 몸통 높이 기준 스케일(전체 높이의 50%) -- 이 값을 다른 모든 파츠에도 곱해서 실제 비율 유지.
  // (예전엔 너비 기준으로 스케일했는데, 잎사귀 뺀 새 크롭은 세로로 길쭉해서 너비 기준이면
  //  몸통이 컨테이너를 거의 다 채워버림)
  const scale = (size * 0.5) / NATIVE.body.h;
  const bodyW = NATIVE.body.w * scale;
  const bodyH = NATIVE.body.h * scale;

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <Limbs armState={armState} legState={legState} size={size} scale={scale} bodyW={bodyW} bodyH={bodyH} />

      <motion.div
        variants={bodyVariants}
        animate={bodyState}
        style={
          BODY_ASSET[color]
            ? {
                // 실제 사진(귀 튀어나온 불규칙 실루엣, 투명배경)은 도형 틀 없이 원본 비율 그대로
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -bodyW / 2,
                marginTop: -bodyH / 2,
                width: bodyW,
                height: bodyH,
                backgroundImage: `url(${BODY_ASSET[color]})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }
            : {
                // placeholder: 사진 없는 색상(green/brown)은 색칠된 둥근 도형으로 대체
                position: "absolute",
                inset: 0,
                margin: "auto",
                width: size * 0.72,
                height: size * 0.72,
                borderRadius: "42% 42% 46% 46% / 50% 50% 40% 40%",
                background: BODY_COLOR_HEX[color],
              }
        }
      />

      <Outfit level={level} scale={scale} bodyTop={(size - bodyH) / 2} bodyH={bodyH} />

      <Face eyeState={eyeState} mouthState={mouthState} size={size} scale={scale} bodyH={bodyH} />

      <AnimatePresence>
        {(eatPhase === "anticipate" || eatPhase === "reach" || eatPhase === "toMouth") && (
          <FoodOverlay key="food" eatPhase={eatPhase} emotion={foodEmotion} size={size} bodyTop={(size - bodyH) / 2} bodyH={bodyH} />
        )}
      </AnimatePresence>

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

// --- 옷 레이어: 레벨에 맞는 의상을 몸통 위에 겹쳐 입힘 (진화 대신 옷 갈아입기) ----
// 정면 이미지만 씀(캐릭터는 항상 정면만 보여주니까). 뒷면/옆면은 나중에 옷장 화면에서 씀.
function Outfit({
  level,
  scale,
  bodyTop,
  bodyH,
}: {
  level?: number;
  scale: number;
  bodyTop: number;
  bodyH: number;
}) {
  const outfit = getOutfitForLevel(level ?? 0);
  if (!outfit) return null;

  const w = outfit.frontNative.w * scale;
  const h = outfit.frontNative.h * scale;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: bodyTop + bodyH * 0.32,
        marginLeft: -w / 2,
        width: w,
        height: h,
        backgroundImage: `url(${outfit.front})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top center",
        zIndex: 2,
      }}
    />
  );
}

// --- 먹이 레이어: 요정이 준 먹이가 손(reach)에서 입(toMouth)으로 이동 -----------
// PROJECT_SUMMARY 13번 섹션 "팔 뻗어서 캐치 -> 손을 입으로 이동" 단계에 실제 먹이 아이콘을 붙임.
function FoodOverlay({
  eatPhase,
  emotion,
  size,
  bodyTop,
  bodyH,
}: {
  eatPhase: EatPhase;
  emotion?: Emotion;
  size: number;
  bodyTop: number;
  bodyH: number;
}) {
  const entry = emotion ? FOOD_ICON_MAP[emotion] : null;
  const foodSize = size * 0.22;
  const atMouth = eatPhase === "toMouth";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, x: size * 0.34, y: bodyTop + bodyH * 0.5 }}
      animate={{
        opacity: 1,
        scale: atMouth ? 0.55 : 1,
        x: atMouth ? 0 : size * 0.34,
        y: atMouth ? bodyTop + bodyH * 0.4 : bodyTop + bodyH * 0.5,
        transition: { duration: EAT_PHASE_DURATION[eatPhase] / 1000, ease: "easeOut" },
      }}
      exit={{ opacity: 0, scale: 0.3, transition: { duration: 0.12 } }}
      style={{
        position: "absolute",
        left: "50%",
        top: 0,
        width: foodSize,
        height: foodSize,
        marginLeft: -foodSize / 2,
        backgroundImage: entry?.asset ? `url(${entry.asset})` : undefined,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        fontSize: foodSize * 0.8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      {!entry?.asset && (entry?.emoji ?? "🍽️")}
    </motion.div>
  );
}

// --- 사지 레이어: 팔 2개 + 다리 -----------------------------------------------
function Limbs({
  armState,
  legState,
  size,
  scale,
  bodyW,
  bodyH,
}: {
  armState: string;
  legState: string;
  size: number;
  scale: number;
  bodyW: number;
  bodyH: number;
}) {
  // down 이외(reach/toMouth/celebrateWave)는 전부 "뻗은" 포즈 아트로
  const armPose: "down" | "reach" = armState === "down" ? "down" : "reach";
  const armAsset = ARM_ASSET[armPose];
  const armNative = armPose === "down" ? NATIVE.armDown : NATIVE.armReach;
  const armW = armNative.w * scale;
  const armH = armNative.h * scale;

  const bodyTop = (size - bodyH) / 2;

  const armBase = (side: "left" | "right") => ({
    position: "absolute" as const,
    top: bodyTop + bodyH * 0.55,
    [side]: size / 2 - bodyW / 2 - armW * 0.35,
    width: armW,
    height: armH,
    background: armAsset ? "transparent" : "#B08968",
    backgroundImage: armAsset ? `url(${armAsset})` : undefined,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    transformOrigin: side === "left" ? "top right" : "top left",
  });

  const legsW = NATIVE.legs.w * scale;
  const legsH = NATIVE.legs.h * scale;

  return (
    <>
      <motion.div variants={armVariants} animate={armState} style={armBase("left")} />
      <motion.div variants={armVariants} animate={armState} style={{ ...armBase("right"), scaleX: -1 }} />
      <motion.div
        variants={legVariants}
        animate={legState}
        style={{
          position: "absolute",
          top: bodyTop + bodyH - legsH * 0.4,
          left: "50%",
          marginLeft: -legsW / 2,
          width: legsW,
          height: legsH,
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
function Face({
  eyeState,
  mouthState,
  size,
  scale,
  bodyH,
}: {
  eyeState: string;
  mouthState: "open" | "closed";
  size: number;
  scale: number;
  bodyH: number;
}) {
  const bodyTop = (size - bodyH) / 2;
  const isHappy = eyeState === "happy";
  const eyeAsset = isHappy ? EYES_HAPPY_ASSET : EYES_ASSET;
  const eyeNative = isHappy ? NATIVE.eyesHappy : NATIVE.eyes;
  const eyeW = eyeNative.w * scale;
  const eyeH = eyeNative.h * scale;

  const mouthNative = mouthState === "open" ? NATIVE.mouthOpen : NATIVE.mouthClosed;
  const mouthW = mouthNative.w * scale;
  const mouthH = mouthNative.h * scale;

  return (
    <div
      style={{
        position: "absolute",
        top: bodyTop + bodyH * 0.42,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: eyeW * 0.5 }}>
        {eyeAsset ? (
          <>
            <motion.img src={eyeAsset} variants={eyeVariants} animate={eyeState} style={{ width: eyeW, height: eyeH }} alt="" />
            <motion.img
              src={eyeAsset}
              variants={eyeVariants}
              animate={eyeState}
              style={{ width: eyeW, height: eyeH, scaleX: -1 }}
              alt=""
            />
          </>
        ) : (
          <>
            <motion.div variants={eyeVariants} animate={eyeState} style={{ width: eyeW, height: eyeH, borderRadius: "50%", background: "#4A3F35" }} />
            <motion.div variants={eyeVariants} animate={eyeState} style={{ width: eyeW, height: eyeH, borderRadius: "50%", background: "#4A3F35" }} />
          </>
        )}
      </div>
      <motion.div
        variants={mouthVariants}
        animate={mouthState}
        style={{
          marginTop: eyeH * 0.6,
          width: mouthW,
          height: mouthH,
          background: MOUTH_ASSET[mouthState] ? "transparent" : "#8B5E4A",
          backgroundImage: MOUTH_ASSET[mouthState] ? `url(${MOUTH_ASSET[mouthState]})` : undefined,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
        }}
      />
    </div>
  );
}
