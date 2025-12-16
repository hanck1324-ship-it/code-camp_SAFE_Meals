import { Shield, Lock, Bell, Globe, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '../language-selector';
import { useTranslation } from '@/hooks/useTranslation';

interface ProfileScreenProps {
  userProfile: {
    allergies: string[];
    diets: string[];
  };
  onNavigate: (
    screen:
      | 'safetyProfileEdit'
      | 'notifications'
      | 'languageSettings'
      | 'help'
      | 'safetyCard',
  ) => void;
  onLogout: () => void;
}

export function ProfileScreen({ userProfile, onNavigate, onLogout }: ProfileScreenProps) {
  const { t, languageName } = useTranslation();

  const settingsItems = [
    {
      icon: Shield,
      label: t.safetyProfile,
      subtitle: t.editAllergiesDiets || 'Edit allergies & dietary preferences',
      action: () => onNavigate('safetyProfileEdit'),
    },
    { icon: Bell, label: t.notifications, subtitle: t.enabled, action: () => onNavigate('notifications') },
    {
      icon: Globe,
      label: t.language,
      subtitle: languageName,
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
      <div className="px-6 pt-8 pb-4 bg-white">
        <div className="flex items-center justify-between">
          <h1>{t.myProfile}</h1>
          <LanguageSelector />
        </div>
      </div>

      {/* Safety Profile Summary */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-full flex items-center justify-center shadow-lg shadow-[#2ECC71]/20">
              <Shield className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="mb-1">{t.safetyProfile}</h2>
          </div>

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

      {/* Logout */}
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

      <div className="text-center mt-4 text-sm text-muted-foreground">Version 1.0.0</div>
    </div>
  );
}

