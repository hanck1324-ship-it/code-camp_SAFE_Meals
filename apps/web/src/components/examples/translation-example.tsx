'use client';

import { Shield, Globe } from 'lucide-react';

import { LanguageSelector } from '@/components/language-selector';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * useTranslation 훅 사용 예시 컴포넌트
 *
 * 이 컴포넌트는 다국어 기능의 올바른 사용법을 보여줍니다.
 */
export function TranslationExample() {
  const { t, language, languageName } = useTranslation();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.appName}</h1>
          <p className="text-gray-600">{t.tagline}</p>
        </div>
        <LanguageSelector />
      </div>

      {/* 현재 언어 정보 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-blue-900">
            {t.language} {t.language !== 'Language' && 'Settings'}
          </h2>
        </div>
        <p className="text-sm text-blue-700">
          현재 언어: <strong>{languageName}</strong> ({language})
        </p>
        <p className="mt-1 text-sm text-blue-600">{t.languageInfo}</p>
      </div>

      {/* 안전 프로필 예시 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <h2 className="font-semibold">{t.safetyProfile}</h2>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-700">
              {t.allergies}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
                {t.shrimp}
              </span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
                {t.peanut}
              </span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
                {t.egg}
              </span>
            </div>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-700">
              {t.dietPreferences}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                {t.strictVegan}
              </span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                {t.halal}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메뉴 항목 예시 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">{t.menuItems}</h2>

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
            <div className="flex-1">
              <h3 className="font-medium">{t.bibimbap}</h3>
              <p className="mt-1 text-sm text-gray-600">{t.bibimbapDesc}</p>
            </div>
            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
              {t.safe}
            </span>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
            <div className="flex-1">
              <h3 className="font-medium">{t.kimchiJjigae}</h3>
              <p className="mt-1 text-sm text-gray-600">{t.kimchiJjigaeDesc}</p>
            </div>
            <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
              {t.caution}
            </span>
          </div>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="space-y-2">
        <button className="w-full rounded-lg bg-green-600 py-3 font-medium text-white transition-colors hover:bg-green-700">
          {t.scanMenu}
        </button>
        <button className="w-full rounded-lg border border-gray-300 bg-white py-3 font-medium transition-colors hover:bg-gray-50">
          {t.viewAll}
        </button>
      </div>

      {/* 정보 카드 */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="mb-2 font-medium">{t.faq}</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="font-medium">{t.faqQuestion1}</p>
          <p className="text-gray-600">{t.faqAnswer1}</p>
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 font-semibold text-blue-900">💡 개발자 참고사항</h3>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>✅ Props로 언어를 전달하지 않아도 됩니다</li>
          <li>✅ useTranslation 훅만 사용하면 끝!</li>
          <li>✅ 언어 변경이 자동으로 저장됩니다</li>
          <li>✅ TypeScript가 번역 키를 자동 완성합니다</li>
        </ul>
      </div>
    </div>
  );
}
