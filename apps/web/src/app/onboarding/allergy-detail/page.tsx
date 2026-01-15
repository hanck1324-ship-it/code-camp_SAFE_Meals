'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AllergyDetailScreen } from '@/components/onboarding/allergy/allergy-detail-screen';
import { Suspense, useState, useEffect } from 'react';
import { RequireAuth } from '@/components/auth/require-auth';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { getSupabaseClient } from '@/lib/supabase';

// UI allergy ID를 DB allergy_code로 변환하는 매핑
const ALLERGY_ID_TO_CODE: Record<string, string> = {
  // Seafood
  shrimp: 'shrimp',
  crab: 'crab',
  lobster: 'shellfish', // DB에 없음 → shellfish로 매핑
  squid: 'squid',
  clams: 'shellfish',
  fish: 'mackerel', // 일반 생선 → 고등어로 매핑
  // Nuts
  peanut: 'peanuts',
  almond: 'pine_nuts', // DB에 없음 → pine_nuts로 매핑
  walnut: 'walnuts',
  cashew: 'pine_nuts', // DB에 없음 → pine_nuts로 매핑
  pistachio: 'pine_nuts', // DB에 없음 → pine_nuts로 매핑
  // Grains
  wheat: 'wheat',
  barley: 'buckwheat', // DB에 없음 → buckwheat로 매핑
  oats: 'buckwheat', // DB에 없음 → buckwheat로 매핑
  rice: 'wheat', // DB에 없음 → wheat로 매핑
  corn: 'wheat', // DB에 없음 → wheat로 매핑
  // Meats
  beef: 'beef',
  pork: 'pork',
  chicken: 'chicken',
  lamb: 'lamb',
  // Dairy & Eggs
  milk: 'milk',
  cheese: 'milk', // DB에 없음 → milk로 매핑
  butter: 'milk', // DB에 없음 → milk로 매핑
  yogurt: 'milk', // DB에 없음 → milk로 매핑
  egg: 'eggs',
  // Fruits
  strawberry: 'peaches', // DB에 없음 → peaches로 매핑
  kiwi: 'peaches', // DB에 없음 → peaches로 매핑
  mango: 'peaches', // DB에 없음 → peaches로 매핑
  peach: 'peaches',
  // Additives
  sulfites: 'sulfites',
  msg: 'sulfites', // DB에 없음 → sulfites로 매핑
  foodDyes: 'sulfites', // DB에 없음 → sulfites로 매핑
};

// DB allergy_code를 UI ID로 역변환
const ALLERGY_CODE_TO_ID: Record<string, string> = {
  shrimp: 'shrimp',
  crab: 'crab',
  shellfish: 'clams',
  squid: 'squid',
  mackerel: 'fish',
  peanuts: 'peanut',
  walnuts: 'walnut',
  pine_nuts: 'almond',
  wheat: 'wheat',
  buckwheat: 'barley',
  beef: 'beef',
  pork: 'pork',
  chicken: 'chicken',
  lamb: 'lamb',
  milk: 'milk',
  eggs: 'egg',
  peaches: 'peach',
  tomatoes: 'peach',
  sulfites: 'sulfites',
  soybeans: 'peanut',
};

function AllergyDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('mode') === 'edit';
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [isSaving, setIsSaving] = useState(false);
  const [initialAllergies, setInitialAllergies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categoriesParam = searchParams.get('categories');
  const categories = categoriesParam ? categoriesParam.split(',') : [];

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
            // DB allergy_code를 UI ID로 변환
            const uiAllergies = allergies
              .map((a) => ALLERGY_CODE_TO_ID[a.allergy_code] || a.allergy_code)
              .filter(Boolean);
            setInitialAllergies(uiAllergies);
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

  const handleAllergySelect = async (allergies: string[]) => {
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
        return;
      }

      // UI allergy ID를 DB allergy_code로 변환 (중복 제거)
      const allergyCodes = [
        ...new Set(
          allergies
            .map((allergyId) => ALLERGY_ID_TO_CODE[allergyId] || allergyId)
            .filter(Boolean)
        ),
      ];

      console.log('UI allergies:', allergies);
      console.log('변환된 allergy codes:', allergyCodes);

      // 기존 알레르기 데이터 삭제 (선택 없음 포함)
      await supabase.from('user_allergies').delete().eq('user_id', user.id);

      // 새 알레르기 데이터 삽입
      if (allergyCodes.length > 0) {
        const allergyData = allergyCodes.map((allergy_code) => ({
          user_id: user.id,
          allergy_code,
          severity: 'moderate',
        }));

        const { error: insertError } = await supabase
          .from('user_allergies')
          .insert(allergyData);

        if (insertError) {
          console.error('알레르기 저장 에러:', insertError);
        } else {
          console.log('알레르기 저장 성공:', allergies);
        }
      }
    } catch (err) {
      console.error('알레르기 저장 중 에러:', err);
    } finally {
      setIsSaving(false);
      if (isEditMode) {
        // refresh 파라미터로 설정 페이지에서 데이터 재로드 트리거
        router.replace(`/profile/settings?refresh=${Date.now()}`);
      } else {
        router.push('/onboarding/diet');
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
    <AllergyDetailScreen
      categories={categories}
      onAllergySelect={handleAllergySelect}
      onBack={handleBack}
      initialSelectedAllergies={initialAllergies}
    />
  );
}

export default function AllergyDetailPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-white">
            Loading...
          </div>
        }
      >
        <AllergyDetailContent />
      </Suspense>
    </RequireAuth>
  );
}
