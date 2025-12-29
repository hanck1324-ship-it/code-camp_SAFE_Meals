import {
  Shield,
  Lock,
  CreditCard,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Language, translations, languageNames } from '@/lib/translations';
import { LanguageSelector } from '@/components/language-selector';

interface ProfileScreenProps {
  userProfile: {
    allergies: string[];
    diets: string[];
  };
  onNavigate: (
    screen:
      | 'safetyProfileEdit'
      | 'payment'
      | 'languageSettings'
      | 'help'
      | 'safetyCard'
  ) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onLogout: () => void;
}

export function ProfileScreen({
  userProfile,
  onNavigate,
  language,
  onLanguageChange,
  onLogout,
}: ProfileScreenProps) {
  const t = translations[language] || translations['en'];

  const sampleAllergies = userProfile.allergies.slice(0, 2);
  const sampleDiets = userProfile.diets.slice(0, 2);
  const sampleBadges = [...sampleAllergies, ...sampleDiets].slice(0, 4);

  const settingsItems = [
    {
      icon: Shield,
      label: t.safetyProfile,
      subtitle: t.editAllergiesDiets || 'Edit allergies & dietary preferences',
      action: () => onNavigate('safetyProfileEdit'),
    },
    {
      icon: CreditCard,
      label: t.payment || '결제',
      subtitle: t.paymentSubtitle || '결제 수단 및 내역 관리',
      action: () => onNavigate('payment'),
    },
    {
      icon: Globe,
      label: t.language,
      subtitle: languageNames[language],
      action: () => onNavigate('languageSettings'),
    },
    {
      icon: HelpCircle,
      label: t.helpSupport,
      subtitle: t.faqContactSupport || 'FAQ, Contact, Safety Guide',
      action: () => onNavigate('help'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 pb-4 pt-8">
        <div className="flex items-center justify-between">
          <h1>{t.myProfile}</h1>
          <LanguageSelector />
        </div>
      </div>

      {/* Safety Profile Summary */}
      <div className="px-6 py-6">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] shadow-lg shadow-[#2ECC71]/20">
              <Shield className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="mb-4 text-center">
            <h2 className="mb-1">{t.safetyProfile}</h2>
            <p className="text-sm text-muted-foreground">
              {userProfile.allergies.length} {t.allergies} •{' '}
              {userProfile.diets.length} {t.diets}
            </p>
          </div>

          {sampleBadges.length > 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {sampleBadges.map((badge, index) => (
                <div
                  key={index}
                  className="rounded-full bg-[#2ECC71]/10 px-3 py-1.5 text-sm text-[#2ECC71]"
                >
                  {badge}
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={() => onNavigate('safetyCard')}
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white shadow-lg shadow-[#2ECC71]/30 hover:from-[#27AE60] hover:to-[#229954]"
          >
            <Lock className="mr-2 h-5 w-5" />
            {t.showSafetyCard || 'Show Safety Card to Staff'}
          </Button>
        </div>
      </div>

      {/* Settings List */}
      <div className="px-6">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.action}
                className="flex w-full items-center gap-4 border-b border-gray-100 p-4 transition-colors last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.subtitle}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="mt-6 px-6">
        <Button
          onClick={onLogout}
          variant="outline"
          className="hover:bg-destructive/10 h-12 w-full rounded-2xl border-2 border-gray-200 text-destructive"
        >
          <LogOut className="mr-2 h-5 w-5" />
          {t.logOut}
        </Button>
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Version 1.0.0
      </div>
    </div>
  );
}
