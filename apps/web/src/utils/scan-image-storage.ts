/**
 * 스캔 이미지 스토리지 유틸리티 (scan-image-storage.ts)
 *
 * Supabase Storage를 사용하여 메뉴 스캔 이미지를 저장/삭제/조회하는 클래스
 *
 * 아키텍처:
 * - 버킷명: scan-images (공개 버킷)
 * - 경로 규칙: {user_id}/{year}/{month}/{scan_id}_{timestamp}.webp
 * - RLS 정책으로 사용자별 이미지 격리
 * - 파일 크기 제한: 5MB
 *
 * @see 39prompts.401.scan-image-storage.txt
 * @see docs/schema.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ImageUploadParams,
  ImageUploadResult,
} from '@/types/scan-history.types';

/** 스토리지 버킷명 */
const BUCKET_NAME = 'scan-images';

/** 최대 파일 크기 (5MB) */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Storage 파일 경로 생성
 *
 * 경로 포맷: {user_id}/{year}/{month}/{scan_id}_{timestamp}.webp
 *
 * @param userId - 사용자 UUID
 * @param scanId - 스캔 ID
 * @returns Storage 파일 경로
 */
export function generateImagePath(userId: string, scanId: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = now.getTime();

  return `${userId}/${year}/${month}/${scanId}_${timestamp}.webp`;
}

/**
 * Base64 문자열을 Blob으로 변환
 *
 * Data URL에서 순수 Base64 추출 후 Blob 생성
 * Edge Runtime 호환 (Buffer 사용)
 *
 * @param base64 - Base64 또는 Data URL 형식 문자열
 * @param contentType - MIME 타입
 * @returns Blob 객체
 */
export function base64ToBlob(base64: string, contentType: string): Blob {
  // Data URL에서 순수 Base64 추출
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

  // Node.js Buffer 사용 (Edge Runtime 호환)
  const buffer = Buffer.from(base64Data, 'base64');

  return new Blob([buffer], { type: contentType });
}

/**
 * 스캔 이미지 스토리지 클래스
 *
 * Supabase Storage를 사용하여 메뉴 스캔 이미지를 관리
 */
export class ScanImageStorage {
  private supabase: SupabaseClient;

  /**
   * @param supabase - RLS가 적용된 Supabase 클라이언트
   */
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * 스캔 이미지 업로드
   *
   * Base64 이미지 데이터를 Supabase Storage에 업로드하고
   * 공개 URL과 Storage 경로를 반환
   *
   * @param params - 업로드 파라미터
   * @returns 업로드 결과 (publicUrl, storagePath)
   */
  async uploadScanImage(params: ImageUploadParams): Promise<ImageUploadResult> {
    try {
      const { userId, scanId, imageData, contentType = 'image/webp' } = params;

      // 빈 이미지 데이터 검증
      if (!imageData || imageData.length === 0) {
        return {
          success: false,
          error: '이미지 데이터가 비어있습니다.',
        };
      }

      // Base64 → Blob 변환
      const blob = base64ToBlob(imageData, contentType);

      // 용량 검증 (5MB 제한)
      if (blob.size > MAX_FILE_SIZE_BYTES) {
        const sizeInMB = (blob.size / (1024 * 1024)).toFixed(2);
        console.error(
          `❌ [ScanImageStorage] 용량 초과: ${sizeInMB}MB (최대 5MB)`
        );
        return {
          success: false,
          error: `이미지 용량이 너무 큽니다 (${sizeInMB}MB). 5MB 이하로 리사이징 해주세요.`,
        };
      }

      // 📊 용량 정보 로깅
      console.log(
        `📊 [ScanImageStorage] 이미지 크기: ${(blob.size / 1024).toFixed(1)}KB`
      );

      // 파일 경로 생성
      const storagePath = generateImagePath(userId, scanId);

      // Supabase Storage 업로드
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, blob, {
          contentType,
          upsert: false, // 중복 방지
          cacheControl: '31536000', // 1년 캐시
        });

      if (error) {
        throw new Error(error.message);
      }

      // Public URL 생성
      const publicUrl = this.getPublicUrl(storagePath);

      console.log(`✅ [ScanImageStorage] 업로드 완료 - path: ${storagePath}`);

      return {
        success: true,
        publicUrl,
        storagePath,
      };
    } catch (error) {
      console.error('❌ [ScanImageStorage] 업로드 실패:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '이미지 업로드 실패',
      };
    }
  }

  /**
   * 스캔 이미지 삭제
   *
   * @param storagePath - Storage 내 파일 경로
   * @returns 삭제 성공 여부
   */
  async deleteScanImage(storagePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (error) {
        console.error(`❌ [ScanImageStorage] 삭제 실패:`, error);
        return false;
      }

      console.log(`🗑️ [ScanImageStorage] 삭제 완료 - path: ${storagePath}`);
      return true;
    } catch (error) {
      console.error('❌ [ScanImageStorage] 삭제 실패:', error);
      return false;
    }
  }

  /**
   * Public URL 생성
   *
   * @param storagePath - Storage 내 파일 경로
   * @returns 공개 접근 가능한 URL
   */
  getPublicUrl(storagePath: string): string {
    const { data } = this.supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }
}
