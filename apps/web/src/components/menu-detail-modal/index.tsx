import { X, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

import { SafetyBadge } from '@/components/common/safety-badge';
import { useTranslation } from '@/hooks/useTranslation';

import type { SafetyLevel } from '@/components/common/safety-badge';

interface MenuItem {
  id: string;
  titleKey: string;
  koreanName: string;
  descKey: string;
  safetyStatus: SafetyLevel;
  warningKey?: string;
}

interface MenuDetailModalProps {
  item: MenuItem;
  onClose: () => void;
}

export function MenuDetailModal({ item, onClose }: MenuDetailModalProps) {
  const { t } = useTranslation();

  // Sample ingredients data
  const ingredients = [
    { ko: '돼지고기', en: 'Pork', safe: true },
    { ko: '김치', en: 'Kimchi', safe: true },
    { ko: '두부', en: 'Tofu', safe: true },
    { ko: '양파', en: 'Onion', safe: true },
    { ko: '다시다 (소고기 육수)', en: 'Dashida (Beef Stock)', safe: false },
  ];

  const getStatusIcon = () => {
    switch (item.safetyStatus) {
      case 'safe':
        return <CheckCircle className="h-6 w-6 text-white" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-gray-900" />;
      case 'danger':
        return <AlertCircle className="h-6 w-6 text-white" />;
    }
  };

  const getStatusColor = () => {
    switch (item.safetyStatus) {
      case 'safe':
        return '#2ECC71';
      case 'warning':
        return '#F1C40F';
      case 'danger':
        return '#E74C3C';
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="animate-in slide-in-from-bottom max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white">
        {/* Header */}
        <div className="sticky top-0 flex items-start justify-between border-b border-gray-200 bg-white px-6 pb-4 pt-6">
          <div className="flex-1">
            <h2 className="mb-1">
              {t[item.titleKey as keyof typeof t] as string}
            </h2>
            <p className="text-sm text-muted-foreground">{item.koreanName}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 px-6 py-6">
          {/* Description */}
          <div>
            <h3 className="mb-2">Description</h3>
            <p className="text-muted-foreground">
              {t[item.descKey as keyof typeof t] as string}
            </p>
          </div>

          {/* Alert Box */}
          {item.warningKey && (
            <div
              className="flex gap-3 rounded-xl border-2 p-4"
              style={{
                backgroundColor: `${getStatusColor()}10`,
                borderColor: getStatusColor(),
              }}
            >
              <div className="mt-0.5 flex-shrink-0">{getStatusIcon()}</div>
              <div>
                <h4 className="mb-1" style={{ color: getStatusColor() }}>
                  {t.warning}
                </h4>
                <p className="text-sm" style={{ color: getStatusColor() }}>
                  {t[item.warningKey as keyof typeof t] as string}
                </p>
              </div>
            </div>
          )}

          {/* Ingredients List */}
          <div>
            <h3 className="mb-3">Ingredients</h3>
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    ingredient.safe
                      ? 'bg-gray-50'
                      : 'border border-[#E74C3C] bg-[#E74C3C]/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {ingredient.safe ? (
                      <CheckCircle className="h-4 w-4 text-[#2ECC71]" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-[#E74C3C]" />
                    )}
                    <div>
                      <p className={ingredient.safe ? '' : 'text-[#E74C3C]'}>
                        {ingredient.en}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ingredient.ko}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Status */}
          <div className="pt-4">
            <div
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: `${getStatusColor()}` }}
            >
              <div className="flex items-center justify-center gap-2 text-white">
                {getStatusIcon()}
                <span className="text-white">
                  {item.safetyStatus === 'safe' && t.safe}
                  {item.safetyStatus === 'warning' && t.caution}
                  {item.safetyStatus === 'danger' && t.warning}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
