import { X, Calendar, Plane, Check, Plus, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Language, translations } from '@/lib/translations';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  createTravelPackage,
  requestPayment,
  calculateDaysDifference,
  calculateTravelAmount,
  TRAVEL_PRICING,
  formatCurrency,
  issueBillingKey,
} from '@/lib/portone';
import { getSupabaseClient } from '@/lib/supabase';
import { showToast } from '@/components/ui/toast';
import { EasyPaySelection } from './EasyPaySelection';

interface TravelPaymentModalProps {
  onClose: () => void;
  language: Language;
}

interface RegisteredPaymentMethod {
  id: string;
  payment_type: 'CARD' | 'EASY_PAY' | 'PAYPAL';
  card_number_masked?: string;
  card_brand?: string;
  card_name?: string;
  easy_pay_provider?: string;
  paypal_email?: string;
  is_default: boolean;
  billing_key?: string;
}

export function TravelPaymentModal({ onClose }: TravelPaymentModalProps) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [selectedPayMethod, setSelectedPayMethod] = useState<PayMethod>('CARD');

  // 등록된 결제 수단
  const [registeredMethods, setRegisteredMethods] = useState<RegisteredPaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);

  // 결제 수단 등록 모달
  const [showEasyPaySelection, setShowEasyPaySelection] = useState(false);

  // 등록된 결제 수단 불러오기
  useEffect(() => {
    loadRegisteredMethods();
  }, []);

  const loadRegisteredMethods = async () => {
    try {
      setIsLoadingMethods(true);
      const response = await fetch('/api/payment/methods');
      if (response.ok) {
        const data = await response.json();
        setRegisteredMethods(data.paymentMethods || []);

        // 기본 결제 수단 자동 선택
        const defaultMethod = data.paymentMethods?.find((m: RegisteredPaymentMethod) => m.is_default);
        if (defaultMethod) {
          setSelectedMethodId(defaultMethod.id);
        }
      }
    } catch (error) {
      console.error('[Load Payment Methods] Error:', error);
    } finally {
      setIsLoadingMethods(false);
    }
  };

  const handleRegistrationSuccess = () => {
    loadRegisteredMethods();
  };

  // 카드 등록 처리
  const handleRegisterCard = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      showToast('info', language === 'ko' ? '카드 등록을 시작합니다...' : 'Starting card registration...');

      const supabase = getSupabaseClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        showToast('error', t.loginRequired || '로그인이 필요합니다.');
        return;
      }

      // 빌링키 발급 (PortOne 카드 등록 창 열림)
      const response = await issueBillingKey(user.id, user.email || '', '카드');

      if (response && response.code === 'ISSUED') {
        // 빌링키 발급 성공 - 서버에 저장
        const registerResponse = await fetch('/api/payment/methods/register-card', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billingKey: response.billingKey,
            cardInfo: {
              cardName: '카드',
            },
          }),
        });

        if (!registerResponse.ok) {
          throw new Error('카드 정보 저장 실패');
        }

        showToast(
          'success',
          language === 'ko'
            ? '카드가 성공적으로 등록되었습니다!'
            : 'Card registered successfully!'
        );

        // 등록된 결제 수단 목록 새로고침
        loadRegisteredMethods();
      } else if (response && response.code === 'PAYMENT_CANCELLED') {
        showToast(
          'info',
          language === 'ko'
            ? '카드 등록이 취소되었습니다.'
            : 'Card registration was cancelled.'
        );
      } else {
        showToast(
          'error',
          language === 'ko'
            ? '카드 등록에 실패했습니다.'
            : 'Card registration failed.'
        );
      }
    } catch (error) {
      console.error('[Card Registration] Error:', error);
      showToast(
        'error',
        language === 'ko'
          ? '카드 등록 중 오류가 발생했습니다.'
          : 'An error occurred during card registration.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 날짜 변경 시 일수 및 금액 계산
  const handleDateChange = (start: Date | null, end: Date | null) => {
    if (start && end) {
      if (end >= start) {
        const days = calculateDaysDifference(start, end);
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

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    handleDateChange(date, endDate);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    handleDateChange(startDate, date);
  };

  const handlePurchase = async () => {
    if (!startDate || !endDate || calculatedDays === 0) {
      showToast('warning', t.selectTravelDates || '여행 시작일과 종료일을 선택해주세요.');
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
      const product = createTravelPackage(new Date(startDate), new Date(endDate));

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-[#2ECC71]" />
              <h2 className="text-lg sm:text-xl font-bold">
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
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* 요금 안내 */}
          <div className="rounded-2xl border-2 border-[#2ECC71] bg-gradient-to-br from-[#2ECC71]/10 to-white p-4">
            <div className="flex items-center gap-3 mb-2">
              <Check className="h-5 w-5 text-[#2ECC71]" />
              <h3 className="font-semibold text-[#2ECC71]">
                {t.dailyRate || '일일 요금'}
              </h3>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(TRAVEL_PRICING.DAILY_RATE)}
              <span className="text-base font-normal text-gray-600 ml-2">
                / {t.day || '일'}
              </span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {t.dailyRateDesc ||
                '여행 기간 동안 메뉴 OCR 번역 무제한 이용'}
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
              <DatePicker
                selected={startDate}
                onChange={handleStartDateChange}
                minDate={new Date()}
                maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                dateFormat="yyyy-MM-dd"
                placeholderText={language === 'ko' ? '날짜 선택' : 'Select date'}
                disabled={isProcessing}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-[#2ECC71] focus:outline-none"
                wrapperClassName="w-full"
                calendarClassName="text-lg"
                showPopperArrow={false}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t.travelEndDate || '여행 종료일'}
                </div>
              </label>
              <DatePicker
                selected={endDate}
                onChange={handleEndDateChange}
                minDate={startDate || new Date()}
                maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                dateFormat="yyyy-MM-dd"
                placeholderText={language === 'ko' ? '날짜 선택' : 'Select date'}
                disabled={isProcessing || !startDate}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-[#2ECC71] focus:outline-none disabled:bg-gray-100"
                wrapperClassName="w-full"
                calendarClassName="text-lg"
                showPopperArrow={false}
              />
            </div>
          </div>

          {/* 등록된 결제 수단 */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                {language === 'ko' ? '결제 수단' : 'Payment Method'}
              </h3>
              {registeredMethods.length > 0 && (
                <button
                  onClick={handleRegisterCard}
                  disabled={isProcessing}
                  className="text-xs text-[#2ECC71] hover:text-[#27AE60] font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  {language === 'ko' ? '카드 추가' : 'Add Card'}
                </button>
              )}
            </div>

            {isLoadingMethods ? (
              <div className="rounded-xl border-2 border-gray-200 p-4 text-center text-sm text-gray-500">
                {language === 'ko' ? '결제 수단을 불러오는 중...' : 'Loading payment methods...'}
              </div>
            ) : registeredMethods.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-3">
                    {language === 'ko'
                      ? '등록된 결제 수단이 없습니다.'
                      : 'No payment methods registered.'}
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={handleRegisterCard}
                      disabled={isProcessing}
                      className="w-full rounded-lg bg-[#2ECC71] px-4 py-2 text-sm font-semibold text-white hover:bg-[#27AE60] disabled:opacity-50"
                    >
                      {language === 'ko' ? '💳 카드 등록하기' : '💳 Register Card'}
                    </button>
                    <button
                      onClick={() => setShowEasyPaySelection(true)}
                      disabled={isProcessing}
                      className="w-full rounded-lg border-2 border-[#2ECC71] bg-white px-4 py-2 text-sm font-semibold text-[#2ECC71] hover:bg-[#2ECC71]/10 disabled:opacity-50"
                    >
                      {language === 'ko' ? '📱 간편결제 연동하기' : '📱 Connect Easy Pay'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {registeredMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethodId(method.id)}
                    disabled={isProcessing}
                    className={`w-full rounded-xl border-2 p-3 sm:p-4 text-left transition-all active:scale-[0.98] ${
                      selectedMethodId === method.id
                        ? 'border-[#2ECC71] bg-[#2ECC71]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3">
                      {method.payment_type === 'CARD' ? (
                        <>
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                            💳
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">
                              {method.card_name || method.card_brand || 'Card'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {method.card_number_masked || '**** **** **** ****'}
                            </p>
                          </div>
                        </>
                      ) : method.payment_type === 'EASY_PAY' ? (
                        <>
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-400 text-xl">
                            📱
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">
                              {method.easy_pay_provider}
                            </p>
                            <p className="text-xs text-gray-600">
                              {language === 'ko' ? '간편결제' : 'Easy Pay'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-xl">
                            🌐
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">PayPal</p>
                            <p className="text-xs text-gray-600">
                              {method.paypal_email}
                            </p>
                          </div>
                        </>
                      )}
                      {method.is_default && (
                        <span className="rounded-full bg-[#2ECC71] px-2 py-0.5 text-xs text-white whitespace-nowrap">
                          {language === 'ko' ? '기본' : 'Default'}
                        </span>
                      )}
                      {selectedMethodId === method.id && (
                        <Check className="h-5 w-5 flex-shrink-0 text-[#2ECC71]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 계산 결과 */}
          {calculatedDays > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">
                  {t.travelDuration || '여행 기간'}
                </span>
                <span className="font-semibold">
                  {calculatedDays} {t.days || '일'}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">
                  {t.dailyRate || '일일 요금'}
                </span>
                <span className="font-semibold">
                  {formatCurrency(TRAVEL_PRICING.DAILY_RATE)}
                </span>
              </div>
              <div className="border-t border-gray-300 my-3"></div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{t.totalAmount || '총 금액'}</span>
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
            className="w-full rounded-xl bg-[#2ECC71] px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white transition-all hover:bg-[#27AE60] active:bg-[#27AE60] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
              <div className="text-sm text-blue-900 space-y-1">
                <p>
                  • {t.paymentNotice1 ||
                    '결제는 포트원을 통해 안전하게 처리됩니다.'}
                </p>
                <p>
                  • {t.travelPackageNotice ||
                    '선택한 기간 동안 메뉴 OCR 번역을 무제한으로 이용할 수 있습니다.'}
                </p>
                <p>
                  • {t.maxDaysNotice ||
                    `최대 ${TRAVEL_PRICING.MAX_DAYS}일까지 선택 가능합니다.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 간편결제 선택 모달 */}
      {showEasyPaySelection && (
        <EasyPaySelection
          onClose={() => setShowEasyPaySelection(false)}
          onSuccess={handleRegistrationSuccess}
          language={language}
        />
      )}
    </div>
  );
}
