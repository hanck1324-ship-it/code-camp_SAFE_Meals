'use client';

import { MapPin, Locate, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useScanLocations } from '@/features/dashboard/hooks/useScanLocations';
import { useTranslation } from '@/hooks/useTranslation';
import { DefaultMapService } from '@/lib/map';

import type { MapAdapter, LatLng } from '@/lib/map';

interface SafeRestaurantMapProps {
  className?: string;
  height?: string;
}

/**
 * 안전 식당 지도 컴포넌트
 *
 * - 스캔한 식당 위치를 지도에 마커로 표시
 * - 안전도에 따른 색상 구분
 * - 현재 위치 표시 기능
 */
export function SafeRestaurantMap({
  className,
  height = '400px',
}: SafeRestaurantMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapServiceRef = useRef<MapAdapter | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);

  const { t } = useTranslation();
  const { markers, isLoading, error, refetch } = useScanLocations();

  // 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initMap = async () => {
      const mapService = new DefaultMapService();

      // 기본 중심점: 서울 시청
      const defaultCenter: LatLng = {
        lat: 37.5665,
        lng: 126.978,
      };

      try {
        await mapService.initMap('safe-restaurant-map', {
          center: defaultCenter,
          zoom: 13,
          minZoom: 3,
          maxZoom: 18,
        });

        mapServiceRef.current = mapService;
        setIsMapReady(true);

        // 현재 위치로 이동 시도
        const location = await mapService.moveToCurrentLocation();
        if (location) {
          setCurrentLocation(location);
        }
      } catch (err) {
        console.error('Failed to initialize map:', err);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (mapServiceRef.current) {
        mapServiceRef.current.destroy();
        mapServiceRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []); // 빈 배열로 변경 - 컴포넌트 마운트 시 한 번만 실행

  // 마커 업데이트
  useEffect(() => {
    if (!isMapReady || !mapServiceRef.current || isLoading) return;

    const mapService = mapServiceRef.current;

    // 기존 마커 제거
    mapService.clearMarkers();

    // 새 마커 추가
    if (markers.length > 0) {
      mapService.addMarkers(markers);
    }
  }, [isMapReady, markers, isLoading]);

  // 현재 위치로 이동
  const handleMoveToCurrentLocation = async () => {
    if (!mapServiceRef.current) return;

    const location = await mapServiceRef.current.moveToCurrentLocation();
    if (location) {
      setCurrentLocation(location);
    } else {
      alert(t.locationPermissionError);
    }
  };

  return (
    <div className={className}>
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#2ECC71]" />
          <h2>{t.mySafeRestaurantMap}</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* 새로고침 버튼 */}
          <button
            onClick={refetch}
            disabled={isLoading}
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50 disabled:opacity-50"
            aria-label="새로고침"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
          {/* 현재 위치 버튼 */}
          <button
            onClick={handleMoveToCurrentLocation}
            className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
            aria-label="현재 위치로 이동"
          >
            <Locate className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 지도 영역 */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <div
          ref={mapContainerRef}
          id="safe-restaurant-map"
          style={{ height }}
          className="relative z-0"
        />

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin text-[#2ECC71]" />
              <p className="text-sm text-gray-600">{t.mapDataLoading}</p>
            </div>
          </div>
        )}

        {/* 에러 오버레이 */}
        {error && !isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
            <div className="text-center">
              <p className="mb-2 text-sm text-red-600">{error}</p>
              <button
                onClick={refetch}
                className="rounded-lg bg-[#2ECC71] px-4 py-2 text-sm text-white hover:bg-[#27AE60]"
              >
                {t.retry}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 마커 범례 */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-[#2ECC71]" />
          <span>{t.safe}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-[#F39C12]" />
          <span>{t.caution}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-[#E74C3C]" />
          <span>{t.danger}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-[#95A5A6]" />
          <span>{t.needsReview}</span>
        </div>
      </div>

      {/* 통계 정보 */}
      {!isLoading && markers.length > 0 && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-600">
          {t.scannedRestaurants.replace('{{count}}', markers.length.toString())}
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && !error && markers.length === 0 && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="mb-1 text-sm text-gray-600">{t.noRestaurantsYet}</p>
          <p className="text-xs text-gray-500">{t.scanMenuToDisplay}</p>
        </div>
      )}
    </div>
  );
}
