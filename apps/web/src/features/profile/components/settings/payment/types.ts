export interface PaymentMethod {
  id: string;
  type: 'card';
  name: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

export interface PaymentMethodForm {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
}

/**
 * 결제 정보 타입
 */
export interface PaymentInfo {
  id: string; // 결제 ID
  orderId: string; // 주문 ID
  orderName: string; // 주문명
  amount: number; // 결제 금액
  status: 'pending' | 'completed' | 'failed' | 'cancelled'; // 결제 상태
  paymentMethod?: PaymentMethod; // 결제 수단
  createdAt: Date; // 결제 생성일
  completedAt?: Date; // 결제 완료일
  metadata?: Record<string, any>; // 추가 메타데이터
}

/**
 * 여행 기간권 결제 정보
 */
export interface TravelPassPaymentInfo {
  startDate: Date;
  endDate: Date;
  days: number;
  totalPrice: number;
  orderId: string;
}

