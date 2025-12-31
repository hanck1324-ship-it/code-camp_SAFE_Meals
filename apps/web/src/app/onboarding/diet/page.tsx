'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DietCategoryScreen } from '@/components/onboarding/diet/ category/diet-category-screen';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { RequireAuth } from '@/components/auth/require-auth';
import { getSupabaseClient } from '@/lib/supabase';

// DB diet_code를 UI 카테고리로 매핑
const DIET_CODE_TO_CATEGORY: Record<string, string> = {
  vegan: 'plantBased',
  vegetarian: 'plantBased',
  halal: 'religious',
  kosher: 'religious',
  gluten_free: 'avoidance',
  lactose_free: 'avoidance',
  low_sodium: 'avoidance',
  diabetic: 'avoidance',
};

export default function DietOnboardingPage() {
  const router = useRouter();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [initialCategories, setInitialCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 기존 식단 데이터 로드
  useEffect(() => {
    const loadExistingDiets = async () => {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: diets } = await supabase
            .from('user_diets')
            .select('diet_code')
            .eq('user_id', user.id);

          if (diets && diets.length > 0) {
            // diet_code를 카테고리로 변환 (중복 제거)
            const categories = [
              ...new Set(
                diets
                  .map((d) => DIET_CODE_TO_CATEGORY[d.diet_code])
                  .filter(Boolean)
              ),
            ];
            setInitialCategories(categories);
          }
        }
      } catch (err) {
        console.error('기존 식단 로드 에러:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingDiets();
  }, []);

  const handleCategorySelect = async (categories: string[]) => {
    // Store selected categories for next step
    console.log('Selected Diet Categories:', categories);

    // 아무것도 선택하지 않으면 기존 데이터 유지하고 Safety Card로
    if (categories.length === 0) {
      router.replace('/onboarding/safety-card');
      return;
    }

    // "noPreference"를 명시적으로 선택한 경우만 기존 데이터 삭제
    if (categories.includes('noPreference')) {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_diets').delete().eq('user_id', user.id);
          console.log('식단 데이터 삭제 완료 (선호 없음 선택)');
        }
      } catch (err) {
        console.error('식단 삭제 중 에러:', err);
      }

      router.replace('/onboarding/safety-card');
    } else {
      // Navigate to detail screen with categories
      const params = new URLSearchParams({ categories: categories.join(',') });
      router.push(`/onboarding/diet-detail?${params}`);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#2ECC71]" />
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <DietCategoryScreen
        onCategorySelect={handleCategorySelect}
        onBack={handleBack}
        language={language}
        onLanguageChange={setLanguage}
        initialSelectedCategories={initialCategories}
      />
    </RequireAuth>
  );
}
