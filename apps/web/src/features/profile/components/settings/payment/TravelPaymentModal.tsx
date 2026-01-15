import { X, Calendar, Plane, Check } from 'lucide-react';
import { useState } from 'react';

import { showToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/useTranslation';
import {
  createTravelPackage,
  requestPayment,
  calculateDaysDifference,
  calculateTravelAmount,
  TRAVEL_PRICING,
  formatCurrency,
  PAYMENT_METHODS,
} from '@/lib/portone';
import { getSupabaseClient } from '@/lib/supabase';

import type { PayMethod } from '@/lib/portone';

interface TravelPaymentModalProps {
  onClose: () => void;
}

export function TravelPaymentModal({ onClose }: TravelPaymentModalProps) {
  const { t, language } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [selectedPayMethod, setSelectedPayMethod] = useState<PayMethod>('CARD');

  // 날짜 변경 시 일수 및 금액 계산
  const handleDateChange = (start: string, end: string) => {
    if (start && end) {
      const startDateObj = new Date(start);
      const endDateObj = new Date(end);

      if (endDateObj >= startDateObj) {
        const days = calculateDaysDifference(startDateObj, endDateObj);
        const amount = calculateTravelAmount(days);
        setCalculatedDays(days);
        setCalculatedAmount(amount);
      } else {
        setCalculatedDays(0);
        setCalculatedAmount(0);
      }
    } else {
      setCalculatedDays(0);
      setCalculatedAmount(0);
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    handleDateChange(value, endDate);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    handleDateChange(startDate, value);
  };

  const handlePurchase = async () => {
    if (!startDate || !endDate || calculatedDays === 0) {
      showToast(
        'warning',
        t.selectTravelDates || '여행 시작일과 종료일을 선택해주세요.'
      );
      return;
    }

    if (isProcessing) return;

    try {
      setIsProcessing(true);

      // 결제 시작 알림
      showToast('info', t.paymentStarting || '결제를 진행합니다...');

      // 1. 사용자 정보 가져오기
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        showToast('error', t.loginRequired || '로그인이 필요합니다.');
        return;
      }

      // 2. 여행 패키지 생성
      const product = createTravelPackage(
        new Date(startDate),
        new Date(endDate)
      );

      // 3. 결제 요청 (선택한 결제 수단 사용)
      const response = await requestPayment(
        product,
        user.id,
        user.email || '',
        selectedPayMethod
      );

      // 4. 결제 성공 처리
      if (response && response.code === 'PAID') {
        // 결제 검증 중 알림
        showToast('info', t.verifyingPayment || '결제를 검증하는 중입니다...');

        // 서버에 결제 검증 요청
        const verifyResponse = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: response.paymentId,
            amount: product.amount,
            productId: product.id,
            startDate: product.startDate,
            endDate: product.endDate,
            days: product.days,
          }),
        });

        if (!verifyResponse.ok) {
          throw new Error('결제 검증에 실패했습니다.');
        }

        const verifyData = await verifyResponse.json();

        // 결제 완료 알림
        showToast(
          'success',
          t.paymentCompleted ||
            `결제가 완료되었습니다! (${calculatedDays}일, ${formatCurrency(calculatedAmount)})`
        );

        // 모달 닫기 및 페이지 새로고침
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } else if (response && response.code === 'PAYMENT_CANCELLED') {
        // 결제 취소
        showToast('info', t.paymentCancelled || '결제가 취소되었습니다.');
      } else {
        // 결제 실패
        showToast('error', t.paymentFailed || '결제에 실패했습니다.');
        console.log('[Payment] Failed:', response);
      }
    } catch (error) {
      console.error('[Payment] Error:', error);
      showToast(
        'error',
        t.paymentError || '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 오늘 날짜 (최소 선택 가능 날짜)
  const today = new Date().toISOString().split('T')[0];
  // 1년 후 날짜 (최대 선택 가능 날짜)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl sm:max-h-[90vh]">
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-[#2ECC71] sm:h-6 sm:w-6" />
              <h2 className="text-lg font-bold sm:text-xl">
                {t.travelPackage || '여행 패키지'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200"
              disabled={isProcessing}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
          {/* 요금 안내 */}
          <div className="rounded-2xl border-2 border-[#2ECC71] bg-gradient-to-br from-[#2ECC71]/10 to-white p-4">
            <div className="mb-2 flex items-center gap-3">
              <Check className="h-5 w-5 text-[#2ECC71]" />
              <h3 className="font-semibold text-[#2ECC71]">
                {t.dailyRate || '일일 요금'}
              </h3>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(TRAVEL_PRICING.DAILY_RATE)}
              <span className="ml-2 text-base font-normal text-gray-600">
                / {t.day || '일'}
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {t.dailyRateDesc || '여행 기간 동안 메뉴 OCR 번역 무제한 이용'}
            </p>
          </div>

          {/* 여행 기간 선택 */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t.travelStartDate || '여행 시작일'}
                </div>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                min={today}
                max={maxDateStr}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center text-base focus:border-[#2ECC71] focus:outline-none"
                style={{ minHeight: '48px' }}
                disabled={isProcessing}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t.travelEndDate || '여행 종료일'}
                </div>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                min={startDate || today}
                max={maxDateStr}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center text-base focus:border-[#2ECC71] focus:outline-none"
                style={{ minHeight: '48px' }}
                disabled={isProcessing || !startDate}
              />
            </div>
          </div>

          {/* 결제 수단 선택 */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              {language === 'ko' ? '결제 수단 선택' : 'Payment Method'}
            </h3>
            <div className="space-y-2">
              {Object.values(PAYMENT_METHODS).map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedPayMethod(method.id)}
                  disabled={isProcessing}
                  className={`w-full rounded-xl border-2 p-3 text-left transition-all active:scale-[0.98] sm:p-4 ${
                    selectedPayMethod === method.id
                      ? 'border-[#2ECC71] bg-[#2ECC71]/10'
                      : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="flex-shrink-0 text-xl sm:text-2xl">
                      {method.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <p className="text-sm font-semibold sm:text-base">
                          {language === 'ko' ? method.name : method.nameEn}
                        </p>
                        {method.recommended && (
                          <span className="whitespace-nowrap rounded-full bg-[#2ECC71] px-1.5 py-0.5 text-[10px] text-white sm:px-2 sm:text-xs">
                            {language === 'ko' ? '추천' : 'Recommended'}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-600 sm:text-sm">
                        {language === 'ko'
                          ? method.description
                          : method.descriptionEn}
                      </p>
                    </div>
                    {selectedPayMethod === method.id && (
                      <Check className="h-5 w-5 flex-shrink-0 text-[#2ECC71] sm:h-6 sm:w-6" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 계산 결과 */}
          {calculatedDays > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-gray-700">
                  {t.travelDuration || '여행 기간'}
                </span>
                <span className="font-semibold">
                  {calculatedDays} {t.days || '일'}
                </span>
              </div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-gray-700">
                  {t.dailyRate || '일일 요금'}
                </span>
                <span className="font-semibold">
                  {formatCurrency(TRAVEL_PRICING.DAILY_RATE)}
                </span>
              </div>
              <div className="my-3 border-t border-gray-300" />
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  {t.totalAmount || '총 금액'}
                </span>
                <span className="text-2xl font-bold text-[#2ECC71]">
                  {formatCurrency(calculatedAmount)}
                </span>
              </div>
            </div>
          )}

          {/* 구매 버튼 */}
          <button
            onClick={handlePurchase}
            disabled={isProcessing || calculatedDays === 0}
            className="w-full rounded-xl bg-[#2ECC71] px-4 py-3 text-base font-semibold text-white transition-all hover:bg-[#27AE60] active:scale-[0.98] active:bg-[#27AE60] disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-4 sm:text-lg"
            style={{ minHeight: '48px' }}
          >
            {isProcessing
              ? t.processing || '처리 중...'
              : calculatedDays === 0
                ? t.selectDates || '날짜를 선택하세요'
                : `${formatCurrency(calculatedAmount)} ${t.payNow || '결제하기'}`}
          </button>

          {/* 안내 사항 */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                <span className="text-xs text-white">i</span>
              </div>
              <div className="space-y-1 text-sm text-blue-900">
                <p>
                  •{' '}
                  {t.paymentNotice1 ||
                    '결제는 포트원을 통해 안전하게 처리됩니다.'}
                </p>
                <p>
                  •{' '}
                  {t.travelPackageNotice ||
                    '선택한 기간 동안 메뉴 OCR 번역을 무제한으로 이용할 수 있습니다.'}
                </p>
                <p>
                  •{' '}
                  {t.maxDaysNotice ||
                    `최대 ${TRAVEL_PRICING.MAX_DAYS}일까지 선택 가능합니다.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
