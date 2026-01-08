'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/commons/stores/useAppStore';
import { ProfileScreen } from '@/features/profile/components/settings/profile-screen';
import { RequireAuth } from '@/components/auth/require-auth';
import { useSafetyCardAllergiesDietsLoad } from '@/features/profile/components/safety-card/hooks/index.allergies-diets-load.hook';

export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAppStore();

  // 실제 사용자 알레르기 및 식단 데이터 로드
  const { allergies, diets, isLoading, error } = useSafetyCardAllergiesDietsLoad();

  // 화면에 표시할 프로필 데이터 구성
  const userProfile = {
    allergies: allergies.map(a => a.allergy_code),
    diets: diets.map(d => d.diet_code),
  };

  const handleNavigate = (
    screen:
      | 'safetyProfileEdit'
      | 'payment'
      | 'languageSettings'
      | 'help'
      | 'safetyCard'
  ) => {
    switch (screen) {
      case 'safetyProfileEdit':
        router.push('/profile/settings');
        break;
      case 'payment':
        router.push('/profile/payment');
        break;
      case 'languageSettings':
        router.push('/profile/language');
        break;
      case 'help':
        router.push('/profile/help');
        break;
      case 'safetyCard':
        router.push('/profile/safety-card');
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    await logout();
    // 로그아웃 후 홈 화면으로 리다이렉트 (redirect 파라미터 없이)
    router.replace('/auth/login');
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#2ECC71] border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">프로필 로드 중...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  // 에러 발생 시
  if (error) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="text-center">
            <p className="mb-4 text-destructive">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#2ECC71] hover:underline"
            >
              다시 시도
            </button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <ProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} />
    </RequireAuth>
  );
}
