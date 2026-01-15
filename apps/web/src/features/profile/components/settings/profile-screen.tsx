import {
  Shield,
  CreditCard,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';

import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface ProfileScreenProps {
  onNavigate: (
    screen:
      | 'safetyProfileEdit'
      | 'payment'
      | 'languageSettings'
      | 'help'
      | 'safetyCard'
  ) => void;
  onLogout: () => void;
}

export function ProfileScreen({ onNavigate, onLogout }: ProfileScreenProps) {
  const { t, languageName } = useTranslation();

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
      <div className="bg-white px-6 pb-4 pt-8">
        <div className="flex items-center justify-between">
          <h1>{t.myProfile}</h1>
          <LanguageSelector />
        </div>
      </div>

      {/* Settings List */}
      <div className="mt-12 px-6">
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
