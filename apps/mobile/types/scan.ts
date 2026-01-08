/**
 * 스캔 관련 타입 정의
 * - 안전 등급, 스캔 결과, 최근 스캔 데이터 타입
 */

// 안전 등급 타입
export type SafetyLevel = 'safe' | 'caution' | 'danger' | 'unknown';

// 스캔 타입
export type ScanType = 'menu' | 'barcode' | 'image';

// 개별 스캔 결과 아이템
export interface ScanResultItem {
  id: string;
  itemName: string;
  safetyLevel: SafetyLevel;
}

// 대표 결과 정보 (1:N 관계에서 가공된 값)
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
  // 대표 결과 (1:N 관계에서 가공된 값)
  representativeItem: RepresentativeItem;
  // 원본 결과 배열 (상세 보기용)
  allResults: ScanResultItem[];
}

// useRecentScans Hook 반환 타입
export interface UseRecentScansResult {
  recentScans: RecentScan[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isEmpty: boolean;
}
