import { ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useTranslation } from '@/hooks/useTranslation';

import { Button } from '@/components/ui/button';

interface AllergyCategoryScreenProps {
  onCategorySelect: (categories: string[]) => void;
  onBack: () => void;
  onEtcClick: () => void;
  initialSelectedCategories?: string[];
}

interface CategoryOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

export function AllergyCategoryScreen({
  onCategorySelect,
  onBack,
  onEtcClick,
  initialSelectedCategories = [],
}: AllergyCategoryScreenProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialSelectedCategories
  );
  const { t } = useTranslation();

  // 초기값이 변경되면 상태 업데이트
  useEffect(() => {
    if (initialSelectedCategories.length > 0) {
      setSelectedCategories(initialSelectedCategories);
    }
  }, [initialSelectedCategories]);

  const categories: CategoryOption[] = [
    {
      id: 'seafood',
      emoji: '🦀',
      label: t.seafood,
      description: t.seafoodDesc,
    },
    { id: 'nuts', emoji: '🥜', label: t.nuts, description: t.nutsDesc },
    {
      id: 'grainsWheat',
      emoji: '🌾',
      label: t.grainsWheat,
      description: t.grainsWheatDesc,
    },
    { id: 'meats', emoji: '🥩', label: t.meats, description: t.meatsDesc },
    {
      id: 'dairyEggs',
      emoji: '🥛',
      label: t.dairyEggs,
      description: t.dairyEggsDesc,
    },
    {
      id: 'fruits',
      emoji: '🍎',
      label: t.fruitsVeggies,
      description: t.fruitsVeggiesDesc,
    },
    {
      id: 'additives',
      emoji: '⚠️',
      label: t.additives,
      description: t.additivesDesc,
    },
  ];

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <div className="p-6 pb-4">
        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {t.step} 1 {t.of} 4
          </span>
          <div className="h-2 flex-1 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
              style={{ width: '25%' }}
            />
          </div>
        </div>

        <h1 className="mb-2">{t.whatAllergiesDoYouHave}</h1>
        <p className="text-muted-foreground">{t.selectAllergyCategories}</p>
      </div>

      {/* Category Grid */}
      <div className="overflow-y-auto px-6 pb-4">
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`relative rounded-2xl border-2 p-6 transition-all ${
                selectedCategories.includes(category.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } `}
            >
              {/* Selected Check */}
              {selectedCategories.includes(category.id) && (
                <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}

              <div className="flex flex-col items-center gap-3 text-center">
                <span className="text-5xl">{category.emoji}</span>
                <div>
                  <div
                    className={`mb-1 text-sm ${selectedCategories.includes(category.id) ? 'text-primary' : 'text-gray-900'}`}
                  >
                    {category.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {category.description}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {/* ETC Card - Search */}
          <button
            onClick={onEtcClick}
            className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-6 transition-all hover:border-primary hover:bg-primary/5"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-5xl">🔍</span>
              <div>
                <div className="mb-1 text-sm text-gray-900">{t.etc}</div>
                <div className="text-xs text-gray-500">{t.etcDesc}</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="border-t border-gray-100 px-6 pb-6 pt-[19px]">
        <Button
          onClick={() => onCategorySelect(selectedCategories)}
          className="mb-4 h-14 w-full rounded-full bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30 hover:from-primary/90 hover:to-primary/70"
        >
          {t.next}
        </Button>
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
            {t.back}
          </button>
          <button
            onClick={() => onCategorySelect([])}
            className="text-gray-500 hover:text-gray-700"
          >
            {t.skip}
          </button>
        </div>
      </div>
    </div>
  );
}
