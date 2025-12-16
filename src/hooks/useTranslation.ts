import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { translations, languageNames } from '@/lib/translations';
import type { Language } from '@/lib/translations';

/**
 * 다국어 번역을 위한 커스텀 훅
 * 
 * 전역 언어 상태를 자동으로 가져와서 번역 객체를 반환합니다.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, language, setLanguage, languageName } = useTranslation();
 *   
 *   return (
 *     <div>
 *       <h1>{t.appName}</h1>
 *       <p>{t.tagline}</p>
 *       <button onClick={() => setLanguage('en')}>
 *         Change to English
 *       </button>
 *       <p>Current: {languageName}</p>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {Object} 번역 객체 및 언어 설정 함수
 * @returns {Object} t - 현재 언어의 번역 객체
 * @returns {Language} language - 현재 선택된 언어 코드
 * @returns {Function} setLanguage - 언어 변경 함수
 * @returns {string} languageName - 현재 언어의 표시 이름 (예: '한국어', 'English')
 */
export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  // 언어가 없거나 번역이 없을 경우 영어를 기본값으로 사용
  const translation = translations[language] || translations['en'];
  const name = languageNames[language] || languageNames['en'];

  return {
    /** 현재 언어의 번역 객체 */
    t: translation,
    /** 현재 선택된 언어 코드 (예: 'ko', 'en') */
    language,
    /** 언어 변경 함수 */
    setLanguage,
    /** 현재 언어의 표시 이름 (예: '한국어', 'English') */
    languageName: name,
  };
}

/**
 * 특정 언어의 번역을 가져오는 함수 (정적 사용)
 * 
 * 컴포넌트 외부에서 번역이 필요한 경우 사용합니다.
 * 
 * @example
 * ```tsx
 * const koreanText = getTranslation('ko', 'appName'); // 'SafeMeals'
 * ```
 */
export function getTranslation(
  language: Language,
  key: keyof typeof translations['ko']
): string {
  return translations[language][key];
}

/**
 * 지원되는 모든 언어 목록 반환
 * 
 * @example
 * ```tsx
 * const languages = getSupportedLanguages();
 * // [
 * //   { code: 'ko', name: '한국어' },
 * //   { code: 'en', name: 'English' },
 * //   ...
 * // ]
 * ```
 */
export function getSupportedLanguages() {
  return (Object.keys(languageNames) as Language[]).map((code) => ({
    code,
    name: languageNames[code],
  }));
}

