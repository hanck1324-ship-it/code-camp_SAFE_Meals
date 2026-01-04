/**
 * 알레르기 및 식단 데이터 바인딩 상수
 *
 * @description 알레르기 타입, 식단 타입, 심각도 레이블 매핑
 * @see docs/schema.md - allergy_types, diet_types 테이블 참조
 */

import type { Language } from '@/commons/stores/useLanguageStore';

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

type LabelMap = Record<Language, string>;

/**
 * 알레르기 타입 매핑 (code -> 아이콘, 다국어 레이블)
 * @see docs/schema.md - allergy_types 테이블
 */
const ALLERGY_LABELS: Record<string, LabelMap> = {
  eggs: {
    ko: '난류',
    en: 'Eggs',
    ja: '卵',
    zh: '鸡蛋',
    es: 'Huevos',
  },
  milk: {
    ko: '우유',
    en: 'Milk',
    ja: '乳',
    zh: '牛奶',
    es: 'Leche',
  },
  buckwheat: {
    ko: '메밀',
    en: 'Buckwheat',
    ja: 'そば',
    zh: '荞麦',
    es: 'Alforfón',
  },
  peanuts: {
    ko: '땅콩',
    en: 'Peanuts',
    ja: 'ピーナッツ',
    zh: '花生',
    es: 'Cacahuetes',
  },
  soybeans: {
    ko: '대두',
    en: 'Soy (Soybeans)',
    ja: '大豆',
    zh: '大豆',
    es: 'Soja',
  },
  wheat: {
    ko: '밀',
    en: 'Wheat',
    ja: '小麦',
    zh: '小麦',
    es: 'Trigo',
  },
  mackerel: {
    ko: '고등어',
    en: 'Mackerel',
    ja: 'サバ',
    zh: '鲭鱼',
    es: 'Caballa',
  },
  crab: {
    ko: '게',
    en: 'Crab',
    ja: 'カニ',
    zh: '螃蟹',
    es: 'Cangrejo',
  },
  shrimp: {
    ko: '새우',
    en: 'Shrimp',
    ja: 'エビ',
    zh: '虾',
    es: 'Camarón',
  },
  pork: {
    ko: '돼지고기',
    en: 'Pork',
    ja: '豚肉',
    zh: '猪肉',
    es: 'Cerdo',
  },
  peaches: {
    ko: '복숭아',
    en: 'Peach',
    ja: '桃',
    zh: '桃子',
    es: 'Melocotón',
  },
  tomatoes: {
    ko: '토마토',
    en: 'Tomato',
    ja: 'トマト',
    zh: '西红柿',
    es: 'Tomate',
  },
  sulfites: {
    ko: '아황산류',
    en: 'Sulfites',
    ja: '亜硫酸塩',
    zh: '亚硫酸盐',
    es: 'Sulfitos',
  },
  walnuts: {
    ko: '호두',
    en: 'Walnut',
    ja: 'くるみ',
    zh: '核桃',
    es: 'Nuez',
  },
  chicken: {
    ko: '닭고기',
    en: 'Chicken',
    ja: '鶏肉',
    zh: '鸡肉',
    es: 'Pollo',
  },
  beef: {
    ko: '소고기',
    en: 'Beef',
    ja: '牛肉',
    zh: '牛肉',
    es: 'Res',
  },
  squid: {
    ko: '오징어',
    en: 'Squid',
    ja: 'イカ',
    zh: '鱿鱼',
    es: 'Calamar',
  },
  shellfish: {
    ko: '조개류',
    en: 'Shellfish',
    ja: '貝類',
    zh: '贝类',
    es: 'Mariscos',
  },
  pine_nuts: {
    ko: '잣',
    en: 'Pine Nuts',
    ja: '松の実',
    zh: '松子',
    es: 'Piñones',
  },
};

const ALLERGY_ICONS: Record<string, string> = {
  eggs: '🥚',
  milk: '🥛',
  buckwheat: '🌾',
  peanuts: '🥜',
  soybeans: '🫘',
  wheat: '🌾',
  mackerel: '🐟',
  crab: '🦀',
  shrimp: '🦐',
  pork: '🐷',
  peaches: '🍑',
  tomatoes: '🍅',
  sulfites: '⚗️',
  walnuts: '🌰',
  chicken: '🐔',
  beef: '🐄',
  squid: '🦑',
  shellfish: '🐚',
  pine_nuts: '🌲',
};

