"use client";

// 화면 전환 애니메이션 (채영님 개선안, 2026-09-18)
// 기본 원칙: 바운스/스프링 금지, 부드러운 슬라이드만 사용, 화면마다 규칙 통일.
// 탭 차별화: 홈에서 하단네비(옷장/퀘스트)나 입력(먹이주기)으로 들어갈 때는
//   슬라이드업 + 페이드인, 나갈 때(홈으로 복귀)는 반대로 슬라이드다운 + 페이드아웃.
// 그 외 전환(로그인->온보딩->홈 등)은 은은한 페이드만 사용.
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// 홈에서 "위로 열리는" 느낌으로 들어가는 화면들 (하단네비 탭 + 먹이주기 입력 화면)
const SLIDE_UP_ROUTES = ["/closet", "/quests", "/input", "/letters"];

const EASE_OUT: [number, number, number, number] = [0.22, 0.61, 0.36, 1]; // 바운스 없는 부드러운 감속
const EASE_IN: [number, number, number, number] = [0.55, 0, 0.85, 0.35];

const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
  exit: { opacity: 0, y: 28, transition: { duration: 0.22, ease: EASE_IN } },
};

const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: EASE_IN } },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const variants = SLIDE_UP_ROUTES.includes(pathname) ? slideUpVariants : fadeVariants;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname} variants={variants} initial="initial" animate="animate" exit="exit">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
