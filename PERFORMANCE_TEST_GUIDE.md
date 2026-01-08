# OCR 스캔 성능 최적화 - 테스트 가이드

## 📋 최적화 적용 사항

### ✅ 완료된 작업

1. **프롬프트 간소화** (Phase 1)
   - 130줄 프롬프트 → ai-prompt-optimizer.ts 사용
   - Fast 모드: ~500 토큰 (58% 감소)
   - 파일: `apps/web/src/app/api/scan/analyze/route.ts`

2. **OCR 전략 최적화** (Phase 2)
   - Promise.race 제거 (비용 2배 낭비 방지)
   - Google Vision만 사용
   - 파일: `apps/web/.env.local`

3. **이미지 자동 압축** (Phase 3)
   - 클라이언트에서 500KB 이상 이미지 자동 압축
   - 파일: `apps/web/src/features/scan/components/menu-scan/hooks/useAnalyzeSubmit.hook.ts`

---

## 🧪 테스트 방법

### 1. 환경 설정 확인

`.env.local` 파일에서 다음 설정을 확인하세요:

```bash
# OCR 전략: Google Vision만 사용
OCR_STRATEGY=google-vision

# 프롬프트 모드: Fast (토큰 절감)
PROMPT_MODE=fast

# Google Cloud Vision API 키 (필수)
GOOGLE_CLOUD_VISION_API_KEY=AIzaSyAJi09ftC869JASaqxy_rmMBoCzbhsm_rs

# Gemini API 키 (필수)
GEMINI_API_KEY=AIzaSyBC2OkWyPdWhNKP9esGWD-s4Kb9q1XiEQI
```

### 2. 서버 재시작

환경 변수 변경을 반영하기 위해 서버를 재시작합니다:

```bash
# 기존 서버 중지 (Ctrl+C)

# 서버 재시작
cd apps/web
pnpm dev
```

### 3. 브라우저 개발자 도구 준비

1. Chrome/Edge 브라우저에서 개발자 도구 열기 (F12 또는 Cmd+Option+I)
2. **Console** 탭 열기
3. **Network** 탭도 열어두기 (네트워크 성능 확인용)

---

## 📊 성능 측정 체크리스트

### A. 콘솔 로그에서 확인할 사항

메뉴판을 스캔한 후 브라우저 콘솔에서 다음을 확인하세요:

#### 1. 이미지 압축 확인
```
📦 이미지 최적화 시작...
✅ 이미지 압축 완료: 850KB → 120KB (7.1배 감소)
또는
✅ 이미지 크기 적절 (450KB), 압축 불필요
```

#### 2. 프롬프트 모드 확인
```
📝 프롬프트 모드: fast
📝 프롬프트 길이: ~500 토큰
```

#### 3. OCR 성능 확인
```
🔍 Google Cloud Vision OCR 시작...
✅ Google Cloud Vision OCR 완료 (0.52초)
  추출된 텍스트 길이: 245 자
```

#### 4. AI 분석 시간 확인
```
🤖 AI 분석 시작...
✅ AI 분석 완료 (12.34초)  ← 이 시간이 27초 → 10~15초로 단축되어야 함
```

#### 5. 전체 처리 시간 확인
```
⏱️ 성능 측정 결과:
  - 인증 및 사용자 정보 조회: 0.12초
  - 이미지 압축: 0.05초
  - 캐시 확인: 0.01초
  - OCR 텍스트 추출: 0.52초
  - AI 분석: 12.34초  ← 주요 측정 대상
  - 총 처리 시간: 13.04초  ← 28초 → 11~16초 목표
```

### B. Network 탭에서 확인할 사항

1. **Request Payload 크기 확인**
   - `/api/scan/analyze` 요청 클릭
   - Payload 탭에서 `image` 크기 확인
   - ✅ 목표: 500KB 이하 (압축된 경우)

2. **Response 시간 확인**
   - Time 컬럼에서 응답 시간 확인
   - ✅ 목표: 15초 이하

---

## 📈 성능 비교표

테스트 결과를 아래 표에 기록하세요:

| 항목 | 최적화 전 (예상) | 최적화 후 (실제) | 개선율 |
|------|-----------------|-----------------|--------|
| **프롬프트 토큰** | ~1,200 | ~500 | ? |
| **이미지 크기** | 500KB+ | ? KB | ? |
| **OCR 시간** | 0.52초 | ? 초 | ? |
| **AI 분석 시간** | 27초 | ? 초 | ? |
| **총 응답 시간** | 28초 | ? 초 | ? |

