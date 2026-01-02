# SafeMeals 공공데이터 API 통합 요약

SafeMeals 프로젝트에 통합된 공공데이터 API 전체 정리 문서입니다.

---

## 📊 API 현황 요약

### REST API (코드로 호출 가능) - 3개

| # | API명 | 용도 | 상태 | 인증키 |
|---|-------|------|------|--------|
| 1 | HACCP 제품이미지 | 가공식품 바코드 스캔 | ❌ 401 오류 | `HACCP_API_KEY` |
| 2 | 한식진흥원 레시피 재료 | 재료명 표준화 DB 구축 | ✅ 정상 작동 | `PUBLIC_DATA_KEY` |
| 3 | 푸드QR 정보 | e-라벨 정보 조회 | ❌ 401 오류 | `PUBLIC_DATA_KEY` |

### LINK (수동 다운로드) - 2개

| # | API명 | 용도 | 처리 방법 |
|---|-------|------|----------|
| 4 | 농림수산식품교육문화정보원 레시피 | 요리 기본 정보 | CSV 다운로드 → DB Import |
| 5 | 농촌진흥청 인삼레시피 | 인삼 특화 레시피 | CSV 다운로드 → DB Import |

---

## 1️⃣ HACCP 제품이미지 및 포장지표기정보 API

### 기본 정보

**제공 기관:** 한국식품안전관리인증원
**API 유형:** REST (GET)
**인증 방식:** Query Parameter (`serviceKey`)
**응답 형식:** JSON, XML

### API 엔드포인트

```
Base URL: http://apis.data.go.kr/B553748/CertImgListServiceV3
Endpoint: /getCertImgListServiceV3
```

### 전체 URL 예시

```
http://apis.data.go.kr/B553748/CertImgListServiceV3/getCertImgListServiceV3?serviceKey={HACCP_API_KEY}&returnType=json&pageNo=1&numOfRows=10
```

### 요청 파라미터

| 파라미터 | 필수 | 타입 | 설명 | 예시 |
|---------|------|------|------|------|
| `serviceKey` | ✅ | String | 인증키 | `e2d56042ec204181973d` |
| `returnType` | ✅ | String | 응답 형식 | `json` |
| `pageNo` | ❌ | Number | 페이지 번호 | `1` |
| `numOfRows` | ❌ | Number | 한 페이지 결과 수 | `10` |
| `barcode` | ❌ | String | 바코드 번호 | `8801234567890` |
| `prdlstNm` | ❌ | String | 제품명 | `콜라` |

### 응답 데이터 구조

```typescript
{
  header: {
    resultCode: "00",      // 00 = 정상
    resultMsg: "NORMAL SERVICE"
  },
  body: {
    items: [
      {
        prdlstReportNo: "20190012345",  // 품목제조번호
        prdlstNm: "코카콜라",            // 제품명
        manufacturerNm: "코카콜라음료(주)", // 제조사명
        imgUrl1: "https://...",         // 제품 이미지 URL 1
        imgUrl2: "https://...",         // 제품 이미지 URL 2
        rawmtrl: "정제수, 설탕, ...",    // 원재료명
        nutrient: "열량 43kcal...",     // 영양성분
        allergy: "없음",                // 알레르기 유발물질
        capacity: "355ml",              // 내용량
        distributionPeriod: "제조일로부터 12개월" // 유통기한
      }
    ],
    totalCount: 1234,
    pageNo: 1,
    numOfRows: 10
  }
}
```

### 사용 예시 (TypeScript)

```typescript
import { getHACCPProducts } from '@/lib/public-data-api';

// 바코드로 검색
const result = await getHACCPProducts({
  barcode: '8801234567890',
});

// 제품명으로 검색
const result = await getHACCPProducts({
  productName: '콜라',
  pageNo: 1,
  numOfRows: 10,
});
```

### 현재 상태

**❌ 401 Unauthorized 오류**

```
Error: HACCP API Error: 401 Unauthorized
```

**원인:**
- API 키 인증 실패
- 인코딩/디코딩 키 중 잘못된 키 사용 가능성
- API 활용신청 미승인 상태일 수 있음

**해결 방법:**
1. 공공데이터포털 마이페이지에서 API 활용신청 상태 확인
2. **일반 인증키 (Encoding)** vs **디코딩된 인증키 (Decoding)** 확인
3. 올바른 키로 `.env.local`의 `HACCP_API_KEY` 업데이트

---

## 2️⃣ 한식진흥원 아카이브 레시피 재료정보 API

### 기본 정보

**제공 기관:** 한식진흥원
**API 유형:** REST (GET)
**인증 방식:** Header (`Authorization: Infuser {KEY}`)
**응답 형식:** JSON

### API 엔드포인트

