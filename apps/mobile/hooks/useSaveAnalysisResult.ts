/**
 * 분석 결과 저장 Hook (Mobile)
 *
 * 메뉴 스캔 분석 결과를 Supabase에 자동 저장하는 클라이언트 사이드 Hook
 *
 * 특징:
 * - FINAL 상태 도달 시 자동 저장 트리거
 * - 중복 저장 방지 (job_id 기반 + savingRef)
 * - 저장 실패해도 UI 경험에 영향 없음
 * - RLS(Row Level Security) 정책 준수
 *
 * 참고: Mobile 버전은 WebView를 통해 Web의 분석 결과 페이지를 사용하므로
 *       이 Hook은 Native 화면에서 직접 저장이 필요한 경우를 위한 것
 *
 * @see 41prompts.401.result-page-save-supabase.txt
 * @see 38prompts.401.scan-history-save.txt
 */

import { useState, useCallback, useRef } from 'react';

import { getSupabaseClient } from '@/lib/supabase';

// ============================================
// 타입 정의
// ============================================

/**
 * 안전 등급 (DB ENUM과 일치)
 */
type SafetyLevelDB = 'safe' | 'caution' | 'danger' | 'unknown';

/**
 * 스캔 타입
 */
type ScanType = 'menu' | 'barcode' | 'image';

/**
 * 위치 정보
 */
interface LocationData {
  lat?: number;
  lng?: number;
  address?: string;
}

/**
 * 스캔 결과 아이템
 */
interface ScanResultItem {
  itemName: string;
  safetyLevel: SafetyLevelDB;
  warningMessage?: string | null;
  matchedAllergens?: string[] | null;
  matchedDiets?: string[] | null;
  confidenceScore?: number | null;
}

/**
 * 저장 파라미터
 */
interface SaveScanParams {
  userId: string;
  jobId?: string | null;
  scanType: ScanType;
  imageUrl?: string | null;
  imageData?: string | null;
  restaurantName?: string | null;
  location?: LocationData | null;
  results: ScanResultItem[];
}

/**
 * 저장 결과
 */
interface SaveScanResult {
  success: boolean;
  scanId?: string;
  resultIds?: string[];
  error?: string;
}

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
 * 분석 결과를 Supabase에 저장하는 Hook (Mobile 버전)
 *
 * 참고: 실제 저장 로직은 API 호출을 통해 Web 서버에서 처리할 수도 있음
 *       직접 Supabase 저장이 필요한 경우 ScanHistoryRepository 사용
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
   * Mobile에서는 WebView를 통해 Web의 저장 로직을 사용하거나,
   * 직접 Supabase에 저장하는 API를 호출
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

      // 결과가 없으면 저장하지 않음
      if (!params.results || params.results.length === 0) {
        console.log('⚠️ [AnalysisResult] 저장할 결과가 없습니다.');
        return { success: false, error: '저장할 결과가 없습니다.' };
      }

      // 저장 시작
      savingRef.current = true;
      setIsSaving(true);
      setSaveError(null);

      try {
        const supabase = getSupabaseClient();

        // ============================================
        // Step 1: scan_history 삽입
        // ============================================
        const historyInsert = {
          user_id: params.userId,
          scan_type: params.scanType,
          image_url: params.imageUrl ?? null,
          restaurant_name: params.restaurantName ?? null,
          location: params.location ?? null,
          job_id: params.jobId ?? null,
        };

        const { data: historyData, error: historyError } = await supabase
          .from('scan_history')
          .insert(historyInsert)
          .select('id')
          .single();

        if (historyError) {
          // job_id UNIQUE 제약 위반 시 중복 저장 방지
          if (historyError.code === '23505') {
            setIsDuplicate(true);
            console.log(
              `ℹ️ [AnalysisResult] 이미 저장됨 - jobId: ${params.jobId}`
            );
            return { success: false, error: '이미 저장된 스캔입니다.' };
          }
          throw historyError;
        }

        const scanId = historyData.id;
        console.log(
          `✅ [AnalysisResult] scan_history 삽입 완료 - scanId: ${scanId}`
        );

        // ============================================
        // Step 2: scan_results 삽입
        // ============================================
        const resultsInsert = params.results.map((result) => ({
          scan_id: scanId,
          item_name: result.itemName,
          safety_level: result.safetyLevel,
          warning_message: result.warningMessage ?? null,
          matched_allergens: result.matchedAllergens ?? null,
          matched_diets: result.matchedDiets ?? null,
          confidence_score: result.confidenceScore ?? null,
        }));

        const { data: resultsData, error: resultsError } = await supabase
          .from('scan_results')
          .insert(resultsInsert)
          .select('id');

        if (resultsError) {
          // 보상 트랜잭션: scan_history 삭제 시도
          console.error(
            `❌ [AnalysisResult] scan_results 삽입 실패, 보상 삭제 시도:`,
            resultsError
          );

          try {
            await supabase.from('scan_history').delete().eq('id', scanId);
            console.log(
              `🗑️ [AnalysisResult] 보상 삭제 완료 - scanId: ${scanId}`
            );
          } catch (cleanupError) {
            console.error(
              `⚠️ [AnalysisResult] 보상 삭제 실패 - orphan scanId: ${scanId}`,
              cleanupError
            );
          }

          throw resultsError;
        }

        const resultIds = resultsData.map((r: { id: string }) => r.id);
        setSavedScanId(scanId);
        console.log(
          `✅ [AnalysisResult] 저장 완료 - scanId: ${scanId}, items: ${resultIds.length}건`
        );

        return {
          success: true,
          scanId,
          resultIds,
        };
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
