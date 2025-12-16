'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSelector } from '@/components/language-selector';
import { Shield, Globe } from 'lucide-react';

/**
 * useTranslation 훅 사용 예시 컴포넌트
 * 
 * 이 컴포넌트는 다국어 기능의 올바른 사용법을 보여줍니다.
 */
export function TranslationExample() {
  const { t, language, languageName } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.appName}</h1>
          <p className="text-gray-600">{t.tagline}</p>
        </div>
        <LanguageSelector />
      </div>

      {/* 현재 언어 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-blue-900">
            {t.language} {t.language !== 'Language' && 'Settings'}
          </h2>
        </div>
        <p className="text-sm text-blue-700">
          현재 언어: <strong>{languageName}</strong> ({language})
        </p>
        <p className="text-sm text-blue-600 mt-1">
          {t.languageInfo}
        </p>
      </div>

      {/* 안전 프로필 예시 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold">{t.safetyProfile}</h2>
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              {t.allergies}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                {t.shrimp}
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                {t.peanut}
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                {t.egg}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              {t.dietPreferences}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {t.strictVegan}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {t.halal}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 메뉴 항목 예시 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold mb-3">{t.menuItems}</h2>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium">{t.bibimbap}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {t.bibimbapDesc}
              </p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
              {t.safe}
            </span>
          </div>

          <div className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium">{t.kimchiJjigae}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {t.kimchiJjigaeDesc}
              </p>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
              {t.caution}
            </span>
          </div>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="space-y-2">
        <button className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
          {t.scanMenu}
        </button>
        <button className="w-full py-3 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors">
          {t.viewAll}
        </button>
      </div>

      {/* 정보 카드 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium mb-2">{t.faq}</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p className="font-medium">{t.faqQuestion1}</p>
          <p className="text-gray-600">{t.faqAnswer1}</p>
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          💡 개발자 참고사항
        </h3>
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

