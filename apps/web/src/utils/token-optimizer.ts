/**
 * AI 입력 토큰 최적화 유틸리티
 *
 * 목표:
 * - item_count (user_allergies.length + menu_tokens.length) ≤ 60
 * - 모든 LLM 호출에 적용하여 attention 비용 감소
 * - 처리 시간 < 5ms (동기 처리, 외부 API 호출 없음)
 */

// =============================================================================
// 타입 정의
// =============================================================================

export interface OptimizedInput {
  user_allergies: string[]; // 정규화된 알레르기 코드
  menu_tokens: string[]; // 최적화된 재료 토큰
  item_count: number; // 배열 요소 개수 (user_allergies.length + menu_tokens.length)
  was_truncated: boolean; // 아이템 잘림 여부
}

// =============================================================================
// 상수 정의
// =============================================================================

/**
 * 알레르기 코드별 동의어 매핑 테이블
 * 표준 코드는 프로젝트 DB의 allergy_code와 동일
 */
export const ALLERGY_SYNONYMS: Record<string, string[]> = {
  // 표준코드(DB): 동의어 목록 (모두 소문자 정규화)
  milk: [
    '우유',
    'dairy',
    '유제품',
    'cream',
    '크림',
    'cheese',
    '치즈',
    'butter',
    '버터',
    'lactose',
    'whey',
    '유청',
  ],
  eggs: [
    '계란',
    'egg',
    '달걀',
    '난류',
    'mayonnaise',
    '마요네즈',
    'meringue',
    '머랭',
  ],
  peanuts: ['땅콩', 'peanut', 'peanut butter', '땅콩버터'],
  tree_nuts: [
    '견과류',
    'nut',
    'nuts',
    '아몬드',
    '호두',
    '캐슈넛',
    'almond',
    'walnut',
    'cashew',
    'pistachio',
    '피스타치오',
    'hazelnut',
    '헤이즐넛',
    'macadamia',
  ],
  fish: [
    '생선',
    '어류',
    'salmon',
    'tuna',
    'cod',
    '연어',
    '참치',
    '대구',
    '고등어',
    'mackerel',
    'anchovy',
    '멸치',
  ],
  shellfish: [
    '갑각류',
    '조개류',
    'shrimp',
    '새우',
    'crab',
    '게',
    'lobster',
    '랍스터',
    'oyster',
    '굴',
    'mussel',
    '홍합',
    'clam',
    '조개',
    'scallop',
    '가리비',
    'prawn',
  ],
  wheat: [
    '밀',
    '글루텐',
    'gluten',
    'flour',
    '밀가루',
    'bread',
    '빵',
    'pasta',
    '파스타',
    'noodle',
    '면',
  ],
  soy: [
    '대두',
    '콩',
    'soybean',
    '두부',
    'tofu',
    '간장',
    'soy sauce',
    '된장',
    'miso',
    'edamame',
  ],
  sesame: ['참깨', '깨', 'sesame oil', '참기름', 'tahini', '타히니'],
};

/**
 * 보호 키워드 (제거 금지) - 알레르기 핵심 키워드
 * 어떤 처리에서도 삭제되면 안 됨
 */
export const PROTECTED_KEYWORDS: Set<string> = new Set([
  // 영문 (단수형 통일)
  'egg',
  'milk',
  'cream',
  'cheese',
  'butter',
  'peanut',
  'nut',
  'almond',
  'walnut',
  'cashew',
  'fish',
  'shrimp',
  'crab',
  'lobster',
  'oyster',
  'shellfish',
  'wheat',
  'gluten',
  'flour',
  'soy',
  'tofu',
  'sesame',
  'alcohol',
  'pork',
  'beef',
  // 한글
  '계란',
  '달걀',
  '우유',
  '크림',
  '치즈',
  '버터',
  '땅콩',
  '견과류',
  '아몬드',
  '호두',
  '생선',
  '새우',
  '게',
  '랍스터',
  '굴',
  '갑각류',
  '조개',
  '밀',
  '글루텐',
  '밀가루',
  '콩',
  '대두',
  '두부',
  '참깨',
  '알코올',
  '돼지고기',
  '소고기',
]);

/**
 * 위험 키워드 (식이제한 관련)
 */
