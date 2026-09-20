// Character.tsx / LevelUpScreen.tsx가 쓰는 Framer Motion variant 모음.
// 2026-09-19: 몸통을 부위별 합성 -> 사진 한 장 -> "상태별 통짜 이미지 크로스페이드"로
// 전환하면서, 몸통 스쿼시앤스트레치(bodyVariants)와 세부 eatPhase 시퀀스는 더 이상
// 필요 없어짐 -- 이제 상태 전환은 이미지 자체를 바꿔서 표현하고, 여기 남은 건
// 먹이 소멸/셀레브레이션 때 쓰는 오버레이 파티클뿐임.
import type { Variants } from "framer-motion";

export const crumbVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  scatter: {
    opacity: [1, 1, 0],
    scale: [0.6, 1, 0.4],
    transition: { duration: 0.35, ease: "easeOut" },
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
