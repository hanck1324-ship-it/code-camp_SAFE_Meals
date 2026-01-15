/**
 * SafeMeals 디자인 토큰
 *
 * 10가지 디자인 원칙 적용:
 * - 원칙 1: 폰트 최소 16px, 줄 간격 1.4~1.6배
 * - 원칙 2: 정보 위계 명확화 (크기/굵기)
 * - 원칙 4: 터치 영역 최소 44px
 * - 원칙 8: 8배수 간격 시스템
 */

export const DESIGN_TOKENS = {
  // 폰트 크기 (위계별) - 원칙 1
  fontSize: {
    caption: '14px', // 보조 정보 (최소 사용)
    body: '16px', // 기본 본문 (13.5pt)
    bodyEmphasis: '18px', // 강조 본문
    subtitle: '20px', // 소제목
    title: '24px', // 제목
    displayTitle: '28px', // 큰 제목
  },

  // 줄 간격 (원칙 1: 1.4~1.6배)
  lineHeight: {
    tight: '1.4', // 제목용
    normal: '1.5', // 본문용
    relaxed: '1.6', // 긴 텍스트용
  },

  // 폰트 굵기 (원칙 2: 정보 위계)
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // 터치 영역 (원칙 4: 최소 44px)
  touchTarget: {
    minimum: '44px', // 최소 크기
    comfortable: '48px', // 권장 크기
    button: '56px', // 주요 버튼
  },

  // 간격 시스템 (원칙 8: 8배수)
  spacing: {
    xs: '4px', // 0.5 unit
    sm: '8px', // 1 unit
    md: '16px', // 2 unit
    lg: '24px', // 3 unit
    xl: '32px', // 4 unit
    xxl: '40px', // 5 unit
  },

  // 아이콘 크기 (원칙 3: 통일된 크기)
  iconSize: {
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
  },

  // 모서리 반경
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px',
  },
} as const;

// TypeScript 타입 추론
export type FontSize = keyof typeof DESIGN_TOKENS.fontSize;
export type TouchTarget = keyof typeof DESIGN_TOKENS.touchTarget;
export type Spacing = keyof typeof DESIGN_TOKENS.spacing;
