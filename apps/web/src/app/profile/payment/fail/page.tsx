'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * 결제 실패 페이지
 * 
 * 포트원 결제 실패 후 리다이렉트되는 페이지
 */
export default function PaymentFailPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleRetry = () => {
    router.push('/profile/payment');
  };

  const handleGoToHome = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          {t.paymentFailed || '결제에 실패했습니다'}
        </h1>
        <p className="mb-8 text-center text-gray-600">
          {t.paymentFailedMessage ||
            '결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.'}
        </p>
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className="w-full rounded-2xl bg-[#2ECC71] hover:bg-[#27AE60]"
          >
            {t.retryPayment || '다시 시도'}
          </Button>
          <Button
            onClick={handleGoToHome}
            variant="outline"
            className="w-full rounded-2xl"
          >
            {t.goToHome || '홈으로 이동'}
          </Button>
        </div>
      </div>
    </div>
  );
}

