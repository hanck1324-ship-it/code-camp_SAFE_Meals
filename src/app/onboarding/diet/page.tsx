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
    // Store selected categories for next step
    console.log('Selected Diet Categories:', categories);
    
    // If "noPreference" or no categories selected, skip to dashboard
    if (categories.includes('noPreference') || categories.length === 0) {
      completeOnboarding();
      router.replace('/dashboard');
    } else {
      // Navigate to detail screen with categories
      const params = new URLSearchParams({ categories: categories.join(',') });
      router.push(`/onboarding/diet-detail?${params}`);
    }
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

