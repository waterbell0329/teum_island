"use client";

// 설정 모달. 홈 화면 좌상단 설정 아이콘에서 엶.
// 로그아웃 버튼뿐 아니라 "상담 대체 아님" 안내를 항상 볼 수 있게 상시 노출 (PROJECT_SUMMARY 10번 섹션).
import { useUser } from "@/context/UserContext";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { signOut } = useUser();

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

        {/* 안전 고지 -- 캐릭터 톤 배제, 항상 노출 (CLAUDE_1.md 마이크로카피 예외) */}
        <div
          style={{
            padding: "var(--space-4)",
            borderRadius: "var(--radius-card)",
            background: "#fff",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--color-text)", lineHeight: 1.6, margin: 0 }}>
            틈 아일랜드는 상담을 대체하지 않아요. 혼자 감당하기 힘든 순간엔 언제든 전문가의 도움을 받아요.
          </p>
          <p style={{ fontSize: 12, color: "var(--color-brown)", margin: "8px 0 0" }}>
            24시간 자살예방상담전화 109 · 정신건강상담전화 1577-0199
          </p>
        </div>

        <button
          onClick={signOut}
          style={{
            padding: "14px",
            borderRadius: "var(--radius-control)",
            border: "1px solid #E5DCC9",
            background: "#fff",
            color: "var(--color-text)",
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
