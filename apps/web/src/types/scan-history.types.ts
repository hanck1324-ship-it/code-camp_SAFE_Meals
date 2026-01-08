/**
 * 스캔 이력 저장 관련 타입 정의
 *
 * scan_history + scan_results 테이블에 저장하기 위한 타입 정의
 *
 * @see 38prompts.401.scan-history-save.txt
 * @see 39prompts.401.scan-image-storage.txt
 * @see docs/schema.md
 */

// ============================================
// 이미지 스토리지 관련 타입 정의
// ============================================

/**
 * 이미지 업로드 파라미터
 */
export interface ImageUploadParams {
  /** 사용자 ID (Storage 경로에 사용) */
  userId: string;
  /** 스캔 ID (파일명에 사용) */
  scanId: string;
  /** Base64 또는 Data URL 형식의 이미지 데이터 */
  imageData: string;
  /** 이미지 MIME 타입 (기본값: image/webp) */
  contentType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * 이미지 업로드 결과
 */
export interface ImageUploadResult {
  /** 업로드 성공 여부 */
  success: boolean;
  /** 공개 접근 가능한 URL (성공 시) */
  publicUrl?: string;
  /** Storage 내 파일 경로 (성공 시) */
  storagePath?: string;
  /** 에러 메시지 (실패 시) */
  error?: string;
}

/**
 * 이미지 처리 옵션 (클라이언트 사이드 리사이징 권장)
 */
export interface ImageProcessOptions {
  /** 최대 너비 (기본값: 1200) */
  maxWidth?: number;
  /** 최대 높이 (기본값: 1200) */
  maxHeight?: number;
  /** 압축 품질 0-100 (기본값: 80) */
  quality?: number;
  /** 출력 포맷 (기본값: webp) */
  format?: 'webp' | 'jpeg';
}

// ============================================
// 타입 정의
// ============================================

/**
 * 안전 등급 (DB ENUM과 일치)
 */
export type SafetyLevelDB = 'safe' | 'caution' | 'danger' | 'unknown';

/**
 * 스캔 타입
 */
export type ScanType = 'menu' | 'barcode' | 'image';

/**
 * 위치 정보
 */
export interface LocationData {
  lat?: number;
  lng?: number;
  address?: string;
}

/**
 * scan_history 테이블 INSERT 타입
 */
export interface ScanHistoryInsert {
  user_id: string;
  scan_type: ScanType;
  image_url?: string | null;
  restaurant_name?: string | null;
  location?: LocationData | null;
  job_id?: string | null; // 중복 저장 방지용
}

/**
 * scan_results 테이블 INSERT 타입
 */
export interface ScanResultInsert {
  scan_id: string;
  menu_item_id?: string | null;
  product_id?: string | null;
  item_name: string;
  safety_level: SafetyLevelDB;
  warning_message?: string | null;
  matched_allergens?: string[] | null;
  matched_diets?: string[] | null;
  confidence_score?: number | null;
}

/**
 * 스캔 결과 아이템 (API에서 변환용)
 */
export interface ScanResultItem {
  itemName: string;
  safetyLevel: SafetyLevelDB;
  warningMessage?: string | null;
  matchedAllergens?: string[] | null;
  matchedDiets?: string[] | null;
  confidenceScore?: number | null;
}

/**
 * saveScan 메서드 파라미터 타입
 */
export interface SaveScanParams {
  userId: string;
  jobId?: string | null; // 중복 저장 방지용
  scanType: ScanType;
  imageUrl?: string | null;
  /** Base64 이미지 데이터 (Storage 업로드용) */
  imageData?: string | null;
  restaurantName?: string | null;
  location?: LocationData | null;
  results: ScanResultItem[];
}

/**
 * saveScan 메서드 반환 타입
 */
export interface SaveScanResult {
  success: boolean;
  scanId?: string;
  resultIds?: string[];
  error?: string;
  /** 이미지 업로드 소요 시간 (ms) */
  imageUploadMs?: number;
}

// ============================================
// 헬퍼 타입
// ============================================

/**
 * 신뢰도 등급 → 숫자 변환용 매핑 (API 응답 → DB 저장)
 */
export const CONFIDENCE_TO_SCORE: Record<string, number> = {
  high: 0.9,
  medium: 0.7,
  low: 0.5,
};

/**
 * API SafetyLevel → DB SafetyLevelDB 변환
 *
 * API에서 사용하는 대문자 → DB에서 사용하는 소문자 변환
 */
export function convertSafetyLevel(
  level: string | undefined | null
): SafetyLevelDB {
  if (!level) return 'unknown';

  const normalized = level.toUpperCase();
  switch (normalized) {
    case 'SAFE':
      return 'safe';
    case 'CAUTION':
      return 'caution';
    case 'DANGER':
      return 'danger';
    default:
      return 'unknown';
  }
}
