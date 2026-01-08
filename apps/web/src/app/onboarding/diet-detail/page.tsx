'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DietDetailScreen } from '@/components/onboarding/diet/ category/diet-detail-screen';
import { Suspense, useState, useEffect } from 'react';
import { useAppStore } from '@/commons/stores/useAppStore';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { RequireAuth } from '@/components/auth/require-auth';
import { getSupabaseClient } from '@/lib/supabase';

// UI diet ID를 DB diet_code로 변환하는 매핑
const DIET_ID_TO_CODE: Record<string, string> = {
  strictVegan: 'vegan',
  lactoVegetarian: 'vegetarian',
  ovoVegetarian: 'vegetarian',
  pescoVegetarian: 'vegetarian',
  flexitarian: 'vegetarian',
  halal: 'halal',
  kosher: 'kosher',
  buddhistVegetarian: 'vegetarian',
  porkFree: 'halal', // 돼지고기 회피는 할랄과 유사
  alcoholFree: 'halal', // 알코올 회피도 할랄과 유사
  garlicOnionFree: 'vegetarian', // 오신채 회피는 채식과 유사
};

// DB diet_code를 UI diet ID로 변환하는 매핑 (역변환)
const DIET_CODE_TO_ID: Record<string, string> = {
  vegan: 'strictVegan',
  vegetarian: 'lactoVegetarian',
  halal: 'halal',
  kosher: 'kosher',
  gluten_free: 'porkFree',
  lactose_free: 'porkFree',
};

function DietDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('mode') === 'edit';
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const { completeOnboarding } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);
  const [initialDiets, setInitialDiets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categoriesParam = searchParams.get('categories');
  const categories = categoriesParam ? categoriesParam.split(',') : [];

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
            // DB diet_code를 UI diet ID로 변환
            const uiDiets = diets
              .map((d) => DIET_CODE_TO_ID[d.diet_code] || d.diet_code)
              .filter(Boolean);
            setInitialDiets(uiDiets);
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

  const handleComplete = async (diets: string[]) => {
    // 빈 배열이면 저장하지 않고 완료 (기존 데이터 유지)
    if (diets.length === 0) {
      if (isEditMode) {
        router.replace('/profile/settings');
      } else {
        completeOnboarding();
        router.replace('/dashboard');
      }
      return;
    }

    setIsSaving(true);
    try {
      const supabase = getSupabaseClient();

      // 현재 사용자 확인
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('로그인이 필요합니다.');
        if (isEditMode) {
          router.replace('/profile/settings');
        } else {
          completeOnboarding();
          router.replace('/dashboard');
        }
        return;
      }

      // UI diet ID를 DB diet_code로 변환 (중복 제거)
      const dietCodes = [
        ...new Set(
          diets
            .map((dietId) => DIET_ID_TO_CODE[dietId] || dietId)
            .filter(Boolean)
        ),
      ];

      console.log('UI diets:', diets);
      console.log('변환된 diet codes:', dietCodes);

      // 기존 식단 데이터 삭제
      await supabase.from('user_diets').delete().eq('user_id', user.id);

      // 새 식단 데이터 삽입
      if (dietCodes.length > 0) {
        const dietData = dietCodes.map((diet_code) => ({
          user_id: user.id,
          diet_code,
        }));

        const { error: insertError } = await supabase
          .from('user_diets')
          .insert(dietData);

        if (insertError) {
          console.error('식단 저장 에러:', insertError);
        } else {
          console.log('식단 저장 성공:', dietCodes);
        }
      }
    } catch (err) {
      console.error('식단 저장 중 에러:', err);
    } finally {
      setIsSaving(false);
      if (isEditMode) {
        router.replace('/profile/settings');
      } else {
        // 온보딩 완료는 Safety Card 설정 후에 처리
        // Safety Card 설정 페이지로 이동
        router.replace('/onboarding/safety-card');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#2ECC71]" />
      </div>
    );
  }

  return (
    <DietDetailScreen
      categories={categories}
      onComplete={handleComplete}
      onBack={handleBack}
      initialSelectedDiets={initialDiets}
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
