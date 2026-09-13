"use client";

// 홈 화면 상단: 좌상단 설정+유저이름, 우상단 얼룩이 미니아이콘(누르면 편지함).
import { useState } from "react";
import Link from "next/link";
import Fairy from "./Fairy";
import SettingsModal from "./SettingsModal";

export default function HomeHeader({ nickname }: { nickname: string | null }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "var(--space-4)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* 설정 아이콘 -- 실제 파일 없어서 이모지 placeholder지만, 누르면 진짜 설정 화면(모달)이 열림 */}
        <button
          aria-label="설정"
          onClick={() => setSettingsOpen(true)}
          style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", minWidth: 44, minHeight: 44 }}
        >
          ⚙️
        </button>
        <span style={{ fontSize: 13, color: "var(--color-text)" }}>{nickname || "친구"}</span>
      </div>

      <Link href="/letters" aria-label="편지 보관함">
        <Fairy state="listening" size={48} mini />
      </Link>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
