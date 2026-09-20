"use client";

// 펫 캐릭터. 2026-09-20 3차 개편: "상태별 통짜 이미지 4장 크로스페이드 + 옷 오버레이"
// 방식에서, "레벨마다 옷을 이미 입고 있는 캐릭터 사진 한 장을 통째로 교체"하는 방식으로
// 바꿈 (lib/characterLevels.ts). 채영님이 레벨별 옷 입은 캐릭터 일러스트를 그려주면
// 그 사진으로 갈아끼움 -> 레벨업 = 새 옷 입은 사진으로 교체.
//
// 먹이를 실제로 먹는 연출(입 벌림/씹기/먹이 낙하)은 제거함 (2026-09-20 요청):
// 먹이 연출은 이제 EmotionCaptureFlow가 담당하고, 여기 캐릭터는 항상 레벨 사진 한 장을
// 은은한 숨쉬기 모션과 함께 보여준다. animationState prop은 호출부 호환을 위해 남겨두되
// celebrating일 때 반짝임만 추가로 띄운다(레벨업 축하).
import { motion, AnimatePresence } from "framer-motion";
import { getCharacterImageForLevel, REFERENCE_NATIVE_HEIGHT } from "@/lib/characterLevels";
import type { Emotion } from "@/types/emotion";

export type CharacterAnimationState = "idle" | "listening" | "eating" | "celebrating";

interface CharacterProps {
  animationState: CharacterAnimationState;
  size?: number;
  /** (호환용) 더 이상 먹기 시퀀스를 캐릭터가 돌리지 않음. 남겨둔 이유는 호출부 시그니처 유지. */
  onEatingComplete?: () => void;
  /** (호환용) 먹이 종류. 먹이 연출은 EmotionCaptureFlow로 옮겨서 여기선 안 씀. */
  foodEmotion?: Emotion;
  /** 유저 레벨. 이 레벨에 맞는 캐릭터 사진(lib/characterLevels.ts)을 통째로 보여줌. */
  level?: number;
}

export default function Character({ animationState, size = 160, level }: CharacterProps) {
  const img = getCharacterImageForLevel(level);

  // 모든 레벨 사진을 "가장 큰 세로(REFERENCE_NATIVE_HEIGHT)" 기준 동일 배율로 스케일해서,
  // 레벨업으로 사진이 바뀌어도 캐릭터 크기가 튀지 않게 함.
  // 2026-09-20: 캐릭터가 컨테이너를 꽉 채워서 너무 크게 보인다는 피드백 -> 세로 비율을
  // 낮춰서(72%) 위아래 여백을 확보하고, 컨테이너 정중앙에 오도록 정렬.
  const scale = (size * 0.72) / REFERENCE_NATIVE_HEIGHT;
  const w = img.w * scale;
  const h = img.h * scale;

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      {/* 통짜 사진 한 장. 레벨이 바뀌면(=src가 바뀌면) 크로스페이드로 부드럽게 교체.
          몸통 전체를 아주 은은하게 위아래로 숨쉬듯 흔들어서 정지 상태로 안 보이게 함. */}
      <motion.div
        animate={{ y: [0, -size * 0.02, 0], scale: [1, 1.015, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <AnimatePresence mode="popLayout">
          <motion.img
            key={img.src}
            src={img.src}
            alt="펫 캐릭터"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{
              position: "absolute",
              // 컨테이너 정중앙 정렬 (박스 가운데 = 50% 지점에 이미지 중심을 맞춤)
              left: "50%",
              top: "50%",
              marginLeft: -w / 2,
              marginTop: -h / 2,
              width: w,
              height: h,
              // 비율 안전장치: 사진마다 원본 비율이 달라도 찌그러지지 않고 레터박스 처리
              objectFit: "contain",
            }}
          />
        </AnimatePresence>
      </motion.div>

      {/* 레벨업 축하: celebrating 상태일 때만 반짝임 */}
      <AnimatePresence>
        {animationState === "celebrating" && (
          <motion.div
            key="sparkle"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0.7, 1], scale: [0.6, 1.15, 0.95, 1.1] }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
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
