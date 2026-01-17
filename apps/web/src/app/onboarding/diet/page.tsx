'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { RequireAuth } from '@/components/auth/require-auth';
import { DietCategoryScreen } from '@/components/onboarding/diet/category/diet-category-screen';
import { getSupabaseClient } from '@/lib/supabase';

// DB diet_code를 UI 카테고리로 매핑
const DIET_CODE_TO_CATEGORY: Record<string, string> = {
  vegan: 'plantBased',
  vegetarian: 'plantBased',
  lacto_vegetarian: 'plantBased',
  ovo_vegetarian: 'plantBased',
  pesco_vegetarian: 'plantBased',
  flexitarian: 'plantBased',
  halal: 'religious',
  kosher: 'religious',
  buddhist_vegetarian: 'religious',
  gluten_free: 'avoidance',
  lactose_free: 'avoidance',
  low_sodium: 'avoidance',
  diabetic: 'avoidance',
  pork_free: 'avoidance',
  alcohol_free: 'avoidance',
  garlic_onion_free: 'avoidance',
};

export default function DietOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('mode') === 'edit';
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
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_diets').delete().eq('user_id', user.id);
          console.log('식단 데이터 삭제 완료 (선택 없음)');
        }
      } catch (err) {
        console.error('식단 삭제 중 에러:', err);
      }

      if (isEditMode) {
        // refresh 파라미터로 설정 페이지에서 데이터 재로드 트리거
        router.replace(`/profile/settings?refresh=${Date.now()}`);
        return;
      }
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

      if (isEditMode) {
        // refresh 파라미터로 설정 페이지에서 데이터 재로드 트리거
        router.replace(`/profile/settings?refresh=${Date.now()}`);
        return;
      }

      router.replace('/onboarding/safety-card');
    } else {
      // Navigate to detail screen with categories
      const params = new URLSearchParams({ categories: categories.join(',') });
      if (isEditMode) {
        params.set('mode', 'edit');
      }
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
        initialSelectedCategories={initialCategories}
      />
    </RequireAuth>
  );
}
