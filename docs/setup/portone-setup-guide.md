# 포트원(PortOne) 결제 시스템 설정 가이드

## 1. 포트원 회원가입 및 가맹점 등록

### Step 1: 포트원 가입
1. [포트원 홈페이지](https://portone.io/) 접속
2. **회원가입** 클릭
3. 이메일 인증 완료
4. 사업자 정보 입력

### Step 2: 가맹점 생성
1. 대시보드 로그인
2. **설정 → 내 식별코드** 메뉴 이동
3. **가맹점 식별코드(Store ID)** 확인 및 복사

### Step 3: 채널 생성
1. **결제 연동 → 채널 관리** 메뉴 이동
2. **채널 추가하기** 클릭
3. PG사 선택 (예: KG이니시스, 나이스페이, 토스페이먼츠 등)
4. **채널 키(Channel Key)** 발급 및 복사

### Step 4: API Secret 키 발급
1. **개발자 센터 → API Keys** 메뉴 이동
2. **시크릿 키 발급** 클릭
3. **API Secret** 복사 (⚠️ 한 번만 표시되므로 반드시 안전하게 보관!)

---

## 2. 환경 변수 설정

### `.env.local` 파일에 추가

프로젝트 루트의 `apps/web/.env.local` 파일에 다음 내용을 추가하세요:

```bash
# ==========================================
# 포트원(PortOne) 결제 시스템 설정
# ==========================================

# 가맹점 식별코드 (Store ID)
# 포트원 대시보드 → 설정 → 내 식별코드에서 확인
NEXT_PUBLIC_PORTONE_STORE_ID=imp12345678

# 채널 키 (Channel Key)
# 포트원 대시보드 → 결제 연동 → 채널 관리에서 확인
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# API Secret (서버 전용 - 절대 노출 금지!)
# 포트원 대시보드 → 개발자 센터 → API Keys에서 발급
PORTONE_API_SECRET=your-secret-key-here
```

### ⚠️ 보안 주의사항

1. **PORTONE_API_SECRET**는 절대 클라이언트에 노출되지 않도록 주의
   - `NEXT_PUBLIC_` 접두사를 붙이지 마세요!
   - Git에 커밋하지 마세요! (`.gitignore`에 `.env.local` 추가됨)

2. **테스트 환경과 운영 환경 분리**
   - 개발: 포트원 테스트 모드 사용
   - 운영: 포트원 라이브 모드 사용

---

## 3. 테스트 결제 설정

### 포트원 테스트 모드 활성화

1. 포트원 대시보드 → **설정 → 시스템 설정**
2. **테스트 모드** ON
3. 테스트용 PG사 계정 연동

### 테스트 카드 번호

포트원 테스트 모드에서 사용 가능한 카드:

| PG사 | 카드번호 | 유효기간 | CVC |
|------|---------|---------|-----|
| KG이니시스 | 5570-1234-1234-1234 | 12/25 | 123 |
| 나이스페이 | 4012-0000-0000-0000 | 12/25 | 123 |
| 토스페이먼츠 | 4000-0000-0000-0000 | 12/25 | 123 |

---

## 4. 웹훅(Webhook) 설정 (선택사항)

결제 상태 변경 시 서버로 자동 알림을 받으려면:

### Step 1: 웹훅 URL 등록
1. 포트원 대시보드 → **개발자 센터 → 웹훅**
2. **웹훅 URL 추가**
3. URL: `https://your-domain.com/api/payment/webhook`

### Step 2: 웹훅 이벤트 선택
- ✅ 결제 완료 (payment.paid)
- ✅ 결제 실패 (payment.failed)
- ✅ 결제 취소 (payment.cancelled)

### Step 3: 웹훅 검증 키 확인
- **웹훅 시크릿** 복사 후 `.env.local`에 추가:
```bash
PORTONE_WEBHOOK_SECRET=your-webhook-secret
```

---

## 5. 실제 운영 환경 설정

### 라이브 모드 전환 체크리스트

- [ ] 사업자 등록증 제출 완료
- [ ] PG사 심사 완료
- [ ] 정산 계좌 등록 완료
- [ ] 테스트 결제 정상 작동 확인
- [ ] 포트원 대시보드에서 **테스트 모드 OFF**
- [ ] 환경 변수를 라이브 키로 변경
- [ ] SSL 인증서 적용 (HTTPS 필수)

### 운영 환경 `.env.production`

```bash
# 운영 환경용 포트원 설정
NEXT_PUBLIC_PORTONE_STORE_ID=imp_live_xxxxxxxx
NEXT_PUBLIC_PORTONE_CHANNEL_KEY=channel-key-live-xxxx
PORTONE_API_SECRET=live-secret-key-here
PORTONE_WEBHOOK_SECRET=live-webhook-secret
```

---

## 6. 문제 해결 (Troubleshooting)

### 결제창이 뜨지 않는 경우
1. 브라우저 콘솔에서 에러 확인
2. `NEXT_PUBLIC_PORTONE_STORE_ID`와 `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` 확인
3. 포트원 SDK가 정상적으로 로드되었는지 확인

### "인증되지 않은 가맹점" 에러
- Store ID와 Channel Key가 일치하는지 확인
- 포트원 대시보드에서 채널 상태 확인 (활성화 여부)

### 결제는 성공했는데 DB에 저장 안 되는 경우
- `PORTONE_API_SECRET` 확인 (서버 전용)
- Supabase RLS 정책 확인
- 서버 로그 확인: `console.error('[Payment Verify]')`

### 웹훅이 동작하지 않는 경우
- 웹훅 URL이 HTTPS인지 확인
- 웹훅 URL이 공개 접근 가능한지 확인 (localhost는 불가)
- 포트원 대시보드에서 웹훅 로그 확인

---

## 7. 유용한 링크

- [포트원 공식 문서](https://developers.portone.io/)
- [포트원 SDK 가이드](https://developers.portone.io/docs/ko/sdk/javascript-sdk)
- [포트원 API 레퍼런스](https://developers.portone.io/api/rest-v2)
- [포트원 테스트 카드](https://developers.portone.io/docs/ko/ready/test)
- [포트원 고객센터](https://portone.channel.io/)
