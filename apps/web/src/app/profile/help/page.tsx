'use client';

import { useRouter } from 'next/navigation';

import { RequireAuth } from '@/components/auth/require-auth';
import { HelpSupportScreen } from '@/features/profile/components/settings/help-support-screen';

export default function HelpPage() {
  const router = useRouter();

  return (
    <RequireAuth>
      <HelpSupportScreen onBack={() => router.back()} />
    </RequireAuth>
  );
}
