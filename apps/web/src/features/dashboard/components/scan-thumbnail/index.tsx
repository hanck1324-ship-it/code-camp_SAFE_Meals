'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { SafetyLevel } from '@/features/dashboard/hooks/useRecentScans';

/**
 * 썸네일 크기별 스타일 정의
 */
const SIZE_STYLES = {
  sm: {
    container: 'h-12 w-20',
    badge: 'text-[10px] px-1 py-0.5',
    icon: 'h-4 w-4',
  },
  md: {
    container: 'h-16 w-28',
    badge: 'text-xs px-1.5 py-0.5',
    icon: 'h-5 w-5',
  },
  lg: {
    container: 'h-24 w-40',
    badge: 'text-xs px-2 py-1',
    icon: 'h-6 w-6',
  },
} as const;

/**
 * Safety Level별 스타일 정의
 * Tailwind CSS 클래스 사용 (하드코딩 색상 없음)
 */
const SAFETY_LEVEL_STYLES: Record<SafetyLevel, { bg: string; text: string; border: string }> = {
  safe: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  caution: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  danger: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  unknown: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
};

/**
 * Safety Level 라벨 (다국어 지원)
 */
const SAFETY_LEVEL_LABELS: Record<SafetyLevel, { ko: string; en: string }> = {
  safe: { ko: '안전', en: 'Safe' },
  caution: { ko: '주의', en: 'Caution' },
  danger: { ko: '위험', en: 'Danger' },
  unknown: { ko: '확인필요', en: 'Unknown' },
};

/**
 * ScanThumbnail 컴포넌트 Props
 */
interface ScanThumbnailProps {
  /** 이미지 URL (null이면 플레이스홀더 표시) */
  imageUrl: string | null;
  /** 아이템 이름 (alt 텍스트용) */
  itemName: string;
  /** 안전 등급 */
  safetyLevel: SafetyLevel;
  /** 썸네일 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** Safety Level 뱃지 표시 여부 */
  showBadge?: boolean;
  /** 언어 설정 (뱃지 라벨용) */
  language?: 'ko' | 'en';
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 스캔 이미지 썸네일 컴포넌트
 *
 * @description
 * - 스캔 이미지를 썸네일로 표시
 * - 이미지 없을 경우 플레이스홀더 표시
 * - 이미지 로딩 실패 시 폴백 처리
 * - Safety Level 뱃지 표시 지원
 */
export function ScanThumbnail({
  imageUrl,
  itemName,
  safetyLevel,
  size = 'md',
  showBadge = true,
  language = 'ko',
  className,
}: ScanThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizeStyles = SIZE_STYLES[size];
  const safetyStyles = SAFETY_LEVEL_STYLES[safetyLevel];
  const safetyLabel = SAFETY_LEVEL_LABELS[safetyLevel];

  // 이미지가 없거나 에러 발생 시 플레이스홀더 표시
  const showPlaceholder = !imageUrl || hasError;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-md',
        sizeStyles.container,
        className
      )}
      data-testid="scan-thumbnail"
      aria-busy={isLoading && !showPlaceholder}
    >
      {/* 로딩 스켈레톤 */}
      {isLoading && !showPlaceholder && (
        <div
          className="absolute inset-0 animate-pulse bg-gray-200"
          data-testid="scan-thumbnail-loading"
        />
      )}

      {/* 이미지 표시 */}
      {!showPlaceholder && (
        <img
          src={imageUrl}
          alt={`${itemName} 메뉴 이미지`}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-200',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            if (!hasError) {
              setHasError(true);
              setIsLoading(false);
              if (process.env.NODE_ENV === 'development') {
                console.warn(`[ScanThumbnail] 이미지 로딩 실패: ${imageUrl}`);
              }
            }
          }}
        />
      )}

      {/* 플레이스홀더 (이미지 없거나 로딩 실패) */}
      {showPlaceholder && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
          data-testid="scan-thumbnail-placeholder"
        >
          <Camera className={cn('text-gray-400', sizeStyles.icon)} />
          <span className="sr-only">메뉴 이미지 없음</span>
        </div>
      )}

      {/* Safety Level 뱃지 */}
      {showBadge && (
        <div
          className={cn(
            'absolute right-1 top-1 rounded font-medium border',
            sizeStyles.badge,
            safetyStyles.bg,
            safetyStyles.text,
            safetyStyles.border
          )}
          data-testid="scan-thumbnail-badge"
        >
          {language === 'ko' ? safetyLabel.ko : safetyLabel.en}
        </div>
      )}
    </div>
  );
}
