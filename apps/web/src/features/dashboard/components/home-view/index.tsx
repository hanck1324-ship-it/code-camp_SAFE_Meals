import { MapPin, Clock, ShieldCheck, RefreshCw, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LanguageSelector } from '@/components/language-selector';
import { useTranslation } from '@/hooks/useTranslation';
import { useRecentScans } from '@/features/dashboard/hooks/useRecentScans';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';
import { ScanThumbnail } from '@/features/dashboard/components/scan-thumbnail';

interface HomeDashboardProps {
  onScanMenu: () => void;
  haccpList?: any[]; // 1. Props 타입 추가
  isLoading?: boolean; // 2. Props 타입 추가
  error?: string | null; // 3. 에러 상태 추가
}

export function HomeDashboard({
  onScanMenu,
  haccpList = [], // 기본값 설정
  isLoading = false,
  error = null,
}: HomeDashboardProps) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const {
    recentScans,
    isLoading: isScansLoading,
    error: scansError,
    refetch: refetchScans,
  } = useRecentScans();

  const restaurants = [
    {
      name: t.kimchiHouse,
      cuisine: t.korean,
      distance: '0.3 mi',
      rating: 4.8,
      safeItems: 12,
    },
    {
      name: t.pastaBella,
      cuisine: t.italian,
      distance: '0.5 mi',
      rating: 4.6,
      safeItems: 8,
    },
    {
      name: t.spiceGarden,
      cuisine: t.indian,
      distance: '0.7 mi',
      rating: 4.9,
      safeItems: 15,
    },
  ];

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
              다시 시도
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
              아직 스캔한 메뉴가 없습니다
            </p>
            <button
              onClick={onScanMenu}
              className="rounded-lg bg-[#2ECC71] px-4 py-2 text-sm text-white hover:bg-[#27AE60]"
            >
              메뉴 스캔하기
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
                    language={language}
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
                      총 {scan.representativeItem.totalCount}개 항목
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Safe Restaurants Nearby -> HACCP 인증 업소 리스트로 교체 */}
      <div className="mb-8 px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2>{t.safeRestaurantsNearby || 'HACCP 인증 업소'}</h2>
          <button className="text-sm text-[#2ECC71]">{t.viewAll}</button>
        </div>

        <div className="space-y-3">
          {/* 로딩 상태 처리 */}
          {isLoading ? (
            <div className="py-4 text-center text-gray-400">
              데이터를 불러오는 중...
            </div>
          ) : error ? (
            <div className="py-4 text-center">
              <div className="mb-2 text-red-500">⚠️ {error}</div>
              <div className="text-sm text-gray-400">
                API 키를 확인하거나 나중에 다시 시도해주세요.
              </div>
            </div>
          ) : haccpList.length > 0 ? (
            // 실제 데이터 렌더링
            haccpList.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  {/* 업소명 (BSSH_NM: API 원본 키) */}
                  <h3 className="font-bold text-gray-800">{item.BSSH_NM}</h3>
                  <div className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-bold text-green-700">
                      HACCP
                    </span>
                  </div>
                </div>

                <div className="mb-2 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                      제품
                    </span>
                    {/* 제품명 (PRDLST_NM: API 원본 키) */}
                    <span className="line-clamp-1">{item.PRDLST_NM}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {/* 주소 (ADDR: API 원본 키) */}
                    <span className="truncate text-xs">{item.ADDR}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-gray-400">
              표시할 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
