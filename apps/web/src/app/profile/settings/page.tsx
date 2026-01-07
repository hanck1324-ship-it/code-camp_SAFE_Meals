'use client';

import { SafetyProfileEditScreen } from '@/features/profile/components/settings/safety-profile-edit-screen';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { RequireAuth } from '@/components/auth/require-auth';
import { useSafetyCardAllergiesDietsLoad } from '@/features/profile/components/settings/hooks/index.submit-allergies-diets.hook';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  // Supabase에서 알레르기/식단 데이터 로드
  const { loadAllergiesAndDiets, isLoading, allergies, diets } =
    useSafetyCardAllergiesDietsLoad();

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    loadAllergiesAndDiets();
  }, [loadAllergiesAndDiets]);

  // Supabase 데이터를 userProfile 형식으로 변환
  const userProfile = {
    allergies: allergies.map((a) => a.allergy_code),
    diets: diets.map((d) => d.diet_code),
  };

  // 로딩 중일 때 로딩 화면 표시
  if (isLoading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-500">{t.loading}</p>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <SafetyProfileEditScreen
        userProfile={userProfile}
        onBack={() => router.back()}
        onEditAllergies={() => router.push('/onboarding/allergy?mode=edit')}
        onEditDiets={() => router.push('/onboarding/diet?mode=edit')}
        onEditSafetyCardPin={() =>
          router.push('/onboarding/safety-card?mode=edit')
        }
      />
    </RequireAuth>
  );
}
