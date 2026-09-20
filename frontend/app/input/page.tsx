"use client";

import { useRouter } from "next/navigation";
import EmotionCaptureFlow from "@/components/EmotionCaptureFlow";
import IslandBackground from "@/components/IslandBackground";
import { useUser } from "@/context/UserContext";
import { writeSession } from "@/lib/sessionDraft";
import { PENDING_LEVELUP_KEY } from "@/lib/pendingLevelUp";

export default function InputPage() {
  const router = useRouter();
  const { userId, refreshUser } = useUser();

  if (!userId) return null;

  return (
    <IslandBackground>
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <TopBar onBack={() => router.push("/")} title="오늘 하루는 어땠냐?" />
        <EmotionCaptureFlow
          userId={userId}
          ctaLabel="홈으로"
          onDone={(result) => {
            // 레벨업이 있었으면 홈 화면에 "짜잔" 리빌(LevelUpScreen)을 띄우라고 표시해둠
            // (라우팅 이동은 여기서 바로 하지만, 리빌 연출 자체는 홈 화면 도착 후에 뜸)
            if (result.leveled_up) {
              writeSession(PENDING_LEVELUP_KEY, { newLevel: result.new_level });
            }
            refreshUser();
            router.push("/");
          }}
        />
      </div>
    </IslandBackground>
  );
}

function TopBar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "var(--space-4)" }}>
      <button onClick={onBack} aria-label="뒤로" style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>
        ←
      </button>
      <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>{title}</span>
    </div>
  );
}
