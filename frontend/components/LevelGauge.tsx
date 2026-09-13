"use client";

// 홈 화면 목업(2026-09-13) 반영: "Lv.N" 알약 배지 + 게이지 + "현재/필요XP" 숫자를
// 한 줄짜리 흰색 필 안에 다 담는 형태로 재구성.
import { xpRequiredForLevel } from "@/lib/xp";

export default function LevelGauge({ level, currentXp }: { level: number; currentXp: number }) {
  const needed = xpRequiredForLevel(level);
  const pct = needed > 0 ? Math.min(100, (currentXp / needed) * 100) : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 8px 8px 6px",
        borderRadius: 999,
        background: "#fff",
        boxShadow: "var(--shadow-soft)",
        margin: "0 var(--space-5)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-jua)",
          fontSize: 13,
          color: "var(--color-text)",
          background: "var(--color-main-green)",
          borderRadius: 999,
          padding: "4px 12px",
          whiteSpace: "nowrap",
        }}
      >
        Lv.{level}
      </span>
      <div
        style={{
          flex: 1,
          height: 10,
          borderRadius: 999,
          background: "#EAF3EE",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#8FD3E8", // 하늘색 게이지 (PROJECT_SUMMARY 4번 섹션)
            borderRadius: 999,
            transition: "width 0.4s ease-out",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: "var(--color-brown)", whiteSpace: "nowrap", paddingRight: 4 }}>
        {currentXp}/{needed}
      </span>
    </div>
  );
}
