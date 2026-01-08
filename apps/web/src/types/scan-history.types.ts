/**
 * 스캔 이력 저장 관련 타입 정의
 *
 * scan_history + scan_results 테이블에 저장하기 위한 타입 정의
 *
 * @see 38prompts.401.scan-history-save.txt
 * @see docs/schema.md
 */

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
