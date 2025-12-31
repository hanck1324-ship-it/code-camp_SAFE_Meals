/* AuthProvider (Supabase Auth) */
'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';
import { useAppStore } from '@/commons/stores/useAppStore';
import { useRouter } from 'next/navigation';

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

      if (event === 'SIGNED_IN' && session?.user && !isLoggingOut.current) {
        setLocalUser(session.user);
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
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
    // 로그아웃 플래그 설정 - 세션 재확인 방지
    isLoggingOut.current = true;

    // 즉시 상태 초기화
    setLocalUser(null);
    setUser(null);
    storeLogout();

    // Supabase 로그아웃
    const supabase = getSupabaseClient();
    await supabase.auth.signOut({ scope: 'local' });

    // 로그인 페이지로 이동
    router.replace('/auth/login');
  };

  const value: AuthContextValue = { user, isAuthLoading, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
