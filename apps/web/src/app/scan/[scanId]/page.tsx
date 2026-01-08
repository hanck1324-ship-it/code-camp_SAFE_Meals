'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft,
  X,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { RequireAuth } from '@/components/auth/require-auth';
import { useTranslation } from '@/hooks/useTranslation';

// ============================================
// 타입 정의
// ============================================

type SafetyStatus = 'SAFE' | 'CAUTION' | 'DANGER';
type SafetyLevelDB = 'safe' | 'caution' | 'danger' | 'unknown';

interface ScanResultItem {
  id: string;
  item_name: string;
  safety_level: SafetyLevelDB;
  warning_message: string | null;
  matched_allergens: string[] | null;
  matched_diets: string[] | null;
}

interface ScanDetailData {
  id: string;
  scan_type: string;
  image_url: string | null;
  restaurant_name: string | null;
  scanned_at: string;
  scan_results: ScanResultItem[];
}

// ============================================
// 스타일 상수
// ============================================

const STATUS_STYLES: Record<
  SafetyStatus,
  { bgStyle: string; textStyle: string; borderStyle: string }
> = {
  SAFE: {
    bgStyle: 'var(--sm-safe-bg)',
    textStyle: 'var(--sm-safe-text)',
    borderStyle: 'var(--sm-safe-border)',
  },
  CAUTION: {
    bgStyle: 'var(--sm-caution-bg)',
    textStyle: 'var(--sm-caution-text)',
    borderStyle: 'var(--sm-caution-border)',
  },
  DANGER: {
    bgStyle: 'var(--sm-danger-bg)',
    textStyle: 'var(--sm-danger-text)',
    borderStyle: 'var(--sm-danger-border)',
  },
};

const ICON_STYLES: Record<SafetyStatus, string> = {
  SAFE: 'var(--sm-safe-icon)',
  CAUTION: 'var(--sm-caution-icon)',
  DANGER: 'var(--sm-danger-icon)',
};

// ============================================
// 헬퍼 함수
// ============================================

function convertToSafetyStatus(level: SafetyLevelDB): SafetyStatus {
  switch (level) {
    case 'safe':
      return 'SAFE';
    case 'caution':
      return 'CAUTION';
    case 'danger':
      return 'DANGER';
    default:
      return 'CAUTION';
  }
}

function getOverallStatus(results: ScanResultItem[]): SafetyStatus {
  if (results.some((r) => r.safety_level === 'danger')) return 'DANGER';
  if (results.some((r) => r.safety_level === 'caution')) return 'CAUTION';
  return 'SAFE';
}

function getSafetyIcon(status: SafetyStatus, size = 20) {
  const Icon = {
    SAFE: CheckCircle,
    CAUTION: AlertTriangle,
    DANGER: AlertCircle,
  }[status];

  return <Icon style={{ width: size, height: size, color: ICON_STYLES[status] }} />;
}

function formatDate(dateString: string, language: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// 메인 컴포넌트
// ============================================

function ScanDetailContent({ scanId }: { scanId: string }) {
  const router = useRouter();
  const { language } = useTranslation();
  const [scanData, setScanData] = useState<ScanDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScanDetail() {
      try {
        const supabase = getSupabaseClient();

        const { data, error: queryError } = await supabase
          .from('scan_history')
          .select(
            `
            id,
            scan_type,
            image_url,
            restaurant_name,
            scanned_at,
            scan_results (
              id,
              item_name,
              safety_level,
              warning_message,
              matched_allergens,
              matched_diets
            )
          `
          )
          .eq('id', scanId)
          .single();

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (!data) {
          throw new Error('스캔 결과를 찾을 수 없습니다.');
        }

        setScanData(data as ScanDetailData);
      } catch (err) {
        console.error('스캔 상세 조회 실패:', err);
        setError(
          err instanceof Error
            ? err.message
            : language === 'ko'
              ? '스캔 결과를 불러올 수 없습니다.'
              : 'Unable to load scan results.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchScanDetail();
  }, [scanId, language]);

  const handleBack = () => {
    router.back();
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <span className="text-lg font-semibold">
            {language === 'ko' ? '스캔 결과' : 'Scan Result'}
          </span>
          <div className="h-10 w-10" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !scanData) {
    return (
      <div className="flex h-screen flex-col bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div />
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <p className="text-center text-lg text-gray-600">{error}</p>
          <button
            onClick={handleBack}
            className="rounded-full bg-primary px-6 py-3 text-white"
          >
            {language === 'ko' ? '돌아가기' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  const overallStatus = getOverallStatus(scanData.scan_results);
  const statusStyle = STATUS_STYLES[overallStatus];

  // 위험도 순으로 정렬
  const sortedResults = [...scanData.scan_results].sort((a, b) => {
    const priority = { danger: 0, caution: 1, unknown: 2, safe: 3 };
    return priority[a.safety_level] - priority[b.safety_level];
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <button
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <span className="text-lg font-semibold">
          {language === 'ko' ? '스캔 결과' : 'Scan Result'}
        </span>
        <div className="h-10 w-10" />
      </div>

      {/* Overall Status Banner */}
      <div
        className="flex items-center gap-3 p-4"
        style={{
          backgroundColor: statusStyle.bgStyle,
          borderBottom: `1px solid ${statusStyle.borderStyle}`,
        }}
      >
        {getSafetyIcon(overallStatus, 32)}
        <div>
          <p className="font-semibold" style={{ color: statusStyle.textStyle }}>
            {overallStatus === 'SAFE'
              ? language === 'ko'
                ? '안전한 메뉴입니다'
                : 'Safe to eat'
              : overallStatus === 'CAUTION'
                ? language === 'ko'
                  ? '주의가 필요한 메뉴가 있습니다'
                  : 'Some items need caution'
                : language === 'ko'
                  ? '위험한 메뉴가 있습니다'
                  : 'Dangerous items detected'}
          </p>
          <p className="text-sm" style={{ color: statusStyle.textStyle, opacity: 0.8 }}>
            {scanData.restaurant_name || (language === 'ko' ? '메뉴 스캔' : 'Menu Scan')}
          </p>
        </div>
      </div>

      {/* Scan Info */}
      <div className="bg-white p-4">
        <p className="text-sm text-gray-500">
          {formatDate(scanData.scanned_at, language)}
        </p>
      </div>

      {/* Results List */}
      <div className="flex-1 p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-500">
          {language === 'ko'
            ? `분석 결과 (${sortedResults.length}개)`
            : `Results (${sortedResults.length} items)`}
        </h3>
        <div className="space-y-3">
          {sortedResults.map((item) => {
            const itemStatus = convertToSafetyStatus(item.safety_level);
            const itemStyle = STATUS_STYLES[itemStatus];

            return (
              <div
                key={item.id}
                className="rounded-lg bg-white p-4 shadow-sm"
                style={{ borderLeft: `4px solid ${itemStyle.borderStyle}` }}
              >
                <div className="flex items-center gap-2">
                  {getSafetyIcon(itemStatus)}
                  <span className="font-medium">{item.item_name}</span>
                </div>

                {item.warning_message && (
                  <p className="mt-2 text-sm text-gray-600">{item.warning_message}</p>
                )}

                {item.matched_allergens && item.matched_allergens.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.matched_allergens.map((allergen) => (
                      <span
                        key={allergen}
                        className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"
                      >
                        {allergen}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ScanDetailPage() {
  const params = useParams<{ scanId: string }>();

  return (
    <RequireAuth>
      <ScanDetailContent scanId={params.scanId} />
    </RequireAuth>
  );
}
