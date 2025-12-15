import { Globe } from 'lucide-react';
import { Language, languageNames } from '../lib/translations';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

export function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="relative inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full">
      <Globe className="w-4 h-4 text-gray-600" />
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value as Language)}
        className="appearance-none bg-transparent text-sm outline-none cursor-pointer pr-2"
      >
        <option value="ko">{languageNames.ko}</option>
        <option value="en">{languageNames.en}</option>
        <option value="ja">{languageNames.ja}</option>
        <option value="zh">{languageNames.zh}</option>
        <option value="es">{languageNames.es}</option>
      </select>
    </div>
  );
}
