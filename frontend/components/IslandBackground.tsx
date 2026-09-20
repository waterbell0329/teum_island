"use client";

// 홈 화면 상시 배경(섬). 원본 이미지를 CSS filter: blur()로 흐리게 처리해서 씀
// (실제 파일 저장은 아직 못 받아서 그라데이션 placeholder -- 파일 도착하면 ISLAND_ASSET만 채우면 됨)
// 2026-09-19: 홈 화면에 하늘 그라데이션+구름 애니메이션(animatedSky)으로 잠깐 바꿔봤는데
// 원래 섬 일러스트가 훨씬 낫다는 피드백 받고 원복함 (관련 CloudStrip.tsx도 같이 제거).
import type { ReactNode } from "react";

const ISLAND_ASSET: string | null = "/assets/background/island.png";

interface IslandBackgroundProps {
  /** px 단위 블러 강도 (0 = 또렷하게, 홈 화면 새 목업처럼 배경이 선명하게 보여야 할 때 씀) */
  blur?: number;
  /** 우상단에 따뜻한 햇살 번짐 효과 추가 (홈 화면 목업 참고, 2026-09-13) */
  sunGlow?: boolean;
  children?: ReactNode;
}

export default function IslandBackground({ blur = 6, sunGlow = false, children }: IslandBackgroundProps) {
  return (
    <div className="island-stage" style={{ position: "relative", minHeight: "100dvh", overflow: "hidden" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          transform: blur > 0 ? "scale(1.05)" : undefined, // 블러로 가장자리 비치 않게 살짝 확대
          background: ISLAND_ASSET ? undefined : "linear-gradient(180deg, #FDE9C8 0%, #A8D5BA 55%, #F5EFE0 100%)",
          backgroundImage: ISLAND_ASSET ? `url(${ISLAND_ASSET})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {sunGlow && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-8%",
            right: "-10%",
            width: "55%",
            aspectRatio: "1",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(246,196,83,0.55) 0%, rgba(246,196,83,0.18) 45%, rgba(246,196,83,0) 72%)",
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
