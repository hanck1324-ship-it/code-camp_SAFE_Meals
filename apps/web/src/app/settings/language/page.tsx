'use client';
import { useRouter } from 'next/navigation';

import { RequireAuth } from '@/components/auth/require-auth';
import { LanguageSettingsScreen } from '@/features/profile/components/settings/language-settings-screen';

export default function LanguageSettingsPage() {
  const router = useRouter();

  return (
    <RequireAuth>
      <LanguageSettingsScreen onBack={() => router.back()} />
    </RequireAuth>
  );
}
