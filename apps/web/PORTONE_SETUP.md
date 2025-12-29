# 포트원 결제 시스템 설정 가이드

## 📦 1. 패키지 설치

```bash
cd apps/web
npm install @portone/browser-sdk
```

## 🔑 2. 환경 변수 설정

`.env.local` 파일에 포트원 스토어 ID를 추가하세요:

```bash
# 포트원 스토어 ID (포트원 관리자 페이지에서 확인)
NEXT_PUBLIC_PORTONE_STORE_ID=your_store_id_here
```

## 🏗️ 3. 구현된 구조

### 파일 구조
```
apps/web/src/
├── lib/
│   └── payment/
│       └── portone.ts              # 포트원 유틸리티
├── hooks/
│   └── usePortOne.ts               # 포트원 결제 훅
├── app/
│   ├── api/
│   │   └── payment/
│   │       └── portone/
│   │           └── verify/
│   │               └── route.ts     # 결제 검증 API
│   └── profile/
│       └── payment/
│           ├── success/
│           │   └── page.tsx        # 결제 성공 페이지
│           └── fail/
│               └── page.tsx        # 결제 실패 페이지
└── features/
    └── profile/
        └── components/
            └── settings/
                └── payment/
                    └── components/
                        └── travel-pass-confirm-dialog.tsx  # 여행 기간권 결제 다이얼로그
```

## 🚀 4. 사용 방법

### Travel Pass 결제 예시

`travel-pass-confirm-dialog.tsx`에서 이미 구현되어 있습니다:

```typescript
import { usePortOne } from '@/hooks/usePortOne';

const { isProcessing, requestPayment } = usePortOne();

// 결제 요청
const response = await requestPayment({
  amount: 10000,
  orderId: 'unique-order-id',
  orderName: '여행 기간권 (7일)',
  customerName: '홍길동',
  customerEmail: 'user@example.com',
});
```

## 🔐 5. 결제 검증 (서버 사이드)

결제 검증은 서버 사이드에서만 수행해야 합니다.

`/api/payment/portone/verify` API를 사용하세요:

```typescript
// 클라이언트에서
const response = await fetch('/api/payment/portone/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentId: 'payment-id',
    orderId: 'order-id',
  }),
});
```

## ⚠️ 6. 주의사항

1. **환경 변수**: `NEXT_PUBLIC_PORTONE_STORE_ID`는 반드시 설정해야 합니다.
2. **결제 검증**: 클라이언트에서 직접 검증하지 마세요. 서버 API를 통해 검증하세요.
3. **주문 ID**: 고유한 주문 ID를 생성해야 합니다. (현재: `travel-pass-${Date.now()}-${random}`)
4. **에러 처리**: 결제 실패 시 사용자에게 적절한 메시지를 표시하세요.

## 📝 7. TODO

- [ ] 포트원 서버 API를 사용한 실제 결제 검증 구현 (`/api/payment/portone/verify/route.ts`)
- [ ] 사용자 정보에서 customerName, customerEmail 가져오기
- [ ] 결제 내역 저장 (Supabase 등)
- [ ] 결제 내역 조회 기능
- [ ] 결제 취소 기능

## 🔗 참고 링크

- [포트원 공식 문서](https://developers.portone.io/)
- [포트원 SDK 문서](https://developers.portone.io/docs/v2)

