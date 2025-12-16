'use client';

import { HelpSupportScreen } from '@/components/profile';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

export default function HelpPage() {
  const router = useRouter();
  const { language } = useTranslation();

  return (
    <HelpSupportScreen
      onBack={() => router.back()}
      language={language}
    />
  );
}
