# 공공데이터포털 API 통합 가이드

SafeMeals 프로젝트에서 사용하는 3개의 공공데이터 REST API 통합 문서입니다.

## 📋 목차

1. [환경 설정](#환경-설정)
2. [API 목록](#api-목록)
3. [사용법](#사용법)
4. [테스트](#테스트)
5. [에러 처리](#에러-처리)

---

## 환경 설정

### 1. 환경 변수 설정

`.env.local` 파일에 공공데이터 인증키가 이미 추가되어 있습니다:

```bash
# 통합 인증키 (한식진흥원, 푸드QR 공통 사용)
PUBLIC_DATA_KEY="d7e51ef2bb9122f38d66a1144dd050fafe49a6a5fd830df54b43f389cceb57ba"

# HACCP 전용 API 키 (통합키로 안되면 이 키 사용)
HACCP_API_KEY="e2d56042ec204181973d"
```

**키 우선순위**:
- HACCP API: `HACCP_API_KEY` → `PUBLIC_DATA_KEY` (fallback)
- 한식진흥원 API: `PUBLIC_DATA_KEY`
- 푸드QR API: `PUBLIC_DATA_KEY`

### 2. 라이브러리 임포트

```typescript
import {
  getHACCPProducts,
  getKoreanFoodIngredients,
  getFoodQRInfo,
  searchProductByBarcode,
  searchProductByName,
} from '@/lib/public-data-api';
```

---

## API 목록

### 1️⃣ HACCP 제품이미지 및 포장지표기정보 API

**용도**: 가공식품 바코드 스캔 후 제품 정보 조회

**제공 데이터**:
- 제품명, 제조사명
- 제품 이미지 URL
- 원재료명, 영양성분
- 알레르기 유발물질
- 내용량, 유통기한

**Base URL**: `http://apis.data.go.kr/B553748/CertImgListServiceV3/getCertImgListServiceV3`

**인증 방식**: Query Parameter (`serviceKey`)

---

### 2️⃣ 한식진흥원 아카이브 레시피 재료정보 API

**용도**: 재료명 표준화 및 `ingredients` 테이블 구축

**제공 데이터**:
- 레시피명
- 재료명, 재료분류
- 재료량

**Base URL**: `https://api.odcloud.kr/api/15136610/v1/uddi:cdae3642-8160-45f7-85bd-859ddb76958e`

**인증 방식**: Header (`Authorization: Infuser {API_KEY}`)

---

### 3️⃣ 식품의약품안전처 푸드QR 정보 서비스 API

**용도**: 최신 가공식품 e-라벨 정보 확인

**제공 데이터**:
- 제품명, 업소명
- 원재료명, 알레르기
- 영양성분, 내용량
- 유통기한, 바코드

**Base URL**: `https://apis.data.go.kr/1471000/FoodQrInfoService01/getFoodQrInfo`

**인증 방식**: Query Parameter (`serviceKey`)

---

## 사용법

### 1. HACCP 제품 정보 조회

```typescript
// 바코드로 검색
const result = await getHACCPProducts({
  barcode: '8801234567890',
  numOfRows: 10,
});

// 제품명으로 검색
const result = await getHACCPProducts({
  productName: '콜라',
  pageNo: 1,
  numOfRows: 10,
});

// 전체 목록 조회 (페이지네이션)
const result = await getHACCPProducts({
  pageNo: 1,
  numOfRows: 100,
});
```

**응답 예시**:
```json
{
  "header": {
    "resultCode": "00",
    "resultMsg": "NORMAL SERVICE"
  },
  "body": {
    "items": [
      {
        "prdlstReportNo": "20190012345",
        "prdlstNm": "코카콜라",
        "manufacturerNm": "코카콜라음료(주)",
        "imgUrl1": "https://...",
        "rawmtrl": "정제수, 설탕, 이산화탄소...",
        "allergy": "없음",
        "capacity": "355ml"
      }
    ],
    "totalCount": 1,
    "pageNo": 1,
    "numOfRows": 10
  }
}
```

---

### 2. 한식진흥원 레시피 재료정보 조회

```typescript
// 첫 페이지 10개 조회
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

**응답 예시**:
```json
{
  "page": 1,
  "perPage": 10,
  "totalCount": 5234,
  "currentCount": 10,
  "data": [
    {
      "레시피명": "김치찌개",
      "재료명": "돼지고기",
      "재료분류": "육류",
      "재료량": "200g"
    }
  ]
}
```

---

### 3. 푸드QR 정보 조회

```typescript
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

**응답 예시**:
```json
{
  "header": {
    "resultCode": "00",
    "resultMsg": "NORMAL SERVICE"
  },
  "body": {
    "items": [
      {
        "PRDLST_NM": "칠성사이다",
        "BSSH_NM": "롯데칠성음료(주)",
        "RAWMTRL_NM": "정제수, 설탕...",
        "ALLERGY": "없음",
        "BARCODE": "8801234567890"
      }
    ],
    "totalCount": 1
  }
}
```

---

### 4. 통합 검색 함수

#### 바코드로 통합 검색 (HACCP + 푸드QR 동시 조회)

```typescript
const result = await searchProductByBarcode('8801234567890');

console.log(result);
// {
//   haccp: { header: {...}, body: {...} },
//   foodQR: { header: {...}, body: {...} },
//   errors: { haccp: null, foodQR: null }
// }
```

#### 제품명으로 통합 검색

```typescript
const result = await searchProductByName('콜라');

// HACCP과 푸드QR 두 API 결과를 동시에 반환
if (result.haccp && result.haccp.body.totalCount > 0) {
  console.log('HACCP에서 찾은 제품:', result.haccp.body.items);
}

if (result.foodQR && result.foodQR.body.totalCount > 0) {
  console.log('푸드QR에서 찾은 제품:', result.foodQR.body.items);
}
```

---

## 테스트

### 로컬 개발 서버에서 테스트

개발 서버를 실행한 후:

```bash
npm run dev
```

브라우저에서 다음 URL로 접속하여 테스트:

#### 1. HACCP API 테스트
```
http://localhost:3000/api/test/public-data?api=haccp
```

#### 2. 한식진흥원 API 테스트
```
http://localhost:3000/api/test/public-data?api=korean-food
```

#### 3. 푸드QR API 테스트
```
http://localhost:3000/api/test/public-data?api=food-qr
```

#### 4. 바코드 통합 검색 테스트
```
http://localhost:3000/api/test/public-data?api=search-barcode&barcode=8801234567890
```

#### 5. 제품명 통합 검색 테스트
```
http://localhost:3000/api/test/public-data?api=search-name&name=콜라
```

### 테스트 결과 확인

성공 시:
```json
{
  "success": true,
  "api": "haccp",
  "timestamp": "2026-01-02T10:30:00.000Z",
  "data": { ... }
}
```

실패 시:
```json
{
  "success": false,
  "error": "API Error message",
  "timestamp": "2026-01-02T10:30:00.000Z"
}
```

---

## 에러 처리

### 공통 에러 처리 패턴

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
  console.log('찾은 제품:', products);

} catch (error) {
  console.error('네트워크 오류:', error);
}
```

### 통합 검색 에러 처리

```typescript
const result = await searchProductByBarcode('8801234567890');

// HACCP API 실패 시
if (result.errors.haccp) {
  console.error('HACCP API 오류:', result.errors.haccp);
}

// 푸드QR API 실패 시
if (result.errors.foodQR) {
  console.error('푸드QR API 오류:', result.errors.foodQR);
}

// 둘 다 성공한 경우에만 처리
if (result.haccp && result.foodQR) {
  console.log('두 API 모두 성공');
}
```

---

## 실전 활용 예시

### 바코드 스캔 후 제품 정보 통합 조회

```typescript
async function handleBarcodeScanned(barcode: string) {
  try {
    // HACCP + 푸드QR 동시 조회
    const result = await searchProductByBarcode(barcode);

    // HACCP 우선 사용
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

    // HACCP에 없으면 푸드QR 사용
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

    // 둘 다 없으면 null
    return null;

  } catch (error) {
    console.error('제품 정보 조회 실패:', error);
    return null;
  }
}
```

---

## ⚠️ 주의사항

1. **농림수산식품교육문화정보원 레시피 API는 REST가 아닙니다**
   - 웹페이지 링크(LINK)로만 제공
   - 엑셀/CSV 파일 다운로드 후 DB에 직접 업로드 필요
   - URL: http://data.mafra.go.kr/opendata/data/indexOpenDataDetail.do?data_id=20150827000000000464

2. **API 호출 제한**
   - 공공데이터포털 API는 일일 호출 횟수 제한이 있을 수 있음
   - 과도한 요청 시 429 에러 발생 가능
   - 캐싱 전략 권장

3. **환경 변수 보안**
   - `PUBLIC_DATA_KEY`는 서버 사이드에서만 사용 권장
   - 클라이언트에 노출 시 악용 가능성 있음
   - Next.js API Route에서 호출하는 것이 안전

---

## 다음 단계

- [ ] 바코드 스캔 기능과 통합
- [ ] 제품 정보 캐싱 구현 (Redis/Supabase)
- [ ] 알레르기 성분 파싱 및 분석
- [ ] 재료명 표준화 DB 구축 (한식진흥원 데이터 활용)
- [ ] 농림수산식품교육문화정보원 데이터 CSV 다운로드 및 DB Import

---

**작성일**: 2026-01-02
**버전**: 1.0.0
**담당자**: SafeMeals 개발팀
