"use client";

// 옷장. 레벨업="옷 갈아입기" 원칙(PROJECT_SUMMARY 2번) 반영 -- 시작 단계 의상 12종을
// 레벨 순서대로 갤러리로 보여줌 (2026-09-13). 갈아입기(다른 옷 선택) 자체는 아직 스트레치라
// 지금은 "레벨에 도달하면 자동으로 그 옷을 입는다"만 구현, 보관함처럼 조회만 가능.
import IslandBackground from "@/components/IslandBackground";
import BottomNav from "@/components/BottomNav";
import { useUser } from "@/context/UserContext";
import { getAllOutfits } from "@/lib/outfits";
import { getCharacterImageForLevel, MAX_LEVEL_IMAGE } from "@/lib/characterLevels";

export default function ClosetPage() {
  const { user } = useUser();
  const level = user?.level ?? 0;

  return (
    <IslandBackground>
      {/* 2026-09-20: 목록만 자체 스크롤(flex+overflowY)하고 하단 네비는 항상 고정으로 보이게.
          예전엔 페이지 전체가 늘어나 하단 버튼을 보려면 한참 스크롤해야 했음. */}
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 18, padding: "var(--space-4)", margin: 0, flexShrink: 0 }}>옷장</h1>

        {level < 1 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "var(--color-brown)", fontSize: 14 }}>튜토리얼을 마치면 첫 옷이 생길 거야, 조금만 기다려줘</p>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 var(--space-4) var(--space-4)",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              alignContent: "start",
            }}
          >
            {getAllOutfits().map((outfit) => {
              const unlocked = level >= outfit.level;
              const worn = unlocked && level === outfit.level;
              // 2026-09-20: 레벨 1~6 칸은 옷만 있는 사진 대신 "옷 입은 캐릭터 사진"으로
              // 보여줌(홈에 뜨는 그 캐릭터 사진과 동일). 7레벨 이상은 기존 옷 사진 그대로.
              const useCharacterImage = outfit.level <= MAX_LEVEL_IMAGE;
              const imgSrc = useCharacterImage
                ? getCharacterImageForLevel(outfit.level).src
                : outfit.front;
              return (
                <div
                  key={outfit.slug}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-card)",
                    background: "#fff",
                    boxShadow: "var(--shadow-soft)",
                    border: worn ? "2px solid var(--color-main-green)" : "2px solid transparent",
                    opacity: unlocked ? 1 : 0.4,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      backgroundImage: `url(${imgSrc})`,
                      backgroundSize: "contain",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "center",
                      filter: unlocked ? undefined : "grayscale(1)",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "var(--color-text)", textAlign: "center" }}>
                    {unlocked ? outfit.name : "?"}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--color-brown)" }}>
                    {unlocked ? (worn ? "입는 중" : `레벨 ${outfit.level}`) : `레벨 ${outfit.level}에 열림`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <BottomNav />
      </div>
    </IslandBackground>
  );
}
