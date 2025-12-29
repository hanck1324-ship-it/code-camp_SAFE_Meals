'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Language, translations } from '@/lib/translations';
// date-fns는 react-day-picker에 포함되어 있지만, 직접 import가 필요할 수 있습니다.
// 필요시: npm install date-fns
// import { format } from 'date-fns';
// import { ko } from 'date-fns/locale';
import { usePortOne } from '@/hooks/usePortOne';
import { toast } from 'sonner';

interface TravelPassConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: Date | null;
  endDate: Date | null;
  days: number;
  totalPrice: number;
  onConfirm: () => void;
  language: Language;
}

/**
 * 여행 기간권 구매 확인 다이얼로그
 * 
 * 포트원 결제 연동 완료
 */
export function TravelPassConfirmDialog({
  open,
  onOpenChange,
  startDate,
  endDate,
  days,
  totalPrice,
  onConfirm,
  language,
}: TravelPassConfirmDialogProps) {
  const t = translations[language];
  const { isProcessing, requestPayment } = usePortOne();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleConfirm = async () => {
    if (!startDate || !endDate || isRequesting || isProcessing) {
      return;
    }

    try {
      setIsRequesting(true);

      // 주문 ID 생성 (고유값)
      const orderId = `travel-pass-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 주문명 생성
      const orderName = `여행 기간권 (${days}일)`;

      // 포트원 결제 요청
      const response = await requestPayment({
        amount: totalPrice,
        orderId,
        orderName,
        customerName: undefined, // TODO: 사용자 정보에서 가져오기
        customerEmail: undefined, // TODO: 사용자 정보에서 가져오기
        customData: {
          type: 'travel-pass',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days,
        },
      });

      if (response?.code === 'SUCCESS') {
        // 결제 성공 시 콜백
        onConfirm();
        onOpenChange(false);
      } else {
        // 결제 실패는 usePortOne에서 이미 토스트로 처리됨
        console.error('결제 실패:', response);
      }
    } catch (error: any) {
      console.error('결제 요청 오류:', error);
      toast.error(error.message || '결제 요청 중 오류가 발생했습니다.');
    } finally {
      setIsRequesting(false);
    }
  };

  if (!startDate || !endDate) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            {'confirmTravelPassPurchase' in t ? (t as any).confirmTravelPassPurchase : '여행 기간권 구매 확인'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {'confirmTravelPassDescription' in t ? (t as any).confirmTravelPassDescription : '선택하신 여행 기간권 정보를 확인해주세요.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* 구매 정보 */}
        <div className="space-y-4 py-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {'travelPeriod' in t ? (t as any).travelPeriod : '여행 기간'}
                </span>
                <span className="text-sm font-medium">
                  {startDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  -{' '}
                  {endDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {'days' in t ? (t as any).days : '일수'}
                </span>
                <span className="text-sm font-medium">{days}일</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">
                    {'totalPrice' in t ? (t as any).totalPrice : '총 결제 금액'}
                  </span>
                  <span className="text-lg font-bold text-[#2ECC71]">
                    {totalPrice.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 안내 문구 */}
          <p className="text-xs text-muted-foreground">
            {'travelPassInfo' in t ? (t as any).travelPassInfo : '여행 기간이 끝나면 자동으로 해지됩니다. 별도의 해지 절차가 필요 없습니다.'}
          </p>
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel className="rounded-2xl">
            {t.cancel || '취소'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="rounded-2xl bg-[#2ECC71] hover:bg-[#27AE60]"
          >
            {'confirmPurchase' in t ? (t as any).confirmPurchase : '구매 확인'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

