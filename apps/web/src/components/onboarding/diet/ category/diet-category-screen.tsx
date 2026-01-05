import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface DietCategoryScreenProps {
  onCategorySelect: (categories: string[]) => void;
  onBack: () => void;
  initialSelectedCategories?: string[];
}

interface CategoryOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

export function DietCategoryScreen({
  onCategorySelect,
  onBack,
  initialSelectedCategories = [],
}: DietCategoryScreenProps) {
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
      id: 'plantBased',
      emoji: '🌱',
      label: t.plantBased,
      description: t.plantBasedDesc,
    },
    {
      id: 'religious',
      emoji: '☪️',
      label: t.religiousDiet,
      description: t.religiousDietDesc,
    },
    {
      id: 'avoidance',
      emoji: '🚫',
      label: t.avoidanceDiet,
      description: t.avoidanceDietDesc,
    },
    {
      id: 'noPreference',
      emoji: '✨',
      label: t.noPreference,
      description: t.noPreferenceDesc,
    },
  ];

  const toggleCategory = (id: string) => {
    // If "noPreference" is selected, clear all others
    if (id === 'noPreference') {
      setSelectedCategories(['noPreference']);
    } else {
      // Remove "noPreference" if selecting something else
      setSelectedCategories((prev) => {
        const withoutNoPreference = prev.filter((c) => c !== 'noPreference');
        return withoutNoPreference.includes(id)
          ? withoutNoPreference.filter((c) => c !== id)
          : [...withoutNoPreference, id];
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <div className="p-6 pb-4">
        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {t.step} 3 {t.of} 4
          </span>
          <div className="h-2 flex-1 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60]"
              style={{ width: '75%' }}
            />
          </div>
        </div>

        <h1 className="mb-2">{t.tellUsYourDiet}</h1>
        <p className="text-muted-foreground">{t.selectDietCategories}</p>
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`relative w-full rounded-2xl border-2 p-6 transition-all ${
                selectedCategories.includes(category.id)
                  ? 'border-[#2ECC71] bg-[#2ECC71]/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } `}
            >
              {/* Selected Check */}
              {selectedCategories.includes(category.id) && (
                <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#2ECC71]">
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

              <div className="flex items-start gap-4">
                <span className="text-5xl">{category.emoji}</span>
                <div className="flex-1 text-left">
                  <div
                    className={`mb-1 ${selectedCategories.includes(category.id) ? 'text-[#2ECC71]' : 'text-gray-900'}`}
                  >
                    {category.label}
                  </div>
                  <div className="text-sm text-gray-500">
                    {category.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="border-t border-gray-100 p-6">
        <Button
          onClick={() => onCategorySelect(selectedCategories)}
          disabled={selectedCategories.length === 0}
          className="mb-4 h-14 w-full rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white shadow-lg shadow-[#2ECC71]/30 hover:from-[#27AE60] hover:to-[#229954]"
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
