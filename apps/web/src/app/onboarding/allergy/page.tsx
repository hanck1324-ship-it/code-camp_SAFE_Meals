'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { RequireAuth } from '@/components/auth/require-auth';
import { AllergyCategoryScreen } from '@/components/onboarding/allergy/allergy-category-screen';
import { getSupabaseClient } from '@/lib/supabase';

// 알러지 코드를 카테고리로 매핑
const ALLERGY_TO_CATEGORY: Record<string, string> = {
  shrimp: 'seafood',
  crab: 'seafood',
  lobster: 'seafood',
  squid: 'seafood',
  clams: 'seafood',
  fish: 'seafood',
  mackerel: 'seafood',
  shellfish: 'seafood',
  peanut: 'nuts',
  peanuts: 'nuts',
  almond: 'nuts',
  walnut: 'nuts',
  walnuts: 'nuts',
  cashew: 'nuts',
  pistachio: 'nuts',
  pine_nuts: 'nuts',
  wheat: 'grainsWheat',
  buckwheat: 'grainsWheat',
  barley: 'grainsWheat',
  oats: 'grainsWheat',
  rice: 'grainsWheat',
  corn: 'grainsWheat',
  beef: 'meats',
  pork: 'meats',
  chicken: 'meats',
  lamb: 'meats',
  milk: 'dairyEggs',
  cheese: 'dairyEggs',
  butter: 'dairyEggs',
  yogurt: 'dairyEggs',
  egg: 'dairyEggs',
  eggs: 'dairyEggs',
  strawberry: 'fruits',
  kiwi: 'fruits',
  mango: 'fruits',
  peach: 'fruits',
  peaches: 'fruits',
  tomatoes: 'fruits',
  sulfites: 'additives',
  msg: 'additives',
  foodDyes: 'additives',
};

export default function AllergyOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('mode') === 'edit';
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [initialCategories, setInitialCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 기존 알러지 데이터 로드
  useEffect(() => {
    const loadExistingAllergies = async () => {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: allergies } = await supabase
            .from('user_allergies')
            .select('allergy_code')
            .eq('user_id', user.id);

          if (allergies && allergies.length > 0) {
            // 알러지 코드를 카테고리로 변환 (중복 제거)
            const categories = [
              ...new Set(
                allergies
                  .map((a) => ALLERGY_TO_CATEGORY[a.allergy_code])
                  .filter(Boolean)
              ),
            ];
            setInitialCategories(categories);
          }
        }
      } catch (err) {
        console.error('기존 알러지 로드 에러:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingAllergies();
  }, []);

  const handleCategorySelect = async (categories: string[]) => {
    if (categories.length > 0) {
      const params = new URLSearchParams({ categories: categories.join(',') });
      if (isEditMode) {
        params.set('mode', 'edit');
      }
      router.push(`/onboarding/allergy-detail?${params}`);
      return;
    }

    // 선택 없음 → 기존 알레르기 데이터 삭제
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_allergies').delete().eq('user_id', user.id);
        console.log('알레르기 데이터 삭제 완료 (선택 없음)');
      }
    } catch (err) {
      console.error('알레르기 삭제 중 에러:', err);
    }

    if (isEditMode) {
      // refresh 파라미터로 설정 페이지에서 데이터 재로드 트리거
      router.replace(`/profile/settings?refresh=${Date.now()}`);
      return;
    }

    // Skip to diet if no categories selected
    router.push('/onboarding/diet');
  };

  const handleBack = () => {
    router.back();
  };

  const handleEtcClick = () => {
    // Navigate to custom allergy search if needed
    console.log('Other clicked - custom allergy search');
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
      <AllergyCategoryScreen
        onCategorySelect={handleCategorySelect}
        onBack={handleBack}
        onEtcClick={handleEtcClick}
        initialSelectedCategories={initialCategories}
      />
    </RequireAuth>
  );
}
