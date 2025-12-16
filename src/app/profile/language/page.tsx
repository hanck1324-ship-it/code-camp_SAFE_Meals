'use client';

import { LanguageSettingsScreen } from '@/components/profile';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

export default function LanguageSettingsPage() {
  const router = useRouter();
  const { language, setLanguage } = useTranslation();

  return (
    <LanguageSettingsScreen
      currentLanguage={language}
      onBack={() => router.back()}
      onLanguageChange={setLanguage}
    />
  );
}

