/**
 * 프로젝트에서 사용하는 URL 경로 상수
 */

/**
 * 인증 관련 URL
 */
export const AUTH_URLS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
} as const;

/**
 * 온보딩 관련 URL
 */
export const ONBOARDING_URLS = {
  ALLERGY: '/onboarding/allergy',
  ALLERGY_DETAIL: '/onboarding/allergy-detail',
  DIET: '/onboarding/diet',
  DIET_DETAIL: '/onboarding/diet-detail',
} as const;

/**
 * 메인 기능 URL
 */
export const MAIN_URLS = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  SCAN: '/scan',
  SCAN_RESULT: '/scan/result',
  PROFILE: '/profile',
} as const;

/**
 * 프로필/설정 관련 URL
 */
export const PROFILE_URLS = {
  SETTINGS: '/profile/settings',
  LANGUAGE: '/profile/language',
  NOTIFICATIONS: '/profile/notifications',
  SAFETY_CARD: '/profile/safety-card',
  HELP: '/profile/help',
} as const;

/**
 * 설정 관련 URL (deprecated - PROFILE_URLS 사용 권장)
 */
export const SETTINGS_URLS = {
  LANGUAGE: '/settings/language',
  NOTIFICATIONS: '/settings/notifications',
  HELP: '/settings/help',
} as const;

/**
 * API 엔드포인트 URL
 */
export const API_URLS = {
  COMBINED: '/api/combined',
  TEST: '/api/test',
} as const;

/**
 * 모든 URL을 하나의 객체로 통합
 */
export const ROUTES = {
  AUTH: AUTH_URLS,
  ONBOARDING: ONBOARDING_URLS,
  MAIN: MAIN_URLS,
  PROFILE: PROFILE_URLS,
  SETTINGS: SETTINGS_URLS,
  API: API_URLS,
} as const;

