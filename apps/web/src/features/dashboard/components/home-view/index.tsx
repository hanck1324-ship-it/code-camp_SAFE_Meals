import { Clock, RefreshCw, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LanguageSelector } from '@/components/language-selector';
import { useTranslation } from '@/hooks/useTranslation';
import { useRecentScans } from '@/features/dashboard/hooks/useRecentScans';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';
import { ScanThumbnail } from '@/features/dashboard/components/scan-thumbnail';
import { SafeRestaurantMap } from '@/features/dashboard/components/safe-restaurant-map';

interface HomeDashboardProps {
  onScanMenu: () => void;
  haccpList?: any[];
  isLoading?: boolean;
  error?: string | null;
}

export function HomeDashboard({ onScanMenu, haccpList, isLoading, error }: HomeDashboardProps) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const {
    recentScans,
    isLoading: isScansLoading,
    error: scansError,
    refetch: refetchScans,
  } = useRecentScans();

  return (
    <div
      className="min-h-screen bg-white pb-24"
      data-testid="dashboard-container"
    >
      {/* Header */}
      <div className="bg-white px-6 pb-6 pt-8 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-[#2ECC71]">{t.appName}</h1>
            <p className="text-sm text-muted-foreground">{t.tagline}</p>
          </div>
          <LanguageSelector />
        </div>
      </div>

      {/* Recent Scans */}
      <div className="mb-8 px-6 pt-6" data-testid="recent-scans-section">
        <div className="mb-4 flex items-center justify-between">
          <h2>{t.recentScans}</h2>
          <button className="text-sm text-[#2ECC71]">{t.seeAll}</button>
        </div>

        {/* 로딩 상태 */}
        {isScansLoading && (
          <div
            className="scrollbar-hide -mx-6 flex gap-4 overflow-x-auto px-6 pb-2"
            data-testid="recent-scans-loading"
          >
            {[0, 1, 2].map((index) => (
              <div key={index} className="w-32 flex-shrink-0 animate-pulse">
                <div className="mb-2 h-12 w-32 rounded-2xl bg-gray-200" />
                <div className="mb-1 h-4 w-24 rounded bg-gray-200" />
                <div className="h-3 w-16 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {/* 에러 상태 */}
        {!isScansLoading && scansError && (
          <div
            className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6"
            data-testid="recent-scans-error"
          >
            <p className="mb-2 text-sm text-red-700">{scansError}</p>
            <button
              onClick={refetchScans}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
            >
              <RefreshCw className="h-4 w-4" />
              {t.retry}
            </button>
          </div>
        )}

        {/* 빈 상태 */}
        {!isScansLoading && !scansError && recentScans.length === 0 && (
          <div
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 p-6"
            data-testid="recent-scans-empty"
          >
            <Camera className="mb-2 h-8 w-8 text-gray-400" />
            <p className="mb-3 text-sm text-gray-600">
              {t.noScansYet}
            </p>
            <button
              onClick={onScanMenu}
              className="rounded-lg bg-[#2ECC71] px-4 py-2 text-sm text-white hover:bg-[#27AE60]"
            >
              {t.startScanning}
            </button>
          </div>
        )}

        {/* 스캔 데이터 표시 */}
        {!isScansLoading && !scansError && recentScans.length > 0 && (
          <div className="scrollbar-hide -mx-6 flex gap-4 overflow-x-auto px-6 pb-2">
            {recentScans.map((scan, index) => {
              return (
                <button
                  key={scan.id}
                  className="w-32 flex-shrink-0 text-left"
                  data-testid={`recent-scan-card-${index}`}
                  onClick={() => router.push(`/scan/${scan.id}`)}
                >
                  <ScanThumbnail
                    imageUrl={scan.imageUrl}
                    itemName={scan.representativeItem.itemName}
                    safetyLevel={scan.representativeItem.safetyLevel}
                    size="md"
                    showBadge={true}
                    language={language as 'ko' | 'en'}
                    className="mb-2 h-12 w-32 md:h-16 md:w-32"
                  />
                  <p className="truncate text-sm">{scan.representativeItem.itemName}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(scan.scannedAt, language)}</span>
                  </div>
                  {/* 결과 개수 표시 */}
                  {scan.representativeItem.totalCount > 1 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {t.totalItems.replace('{{count}}', scan.representativeItem.totalCount.toString())}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 나만의 안전식당 지도 */}
      <div className="mb-8 px-6">
        <SafeRestaurantMap height="400px" />
      </div>
    </div>
  );
}
