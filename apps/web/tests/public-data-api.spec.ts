import { test, expect } from '@playwright/test';

/**
 * 공공데이터 API 통합 테스트 (Playwright 기반)
 *
 * 테스트 대상:
 * 1. HACCP 제품이미지 및 포장지표기정보 API
 * 2. 한식진흥원 아카이브 레시피 재료정보 API
 * 3. 식품의약품안전처 푸드QR 정보 서비스 API
 *
 * 환경변수:
 * - PUBLIC_DATA_KEY: 통합 인증키
 * - HACCP_API_KEY: HACCP 전용 키 (선택)
 */

const PUBLIC_DATA_KEY = process.env.PUBLIC_DATA_KEY || 'd7e51ef2bb9122f38d66a1144dd050fafe49a6a5fd830df54b43f389cceb57ba';
const HACCP_API_KEY = process.env.HACCP_API_KEY || 'e2d56042ec204181973d';

test.describe('공공데이터 API 통합 테스트', () => {

  /**
   * 1. HACCP 제품이미지 및 포장지표기정보 API 테스트
   */
  test.describe('HACCP API 테스트', () => {
    const baseUrl = 'http://apis.data.go.kr/B553748/CertImgListServiceV3/getCertImgListServiceV3';

    test('HACCP API: 기본 목록 조회 성공', async ({ request }) => {
      const response = await request.get(baseUrl, {
        params: {
          serviceKey: HACCP_API_KEY,
          returnType: 'json',
          pageNo: '1',
          numOfRows: '5',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log('[HACCP API] 응답 데이터:', JSON.stringify(data, null, 2));

      // 응답 구조 검증
      expect(data).toHaveProperty('header');
      expect(data.header).toHaveProperty('resultCode');

      // 성공 코드 확인 (00 = 정상)
      if (data.header.resultCode === '00') {
        expect(data).toHaveProperty('body');
        expect(data.body).toHaveProperty('items');
        console.log(`✅ HACCP API 성공: ${data.body.totalCount}개 제품 조회됨`);
      } else {
        console.warn(`⚠️ HACCP API 오류: ${data.header.resultMsg}`);
      }
    });

    test('HACCP API: 제품명으로 검색', async ({ request }) => {
      const response = await request.get(baseUrl, {
        params: {
          serviceKey: HACCP_API_KEY,
          returnType: 'json',
          prdlstNm: '콜라', // 제품명 검색
          pageNo: '1',
          numOfRows: '3',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log('[HACCP API] 제품명 검색 결과:', JSON.stringify(data, null, 2));

      if (data.header.resultCode === '00' && data.body.totalCount > 0) {
        const firstProduct = data.body.items[0];
        console.log('✅ 찾은 제품:', {
          제품명: firstProduct.prdlstNm,
          제조사: firstProduct.manufacturerNm,
          원재료: firstProduct.rawmtrl?.substring(0, 100) + '...',
        });
      }
    });

    test.skip('HACCP API: 바코드로 검색 (실제 바코드 필요)', async ({ request }) => {
      // 실제 테스트용 바코드 번호가 필요합니다
      const testBarcode = '8801234567890';

      const response = await request.get(baseUrl, {
        params: {
          serviceKey: HACCP_API_KEY,
          returnType: 'json',
          barcode: testBarcode,
          pageNo: '1',
          numOfRows: '1',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      console.log('[HACCP API] 바코드 검색 결과:', JSON.stringify(data, null, 2));
    });
  });

  /**
   * 2. 한식진흥원 레시피 재료정보 API 테스트
   */
  test.describe('한식진흥원 API 테스트', () => {
    const baseUrl = 'https://api.odcloud.kr/api/15136610/v1/uddi:cdae3642-8160-45f7-85bd-859ddb76958e';

    test('한식진흥원 API: 재료정보 조회 성공', async ({ request }) => {
      const response = await request.get(baseUrl, {
        params: {
          page: '1',
          perPage: '10',
        },
        headers: {
          'Authorization': `Infuser ${PUBLIC_DATA_KEY}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log('[한식진흥원 API] 응답 데이터:', JSON.stringify(data, null, 2));

      // 응답 구조 검증
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('perPage');
      expect(data).toHaveProperty('totalCount');
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBeTruthy();

      if (data.data.length > 0) {
        const firstItem = data.data[0];
        console.log('✅ 한식진흥원 API 성공:', {
          총_데이터수: data.totalCount,
          첫번째_항목: firstItem,
        });
      }
    });

    test('한식진흥원 API: 대량 데이터 조회 (100개)', async ({ request }) => {
      const response = await request.get(baseUrl, {
        params: {
          page: '1',
          perPage: '100',
        },
        headers: {
          'Authorization': `Infuser ${PUBLIC_DATA_KEY}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log(`✅ 100개 데이터 조회 성공: ${data.data.length}개 반환`);
      expect(data.data.length).toBeLessThanOrEqual(100);
    });
  });

  /**
   * 3. 식품의약품안전처 푸드QR 정보 서비스 API 테스트
   */
  test.describe('푸드QR API 테스트', () => {
    const baseUrl = 'https://apis.data.go.kr/1471000/FoodQrInfoService01/getFoodQrInfo';

    test('푸드QR API: 기본 목록 조회 성공', async ({ request }) => {
      const response = await request.get(baseUrl, {
        params: {
          serviceKey: PUBLIC_DATA_KEY,
          returnType: 'json',
          pageNo: '1',
          numOfRows: '5',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log('[푸드QR API] 응답 데이터:', JSON.stringify(data, null, 2));

      // 응답 구조 검증
      expect(data).toHaveProperty('header');
      expect(data.header).toHaveProperty('resultCode');

      if (data.header.resultCode === '00') {
        expect(data).toHaveProperty('body');
        console.log(`✅ 푸드QR API 성공: ${data.body.totalCount}개 제품 조회됨`);
      } else {
        console.warn(`⚠️ 푸드QR API 오류: ${data.header.resultMsg}`);
      }
    });

    test('푸드QR API: 제품명으로 검색', async ({ request }) => {
      const response = await request.get(baseUrl, {
        params: {
          serviceKey: PUBLIC_DATA_KEY,
          returnType: 'json',
          prdlstNm: '사이다',
          pageNo: '1',
          numOfRows: '3',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log('[푸드QR API] 제품명 검색 결과:', JSON.stringify(data, null, 2));

      if (data.header.resultCode === '00' && data.body.totalCount > 0) {
        const firstProduct = data.body.items[0];
        console.log('✅ 찾은 제품:', {
          제품명: firstProduct.PRDLST_NM,
          업소명: firstProduct.BSSH_NM,
          원재료: firstProduct.RAWMTRL_NM?.substring(0, 100) + '...',
        });
      }
    });
  });

  /**
   * 4. Next.js API Route 테스트 (통합 검색 엔드포인트)
   */
  test.describe('Next.js API Route 테스트', () => {
    test('Next.js API: HACCP 테스트', async ({ request }) => {
      const response = await request.get('http://localhost:3000/api/test/public-data', {
        params: {
          api: 'haccp',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log('[Next.js API] HACCP 테스트:', JSON.stringify(data, null, 2));

      expect(data).toHaveProperty('success');
      expect(data.success).toBeTruthy();
      expect(data).toHaveProperty('data');
    });

    test('Next.js API: 한식진흥원 테스트', async ({ request }) => {
      const response = await request.get('http://localhost:3000/api/test/public-data', {
        params: {
          api: 'korean-food',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log('[Next.js API] 한식진흥원 테스트:', JSON.stringify(data, null, 2));

      expect(data).toHaveProperty('success');
      expect(data.success).toBeTruthy();
    });

    test('Next.js API: 푸드QR 테스트', async ({ request }) => {
      const response = await request.get('http://localhost:3000/api/test/public-data', {
        params: {
          api: 'food-qr',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log('[Next.js API] 푸드QR 테스트:', JSON.stringify(data, null, 2));

      expect(data).toHaveProperty('success');
      expect(data.success).toBeTruthy();
    });

    test('Next.js API: 바코드 통합 검색', async ({ request }) => {
      const response = await request.get('http://localhost:3000/api/test/public-data', {
        params: {
          api: 'search-barcode',
          barcode: '8801234567890',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log('[Next.js API] 바코드 통합 검색:', JSON.stringify(data, null, 2));

      expect(data).toHaveProperty('success');
      expect(data.data).toHaveProperty('haccp');
      expect(data.data).toHaveProperty('foodQR');
    });

    test('Next.js API: 제품명 통합 검색', async ({ request }) => {
      const response = await request.get('http://localhost:3000/api/test/public-data', {
        params: {
          api: 'search-name',
          name: '콜라',
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      console.log('[Next.js API] 제품명 통합 검색:', JSON.stringify(data, null, 2));

      expect(data).toHaveProperty('success');
      expect(data.data).toHaveProperty('haccp');
      expect(data.data).toHaveProperty('foodQR');
    });
  });

  /**
   * 5. 에러 처리 테스트
   */
  test.describe('에러 처리 테스트', () => {
    test('잘못된 인증키로 요청 시 에러 반환', async ({ request }) => {
      const response = await request.get('http://apis.data.go.kr/B553748/CertImgListServiceV3/getCertImgListServiceV3', {
        params: {
          serviceKey: 'invalid-key-12345',
          returnType: 'json',
          pageNo: '1',
          numOfRows: '1',
        },
      });

      const data = await response.json();
      console.log('[에러 테스트] 잘못된 키 응답:', JSON.stringify(data, null, 2));

      // 에러 코드 확인
      expect(data.header.resultCode).not.toBe('00');
    });

    test('Next.js API: 잘못된 api 파라미터', async ({ request }) => {
      const response = await request.get('http://localhost:3000/api/test/public-data', {
        params: {
          api: 'invalid-api',
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('Next.js API: barcode 파라미터 누락', async ({ request }) => {
      const response = await request.get('http://localhost:3000/api/test/public-data', {
        params: {
          api: 'search-barcode',
          // barcode 누락
        },
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('barcode');
    });
  });
});

/**
 * 테스트 실행 방법:
 *
 * 전체 테스트 실행:
 * npx playwright test public-data-api.spec.ts
 *
 * 특정 테스트만 실행:
 * npx playwright test public-data-api.spec.ts -g "HACCP API 테스트"
 *
 * UI 모드로 실행:
 * npx playwright test public-data-api.spec.ts --ui
 *
 * 디버그 모드:
 * npx playwright test public-data-api.spec.ts --debug
 */
