'use client';
import { HelpSupportScreen } from '@/features/profile/components/settings/help-support-screen';
import { RequireAuth } from '@/components/auth/require-auth';

export default function HelpPage() {
  return (
    <RequireAuth>
      <HelpSupportScreen onBack={() => {}} />
    </RequireAuth>
  );
}
