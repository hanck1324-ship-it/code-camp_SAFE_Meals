import { X, CheckCircle, AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Language, translations } from '../lib/translations';
import { useState } from 'react';
import { Button } from './ui/button';
import { SafetyBadge, SafetyLevel } from './common/safety-badge';
import { MenuListItem } from './common/menu-list-item';

interface MenuItem {
  id: string;
  titleKey: string;
  koreanName: string;
  descKey: string;
  safetyStatus: SafetyLevel;
  warningKey?: string;
  ingredients?: string[];
}

interface ScanResultSplitProps {
  onBack: () => void;
  onSelectItem: (item: MenuItem) => void;
  language: Language;
}

export function ScanResultSplit({ onBack, onSelectItem, language }: ScanResultSplitProps) {
  const t = translations[language];
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const menuItems: MenuItem[] = [
    {
      id: '1',
      titleKey: 'bibimbap',
      koreanName: '비빔밥',
      descKey: 'bibimbapDesc',
      safetyStatus: 'safe',
    },
    {
      id: '2',
      titleKey: 'kimchiJjigae',
      koreanName: '김치찌개',
      descKey: 'kimchiJjigaeDesc',
      safetyStatus: 'warning',
      warningKey: 'mayContainFishSauce',
    },
    {
      id: '3',
      titleKey: 'soybeanStew',
      koreanName: '순두부찌개',
      descKey: 'soybeanStewDesc',
      safetyStatus: 'danger',
      warningKey: 'containsBeefStock',
    },
    {
      id: '4',
      titleKey: 'japchae',
      koreanName: '잡채',
      descKey: 'japchaeDesc',
      safetyStatus: 'safe',
    },
    {
      id: '5',
      titleKey: 'bulgogi',
      koreanName: '불고기',
      descKey: 'bulgogiDesc',
      safetyStatus: 'danger',
      warningKey: 'containsMeat',
    },
    {
      id: '6',
      titleKey: 'veggieKimbap',
      koreanName: '야채김밥',
      descKey: 'veggieKimbapDesc',
      safetyStatus: 'safe',
    },
  ];

  const toggleDescription = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Top 40% - Menu Image */}
      <div className="h-[40%] relative bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1651375562178-f37f5f0bf857?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjByZXN0YXVyYW50JTIwbWVudSUyMHBhcGVyfGVufDF8fHx8MTc2NTc2MTAxN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Korean Menu"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        
        {/* Close Button */}
        <button
          onClick={onBack}
          className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Scan Info Banner */}
        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          <p className="text-sm">
            <span className="text-[#2ECC71]">✓</span> {t.scanComplete || 'Scan Complete'}
          </p>
        </div>

        {/* OCR Detection Highlights - Mock visual indicators */}
        {highlightedItem && (
          <div className="absolute inset-12 border-2 border-[#2ECC71] rounded-lg pointer-events-none animate-pulse" />
        )}
      </div>

      {/* Bottom 60% - Translated Menu List */}
      <div className="h-[60%] bg-gray-50 flex flex-col">
        <div className="bg-white px-6 py-4 shadow-sm">
          <h2>{t.menuItems}</h2>
          <p className="text-sm text-muted-foreground">
            {menuItems.length} {t.itemsDetected}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => setHighlightedItem(item.id)}
              onMouseLeave={() => setHighlightedItem(null)}
              className="w-full bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-[#2ECC71] transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="mb-1">{t[item.titleKey as keyof typeof t] as string}</h3>
                  <p className="text-sm text-muted-foreground">{item.koreanName}</p>
                </div>
                <SafetyBadge 
                  level={item.safetyStatus}
                  text={
                    item.safetyStatus === 'safe' ? t.safe as string :
                    item.safetyStatus === 'warning' ? t.caution as string :
                    t.danger as string
                  }
                  size="sm"
                />
              </div>

              {/* Description Section */}
              {expandedItems.has(item.id) && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top">
                  <p className="text-sm text-gray-700">
                    {t[item.descKey as keyof typeof t] as string}
                  </p>
                  {item.warningKey && (
                    <div className="mt-2 flex items-start gap-2 p-2 rounded-md bg-[#E74C3C]/10 border border-[#E74C3C]/30">
                      <AlertCircle className="w-4 h-4 text-[#E74C3C] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[#E74C3C]">
                        {t[item.warningKey as keyof typeof t] as string}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* View Description Button */}
              <button
                onClick={(e) => toggleDescription(item.id, e)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm text-gray-700"
              >
                <span>{expandedItems.has(item.id) ? t.description : t.viewDescription}</span>
                {expandedItems.has(item.id) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}