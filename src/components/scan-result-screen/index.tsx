'use client';

import {
  X,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { LanguageSelector } from '@/components/language-selector';

interface MenuItem {
  id: string;
  titleKey: string;
  descKey: string;
  originalText: string;
  safetyStatus: 'safe' | 'caution' | 'danger';
  warningKey?: string;
}

interface ScanResultScreenProps {
  onBack: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function ScanResultScreen({
  onBack,
  language,
  onLanguageChange,
}: ScanResultScreenProps) {
  const t = translations[language];

  const menuItems: MenuItem[] = [
    {
      id: '1',
      titleKey: 'bibimbap',
      descKey: 'bibimbapDesc',
      originalText: '비빔밥',
      safetyStatus: 'safe',
    },
    {
      id: '2',
      titleKey: 'kimchiJjigae',
      descKey: 'kimchiJjigaeDesc',
      originalText: '김치찌개',
      safetyStatus: 'caution',
      warningKey: 'mayContainFishSauce',
    },
    {
      id: '3',
      titleKey: 'soybeanStew',
      descKey: 'soybeanStewDesc',
      originalText: '순두부찌개',
      safetyStatus: 'danger',
      warningKey: 'containsBeefStock',
    },
    {
      id: '4',
      titleKey: 'japchae',
      descKey: 'japchaeDesc',
      originalText: '잡채',
      safetyStatus: 'safe',
    },
    {
      id: '5',
      titleKey: 'bulgogi',
      descKey: 'bulgogiDesc',
      originalText: '불고기',
      safetyStatus: 'danger',
      warningKey: 'containsMeat',
    },
    {
      id: '6',
      titleKey: 'veggieKimbap',
      descKey: 'veggieKimbapDesc',
      originalText: '야채김밥',
      safetyStatus: 'safe',
    },
  ];

  const getSafetyIcon = (status: MenuItem['safetyStatus']) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="h-5 w-5 text-[#10B981]" />;
      case 'caution':
        return <AlertTriangle className="h-5 w-5 text-[#F59E0B]" />;
      case 'danger':
        return <AlertCircle className="h-5 w-5 text-[#EF4444]" />;
    }
  };

  const getSafetyBadge = (status: MenuItem['safetyStatus']) => {
    switch (status) {
      case 'safe':
        return (
          <div className="flex items-center gap-1 rounded-full bg-[#10B981]/10 px-2 py-1">
            <CheckCircle className="h-3 w-3 text-[#10B981]" />
            <span className="text-xs text-[#10B981]">{t.safe}</span>
          </div>
        );
      case 'caution':
        return (
          <div className="flex items-center gap-1 rounded-full bg-[#F59E0B]/10 px-2 py-1">
            <AlertTriangle className="h-3 w-3 text-[#F59E0B]" />
            <span className="text-xs text-[#F59E0B]">{t.caution}</span>
          </div>
        );
      case 'danger':
        return (
          <div className="flex items-center gap-1 rounded-full bg-[#EF4444]/10 px-2 py-1">
            <AlertCircle className="h-3 w-3 text-[#EF4444]" />
            <span className="text-xs text-[#EF4444]">{t.warning}</span>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Top Half - Camera View */}
      <div className="relative h-1/2">
        <img
          src="https://images.unsplash.com/photo-1639508138725-0b8e762b3cfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwbWVudSUyMGZvb2R8ZW58MXx8fHwxNzY1NDkwNjYyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Menu"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

        {/* Header Controls */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <LanguageSelector />
          </div>
          <div className="rounded-full bg-white px-4 py-2 shadow-lg">
            <span className="text-sm">{t.scanning}</span>
          </div>
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Camera Frame Overlay */}
        <div className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-white/50" />
      </div>

      {/* Bottom Half - Menu Items */}
      <div className="flex h-1/2 flex-col bg-gray-50">
        <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
          <h2>{t.menuItems}</h2>
          <p className="text-sm text-muted-foreground">
            {menuItems.length} {t.itemsDetected}
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border-2 border-gray-200 bg-white p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1">
                    {t[item.titleKey as keyof typeof t] as string}
                  </h3>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {item.originalText}
                  </p>
                </div>
                {getSafetyIcon(item.safetyStatus)}
              </div>

              <p className="mb-3 text-sm text-muted-foreground">
                {t[item.descKey as keyof typeof t] as string}
              </p>

              <div className="flex items-center justify-between">
                {getSafetyBadge(item.safetyStatus)}
                {item.warningKey && (
                  <p className="text-xs text-[#EF4444]">
                    {t[item.warningKey as keyof typeof t] as string}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
