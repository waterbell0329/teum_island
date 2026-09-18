"use client";

// 펫 캐릭터. 몸통(사진 한 장) + 얼굴(눈+입)을 animationState 하나로 제어.
//
// 2026-09-18: 팔다리는 완전히 뺐음 (사용자 요청) -- 이전엔 고정 자세로라도 그려주고 있었는데,
// 그마저도 위치 맞추는 게 계속 말썽이라 아예 없애고 "몸통 사진 한 장 + 눈 깜빡임"만으로
// 캐릭터를 표현하기로 함. 생동감은 몸통 전체를 사진 단위로 스쿼시앤스트레치시키는
// bodyVariants(lib/animations.ts)와 눈 깜빡임이 전담. 요정(Fairy.tsx)도 같은 방향으로
// 부위별 리깅을 포기하고 통짜 이미지 방식으로 이미 전환했음.
//
// 남은 파츠(몸통/눈/입)는 원본 시트(all_parts.json 기준)의 실제 픽셀 크기 비율(NATIVE)로
// 스케일링해서 배치함 -- 예전엔 %로 대충 잡아서 실제 그림보다 훨씬 크게 보이는 문제가 있었음.
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  bodyVariants,
  eyeVariants,
  mouthVariants,
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

interface CharacterProps {
  animationState: CharacterAnimationState;
  size?: number;
  /** eating 6단계 시퀀스가 다 끝나면 호출됨 (부모가 celebrating으로 넘기는 타이밍 등에 사용) */
  onEatingComplete?: () => void;
  /** 지금 먹이고 있는 감정(=먹이 종류). 있으면 reach~toMouth 구간에 실제 먹이 아이콘이 손에서 입으로 이동함 */
  foodEmotion?: Emotion;
  /** 유저 레벨. 있으면 레벨에 맞는 옷(lib/outfits.ts)을 몸통 위에 겹쳐 입힘 (레벨업="옷 갈아입기" 원칙) */
  level?: number;
}

// --- 실제 아트 경로 (2026-09-12 반영) ------------------------------------------
// 캐릭터 색상 베리에이션은 안 하기로 확정 (2026-09-14) -- 이 캐릭터 하나로만 진행.
const BODY_ASSET: string | null = "/assets/character/body-beige.png";
const BODY_FALLBACK_COLOR = "#F5EFE0"; // 아이보리 -- 혹시 파일이 없을 때만 쓰는 도형 placeholder용
const EYES_ASSET: string | null = "/assets/character/eyes.png";
const EYES_HAPPY_ASSET: string | null = "/assets/character/eyes-happy.png"; // 감은(웃는) 눈, celebrating용
const MOUTH_ASSET: Record<"closed" | "open", string | null> = {
  closed: "/assets/character/mouth-closed.png",
  open: "/assets/character/mouth-open.png",
};
// 원본 시트에서 각 파츠의 실제 픽셀 크기 (all_parts.json). 몸통 너비 기준으로 전부 같은
// 비율(scale)을 곱해서 배치 -> 실제 그림 비율 그대로 유지됨.
const NATIVE = {
  body: { w: 280, h: 368 }, // 2026-09-12: 잎사귀 장식 잘라내고 캐릭터만 남긴 크기로 갱신
  eyes: { w: 78, h: 77 },
  eyesHappy: { w: 77, h: 29 },
  mouthClosed: { w: 48, h: 19 },
  mouthOpen: { w: 73, h: 43 },
};

export default function Character({
  animationState,
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
      <motion.div
        variants={bodyVariants}
        animate={bodyState}
        style={
          BODY_ASSET
            ? {
                // 실제 사진(귀 튀어나온 불규칙 실루엣, 투명배경)은 도형 틀 없이 원본 비율 그대로
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -bodyW / 2,
                marginTop: -bodyH / 2,
                width: bodyW,
                height: bodyH,
                backgroundImage: `url(${BODY_ASSET})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }
            : {
                // placeholder: 파일이 없을 때만 색칠된 둥근 도형으로 대체
                position: "absolute",
                inset: 0,
                margin: "auto",
                width: size * 0.72,
                height: size * 0.72,
                borderRadius: "42% 42% 46% 46% / 50% 50% 40% 40%",
                background: BODY_FALLBACK_COLOR,
              }
        }
      />

      <Outfit level={level} bodyTop={(size - bodyH) / 2} bodyH={bodyH} bodyW={bodyW} />

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
  bodyTop,
  bodyH,
  bodyW,
}: {
  level?: number;
  bodyTop: number;
  bodyH: number;
  bodyW: number;
}) {
  const outfit = getOutfitForLevel(level ?? 0);
  if (!outfit) return null;

  // 2026-09-18: 의상 사진마다 원본 비율이 다 달라서(몸통 사진이랑 별도로 찍힌 거라 서로
  // 맞춰 찍힌 게 아님) 얼굴을 덮어버리는 사고가 계속 재발했음. 이번엔 "몸통 폭에 맞춰서"
  // 끼우는 방식으로 바꿈 -- 옷 너비를 몸통 너비의 일정 비율(WIDTH_FACTOR)로 먼저 맞추고
  // (실제 입은 것처럼 폭이 맞아떨어지게), 그 폭 기준으로 옷의 원본 비율을 유지해서 높이를
  // 정함. 그렇게 했을 때 혹시 얼굴 아래 안전영역보다 키가 커지면(세로로 긴 옷) 그때만
  // 높이를 안전영역에 맞춰 다시 줄임(-> 얼굴은 절대 안 덮이는 것도 그대로 보장됨).
  const WIDTH_FACTOR = 0.8; // 몸통 사진 폭(귀 포함) 대비 옷 폭 비율, 스크린샷으로 보정한 값
  // 옷마다 목선/어깨 장식이 이미지 박스 안에서 차지하는 여백이 달라서(예: 어깨 나뭇잎
  // 상의는 장식이 위쪽까지 꽉 차있음), 0.56로는 일부 옷이 입 근처까지 닿아서 좀 더 내림
  const SAFE_TOP = 0.6;
  const SAFE_BOTTOM = 0.98;
  const maxH = bodyH * (SAFE_BOTTOM - SAFE_TOP);
  const aspect = outfit.frontNative.w / outfit.frontNative.h;

  let w = bodyW * WIDTH_FACTOR;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: bodyTop + bodyH * SAFE_TOP,
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

  // 몸통 오른쪽 옆(대략 size*0.2 부근)에서 살짝 떨어져 왔다가 입 쪽으로 이동하는 동선
  // (2026-09-18: 팔 자체는 없앴지만, 먹이가 어디선가 다가와서 먹히는 느낌은 유지)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, x: size * 0.2, y: bodyTop + bodyH * 0.5 }}
      animate={{
        opacity: 1,
        scale: atMouth ? 0.55 : 1,
        x: atMouth ? 0 : size * 0.2,
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
