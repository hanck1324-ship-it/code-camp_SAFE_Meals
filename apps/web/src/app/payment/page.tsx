'use client';
import { PaymentScreen } from '@/features/profile/components/settings/payment-screen';
import { RequireAuth } from '@/components/auth/require-auth';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * 결제 페이지
 * 모바일 앱에서 웹뷰로 접근하는 결제 화면
 */
export default function PaymentPage() {
  const router = useRouter();
  const { language } = useTranslation();

  return (
    <RequireAuth>
      <PaymentScreen onBack={() => router.back()} language={language} />
    </RequireAuth>
  );
}
