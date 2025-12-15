import { Shield, Lock, Bell, Globe, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Language, translations, languageNames } from '../lib/translations';
import { LanguageSelector } from './language-selector';

interface ProfileScreenProps {
  userProfile: {
    allergies: string[];
    diets: string[];
  };
  onNavigate: (screen: 'safetyProfileEdit' | 'notifications' | 'languageSettings' | 'help' | 'safetyCard') => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  onLogout: () => void;
}

export function ProfileScreen({ userProfile, onNavigate, language, onLanguageChange, onLogout }: ProfileScreenProps) {
  const t = translations[language];

  // Get sample badges (first 3 items)
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
      icon: Bell,
      label: t.notifications,
      subtitle: t.enabled,
      action: () => onNavigate('notifications'),
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
      {/* Header - NO BACK BUTTON (Root Tab) */}
      <div className="px-6 pt-8 pb-4 bg-white">
        <div className="flex items-center justify-between">
          <h1>{t.myProfile}</h1>
          <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
        </div>
      </div>

      {/* Safety Profile Summary Card */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-full flex items-center justify-center shadow-lg shadow-[#2ECC71]/20">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="text-center mb-4">
            <h2 className="mb-1">{t.safetyProfile}</h2>
            <p className="text-sm text-muted-foreground">
              {userProfile.allergies.length} {t.allergies} • {userProfile.diets.length} {t.diets}
            </p>
          </div>

          {/* Sample Badges */}
          {sampleBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {sampleBadges.map((badge, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-[#2ECC71]/10 text-[#2ECC71] rounded-full text-sm"
                >
                  {badge}
                </div>
              ))}
            </div>
          )}

          {/* Primary Action Button */}
          <Button
            onClick={() => onNavigate('safetyCard')}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white shadow-lg shadow-[#2ECC71]/30"
          >
            <Lock className="w-5 h-5 mr-2" />
            {t.showSafetyCard || 'Show Safety Card to Staff'}
          </Button>
        </div>
      </div>

      {/* Settings List */}
      <div className="px-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-6 mt-6">
        <Button
          onClick={onLogout}
          variant="outline"
          className="w-full h-12 rounded-2xl border-2 border-gray-200 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5 mr-2" />
          {t.logOut}
        </Button>
      </div>

      {/* App Version */}
      <div className="text-center mt-4 text-sm text-muted-foreground">
        Version 1.0.0
      </div>
    </div>
  );
}
