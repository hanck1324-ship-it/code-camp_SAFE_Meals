'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DietDetailScreen } from '@/components/onboarding/diet/diet-detail-screen';
import { useState, Suspense } from 'react';
import { Language } from '@/lib/translations';
import { useAppStore } from '@/commons/stores/useAppStore';

function DietDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState<Language>('en');
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
    혓
  );
}

export default function DietDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <DietDetailContent />
    </Suspense>
  );
}