/**
 * 식단 타입 매핑 (code -> 아이콘, 한글명)
 * @see docs/schema.md - diet_types 테이블
 */
const DIET_LABELS: Record<string, LabelMap> = {
  vegetarian: {
    ko: '채식주의',
    en: 'Vegetarian',
    ja: 'ベジタリアン',
    zh: '素食者',
    es: 'Vegetariano',
  },
  vegan: {
    ko: '비건',
    en: 'Vegan',
    ja: 'ビーガン',
    zh: '纯素',
    es: 'Vegano',
  },
  halal: {
    ko: '할랄',
    en: 'Halal',
    ja: 'ハラール',
    zh: '清真',
    es: 'Halal',
  },
  kosher: {
    ko: '코셔',
    en: 'Kosher',
    ja: 'コーシャー',
    zh: '犹太洁食',
    es: 'Kosher',
  },
  gluten_free: {
    ko: '글루텐 프리',
    en: 'Gluten Free',
    ja: 'グルテンフリー',
    zh: '无麸质',
    es: 'Sin gluten',
  },
  lactose_free: {
    ko: '유당 불내증',
    en: 'Lactose Free',
    ja: '乳糖不耐',
    zh: '无乳糖',
    es: 'Sin lactosa',
  },
  low_sodium: {
    ko: '저염식',
    en: 'Low Sodium',
    ja: '減塩',
    zh: '低钠',
    es: 'Bajo en sodio',
  },
  diabetic: {
    ko: '당뇨식',
    en: 'Diabetic Diet',
    ja: '糖尿病食',
    zh: '糖尿病饮食',
    es: 'Dieta para diabéticos',
  },
};

const DIET_ICONS: Record<string, string> = {
  vegetarian: '🥬',
  vegan: '🌱',
  halal: '☪️',
  kosher: '✡️',
  gluten_free: '🚫🌾',
  lactose_free: '🚫🥛',
  low_sodium: '🧂',
  diabetic: '💉',
};

/**
 * 심각도 레이블 매핑 (severity -> 한글 레이블)
 */
const SEVERITY_LABELS: Record<AllergySeverity, LabelMap> = {
  mild: {
    ko: '경미',
    en: 'Mild',
    ja: '軽度',
    zh: '轻度',
    es: 'Leve',
  },
  moderate: {
    ko: '보통',
    en: 'Moderate',
    ja: '中等度',
    zh: '中度',
    es: 'Moderada',
  },
  severe: {
    ko: '심각',
    en: 'Severe',
    ja: '重度',
    zh: '严重',
    es: 'Severa',
  },
  life_threatening: {
    ko: '생명위협',
    en: 'Life-threatening',
    ja: '生命を脅かす',
    zh: '危及生命',
    es: 'Peligro vital',
  },
};

const getLabelByLanguage = (
  map: Record<string, LabelMap>,
  code: string,
  language: Language
) => {
  const labels = map[code];
  if (!labels) return code;
  return labels[language] || labels.en || labels.ko || code;
};

/**
 * 알레르기 코드로 타입 정보 조회
 *
 * @param code - 알레르기 코드
 * @returns 알레르기 타입 정보 (없으면 기본값 반환)
 */
export function getAllergyTypeInfo(
  code: string,
  language: Language
): AllergyTypeInfo {
  return {
    code,
    name: getLabelByLanguage(ALLERGY_LABELS, code, language),
    icon: ALLERGY_ICONS[code] || '❓',
  };
}

/**
 * 식단 코드로 타입 정보 조회
 *
 * @param code - 식단 코드
 * @returns 식단 타입 정보 (없으면 기본값 반환)
 */
export function getDietTypeInfo(
  code: string,
  language: Language
): DietTypeInfo {
  return {
    code,
    name: getLabelByLanguage(DIET_LABELS, code, language),
    icon: DIET_ICONS[code] || '❓',
  };
}

/**
 * 심각도 코드로 한글 레이블 조회
 *
 * @param severity - 심각도 코드
 * @returns 심각도 한글 레이블 (없으면 기본값 반환)
 */
export function getSeverityLabel(
  severity: string,
  language: Language
): string {
  const labels = SEVERITY_LABELS[severity as AllergySeverity];
  if (!labels) return severity;
  return labels[language] || labels.en || severity;
}
