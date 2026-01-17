/**
 * 공공데이터포털 API 통합 클라이언트
 *
 * 3개의 REST API 통합 관리:
 * 1. HACCP 제품이미지 및 포장지표기정보
 * 2. 한식진흥원 아카이브 레시피 재료정보
 * 3. 식품의약품안전처 푸드QR 정보
 *
 * 캐싱:
 * - 서버: 메모리 캐시 (TTL 1시간)
 * - 클라이언트: IndexedDB (TTL 24시간)
 */

const PUBLIC_DATA_KEY = process.env.PUBLIC_DATA_KEY;

// ============================================
// 캐싱 설정
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// 서버 메모리 캐시 (TTL: 1시간)
const SERVER_CACHE_TTL_MS = 60 * 60 * 1000; // 1시간
const serverCache = new Map<string, CacheEntry<unknown>>();

// 캐시 통계
let cacheHits = 0;
let cacheMisses = 0;

/**
 * 서버 캐시에서 데이터 조회
 */
function getFromServerCache<T>(key: string): T | null {
  const entry = serverCache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    cacheMisses++;
    return null;
  }

  // 만료 확인
  if (Date.now() > entry.expiresAt) {
    serverCache.delete(key);
    cacheMisses++;
    return null;
  }

  cacheHits++;
  console.log(
    `[Cache] HIT: ${key} (hits: ${cacheHits}, misses: ${cacheMisses})`
  );
  return entry.data;
}

/**
 * 서버 캐시에 데이터 저장
 */
function setToServerCache<T>(
  key: string,
  data: T,
  ttlMs: number = SERVER_CACHE_TTL_MS
): void {
  const now = Date.now();
  serverCache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttlMs,
  });
  console.log(`[Cache] SET: ${key} (expires in ${ttlMs / 1000}s)`);
}

/**
 * 만료된 캐시 정리 (주기적 호출 권장)
 */
