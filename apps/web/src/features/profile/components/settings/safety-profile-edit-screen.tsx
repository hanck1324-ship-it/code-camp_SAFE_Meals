import { ChevronLeft, ChevronRight, AlertCircle, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface SafetyProfileEditScreenProps {
  userProfile: {
    allergies: string[];
    diets: string[];
  };
  onBack: () => void;
  onEditAllergies: () => void;
  onEditDiets: () => void;
  onEditSafetyCardPin: () => void;
}

export function SafetyProfileEditScreen({
  userProfile,
  onBack,
  onEditAllergies,
  onEditDiets,
  onEditSafetyCardPin,
}: SafetyProfileEditScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="border-b border-gray-200 bg-white px-6 pb-4 pt-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="-ml-2 flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2>{t.safetyProfile}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 px-6 py-6">
        {/* Allergies Section */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="mb-1">{t.allergies}</h3>
              <p className="text-sm text-muted-foreground">
                {userProfile.allergies.length} {t.selected || 'selected'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E74C3C]/10">
              <AlertCircle className="h-6 w-6 text-[#E74C3C]" />
            </div>
          </div>

          {/* Allergy Badges */}
          {userProfile.allergies.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {userProfile.allergies.map((allergy, index) => (
                <div
                  key={index}
                  className="rounded-full border border-[#E74C3C]/20 bg-[#E74C3C]/10 px-3 py-1.5 text-sm text-[#E74C3C]"
                >
                  {allergy}
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-4 rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t.noAllergiesAdded || 'No allergies added yet'}
              </p>
            </div>
          )}

          <Button
            onClick={onEditAllergies}
            variant="outline"
            className="h-12 w-full rounded-2xl border-2 border-gray-200 hover:border-[#E74C3C] hover:bg-[#E74C3C]/5"
          >
            {t.editAllergies || 'Edit Allergies'}
            <ChevronRight className="ml-auto h-5 w-5" />
          </Button>
        </div>

        {/* Dietary Preferences Section */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="mb-1">
                {t.dietaryPreferences || 'Dietary Preferences'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {userProfile.diets.length} {t.selected || 'selected'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2ECC71]/10">
              <span className="text-2xl">🥗</span>
            </div>
          </div>

          {/* Diet Badges */}
          {userProfile.diets.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {userProfile.diets.map((diet, index) => (
                <div
                  key={index}
                  className="rounded-full border border-[#2ECC71]/20 bg-[#2ECC71]/10 px-3 py-1.5 text-sm text-[#2ECC71]"
                >
                  {diet}
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-4 rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t.noDietsAdded || 'No dietary preferences added yet'}
              </p>
            </div>
          )}

          <Button
            onClick={onEditDiets}
            variant="outline"
            className="h-12 w-full rounded-2xl border-2 border-gray-200 hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
          >
            {t.editDietaryPreferences || 'Edit Dietary Preferences'}
            <ChevronRight className="ml-auto h-5 w-5" />
          </Button>
        </div>

        {/* Safety Card PIN Section */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="mb-1">{t.safetyCardPin || 'Safety Card PIN'}</h3>
              <p className="text-sm text-muted-foreground">
                {t.safetyCardPinDesc || 'Set or update your Safety Card PIN'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2ECC71]/10">
              <Lock className="h-6 w-6 text-[#2ECC71]" />
            </div>
          </div>

          <Button
            onClick={onEditSafetyCardPin}
            variant="outline"
            className="h-12 w-full rounded-2xl border-2 border-gray-200 hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
          >
            {t.editSafetyCardPin || 'Set PIN'}
            <ChevronRight className="ml-auto h-5 w-5" />
          </Button>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
              <span className="text-xs text-white">i</span>
            </div>
            <div>
              <p className="text-sm text-blue-900">
                {t.safetyProfileInfo ||
                  'Your safety profile is used to scan menus and identify safe dishes for you. Keep it updated for the best experience.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
