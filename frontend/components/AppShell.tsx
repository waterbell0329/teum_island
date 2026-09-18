"use client";

// 로그인/온보딩 가드. 이 페이지들(login, auth 콜백)은 가드 없이 그대로 통과,
// 그 외 모든 페이지는: 로딩중 -> 스피너 / 비로그인 -> /login / 온보딩 필요 -> /onboarding.
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import LoadingScreen from "@/components/LoadingScreen";
import PageTransition from "@/components/PageTransition";

const PUBLIC_PATHS = ["/login"];
const isAuthCallback = (path: string) => path.startsWith("/auth/callback");

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading, needsOnboarding } = useUser();

  const isPublic = PUBLIC_PATHS.includes(pathname) || isAuthCallback(pathname);
  const isOnboarding = pathname === "/onboarding";

  useEffect(() => {
    if (loading || isPublic) return;
    if (!session) {
      router.replace("/login");
    } else if (needsOnboarding && !isOnboarding) {
      router.replace("/onboarding");
    } else if (!needsOnboarding && isOnboarding) {
      router.replace("/");
    }
  }, [loading, isPublic, isOnboarding, session, needsOnboarding, router]);

  if (isPublic) return <PageTransition>{children}</PageTransition>;

  if (loading || (!session && !isPublic) || (needsOnboarding && !isOnboarding) || (!needsOnboarding && isOnboarding)) {
    return <LoadingScreen />;
  }

  return <PageTransition>{children}</PageTransition>;
}
