'use client';
import { PaymentScreen } from '@/features/profile/components/settings/payment-screen';
import { RequireAuth } from '@/components/auth/require-auth';
import { useRouter } from 'next/navigation';

export default function PaymentSettingsPage() {
  const router = useRouter();

  return (
    <RequireAuth>
      <PaymentScreen onBack={() => router.back()} language="ko" />
    </RequireAuth>
  );
}

