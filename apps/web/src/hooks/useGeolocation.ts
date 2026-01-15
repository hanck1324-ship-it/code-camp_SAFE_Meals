'use client';

import { useState, useEffect, useCallback } from 'react';

export interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface UseGeolocationResult {
  location: GeolocationPosition | null;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<GeolocationPosition | null>;
  hasPermission: boolean;
}

/**
 * 사용자 위치 정보를 가져오는 Hook
 *
 * 사용법:
 * ```tsx
 * const { location, getCurrentLocation } = useGeolocation();
 * ```
 */
export function useGeolocation(
  autoFetch: boolean = false
): UseGeolocationResult {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const getCurrentLocation =
    useCallback(async (): Promise<GeolocationPosition | null> => {
      // Geolocation API 지원 확인
      if (!navigator.geolocation) {
        const errorMsg = '이 브라우저는 위치 서비스를 지원하지 않습니다.';
        setError(errorMsg);
        return null;
      }

      setIsLoading(true);
      setError(null);

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const locationData: GeolocationPosition = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };

            setLocation(locationData);
            setIsLoading(false);
            setHasPermission(true);
            resolve(locationData);
          },
          (error) => {
            let errorMsg: string;

            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMsg =
                  '위치 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.';
                setHasPermission(false);
                break;
              case error.POSITION_UNAVAILABLE:
                errorMsg = '위치 정보를 사용할 수 없습니다.';
                break;
              case error.TIMEOUT:
                errorMsg = '위치 정보 요청 시간이 초과되었습니다.';
                break;
              default:
                errorMsg = '위치 정보를 가져오는 중 오류가 발생했습니다.';
            }

            setError(errorMsg);
            setIsLoading(false);
            console.warn('Geolocation error:', error);
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
    }, []);

  // autoFetch가 true면 마운트 시 자동으로 위치 가져오기
  useEffect(() => {
    if (autoFetch) {
      getCurrentLocation();
    }
  }, [autoFetch, getCurrentLocation]);

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    hasPermission,
  };
}