---

## 🎯 성공 기준

다음 조건을 만족하면 최적화 성공입니다:

- ✅ **AI 분석 시간**: 15초 이하
- ✅ **총 응답 시간**: 16초 이하
- ✅ **이미지 크기**: 500KB 이하 (큰 이미지의 경우)
- ✅ **프롬프트 모드**: `fast` 로 표시
- ✅ **OCR 전략**: `google-vision` 로 표시
- ✅ **정확도**: 알레르기 검출 정확도 유지

---

## 🔍 정확도 검증 (A/B 테스트)

### 동일한 메뉴판으로 2번 테스트

1. **Fast 모드 테스트** (현재 설정)
   - `.env.local`에서 `PROMPT_MODE=fast`
   - 서버 재시작
   - 메뉴판 스캔
   - 결과 스크린샷 저장 (특히 알레르기 경고)

2. **Accurate 모드 테스트** (비교용)
   - `.env.local`에서 `PROMPT_MODE=accurate`
   - 서버 재시작
   - **동일한 메뉴판** 스캔
   - 결과 스크린샷 저장

3. **비교 확인**
   - 두 결과가 동일한가?
   - 알레르기 경고가 일치하는가?
   - 메뉴 인식 수가 같은가?

---

## ❌ 문제 해결

### 문제: AI 분석 시간이 여전히 느림 (20초 이상)

**원인**:
- 프롬프트 모드가 `accurate`로 되어있음
- 환경 변수가 반영되지 않음

**해결**:
1. `.env.local`에서 `PROMPT_MODE=fast` 확인
2. 서버 재시작 (Ctrl+C 후 `pnpm dev`)
3. 브라우저 콘솔에서 `📝 프롬프트 모드: fast` 확인

---

### 문제: 이미지가 압축되지 않음

**원인**:
- 원본 이미지가 이미 500KB 이하
- 또는 압축 로직이 작동하지 않음

**확인**:
1. 브라우저 콘솔에서 `📦 이미지 최적화 시작...` 로그 확인
2. Network 탭에서 Request Payload 크기 확인
3. 큰 이미지(1MB 이상)로 테스트

---

### 문제: OCR이 작동하지 않음

**원인**:
- Google Cloud Vision API 키 오류
- 또는 OCR_STRATEGY 설정 오류

**해결**:
1. `.env.local`에서 `GOOGLE_CLOUD_VISION_API_KEY` 확인
2. `.env.local`에서 `OCR_STRATEGY=google-vision` 확인
3. 서버 재시작
4. 콘솔에서 `🔍 Google Cloud Vision OCR 시작...` 로그 확인

---

## 📝 테스트 결과 보고

테스트 완료 후 다음 정보를 기록하세요:

```
테스트 일시: 2026-01-07

### 환경
- PROMPT_MODE: fast
- OCR_STRATEGY: google-vision
- 테스트 메뉴판: [메뉴판 이름 또는 설명]

### 성능 측정 결과
- 이미지 압축: [원본 크기]KB → [압축 크기]KB
- OCR 시간: [X.XX]초
- AI 분석 시간: [XX.XX]초
- 총 응답 시간: [XX.XX]초

### 정확도 검증
- Fast 모드 결과: [스크린샷 또는 설명]
- Accurate 모드 결과: [스크린샷 또는 설명]
- 차이점: [있음/없음]

### 결론
- 최적화 성공 여부: [성공/실패]
- 개선율: AI 분석 시간 [XX]% 단축
- 정확도: [유지됨/저하됨]
```

---

## 🚀 다음 단계

테스트 결과가 만족스러우면:

1. ✅ 변경사항을 main 브랜치에 병합
2. ✅ 프로덕션 배포
3. ✅ 모니터링 설정 (사용자 피드백 수집)

테스트 결과가 불만족스러우면:

1. ❌ PROMPT_MODE를 `accurate`로 되돌림
2. ❌ 추가 최적화 방안 검토
3. ❌ 다른 접근 방식 시도

---

## 📧 문의

테스트 중 문제가 발생하면:
- GitHub Issue 생성
- 콘솔 로그 전체 복사
- Network 탭 스크린샷 첨부
