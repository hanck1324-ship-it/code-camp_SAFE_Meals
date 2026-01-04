import { X, Calendar, Plane, Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  createTravelPackage,
  requestPayment,
  calculateDaysDifference,
  calculateTravelAmount,
  TRAVEL_PRICING,
  formatCurrency,
} from '@/lib/portone';
import { getSupabaseClient } from '@/lib/supabase';

interface TravelPaymentModalProps {
  onClose: () => void;
}

export function TravelPaymentModal({ onClose }: TravelPaymentModalProps) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  // 모바일 앱(WebView) 환경 감지
  const isNativeApp =
    typeof window !== 'undefined' && (window as any).isNativeApp === true;

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
    // 모바일 앱에서는 결제 불가 안내
    if (isNativeApp) {
      alert(
        t.paymentNotSupportedInApp ||
          '모바일 앱에서는 결제가 지원되지 않습니다. 웹 브라우저에서 이용해주세요.'
      );
      return;
    }

    if (!startDate || !endDate || calculatedDays === 0) {
      alert(t.selectTravelDates || '여행 시작일과 종료일을 선택해주세요.');
      return;
    }

    if (isProcessing) return;

    try {
      setIsProcessing(true);

      // 1. 사용자 정보 가져오기
      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        alert(t.loginRequired || '로그인이 필요합니다.');
        return;
      }

      // 2. 여행 패키지 생성
      const product = createTravelPackage(
        new Date(startDate),
        new Date(endDate)
      );

      // 3. 결제 요청
      const response = await requestPayment(product, user.id, user.email || '');

      // 4. 결제 성공 처리
      if (response && response.code === 'PAID') {
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

        alert(
          t.paymentSuccess ||
            `결제가 완료되었습니다.\n여행 기간: ${calculatedDays}일\n금액: ${formatCurrency(calculatedAmount)}`
        );

        // 모달 닫기 및 페이지 새로고침
        onClose();
        window.location.reload();
      } else {
        // 결제 취소 또는 실패
        console.log('[Payment] Cancelled or failed:', response);
      }
    } catch (error) {
      console.error('[Payment] Error:', error);
      alert(
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="h-6 w-6 text-[#2ECC71]" />
              <h2 className="text-xl font-bold">
                {t.travelPackage || '여행 패키지'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
              disabled={isProcessing}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
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
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#2ECC71] focus:outline-none"
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
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:border-[#2ECC71] focus:outline-none"
                disabled={isProcessing || !startDate}
              />
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
              <div className="my-3 border-t border-gray-300"></div>
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
            className="w-full rounded-xl bg-[#2ECC71] px-6 py-4 text-lg font-semibold text-white transition-all hover:bg-[#27AE60] disabled:cursor-not-allowed disabled:opacity-50"
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
