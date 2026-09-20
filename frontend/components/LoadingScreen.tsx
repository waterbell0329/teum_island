"use client";

// 응답 대기 화면 + 앱 최초 진입 스플래시. AppShell의 전역 로딩 게이트(세션/온보딩 확인 중)에서
// 씀 -- 그래서 접속 직후 제일 먼저 보이는 화면이기도 함.
// 2026-09-20: 채영님이 만들어준 스플래시 일러스트("틈 아일랜드" 로고 박힌 해변 배경)를
// 전체 배경으로 깔고, 캡션은 로고 텍스트랑 안 겹치게 하단에 작은 카드로 띄움.
import RotatingCaption from "@/components/RotatingCaption";

const SPLASH_ASSET = "/assets/background/splash.png";

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
        alignItems: "flex-end",
        justifyContent: "center",
        overflow: "hidden",
        backgroundImage: `url(${SPLASH_ASSET})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          margin: "0 var(--space-6) var(--space-7)",
          padding: "10px 18px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.85)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <RotatingCaption
          messages={messages}
          style={{ fontFamily: "var(--font-heading)", fontSize: 14, color: "var(--color-text)" }}
        />
      </div>
    </div>
  );
}
