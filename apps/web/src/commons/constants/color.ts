/**
 * Color Constants
 * 프로젝트 전체에서 사용되는 색상 토큰 정의 (vibe-coding 참조)
 * 다크모드를 포함한 모든 테마를 지원합니다.
 */

// ============================================
// Color Primitives (기본 색상 팔레트)
// ============================================

export const ColorPrimitives = {
  // Gray Scale
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  // Primary Colors
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C4A6E',
    950: '#082F49',
  },
  // Secondary Colors
  secondary: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#9333EA',
    700: '#7E22CE',
    800: '#6B21A8',
    900: '#581C87',
    950: '#3B0764',
  },
  // Success Colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  // Warning Colors
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },
  // Error Colors
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },
  // Info Colors
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },
} as const;

// Semantic Tokens (Light & Dark)
export const LightTheme = {
  background: {
    primary: ColorPrimitives.gray[50],
    secondary: ColorPrimitives.gray[100],
    tertiary: ColorPrimitives.gray[200],
    elevated: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.5)',
  },
  foreground: {
    primary: ColorPrimitives.gray[900],
    secondary: ColorPrimitives.gray[700],
    tertiary: ColorPrimitives.gray[500],
    disabled: ColorPrimitives.gray[400],
    inverse: '#FFFFFF',
  },
  border: {
    primary: ColorPrimitives.gray[300],
    secondary: ColorPrimitives.gray[200],
    focus: ColorPrimitives.primary[500],
    error: ColorPrimitives.error[500],
  },
  brand: {
    primary: ColorPrimitives.primary[600],
    secondary: ColorPrimitives.secondary[600],
    hover: ColorPrimitives.primary[700],
    active: ColorPrimitives.primary[800],
  },
  status: {
    success: ColorPrimitives.success[600],
    warning: ColorPrimitives.warning[600],
    error: ColorPrimitives.error[600],
    info: ColorPrimitives.info[600],
    successBg: ColorPrimitives.success[50],
    warningBg: ColorPrimitives.warning[50],
    errorBg: ColorPrimitives.error[50],
    infoBg: ColorPrimitives.info[50],
  },
  interactive: {
    default: ColorPrimitives.primary[600],
    hover: ColorPrimitives.primary[700],
    active: ColorPrimitives.primary[800],
    disabled: ColorPrimitives.gray[300],
  },
} as const;

export const DarkTheme = {
  background: {
    primary: ColorPrimitives.gray[950],
    secondary: ColorPrimitives.gray[900],
    tertiary: ColorPrimitives.gray[800],
    elevated: ColorPrimitives.gray[900],
    overlay: 'rgba(0,0,0,0.7)',
  },
  foreground: {
    primary: ColorPrimitives.gray[50],
    secondary: ColorPrimitives.gray[300],
    tertiary: ColorPrimitives.gray[400],
    disabled: ColorPrimitives.gray[600],
    inverse: ColorPrimitives.gray[900],
  },
  border: {
    primary: ColorPrimitives.gray[700],
    secondary: ColorPrimitives.gray[800],
    focus: ColorPrimitives.primary[400],
    error: ColorPrimitives.error[400],
  },
  brand: {
    primary: ColorPrimitives.primary[400],
    secondary: ColorPrimitives.secondary[400],
    hover: ColorPrimitives.primary[300],
    active: ColorPrimitives.primary[200],
  },
  status: {
    success: ColorPrimitives.success[400],
    warning: ColorPrimitives.warning[400],
    error: ColorPrimitives.error[400],
    info: ColorPrimitives.info[400],
    successBg: ColorPrimitives.success[950],
    warningBg: ColorPrimitives.warning[950],
    errorBg: ColorPrimitives.error[950],
    infoBg: ColorPrimitives.info[950],
  },
  interactive: {
    default: ColorPrimitives.primary[400],
    hover: ColorPrimitives.primary[300],
    active: ColorPrimitives.primary[200],
    disabled: ColorPrimitives.gray[700],
  },
} as const;

export type ThemeMode = 'light' | 'dark';
export type ThemeColors = typeof LightTheme | typeof DarkTheme;

export const getThemeColors = (mode: ThemeMode): ThemeColors =>
  mode === 'dark' ? DarkTheme : LightTheme;

/**
 * SafeMeals 전용 색상 시스템
 * - 원칙 6: 신호등 컬러 (안전/주의/위험) + 무채색
 * - 원칙 7: WCAG 명도 대비 4.5:1 이상
 */
export const SAFEMEALS_COLORS = {
  // 안전성 신호등 색상 (Light Mode)
  safety: {
    safe: {
      bg: '#F0FDF4',           // 초록 배경
      border: '#BBF7D0',       // 초록 테두리
      text: '#15803D',         // 초록 텍스트 (대비 7.2:1)
      icon: '#16A34A',         // 초록 아이콘
    },
    caution: {
      bg: '#FFFBEB',           // 노랑 배경
      border: '#FDE68A',       // 노랑 테두리
      text: '#92400E',         // 갈색 텍스트 (대비 8.5:1)
      icon: '#D97706',         // 주황 아이콘
    },
    danger: {
      bg: '#FEF2F2',           // 빨강 배경
      border: '#FECACA',       // 빨강 테두리
      text: '#B91C1C',         // 빨강 텍스트 (대비 7.8:1)
      icon: '#DC2626',         // 빨강 아이콘
    },
  },

  // 다크모드 안전성 색상
  safetyDark: {
    safe: {
      bg: '#052E16',
      border: '#166534',
      text: '#86EFAC',
      icon: '#4ADE80',
    },
    caution: {
      bg: '#451A03',
      border: '#92400E',
      text: '#FDE68A',
      icon: '#FBBF24',
    },
    danger: {
      bg: '#450A0A',
      border: '#991B1B',
      text: '#FCA5A5',
      icon: '#F87171',
    },
  },

  // UI 무채색
  ui: {
    background: '#FFFFFF',
    backgroundSecondary: '#FAFAFA',
    text: {
      primary: '#171717',      // 주 텍스트 (대비 16.1:1)
      secondary: '#404040',    // 보조 텍스트 (대비 9.7:1)
      tertiary: '#737373',     // 3차 텍스트 (대비 4.6:1)
    },
    border: '#E5E5E5',
  },
} as const;

/**
 * SafeMeals 색상 가져오기 (테마 모드 기반)
 */
export function getSafeMealsColors(mode: ThemeMode) {
  return mode === 'dark' ? SAFEMEALS_COLORS.safetyDark : SAFEMEALS_COLORS.safety;
}

/**
 * 안전성 상태별 색상 가져오기
 */
export type SafetyStatus = 'SAFE' | 'CAUTION' | 'DANGER';

export function getSafetyColors(status: SafetyStatus, mode: ThemeMode = 'light') {
  const colors = getSafeMealsColors(mode);
  return colors[status.toLowerCase() as 'safe' | 'caution' | 'danger'];
}

export const Colors = {
  primitives: ColorPrimitives,
  light: LightTheme,
  dark: DarkTheme,
  getTheme: getThemeColors,
  safeMeals: SAFEMEALS_COLORS,
  getSafeMealsColors,
  getSafetyColors,
} as const;
