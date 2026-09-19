"use client";

// 로그인/온보딩 가드.
// 2026-09-19 버그 수정: 예전엔 "/login에 있으면 리다이렉트 로직 자체를 건너뜀"이었는데,
// 이러면 게스트(익명) 로그인처럼 페이지 이동 없이 "/login에 그대로 있는 채로" 세션만
// 새로 생기는 경우 영원히 다음 화면으로 안 넘어가는 버그가 있었음 (구글 로그인은
// /auth/callback 페이지가 자기 스스로 리다이렉트해서 이 문제를 못 봤던 것).
// 그래서 "/login"은 이제 그냥 평범한 화면 중 하나로 취급하고, /auth/callback만
// (자기가 알아서 리다이렉트하니까) 가드에서 완전히 제외함.
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import LoadingScreen from "@/components/LoadingScreen";
import PageTransition from "@/components/PageTransition";

const isAuthCallback = (path: string) => path.startsWith("/auth/callback");

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading, needsOnboarding } = useUser();

  const isLogin = pathname === "/login";
  const isOnboarding = pathname === "/onboarding";
  const isAuthCb = isAuthCallback(pathname);

  useEffect(() => {
    if (loading || isAuthCb) return;

    if (!session) {
      if (!isLogin) router.replace("/login");
      return;
    }

    // 세션이 있으면 -- /login에 그대로 있는 상태(예: 방금 게스트로 들어옴)여도 넘겨줌
    if (needsOnboarding && !isOnboarding) {
      router.replace("/onboarding");
    } else if (!needsOnboarding && (isOnboarding || isLogin)) {
      router.replace("/");
    }
  }, [loading, isAuthCb, isLogin, isOnboarding, session, needsOnboarding, router]);

  if (isAuthCb) return <>{children}</>;

  const showLoginScreen = !loading && !session && isLogin;
  if (showLoginScreen) return <PageTransition>{children}</PageTransition>;

  const stillArranging =
    loading ||
    !session ||
    (needsOnboarding && !isOnboarding) ||
    (!needsOnboarding && (isOnboarding || isLogin));
  if (stillArranging) return <LoadingScreen />;

  return <PageTransition>{children}</PageTransition>;
}
