/**
 * 스캔 이력 저장소 (scan-history-repository.ts)
 *
 * 메뉴 스캔 분석 결과를 scan_history + scan_results 테이블에 저장하는 리포지토리
 *
 * 아키텍처:
 * - RLS(Row Level Security) 정책을 준수하는 Supabase 클라이언트 사용
 * - 보상 트랜잭션 패턴으로 원자성 보장 시도
 * - 저장 실패가 전체 분석 응답에 영향 주지 않도록 설계
 * - 이미지 Storage 업로드 통합 (39prompts)
 *
 * @see 38prompts.401.scan-history-save.txt
 * @see 39prompts.401.scan-image-storage.txt
 * @see docs/schema.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SaveScanParams,
  SaveScanResult,
  ScanHistoryInsert,
  ScanResultInsert,
} from '@/types/scan-history.types';
import { ScanImageStorage } from '@/utils/scan-image-storage';

/**
 * 스캔 이력 저장소 클래스
 *
 * Supabase 클라이언트를 주입받아 scan_history + scan_results 테이블에 저장
 * RLS가 적용된 클라이언트 사용 (Service Role 아님)
 */
export class ScanHistoryRepository {
  private supabase: SupabaseClient;

  /**
   * @param supabase - RLS가 적용된 Supabase 클라이언트
   */
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * 스캔 이력과 결과를 저장
   *
   * 보상 트랜잭션 처리:
   * - 이미지 데이터가 있으면 먼저 Storage에 업로드
   * - scan_history 먼저 삽입 후 scan_results 삽입
   * - scan_results 삽입 실패 시 scan_history 삭제 시도 (보상 액션)
   * - 보상 삭제 실패 시 orphan 데이터 로그 남김
   *
   * @param params - 저장할 스캔 데이터
   * @returns 저장 결과 (scanId, resultIds)
   */
  async saveScan(params: SaveScanParams): Promise<SaveScanResult> {
    const {
      userId,
      jobId,
      scanType,
      imageUrl,
      imageData,
      restaurantName,
      location,
      results,
    } = params;

    // 결과가 없으면 저장하지 않음
    if (!results || results.length === 0) {
      console.log('⚠️ [ScanHistory] 저장할 결과가 없습니다.');
      return { success: false, error: '저장할 결과가 없습니다.' };
    }

    let scanId: string | undefined;
    let finalImageUrl: string | null = imageUrl ?? null;

    try {
      // ============================================
      // Step 0: 이미지 업로드 (선택적)
      // ============================================
      let imageUploadMs: number | undefined;

      if (imageData) {
        const imageStorage = new ScanImageStorage(this.supabase);
        const scanIdForImage = jobId || crypto.randomUUID();

        console.log(`📸 [ScanHistory] 이미지 업로드 시작...`);
        const imageUploadStart = Date.now();
        const uploadResult = await imageStorage.uploadScanImage({
          userId,
          scanId: scanIdForImage,
          imageData,
        });
        imageUploadMs = Date.now() - imageUploadStart;

        if (uploadResult.success && uploadResult.publicUrl) {
          finalImageUrl = uploadResult.publicUrl;
          console.log(
            `✅ [ScanHistory] 이미지 업로드 성공 (${imageUploadMs}ms): ${finalImageUrl}`
          );
        } else {
          // 업로드 실패해도 스캔 저장은 계속 진행 (image_url = null)
          console.warn(
            `⚠️ [ScanHistory] 이미지 업로드 실패 (${imageUploadMs}ms), 스캔 저장 계속 진행: ${uploadResult.error}`
          );
        }
      }

      // ============================================
      // Step 1: scan_history 삽입
      // ============================================
      const historyInsert: ScanHistoryInsert = {
        user_id: userId,
        scan_type: scanType,
        image_url: finalImageUrl,
        restaurant_name: restaurantName ?? null,
        location: location ?? null,
        job_id: jobId ?? null,
      };

      const { data: historyData, error: historyError } = await this.supabase
        .from('scan_history')
        .insert(historyInsert)
        .select('id')
        .single();

      if (historyError) {
        // job_id UNIQUE 제약 위반 시 중복 저장 방지
        if (historyError.code === '23505') {
          console.log(`⚠️ [ScanHistory] 중복 저장 방지됨 - jobId: ${jobId}`);
          return { success: false, error: '이미 저장된 스캔입니다.' };
        }
        throw historyError;
      }

      scanId = historyData.id;
      console.log(
        `✅ [ScanHistory] scan_history 삽입 완료 - scanId: ${scanId}`
      );

      // ============================================
      // Step 2: scan_results 삽입
      // ============================================
      const resultsInsert: ScanResultInsert[] = results.map((result) => ({
        scan_id: scanId!,
        item_name: result.itemName,
        safety_level: result.safetyLevel,
        warning_message: result.warningMessage ?? null,
        matched_allergens: result.matchedAllergens ?? null,
        matched_diets: result.matchedDiets ?? null,
        confidence_score: result.confidenceScore ?? null,
      }));

      const { data: resultsData, error: resultsError } = await this.supabase
        .from('scan_results')
        .insert(resultsInsert)
        .select('id');

      if (resultsError) {
        // ============================================
        // 보상 트랜잭션: scan_history 삭제 시도
        // ============================================
        console.error(
          `❌ [ScanHistory] scan_results 삽입 실패, 보상 삭제 시도:`,
          resultsError
        );

        try {
          await this.supabase.from('scan_history').delete().eq('id', scanId);
          console.log(`🗑️ [ScanHistory] 보상 삭제 완료 - scanId: ${scanId}`);
        } catch (cleanupError) {
          // 보상 삭제도 실패 시 orphan 로그
          console.error(
            `⚠️ [ScanHistory] 보상 삭제 실패 - orphan scanId: ${scanId}`,
            cleanupError
          );
        }

        throw resultsError;
      }

      const resultIds = resultsData.map((r: { id: string }) => r.id);
      console.log(
        `✅ [ScanHistory] 저장 완료 - scanId: ${scanId}, results: ${resultIds.length}건`
      );

      return {
        success: true,
        scanId,
        resultIds,
        imageUploadMs,
      };
    } catch (error) {
      console.error(`❌ [ScanHistory] 저장 실패:`, error);
      return {
        success: false,
        scanId, // 디버깅용 (orphan 가능성)
        error:
          error instanceof Error
            ? error.message
            : '저장 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * job_id로 이미 저장된 스캔인지 확인
   *
   * @param jobId - 확인할 job ID
   * @returns 이미 저장되었으면 true
   */
  async isAlreadySaved(jobId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('scan_history')
      .select('id')
      .eq('job_id', jobId)
      .maybeSingle();

    if (error) {
      console.error(`❌ [ScanHistory] 중복 확인 실패:`, error);
      return false; // 에러 시 저장 시도 허용
    }

    return data !== null;
  }
}
