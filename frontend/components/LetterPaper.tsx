"use client";

// 편지지. 두 군데서 재사용: (1) 입력 화면 - 유저가 오늘 하루를 "쓰는" 곳,
// (2) 편지 읽기 화면 - 얼룩이가 보내온 편지를 "받는" 곳. 같은 종이 배경 위에
// children으로 textarea(쓰기)든 편지 본문(읽기)이든 얹어서 씀.
import type { ReactNode } from "react";

const LETTER_PAPER_ASSET: string | null = null; // "/assets/icons/letter-paper.png"

interface LetterPaperProps {
  children: ReactNode;
  className?: string;
}

export default function LetterPaper({ children, className }: LetterPaperProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        borderRadius: 20, // 카드 radius 스케일(20px) 준수
        padding: 24,
        background: LETTER_PAPER_ASSET ? "transparent" : "#FBF6EA",
        backgroundImage: LETTER_PAPER_ASSET ? `url(${LETTER_PAPER_ASSET})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: "0 4px 12px rgba(139, 111, 71, 0.08)", // 갈색톤 그림자 (순검정 금지)
        border: LETTER_PAPER_ASSET ? undefined : "1px solid #ECE1CC",
      }}
    >
      {/* 편지 본문은 왼쪽 정렬 (디자인 원칙: 실제 편지 읽는 느낌 유지) */}
      <div style={{ textAlign: "left" }}>{children}</div>

      {!LETTER_PAPER_ASSET && (
        <span
          aria-hidden
          style={{ position: "absolute", right: 12, bottom: 8, fontSize: 18, opacity: 0.6 }}
        >
          🌿
        </span>
      )}
    </div>
  );
}
