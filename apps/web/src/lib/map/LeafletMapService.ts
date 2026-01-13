/**
 * Leaflet 기반 지도 서비스 구현체
 *
 * MapAdapter 인터페이스를 Leaflet으로 구현
 * 나중에 GoogleMapService로 교체 가능
 */

import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import type { MapAdapter, LatLng, MapConfig, MapMarkerData } from './types';
import { SAFETY_COLORS } from './types';

export class LeafletMapService implements MapAdapter {
  private map: LeafletMap | null = null;
  private markers: Map<string, LeafletMarker> = new Map();
  private L: typeof import('leaflet') | null = null;

  /**
   * Leaflet 동적 import (SSR 대응)
   */
  private async loadLeaflet() {
    if (this.L) return this.L;

    // Next.js SSR 환경에서 안전하게 로드
    const L = (await import('leaflet')).default;

    // Leaflet CSS가 없으면 추가
    if (typeof window !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    this.L = L;
    return L;
  }

  /**
   * 지도 초기화
   */
  async initMap(containerId: string, config: MapConfig): Promise<void> {
    const L = await this.loadLeaflet();

    // 기존 지도가 있으면 제거
    if (this.map) {
      this.map.remove();
    }

    // Leaflet 지도 생성
    this.map = L.map(containerId, {
      center: [config.center.lat, config.center.lng],
      zoom: config.zoom,
      minZoom: config.minZoom || 3,
      maxZoom: config.maxZoom || 18,
      zoomControl: true,
    });

    // OpenStreetMap 타일 레이어 추가
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);
  }

  /**
   * 마커 추가
   */
  async addMarker(marker: MapMarkerData): Promise<void> {
    if (!this.map || !this.L) return;

    const L = this.L;
    const color = marker.safetyLevel ? SAFETY_COLORS[marker.safetyLevel] : SAFETY_COLORS.unknown;

    // 커스텀 아이콘 생성 (안전도에 따른 색상)
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="transform: rotate(45deg); color: white; font-size: 16px;">
            📍
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    // Leaflet 마커 생성
    const leafletMarker = L.marker([marker.position.lat, marker.position.lng], {
      icon,
      title: marker.title,
    });

    // 팝업 추가
    if (marker.title || marker.description) {
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
            ${marker.title}
          </h3>
          ${
            marker.description
              ? `<p style="margin: 0; font-size: 12px; color: #666;">${marker.description}</p>`
              : ''
          }
          ${
            marker.imageUrl
              ? `<img src="${marker.imageUrl}" style="width: 100%; height: 100px; object-fit: cover; margin-top: 8px; border-radius: 4px;" />`
              : ''
          }
        </div>
      `;
      leafletMarker.bindPopup(popupContent);
    }

    // 클릭 이벤트
    if (marker.onClick) {
      leafletMarker.on('click', marker.onClick);
    }

    // 지도에 추가
    leafletMarker.addTo(this.map);

    // 마커 저장 (나중에 제거 가능하도록)
    this.markers.set(marker.id, leafletMarker);
  }

  /**
   * 여러 마커 일괄 추가
   */
  async addMarkers(markers: MapMarkerData[]): Promise<void> {
    for (const marker of markers) {
      await this.addMarker(marker);
    }
  }

  /**
   * 특정 마커 제거
   */
  removeMarker(markerId: string): void {
    const marker = this.markers.get(markerId);
    if (marker && this.map) {
      this.map.removeLayer(marker);
      this.markers.delete(markerId);
    }
  }

  /**
   * 모든 마커 제거
   */
  clearMarkers(): void {
    this.markers.forEach((marker) => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers.clear();
  }

  /**
   * 카메라 이동
   */
  moveCamera(position: LatLng, zoom?: number): void {
    if (!this.map) return;

    if (zoom !== undefined) {
      this.map.setView([position.lat, position.lng], zoom);
    } else {
      this.map.panTo([position.lat, position.lng]);
    }
  }

  /**
   * 현재 위치로 이동
   */
  async moveToCurrentLocation(): Promise<LatLng | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          this.moveCamera(location, 15);
          resolve(location);
        },
        (error) => {
          console.warn('Failed to get current location:', error);
          resolve(null);
        }
      );
    });
  }

  /**
   * 지도 파괴 (cleanup)
   */
  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers.clear();
  }
}
