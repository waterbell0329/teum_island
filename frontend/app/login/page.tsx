"use client";

// 2026-09-18: 원티드 챔피언십 운영팀 공지 대응 -- 심사위원/투표자가 회원가입 없이도
// 핵심 기능을 체험할 수 있어야 함(방법 1-A). 기존 구글 로그인은 그대로 두고,
// "로그인 없이 체험하기" 버튼을 추가해서 Supabase 익명 로그인으로 게스트 세션을 만듦
// (각자 자기만의 펫을 갖는 진짜 계정이라 온보딩도 그대로 정상 작동함).
import { useState } from "react";
import Logo from "@/components/Logo";
import Character from "@/components/Character";
import IslandBackground from "@/components/IslandBackground";
import { useUser } from "@/context/UserContext";

export default function LoginPage() {
  const { signInAsGuest } = useUser();
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState("");

  async function handleGuest() {
    setGuestLoading(true);
    setGuestError("");
    const { error } = await signInAsGuest();
    if (error) {
      setGuestError(error);
      setGuestLoading(false);
    }
    // 성공하면 UserContext의 세션이 자동으로 바뀌면서 AppShell이 알아서 홈/온보딩으로 보내줌
  }

  return (
    <IslandBackground>
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-6)",
          padding: "var(--space-5)",
        }}
      >
        <Logo size="lg" />
        <Character animationState="idle" size={180} />

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", width: "100%", maxWidth: 320 }}>
          <button
            onClick={handleGuest}
            disabled={guestLoading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "var(--radius-control)",
              border: "none",
              background: "var(--color-main-green)",
              color: "var(--color-text)",
              fontFamily: "var(--font-heading)",
              fontSize: 15,
              cursor: guestLoading ? "not-allowed" : "pointer",
              opacity: guestLoading ? 0.7 : 1,
            }}
          >
            {guestLoading ? "들어가는 중..." : "로그인 없이 체험하기"}
          </button>
          {guestError && <p style={{ color: "var(--color-safety)", fontSize: 13, textAlign: "center" }}>{guestError}</p>}
        </div>

        <p style={{ fontSize: 12, color: "var(--color-brown)", textAlign: "center", maxWidth: 300 }}>
          틈 아일랜드는 상담을 대체하지 않아요. 혼자 감당하기 힘든 순간엔 언제든 전문가의 도움을 받아요.
        </p>
      </div>
    </IslandBackground>
  );
}
