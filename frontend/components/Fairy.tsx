"use client";

// 요정(얼룩이). 원래는 몸통/얼굴/날개/꼬리/다리 5레이어로 따로 리깅하려 했는데,
// 몸통만 따로 분리하기 어렵다고 하셔서 (2026-09-14) 보내주신 완성 일러스트를
// 통짜 이미지 하나로 쓰는 방식으로 전환. 그 대신 최대한 생동감 있어 보이도록
// 전체를 하나의 단위로 통통 튀고 기울어지는 모션을 붙임 (날개짓/꼬리부채짓처럼
// 부위별로 따로 움직이던 디테일은 포기하는 대신, 실제 채색된 그림이 그대로 보여서
// 훨씬 더 완성도 있어 보임).
import { motion, AnimatePresence, type Variants } from "framer-motion";

// understood: 4컷 제스처 참고자료의 "4. 경청 후 반응" 단계 (고개 끄덕 + 생각풍선)
// -- 듣기와 편지 전달 사이에 짧게 끼워서 "마음을 이해했다"는 느낌을 줌
export type FairyState = "hidden" | "summon" | "listening" | "understood" | "deliver";

interface FairyProps {
  state: FairyState;
  size?: number;
  mini?: boolean; // 홈 화면 우상단 상시노출용 미니 아이콘
}

// 2026-09-14: "펫.png" 원본 시트의 main_bird_illustration 영역을 배경 제거해서 뽑은 완성 그림
const BODY_ASSET = "/assets/fairy/body.png";
const NATIVE = { w: 435, h: 400 }; // 크롭된 원본 픽셀 비율 (가로가 살짝 더 김)

// 전체를 하나의 단위로 움직이는 모션. framer-motion variant 키를 FairyState 값과
// 그대로 맞춰놔서 컴포넌트에서 animate={state}만 넘기면 됨.
const bodyVariants: Variants = {
  summon: {
    scale: [0.3, 1.2, 0.92, 1.05, 1],
    rotate: [0, -10, 6, -3, 0],
    transition: { duration: 0.7, ease: "backOut" },
  },
  listening: {
    y: [0, -5, 0],
    rotate: [-2, 2, -2],
    transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
  },
  understood: {
    scale: [1, 1.12, 0.96, 1.03, 1],
    y: [0, -5, 0],
    transition: { duration: 0.55, ease: "easeInOut" },
  },
  deliver: {
    rotate: [0, 9, -6, 4, 0],
    y: [0, -6, 0, -3, 0],
    transition: { duration: 0.8, ease: "easeInOut" },
  },
};

export default function Fairy({ state, size = 120, mini = false }: FairyProps) {
  const width = size;
  const height = size * (NATIVE.h / NATIVE.w);

  return (
    <AnimatePresence>
      {state !== "hidden" && (
        <motion.div
          key="fairy"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.25 } }}
          style={{ position: "relative", width, height }}
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
                  lineHeight: `${height}px`, fontSize: size * 0.2, pointerEvents: "none", zIndex: 5,
                }}
              >
                ✨
              </motion.div>
            )}
          </AnimatePresence>

          {/* understood 생각풍선 (참고자료 4번 컷 -- 알아챘다는 반응) */}
          <AnimatePresence>
            {state === "understood" && (
              <motion.div
                key="thought"
                initial={{ opacity: 0, y: 4, scale: 0.6 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: "backOut" } }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
                style={{
                  position: "absolute", top: -size * 0.1, right: -size * 0.02,
                  fontSize: size * 0.2, zIndex: 6, pointerEvents: "none",
                }}
              >
                💡
              </motion.div>
            )}
          </AnimatePresence>

          <motion.img
            src={BODY_ASSET}
            alt=""
            variants={bodyVariants}
            animate={state}
            style={{ width, height, display: "block" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
