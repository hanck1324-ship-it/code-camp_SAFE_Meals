/**
 * 분석 결과 저장 Hook (Web)
 *
 * 메뉴 스캔 분석 결과를 Supabase에 자동 저장하는 클라이언트 사이드 Hook
 *
 * 특징:
 * - FINAL 상태 도달 시 자동 저장 트리거
 * - 중복 저장 방지 (job_id 기반 + savingRef)
 * - 저장 실패해도 UI 경험에 영향 없음
 * - RLS(Row Level Security) 정책 준수
 *
 * @see 41prompts.401.result-page-save-supabase.txt
 * @see 38prompts.401.scan-history-save.txt
 */

'use client';

import { useState, useCallback, useRef } from 'react';

import { getSupabaseClient } from '@/lib/supabase';
import { ScanHistoryRepository } from '@/utils/scan-history-repository';

import type {
  SaveScanParams,
  SaveScanResult,
} from '@/types/scan-history.types';

// ============================================
// 타입 정의
// ============================================

/**
 * useSaveAnalysisResult Hook 반환 타입
 */
interface UseSaveAnalysisResultReturn {
  /** 저장 함수 */
  saveResult: (params: SaveScanParams) => Promise<SaveScanResult>;
  /** 저장 중 여부 */
  isSaving: boolean;
  /** 저장 에러 메시지 */
  saveError: string | null;
  /** 저장 완료된 scan ID */
  savedScanId: string | null;
  /** 중복 저장 감지 여부 */
  isDuplicate: boolean;
  /** 상태 초기화 함수 */
  resetSaveState: () => void;
}

// ============================================
// Hook 구현
// ============================================

/**
 * useSaveAnalysisResult
 *
 * 분석 결과를 Supabase에 저장하는 Hook
 *
 * 사용법:
 * ```tsx
 * const { saveResult, isSaving, savedScanId } = useSaveAnalysisResult();
 *
 * useEffect(() => {
 *   if (analysisResult?.status === 'FINAL' && !savedScanId && user?.id) {
 *     saveResult({
 *       userId: user.id,
 *       jobId: analysisResult.jobId,
 *       scanType: 'menu',
 *       results: [...],
 *     });
 *   }
 * }, [analysisResult, savedScanId, user?.id]);
 * ```
 */
export function useSaveAnalysisResult(): UseSaveAnalysisResultReturn {
  // 상태 관리
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedScanId, setSavedScanId] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // 중복 호출 방지용 ref
  const savingRef = useRef(false);

  /**
   * 분석 결과 저장 함수
   *
   * @param params - 저장할 스캔 데이터
   * @returns 저장 결과
   */
  const saveResult = useCallback(
    async (params: SaveScanParams): Promise<SaveScanResult> => {
      // 이미 저장 중이거나 저장 완료된 경우 스킵
      if (savingRef.current || savedScanId) {
        console.log('ℹ️ [AnalysisResult] 저장 스킵 - 이미 처리됨');
        return { success: true, scanId: savedScanId ?? undefined };
      }

      // 저장 시작
      savingRef.current = true;
      setIsSaving(true);
      setSaveError(null);

      try {
        const supabase = getSupabaseClient();
        const repository = new ScanHistoryRepository(supabase);
        const result = await repository.saveScan(params);

        if (result.success) {
          // 저장 성공
          setSavedScanId(result.scanId ?? null);
          console.log(
            `✅ [AnalysisResult] 저장 완료 - scanId: ${result.scanId}, items: ${result.resultIds?.length ?? 0}건`
          );
        } else if (
          result.error?.includes('duplicate') ||
          result.error?.includes('23505') ||
          result.error?.includes('이미 저장된')
        ) {
          // 중복 저장 감지
          setIsDuplicate(true);
          console.log(
            `ℹ️ [AnalysisResult] 이미 저장됨 - jobId: ${params.jobId}`
          );
        } else {
          // 저장 실패
          setSaveError(result.error ?? '저장 실패');
          console.error(`❌ [AnalysisResult] 저장 실패:`, result.error);
        }

        return result;
      } catch (error) {
        // 예외 발생
        const errorMessage =
          error instanceof Error ? error.message : '알 수 없는 오류';
        setSaveError(errorMessage);
        console.error(`❌ [AnalysisResult] 저장 실패:`, error);
        return { success: false, error: errorMessage };
      } finally {
        setIsSaving(false);
        savingRef.current = false;
      }
    },
    [savedScanId]
  );

  /**
   * 상태 초기화 함수
   *
   * 새로운 스캔 시작 시 이전 저장 상태를 초기화
   */
  const resetSaveState = useCallback(() => {
    setSavedScanId(null);
    setSaveError(null);
    setIsDuplicate(false);
    savingRef.current = false;
  }, []);

  return {
    saveResult,
    isSaving,
    saveError,
    savedScanId,
    isDuplicate,
    resetSaveState,
  };
}
