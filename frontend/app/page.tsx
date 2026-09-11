"use client";

// ⚠️ 임시 데모 화면. Character.tsx 3레이어 애니메이션을 눈으로 확인하기 위한 용도.
// 실제 홈 화면(CLAUDE_1.md 우선순위 1번)이 만들어지면 이 파일은 갈아엎을 것.
import { useState } from "react";
import Character, { type CharacterAnimationState, type CharacterColor } from "@/components/Character";

const STATES: CharacterAnimationState[] = ["idle", "listening", "eating", "celebrating"];
const COLORS: CharacterColor[] = ["green", "beige", "brown"];

export default function Home() {
  const [state, setState] = useState<CharacterAnimationState>("idle");
  const [color, setColor] = useState<CharacterColor>("green");

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        background: "#FFFBF5",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ color: "#4A3F35", fontSize: 20 }}>Character 데모 (플레이스홀더 아트)</h1>

      <Character
        animationState={state}
        color={color}
        size={200}
        onEatingComplete={() => setState("celebrating")}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {STATES.map((s) => (
          <button
            key={s}
            onClick={() => setState(s)}
            style={{
              padding: "8px 16px",
              borderRadius: 16,
              border: "none",
              background: state === s ? "#A8D5BA" : "#F5EFE0",
              color: "#4A3F35",
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              padding: "6px 14px",
              borderRadius: 16,
              border: color === c ? "2px solid #B08968" : "1px solid #E5DCC9",
              background: "#FFFBF5",
              color: "#4A3F35",
              cursor: "pointer",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <p style={{ color: "#8B6F47", fontSize: 13, maxWidth: 320, textAlign: "center" }}>
        eating 버튼 누르면 캐치→씹기→(자동)celebrating까지 순서대로 재생돼요.
      </p>
    </div>
  );
}