```
Base URL: https://api.odcloud.kr/api
Endpoint: /15136610/v1/uddi:cdae3642-8160-45f7-85bd-859ddb76958e
```

### 전체 URL 예시

```
https://api.odcloud.kr/api/15136610/v1/uddi:cdae3642-8160-45f7-85bd-859ddb76958e?page=1&perPage=10
```

### 요청 파라미터

| 파라미터 | 필수 | 타입 | 설명 | 예시 |
|---------|------|------|------|------|
| `page` | ✅ | Number | 페이지 번호 | `1` |
| `perPage` | ✅ | Number | 한 페이지 결과 수 (최대 1000) | `10` |

### 요청 헤더

```
Authorization: Infuser d7e51ef2bb9122f38d66a1144dd050fafe49a6a5fd830df54b43f389cceb57ba
```

### 응답 데이터 구조

```typescript
{
  page: 1,
  perPage: 10,
  totalCount: 5234,
  currentCount: 10,
  matchCount: 5234,
  data: [
    {
      레시피명: "김치찌개",
      재료명: "돼지고기",
      재료분류: "육류",
      재료량: "200g"
    }
  ]
}
```

### 사용 예시 (TypeScript)

```typescript
import { getKoreanFoodIngredients } from '@/lib/public-data-api';

// 기본 조회 (10개)
const result = await getKoreanFoodIngredients({
  page: 1,
  perPage: 10,
});

// 대량 데이터 조회 (최대 1000개)
const result = await getKoreanFoodIngredients({
  page: 1,
  perPage: 1000,
});
```

### 현재 상태

**✅ 정상 작동**

```
✅ 한식진흥원 API 성공: 5234개 데이터 조회 가능
```

**활용 방안:**
- `ingredients` 테이블 구축 (재료명 표준화)
- 레시피 데이터 DB Seeding
- 재료 분류 체계 구축

---

## 3️⃣ 식품의약품안전처 푸드QR 정보 서비스 API

### 기본 정보

**제공 기관:** 식품의약품안전처
**API 유형:** REST (GET)
**인증 방식:** Query Parameter (`serviceKey`)
**응답 형식:** JSON, XML

### API 엔드포인트

```
Base URL: https://apis.data.go.kr/1471000/FoodQrInfoService01
Endpoint: /getFoodQrInfo
```

### 전체 URL 예시

```
https://apis.data.go.kr/1471000/FoodQrInfoService01/getFoodQrInfo?serviceKey={PUBLIC_DATA_KEY}&returnType=json&pageNo=1&numOfRows=10
```

### 요청 파라미터

| 파라미터 | 필수 | 타입 | 설명 | 예시 |
|---------|------|------|------|------|
| `serviceKey` | ✅ | String | 인증키 | `d7e51ef2bb9122f38d66a1144dd050fafe49a6a5fd830df54b43f389cceb57ba` |
| `returnType` | ✅ | String | 응답 형식 | `json` |
| `pageNo` | ❌ | Number | 페이지 번호 | `1` |
| `numOfRows` | ❌ | Number | 한 페이지 결과 수 | `10` |
| `barcode` | ❌ | String | 바코드 번호 | `8801234567890` |
| `prdlstNm` | ❌ | String | 제품명 | `사이다` |

### 응답 데이터 구조

```typescript
{
  header: {
    resultCode: "00",
    resultMsg: "NORMAL SERVICE"
  },
  body: {
    items: [
      {
        PRDLST_NM: "칠성사이다",        // 제품명
        BSSH_NM: "롯데칠성음료(주)",    // 업소명
        RAWMTRL_NM: "정제수, 설탕...",  // 원재료명
        ALLERGY: "없음",               // 알레르기
        NUTR_CONT: "열량 45kcal...",   // 영양성분
        CAPACITY: "250ml",             // 내용량
        POG_DAYCNT: "제조일로부터 12개월", // 유통기한
        BARCODE: "8801234567890"       // 바코드
      }
    ],
    totalCount: 1,
    pageNo: 1,
    numOfRows: 10
  }
}
```

### 사용 예시 (TypeScript)

```typescript
import { getFoodQRInfo } from '@/lib/public-data-api';

// 바코드로 검색
const result = await getFoodQRInfo({
  barcode: '8801234567890',
});

// 제품명으로 검색
const result = await getFoodQRInfo({
  productName: '사이다',
  pageNo: 1,
  numOfRows: 10,
});
```

### 현재 상태

**❌ 401 Unauthorized 오류**

```
Error: Food QR API Error: 401 Unauthorized
```

**원인:**
- API 키 인증 실패 (HACCP와 동일한 문제)

**해결 방법:**
- HACCP API와 동일하게 올바른 인증키 확인 필요