export const DANGER_KEYWORDS: Set<string> = new Set([
  'alcohol',
  'pork',
  'beef',
  '알코올',
  '돼지고기',
  '소고기',
]);

/**
 * 조리법/수식어 접두어 목록 (영문)
 */
const ENGLISH_PREFIXES = [
  'fried',
  'grilled',
  'steamed',
  'roasted',
  'baked',
  'boiled',
  'sautéed',
  'sauteed',
  'smoked',
  'marinated',
  'breaded',
  'battered',
  'spicy',
  'raw',
  'fresh',
  'organic',
  'crispy',
  'deep-fried',
  'deep fried',
];

/**
 * 조리법/수식어 접두어 목록 (한글)
 */
const KOREAN_PREFIXES = [
  '튀김',
  '구이',
  '찜',
  '볶음',
  '훈제',
  '양념',
  '매콤',
  '바삭',
  '신선한',
  '생',
  '유기농',
];

/**
 * 모든 접두어를 결합한 정규식 패턴
 */
const PREFIX_PATTERN = new RegExp(
  `^(${[...ENGLISH_PREFIXES, ...KOREAN_PREFIXES].join('|')})\\s+`,
  'i'
);

/**
 * 복수형 → 단수형 매핑 규칙
 */
const PLURAL_TO_SINGULAR: Record<string, string> = {
  eggs: 'egg',
  nuts: 'nut',
  shrimps: 'shrimp',
  crabs: 'crab',
  lobsters: 'lobster',
  oysters: 'oyster',
  mussels: 'mussel',
  clams: 'clam',
  scallops: 'scallop',
  prawns: 'prawn',
  almonds: 'almond',
  walnuts: 'walnut',
  cashews: 'cashew',
  pistachios: 'pistachio',
  hazelnuts: 'hazelnut',
  peanuts: 'peanut',
};

// =============================================================================
// 동의어 → 표준 코드 역매핑 생성 (모듈 로드 시 1회)
// =============================================================================

const SYNONYM_TO_CODE: Map<string, string> = new Map();

// 표준 코드 자체도 매핑에 추가
for (const code of Object.keys(ALLERGY_SYNONYMS)) {
  SYNONYM_TO_CODE.set(code.toLowerCase(), code);
  for (const synonym of ALLERGY_SYNONYMS[code]) {
    SYNONYM_TO_CODE.set(synonym.toLowerCase(), code);
  }
}

// =============================================================================
// 핵심 함수 구현
// =============================================================================

/**
 * 동의어 → 표준 코드 변환 (우선순위 점수 계산용)
 *
 * @param token 입력 토큰
 * @returns DB 알레르기 코드 또는 null
 *
 * 주의: 메뉴 토큰 자체는 구체어(shrimp, crab)로 유지.
 * 이 함수는 우선순위 점수 계산과 userAllergies 정규화에만 사용.
 */
export function toStandardCode(token: string): string | null {
  const normalized = token.trim().toLowerCase().replace(/\s+/g, ' ');
  return SYNONYM_TO_CODE.get(normalized) || null;
}

/**
 * 중복 토큰 제거 함수
 *
 * 1) 완전 중복 제거: 대소문자 정규화 후 Set으로 중복 제거
 * 2) 부분 중복 제거: 긴 토큰에 포함된 짧은 토큰 제거 (보호 키워드 제외)
 * 3) 동의어 중복 제거: 한글↔영문 동의어만 제거 (shrimp/crab 같은 다른 구체어는 유지)
 *
 * @param tokens 입력 토큰 배열
 * @returns 중복 제거된 토큰 배열
 */
