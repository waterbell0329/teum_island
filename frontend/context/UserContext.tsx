"use client";

// 로그인 후 세팅해서 페이지 이동해도 유지하는 유저 상태 (CLAUDE_1.md 상태관리 섹션).
// Supabase Auth(구글 로그인) 세션 + 백엔드 유저 정보(레벨/XP 등)를 합쳐서 관리함.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { getUser, ApiError } from "@/lib/api";
import type { User } from "@/types/emotion";

interface UserContextValue {
  session: Session | null;
  userId: string | null;
  user: User | null;
  /** 세션 확인 + 백엔드 유저 조회 둘 다 끝났는지 (화면 전체 로딩 스피너용) */
  loading: boolean;
  authLoading: boolean;
  userLoading: boolean;
  /** 로그인은 됐는데 백엔드에 유저 행이 없거나(신규) onboarding_completed=false */
  needsOnboarding: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  /** 로그인 없이 체험하기 -- 원티드 챔피언십 공지(2026-09-18) 대응: 회원가입 없이도
   * 심사위원/투표자가 핵심 기능을 바로 써볼 수 있게 Supabase 익명 로그인으로 게스트 세션 발급.
   * (Supabase 대시보드에서 Authentication > Sign In / Up > Anonymous Sign-Ins 켜야 동작함) */
  signInAsGuest: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = session?.user.id ?? null;

  const loadUser = useCallback(async (id: string) => {
    setUserLoading(true);
    setError(null);
    try {
      const u = await getUser(id);
      setUser(u);
      setNeedsOnboarding(!u.onboarding_completed);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        // 백엔드에 아직 행이 없는 신규 유저 -- 온보딩으로 보내면 됨
        setUser(null);
        setNeedsOnboarding(true);
      } else {
        // 진짜 네트워크/서버 오류는 온보딩으로 오인하지 않고 에러로 표시
        setError("얼룩이가 잠깐 딴 데를 봤나봐, 새로고침해줄래?");
      }
    } finally {
      setUserLoading(false);
    }
  }, []);

  // 세션 로드 + 변경 구독 (로그인/로그아웃/토큰갱신 등)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      loadUser(userId);
    } else {
      setUser(null);
      setNeedsOnboarding(false);
    }
  }, [userId, loadUser]);

  const refreshUser = useCallback(async () => {
    if (userId) await loadUser(userId);
  }, [userId, loadUser]);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const signInAsGuest = useCallback(async () => {
    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) {
      // Supabase 프로젝트에서 Anonymous Sign-Ins가 꺼져있으면 여기로 옴
      return { error: "지금은 체험 모드를 준비 중이에요, 구글로 로그인해줄래?" };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <UserContext.Provider
      value={{
        session,
        userId,
        user,
        loading: authLoading || userLoading,
        authLoading,
        userLoading,
        needsOnboarding,
        error,
        refreshUser,
        signInWithGoogle,
        signInAsGuest,
        signOut,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser는 UserProvider 안에서만 쓸 수 있어요");
  return ctx;
}
