"use client";

// 하단 네비게이션 (홈 / 퀘스트 / 옷장). 실제 아이콘 반영 완료 (2026-09-13, 복숭아/두루마리/옷걸이).
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", emoji: "🏠", asset: "/assets/icons/nav-home.png" },
  { href: "/quests", label: "퀘스트", emoji: "🌿", asset: "/assets/icons/nav-quests.png" },
  { href: "/closet", label: "옷장", emoji: "🧺", asset: "/assets/icons/nav-closet.png" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "var(--space-3) 0",
        paddingBottom: "calc(var(--space-3) + env(safe-area-inset-bottom))",
        background: "var(--color-bg)",
        borderTop: "1px solid #ECE1CC",
      }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              minWidth: 44,
              minHeight: 44,
              justifyContent: "center",
              color: active ? "var(--color-main-green)" : "var(--color-brown)",
              textDecoration: "none",
              fontSize: 12,
            }}
          >
            <span
              style={{
                width: 40,
                height: 28,
                borderRadius: 999,
                background: active ? "#EAF3EE" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <span
                role="img"
                aria-label={tab.label}
                style={{
                  width: 22,
                  height: 22,
                  display: "inline-block",
                  backgroundImage: `url(${tab.asset})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  opacity: active ? 1 : 0.55,
                }}
              />
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
