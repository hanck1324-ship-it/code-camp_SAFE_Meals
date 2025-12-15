'use client';

import { useRouter } from 'next/navigation';
import { AllergyCategoryScreen } from '@/components/onboarding/allergy-category-screen';
import { useState } from 'react';
import { Language } from '@/lib/translations';

export default function AllergyOnboardingPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('en');

  const handleCategorySelect = (categories: string[]) => {
    // In a real app, you'd persist these categories
    console.log('Selected Allergy Categories:', categories);
    router.push('/onboarding/diet');
  };

  const handleBack = () => {
    router.back();
  };

  const handleEtcClick = () => {
    // Navigate to custom allergy search if needed
    console.log('Other clicked - custom allergy search');
    // router.push('/onboarding/custom-allergy-search');
  };

  return (
    <AllergyCategoryScreen
      onCategorySelect={handleCategorySelect}
      onBack={handleBack}
      onEtcClick={handleEtcClick}
      language={language}
      onLanguageChange={setLanguage}
    />
  );
}

