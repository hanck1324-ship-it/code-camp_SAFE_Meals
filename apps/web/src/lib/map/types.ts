/**
 * Map Provider Abstraction Layer
 *
 * 지도 제공자(Leaflet, Google Maps 등)를 교체 가능하게 하는 추상화 인터페이스
 * 나중에 Google Maps로 전환 시 UI 코드 수정 없이 구현체만 교체 가능
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapMarkerData {
  id: string;
  position: LatLng;
  title: string;
  description?: string;
  safetyLevel?: 'safe' | 'caution' | 'danger' | 'unknown';
  imageUrl?: string;
  onClick?: () => void;
}

export interface MapConfig {
  center: LatLng;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
}

/**
 * 지도 제공자 공통 인터페이스
 * Leaflet, Google Maps 등 모든 구현체가 이 인터페이스를 따름
 */
export interface MapAdapter {
  /**
   * 지도 초기화
   */
  initMap(containerId: string, config: MapConfig): void;

  /**
   * 마커 추가
   */
  addMarker(marker: MapMarkerData): void;

  /**
   * 여러 마커 일괄 추가
   */
  addMarkers(markers: MapMarkerData[]): void;

  /**
   * 특정 마커 제거
   */
  removeMarker(markerId: string): void;

  /**
   * 모든 마커 제거
   */
  clearMarkers(): void;

  /**
   * 카메라 이동
   */
  moveCamera(position: LatLng, zoom?: number): void;

  /**
   * 현재 위치로 이동
   */
  moveToCurrentLocation(): Promise<LatLng | null>;

  /**
   * 지도 파괴 (cleanup)
   */
  destroy(): void;
}

/**
 * 안전도 레벨에 따른 색상 매핑
 */
export const SAFETY_COLORS = {
  safe: '#2ECC71', // 초록
  caution: '#F39C12', // 노랑/주황
  danger: '#E74C3C', // 빨강
  unknown: '#95A5A6', // 회색
} as const;
