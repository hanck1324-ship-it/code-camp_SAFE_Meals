/**
 * 최근 스캔 기록 조회 Hook
 * - Supabase에서 scan_history + scan_results 조인
 * - 1:N 관계 처리: 대표 결과 선정 로직 적용
 */

import { useState, useEffect, useCallback } from 'react';

import { getSupabaseClient } from '@/lib/supabase';

import type {
  SafetyLevel,
  ScanType,
  ScanResultItem,
  RepresentativeItem,
  RecentScan,
  UseRecentScansResult,
} from '@/types/scan';

// 위험도 우선순위 정의 (숫자가 낮을수록 위험)
const SAFETY_PRIORITY: Record<SafetyLevel, number> = {
  danger: 0,
  caution: 1,
  unknown: 2,
  safe: 3,
};

// Supabase에서 반환되는 scan_results 행 타입
interface RawScanResult {
  id: string;
  item_name: string;
  safety_level: SafetyLevel;
}

// Supabase에서 반환되는 scan_history 행 타입
interface RawScanHistory {
  id: string;
  scan_type: ScanType;
  image_url: string | null;
  restaurant_name: string | null;
  scanned_at: string;
  scan_results: RawScanResult[];
}

/**
 * 대표 결과 선정 함수
 * 위험도 우선순위: danger > caution > unknown > safe
 * 가장 위험한 항목을 대표로 선정
 */
function selectRepresentativeResult(
  results: RawScanResult[]
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
 * Supabase 응답을 RecentScan 타입으로 변환
 */
function mapToRecentScan(row: RawScanHistory): RecentScan {
  const allResults: ScanResultItem[] =
    row.scan_results?.map((r) => ({
      id: r.id,
      itemName: r.item_name,
      safetyLevel: r.safety_level,
    })) ?? [];

  const representativeItem =
    row.scan_results && row.scan_results.length > 0
      ? selectRepresentativeResult(row.scan_results)
      : {
          itemName: '결과 없음',
          safetyLevel: 'unknown' as const,
          totalCount: 0,
        };

  return {
    id: row.id,
    scanType: row.scan_type,
    imageUrl: row.image_url,
    restaurantName: row.restaurant_name,
    scannedAt: row.scanned_at,
    representativeItem,
    allResults,
  };
}

/**
 * 최근 스캔 기록을 조회하는 Hook
 * @param limit 조회할 스캔 개수 (기본 3건)
 * @returns 최근 스캔 목록, 로딩/에러 상태, refetch 함수
 */
export function useRecentScans(limit = 3): UseRecentScansResult {
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
        .limit(limit);

      if (queryError) {
        throw new Error(queryError.message);
      }

      // 데이터 가공
      const processedScans: RecentScan[] =
        (data as RawScanHistory[] | null)?.map(mapToRecentScan) ?? [];
      setRecentScans(processedScans);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : '스캔 기록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('❌ [RecentScans] 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  // 컴포넌트 마운트 시 자동 조회
  useEffect(() => {
    fetchRecentScans();
  }, [fetchRecentScans]);

  return {
    recentScans,
    isLoading,
    error,
    refetch: fetchRecentScans,
    isEmpty: !isLoading && recentScans.length === 0,
  };
}
