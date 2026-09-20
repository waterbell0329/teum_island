"use client";

// 홈 화면. CLAUDE_1.md "화면 구현 우선순위 1번".
// 2026-09-19: 캐릭터가 허공에 붕 떠있기만 해서 밋밋하다는 피드백 -> 바닥 그림자로
// 무대에 서 있는 느낌을 주고, 이름표를 카드형 뱃지로 바꾸고, 은은한 반짝임을 띄워서
// 실제 게임 화면처럼 레이어감/생동감을 더함.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Character from "@/components/Character";
import HomeHeader from "@/components/HomeHeader";
import LevelGauge from "@/components/LevelGauge";
import BottomNav from "@/components/BottomNav";
import IslandBackground from "@/components/IslandBackground";
import LevelUpScreen from "@/components/LevelUpScreen";
import WeeklySummaryCard from "@/components/WeeklySummaryCard";
import FoodPreview from "@/components/FoodPreview";
import { useUser } from "@/context/UserContext";
import { readSession, clearSession } from "@/lib/sessionDraft";
import { PENDING_LEVELUP_KEY, type PendingLevelUp } from "@/lib/pendingLevelUp";

export default function Home() {
  const router = useRouter();
  const { user, userId, loading, error } = useUser();
  // /input에서 레벨업을 하고 막 돌아왔으면, 홈 화면 위에 짜잔 리빌을 한 번 띄움
  // (마운트 시점 sessionStorage 값을 그대로 초기 state로 읽어옴 -- effect+setState 대신).
  // 2026-09-20 버그 수정: 예전엔 마운트 직후 effect에서 바로 clearSession 했었는데,
  // React StrictMode(개발모드)가 마운트->언마운트->재마운트를 한 번 더 시뮬레이션하면서
  // 첫 마운트의 effect가 지운 값을 재마운트 때 다시 읽어서 null이 되어버리는 문제가
  // 있었음(그래서 화면이 아예 안 뜸) -- "계속하기" 눌러서 실제로 닫을 때만 지우게 바꿈.
  const [levelUp, setLevelUp] = useState<PendingLevelUp | null>(() =>
    readSession<PendingLevelUp | null>(PENDING_LEVELUP_KEY, null)
  );

  return (
    // 2026-09-19: 구름 그라데이션 배경으로 바꿔봤다가 원래 섬 일러스트가 훨씬 낫다는
    // 피드백 받고 원복함 -- 홈 화면 목업(2026-09-13) 그대로: 블러 없이 또렷하게 + 햇살 번짐
    <IslandBackground blur={0} sunGlow>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
        <HomeHeader nickname={user?.nickname ?? null} />
        <WeeklySummaryCard userId={userId} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-3)" }}>
          {/* 캐릭터 무대: 캐릭터를 작게(야자수 사이에 쏙) + 하단정렬로 두고, 이름표는
              캐릭터의 두 귀 사이(정수리 위)에 겹치게 배치 (2026-09-20). 캐릭터가
              heightRatio=0.52로 컨테이너 하단에 그려지므로, 이름표 top을 그 정수리
              높이에 맞춰 둠 */}
          <div style={{ position: "relative", width: 320, height: 320 }}>
            {/* 이름표: 흰 알약 배지가 너무 밋밋하다는 피드백 받고 그라데이션+얇은 테두리+
                작은 잎사귀 포인트로 정리 (2026-09-20) */}
            <div
              style={{
                position: "absolute",
                // 캐릭터(heightRatio 0.42, 하단정렬)의 두 귀 사이~머리 위 부근. 이 값은
                // 레벨별 이미지 비율 차이가 있어 실제 화면 보고 미세조정 전제. (겹침 방지
                // 위해 몸통까지 내려가지 않는 보수적 위치)
                top: 175,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 3,
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "var(--font-heading)",
                fontSize: 14,
                color: "var(--color-text)",
                background: "linear-gradient(135deg, #FFFDF8 0%, #F2EDDE 100%)",
                border: "1px solid rgba(168, 213, 186, 0.55)",
                padding: "6px 16px",
                borderRadius: 14,
                boxShadow: "0 3px 10px rgba(139, 111, 71, 0.14)",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 12 }}>🌿</span>
              {user?.pet_name || "이름 없는 친구"}
            </div>

            <motion.div
              aria-hidden
              animate={{ scaleX: [1, 1.08, 1], opacity: [0.5, 0.35, 0.5] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                bottom: 18,
                left: "50%",
                transform: "translateX(-50%)",
                width: 170,
                height: 34,
                borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(74,63,53,0.28) 0%, rgba(74,63,53,0) 72%)",
              }}
            />
            <motion.span
              aria-hidden
              animate={{ y: [0, -8, 0], opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: "absolute", top: 30, left: 12, fontSize: 20 }}
            >
              ✦
            </motion.span>
            <motion.span
              aria-hidden
              animate={{ y: [0, -6, 0], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              style={{ position: "absolute", top: 50, right: 8, fontSize: 16 }}
            >
              ✦
            </motion.span>
            <Character animationState="idle" size={320} level={user?.level} heightRatio={0.42} verticalAlign="bottom" />
          </div>

          {loading && <p style={{ fontSize: 13, color: "var(--color-brown)" }}>얼룩이가 정보를 불러오는 중...</p>}
          {error && <p style={{ fontSize: 13, color: "var(--color-safety)" }}>{error}</p>}

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            {user && <LevelGauge level={user.level} currentXp={user.current_xp} />}

            <FoodPreview userId={userId} />

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => router.push("/input")}
              style={{
                margin: "0 var(--space-5)",
                padding: "16px 24px",
                borderRadius: 999,
                border: "none",
                background: "var(--color-main-green)",
                color: "var(--color-text)",
                fontFamily: "var(--font-heading)",
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
            </motion.button>
          </div>
        </div>

        <BottomNav />
      </div>

      {levelUp && (
        <LevelUpScreen
          newLevel={levelUp.newLevel}
          onContinue={() => {
            clearSession(PENDING_LEVELUP_KEY);
            setLevelUp(null);
          }}
        />
      )}
    </IslandBackground>
  );
}