export function cleanupServerCache(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of serverCache.entries()) {
    if (now > entry.expiresAt) {
      serverCache.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Cache] Cleanup: ${cleaned} expired entries removed`);
  }

  return cleaned;
}

/**
 * 캐시 통계 조회
 */
export function getCacheStats() {
  return {
    size: serverCache.size,
    hits: cacheHits,
    misses: cacheMisses,
    hitRate:
      cacheHits + cacheMisses > 0
        ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1) + '%'
        : 'N/A',
  };
}

/**
 * 캐시 키 생성
 */
function createCacheKey(
  api: string,
  params: Record<string, string | number | undefined>
): string {
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `${api}:${sortedParams}`;
}
// 식품안전나라 API 키 (HACCP 적용업소 지정, 조리식품 레시피 등)
const HACCP_API_KEY = process.env.HACCP_API_KEY || PUBLIC_DATA_KEY;

if (!PUBLIC_DATA_KEY && !HACCP_API_KEY) {
  console.warn(
    '[Public Data API] API keys are not configured in environment variables'
  );
}

// ============================================
// 1. HACCP 제품이미지 및 포장지표기정보 API
// ============================================

export interface HACCPProduct {
  prdlstReportNo?: string; // 품목제조번호
  prdlstNm?: string; // 제품명
  manufacturerNm?: string; // 제조사명
  imgUrl1?: string; // 제품 이미지 URL 1
  imgUrl2?: string; // 제품 이미지 URL 2
  rawmtrl?: string; // 원재료명
  nutrient?: string; // 영양성분
  allergy?: string; // 알레르기 유발물질
  capacity?: string; // 내용량
  distributionPeriod?: string; // 유통기한
  [key: string]: unknown; // 기타 필드
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
 * HACCP 제품 정보 조회 (캐싱 적용)
 * @param barcode - 제품 바코드 번호 (선택)
 * @param productName - 제품명 (선택)
 * @param pageNo - 페이지 번호 (기본: 1)
 * @param numOfRows - 한 페이지 결과 수 (기본: 10)
 * @param useCache - 캐시 사용 여부 (기본: true)
 */
export async function getHACCPProducts({
  barcode,
  productName,
  pageNo = 1,
  numOfRows = 10,
  useCache = true,
}: {
  barcode?: string;
  productName?: string;
  pageNo?: number;
  numOfRows?: number;
  useCache?: boolean;
} = {}): Promise<HACCPApiResponse> {
  // 캐시 키 생성
  const cacheKey = createCacheKey('haccp', {
    barcode,
    productName,
    pageNo,
    numOfRows,
  });

  // 캐시 확인
  if (useCache) {
    const cached = getFromServerCache<HACCPApiResponse>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const baseUrl =
    'http://apis.data.go.kr/B553748/CertImgListServiceV3/getCertImgListServiceV3';

  const params = new URLSearchParams({
    serviceKey: HACCP_API_KEY || '',
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
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `HACCP API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // 성공 응답만 캐시
    if (data?.body?.items) {
      setToServerCache(cacheKey, data);
    }

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
 * 한식진흥원 레시피 재료정보 조회 (캐싱 적용)
 * @param page - 페이지 번호 (기본: 1)
 * @param perPage - 한 페이지 결과 수 (기본: 10, 최대: 1000)
 * @param useCache - 캐시 사용 여부 (기본: true)
 */
export async function getKoreanFoodIngredients({
  page = 1,
  perPage = 10,
  useCache = true,
}: {
  page?: number;
  perPage?: number;
  useCache?: boolean;
} = {}): Promise<KoreanFoodApiResponse> {
  // 캐시 키 생성
  const cacheKey = createCacheKey('korean-food', { page, perPage });

  // 캐시 확인
  if (useCache) {
    const cached = getFromServerCache<KoreanFoodApiResponse>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const baseUrl =
    'https://api.odcloud.kr/api/15136610/v1/uddi:cdae3642-8160-45f7-85bd-859ddb76958e';

  const params = new URLSearchParams({
    page: page.toString(),
    perPage: perPage.toString(),
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Infuser ${PUBLIC_DATA_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Korean Food API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // 성공 응답만 캐시
    if (data?.data) {
      setToServerCache(cacheKey, data);
    }

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
  PRDLST_NM?: string; // 제품명
  BSSH_NM?: string; // 업소명
  RAWMTRL_NM?: string; // 원재료명
  ALLERGY?: string; // 알레르기 유발물질
  NUTR_CONT?: string; // 영양성분
  CAPACITY?: string; // 내용량
  POG_DAYCNT?: string; // 유통기한
  BARCODE?: string; // 바코드
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
 * 푸드QR 정보 조회 (캐싱 적용)
 * @param barcode - 바코드 (선택)
 * @param productName - 제품명 (선택)
 * @param pageNo - 페이지 번호 (기본: 1)
 * @param numOfRows - 한 페이지 결과 수 (기본: 10)
 * @param useCache - 캐시 사용 여부 (기본: true)
 */
export async function getFoodQRInfo({
  barcode,
  productName,
  pageNo = 1,
  numOfRows = 10,
  useCache = true,
}: {
  barcode?: string;
  productName?: string;
  pageNo?: number;
  numOfRows?: number;
  useCache?: boolean;
} = {}): Promise<FoodQRApiResponse> {
  // 캐시 키 생성
  const cacheKey = createCacheKey('food-qr', {
    barcode,
    productName,
    pageNo,
    numOfRows,
  });

  // 캐시 확인
  if (useCache) {
    const cached = getFromServerCache<FoodQRApiResponse>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const baseUrl =
    'https://apis.data.go.kr/1471000/FoodQrInfoService01/getFoodQrInfo';

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
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Food QR API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // 성공 응답만 캐시
    if (data?.body?.items) {
      setToServerCache(cacheKey, data);
    }

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

// ============================================
// 알레르기 정보 파싱 유틸리티
// ============================================

/**
 * 한국 식품 알레르기 표시 기준 (식품위생법)
 * 22가지 알레르기 유발물질
 */
export const KOREA_ALLERGEN_LIST = [
  // 동물성
  {
    code: 'eggs',
    ko: '난류(가금류)',
    aliases: ['계란', '달걀', '난류', '메추리알', '오리알'],
  },
  { code: 'milk', ko: '우유', aliases: ['우유', '유제품', '유당', '락토스'] },
  {
    code: 'fish',
    ko: '어류',
    aliases: ['생선', '어류', '고등어', '연어', '참치', '대구', '멸치'],
  },
  {
    code: 'shellfish',
    ko: '갑각류',
    aliases: ['새우', '게', '가재', '랍스터', '크랩'],
  },
  {
    code: 'mollusks',
    ko: '연체류',
    aliases: ['굴', '전복', '홍합', '오징어', '낙지', '문어', '조개'],
  },

  // 견과류
  { code: 'peanuts', ko: '땅콩', aliases: ['땅콩', '피넛'] },
  {
    code: 'tree_nuts',
    ko: '견과류',
    aliases: [
      '호두',
      '아몬드',
      '캐슈넛',
      '피스타치오',
      '잣',
      '밤',
      '헤이즐넛',
      '마카다미아',
      '피칸',
    ],
  },

  // 곡물
  { code: 'wheat', ko: '밀', aliases: ['밀', '소맥', '글루텐'] },
  { code: 'buckwheat', ko: '메밀', aliases: ['메밀', '모밀'] },

  // 대두/콩류
  {
    code: 'soy',
    ko: '대두',
    aliases: ['대두', '콩', '두부', '된장', '간장', '청국장'],
  },

  // 과일
  { code: 'peach', ko: '복숭아', aliases: ['복숭아'] },
  { code: 'tomato', ko: '토마토', aliases: ['토마토'] },
  { code: 'kiwi', ko: '키위', aliases: ['키위'] },

  // 기타
  { code: 'sulfites', ko: '아황산류', aliases: ['아황산', '이산화황', 'SO2'] },
  { code: 'celery', ko: '셀러리', aliases: ['셀러리', '샐러리'] },
  { code: 'mustard', ko: '겨자', aliases: ['겨자', '머스타드'] },
  { code: 'sesame', ko: '참깨', aliases: ['참깨', '깨', '참기름'] },
  { code: 'pork', ko: '돼지고기', aliases: ['돼지고기', '돈육', '포크'] },
  { code: 'beef', ko: '쇠고기', aliases: ['쇠고기', '소고기', '우육', '비프'] },
  { code: 'chicken', ko: '닭고기', aliases: ['닭고기', '계육', '치킨'] },
  { code: 'pine_nut', ko: '잣', aliases: ['잣'] },
  { code: 'oyster', ko: '굴', aliases: ['굴'] },
];

/**
 * 알레르기 표시 문자열에서 알레르겐 코드 추출
 *
 * @param allergyText - 공공데이터 API에서 받은 알레르기 표시 문자열
 *   예: "난류(가금류에 한함), 우유, 밀, 대두, 돼지고기 함유"
 * @returns 표준 알레르겐 코드 배열
 *   예: ['eggs', 'milk', 'wheat', 'soy', 'pork']
 */
export function parseAllergyText(
  allergyText: string | null | undefined
): string[] {
  if (!allergyText || typeof allergyText !== 'string') {
    return [];
  }

  const normalizedText = allergyText.toLowerCase();
  const foundAllergens = new Set<string>();

  for (const allergen of KOREA_ALLERGEN_LIST) {
    // 한글 이름으로 검색
    if (normalizedText.includes(allergen.ko)) {
      foundAllergens.add(allergen.code);
      continue;
    }

    // aliases로 검색
    for (const alias of allergen.aliases) {
      if (normalizedText.includes(alias.toLowerCase())) {
        foundAllergens.add(allergen.code);
        break;
      }
    }
  }

  return Array.from(foundAllergens);
}

/**
 * 원재료명에서 알레르겐 추출
 *
 * @param rawMaterials - 원재료명 문자열
 *   예: "정제수, 밀가루(밀:미국산), 설탕, 대두유, 계란"
 * @returns 표준 알레르겐 코드 배열
 */
export function parseRawMaterials(
  rawMaterials: string | null | undefined
): string[] {
  if (!rawMaterials || typeof rawMaterials !== 'string') {
    return [];
  }

  // 괄호 안 내용도 포함하여 파싱
  const normalizedText = rawMaterials.toLowerCase();
  const foundAllergens = new Set<string>();

  for (const allergen of KOREA_ALLERGEN_LIST) {
    for (const alias of allergen.aliases) {
      if (normalizedText.includes(alias.toLowerCase())) {
        foundAllergens.add(allergen.code);
        break;
      }
    }
  }

  return Array.from(foundAllergens);
}

/**
 * 제품 정보에서 모든 알레르겐 추출 (알레르기 표시 + 원재료명)
 */
export function extractAllergensFromProduct(
  product: HACCPProduct | FoodQRInfo
): string[] {
  const allergyField =
    'allergy' in product
      ? (product as HACCPProduct).allergy
      : (product as FoodQRInfo).ALLERGY;
  const rawMaterialField =
    'rawmtrl' in product
      ? (product as HACCPProduct).rawmtrl
      : (product as FoodQRInfo).RAWMTRL_NM;

  const fromAllergy = parseAllergyText(
    allergyField as string | null | undefined
  );
  const fromRawMaterials = parseRawMaterials(
    rawMaterialField as string | null | undefined
  );

  // 중복 제거하여 반환
  return Array.from(new Set([...fromAllergy, ...fromRawMaterials]));
}

/**
 * 사용자 알레르기와 제품 알레르겐 비교
 *
 * @param userAllergies - 사용자 알레르기 코드 배열
 * @param productAllergens - 제품 알레르겐 코드 배열
 * @returns 매칭된 알레르겐과 안전 상태
 */
export function checkAllergyMatch(
  userAllergies: string[],
  productAllergens: string[]
): {
  isMatch: boolean;
  matchedAllergens: string[];
  safetyLevel: 'SAFE' | 'DANGER';
} {
  const userSet = new Set(userAllergies.map((a) => a.toLowerCase()));
  const matchedAllergens = productAllergens.filter((a) =>
    userSet.has(a.toLowerCase())
  );

  return {
    isMatch: matchedAllergens.length > 0,
    matchedAllergens,
    safetyLevel: matchedAllergens.length > 0 ? 'DANGER' : 'SAFE',
  };
}
