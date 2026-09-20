"use client";

// 옷장. 2026-09-20 개편: 레벨별 캐릭터 사진(lib/characterLevels.ts)을 "옷"으로 보고,
// 해금한(현재 레벨 이하) 옷을 골라 입을 수 있게 함 -- 3레벨이어도 1레벨 옷을 다시
// 입을 수 있음(레벨업="옷 갈아입기" 원칙 유지하되, 이전 옷도 자유롭게 선택 가능).
// 착용 선택은 localStorage에 저장(setEquippedOutfitLevel)하고 홈 캐릭터가 반영.
//
// 스크롤: 예전엔 페이지 전체가 늘어나서 하단 네비/버튼을 보려면 한참 내려야 했음.
// 이제 목록만 자체 스크롤(flex:1 + overflowY:auto)하고 하단 네비는 항상 고정으로 보임.
import { useEffect, useState } from "react";
import IslandBackground from "@/components/IslandBackground";
import BottomNav from "@/components/BottomNav";
import { useUser } from "@/context/UserContext";
import {
  getAllCharacterOutfits,
  getEquippedOutfitLevel,
  setEquippedOutfitLevel,
} from "@/lib/characterLevels";

export default function ClosetPage() {
  const { user } = useUser();
  const level = user?.level ?? 0;
  const outfits = getAllCharacterOutfits();

  // 현재 착용 중인 옷(레벨). null이면 "레벨 기본 옷"을 입은 상태로 간주 -> 현재 레벨(clamp)로 표시.
  const [equipped, setEquipped] = useState<number | null>(null);
  useEffect(() => {
    setEquipped(getEquippedOutfitLevel());
  }, []);

  // 실제로 "지금 입고 있는" 옷 레벨: 저장된 선택이 해금 범위 안이면 그것, 아니면 현재 레벨(최대 6).
  const effectiveEquipped =
    equipped != null && equipped >= 1 && equipped <= level ? equipped : Math.min(Math.max(level, 1), outfits.length);

  function handleSelect(outfitLevel: number, unlocked: boolean) {
    if (!unlocked) return;
    setEquippedOutfitLevel(outfitLevel);
    setEquipped(outfitLevel);
  }

  return (
    <IslandBackground>
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
        <h1 style={{ fontFamily: "var(--font-heading)", fontSize: 18, padding: "var(--space-4)", margin: 0, flexShrink: 0 }}>
          옷장
        </h1>

        {level < 1 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: "var(--color-brown)", fontSize: 14 }}>튜토리얼을 마치면 첫 옷이 생길 거야, 조금만 기다려줘</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: "var(--color-brown)", padding: "0 var(--space-4) var(--space-2)", margin: 0, flexShrink: 0 }}>
              입고 싶은 옷을 골라줘. 지금까지 얻은 옷은 언제든 다시 입을 수 있어.
            </p>
            {/* 목록만 스크롤되게 -- 하단 네비는 항상 보이도록 이 영역이 남은 공간을 채우고 넘치면 스크롤 */}
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
              {outfits.map(({ level: outfitLevel, image }) => {
                const unlocked = level >= outfitLevel;
                const worn = unlocked && effectiveEquipped === outfitLevel;
                return (
                  <button
                    key={outfitLevel}
                    onClick={() => handleSelect(outfitLevel, unlocked)}
                    disabled={!unlocked}
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
                      opacity: unlocked ? 1 : 0.45,
                      cursor: unlocked ? "pointer" : "not-allowed",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        backgroundImage: `url(${image.src})`,
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                        filter: unlocked ? undefined : "grayscale(1)",
                      }}
                    />
                    <span style={{ fontSize: 11, color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                      {unlocked ? image.name : "?"}
                    </span>
                    <span style={{ fontSize: 10, color: worn ? "var(--color-main-green)" : "var(--color-brown)" }}>
                      {unlocked ? (worn ? "입는 중" : "입기") : `레벨 ${outfitLevel}에 열림`}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <BottomNav />
      </div>
    </IslandBackground>
  );
}
