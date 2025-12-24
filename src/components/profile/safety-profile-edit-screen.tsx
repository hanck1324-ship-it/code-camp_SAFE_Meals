import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Language, translations } from '../../lib/translations';

interface SafetyProfileEditScreenProps {
  userProfile: {
    allergies: string[];
    diets: string[];
  };
  onBack: () => void;
  onEditAllergies: () => void;
  onEditDiets: () => void;
  language: Language;
}

export function SafetyProfileEditScreen({
  userProfile,
  onBack,
  onEditAllergies,
  onEditDiets,
  language,
}: SafetyProfileEditScreenProps) {
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="px-6 pt-8 pb-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2>{t.safetyProfile}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Allergies Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="mb-1">{t.allergies}</h3>
              <p className="text-sm text-muted-foreground">
                {userProfile.allergies.length} {t.selected || 'selected'}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#E74C3C]/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-[#E74C3C]" />
            </div>
          </div>

          {/* Allergy Badges */}
          {userProfile.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {userProfile.allergies.map((allergy, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-[#E74C3C]/10 text-[#E74C3C] rounded-full text-sm border border-[#E74C3C]/20"
                >
                  {allergy}
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-sm text-muted-foreground">{t.noAllergiesAdded || 'No allergies added yet'}</p>
            </div>
          )}

          <Button
            onClick={onEditAllergies}
            variant="outline"
            className="w-full h-12 rounded-2xl border-2 border-gray-200 hover:border-[#E74C3C] hover:bg-[#E74C3C]/5"
          >
            {t.editAllergies || 'Edit Allergies'}
            <ChevronRight className="w-5 h-5 ml-auto" />
          </Button>
        </div>

        {/* Dietary Preferences Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="mb-1">{t.dietaryPreferences || 'Dietary Preferences'}</h3>
              <p className="text-sm text-muted-foreground">
                {userProfile.diets.length} {t.selected || 'selected'}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#2ECC71]/10 rounded-full flex items-center justify-center">
              <span className="text-2xl">🥗</span>
            </div>
          </div>

          {/* Diet Badges */}
          {userProfile.diets.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {userProfile.diets.map((diet, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-[#2ECC71]/10 text-[#2ECC71] rounded-full text-sm border border-[#2ECC71]/20"
                >
                  {diet}
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-sm text-muted-foreground">{t.noDietsAdded || 'No dietary preferences added yet'}</p>
            </div>
          )}

          <Button
            onClick={onEditDiets}
            variant="outline"
            className="w-full h-12 rounded-2xl border-2 border-gray-200 hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
          >
            {t.editDietaryPreferences || 'Edit Dietary Preferences'}
            <ChevronRight className="w-5 h-5 ml-auto" />
          </Button>
        </div>

        {/* Info Card */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <div className="flex gap-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">i</span>
            </div>
            <div>
              <p className="text-sm text-blue-900">
                {t.safetyProfileInfo || 'Your safety profile is used to scan menus and identify safe dishes for you. Keep it updated for the best experience.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
