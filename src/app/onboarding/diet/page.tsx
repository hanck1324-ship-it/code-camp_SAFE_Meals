'use client';

import { useRouter } from 'next/navigation';
import { DietCategoryScreen } from '@/components/onboarding/diet-category-screen';
import { useState } from 'react';
import { Language } from '@/lib/translations';
import { useAppStore } from '@/commons/stores/useAppStore';

export default function DietOnboardingPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('en');
  const { completeOnboarding } = useAppStore();

  const handleCategorySelect = (categories: string[]) => {
    // In a real app, you'd persist these categories
    console.log('Selected Diet Categories:', categories);
    completeOnboarding();
    router.replace('/dashboard');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <DietCategoryScreen
      onCategorySelect={handleCategorySelect}
      onBack={handleBack}
      language={language}
      onLanguageChange={setLanguage}
    />
  );
}

