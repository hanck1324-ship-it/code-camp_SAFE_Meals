'use client';

import { SafetyProfileEditScreen } from '@/features/profile/components/settings/safety-profile-edit-screen';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { RequireAuth } from '@/components/auth/require-auth';

export default function SettingsPage() {
  const router = useRouter();
  const { language } = useTranslation();

  // Temporary sample data – in real app fetch from API / DB
  const userProfile = {
    allergies: [],
    diets: [],
  };

  return (
    <RequireAuth>
      <SafetyProfileEditScreen
        userProfile={userProfile}
        onBack={() => router.back()}
        onEditAllergies={() => router.push('/onboarding/allergy')}
        onEditDiets={() => router.push('/onboarding/diet')}
        language={language}
      />
    </RequireAuth>
  );
}
