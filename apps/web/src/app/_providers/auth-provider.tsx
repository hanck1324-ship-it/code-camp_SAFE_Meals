/* AuthProvider (Supabase Auth) */
'use client';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, useRef } from 'react';

import { useAppStore } from '@/commons/stores/useAppStore';
import { getSupabaseClient } from '@/lib/supabase';

import type { User } from '@supabase/supabase-js';
import type { ReactNode } from 'react';

interface AuthContextValue {
  user: User | null;
  isAuthLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAppStore((state) => state.setUser);
  const storeLogout = useAppStore((state) => state.logout);
  const router = useRouter();
  const [user, setLocalUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const isLoggingOut = useRef(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let isMounted = true;

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted || isLoggingOut.current) return;
      if (session?.user) {
        setLocalUser(session.user);
        setUser(session.user);
      } else {
        setLocalUser(null);
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    // 세션 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      console.log(
        '[AuthProvider] Auth state changed:',
        event,
        '- User:',
        !!session?.user
      );

      if (event === 'SIGNED_IN' && session?.user && !isLoggingOut.current) {
        console.log('[AuthProvider] SIGNED_IN - 사용자 상태 설정');
        setLocalUser(session.user);
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthProvider] SIGNED_OUT - 사용자 상태 초기화');
        setLocalUser(null);
        setUser(null);
        storeLogout();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, storeLogout]);

  const logout = async () => {
    console.log('[AuthProvider] 로그아웃 시작...');

    // 로그아웃 플래그 설정 - 세션 재확인 방지
    isLoggingOut.current = true;

    // 즉시 상태 초기화
    setLocalUser(null);
    setUser(null);
    storeLogout();
    console.log('[AuthProvider] ✅ 상태 초기화 완료');

    // Supabase 로그아웃 (전역)
    const supabase = getSupabaseClient();
    await supabase.auth.signOut({ scope: 'global' });
    console.log('[AuthProvider] ✅ Supabase 로그아웃 완료');

    // localStorage 완전 삭제 (Supabase 세션 제거)
    if (typeof window !== 'undefined') {
      try {
        // Supabase 관련 모든 localStorage 항목 삭제
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('supabase')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        console.log(
          '[AuthProvider] ✅ localStorage 클리어 완료:',
          keysToRemove.length,
          '개 항목'
        );
      } catch (e) {
        console.error('[AuthProvider] localStorage 클리어 실패:', e);
      }
    }

    // 네이티브 앱에 로그아웃 메시지 전송
    if (typeof window !== 'undefined' && (window as any).SafeMealsBridge) {
      console.log('[AuthProvider] 네이티브 앱에 LOGOUT 메시지 전송');
      (window as any).SafeMealsBridge.postMessage({
        type: 'LOGOUT',
      });
    } else {
      // 웹 환경에서만 라우팅
      console.log('[AuthProvider] 웹 환경 - 로그인 페이지로 이동');
      router.replace('/auth/login');
    }
  };

  const value: AuthContextValue = { user, isAuthLoading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
