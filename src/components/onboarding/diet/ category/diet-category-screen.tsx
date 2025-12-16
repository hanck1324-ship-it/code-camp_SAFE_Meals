import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Language, translations } from '@/lib/translations';

interface DietCategoryScreenProps {
  onCategorySelect: (categories: string[]) => void;
  onBack: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

interface CategoryOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

export function DietCategoryScreen({ onCategorySelect, onBack, language, onLanguageChange }: DietCategoryScreenProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const t = translations[language];

  const categories: CategoryOption[] = [
    { id: 'plantBased', emoji: '🌱', label: t.plantBased, description: t.plantBasedDesc },
    { id: 'religious', emoji: '☪️', label: t.religiousDiet, description: t.religiousDietDesc },
    { id: 'avoidance', emoji: '🚫', label: t.avoidanceDiet, description: t.avoidanceDietDesc },
    { id: 'noPreference', emoji: '✨', label: t.noPreference, description: t.noPreferenceDesc },
  ];

  const toggleCategory = (id: string) => {
    // If "noPreference" is selected, clear all others
    if (id === 'noPreference') {
      setSelectedCategories(['noPreference']);
    } else {
      // Remove "noPreference" if selecting something else
      setSelectedCategories(prev => {
        const withoutNoPreference = prev.filter(c => c !== 'noPreference');
        return withoutNoPreference.includes(id)
          ? withoutNoPreference.filter(c => c !== id)
          : [...withoutNoPreference, id];
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-500">{t.step} 3 {t.of} 4</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full">
            <div className="h-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] rounded-full" style={{ width: '75%' }} />
          </div>
        </div>

        <h1 className="mb-2">{t.tellUsYourDiet}</h1>
        <p className="text-muted-foreground">
          {t.selectDietCategories}
        </p>
      </div>

      {/* Category List */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <div className="space-y-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`
                w-full relative p-6 rounded-2xl border-2 transition-all
                ${selectedCategories.includes(category.id)
                  ? 'border-[#2ECC71] bg-[#2ECC71]/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              {/* Selected Check */}
              {selectedCategories.includes(category.id) && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#2ECC71] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <div className="flex items-start gap-4">
                <span className="text-5xl">{category.emoji}</span>
                <div className="flex-1 text-left">
                  <div className={`mb-1 ${selectedCategories.includes(category.id) ? 'text-[#2ECC71]' : 'text-gray-900'}`}>
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
      <div className="p-6 border-t border-gray-100">
        <Button
          onClick={() => onCategorySelect(selectedCategories)}
          disabled={selectedCategories.length === 0}
          className="w-full h-14 rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white shadow-lg shadow-[#2ECC71]/30 mb-4"
        >
          {t.next}
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