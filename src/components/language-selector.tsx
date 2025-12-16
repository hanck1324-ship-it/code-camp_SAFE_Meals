'use client';

import { Globe } from 'lucide-react';
import { useTranslation, getSupportedLanguages } from '@/hooks/useTranslation';
import type { Language } from '@/lib/translations';

/**
 * 언어 선택 컴포넌트
 * 
 * 전역 언어 상태를 자동으로 관리하므로 props 전달이 필요 없습니다.
 * 
 * @example
 * ```tsx
 * // 간단하게 사용 가능
 * <LanguageSelector />
 * ```
 */
export function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const supportedLanguages = getSupportedLanguages();

  return (
    <div className="relative inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full hover:border-gray-300 transition-colors">
      <Globe className="w-4 h-4 text-gray-600" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="appearance-none bg-transparent text-sm outline-none cursor-pointer pr-2 font-medium"
        aria-label="언어 선택"
      >
        {supportedLanguages.map(({ code, name }) => (   //map 사용을 통하여 언어 설정을 매끄럽게 하고 코드의 가독성을 높이고자 함 
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
