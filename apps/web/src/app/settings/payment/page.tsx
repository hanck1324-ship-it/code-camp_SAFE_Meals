'use client';
import { useRouter } from 'next/navigation';

import { RequireAuth } from '@/components/auth/require-auth';
import { PaymentScreen } from '@/features/profile/components/settings/payment-screen';

export default function PaymentSettingsPage() {
  const router = useRouter();

  return (
    <RequireAuth>
      <PaymentScreen onBack={() => router.back()} />
    </RequireAuth>
  );
}
