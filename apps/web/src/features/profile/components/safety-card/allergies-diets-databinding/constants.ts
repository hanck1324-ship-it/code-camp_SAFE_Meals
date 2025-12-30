/**
 * 알레르기 및 식단 데이터 바인딩 상수
 *
 * @description 알레르기 타입, 식단 타입, 심각도 레이블 매핑
 * @see docs/schema.md - allergy_types, diet_types 테이블 참조
 */

/**
 * 알레르기 심각도 타입
 */
export type AllergySeverity =
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'life_threatening';

/**
 * 알레르기 타입 정보 인터페이스
 */
export interface AllergyTypeInfo {
  code: string;
  name: string;
  icon: string;
}

/**
 * 식단 타입 정보 인터페이스
 */
export interface DietTypeInfo {
  code: string;
  name: string;
  icon: string;
}

/**
 * 알레르기 타입 매핑 (code -> 아이콘, 한글명)
 * @see docs/schema.md - allergy_types 테이블
 */
export const ALLERGY_TYPES: Record<string, AllergyTypeInfo> = {
  eggs: { code: 'eggs', name: '난류', icon: '🥚' },
  milk: { code: 'milk', name: '우유', icon: '🥛' },
  buckwheat: { code: 'buckwheat', name: '메밀', icon: '🌾' },
  peanuts: { code: 'peanuts', name: '땅콩', icon: '🥜' },
  soybeans: { code: 'soybeans', name: '대두', icon: '🫘' },
  wheat: { code: 'wheat', name: '밀', icon: '🌾' },
  mackerel: { code: 'mackerel', name: '고등어', icon: '🐟' },
  crab: { code: 'crab', name: '게', icon: '🦀' },
  shrimp: { code: 'shrimp', name: '새우', icon: '🦐' },
  pork: { code: 'pork', name: '돼지고기', icon: '🐷' },
  peaches: { code: 'peaches', name: '복숭아', icon: '🍑' },
  tomatoes: { code: 'tomatoes', name: '토마토', icon: '🍅' },
  sulfites: { code: 'sulfites', name: '아황산류', icon: '⚗️' },
  walnuts: { code: 'walnuts', name: '호두', icon: '🌰' },
  chicken: { code: 'chicken', name: '닭고기', icon: '🐔' },
  beef: { code: 'beef', name: '소고기', icon: '🐄' },
  squid: { code: 'squid', name: '오징어', icon: '🦑' },
  shellfish: { code: 'shellfish', name: '조개류', icon: '🐚' },
  pine_nuts: { code: 'pine_nuts', name: '잣', icon: '🌲' },
};

/**
 * 식단 타입 매핑 (code -> 아이콘, 한글명)
 * @see docs/schema.md - diet_types 테이블
 */
export const DIET_TYPES: Record<string, DietTypeInfo> = {
  vegetarian: { code: 'vegetarian', name: '채식주의', icon: '🥬' },
  vegan: { code: 'vegan', name: '비건', icon: '🌱' },
  halal: { code: 'halal', name: '할랄', icon: '☪️' },
  kosher: { code: 'kosher', name: '코셔', icon: '✡️' },
  gluten_free: { code: 'gluten_free', name: '글루텐 프리', icon: '🚫🌾' },
  lactose_free: { code: 'lactose_free', name: '유당 불내증', icon: '🚫🥛' },
  low_sodium: { code: 'low_sodium', name: '저염식', icon: '🧂' },
  diabetic: { code: 'diabetic', name: '당뇨식', icon: '💉' },
};

/**
 * 심각도 레이블 매핑 (severity -> 한글 레이블)
 */
export const SEVERITY_LABELS: Record<AllergySeverity, string> = {
  mild: '경미',
  moderate: '보통',
  severe: '심각',
  life_threatening: '생명위협',
};

/**
 * 알레르기 코드로 타입 정보 조회
 *
 * @param code - 알레르기 코드
 * @returns 알레르기 타입 정보 (없으면 기본값 반환)
 */
export function getAllergyTypeInfo(code: string): AllergyTypeInfo {
  return (
    ALLERGY_TYPES[code] || {
      code,
      name: code,
      icon: '❓',
    }
  );
}

/**
 * 식단 코드로 타입 정보 조회
 *
 * @param code - 식단 코드
 * @returns 식단 타입 정보 (없으면 기본값 반환)
 */
export function getDietTypeInfo(code: string): DietTypeInfo {
  return (
    DIET_TYPES[code] || {
      code,
      name: code,
      icon: '❓',
    }
  );
}

/**
 * 심각도 코드로 한글 레이블 조회
 *
 * @param severity - 심각도 코드
 * @returns 심각도 한글 레이블 (없으면 기본값 반환)
 */
export function getSeverityLabel(severity: string): string {
  return SEVERITY_LABELS[severity as AllergySeverity] || severity;
}
