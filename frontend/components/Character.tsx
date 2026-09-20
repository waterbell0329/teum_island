"use client";

// 펫 캐릭터. 2026-09-19 2차 개편: 몸통 사진 한 장 + 모션 방식에서, 상태별로 완전히
// 다른 통짜 이미지를 크로스페이드로 갈아끼우는 방식으로 다시 바꿈 (idle/listening/
// eating/celebrating 각각 별도 이미지 -- 이미지 생성 AI로 제작해서 표정/자세가
// 상태마다 실제로 다르게 그려져 있음). 옷은 레벨별 28종 대신 성장 단계(1/2/3,
// lib/growthStage.ts) 하나당 이미지 한 장으로 단순화해서 몸통과 같은 박스에 겹쳐 그림.
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { crumbVariants, sparkleVariants } from "@/lib/animations";
import { FOOD_ICON_MAP } from "@/components/FoodIcon";
import { getGrowthStage, getStageOutfitAsset } from "@/lib/growthStage";
import type { Emotion } from "@/types/emotion";

export type CharacterAnimationState = "idle" | "listening" | "eating" | "celebrating";

interface CharacterProps {
  animationState: CharacterAnimationState;
  size?: number;
  /** eating 상태가 다 끝나면 호출됨 (부모가 celebrating으로 넘기는 타이밍 등에 사용) */
  onEatingComplete?: () => void;
  /** 지금 먹이고 있는 감정(=먹이 종류). 있으면 eating 동안 먹이 아이콘이 위에서 내려옴 */
  foodEmotion?: Emotion;
  /** 유저 레벨. 있으면 성장 단계(lib/growthStage.ts)에 맞는 옷을 몸통 위에 겹쳐 입힘 */
  level?: number;
}

// 상태별 통짜 이미지 (2026-09-19: 이미지 생성 AI로 제작, 4장 다 같은 캔버스 비율로 통일)
const STATE_ASSET: Record<CharacterAnimationState, string> = {
  idle: "/assets/character/idle.png",
  listening: "/assets/character/listening.png",
  eating: "/assets/character/eating.png",
  celebrating: "/assets/character/celebrating.png",
};
// 2026-09-20: (1) 나뭇가지가 꼬리처럼 잘려 보인다는 피드백 받고 누끼를 다시 땀(모폴로지
// opening으로 가지 연결부를 끊은 뒤 잔가지까지 수작업으로 지움). (2) "옷을 안 입었다"는
// 피드백 받고 idle/listening/celebrating은 원본 시트의 옷 입은 포즈로 교체함 (eating은
// 입 벌린 표정을 살리려고 맨몸 포즈 유지 -- 옷 입은 mouth-open 포즈가 시트에 없었음).
const NATIVE = { w: 179, h: 158 };
// 사진 속 입이 대략 이 높이(몸통 전체 높이 대비 비율)에 있음 -- 먹이가 내려오는 착지 지점.
const MOUTH_Y_FRACTION = 0.58;
// eating 상태를 유지하는 총 시간(ms) -- 먹이가 내려와서 사라지고, 부스러기가 튀는 것까지 포함.
const EATING_DURATION_MS = 1400;

