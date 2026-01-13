'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type { MapMarkerData } from '@/lib/map';
import type { SafetyLevel } from './useRecentScans';

/**
 * 스캔 위치 데이터
 */
export interface ScanLocation {
  id: string;
  restaurantName: string | null;
  location: {
    lat: number;
    lng: number;
    address?: string;
  } | null;
  imageUrl: string | null;
  scannedAt: string;
  representativeSafetyLevel: SafetyLevel;
  itemCount: number;
}

/**
 * Hook 반환 타입
 */
export interface UseScanLocationsResult {
  scanLocations: ScanLocation[];
  markers: MapMarkerData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 위험도 우선순위 정의 (대표 안전도 선정용)
 */
const SAFETY_PRIORITY: Record<SafetyLevel, number> = {
  danger: 0,
  caution: 1,
  unknown: 2,
  safe: 3,
};

/**
 * 스캔 기록 중 위치 정보가 있는 데이터를 조회하는 Hook
 * 지도에 마커로 표시하기 위한 데이터 제공
 */
export function useScanLocations(): UseScanLocationsResult {
  const [scanLocations, setScanLocations] = useState<ScanLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScanLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();

      // 현재 로그인한 사용자 확인
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error('인증 정보를 확인할 수 없습니다.');
      }

      if (!user) {
        setScanLocations([]);
        setIsLoading(false);
        return;
      }

      // scan_history에서 location이 있는 데이터만 조회
      const { data, error: queryError } = await supabase
        .from('scan_history')
        .select(
          `
          id,
          restaurant_name,
          location,
          image_url,
          scanned_at,
          scan_results (
            id,
            item_name,
            safety_level
          )
        `
        )
        .eq('user_id', user.id)
        .not('location', 'is', null) // location이 null이 아닌 것만
        .order('scanned_at', { ascending: false })
        .limit(50); // 최대 50개

      if (queryError) {
        throw new Error(queryError.message);
      }

      // 데이터 가공
      const processed: ScanLocation[] = (data || [])
        .filter((scan) => {
          // location이 유효한지 확인
          const loc = scan.location as { lat?: number; lng?: number } | null;
          return loc && typeof loc.lat === 'number' && typeof loc.lng === 'number';
        })
        .map((scan) => {
          const results = scan.scan_results as Array<{
            id: string;
            item_name: string;
            safety_level: SafetyLevel;
          }>;

          // 가장 위험한 안전도를 대표로 선정
          const sorted = [...(results || [])].sort(
            (a, b) => SAFETY_PRIORITY[a.safety_level] - SAFETY_PRIORITY[b.safety_level]
          );
          const representativeSafetyLevel =
            sorted.length > 0 ? sorted[0].safety_level : 'unknown';

          return {
            id: scan.id,
            restaurantName: scan.restaurant_name,
            location: scan.location as { lat: number; lng: number; address?: string },
            imageUrl: scan.image_url,
            scannedAt: scan.scanned_at,
            representativeSafetyLevel,
            itemCount: results?.length || 0,
          };
        });

      setScanLocations(processed);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '위치 정보를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('useScanLocations error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 자동 조회
  useEffect(() => {
    fetchScanLocations();
  }, [fetchScanLocations]);

  // MapMarkerData 형식으로 변환
  const markers: MapMarkerData[] = scanLocations.map((scan) => ({
    id: scan.id,
    position: {
      lat: scan.location!.lat,
      lng: scan.location!.lng,
    },
    title: scan.restaurantName || '스캔한 식당',
    description: `${scan.itemCount}개 메뉴 분석 완료`,
    safetyLevel: scan.representativeSafetyLevel,
    imageUrl: scan.imageUrl || undefined,
  }));

  return {
    scanLocations,
    markers,
    isLoading,
    error,
    refetch: fetchScanLocations,
  };
}
