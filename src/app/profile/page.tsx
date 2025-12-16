'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/commons/stores/useAppStore';
import { ProfileScreen } from '@/components/profile';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAppStore();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!user) {
      router.replace('/auth/login?redirect=/profile');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  // Temporary sample data – in real app fetch from API / DB
  const userProfile = {
    allergies: [],
    diets: [],
  };

  const handleNavigate = (screen: 'safetyProfileEdit' | 'notifications' | 'languageSettings' | 'help' | 'safetyCard') => {
    switch (screen) {
      case 'safetyProfileEdit':
        router.push('/profile/settings');
        break;
      case 'notifications':
        router.push('/profile/notifications');
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

  const handleLogout = () => {
    logout();
    // 로그아웃 후 홈 화면으로 리다이렉트 (redirect 파라미터 없이)
    router.replace('/auth/login');
  };

  return (
    <ProfileScreen
      userProfile={userProfile}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    />
  );
}
