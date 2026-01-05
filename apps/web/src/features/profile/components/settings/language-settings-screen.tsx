import { ChevronLeft, Check } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/lib/translations';
import { useRouter } from 'next/navigation';

interface LanguageSettingsScreenProps {
  onBack: () => void;
}

export function LanguageSettingsScreen({
  onBack,
}: LanguageSettingsScreenProps) {
  const { t, language: currentLanguage, setLanguage } = useTranslation();
  const router = useRouter();

  const languages: {
    code: Language;
    name: string;
    nativeName: string;
    flag: string;
  }[] = [
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  ];

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    // 언어 변경 후 모든 페이지를 다시 렌더링하여 즉시 반영
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="border-b border-gray-200 bg-white px-6 pb-4 pt-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="-ml-2 flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2>{t.language}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {languages.map((lang, index) => {
            const isSelected = currentLanguage === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className={`flex w-full items-center gap-4 border-b border-gray-100 p-4 transition-colors last:border-b-0 hover:bg-gray-50 ${
                  isSelected ? 'bg-[#2ECC71]/5' : ''
                }`}
              >
                {/* Flag */}
                <div className="text-3xl">{lang.flag}</div>

                {/* Language Names */}
                <div className="flex-1 text-left">
                  <p className="font-medium">{lang.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {lang.nativeName}
                  </p>
                </div>

                {/* Check Icon */}
                {isSelected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2ECC71]">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
              <span className="text-xs text-white">i</span>
            </div>
            <div>
              <p className="text-sm text-blue-900">
                {t.languageInfo ||
                  'The app interface and menu translations will update to match your selected language.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
