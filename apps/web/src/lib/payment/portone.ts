/**
 * 포트원(구 아임포트) 결제 시스템 유틸리티
 * 
 * 포트원 SDK v2를 사용한 결제 처리
 * 
 * 설치 필요: npm install @portone/browser-sdk
 * 
 * 환경 변수 설정 (.env.local):
 * NEXT_PUBLIC_PORTONE_STORE_ID=your_store_id
 */

// 포트원 SDK는 동적 import로 로드 (SSR 방지)
let PortOneSDK: any = null;

/**
 * 포트원 SDK 동적 로드
 */
async function loadPortOneSDK() {
  if (typeof window === 'undefined') {
    throw new Error('포트원 SDK는 클라이언트 사이드에서만 사용할 수 있습니다.');
  }

  if (!PortOneSDK) {
    try {
      // @ts-ignore - 동적 import
      PortOneSDK = (await import('@portone/browser-sdk/v2')).default;
    } catch (error) {
      console.error('포트원 SDK 로드 실패:', error);
      throw new Error('포트원 SDK를 로드할 수 없습니다. 패키지가 설치되어 있는지 확인해주세요.');
    }
  }

  return PortOneSDK;
}

/**
 * 포트원 스토어 ID 가져오기
 */
export function getPortOneStoreId(): string {
  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
  
  if (!storeId) {
    throw new Error(
      '포트원 스토어 ID가 설정되지 않았습니다. NEXT_PUBLIC_PORTONE_STORE_ID 환경 변수를 설정해주세요.'
    );
  }

  return storeId;
}

/**
 * 결제 요청 타입
 */
export interface PortOnePaymentRequest {
  amount: number; // 결제 금액 (원)
  orderId: string; // 주문 ID (고유값)
  orderName: string; // 주문명
  customerName?: string; // 고객명
  customerEmail?: string; // 고객 이메일
  customerMobilePhone?: string; // 고객 전화번호
  successUrl?: string; // 결제 성공 후 리다이렉트 URL
  failUrl?: string; // 결제 실패 후 리다이렉트 URL
  customData?: Record<string, any>; // 추가 데이터
}

/**
 * 결제 응답 타입
 */
export interface PortOnePaymentResponse {
  code: string; // 응답 코드 ('SUCCESS' 등)
  message: string; // 응답 메시지
  paymentId?: string; // 결제 ID
  orderId?: string; // 주문 ID
  amount?: number; // 결제 금액
  [key: string]: any; // 기타 응답 데이터
}

/**
 * 포트원 결제 요청
 * 
 * @param request 결제 요청 정보
 * @returns 결제 응답
 */
export async function requestPortOnePayment(
  request: PortOnePaymentRequest
): Promise<PortOnePaymentResponse> {
  try {
    const PortOne = await loadPortOneSDK();
    const storeId = getPortOneStoreId();

    // 포트원 결제 인스턴스 생성
    const payment = PortOne.Payment({
      storeId,
    });

    // 기본 URL 설정 (없을 경우 현재 페이지 기준)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const successUrl = request.successUrl || `${baseUrl}/profile/payment/success`;
    const failUrl = request.failUrl || `${baseUrl}/profile/payment/fail`;

    // 결제 요청
    const response = await payment.requestPayment({
      amount: request.amount,
      orderId: request.orderId,
      orderName: request.orderName,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      customerMobilePhone: request.customerMobilePhone,
      successUrl,
      failUrl,
      customData: request.customData,
    });

    return response as PortOnePaymentResponse;
  } catch (error: any) {
    console.error('포트원 결제 요청 실패:', error);
    throw new Error(error.message || '결제 요청 중 오류가 발생했습니다.');
  }
}

/**
 * 결제 검증 (서버 사이드)
 * 
 * 주의: 이 함수는 서버 사이드에서만 사용해야 합니다.
 * 클라이언트에서 결제 검증을 하면 보안 문제가 발생할 수 있습니다.
 */
export async function verifyPortOnePayment(
  paymentId: string,
  orderId: string
): Promise<boolean> {
  // TODO: 서버 API로 결제 검증 요청
  // 클라이언트에서 직접 검증하지 않고, 서버 API를 통해 검증해야 합니다.
  const response = await fetch('/api/payment/portone/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentId,
      orderId,
    }),
  });

  const result = await response.json();
  return result.success === true;
}

