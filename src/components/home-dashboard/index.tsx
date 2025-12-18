import { Star, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { LanguageSelector } from '../language-selector';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { useTranslation } from '@/hooks/useTranslation';

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
  const { t } = useTranslation();

  const recentScans = [
    {
      id: 1,
      name: t.bibimbap,
      image:
        'https://images.unsplash.com/photo-1590301157890-4810ed352733?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBmb29kJTIwYmliaW1iYXB8ZW58MXx8fHwxNzY1Njc0NDAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      time: '10 min ago',
    },
    {
      id: 2,
      name: t.kimchiJjigae,
      image:
        'https://images.unsplash.com/photo-1760228865341-675704c22a5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBraW1jaGklMjBzdGV3fGVufDF8fHx8MTc2NTc2MDk3OHww&ixlib=rb-4.1.0&q=80&w=1080',
      time: '1 hour ago',
    },
    {
      id: 3,
      name: t.bulgogi,
      image:
        'https://images.unsplash.com/photo-1584278858536-52532423b9ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBidWxnb2dpfGVufDF8fHx8MTc2NTc2MDk3OHww&ixlib=rb-4.1.0&q=80&w=1080',
      time: '2 hours ago',
    },
  ];

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
    <div className="min-h-screen bg-white pb-24">
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
      <div className="mb-8 px-6 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2>{t.recentScans}</h2>
          <button className="text-sm text-[#2ECC71]">{t.seeAll}</button>
        </div>
        <div className="scrollbar-hide -mx-6 flex gap-4 overflow-x-auto px-6 pb-2">
          {recentScans.map((scan) => (
            <div key={scan.id} className="w-32 flex-shrink-0">
              <div className="mb-2 h-32 w-32 overflow-hidden rounded-2xl shadow-md">
                <ImageWithFallback
                  src={scan.image}
                  alt={scan.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="truncate text-sm">{scan.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{scan.time}</span>
              </div>
            </div>
          ))}
        </div>
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
