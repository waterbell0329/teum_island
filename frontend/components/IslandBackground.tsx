"use client";

// 홈 화면 상시 배경(섬). 원본 이미지를 CSS filter: blur()로 흐리게 처리해서 씀
// (실제 파일 저장은 아직 못 받아서 그라데이션 placeholder -- 파일 도착하면 ISLAND_ASSET만 채우면 됨)
import type { ReactNode } from "react";

const ISLAND_ASSET: string | null = null; // "/assets/background/island.png"

interface IslandBackgroundProps {
  /** px 단위 블러 강도 */
  blur?: number;
  children?: ReactNode;
}

export default function IslandBackground({ blur = 6, children }: IslandBackgroundProps) {
  return (
    <div style={{ position: "relative", minHeight: "100dvh", overflow: "hidden" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          filter: `blur(${blur}px)`,
          transform: "scale(1.05)", // 블러로 가장자리 비치 않게 살짝 확대
          background: ISLAND_ASSET
            ? undefined
            : "linear-gradient(180deg, #FDE9C8 0%, #A8D5BA 55%, #F5EFE0 100%)",
          backgroundImage: ISLAND_ASSET ? `url(${ISLAND_ASSET})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