export function removeDuplicateTokens(tokens: string[]): string[] {
  if (tokens.length === 0) return [];

  // 1단계: 정규화 및 완전 중복 제거
  const normalizedTokens = tokens.map((t) =>
    t.trim().toLowerCase().replace(/\s+/g, ' ')
  );
  const uniqueTokens = [...new Set(normalizedTokens)].filter(
    (t) => t.length > 0
  );

  // 2단계: 부분 중복 제거 (긴 토큰 우선)
  // 토큰을 길이 내림차순으로 정렬
  const sortedByLength = [...uniqueTokens].sort((a, b) => b.length - a.length);
  const confirmedTokens: Set<string> = new Set();

  for (const token of sortedByLength) {
    const isProtected = PROTECTED_KEYWORDS.has(token);

    // 보호 키워드는 무조건 추가
    if (isProtected) {
      confirmedTokens.add(token);
      continue;
    }

    // 해당 토큰이 이미 확정된 긴 토큰의 "단어로 포함"되는지 확인
    let isContained = false;
    for (const confirmed of confirmedTokens) {
      if (isWordContainedIn(token, confirmed)) {
        isContained = true;
        break;
      }
    }

    if (!isContained) {
      confirmedTokens.add(token);
    }
  }

  // 3단계: 동의어 중복 제거 (한글↔영문만)
  // **중요**: 같은 코드로 매핑되더라도 다른 구체어(shrimp, crab)는 모두 유지
  // 한글과 영문이 동시에 있으면 영문만 유지
  const finalTokens: string[] = [];
  const seenExactSynonyms = new Map<string, string>(); // 정확한 동의어쌍 추적

  for (const token of confirmedTokens) {
    // 한글인지 확인
    const isKorean = /[가-힣]/.test(token);

    if (isKorean) {
      // 한글 토큰의 영문 동의어가 이미 있는지 확인
      const englishEquivalent = findExactEnglishEquivalent(token);
      if (englishEquivalent && confirmedTokens.has(englishEquivalent)) {
        // 영문 동의어가 있으면 한글 스킵
        continue;
      }
    }

    finalTokens.push(token);
  }

  return finalTokens;
}

/**
 * 한글 토큰의 정확한 영문 동의어 찾기
 * 예: "새우" → "shrimp", "우유" → "milk"
 * 단, shrimp/crab처럼 다른 구체어는 각각 유지
 */
function findExactEnglishEquivalent(koreanToken: string): string | null {
  const KOREAN_TO_ENGLISH: Record<string, string> = {
    // 정확한 1:1 매핑만 정의
    우유: 'milk',
    크림: 'cream',
    치즈: 'cheese',
    버터: 'butter',
    계란: 'egg',
    달걀: 'egg',
    땅콩: 'peanut',
    새우: 'shrimp',
    게: 'crab',
    랍스터: 'lobster',
    굴: 'oyster',
    홍합: 'mussel',
    조개: 'clam',
    가리비: 'scallop',
    생선: 'fish',
    연어: 'salmon',
    참치: 'tuna',
    대구: 'cod',
    고등어: 'mackerel',
    멸치: 'anchovy',
    밀: 'wheat',
    밀가루: 'flour',
    글루텐: 'gluten',
    빵: 'bread',
    파스타: 'pasta',
    면: 'noodle',
    콩: 'soy',
    대두: 'soybean',
    두부: 'tofu',
    참깨: 'sesame',
    아몬드: 'almond',
    호두: 'walnut',
    돼지고기: 'pork',
    소고기: 'beef',
    알코올: 'alcohol',
  };

  return KOREAN_TO_ENGLISH[koreanToken] || null;
}

/**
 * 단어 경계 기준으로 포함 여부 확인
 * "cream cheese"는 "cheese"를 단어로 포함
 * "cream"은 "screaming"을 포함하지 않음
 */
function isWordContainedIn(shorter: string, longer: string): boolean {
  if (shorter === longer) return false;
  if (shorter.length >= longer.length) return false;

  // 공백으로 분리하여 단어 단위로 확인
  const longerWords = longer.split(/\s+/);
  return longerWords.includes(shorter);
}

/**
 * Stemming/Lemmatization 함수
 * 표면 재료 토큰 정규화 전용 (DB 코드 변환 아님)
 *
 * 1) 복수형 → 단수형
 * 2) 조리법/수식어 접두어 제거
 *
 * @param ingredients 입력 재료 배열
 * @returns 정규화된 재료 배열
 */
export function normalizeIngredients(ingredients: string[]): string[] {
  return ingredients
    .map((ingredient) => normalizeIngredient(ingredient))
    .filter((i) => i.length > 0);
}

/**
 * 단일 재료 정규화
 */
