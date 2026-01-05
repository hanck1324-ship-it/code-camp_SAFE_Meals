/**
 * 포트원(구 아임포트) 결제 유틸리티
 */

import type {
  PaymentRequest,
  PaymentResponse
} from '@portone/browser-sdk/v2';

/**
 * 결제 상품 타입
 */
export interface PaymentProduct {
  id: string;
  name: string;
  amount: number;
  description?: string;
  days?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * 여행 기간 기반 요금 설정
 */
export const TRAVEL_PRICING = {
  DAILY_RATE: 4000, // 하루당 4,000원
  MIN_DAYS: 1,
  MAX_DAYS: 365,
} as const;

/**
 * 날짜 차이 계산 (일 단위)
 * @param startDate 시작일
 * @param endDate 종료일
 * @returns 일수 (최소 1일)
 */
export function calculateDaysDifference(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? 1 : diffDays; // 당일이면 1일로 계산
}

/**
 * 여행 일수에 따른 금액 계산
 * @param days 여행 일수
 * @returns 계산된 금액 (원)
 */
export function calculateTravelAmount(days: number): number {
  const validDays = Math.max(
    TRAVEL_PRICING.MIN_DAYS,
    Math.min(days, TRAVEL_PRICING.MAX_DAYS)
  );
  return TRAVEL_PRICING.DAILY_RATE * validDays;
}

/**
 * 여행 패키지 생성
 * @param startDate 여행 시작일
 * @param endDate 여행 종료일
 * @returns 결제 상품 객체
 */
export function createTravelPackage(
  startDate: Date,
  endDate: Date
): PaymentProduct {
  const days = calculateDaysDifference(startDate, endDate);
  const amount = calculateTravelAmount(days);

  return {
    id: 'travel_package',
    name: `SafeMeals 여행 패키지 (${days}일)`,
    amount,
    description: `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`,
    days,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

/**
 * 모바일 환경 감지
 */
function isMobileEnvironment(): boolean {
  if (typeof window === 'undefined') return false;

  // 네이티브 앱 환경 체크
  if ((window as any).isNativeApp) return true;

  // User Agent 기반 모바일 체크
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod|mobile/i.test(userAgent);
}

/**
 * 포트원 결제 요청
 * 웹/모바일 모두 간편결제와 카드결제 지원
 */
export async function requestPayment(
  product: PaymentProduct,
  userId: string,
  userEmail: string
): Promise<PaymentResponse | undefined> {
  const { requestPayment: portoneRequestPayment } = await import('@portone/browser-sdk/v2');

  // 주문 ID 생성 (timestamp + random)
  const merchantUid = `order_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  // 모바일 환경에서는 EASY_PAY 우선, 웹에서는 CARD 우선
  // 결제창에서 사용자가 다른 수단도 선택 가능
  const payMethod = isMobileEnvironment() ? 'EASY_PAY' : 'CARD';

  const paymentRequest: PaymentRequest = {
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
    channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
    paymentId: merchantUid,
    orderName: product.name,
    totalAmount: product.amount,
    currency: 'CURRENCY_KRW',
    payMethod,
    customer: {
      customerId: userId,
      email: userEmail,
    },
    customData: {
      productId: product.id,
      userId,
      days: product.days,
      startDate: product.startDate,
      endDate: product.endDate,
    },
  };

  console.log('[Payment] Request:', {
    payMethod,
    isMobile: isMobileEnvironment(),
    merchantUid,
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
    channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
    amount: product.amount,
  });

  const response = await portoneRequestPayment(paymentRequest);

  console.log('[Payment] Response:', response);

  return response;
}

/**
 * 원화 포맷팅
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

/**
 * 결제 상태 텍스트
 */
export function getPaymentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PAID: '결제 완료',
    READY: '결제 대기',
    FAILED: '결제 실패',
    CANCELLED: '결제 취소',
  };
  return statusMap[status] || status;
}
