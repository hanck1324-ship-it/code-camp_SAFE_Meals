'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { verifyPortOnePayment } from '@/lib/payment/portone';

/**
 * 결제 성공 페이지
 * 
 * 포트원 결제 성공 후 리다이렉트되는 페이지
 */
export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const paymentId = searchParams.get('paymentId');
        const orderId = searchParams.get('orderId');

        if (!paymentId || !orderId) {
          console.error('결제 정보가 없습니다.');
          setIsVerifying(false);
          return;
        }

        // 서버에서 결제 검증
        const verified = await verifyPortOnePayment(paymentId, orderId);
        setIsVerified(verified);
      } catch (error) {
        console.error('결제 검증 오류:', error);
        setIsVerified(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleGoToPayment = () => {
    router.push('/profile/payment');
  };

  const handleGoToHome = () => {
    router.push('/dashboard');
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2ECC71] border-r-transparent" />
          <p className="text-gray-600">결제를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        {isVerified ? (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2ECC71]/10">
                <CheckCircle2 className="h-12 w-12 text-[#2ECC71]" />
              </div>
            </div>
            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
              {t.paymentSuccess || '결제가 완료되었습니다'}
            </h1>
            <p className="mb-8 text-center text-gray-600">
              {t.paymentSuccessMessage || '결제가 성공적으로 처리되었습니다.'}
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleGoToPayment}
                className="w-full rounded-2xl bg-[#2ECC71] hover:bg-[#27AE60]"
              >
                {t.viewPaymentHistory || '결제 내역 보기'}
              </Button>
              <Button
                onClick={handleGoToHome}
                variant="outline"
                className="w-full rounded-2xl"
              >
                {t.goToHome || '홈으로 이동'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <CheckCircle2 className="h-12 w-12 text-red-500" />
              </div>
            </div>
            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
              {t.paymentVerificationFailed || '결제 확인 실패'}
            </h1>
            <p className="mb-8 text-center text-gray-600">
              {t.paymentVerificationFailedMessage ||
                '결제 확인 중 문제가 발생했습니다. 고객센터로 문의해주세요.'}
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleGoToPayment}
                className="w-full rounded-2xl bg-[#2ECC71] hover:bg-[#27AE60]"
              >
                {t.goToPayment || '결제 페이지로 이동'}
              </Button>
              <Button
                onClick={handleGoToHome}
                variant="outline"
                className="w-full rounded-2xl"
              >
                {t.goToHome || '홈으로 이동'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

