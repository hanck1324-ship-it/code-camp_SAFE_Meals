import { create } from 'zustand';

export type Language = 'ko' | 'en';

interface User {
  email: string;
  name?: string;
}

interface AppState {
  user: User | null;
  language: Language;
  onboardingDone: boolean;
  setLanguage: (lang: Language) => void;
  login: (user: User) => void;
  logout: () => void;
  completeOnboarding: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  language: 'en',
  onboardingDone: false,
  setLanguage: (language) => set({ language }),
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  completeOnboarding: () => set({ onboardingDone: true }),
}));

