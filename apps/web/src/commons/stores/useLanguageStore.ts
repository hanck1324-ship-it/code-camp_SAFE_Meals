'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 지원 언어 타입
 * - ko: 한국어
 * - en: English
 * - ja: 日本語
 * - zh: 中文
 * - es: Español
 */
export type Language = 'ko' | 'en' | 'ja' | 'zh' | 'es';

/**
 * 유효한 언어 목록
 */
const VALID_LANGUAGES: Language[] = ['ko', 'en', 'ja', 'zh', 'es'];

/**
 * 언어 유효성 검사 함수
 * @param lang - 검사할 언어 값
 * @returns 유효한 언어인지 여부
 */
const isValidLanguage = (lang: unknown): lang is Language => {
  return typeof lang === 'string' && VALID_LANGUAGES.includes(lang as Language);
};

/**
 * localStorage에서 현재 저장된 언어를 읽어옴
 */
const getLanguageFromStorage = (): Language | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('safemeals-language-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state && isValidLanguage(parsed.state.language)) {
        return parsed.state.language;
      }
    }
  } catch (e) {
    console.error('[LanguageStore] Failed to read from localStorage:', e);
  }
  return null;
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  syncFromStorage: () => void;
}

/**
 * useLanguageStore - zustand persist 기반 언어 상태 관리
 *
 * 언어 관련 상태만 독립적으로 관리하여
 * 코드의 재사용성과 유지보수성을 높입니다.
 *
 * @property {Language} language - 현재 선택된 언어 ('ko' | 'en' | 'ja' | 'zh' | 'es')
 * @property {boolean} hydrated - localStorage hydration 완료 여부
 * @property {Function} setLanguage - 언어 변경 함수
 *
 * @example
 * ```tsx
 * // 페이지에서 hydration 대기
 * const { language, hydrated } = useLanguageStore();
 * const { t } = useTranslation();
 *
 * if (!hydrated) {
 *   return <div>Loading...</div>;
 * }
 *
 * return <div>{t.title}</div>;
 * ```
 *
 * @example
 * ```tsx
 * // 언어만 필요한 경우
 * const language = useLanguageStore((state) => state.language);
 * const setLanguage = useLanguageStore((state) => state.setLanguage);
 *
 * // 또는 구조 분해
 * const { language, setLanguage, hydrated } = useLanguageStore();
 * ```
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'ko', // 기본 언어: 한국어
      hydrated: false, // hydration 초기값: false
      setLanguage: (language) => set({ language }),
      setHydrated: (hydrated) => set({ hydrated }),
      syncFromStorage: () => {
        const storedLang = getLanguageFromStorage();
        if (storedLang && storedLang !== get().language) {
          console.log('[LanguageStore] Syncing from storage:', storedLang);
          set({ language: storedLang });
        }
      },
    }),
    {
      name: 'safemeals-language-storage', // localStorage 키
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ language: state.language }), // hydrated, setHydrated는 persist 제외
      onRehydrateStorage: (state) => {
        return (rehydratedState, error) => {
          if (error) {
            console.error('[LanguageStore] hydration error:', error);
          }
          // hydration 완료 시 hydrated를 true로 설정
          // 유효하지 않은 언어인 경우 기본값으로 설정
          if (rehydratedState && !isValidLanguage(rehydratedState.language)) {
            rehydratedState.setHydrated(true);
            rehydratedState.setLanguage('ko');
          } else if (rehydratedState) {
            rehydratedState.setHydrated(true);
          }
        };
      },
    }
  )
);
