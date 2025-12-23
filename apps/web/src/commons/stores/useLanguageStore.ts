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

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

/**
 * 언어 설정 전용 스토어
 *
 * 언어 관련 상태만 독립적으로 관리하여
 * 코드의 재사용성과 유지보수성을 높입니다.
 *
 * @example
 * ```tsx
 * // 언어만 필요한 경우
 * const language = useLanguageStore((state) => state.language);
 * const setLanguage = useLanguageStore((state) => state.setLanguage);
 *
 * // 또는 구조 분해
 * const { language, setLanguage } = useLanguageStore();
 * ```
 */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'ko', // 기본 언어: 한국어
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'safemeals-language-storage', // localStorage 키
      storage: createJSONStorage(() => localStorage),
    }
  )
);
