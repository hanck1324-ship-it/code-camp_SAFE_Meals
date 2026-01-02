import { ChevronLeft, CreditCard, Receipt, Plus, Plane, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Language, translations } from '@/lib/translations';
import { TravelPaymentModal } from './payment/TravelPaymentModal';
import { formatCurrency } from '@/lib/portone';

interface PaymentScreenProps {
  onBack: () => void;
  language: Language;
}

interface Payment {
  id: string;
  product_id: string;
  amount: number;
  status: string;
  paid_at: string;
  start_date?: string;
  end_date?: string;
  days?: number;
}

interface ActiveSubscription {
  product_id: string;
  is_active: boolean;
  expires_at: string;
  start_date?: string;
  end_date?: string;
  days?: number;
}

export function PaymentScreen({
  onBack,
  language,
}: PaymentScreenProps) {
  const t = translations[language];

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<ActiveSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 결제 내역 불러오기
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const response = await fetch('/api/payment/history');
        if (response.ok) {
          const data = await response.json();
          setPayments(data.payments || []);
          setActiveSubscription(data.activeSubscription || null);
        }
      } catch (error) {
        console.error('[PaymentScreen] Failed to load payment history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentHistory();
  }, []);

  const getProductName = (payment: Payment) => {
    if (payment.days) {
      return `${t.travelPackage || '여행 패키지'} (${payment.days}${t.days || '일'})`;
    }
    return payment.product_id;
  };

  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate).toLocaleDateString(
      language === 'ko' ? 'ko-KR' : 'en-US',
      { month: 'short', day: 'numeric' }
    );
    const end = new Date(endDate).toLocaleDateString(
      language === 'ko' ? 'ko-KR' : 'en-US',
      { month: 'short', day: 'numeric' }
    );
    return `${start} ~ ${end}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="border-b border-gray-200 bg-white px-6 pb-4 pt-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="-ml-2 flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2>{t.payment || '결제'}</h2>
        </div>
      </div>

      {/* Active Travel Package */}
      {activeSubscription && (
        <div className="px-6 pt-6">
          <div className="rounded-2xl border-2 border-[#2ECC71] bg-gradient-to-br from-[#2ECC71]/10 to-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#2ECC71]">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-[#2ECC71]">
                  {t.activePackage || '활성 패키지'}
                </h3>
                <p className="mb-2 text-lg font-bold">
                  {t.travelPackage || '여행 패키지'} ({activeSubscription.days || 0}
                  {t.days || '일'})
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDateRange(
                      activeSubscription.start_date,
                      activeSubscription.end_date
                    )}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {t.expiresAt || '만료일'}:{' '}
                  {new Date(activeSubscription.expires_at).toLocaleDateString(
                    language === 'ko' ? 'ko-KR' : 'en-US'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Travel Package Button */}
      <div className="px-6 pt-6">
        <button
          onClick={() => setShowPaymentModal(true)}
          className="w-full rounded-2xl bg-gradient-to-r from-[#2ECC71] to-[#27AE60] p-6 text-left shadow-lg transition-all hover:shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                <Plus className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold text-white">
                  {t.purchaseTravelPackage || '여행 패키지 구매'}
                </h3>
                <p className="text-sm text-white/90">
                  {t.purchaseTravelPackageDesc ||
                    '여행 기간을 선택하고 메뉴 OCR 무제한 이용'}
                </p>
              </div>
            </div>
            <ChevronLeft className="h-6 w-6 flex-shrink-0 rotate-180 text-white" />
          </div>
        </button>
      </div>

      {/* How it works */}
      <div className="px-6 pt-6">
        <h3 className="mb-4 text-lg font-semibold">
          {t.howItWorks || '이용 방법'}
        </h3>
        <div className="space-y-3">
          <div className="flex gap-3 rounded-xl bg-white p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#2ECC71]/10 text-sm font-bold text-[#2ECC71]">
              1
            </div>
            <div>
              <p className="font-medium">
                {t.step1Title || '여행 기간 선택'}
              </p>
              <p className="text-sm text-gray-600">
                {t.step1Desc || '시작일과 종료일을 선택하세요'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl bg-white p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#2ECC71]/10 text-sm font-bold text-[#2ECC71]">
              2
            </div>
            <div>
              <p className="font-medium">
                {t.step2Title || '금액 확인 및 결제'}
              </p>
              <p className="text-sm text-gray-600">
                {t.step2Desc || '일 단위 금액이 자동 계산됩니다'}
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl bg-white p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#2ECC71]/10 text-sm font-bold text-[#2ECC71]">
              3
            </div>
            <div>
              <p className="font-medium">
                {t.step3Title || '메뉴 OCR 무제한 이용'}
              </p>
              <p className="text-sm text-gray-600">
                {t.step3Desc || '여행 기간 동안 무제한으로 사용하세요'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {t.paymentHistory || '결제 내역'}
          </h3>
          {payments.length > 0 && (
            <span className="text-sm text-gray-500">
              {t.total || '총'} {payments.length}
              {t.items || '건'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#2ECC71]" />
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <Receipt className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">
              {t.noPaymentHistory || '결제 내역이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#2ECC71]/10">
                      <CreditCard className="h-5 w-5 text-[#2ECC71]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{getProductName(payment)}</p>
                      {payment.start_date && payment.end_date && (
                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDateRange(
                              payment.start_date,
                              payment.end_date
                            )}
                          </span>
                        </div>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(payment.paid_at).toLocaleDateString(
                          language === 'ko' ? 'ko-KR' : 'en-US'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(payment.amount)}
                    </p>
                    <span
                      className={`text-xs ${
                        payment.status === 'PAID'
                          ? 'text-[#2ECC71]'
                          : 'text-gray-500'
                      }`}
                    >
                      {payment.status === 'PAID'
                        ? t.completed || '완료'
                        : payment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="px-6 pb-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
              <span className="text-xs text-white">i</span>
            </div>
            <div>
              <p className="text-sm text-blue-900">
                {t.paymentInfo ||
                  '결제 정보는 포트원을 통해 안전하게 처리됩니다. 모든 거래는 암호화되어 보호됩니다.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Travel Payment Modal */}
      {showPaymentModal && (
        <TravelPaymentModal
          onClose={() => setShowPaymentModal(false)}
          language={language}
        />
      )}
    </div>
  );
}
