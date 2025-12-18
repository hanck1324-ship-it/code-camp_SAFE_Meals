'use client';

import { NotificationsScreen } from '@/components/profile';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { RequireAuth } from '@/components/auth/require-auth';

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const { language } = useTranslation();

  return (
    <RequireAuth>
      <NotificationsScreen
        onBack={() => router.back()}
        language={language}
      />
    </RequireAuth>
  );
}

