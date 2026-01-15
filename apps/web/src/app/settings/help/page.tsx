'use client';
import { RequireAuth } from '@/components/auth/require-auth';
import { HelpSupportScreen } from '@/features/profile/components/settings/help-support-screen';

export default function HelpPage() {
  return (
    <RequireAuth>
      <HelpSupportScreen onBack={() => {}} />
    </RequireAuth>
  );
}
