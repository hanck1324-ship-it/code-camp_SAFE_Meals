import { ChevronLeft, Check } from 'lucide-react';
import { Language, translations, languageNames } from '../../lib/translations';

interface LanguageSettingsScreenProps {
  currentLanguage: Language;
  onBack: () => void;
  onLanguageChange: (language: Language) => void;
}

export function LanguageSettingsScreen({
  currentLanguage,
  onBack,
  onLanguageChange,
}: LanguageSettingsScreenProps) {
  const t = translations[currentLanguage];

  const languages: { code: Language; name: string; nativeName: string; flag: string }[] = [
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  ];

  const handleLanguageSelect = (language: Language) => {
    onLanguageChange(language);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="px-6 pt-8 pb-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2>{t.language}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {languages.map((lang, index) => {
            const isSelected = currentLanguage === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  isSelected ? 'bg-[#2ECC71]/5' : ''
                }`}
              >
                {/* Flag */}
                <div className="text-3xl">{lang.flag}</div>

                {/* Language Names */}
                <div className="flex-1 text-left">
                  <p className="font-medium">{lang.name}</p>
                  <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                </div>

                {/* Check Icon */}
                {isSelected && (
                  <div className="w-6 h-6 bg-[#2ECC71] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <div className="flex gap-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">i</span>
            </div>
            <div>
              <p className="text-sm text-blue-900">
                {t.languageInfo || 'The app interface and menu translations will update to match your selected language.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
