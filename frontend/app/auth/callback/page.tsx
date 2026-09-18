"use client";

// 구글 로그인 후 Supabase가 돌아오는 곳. supabase-js가 URL의 인증 정보를 자동으로 읽어서
// 세션을 만들어주면(onAuthStateChange), UserContext가 그걸 감지하고 여기서는 홈으로만 보내주면 됨.
// (홈에 도착하면 AppShell이 온보딩 필요 여부를 다시 판단해서 알아서 보내줌)
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { session, authLoading } = useUser();

  useEffect(() => {
    if (!authLoading) {
      router.replace(session ? "/" : "/login");
    }
  }, [authLoading, session, router]);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--color-brown)", fontFamily: "var(--font-body)" }}>얼룩이가 문을 열어주는 중...</p>
    </div>
  );
}
