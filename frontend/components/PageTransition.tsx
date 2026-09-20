"use client";

// 화면 전환 애니메이션. 2026-09-19: 모든 라우트(/, /input, /letters, /quests, /closet,
// /onboarding 등)에 동일하게 opacity+y 8px 페이드 슬라이드 하나로 통일 (이전엔 탭별로
// 슬라이드업/페이드를 구분했었는데, 더 단순하고 일관된 마이크로 인터랙션 스펙으로 교체).
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25, ease: "easeOut" } },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
