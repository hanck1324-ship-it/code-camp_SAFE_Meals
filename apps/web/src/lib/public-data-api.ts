/**
 * 공공데이터포털 API 통합 클라이언트
 *
 * 3개의 REST API 통합 관리:
 * 1. HACCP 제품이미지 및 포장지표기정보
 * 2. 한식진흥원 아카이브 레시피 재료정보
 * 3. 식품의약품안전처 푸드QR 정보
 */

const PUBLIC_DATA_KEY = process.env.PUBLIC_DATA_KEY;

if (!PUBLIC_DATA_KEY) {
  console.warn('[Public Data API] PUBLIC_DATA_KEY is not configured in environment variables');
}

// ============================================
// 1. HACCP 제품이미지 및 포장지표기정보 API
// ============================================

export interface HACCPProduct {
  prdlstReportNo?: string;      // 품목제조번호
  prdlstNm?: string;             // 제품명
  manufacturerNm?: string;       // 제조사명
  imgUrl1?: string;              // 제품 이미지 URL 1
  imgUrl2?: string;              // 제품 이미지 URL 2
  rawmtrl?: string;              // 원재료명
  nutrient?: string;             // 영양성분
  allergy?: string;              // 알레르기 유발물질
  capacity?: string;             // 내용량
  distributionPeriod?: string;   // 유통기한
  [key: string]: unknown;        // 기타 필드
}

export interface HACCPApiResponse {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    items: HACCPProduct[];
    numOfRows: number;
    pageNo: number;
    totalCount: number;
  };
}

/**
 * HACCP 제품 정보 조회
 * @param barcode - 제품 바코드 번호 (선택)
 * @param productName - 제품명 (선택)
 * @param pageNo - 페이지 번호 (기본: 1)
 * @param numOfRows - 한 페이지 결과 수 (기본: 10)
 */
export async function getHACCPProducts({
  barcode,
  productName,
  pageNo = 1,
  numOfRows = 10,
}: {
  barcode?: string;
  productName?: string;
  pageNo?: number;
  numOfRows?: number;
} = {}): Promise<HACCPApiResponse> {
  const baseUrl = 'http://apis.data.go.kr/B553748/CertImgListServiceV3/getCertImgListServiceV3';

  const params = new URLSearchParams({
    serviceKey: PUBLIC_DATA_KEY || '',
    returnType: 'json',
    pageNo: pageNo.toString(),
    numOfRows: numOfRows.toString(),
  });

  if (barcode) {
    params.append('barcode', barcode);
  }
  if (productName) {
    params.append('prdlstNm', productName);
  }

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HACCP API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[HACCP API] Error:', error);
    throw error;
  }
}

// ============================================
// 2. 한식진흥원 아카이브 레시피 재료정보 API
// ============================================

export interface KoreanFoodIngredient {
  레시피명?: string;
  재료명?: string;
  재료분류?: string;
  재료량?: string;
  [key: string]: unknown;
}

export interface KoreanFoodApiResponse {
  page: number;
  perPage: number;
  totalCount: number;
  currentCount: number;
  matchCount: number;
  data: KoreanFoodIngredient[];
}

/**
 * 한식진흥원 레시피 재료정보 조회
 * @param page - 페이지 번호 (기본: 1)
 * @param perPage - 한 페이지 결과 수 (기본: 10, 최대: 1000)
 */
export async function getKoreanFoodIngredients({
  page = 1,
  perPage = 10,
}: {
  page?: number;
  perPage?: number;
} = {}): Promise<KoreanFoodApiResponse> {
  const baseUrl = 'https://api.odcloud.kr/api/15136610/v1/uddi:cdae3642-8160-45f7-85bd-859ddb76958e';

  const params = new URLSearchParams({
    page: page.toString(),
    perPage: perPage.toString(),
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Infuser ${PUBLIC_DATA_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Korean Food API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Korean Food API] Error:', error);
    throw error;
  }
}

// ============================================
// 3. 식품의약품안전처 푸드QR 정보 서비스 API
// ============================================

export interface FoodQRInfo {
  PRDLST_NM?: string;           // 제품명
  BSSH_NM?: string;             // 업소명
  RAWMTRL_NM?: string;          // 원재료명
  ALLERGY?: string;             // 알레르기 유발물질
  NUTR_CONT?: string;           // 영양성분
  CAPACITY?: string;            // 내용량
  POG_DAYCNT?: string;          // 유통기한
  BARCODE?: string;             // 바코드
  [key: string]: unknown;
}

export interface FoodQRApiResponse {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    items: FoodQRInfo[];
    numOfRows: number;
    pageNo: number;
    totalCount: number;
  };
}

/**
 * 푸드QR 정보 조회
 * @param barcode - 바코드 (선택)
 * @param productName - 제품명 (선택)
 * @param pageNo - 페이지 번호 (기본: 1)
 * @param numOfRows - 한 페이지 결과 수 (기본: 10)
 */
export async function getFoodQRInfo({
  barcode,
  productName,
  pageNo = 1,
  numOfRows = 10,
}: {
  barcode?: string;
  productName?: string;
  pageNo?: number;
  numOfRows?: number;
} = {}): Promise<FoodQRApiResponse> {
  const baseUrl = 'https://apis.data.go.kr/1471000/FoodQrInfoService01/getFoodQrInfo';

  const params = new URLSearchParams({
    serviceKey: PUBLIC_DATA_KEY || '',
    returnType: 'json',
    pageNo: pageNo.toString(),
    numOfRows: numOfRows.toString(),
  });

  if (barcode) {
    params.append('barcode', barcode);
  }
  if (productName) {
    params.append('prdlstNm', productName);
  }

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Food QR API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Food QR API] Error:', error);
    throw error;
  }
}

// ============================================
// 통합 검색 함수
// ============================================

/**
 * 바코드로 모든 API 통합 검색
 * HACCP, 푸드QR 두 API를 동시에 호출하여 결과 통합
 */
export async function searchProductByBarcode(barcode: string) {
  try {
    const [haccpResult, foodQRResult] = await Promise.allSettled([
      getHACCPProducts({ barcode }),
      getFoodQRInfo({ barcode }),
    ]);

    return {
      haccp: haccpResult.status === 'fulfilled' ? haccpResult.value : null,
      foodQR: foodQRResult.status === 'fulfilled' ? foodQRResult.value : null,
      errors: {
        haccp: haccpResult.status === 'rejected' ? haccpResult.reason : null,
        foodQR: foodQRResult.status === 'rejected' ? foodQRResult.reason : null,
      },
    };
  } catch (error) {
    console.error('[Integrated Search] Error:', error);
    throw error;
  }
}

/**
 * 제품명으로 모든 API 통합 검색
 */
export async function searchProductByName(productName: string) {
  try {
    const [haccpResult, foodQRResult] = await Promise.allSettled([
      getHACCPProducts({ productName }),
      getFoodQRInfo({ productName }),
    ]);

    return {
      haccp: haccpResult.status === 'fulfilled' ? haccpResult.value : null,
      foodQR: foodQRResult.status === 'fulfilled' ? foodQRResult.value : null,
      errors: {
        haccp: haccpResult.status === 'rejected' ? haccpResult.reason : null,
        foodQR: foodQRResult.status === 'rejected' ? foodQRResult.reason : null,
      },
    };
  } catch (error) {
    console.error('[Integrated Search] Error:', error);
    throw error;
  }
}
