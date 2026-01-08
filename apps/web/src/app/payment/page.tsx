'use client';
import { PaymentScreen } from '@/features/profile/components/settings/payment-screen';
import { RequireAuth } from '@/components/auth/require-auth';
import { useRouter } from 'next/navigation';

/**
 * 결제 페이지
 * 모바일 앱에서 웹뷰로 접근하는 결제 화면
 */
export default function PaymentPage() {
  const router = useRouter();

  return (
    <RequireAuth>
      <PaymentScreen onBack={() => router.back()} />
    </RequireAuth>
  );
}
