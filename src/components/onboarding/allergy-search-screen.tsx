import { useState } from 'react';
import { ChevronLeft, Search, X, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Language, translations } from '../../lib/translations';

interface AllergySearchScreenProps {
  onComplete: (allergies: string[]) => void;
  onBack: () => void;
  language: Language;
}

export function AllergySearchScreen({ onComplete, onBack, language }: AllergySearchScreenProps) {
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const t = translations[language];

  const handleAddCustom = () => {
    if (customInput.trim()) {
      const newCustom = customInput.trim();
      if (!customAllergies.includes(newCustom)) {
        setCustomAllergies(prev => [...prev, newCustom]);
      }
      setCustomInput('');
    }
  };

  const handleRemoveCustom = (custom: string) => {
    setCustomAllergies(prev => prev.filter(c => c !== custom));
  };

  const handleComplete = () => {
    onComplete(customAllergies);
  };

  return (
    <div className="size-full bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-gray-900">{t.other} - {t.addCustomAllergy}</h1>
            <p className="text-sm text-gray-500">
              {customAllergies.length} {t.selected}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Custom Allergy Input */}
        <div className="mb-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="size-5 text-blue-600" />
            <p className="text-blue-900">{t.addCustomAllergy}</p>
          </div>
          <p className="text-sm text-blue-700 mb-4">
            {t.customAllergyPlaceholder}
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={t.customAllergyName}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
              className="flex-1"
            />
            <Button
              onClick={handleAddCustom}
              disabled={!customInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
            >
              {t.add}
            </Button>
          </div>
        </div>

        {/* Custom Allergies List */}
        {customAllergies.length > 0 ? (
          <div>
            <p className="text-sm text-gray-500 mb-3">{t.selected} {t.customAllergies}</p>
            <div className="space-y-2">
              {customAllergies.map(custom => (
                <div
                  key={custom}
                  className="p-4 rounded-xl border-2 border-red-500 bg-red-50 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-red-900">{custom}</span>
                    <div className="flex items-center gap-2">
                      <div className="size-5 rounded-full bg-red-500 flex items-center justify-center">
                        <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <button
                        onClick={() => handleRemoveCustom(custom)}
                        className="p-1 hover:bg-red-200 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="size-4 text-red-700" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="size-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="size-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">{t.noResultsFound}</p>
            <p className="text-sm text-gray-400">{t.enterAllergy}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100">
        <Button
          onClick={handleComplete}
          disabled={customAllergies.length === 0}
          className="w-full bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {t.next} ({customAllergies.length})
        </Button>
      </div>
    </div>
  );
}