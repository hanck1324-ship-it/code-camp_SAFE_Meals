'use client';

import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Language Hydration 테스트 페이지
 *
 * 이 페이지는 zustand persist의 hydration 상태를 테스트하기 위한 페이지입니다.
 * playwright 테스트에서 사용됩니다.
 */
export default function LanguageHydrationTestPage() {
  const { language, hydrated, setLanguage } = useLanguageStore();
  const { t } = useTranslation();

  // hydration 대기 중일 때 로딩 UI 표시
  if (!hydrated) {
    return (
      <div data-testid="language-hydration-loading">
        <p>Loading...</p>
      </div>
    );
  }

  // hydration 완료 후 렌더링
  return (
    <div data-testid="language-hydration-ready">
      <p data-testid="current-language">{language}</p>
      <p data-testid="hydrated-status">{String(hydrated)}</p>
      <p data-testid="app-name">{t.appName}</p>
      <button data-testid="change-to-en" onClick={() => setLanguage('en')}>
        Change to English
      </button>
      <button data-testid="change-to-ko" onClick={() => setLanguage('ko')}>
        Change to Korean
      </button>
      <button data-testid="change-to-ja" onClick={() => setLanguage('ja')}>
        Change to Japanese
      </button>
    </div>
  );
}
