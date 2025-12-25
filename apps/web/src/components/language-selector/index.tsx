'use client';

import { Globe } from 'lucide-react';
import { useTranslation, getSupportedLanguages } from '@/hooks/useTranslation';
import type { Language } from '@/lib/translations';

interface LanguageSelectorProps {
  currentLanguage?: Language;
  onLanguageChange?: (language: Language) => void;
}

/**
 * 언어 선택 컴포넌트
 */
export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
}: LanguageSelectorProps) {
  const { language: contextLanguage, setLanguage } = useTranslation();
  const supportedLanguages = getSupportedLanguages();

  const language = currentLanguage ?? contextLanguage;
  const handleLanguageChange = onLanguageChange ?? setLanguage;

  return (
    <div className="relative inline-flex items-center gap-2 rounded-full border-2 border-gray-300 bg-white px-3 py-2 transition-colors hover:border-gray-400">
      <Globe className="h-4 w-4 text-gray-600" />
      <select
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value as Language)}
        className="cursor-pointer appearance-none bg-transparent pr-2 text-sm font-medium outline-none"
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
