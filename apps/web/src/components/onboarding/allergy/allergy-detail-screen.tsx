import { useState, useEffect } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '../../ui/button';
import { Language, translations } from '../../../lib/translations';

interface AllergyDetailScreenProps {
  categories: string[];
  onAllergySelect: (allergies: string[]) => void;
  onBack: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
  initialSelectedAllergies?: string[];
}

interface AllergyOption {
  id: string;
  label: string;
  category: string;
}

export function AllergyDetailScreen({
  categories,
  onAllergySelect,
  onBack,
  language,
  onLanguageChange,
  initialSelectedAllergies = [],
}: AllergyDetailScreenProps) {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    initialSelectedAllergies
  );
  const t = translations[language];

  // 초기값이 변경되면 상태 업데이트
  useEffect(() => {
    if (initialSelectedAllergies.length > 0) {
      setSelectedAllergies(initialSelectedAllergies);
    }
  }, [initialSelectedAllergies]);

  // If no categories selected, skip this step
  useEffect(() => {
    if (categories.length === 0) {
      onAllergySelect([]);
    }
  }, [categories, onAllergySelect]);

  const allAllergyOptions: AllergyOption[] = [
    // Seafood
    { id: 'shrimp', label: t.shrimp, category: 'seafood' },
    { id: 'crab', label: t.crab, category: 'seafood' },
    { id: 'lobster', label: t.lobster, category: 'seafood' },
    { id: 'squid', label: t.squid, category: 'seafood' },
    { id: 'clams', label: t.clams, category: 'seafood' },
    { id: 'fish', label: t.fish, category: 'seafood' },
    // Nuts
    { id: 'peanut', label: t.peanut, category: 'nuts' },
    { id: 'almond', label: t.almond, category: 'nuts' },
    { id: 'walnut', label: t.walnut, category: 'nuts' },
    { id: 'cashew', label: t.cashew, category: 'nuts' },
    { id: 'pistachio', label: t.pistachio, category: 'nuts' },
    // Grains/Wheat
    { id: 'wheat', label: t.wheat, category: 'grainsWheat' },
    { id: 'barley', label: t.barley, category: 'grainsWheat' },
    { id: 'oats', label: t.oats, category: 'grainsWheat' },
    { id: 'rice', label: t.rice, category: 'grainsWheat' },
    { id: 'corn', label: t.corn, category: 'grainsWheat' },
    // Meats
    { id: 'beef', label: t.beef, category: 'meats' },
    { id: 'pork', label: t.pork, category: 'meats' },
    { id: 'chicken', label: t.chicken, category: 'meats' },
    { id: 'lamb', label: t.lamb, category: 'meats' },
    // Dairy & Eggs
    { id: 'milk', label: t.milk, category: 'dairyEggs' },
    { id: 'cheese', label: t.cheese, category: 'dairyEggs' },
    { id: 'butter', label: t.butter, category: 'dairyEggs' },
    { id: 'yogurt', label: t.yogurt, category: 'dairyEggs' },
    { id: 'egg', label: t.egg, category: 'dairyEggs' },
    // Fruits
    { id: 'strawberry', label: t.strawberry, category: 'fruits' },
    { id: 'kiwi', label: t.kiwi, category: 'fruits' },
    { id: 'mango', label: t.mango, category: 'fruits' },
    { id: 'peach', label: t.peach, category: 'fruits' },
    // Additives
    { id: 'sulfites', label: t.sulfites, category: 'additives' },
    { id: 'msg', label: t.msg, category: 'additives' },
    { id: 'foodDyes', label: t.foodDyes, category: 'additives' },
  ];

  const filteredOptions = allAllergyOptions.filter((option) =>
    categories.includes(option.category)
  );

  const toggleAllergy = (id: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const groupedOptions = categories.map((category) => ({
    category,
    options: filteredOptions.filter((option) => option.category === category),
  }));

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      seafood: t.seafood,
      nuts: t.nuts,
      grainsWheat: t.grainsWheat,
      meats: t.meats,
      dairyEggs: t.dairyEggs,
      fruits: t.fruitsVeggies,
      additives: t.additives,
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
            {t.step} 2 {t.of} 4
          </span>
          <div className="h-2 flex-1 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60]"
              style={{ width: '50%' }}
            />
          </div>
        </div>

        <h1 className="mb-2">{t.selectSpecificAllergies}</h1>
        <p className="text-muted-foreground">{t.allergyDetailDesc}</p>
      </div>

      {/* Allergy List */}
      <div className="overflow-y-auto px-6 pb-4">
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
                    onClick={() => toggleAllergy(option.id)}
                    className={`flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all ${
                      selectedAllergies.includes(option.id)
                        ? 'border-[#2ECC71] bg-[#2ECC71]/5'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } `}
                  >
                    <span
                      className={
                        selectedAllergies.includes(option.id)
                          ? 'text-[#2ECC71]'
                          : 'text-gray-900'
                      }
                    >
                      {option.label}
                    </span>
                    {selectedAllergies.includes(option.id) && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2ECC71]">
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
      <div className="border-t border-gray-100 px-6 pb-6 pt-[19px]">
        <Button
          onClick={() => onAllergySelect(selectedAllergies)}
          disabled={selectedAllergies.length === 0}
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
            onClick={() => onAllergySelect([])}
            className="text-gray-500 hover:text-gray-700"
          >
            {t.skip}
          </button>
        </div>
      </div>
    </div>
  );
}
