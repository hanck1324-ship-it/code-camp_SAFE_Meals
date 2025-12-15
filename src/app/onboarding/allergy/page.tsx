'use client';

import { useRouter } from 'next/navigation';
import { AllergyCategoryScreen } from '@/components/onboarding/allergy-category-screen';
import { useState } from 'react';
import { Language } from '@/lib/translations';
import { useAppStore } from '@/commons/stores/useAppStore';

export default function AllergyOnboardingPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('en');

  const handleCategorySelect = (categories: string[]) => {
    // Store selected categories for next step
    if (categories.length > 0) {
      // Navigate to detail screen with categories
      const params = new URLSearchParams({ categories: categories.join(',') });
      router.push(`/onboarding/allergy-detail?${params}`);
    } else {
      // Skip to diet if no categories selected
      router.push('/onboarding/diet');
    }
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

