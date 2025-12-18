'use client';

import { HelpSupportScreen } from '@/components/profile';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { RequireAuth } from '@/components/auth/require-auth';

export default function HelpPage() {
  const router = useRouter();
  const { language } = useTranslation();

  return (
    <RequireAuth>
      <HelpSupportScreen onBack={() => router.back()} language={language} />
    </RequireAuth>
  );
}
