import { useState, useEffect } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface DietDetailScreenProps {
  categories: string[];
  onComplete: (diets: string[]) => void;
  onBack: () => void;
  initialSelectedDiets?: string[];
}

interface DietOption {
  id: string;
  label: string;
  description: string;
  category: string;
}

export function DietDetailScreen({
  categories,
  onComplete,
  onBack,
  initialSelectedDiets = [],
}: DietDetailScreenProps) {
  const [selectedDiets, setSelectedDiets] =
    useState<string[]>(initialSelectedDiets);
  const { t } = useTranslation();

  // 초기값이 변경되면 상태 업데이트
  useEffect(() => {
    if (initialSelectedDiets.length > 0) {
      setSelectedDiets(initialSelectedDiets);
    }
  }, [initialSelectedDiets]);

  // If "noPreference" was selected, skip to completion
  useEffect(() => {
    if (categories.includes('noPreference') || categories.length === 0) {
      onComplete([]);
    }
  }, [categories, onComplete]);

  const allDietOptions: DietOption[] = [
    // Plant-Based
    {
      id: 'strictVegan',
      label: t.strictVegan,
      description: t.strictVeganDesc,
      category: 'plantBased',
    },
    {
      id: 'lactoVegetarian',
      label: t.lactoVegetarian,
      description: t.lactoVegetarianDesc,
      category: 'plantBased',
    },
    {
      id: 'ovoVegetarian',
      label: t.ovoVegetarian,
      description: t.ovoVegetarianDesc,
      category: 'plantBased',
    },
    {
      id: 'pescoVegetarian',
      label: t.pescoVegetarian,
      description: t.pescoVegetarianDesc,
      category: 'plantBased',
    },
    {
      id: 'flexitarian',
      label: t.flexitarian,
      description: t.flexitarianDesc,
      category: 'plantBased',
    },
    // Religious
    {
      id: 'halal',
      label: t.halal,
      description: t.halalDesc,
      category: 'religious',
    },
    {
      id: 'kosher',
      label: t.kosher,
      description: t.kosherDesc,
      category: 'religious',
    },
    {
      id: 'buddhistVegetarian',
      label: t.buddhistVegetarian,
      description: t.buddhistVegetarianDesc,
      category: 'religious',
    },
    // Avoidance
    {
      id: 'porkFree',
      label: t.porkFree,
      description: t.porkFreeDesc,
      category: 'avoidance',
    },
    {
      id: 'alcoholFree',
      label: t.alcoholFree,
      description: t.alcoholFreeDesc,
      category: 'avoidance',
    },
    {
      id: 'garlicOnionFree',
      label: t.garlicOnionFree,
      description: t.garlicOnionFreeDesc,
      category: 'avoidance',
    },
  ];

  const filteredOptions = allDietOptions.filter((option) =>
    categories.includes(option.category)
  );

  const toggleDiet = (id: string) => {
    setSelectedDiets((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const groupedOptions = categories
    .filter((c) => c !== 'noPreference')
    .map((category) => ({
      category,
      options: filteredOptions.filter((option) => option.category === category),
    }));

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      plantBased: t.plantBased,
      religious: t.religiousDiet,
      avoidance: t.avoidanceDiet,
    };
    return labels[category] || category;
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <div className="p-6 pb-4">
        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {t.step} 4 {t.of} 4
          </span>
          <div className="h-2 flex-1 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60]"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <h1 className="mb-2">{t.selectSpecificDiets}</h1>
        <p className="text-muted-foreground">{t.dietDetailDesc}</p>
      </div>

      {/* Diet List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-6">
          {groupedOptions.map(({ category, options }) => (
            <div key={category}>
              <h3 className="mb-3 text-sm text-gray-600">
                {getCategoryLabel(category)}
              </h3>
              <div className="space-y-2">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleDiet(option.id)}
                    className={`flex w-full items-start justify-between rounded-xl border-2 p-4 transition-all ${
                      selectedDiets.includes(option.id)
                        ? 'border-[#2ECC71] bg-[#2ECC71]/5'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } `}
                  >
                    <div className="flex-1 text-left">
                      <div
                        className={`mb-1 ${selectedDiets.includes(option.id) ? 'text-[#2ECC71]' : 'text-gray-900'}`}
                      >
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                    {selectedDiets.includes(option.id) && (
                      <div className="ml-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2ECC71]">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Button */}
      <div className="border-t border-gray-100 p-6">
        <Button
          onClick={() => onComplete(selectedDiets)}
          disabled={selectedDiets.length === 0}
          className="mb-4 h-14 w-full rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white shadow-lg shadow-[#2ECC71]/30 hover:from-[#27AE60] hover:to-[#229954]"
        >
          {t.done}
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
            onClick={() => onComplete([])}
            className="text-gray-500 hover:text-gray-700"
          >
            {t.skip}
          </button>
        </div>
      </div>
    </div>
  );
}
