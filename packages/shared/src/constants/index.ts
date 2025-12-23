// 공통 상수 정의

export const APP_NAME = 'SafeMeals';
export const APP_VERSION = '0.1.0';

// API 엔드포인트
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// 웹뷰 URL (프로덕션/개발 환경)
export const WEBVIEW_BASE_URL = process.env.WEBVIEW_URL || 'http://localhost:3000';

// 테마 상수
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// 알레르기 관련 상수
export const ALLERGY_TYPES = [
  'eggs',
  'milk', 
  'buckwheat',
  'peanuts',
  'soybeans',
  'wheat',
  'mackerel',
  'crab',
  'shrimp',
  'pork',
  'peaches',
  'tomatoes',
  'sulfites',
  'walnuts',
  'chicken',
  'beef',
  'squid',
  'shellfish',
  'pine_nuts',
] as const;

export type AllergyType = typeof ALLERGY_TYPES[number];

// 식이 제한 타입
export const DIET_TYPES = [
  'vegetarian',
  'vegan',
  'halal',
  'kosher',
  'gluten_free',
  'lactose_free',
  'low_sodium',
  'diabetic',
] as const;

export type DietType = typeof DIET_TYPES[number];

// 안전 등급
export const SAFETY_LEVELS = {
  SAFE: 'safe',
  CAUTION: 'caution',
  DANGER: 'danger',
  UNKNOWN: 'unknown',
} as const;

export type SafetyLevel = typeof SAFETY_LEVELS[keyof typeof SAFETY_LEVELS];
