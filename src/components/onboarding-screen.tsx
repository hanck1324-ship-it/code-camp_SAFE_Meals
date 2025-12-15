import { useState } from 'react';
import { Check, Shell, Beef, Milk, Wheat, Egg, Leaf, Moon, Plus, X, Droplet, Apple, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Language, translations } from '@/lib/translations';
import { LanguageSelector } from './language-selector';
import { Input } from '@/components/ui/input';
import { AllergyCard } from '@/components/common/allergy-card';

interface OnboardingScreenProps {
  onComplete: (allergies: string[], diets: string[]) => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function OnboardingScreen({ onComplete, language, onLanguageChange }: OnboardingScreenProps) {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const t = translations[language];

  const allergyOptions = [
    { id: 'shellfish', label: t.shellfish, emoji: '🦀' },
    { id: 'meat', label: t.meat, emoji: '🥩' },
    { id: 'peanuts', label: t.peanuts, emoji: '🥜' },
    { id: 'grains', label: t.grains || 'Grains', emoji: '🌾' },
    { id: 'soy', label: t.soy, emoji: '🫘' },
    { id: 'fruits', label: t.fruits || 'Fruits', emoji: '🍎' },
    { id: 'dairy', label: t.dairy, emoji: '🥛' },
    { id: 'eggs', label: t.eggs, emoji: '🥚' },
  ] as Array<{ id: string; label: string; icon?: any; emoji?: string }>;

  const dietOptions = [
    { id: 'vegan', label: t.vegan, emoji: '🌱' },
    { id: 'vegetarian', label: t.vegetarian, emoji: '🥗' },
    { id: 'halal', label: t.halal, emoji: '☪️' },
    { id: 'lactoFree', label: t.lactoFree, emoji: '🚫' },
  ] as Array<{ id: string; label: string; icon?: any; emoji?: string }>;

  const toggleAllergy = (id: string) => {
    setSelectedAllergies(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const toggleDiet = (id: string) => {
    setSelectedDiets(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const addCustomAllergy = () => {
    if (customAllergyInput.trim()) {
      setCustomAllergies(prev => [...prev, customAllergyInput.trim()]);
      setCustomAllergyInput('');
      setShowCustomInput(false);
    }
  };

  const removeCustomAllergy = (allergy: string) => {
    setCustomAllergies(prev => prev.filter(a => a !== allergy));
  };

  const handleContinue = () => {
    const allAllergies = [...selectedAllergies, ...customAllergies];
    onComplete(allAllergies, selectedDiets);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      {/* Language Selector */}
      <div className="flex justify-end mb-4">
        <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#2ECC71]/20">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2">{t.welcomeTitle}</h1>
          <p className="text-muted-foreground">
            {t.welcomeDescription}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="mb-4">{t.selectAllergies}</h2>
          <div className="grid grid-cols-2 gap-3">
            {allergyOptions.map((option) => (
              <AllergyCard
                key={option.id}
                icon={option.icon}
                emoji={option.emoji}
                label={option.label}
                selected={selectedAllergies.includes(option.id)}
                onClick={() => toggleAllergy(option.id)}
              />
            ))}
            {showCustomInput && (
              <div className="relative p-4 rounded-2xl border-2 border-[#2ECC71] bg-white flex flex-col gap-2">
                <Input
                  value={customAllergyInput}
                  onChange={(e) => setCustomAllergyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addCustomAllergy();
                    }
                  }}
                  placeholder={t.customAllergyPlaceholder}
                  className="w-full h-10 px-3 border border-gray-200 rounded-lg"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={addCustomAllergy}
                    disabled={!customAllergyInput.trim()}
                    className="flex-1 h-8 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white text-xs"
                  >
                    {t.add}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomAllergyInput('');
                    }}
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                  >
                    {t.back}
                  </Button>
                </div>
              </div>
            )}
            {!showCustomInput && (
              <button
                onClick={() => setShowCustomInput(true)}
                className="relative p-4 rounded-2xl border-2 transition-all border-gray-200 bg-white hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
              >
                <Plus className="w-8 h-8 mb-2 text-gray-400" />
                <div className="text-sm">{t.addCustomAllergy}</div>
              </button>
            )}
          </div>
          {customAllergies.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm mb-2">{t.customAllergies}</h3>
              <div className="flex flex-wrap gap-2">
                {customAllergies.map((allergy) => (
                  <div
                    key={allergy}
                    className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white px-3 py-1.5 rounded-full flex items-center gap-2"
                  >
                    {allergy}
                    <button
                      onClick={() => removeCustomAllergy(allergy)}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="mb-4">{t.dietaryPreferences}</h2>
          <div className="grid grid-cols-2 gap-3">
            {dietOptions.map((option) => (
              <AllergyCard
                key={option.id}
                icon={option.icon}
                emoji={option.emoji}
                label={option.label}
                selected={selectedDiets.includes(option.id)}
                onClick={() => toggleDiet(option.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={handleContinue}
        className="w-full h-14 rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white shadow-lg shadow-[#2ECC71]/30"
        disabled={selectedAllergies.length === 0 && selectedDiets.length === 0 && customAllergies.length === 0}
      >
        {t.continueButton}
      </Button>
    </div>
  );
}