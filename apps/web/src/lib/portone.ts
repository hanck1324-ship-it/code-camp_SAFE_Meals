/**
 * 포트원(구 아임포트) 결제 유틸리티
 */

import type { PaymentRequest, PaymentResponse } from '@portone/browser-sdk/v2';

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
export function calculateDaysDifference(
  startDate: Date,
  endDate: Date
): number {
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
 * 지원하는 결제 수단 타입
 */
export type PayMethod =
  | 'CARD'           // 신용/체크카드 (국내외)
  | 'EASY_PAY'       // 간편결제 (카카오페이, 네이버페이, 토스페이 등)
  | 'VIRTUAL_ACCOUNT' // 가상계좌
  | 'TRANSFER'       // 실시간 계좌이체
  | 'MOBILE'         // 휴대폰 소액결제
  | 'PAYPAL';        // 페이팔

/**
 * 결제 수단 정보
 *
 * 외국인 관광객이 가장 많이 사용하는 결제 수단:
 * 1. 신용/체크카드 (CARD) - 전 세계 공통, 가장 널리 사용됨
 *    - Visa, Mastercard (미국, 유럽, 아시아 등 전 세계)
 *    - AMEX (미국인 선호)
 *    - JCB (일본인 선호)
 *    - UnionPay (중국인 선호)
 *
 * 2. PayPal (PAYPAL) - 미국, 유럽 관광객이 선호
 *
 * 3. 모바일 결제 (EASY_PAY)
 *    - Apple Pay (미국, 유럽, 일본 등)
 *    - Google Pay (전 세계)
 *    - Samsung Pay (한국, 아시아)
 *
 * 4. 기타 지역별 인기 결제:
 *    - Alipay, WeChat Pay (중국)
 *    - Klarna (유럽)
 *    - Stripe (전 세계)
 */
export const PAYMENT_METHODS = {
  CARD: {
    id: 'CARD' as const,
    name: '카드결제',
    nameEn: 'Credit/Debit Card',
    description: 'Visa, Mastercard, AMEX, JCB, UnionPay',
    descriptionEn: 'Visa, Mastercard, AMEX, JCB, UnionPay',
    icon: '💳',
    global: true,
    recommended: true, // 가장 추천하는 결제 수단
  },
  EASY_PAY: {
    id: 'EASY_PAY' as const,
    name: '간편결제',
    nameEn: 'Mobile Wallet',
    description: '카카오페이, 네이버페이, 토스페이',
    descriptionEn: 'Apple Pay, Google Pay, Samsung Pay',
    icon: '📱',
    global: true,
    recommended: false,
  },
  PAYPAL: {
    id: 'PAYPAL' as const,
    name: 'PayPal',
    nameEn: 'PayPal',
    description: '전 세계 2억 명 이상 사용',
    descriptionEn: 'Available worldwide',
    icon: '🌐',
    global: true,
    recommended: false,
  },
} as const;

/**
 * 포트원 결제 요청
 * 모든 결제 수단 지원:
 * - 카드결제 (국내/해외 신용카드, 체크카드)
 * - 간편결제 (카카오페이, 네이버페이, 토스페이, 페이코 등)
 * - 해외결제 (PayPal, Alipay, WeChat Pay 등)
 * - 계좌이체, 가상계좌 등
 */
export async function requestPayment(
  product: PaymentProduct,
  userId: string,
  userEmail: string,
  payMethod: PayMethod = 'CARD'
): Promise<PaymentResponse | undefined> {
  const { requestPayment: portoneRequestPayment } =
    await import('@portone/browser-sdk/v2');

  // 주문 ID 생성 (timestamp + random)
  const merchantUid = `order_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  // 리디렉션 URL 설정 (결제 완료 후 돌아올 URL)
  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/payment`
    : undefined;

  const paymentRequest: PaymentRequest = {
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
    channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
    paymentId: merchantUid,
    orderName: product.name,
    totalAmount: product.amount,
    currency: 'CURRENCY_KRW',
    payMethod, // 사용자가 선택한 결제 수단
    payMethod: 'EASY_PAY', // 포트원 SDK v2는 EASY_PAY 사용
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
    redirectUrl,
  };

  console.log('[Payment] Request:', {
    payMethod,
    isMobile: isMobileEnvironment(),
    merchantUid,
    redirectUrl,
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
