'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AllergyDetailScreen } from '@/components/onboarding/allergy/allergy-detail-screen';
import { Suspense } from 'react';
import { RequireAuth } from '@/components/auth/require-auth';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';

function AllergyDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const categoriesParam = searchParams.get('categories');
  const categories = categoriesParam ? categoriesParam.split(',') : [];

  const handleAllergySelect = (allergies: string[]) => {
    // In a real app, you'd persist these allergies
    console.log('Selected Allergies:', allergies);
    router.push('/onboarding/diet');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <AllergyDetailScreen
      categories={categories}
      onAllergySelect={handleAllergySelect}
      onBack={handleBack}
      language={language}
      onLanguageChange={setLanguage}
    />
  );
}

export default function AllergyDetailPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
        <AllergyDetailContent />
      </Suspense>
    </RequireAuth>
  );
}