function normalizeIngredient(ingredient: string): string {
  let normalized = ingredient.trim().toLowerCase().replace(/\s+/g, ' ');

  // 접두어 연속 제거 (예: "fresh organic milk" → "milk")
  let prevLength = 0;
  while (normalized.length !== prevLength) {
    prevLength = normalized.length;
    normalized = normalized.replace(PREFIX_PATTERN, '');
  }

  // 복수형 → 단수형
  const lowerNormalized = normalized.toLowerCase();
  if (PLURAL_TO_SINGULAR[lowerNormalized]) {
    normalized = PLURAL_TO_SINGULAR[lowerNormalized];
  } else if (
    normalized.endsWith('s') &&
    !normalized.endsWith('ss') &&
    normalized.length > 2
  ) {
    // 일반적인 복수형 처리 (특수 케이스 제외)
    const singular = normalized.slice(0, -1);
    // 보호 키워드이거나 의미 있는 단어면 단수형으로 변환
    if (PROTECTED_KEYWORDS.has(singular)) {
      normalized = singular;
    }
  }

  return normalized;
}

/**
 * 토큰 우선순위 점수 계산
 *
 * @param token 토큰
 * @param userAllergyCodes 사용자 알레르기 코드 배열
 * @returns 점수 (높을수록 우선)
 */
function getScore(token: string, userAllergyCodes: Set<string>): number {
  const code = toStandardCode(token);

  // 사용자 알레르기에 해당하면 최우선
  if (code && userAllergyCodes.has(code)) {
    return 100;
  }

  // 위험 키워드 (alcohol, pork, beef)
  if (DANGER_KEYWORDS.has(token.toLowerCase())) {
    return 50;
  }

  // 보호 키워드 (핵심 알레르기 단어)
  if (PROTECTED_KEYWORDS.has(token.toLowerCase())) {
    return 10;
  }

  return 0;
}

/**
 * 토큰 필터링 및 우선순위화 시스템
 *
 * @param userAllergies 사용자 알레르기 코드 배열
 * @param menuIngredients 메뉴 재료 배열
 * @returns 최적화된 입력 객체
 */
export function getOptimizedAllergyTokens(
  userAllergies: string[],
  menuIngredients: string[]
): OptimizedInput {
  const MAX_USER_ALLERGIES = 10;
  const MAX_MENU_TOKENS = 50;
  let wasTruncated = false;

  // 1단계: 사용자 알레르기 정규화
  const normalizedAllergies = userAllergies
    .map((a) => toStandardCode(a) || a.toLowerCase())
    .filter((a) => a.length > 0);
  const uniqueAllergies = [...new Set(normalizedAllergies)];

  // 알레르기 목록도 제한
  let finalAllergies = uniqueAllergies;
  if (uniqueAllergies.length > MAX_USER_ALLERGIES) {
    finalAllergies = uniqueAllergies.slice(0, MAX_USER_ALLERGIES);
    wasTruncated = true;
  }

  // 사용자 알레르기 코드 Set 생성 (점수 계산용)
  const userAllergyCodes = new Set(finalAllergies);

  // 2단계: 중복 제거
  let menuTokens = removeDuplicateTokens(menuIngredients);

  // 3단계: 정규화
  menuTokens = normalizeIngredients(menuTokens);

  // 4단계: 다시 중복 제거 (정규화 후 중복 발생 가능)
  menuTokens = [...new Set(menuTokens)];

  // 5단계: 우선순위 정렬
  menuTokens.sort((a, b) => {
    const scoreA = getScore(a, userAllergyCodes);
    const scoreB = getScore(b, userAllergyCodes);

    // 1순위: 점수 높은 것 우선
    if (scoreA !== scoreB) return scoreB - scoreA;

    // 2순위: 토큰 길이 긴 것 우선 (더 구체적)
    if (a.length !== b.length) return b.length - a.length;

    // 3순위: 사전순
    return a.localeCompare(b);
  });

  // 6단계: 아이템 수 제한
  if (menuTokens.length > MAX_MENU_TOKENS) {
    menuTokens = menuTokens.slice(0, MAX_MENU_TOKENS);
    wasTruncated = true;
  }

  return {
    user_allergies: finalAllergies,
    menu_tokens: menuTokens,
    item_count: finalAllergies.length + menuTokens.length,
    was_truncated: wasTruncated,
  };
}

// =============================================================================
// 내보내기 (테스트용)
// =============================================================================

export { isWordContainedIn as _isWordContainedIn };
