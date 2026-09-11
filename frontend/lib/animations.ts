// Character.tsx 3레이어(몸통/얼굴/사지)가 쓰는 Framer Motion variant 모음.
// PROJECT_SUMMARY.md "13. 애니메이션 참고" 섹션의 캐치→먹기→셀레브레이션 시퀀스를
// element.animate() keyframe 구조 그대로 Framer Motion으로 옮긴 것.
// 핵심 원칙: 스쿼시앤스트레치 + 레이어 분리 + 바운스 이징 -> 그림보다 타이밍이 8할.

import type { Variants, Transition } from "framer-motion";

// 바운스 이징 (과도하게 튀지 않는 정도의 back-ease)
export const BOUNCE: Transition["ease"] = [0.34, 1.56, 0.64, 1];

// "먹기" 시퀀스의 세부 단계. Character.tsx가 eating 상태일 때 이 순서로 진행시킴.
export type EatPhase = "idle" | "anticipate" | "reach" | "toMouth" | "chew1" | "chew2" | "crumble";

// 각 단계가 몇 ms 지속되는지 (Character.tsx의 setTimeout 시퀀서가 사용)
export const EAT_PHASE_DURATION: Record<EatPhase, number> = {
  idle: 0,
  anticipate: 250,
  reach: 350,
  toMouth: 250,
  chew1: 220,
  chew2: 220,
  crumble: 350,
};

export const EAT_PHASE_ORDER: EatPhase[] = [
  "anticipate",
  "reach",
  "toMouth",
  "chew1",
  "chew2",
  "crumble",
];

// ---------------------------------------------------------------------------
// 몸통 레이어 (스쿼시앤스트레치 담당)
// ---------------------------------------------------------------------------
export const bodyVariants: Variants = {
  idle: {
    y: [0, -4, 0],
    scaleX: [1, 1.01, 1],
    scaleY: [1, 0.99, 1],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
  listening: {
    y: -2,
    scaleY: 1.03,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  anticipate: {
    // 예비동작: 웅크림 (세로로 눌리고 가로로 퍼짐)
    scaleY: 0.85,
    scaleX: 1.08,
    y: 4,
    transition: { duration: EAT_PHASE_DURATION.anticipate / 1000, ease: "easeOut" },
  },
  reach: {
    // 팔 뻗을 때 몸통도 살짝 앞으로 스트레치
    scaleY: 1.1,
    scaleX: 0.95,
    y: -6,
    transition: { duration: EAT_PHASE_DURATION.reach / 1000, ease: BOUNCE },
  },
  toMouth: {
    scaleY: 1.02,
    scaleX: 1,
    y: 0,
    transition: { duration: EAT_PHASE_DURATION.toMouth / 1000, ease: "easeInOut" },
  },
  chew1: {
    scaleY: [1, 0.92, 1],
    transition: { duration: EAT_PHASE_DURATION.chew1 / 1000, ease: "easeInOut" },
  },
  chew2: {
    scaleY: [1, 0.92, 1],
    transition: { duration: EAT_PHASE_DURATION.chew2 / 1000, ease: "easeInOut" },
  },
  crumble: {
    scale: [1, 1.05, 1],
    transition: { duration: EAT_PHASE_DURATION.crumble / 1000, ease: "easeOut" },
  },
  celebrating: {
    y: [0, -14, 0, -8, 0],
    rotate: [0, -4, 4, -2, 0],
    scaleX: [1, 1.08, 0.95, 1.04, 1],
    scaleY: [1, 0.92, 1.08, 0.97, 1],
    transition: { duration: 1.1, ease: BOUNCE },
  },
};

// ---------------------------------------------------------------------------
// 얼굴 레이어 (눈 + 입)
// ---------------------------------------------------------------------------
export const eyeVariants: Variants = {
  open: { scaleY: 1 },
  blink: { scaleY: [1, 0.05, 1], transition: { duration: 0.18, ease: "easeInOut" } },
  happy: { scaleY: 0.6, y: -1, transition: { duration: 0.2 } }, // 셀레브레이션 때 웃는 눈
};

export const mouthVariants: Variants = {
  closed: { scaleY: 1, opacity: 1 },
  open: { scaleY: 1.4, opacity: 1, transition: { duration: 0.12, ease: "easeOut" } },
};

// ---------------------------------------------------------------------------
// 사지 레이어 (팔 + 다리)
// ---------------------------------------------------------------------------
export const armVariants: Variants = {
  down: { rotate: 0, y: 0, transition: { duration: 0.25 } },
  reach: {
    rotate: -35,
    y: -6,
    transition: { duration: EAT_PHASE_DURATION.reach / 1000, ease: BOUNCE },
  },
  toMouth: {
    rotate: -70,
    y: -10,
    transition: { duration: EAT_PHASE_DURATION.toMouth / 1000, ease: "easeOut" },
  },
  celebrateWave: {
    rotate: [0, -25, 15, -20, 0],
    transition: { duration: 1.1, ease: "easeInOut" },
  },
};

export const legVariants: Variants = {
  idle: { rotate: 0 },
  celebrateKick: {
    rotate: [0, 12, -12, 8, 0],
    transition: { duration: 1.1, ease: "easeInOut" },
  },
};

// ---------------------------------------------------------------------------
// 부스러기(먹이 소멸) + 셀레브레이션 반짝이 오버레이
// ---------------------------------------------------------------------------
export const crumbVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  scatter: {
    opacity: [1, 1, 0],
    scale: [0.6, 1, 0.4],
    transition: { duration: EAT_PHASE_DURATION.crumble / 1000, ease: "easeOut" },
  },
};

export const sparkleVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  burst: {
    opacity: [0, 1, 0],
    scale: [0.3, 1.2, 0.8],
    transition: { duration: 1.1, ease: "easeOut" },
  },
};
