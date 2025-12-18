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

export const Colors = {
  primitives: ColorPrimitives,
  light: LightTheme,
  dark: DarkTheme,
  getTheme: getThemeColors,
} as const;
