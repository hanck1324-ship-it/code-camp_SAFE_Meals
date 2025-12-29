'use client';

import { LanguageSettingsScreen } from '@/features/profile/components/settings/language-settings-screen';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { RequireAuth } from '@/components/auth/require-auth';

export default function LanguageSettingsPage() {
  const router = useRouter();
  const { language, setLanguage } = useTranslation();

  return (
    <RequireAuth>
      <LanguageSettingsScreen
        currentLanguage={language}
        onBack={() => router.back()}
        onLanguageChange={setLanguage}
      />
    </RequireAuth>
  );
}
