"use client";

// 설정 모달. 홈 화면 좌상단 설정 아이콘에서 엶.
// 2026-09-19: 계정정보 / 나의 배지 / 안전 안내(상시 노출) / 앱 정보 / 로그아웃 순으로 완성.
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { getUserStats } from "@/lib/api";
import { BADGES } from "@/lib/badges";
import type { UserStats } from "@/types/emotion";

const APP_VERSION = "틈 아일랜드 v0.1.0 (프로토타입)";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { user, userId, signOut } = useUser();
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (!userId) return;
    getUserStats(userId)
      .then(setStats)
      .catch(() => setStats(null));
  }, [userId]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="설정"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(74, 63, 53, 0.35)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 430,
          maxHeight: "88dvh",
          overflowY: "auto",
          background: "var(--color-bg)",
          borderRadius: "20px 20px 0 0",
          padding: "var(--space-5)",
          paddingBottom: "calc(var(--space-5) + env(safe-area-inset-bottom))",
          boxShadow: "var(--shadow-soft)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 16 }}>설정</span>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", minWidth: 44, minHeight: 44 }}
          >
            ✕
          </button>
        </div>

        {/* 계정정보 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            aria-hidden
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--color-main-green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🙂
          </div>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>{user?.nickname || "친구"}</span>
        </div>

        {/* 나의 배지 */}
        <div>
          <p style={{ fontSize: 13, color: "var(--color-brown)", margin: "0 0 8px" }}>나의 배지</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {BADGES.map((badge) => {
              const earned = stats ? badge.isEarned(stats) : false;
              return (
                <div
                  key={badge.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "var(--space-3) var(--space-2)",
                    borderRadius: 16,
                    background: "#F5EFE0",
                    opacity: earned ? 1 : 0.4,
                    filter: earned ? undefined : "grayscale(1)",
                  }}
                >
                  <span style={{ fontSize: 28 }}>{badge.emoji}</span>
                  <span style={{ fontFamily: "var(--font-jua)", fontSize: 12, color: "var(--color-text)", textAlign: "center" }}>
                    {badge.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 안전 고지 -- 캐릭터 톤 배제하지 않고 이번엔 위로하는 말투로, 항상 펼쳐진 상태(접기 불가) */}
        <div
          style={{
            padding: 14,
            borderRadius: 16,
            background: "#FBEDEA",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--color-text)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
            나는 위로해주는 친구지 전문 상담사는 아니야. 힘든 게 계속되면 꼭 다른 도움도 받아봐.{"\n"}24시간
            자살예방상담전화 109 / 정신건강상담전화 1577-0199
          </p>
        </div>

        {/* 앱 정보 */}
        <p style={{ fontSize: 12, color: "var(--color-brown)", textAlign: "center", margin: 0 }}>{APP_VERSION}</p>

        <button
          onClick={signOut}
          style={{
            background: "none",
            border: "none",
            padding: "14px",
            color: "#E8A19C",
            fontFamily: "var(--font-heading)",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
