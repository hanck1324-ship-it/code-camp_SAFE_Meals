'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AllergyDetailScreen } from '@/components/onboarding/allergy-detail-screen';
import { useState, Suspense } from 'react';
import { Language } from '@/lib/translations';

function AllergyDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState<Language>('en');

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
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <AllergyDetailContent />
    </Suspense>
  );
}

