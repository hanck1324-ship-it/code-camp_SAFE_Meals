'use client';

import { Globe } from 'lucide-react';
import { useTranslation, getSupportedLanguages } from '@/hooks/useTranslation';
import type { Language } from '@/lib/translations';

/**
 * 언어 선택 컴포넌트
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
        {supportedLanguages.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