export default function Character({
  animationState,
  size = 160,
  onEatingComplete,
  foodEmotion,
  level,
}: CharacterProps) {
  const [showCrumb, setShowCrumb] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // --- eating 상태가 되면 일정 시간 후 부스러기를 띄우고, 다 끝나면 부모에게 알림 ---
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (animationState !== "eating") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- eating을 벗어나면 부스러기 표시를 바로 꺼야 함
      setShowCrumb(false);
      return;
    }

    const crumbTimer = setTimeout(() => setShowCrumb(true), EATING_DURATION_MS - 400);
    const doneTimer = setTimeout(() => {
      setShowCrumb(false);
      onEatingComplete?.();
    }, EATING_DURATION_MS);
    timers.current.push(crumbTimer, doneTimer);

    return () => timers.current.forEach(clearTimeout);
    // onEatingComplete는 의도적으로 deps에서 제외 (부모 리렌더마다 새 함수여도 시퀀스 재시작 안 되게)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationState]);

  // 몸통 높이 기준 스케일(전체 높이의 50%) -- 옷 오버레이도 이 값을 곱해서 같은 박스에 맞춤.
  const scale = (size * 0.5) / NATIVE.h;
  const bodyW = NATIVE.w * scale;
  const bodyH = NATIVE.h * scale;
  const bodyTop = (size - bodyH) / 2;
  const outfitAsset = getStageOutfitAsset(getGrowthStage(level ?? 0));

  const bodyBoxStyle = {
    position: "absolute" as const,
    left: "50%",
    top: "50%",
    marginLeft: -bodyW / 2,
    marginTop: -bodyH / 2,
    width: bodyW,
    height: bodyH,
    // objectFit:contain 안전장치 -- 이미지 비율이 NATIVE(183:167)랑 살짝 안 맞아도
    // 찌그러지는 대신 레터박스(투명 여백)로 처리됨. 나중에 새 에셋 받아서 NATIVE 값만
    // 갱신해도 이 objectFit은 그대로 둬도 무해함.
    objectFit: "contain" as const,
  };

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      {/* 통짜 이미지 한 장이라 표정 스와핑 대신, 몸통 전체를 아주 은은하게 위아래로
          숨쉬듯 흔들어서 가만히 멈춰있지 않게 함 (2026-09-20 생동감 보강) */}
      <motion.div
        animate={{ y: [0, -size * 0.02, 0], scale: [1, 1.015, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* 상태별 통짜 이미지 크로스페이드: 같은 자리에 겹쳐두고 opacity만 페이드 */}
        <AnimatePresence>
          <motion.img
            key={animationState}
            src={STATE_ASSET[animationState]}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={bodyBoxStyle}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </AnimatePresence>

        {outfitAsset && (
          <img
            src={outfitAsset}
            alt=""
            style={{ ...bodyBoxStyle, zIndex: 2, pointerEvents: "none" }}
            // stage1~3.png는 아직 채영님이 안 보내준 상태라 파일이 없을 수 있음 -- 깨진
            // 이미지 아이콘이 캐릭터 위에 뜨는 것보다는 조용히 숨기는 게 나음
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {animationState === "eating" && (
          <FoodOverlay key="food" emotion={foodEmotion} size={size} bodyTop={bodyTop} bodyH={bodyH} durationMs={EATING_DURATION_MS} />
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
            // 38% 고정값이 입 위치(MOUTH_Y_FRACTION)랑 안 맞아서 부스러기가 얼굴 위에서
            // 튀는 것처럼 보이던 버그 수정 -- 먹이가 도착하는 지점(mouthY)이랑 맞춤
            style={{ position: "absolute", left: "50%", top: bodyTop + bodyH * MOUTH_Y_FRACTION, fontSize: size * 0.12 }}
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

// --- 먹이 레이어: 위에서 톡 떨어뜨려주면 입가에서 사라지는 방식 ---------------
function FoodOverlay({
  emotion,
  size,
  bodyTop,
  bodyH,
  durationMs,
}: {
  emotion?: Emotion;
  size: number;
  bodyTop: number;
  bodyH: number;
  durationMs: number;
}) {
  const entry = emotion ? FOOD_ICON_MAP[emotion] : null;
  const foodSize = size * 0.22;
  const aboveY = bodyTop - foodSize * 0.5;
  const mouthY = bodyTop + bodyH * MOUTH_Y_FRACTION - foodSize * 0.5;
  const dur = durationMs / 1000;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, y: aboveY }}
      animate={{
        opacity: [0, 1, 1, 1, 0],
        scale: [0.4, 1, 1, 1, 0.3],
        y: [aboveY, aboveY, mouthY, mouthY, mouthY],
        transition: { duration: dur, times: [0, 0.2, 0.45, 0.6, 0.75], ease: "easeInOut" },
      }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
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
