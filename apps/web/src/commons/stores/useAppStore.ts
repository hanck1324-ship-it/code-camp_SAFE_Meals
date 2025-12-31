import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase';

interface User {
  email: string;
  name?: string;
}

interface AppState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  onboardingDone: boolean;
  login: (user: User) => void;
  setUser: (user: SupabaseUser | null) => void;
  logout: () => Promise<void>;
  completeOnboarding: () => void;
}

/**
 * 전역 앱 상태 관리 스토어
 *
 * 사용자 정보, 온보딩 상태 등 앱의 핵심 상태를 관리합니다.
 * (언어 설정은 useLanguageStore에서 별도 관리)
 *
 * @example
 * ```tsx
 * const user = useAppStore((state) => state.user);
 * const login = useAppStore((state) => state.login);
 * const onboardingDone = useAppStore((state) => state.onboardingDone);
 * ```
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      supabaseUser: null,
      onboardingDone: false,
      login: (user) => set({ user }),
      setUser: (supabaseUser) =>
        set({
          supabaseUser,
          user: supabaseUser
            ? {
                email: supabaseUser.email || '',
                name: supabaseUser.user_metadata?.name,
              }
            : null,
        }),
      logout: async () => {
        try {
          const supabase = getSupabaseClient();
          await supabase.auth.signOut();

          // 네이티브 앱에 로그아웃 메시지 전송
          if (typeof window !== 'undefined' && (window as any).SafeMealsBridge) {
            (window as any).SafeMealsBridge.postMessage({
              type: 'LOGOUT',
            });
          }
        } catch (error) {
          console.error('로그아웃 에러:', error);
        } finally {
          // 상태 초기화는 항상 실행
          set({ user: null, supabaseUser: null });
        }
      },
      completeOnboarding: () => set({ onboardingDone: true }),
    }),
    {
      name: 'safemeals-app-storage', // localStorage 키
      storage: createJSONStorage(() => localStorage),
      // onboardingDone만 persist (user는 보안상 저장 안 함)
      partialize: (state) => ({
        onboardingDone: state.onboardingDone,
      }),
    }
  )
);
