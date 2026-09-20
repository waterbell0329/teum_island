"use client";

// 홈 화면 상단: 좌상단 설정+유저이름, 우상단 얼룩이 미니아이콘(누르면 편지함).
// 2026-09-20: 기어 이모지가 어색하다는 피드백 받고 선 아이콘(SVG)으로 교체 + 닉네임을
// 헤딩 폰트로 키워서 좀 더 다듬어진 HUD 배지처럼 보이게 함.
import { useState } from "react";
import Link from "next/link";
import Fairy from "./Fairy";
import SettingsModal from "./SettingsModal";

const hudCardStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fff",
  borderRadius: 999,
  boxShadow: "var(--shadow-soft)",
} as const;

function GearIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function HomeHeader({ nickname }: { nickname: string | null }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "var(--space-4)",
      }}
    >
      <div style={{ ...hudCardStyle, gap: 8, padding: "5px 16px 5px 5px" }}>
        <button
          aria-label="설정"
          onClick={() => setSettingsOpen(true)}
          style={{
            background: "#F5EFE0",
            border: "none",
            borderRadius: "50%",
            width: 34,
            height: 34,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GearIcon />
        </button>
        <span style={{ fontSize: 14, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{nickname || "친구"}</span>
      </div>

      <Link href="/letters" aria-label="편지 보관함" style={{ ...hudCardStyle, width: 52, height: 52 }}>
        <Fairy state="listening" size={40} mini />
      </Link>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
