"use client";

// 응답 대기 화면. 채영님 개선안(2026-09-18) 반영:
// - 흰 배경 대신 크림/베이지 톤 + 아주 느린 그라데이션 웨이브 2겹
// - 문구 한 줄 고정 대신 여러 문장을 5초 간격으로 페이드 전환 (RotatingCaption.tsx)
// AppShell의 전역 로딩 게이트에서 씀.
import RotatingCaption from "@/components/RotatingCaption";

const DEFAULT_MESSAGES = [
  "얼룩이가 글을 읽고 있어요",
  "천천히 숨 쉬어도 괜찮아요",
  "편지를 쓰는 중이에요",
  "거의 다 왔어요",
];

export default function LoadingScreen({ messages = DEFAULT_MESSAGES }: { messages?: string[] }) {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#FAF6EE",
      }}
    >
      {/* 웨이브 레이어 2겹 -- 아주 느리게 위아래로만 흔들려서 정적이지 않지만 산만하지도 않게 */}
      <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div className="loading-wave loading-wave-1" />
        <div className="loading-wave loading-wave-2" />
      </div>

      <RotatingCaption
        messages={messages}
        style={{ position: "relative", zIndex: 1, fontFamily: "var(--font-heading)", fontSize: 15, color: "var(--color-text)", padding: "0 var(--space-6)" }}
      />

      <style jsx>{`
        .loading-wave {
          position: absolute;
          left: -20%;
          width: 140%;
          height: 200px;
          border-radius: 45%;
          animation: loading-wave-drift 9s ease-in-out infinite;
        }
        .loading-wave-1 {
          top: 12%;
          background: radial-gradient(ellipse at center, rgba(168, 213, 186, 0.28) 0%, rgba(168, 213, 186, 0) 70%);
          animation-duration: 10s;
        }
        .loading-wave-2 {
          bottom: 8%;
          background: radial-gradient(ellipse at center, rgba(246, 196, 83, 0.22) 0%, rgba(246, 196, 83, 0) 70%);
          animation-duration: 12s;
          animation-delay: -3s;
        }
        @keyframes loading-wave-drift {
          0%, 100% {
            transform: translateY(-8px);
          }
          50% {
            transform: translateY(10px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .loading-wave {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
