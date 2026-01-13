/**
 * Map Service Exports
 *
 * 지도 관련 타입과 서비스를 외부에 노출
 */

export * from './types';
export { LeafletMapService } from './LeafletMapService';

/**
 * 기본 지도 서비스 (현재: Leaflet)
 *
 * 나중에 Google Maps로 전환 시:
 * export { GoogleMapService as DefaultMapService } from './GoogleMapService';
 */
export { LeafletMapService as DefaultMapService } from './LeafletMapService';
