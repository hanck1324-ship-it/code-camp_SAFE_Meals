import { useState, useEffect } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '../../ui/button';
import { Language, translations } from '../../../lib/translations';

interface DietDetailScreenProps {
  categories: string[];
  onComplete: (diets: string[]) => void;
  onBack: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

interface DietOption {
  id: string;
  label: string;
  description: string;
  category: string;
}

export function DietDetailScreen({ categories, onComplete, onBack, language, onLanguageChange }: DietDetailScreenProps) {
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const t = translations[language];

  // If "noPreference" was selected, skip to completion
  useEffect(() => {
    if (categories.includes('noPreference') || categories.length === 0) {
      onComplete([]);
    }
  }, [categories, onComplete]);

  const allDietOptions: DietOption[] = [
    // Plant-Based
    { id: 'strictVegan', label: t.strictVegan, description: t.strictVeganDesc, category: 'plantBased' },
    { id: 'lactoVegetarian', label: t.lactoVegetarian, description: t.lactoVegetarianDesc, category: 'plantBased' },
    { id: 'ovoVegetarian', label: t.ovoVegetarian, description: t.ovoVegetarianDesc, category: 'plantBased' },
    { id: 'pescoVegetarian', label: t.pescoVegetarian, description: t.pescoVegetarianDesc, category: 'plantBased' },
    { id: 'flexitarian', label: t.flexitarian, description: t.flexitarianDesc, category: 'plantBased' },
    // Religious
    { id: 'halal', label: t.halal, description: t.halalDesc, category: 'religious' },
    { id: 'kosher', label: t.kosher, description: t.kosherDesc, category: 'religious' },
    { id: 'buddhistVegetarian', label: t.buddhistVegetarian, description: t.buddhistVegetarianDesc, category: 'religious' },
    // Avoidance
    { id: 'porkFree', label: t.porkFree, description: t.porkFreeDesc, category: 'avoidance' },
    { id: 'alcoholFree', label: t.alcoholFree, description: t.alcoholFreeDesc, category: 'avoidance' },
    { id: 'garlicOnionFree', label: t.garlicOnionFree, description: t.garlicOnionFreeDesc, category: 'avoidance' },
  ];

  const filteredOptions = allDietOptions.filter(option =>
    categories.includes(option.category)
  );

  const toggleDiet = (id: string) => {
    setSelectedDiets(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const groupedOptions = categories.filter(c => c !== 'noPreference').map(category => ({
    category,
    options: filteredOptions.filter(option => option.category === category),
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-500">{t.step} 4 {t.of} 4</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <h1 className="mb-2">{t.selectSpecificDiets}</h1>
        <p className="text-muted-foreground">
          {t.dietDetailDesc}
        </p>
      </div>

      {/* Diet List */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <div className="space-y-6">
          {groupedOptions.map(({ category, options }) => (
            <div key={category}>
              <h3 className="text-sm mb-3 text-gray-600">{getCategoryLabel(category)}</h3>
              <div className="space-y-2">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleDiet(option.id)}
                    className={`
                      w-full flex items-start justify-between p-4 rounded-xl border-2 transition-all
                      ${selectedDiets.includes(option.id)
                        ? 'border-[#2ECC71] bg-[#2ECC71]/5'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="text-left flex-1">
                      <div className={`mb-1 ${selectedDiets.includes(option.id) ? 'text-[#2ECC71]' : 'text-gray-900'}`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                    {selectedDiets.includes(option.id) && (
                      <div className="w-6 h-6 rounded-full bg-[#2ECC71] flex items-center justify-center ml-3 flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
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
      <div className="p-6 border-t border-gray-100">
        <Button
          onClick={() => onComplete(selectedDiets)}
          disabled={selectedDiets.length === 0}
          className="w-full h-14 rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white shadow-lg shadow-[#2ECC71]/30 mb-4"
        >
          {t.done}
        </Button>
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <ChevronLeft className="w-5 h-5" />
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