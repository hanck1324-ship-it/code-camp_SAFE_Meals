import { X, CheckCircle, AlertTriangle, AlertCircle, ChevronLeft } from 'lucide-react';
import { Language, translations } from '../lib/translations';
import { LanguageSelector } from './language-selector';

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

export function ScanResultScreen({ onBack, language, onLanguageChange }: ScanResultScreenProps) {
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
        return <CheckCircle className="w-5 h-5 text-[#10B981]" />;
      case 'caution':
        return <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />;
      case 'danger':
        return <AlertCircle className="w-5 h-5 text-[#EF4444]" />;
    }
  };

  const getSafetyBadge = (status: MenuItem['safetyStatus']) => {
    switch (status) {
      case 'safe':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-[#10B981]/10 rounded-full">
            <CheckCircle className="w-3 h-3 text-[#10B981]" />
            <span className="text-xs text-[#10B981]">{t.safe}</span>
          </div>
        );
      case 'caution':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-[#F59E0B]/10 rounded-full">
            <AlertTriangle className="w-3 h-3 text-[#F59E0B]" />
            <span className="text-xs text-[#F59E0B]">{t.caution}</span>
          </div>
        );
      case 'danger':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-[#EF4444]/10 rounded-full">
            <AlertCircle className="w-3 h-3 text-[#EF4444]" />
            <span className="text-xs text-[#EF4444]">{t.warning}</span>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Top Half - Camera View */}
      <div className="h-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1639508138725-0b8e762b3cfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwbWVudSUyMGZvb2R8ZW58MXx8fHwxNzY1NDkwNjYyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Menu"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />
        
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
          <div className="px-4 py-2 bg-white rounded-full shadow-lg">
            <span className="text-sm">{t.scanning}</span>
          </div>
          <button
            onClick={onBack}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera Frame Overlay */}
        <div className="absolute inset-4 border-2 border-white/50 rounded-2xl pointer-events-none" />
      </div>

      {/* Bottom Half - Menu Items */}
      <div className="h-1/2 flex flex-col bg-gray-50">
        <div className="flex-shrink-0 bg-white px-6 py-4 border-b border-gray-200">
          <h2>{t.menuItems}</h2>
          <p className="text-sm text-muted-foreground">{menuItems.length} {t.itemsDetected}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border-2 border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="mb-1">{t[item.titleKey as keyof typeof t] as string}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.originalText}
                  </p>
                </div>
                {getSafetyIcon(item.safetyStatus)}
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
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
