'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/commons/stores/useAppStore';
import { ProfileScreen } from '@/components/profile-screen';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, language, setLanguage } = useAppStore();

  // Redirect unauthenticated users to login
  if (!user) {
    router.replace('/auth/login?redirect=/profile');
    return null;
  }

  // Temporary sample data – in real app fetch from API / DB
  const userProfile = {
    allergies: ['egg'],
    diets: ['garlicOnionFree'],
  };

  const handleNavigate = (screen: 'safetyProfileEdit' | 'notifications' | 'languageSettings' | 'help' | 'safetyCard') => {
    switch (screen) {
      case 'safetyProfileEdit':
        router.push('/profile/settings');
        break;
      case 'notifications':
        router.push('/settings/notifications');
        break;
      case 'languageSettings':
        router.push('/settings/language');
        break;
      case 'help':
        router.push('/settings/help');
        break;
      case 'safetyCard':
        router.push('/profile/safety-card');
        break;
      default:
        break;
    }
  };

  return (
    <ProfileScreen
      userProfile={userProfile}
      onNavigate={handleNavigate}
      language={language as any}
      onLanguageChange={(lang) => setLanguage(lang as any) }
      onLogout={logout}
    />
  );
}
