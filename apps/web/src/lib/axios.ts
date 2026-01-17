import axios from 'axios';

import { refreshSession } from './supabase';

import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

// 토큰 갱신 중복 방지
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * 공통 axios 인스턴스
 *
 * 기능:
 * - 자동 토큰 추가 (Authorization 헤더)
 * - 자동 에러 처리 (401, 429, 500 등)
 * - 401 시 토큰 갱신 후 재시도
 * - 타임아웃 설정
 * - 요청/응답 로깅 (개발 환경)
 */
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 30000, // 30초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 요청 인터셉터
 * 모든 요청에 자동으로 토큰 추가
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Supabase 토큰 가져오기
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sb-fogmlohrpnwmzkhvtwdp-auth-token');

      if (token) {
        try {
          const authData = JSON.parse(token);
          const accessToken = authData?.access_token;

          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        } catch (error) {
          console.warn('Failed to parse auth token:', error);
        }
      }
    }

    // 개발 환경에서 요청 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`
      );
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터
 * 에러 처리 및 로깅
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // 개발 환경에서 응답 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`
      );
    }
    return response;
  },
  async (error: AxiosError) => {
    // 에러 상세 정보
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    console.error(`[API Error] ${method} ${url} - Status: ${status}`);

    // 401 Unauthorized - 토큰 갱신 시도 후 재요청
    if (status === 401 && error.config) {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // 이미 재시도한 요청이면 로그인 페이지로 이동
      if (originalRequest._retry) {
        console.warn('인증 실패: 토큰 갱신 후에도 실패. 로그인이 필요합니다.');

        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/auth/login') {
            window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
        return Promise.reject(error);
      }

      // 토큰 갱신 중이면 대기
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 토큰 갱신 시도
        const refreshed = await refreshSession();

        if (refreshed && typeof window !== 'undefined') {
          // 새 토큰으로 요청 재시도
          const token = localStorage.getItem(
            'sb-fogmlohrpnwmzkhvtwdp-auth-token'
          );
          if (token) {
            const authData = JSON.parse(token);
            const accessToken = authData?.access_token;

            if (accessToken) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              onTokenRefreshed(accessToken);
              isRefreshing = false;
              return axiosInstance(originalRequest);
            }
          }
        }

        // 갱신 실패 - 로그인 페이지로 이동
        isRefreshing = false;
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/auth/login') {
            window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
      } catch (refreshError) {
        isRefreshing = false;
        console.error('토큰 갱신 실패:', refreshError);

        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/auth/login') {
            window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
      }
    }

    // 429 Too Many Requests - 할당량 초과
    if (status === 429) {
      const retryAfter = (error.response?.data as any)?.retry_after || 20;
      console.warn(`서버가 바쁩니다. ${retryAfter}초 후 다시 시도해주세요.`);

      // 사용자에게 알림 표시 (toast 등)
      if (typeof window !== 'undefined') {
        // TODO: toast 라이브러리로 알림 표시
        alert(`서버가 바쁩니다. ${retryAfter}초 후 다시 시도해주세요.`);
      }
    }

    // 500 Internal Server Error
    if (status === 500) {
      console.error('서버 에러 발생:', error.response?.data);
    }

    // 네트워크 에러 (timeout, connection refused 등)
    if (error.code === 'ECONNABORTED') {
      console.error('요청 타임아웃: 서버 응답이 없습니다.');
    }

    if (error.message === 'Network Error') {
      console.error('네트워크 에러: 인터넷 연결을 확인해주세요.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

/**
 * 타입 안전한 axios 에러 체크
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

/**
 * FormData 전용 axios 인스턴스
 * 파일 업로드 시 사용
 */
export const axiosFormData = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 90000, // 90초 타임아웃 (파일 업로드용)
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// FormData 인스턴스도 동일한 인터셉터 적용
axiosFormData.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Supabase 토큰 가져오기
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sb-fogmlohrpnwmzkhvtwdp-auth-token');

      if (token) {
        try {
          const authData = JSON.parse(token);
          const accessToken = authData?.access_token;

          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        } catch (error) {
          console.warn('Failed to parse auth token:', error);
        }
      }
    }

    // 개발 환경에서 요청 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`
      );
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

axiosFormData.interceptors.response.use(
  (response) => {
    // 개발 환경에서 응답 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`
      );
    }
    return response;
  },
  async (error: AxiosError) => {
    // 에러 상세 정보
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    console.error(`[API Error] ${method} ${url} - Status: ${status}`);

    // 401 Unauthorized - 토큰 갱신 시도 후 재요청
    if (status === 401 && error.config) {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // 이미 재시도한 요청이면 로그인 페이지로 이동
      if (originalRequest._retry) {
        console.warn('인증 실패: 토큰 갱신 후에도 실패. 로그인이 필요합니다.');

        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/auth/login') {
            window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
        return Promise.reject(error);
      }

      // 토큰 갱신 중이면 대기
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosFormData(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshed = await refreshSession();

        if (refreshed && typeof window !== 'undefined') {
          const token = localStorage.getItem(
            'sb-fogmlohrpnwmzkhvtwdp-auth-token'
          );
          if (token) {
            const authData = JSON.parse(token);
            const accessToken = authData?.access_token;

            if (accessToken) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              onTokenRefreshed(accessToken);
              isRefreshing = false;
              return axiosFormData(originalRequest);
            }
          }
        }

        isRefreshing = false;
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/auth/login') {
            window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
      } catch (refreshError) {
        isRefreshing = false;
        console.error('토큰 갱신 실패:', refreshError);

        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/auth/login') {
            window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
      }
    }

    // 429 Too Many Requests - 할당량 초과
    if (status === 429) {
      const retryAfter = (error.response?.data as any)?.retry_after || 20;
      console.warn(`서버가 바쁩니다. ${retryAfter}초 후 다시 시도해주세요.`);

      // 사용자에게 알림 표시 (toast 등)
      if (typeof window !== 'undefined') {
        // TODO: toast 라이브러리로 알림 표시
        alert(`서버가 바쁩니다. ${retryAfter}초 후 다시 시도해주세요.`);
      }
    }

    // 500 Internal Server Error
    if (status === 500) {
      console.error('서버 에러 발생:', error.response?.data);
    }

    // 네트워크 에러 (timeout, connection refused 등)
    if (error.code === 'ECONNABORTED') {
      console.error('요청 타임아웃: 서버 응답이 없습니다.');
    }

    if (error.message === 'Network Error') {
      console.error('네트워크 에러: 인터넷 연결을 확인해주세요.');
    }

    return Promise.reject(error);
  }
);
