'use client';

import { NotificationsScreen } from '@/components/profile';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const { language } = useTranslation();

  return (
    <NotificationsScreen
      onBack={() => router.back()}
      language={language}
    />
  );
}

