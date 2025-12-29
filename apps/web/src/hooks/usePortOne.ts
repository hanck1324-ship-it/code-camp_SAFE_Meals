/**
 * 포트원 결제를 위한 커스텀 훅
 */

import { useState, useCallback } from 'react';
import { requestPortOnePayment, type PortOnePaymentRequest, type PortOnePaymentResponse } from '@/lib/payment/portone';
import { toast } from 'sonner';

interface UsePortOneReturn {
  isProcessing: boolean;
  requestPayment: (request: PortOnePaymentRequest) => Promise<PortOnePaymentResponse | null>;
}

/**
 * 포트원 결제 훅
 * 
 * @example
 * ```tsx
 * const { isProcessing, requestPayment } = usePortOne();
 * 
 * const handlePayment = async () => {
 *   const response = await requestPayment({
 *     amount: 10000,
 *     orderId: 'order-123',
 *     orderName: '여행 기간권',
 *   });
 *   
 *   if (response?.code === 'SUCCESS') {
 *     // 결제 성공 처리
 *   }
 * };
 * ```
 */
export function usePortOne(): UsePortOneReturn {
  const [isProcessing, setIsProcessing] = useState(false);

  const requestPayment = useCallback(
    async (request: PortOnePaymentRequest): Promise<PortOnePaymentResponse | null> => {
      if (isProcessing) {
        toast.info('결제가 이미 진행 중입니다.');
        return null;
      }

      try {
        setIsProcessing(true);

        const response = await requestPortOnePayment(request);

        if (response.code === 'SUCCESS') {
          toast.success('결제가 성공적으로 처리되었습니다.');
          return response;
        } else {
          toast.error(response.message || '결제 처리 중 오류가 발생했습니다.');
          return null;
        }
      } catch (error: any) {
        console.error('결제 오류:', error);
        toast.error(error.message || '결제 요청 중 오류가 발생했습니다.');
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing]
  );

  return {
    isProcessing,
    requestPayment,
  };
}

