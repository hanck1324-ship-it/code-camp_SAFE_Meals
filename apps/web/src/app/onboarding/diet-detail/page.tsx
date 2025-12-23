'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DietDetailScreen } from '@/components/onboarding/diet/ category/diet-detail-screen';
import { Suspense } from 'react';
import { useAppStore } from '@/commons/stores/useAppStore';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { RequireAuth } from '@/components/auth/require-auth';

function DietDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { completeOnboarding } = useAppStore();

  const categoriesParam = searchParams.get('categories');
  const categories = categoriesParam ? categoriesParam.split(',') : [];

  const handleComplete = (diets: string[]) => {
    // In a real app, you'd persist these diets
    console.log('Selected Diets:', diets);
    completeOnboarding();
    router.replace('/dashboard');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <DietDetailScreen
      categories={categories}
      onComplete={handleComplete}
      onBack={handleBack}
      language={language}
      onLanguageChange={setLanguage}
    />
  );
}

export default function DietDetailPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-white">
            Loading...
          </div>
        }
      >
        <DietDetailContent />
      </Suspense>
    </RequireAuth>
  );
}
