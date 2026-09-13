"use client";

import { useRouter } from "next/navigation";
import EmotionCaptureFlow from "@/components/EmotionCaptureFlow";
import IslandBackground from "@/components/IslandBackground";
import { useUser } from "@/context/UserContext";

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
          onDone={() => {
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
      <span style={{ fontFamily: "var(--font-jua)", fontSize: 16 }}>{title}</span>
    </div>
  );
}
