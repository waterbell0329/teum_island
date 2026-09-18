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
  const { signInWithGoogle, signInAsGuest } = useUser();
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
            onClick={signInWithGoogle}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              width: "100%",
              padding: "14px",
              borderRadius: "var(--radius-control)",
              border: "1px solid #E5DCC9",
              background: "#fff",
              color: "var(--color-text)",
              fontFamily: "var(--font-heading)",
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <GoogleG /> 구글로 시작하기
          </button>

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

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.96H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.04l3.05-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.96l3.05 2.34C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}
