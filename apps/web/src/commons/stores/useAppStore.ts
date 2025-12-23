import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  email: string;
  name?: string;
}

interface AppState {
  user: User | null;
  onboardingDone: boolean;
  login: (user: User) => void;
  logout: () => void;
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
      onboardingDone: false,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
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