---

## 4️⃣ 농림수산식품교육문화정보원 레시피 기본정보 (LINK)

### 기본 정보

**제공 기관:** 농림수산식품교육문화정보원
**API 유형:** ⚠️ LINK (단순 웹페이지 링크, REST API 아님)
**접근 방법:** 수동 다운로드

### 다운로드 URL

```
http://data.mafra.go.kr/opendata/data/indexOpenDataDetail.do?data_id=20150827000000000464
```

### 제공 데이터

- 레시피명
- 조리시간
- 칼로리
- 조리 방법
- 재료 정보

### 처리 방법

1. **수동 다운로드**
   - 위 URL로 브라우저 접속
   - 엑셀/CSV 파일 다운로드

2. **DB Import**
   - Supabase Database 접속
   - Table Editor → Import CSV
   - 또는 SQL 쿼리로 직접 INSERT

3. **데이터 정제**
   - 중복 데이터 제거
   - 필드 표준화
   - NULL 값 처리

### 현재 상태

**⏸️ 보류 (수동 작업 필요)**

---

## 5️⃣ 농촌진흥청 인삼레시피 (LINK)

### 기본 정보

**제공 기관:** 농촌진흥청
**API 유형:** ⚠️ LINK (단순 웹페이지 링크, REST API 아님)
**접근 방법:** 수동 다운로드

### 다운로드 URL

```
https://www.nongsaro.go.kr/portal/ps/psn/psnj/openApiLst.ps?menuId=PS65428&sText=인삼레시피
```

### 제공 데이터

- 인삼 관련 레시피
- 조리법
- 효능 정보

### 현재 상태

**⏸️ 보류 (필요시 추가)**

---

## 🔑 환경 변수 설정

### `.env.local` 파일

```bash
# 통합 인증키 (한식진흥원, 푸드QR 공통 사용)
PUBLIC_DATA_KEY="d7e51ef2bb9122f38d66a1144dd050fafe49a6a5fd830df54b43f389cceb57ba"

# HACCP 전용 API 키 (통합키로 안되면 이 키 사용)
HACCP_API_KEY="e2d56042ec204181973d"
```

### 키 사용 우선순위

| API | 1순위 | 2순위 (Fallback) |
|-----|-------|------------------|
| HACCP | `HACCP_API_KEY` | `PUBLIC_DATA_KEY` |
| 한식진흥원 | `PUBLIC_DATA_KEY` | - |
| 푸드QR | `PUBLIC_DATA_KEY` | - |

---

## 📁 구현된 파일 구조

```
apps/web/
├── src/
│   ├── lib/
│   │   └── public-data-api.ts              # API 클라이언트 라이브러리
│   └── app/
│       └── api/
│           └── test/
│               └── public-data/
│                   └── route.ts             # 테스트 엔드포인트
├── tests/
│   └── public-data-api.spec.ts             # Playwright 테스트
docs/
├── api/
│   ├── public-data-integration.md          # API 사용 가이드
│   └── public-data-api-summary.md          # 이 문서
└── testing/
    └── public-data-api-testing.md          # Playwright 테스트 가이드
```

---

## 🧪 테스트 현황

### Playwright 테스트 결과

**총 15개 테스트 (13.7초 소요)**

```
✅ 7개 통과
❌ 7개 실패
⏭️ 1개 스킵
```

### ✅ 성공한 테스트 (7개)

1. ✅ 한식진흥원 API: 재료정보 조회 성공
2. ✅ 한식진흥원 API: 대량 데이터 조회 (100개)
3. ✅ Next.js API: 한식진흥원 테스트
4. ✅ Next.js API: 바코드 통합 검색
5. ✅ Next.js API: 제품명 통합 검색
6. ✅ Next.js API: 잘못된 api 파라미터
7. ✅ Next.js API: barcode 파라미터 누락

### ❌ 실패한 테스트 (7개)

**모두 401 Unauthorized 오류**

1. ❌ HACCP API: 기본 목록 조회
2. ❌ HACCP API: 제품명으로 검색
3. ❌ 푸드QR API: 기본 목록 조회
4. ❌ 푸드QR API: 제품명으로 검색
5. ❌ Next.js API: HACCP 테스트
6. ❌ Next.js API: 푸드QR 테스트
7. ❌ 에러 테스트: 잘못된 키

---

## 🚀 통합 검색 함수

### 바코드로 통합 검색

```typescript
import { searchProductByBarcode } from '@/lib/public-data-api';

const result = await searchProductByBarcode('8801234567890');

// HACCP과 푸드QR 두 API를 동시에 호출 (Promise.allSettled)
console.log(result);
// {
//   haccp: { header: {...}, body: {...} },
//   foodQR: { header: {...}, body: {...} },
//   errors: { haccp: null, foodQR: null }
// }
```

