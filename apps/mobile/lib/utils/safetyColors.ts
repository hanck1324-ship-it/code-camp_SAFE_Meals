/**
 * 안전 등급별 색상 유틸리티
 * - 라이트/다크 모드 대응
 */

import type { SafetyLevel } from '@/types/scan';

export interface SafetyColors {
  background: string;
  text: string;
  border: string;
}

// 라이트 모드 색상
const LIGHT_COLORS: Record<SafetyLevel, SafetyColors> = {
  safe: { background: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  caution: { background: '#FEF9C3', text: '#A16207', border: '#FDE047' },
  danger: { background: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
  unknown: { background: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
};

// 다크 모드 색상
const DARK_COLORS: Record<SafetyLevel, SafetyColors> = {
  safe: { background: '#14532D', text: '#86EFAC', border: '#166534' },
  caution: { background: '#713F12', text: '#FDE047', border: '#A16207' },
  danger: { background: '#7F1D1D', text: '#FECACA', border: '#991B1B' },
  unknown: { background: '#374151', text: '#9CA3AF', border: '#4B5563' },
};

/**
 * 안전 등급에 따른 색상 반환
 * @param level 안전 등급
 * @param isDark 다크모드 여부
 * @returns 배경색, 텍스트색, 테두리색 객체
 */
export function getSafetyColors(
  level: SafetyLevel,
  isDark = false
): SafetyColors {
  return isDark ? DARK_COLORS[level] : LIGHT_COLORS[level];
}

/**
 * 안전 등급별 한국어 레이블 반환
 */
export function getSafetyLabel(level: SafetyLevel): string {
  const labels: Record<SafetyLevel, string> = {
    safe: '안전',
    caution: '주의',
    danger: '위험',
    unknown: '확인 필요',
  };
  return labels[level];
}

/**
 * 안전 등급별 아이콘 이름 반환 (Ionicons 기준)
 */
export function getSafetyIconName(
  level: SafetyLevel
): 'checkmark-circle' | 'alert-circle' | 'warning' | 'help-circle' {
  const icons: Record<
    SafetyLevel,
    'checkmark-circle' | 'alert-circle' | 'warning' | 'help-circle'
  > = {
    safe: 'checkmark-circle',
    caution: 'alert-circle',
    danger: 'warning',
    unknown: 'help-circle',
  };
  return icons[level];
}
