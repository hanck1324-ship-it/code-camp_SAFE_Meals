'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

// 안전 등급 타입 정의
export type SafetyLevel = 'safe' | 'caution' | 'danger' | 'unknown';

// 스캔 타입 정의
export type ScanType = 'menu' | 'barcode' | 'image';

// 개별 스캔 결과 아이템
export interface ScanResultItem {
  id: string;
  itemName: string;
  safetyLevel: SafetyLevel;
}

// 대표 결과 정보
export interface RepresentativeItem {
  itemName: string; // "새우튀김" 또는 "새우튀김 외 2개"
  safetyLevel: SafetyLevel;
  totalCount: number; // 전체 결과 개수
}

// 최근 스캔 데이터
export interface RecentScan {
  id: string;
  scanType: ScanType;
  imageUrl: string | null;
  restaurantName: string | null;
  scannedAt: string;
  representativeItem: RepresentativeItem;
  allResults: ScanResultItem[];
}

// Hook 반환 타입
export interface UseRecentScansResult {
  recentScans: RecentScan[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// 위험도 우선순위 정의
const SAFETY_PRIORITY: Record<SafetyLevel, number> = {
  danger: 0,
  caution: 1,
  unknown: 2,
  safe: 3,
};

/**
 * 대표 결과 선정 함수
 * 위험도가 가장 높은 항목을 대표로 선정
 */
function selectRepresentativeResult(
  results: Array<{ id: string; item_name: string; safety_level: SafetyLevel }>
): RepresentativeItem {
  if (!results || results.length === 0) {
    return {
      itemName: '결과 없음',
      safetyLevel: 'unknown',
      totalCount: 0,
    };
  }

  // 위험도 순으로 정렬
  const sorted = [...results].sort(
    (a, b) => SAFETY_PRIORITY[a.safety_level] - SAFETY_PRIORITY[b.safety_level]
  );

  const representative = sorted[0];
  const totalCount = results.length;

  return {
    itemName:
      totalCount > 1
        ? `${representative.item_name} 외 ${totalCount - 1}개`
        : representative.item_name,
    safetyLevel: representative.safety_level,
    totalCount,
  };
}

/**
 * 최근 스캔 결과를 조회하는 Hook
 * scan_history + scan_results 조인하여 최신순 3건 조회
 */
export function useRecentScans(): UseRecentScansResult {
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentScans = useCallback(async () => {
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
        setRecentScans([]);
        setIsLoading(false);
        return;
      }

      // scan_history + scan_results 조인 쿼리
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
            safety_level
          )
        `
        )
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(3);

      if (queryError) {
        throw new Error(queryError.message);
      }

      // 데이터 가공
      const processedScans: RecentScan[] = (data || []).map((scan) => {
        const results = scan.scan_results as Array<{
          id: string;
          item_name: string;
          safety_level: SafetyLevel;
        }>;

        return {
          id: scan.id,
          scanType: scan.scan_type as ScanType,
          imageUrl: scan.image_url,
          restaurantName: scan.restaurant_name,
          scannedAt: scan.scanned_at,
          representativeItem: selectRepresentativeResult(results),
          allResults: (results || []).map((r) => ({
            id: r.id,
            itemName: r.item_name,
            safetyLevel: r.safety_level,
          })),
        };
      });

      setRecentScans(processedScans);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '스캔 기록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('useRecentScans error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 자동 조회
  useEffect(() => {
    fetchRecentScans();
  }, [fetchRecentScans]);

  return {
    recentScans,
    isLoading,
    error,
    refetch: fetchRecentScans,
  };
}
