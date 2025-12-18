/**
 * 프로젝트에서 사용하는 ENUM 상수들
 */

/**
 * 안전성 레벨
 */
export enum SafetyLevel {
  SAFE = 'SAFE',
  CAUTION = 'CAUTION',
  DANGER = 'DANGER',
}

/**
 * 알레르기 카테고리
 */
export enum AllergyCategory {
  DAIRY = 'DAIRY',
  EGGS = 'EGGS',
  FISH = 'FISH',
  SHELLFISH = 'SHELLFISH',
  TREE_NUTS = 'TREE_NUTS',
  PEANUTS = 'PEANUTS',
  WHEAT = 'WHEAT',
  SOYBEANS = 'SOYBEANS',
}

/**
 * 식이 제한 타입
 */
export enum DietType {
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
  HALAL = 'HALAL',
  KOSHER = 'KOSHER',
  GLUTEN_FREE = 'GLUTEN_FREE',
}

/**
 * 지원 언어
 */
export enum Language {
  KO = 'ko',
  EN = 'en',
  JA = 'ja',
  ZH = 'zh',
  ES = 'es',
}

/**
 * 사용자 권한
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

/**
 * 온보딩 단계
 */
export enum OnboardingStep {
  ALLERGY_CATEGORY = 'ALLERGY_CATEGORY',
  ALLERGY_DETAIL = 'ALLERGY_DETAIL',
  DIET_CATEGORY = 'DIET_CATEGORY',
  DIET_DETAIL = 'DIET_DETAIL',
  COMPLETE = 'COMPLETE',
}

