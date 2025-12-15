import { X, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Language, translations } from '@/lib/translations';
import { SafetyBadge, SafetyLevel } from '@/components/common/safety-badge';

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
  language: Language;
}

export function MenuDetailModal({ item, onClose, language }: MenuDetailModalProps) {
  const t = translations[language];

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
        return <CheckCircle className="w-6 h-6 text-white" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-gray-900" />;
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-white" />;
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
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-200 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="mb-1">{t[item.titleKey as keyof typeof t] as string}</h2>
            <p className="text-sm text-muted-foreground">{item.koreanName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
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
              className="p-4 rounded-xl border-2 flex gap-3"
              style={{ 
                backgroundColor: `${getStatusColor()}10`,
                borderColor: getStatusColor()
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon()}
              </div>
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
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    ingredient.safe ? 'bg-gray-50' : 'bg-[#E74C3C]/10 border border-[#E74C3C]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {ingredient.safe ? (
                      <CheckCircle className="w-4 h-4 text-[#2ECC71]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#E74C3C]" />
                    )}
                    <div>
                      <p className={ingredient.safe ? '' : 'text-[#E74C3C]'}>
                        {ingredient.en}
                      </p>
                      <p className="text-xs text-muted-foreground">{ingredient.ko}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Status */}
          <div className="pt-4">
            <div 
              className="p-4 rounded-xl text-center"
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