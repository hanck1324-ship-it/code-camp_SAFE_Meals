'use client';

import {
  X,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

import { MenuListItem } from '@/components/common/menu-list-item';
import { SafetyBadge } from '@/components/common/safety-badge';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

import type { SafetyLevel } from '@/components/common/safety-badge';

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
}

export function ScanResultSplit({
  onBack,
  onSelectItem,
}: ScanResultSplitProps) {
  const { t } = useTranslation();
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
    setExpandedItems((prev) => {
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
    <div className="flex h-screen flex-col bg-white">
      {/* Top 40% - Menu Image */}
      <div className="relative h-[40%] bg-gray-900">
        <img
          src="https://images.unsplash.com/photo-1651375562178-f37f5f0bf857?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjByZXN0YXVyYW50JTIwbWVudSUyMHBhcGVyfGVufDF8fHx8MTc2NTc2MTAxN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Korean Menu"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

        {/* Close Button */}
        <button
          onClick={onBack}
          className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-transform active:scale-95"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Scan Info Banner */}
        <div className="absolute left-6 top-6 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm">
          <p className="text-sm">
            <span className="text-[#2ECC71]">✓</span>{' '}
            {t.scanComplete || 'Scan Complete'}
          </p>
        </div>

        {/* OCR Detection Highlights - Mock visual indicators */}
        {highlightedItem && (
          <div className="pointer-events-none absolute inset-12 animate-pulse rounded-lg border-2 border-[#2ECC71]" />
        )}
      </div>

      {/* Bottom 60% - Translated Menu List */}
      <div className="flex h-[60%] flex-col bg-gray-50">
        <div className="bg-white px-6 py-4 shadow-sm">
          <h2>{t.menuItems}</h2>
          <p className="text-sm text-muted-foreground">
            {menuItems.length} {t.itemsDetected}
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 pb-24">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => setHighlightedItem(item.id)}
              onMouseLeave={() => setHighlightedItem(null)}
              className="w-full rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#2ECC71] hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1">
                    {t[item.titleKey as keyof typeof t] as string}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.koreanName}
                  </p>
                </div>
                <SafetyBadge
                  level={item.safetyStatus}
                  text={
                    item.safetyStatus === 'safe'
                      ? (t.safe as string)
                      : item.safetyStatus === 'warning'
                        ? (t.caution as string)
                        : (t.danger as string)
                  }
                  size="sm"
                />
              </div>

              {/* Description Section */}
              {expandedItems.has(item.id) && (
                <div className="animate-in slide-in-from-top mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm text-gray-700">
                    {t[item.descKey as keyof typeof t] as string}
                  </p>
                  {item.warningKey && (
                    <div className="mt-2 flex items-start gap-2 rounded-md border border-[#E74C3C]/30 bg-[#E74C3C]/10 p-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E74C3C]" />
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
              >
                <span>
                  {expandedItems.has(item.id)
                    ? t.description
                    : t.viewDescription}
                </span>
                {expandedItems.has(item.id) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
