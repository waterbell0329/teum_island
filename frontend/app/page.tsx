"use client";

// 홈 화면. CLAUDE_1.md "화면 구현 우선순위 1번".
import { useRouter } from "next/navigation";
import Character from "@/components/Character";
import HomeHeader from "@/components/HomeHeader";
import LevelGauge from "@/components/LevelGauge";
import BottomNav from "@/components/BottomNav";
import IslandBackground from "@/components/IslandBackground";
import { useUser } from "@/context/UserContext";

export default function Home() {
  const router = useRouter();
  const { user, loading, error } = useUser();

  return (
    // 홈 화면 목업(2026-09-13) 반영: 배경은 블러 없이 또렷하게 + 우상단 햇살 번짐
    <IslandBackground blur={0} sunGlow>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
        <HomeHeader nickname={user?.nickname ?? null} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-3)" }}>
          <div className="font-hand" style={{ fontSize: 26, color: "var(--color-text)" }}>
            {user?.pet_name || "이름 없는 친구"}
          </div>

          <Character animationState="idle" size={220} level={user?.level} />

          {loading && <p style={{ fontSize: 13, color: "var(--color-brown)" }}>얼룩이가 정보를 불러오는 중...</p>}
          {error && <p style={{ fontSize: 13, color: "var(--color-safety)" }}>{error}</p>}

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            {user && <LevelGauge level={user.level} currentXp={user.current_xp} />}

            <button
              onClick={() => router.push("/input")}
              style={{
                margin: "0 var(--space-5)",
                padding: "16px 24px",
                borderRadius: 999,
                border: "none",
                background: "var(--color-main-green)",
                color: "var(--color-text)",
                fontFamily: "var(--font-jua)",
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "var(--shadow-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              오늘 하루는 어땠어? 🍃
            </button>
          </div>
        </div>

        <BottomNav />
      </div>
    </IslandBackground>
  );
}
