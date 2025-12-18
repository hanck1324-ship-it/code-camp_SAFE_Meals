'use client';

import { useRouter } from 'next/navigation';
import { AllergyCategoryScreen } from '@/components/onboarding/allergy/allergy-category-screen';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { RequireAuth } from '@/components/auth/require-auth';

export default function AllergyOnboardingPage() {
  const router = useRouter();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

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
    <RequireAuth>
      <AllergyCategoryScreen
        onCategorySelect={handleCategorySelect}
        onBack={handleBack}
        onEtcClick={handleEtcClick}
        language={language}
        onLanguageChange={setLanguage}
      />
    </RequireAuth>
  );
}