### 제품명으로 통합 검색

```typescript
import { searchProductByName } from '@/lib/public-data-api';

const result = await searchProductByName('콜라');

// 두 API 결과를 동시에 반환
if (result.haccp && result.haccp.body.totalCount > 0) {
  console.log('HACCP에서 찾은 제품:', result.haccp.body.items);
}

if (result.foodQR && result.foodQR.body.totalCount > 0) {
  console.log('푸드QR에서 찾은 제품:', result.foodQR.body.items);
}
```

---

## 📊 API 활용 시나리오

### 시나리오 1: 바코드 스캔 후 제품 정보 조회

```typescript
async function handleBarcodeScanned(barcode: string) {
  // 1. HACCP + 푸드QR 동시 조회
  const result = await searchProductByBarcode(barcode);

  // 2. HACCP 우선 사용
  if (result.haccp?.body.totalCount > 0) {
    const product = result.haccp.body.items[0];
    return {
      name: product.prdlstNm,
      manufacturer: product.manufacturerNm,
      ingredients: product.rawmtrl,
      allergens: product.allergy,
      imageUrl: product.imgUrl1,
      source: 'HACCP',
    };
  }

  // 3. HACCP에 없으면 푸드QR 사용
  if (result.foodQR?.body.totalCount > 0) {
    const product = result.foodQR.body.items[0];
    return {
      name: product.PRDLST_NM,
      manufacturer: product.BSSH_NM,
      ingredients: product.RAWMTRL_NM,
      allergens: product.ALLERGY,
      source: 'FoodQR',
    };
  }

  return null; // 찾지 못함
}
```

### 시나리오 2: 재료명 표준화 DB 구축

```typescript
async function buildIngredientsDatabase() {
  let page = 1;
  const perPage = 1000;
  let hasMore = true;

  while (hasMore) {
    // 한식진흥원 API에서 대량 데이터 조회
    const result = await getKoreanFoodIngredients({ page, perPage });

    // Supabase에 저장
    for (const item of result.data) {
      await supabase.from('ingredients').insert({
        name: item.재료명,
        category: item.재료분류,
        standard_amount: item.재료량,
      });
    }

    hasMore = result.data.length === perPage;
    page++;
  }
}
```

---

## ⚠️ 주의사항

### 1. API 호출 제한

- 공공데이터포털 API는 **일일 호출 횟수 제한**이 있을 수 있음
- 과도한 요청 시 **429 Too Many Requests** 에러 발생 가능
- **캐싱 전략** 필수

### 2. 환경 변수 보안

- `PUBLIC_DATA_KEY`와 `HACCP_API_KEY`는 **서버 사이드에서만 사용** 권장
- 클라이언트에 노출 시 악용 가능성
- **Next.js API Route**에서 호출하는 것이 안전

### 3. 에러 처리

```typescript
try {
  const result = await getHACCPProducts({ barcode: '8801234567890' });

  if (result.header.resultCode !== '00') {
    console.error('API 오류:', result.header.resultMsg);
    return;
  }

  if (result.body.totalCount === 0) {
    console.log('검색 결과 없음');
    return;
  }

  // 정상 처리
  const products = result.body.items;

} catch (error) {
  console.error('네트워크 오류:', error);
}
```

---

## 🎯 다음 단계

### 1. 즉시 해결 필요 (긴급)

- [ ] **HACCP API 인증 오류 해결**
  - 공공데이터포털에서 올바른 인증키 확인
  - 인코딩/디코딩 키 중 올바른 것 사용
  - API 활용신청 승인 상태 확인

- [ ] **푸드QR API 인증 오류 해결**
  - HACCP와 동일한 방법으로 해결

### 2. 기능 구현

- [ ] **바코드 스캔 통합**
  - OCR → 바코드 추출 → 공공데이터 API 호출
  - 제품 정보 UI에 표시

- [ ] **제품 정보 캐싱**
  - Supabase에 조회 결과 저장
  - 재조회 시 캐시 우선 사용
  - 주기적 업데이트

- [ ] **알레르기 성분 분석**
  - 원재료명 파싱
  - 알레르기 성분 추출
  - 위험도 평가

### 3. 데이터 구축

- [ ] **재료명 표준화 DB**
  - 한식진흥원 데이터로 `ingredients` 테이블 구축
  - 재료 분류 체계 정립

- [ ] **레시피 데이터 Import**
  - 농림수산식품교육문화정보원 CSV 다운로드
  - DB Import

---

**작성일:** 2026-01-02
**버전:** 1.0.0
**상태:** HACCP/푸드QR 인증 오류 해결 필요
**담당자:** SafeMeals 개발팀
