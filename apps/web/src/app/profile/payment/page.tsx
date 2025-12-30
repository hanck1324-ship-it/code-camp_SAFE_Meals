'use client';
import { PaymentScreen } from '@/features/profile/components/settings/payment-screen';
import { RequireAuth } from '@/components/auth/require-auth';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProfilePaymentPage() {
  const router = useRouter();
  const { language } = useTranslation();

  return (
    <RequireAuth>
      <PaymentScreen onBack={() => router.back()} language={language} />
    </RequireAuth>
  );
}

