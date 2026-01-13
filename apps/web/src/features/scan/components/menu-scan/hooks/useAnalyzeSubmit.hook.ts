'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import type { Language } from '@/commons/stores/useLanguageStore';
import {
  useAnalyzeResult,
  type AnalysisResult,
  type MenuAnalysisItem,
} from '@/features/scan/context/analyze-result-context';
import {
  PerformanceTracker,
  getGlobalCollector,
} from '@/utils/performance-metrics';
import axios, { isAxiosError } from '@/lib/axios';
import { axiosFormData } from '@/lib/axios';
import { optimizeImage } from '@/utils/image-optimizer';
import { optimizeImageWithWorker } from '@/utils/image-optimizer-worker';
import { getCachedOCRResult, cacheOCRResult } from '@/utils/ocr-cache';

export type { MenuAnalysisItem };

/**
 * 사용자 컨텍스트 타입 (알레르기/식단 정보)
 */
export interface UserContext {
  allergies: string[];
  diets: string[];
}

/**
 * API 응답 타입 (실제 API 응답 형식)
 */
/**
 * QuickResult 타입 (1차 판정 결과)
 */
export interface QuickResult {
  level: 'SAFE' | 'CAUTION' | 'DANGER';
  summaryText: string;
  triggerCodes: string[];
  triggerLabels: string[];
  questionForStaff: string;
  confidence: 'low' | 'medium' | 'high';
}

/**
 * API 응답 타입 (PARTIAL/FINAL 패턴)
 */
export interface AnalyzeAPIResponse {
  success: boolean;
  status: 'PARTIAL' | 'FINAL';
  jobId?: string | null;
  message?: string;
  analyzed_at?: string;
  user_context?: {
    allergies: string[];
    diet: string;
  };
  overall_status?: 'SAFE' | 'CAUTION' | 'DANGER';
  results?: MenuAnalysisItem[];
  quickResult?: QuickResult;
}

/**
 * 분석 응답 타입 (훅에서 사용하는 형식 - 테스트 호환)
 */
export interface AnalyzeResponse {
  ok: boolean;
  quality: {
    passed: boolean;
    reason?: string;
    score?: {
      blur: number;
      brightness: number;
      resolution: number;
    };
  };
  analysis?: {
    overall_status: 'SAFE' | 'CAUTION' | 'DANGER';
    detected_ingredients: string[];
    warnings: Array<{
      ingredient: string;
      allergen: string;
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    message_ko: string;
    message_en: string;
    results?: MenuAnalysisItem[];
  };
}

/**
 * 훅 반환 타입
 */
export interface UseAnalyzeSubmitReturn {
  /** 이미지 데이터 */
  imageData: string | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 현재 성능 트래커 */
  performanceTracker: PerformanceTracker | null;
  /** 이미지 설정 */
  setImageData: (data: string | null) => void;
  /** 분석 제출 */
  submitAnalyze: (image: File | string, language: Language) => Promise<void>;
  /** 에러 초기화 */
  clearError: () => void;
  /** 상태 리셋 */
  reset: () => void;
  /** 렌더링 완료 알림 (계측용) */
  notifyRenderComplete: () => void;
}

/**
 * 타임아웃 시간 (90초) -  gemini-3-flash-preview는 이미지 분석에 시간이 걸림
 * 복잡한 메뉴판의 경우 더 오래 걸릴 수 있음
 */
const TIMEOUT_MS = 90000;

/**
 * 에러 메시지 정의
 */
const ERROR_MESSAGES = {
  ko: {
    network: '네트워크 연결을 확인해주세요.',
    server: '일시적인 오류가 발생했습니다. 다시 시도해주세요.',
    timeout: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
    qualityDefault:
      '사진이 흐릿하거나 품질이 좋지 않습니다. 다시 촬영해주세요.',
  },
  en: {
    network: 'Please check your network connection.',
    server: 'A temporary error occurred. Please try again.',
    timeout: 'Request timed out. Please try again.',
    qualityDefault: 'Photo quality is poor. Please retake the photo.',
  },
  ja: {
    network: 'ネットワーク接続を確認してください。',
    server: '一時的なエラーが発生しました。もう一度お試しください。',
    timeout: 'リクエストがタイムアウトしました。もう一度お試しください。',
    qualityDefault: '写真の品質が低いです。もう一度撮影してください。',
  },
  zh: {
    network: '请检查您的网络连接。',
    server: '发生临时错误，请重试。',
    timeout: '请求超时，请重试。',
    qualityDefault: '照片质量较差，请重新拍摄。',
  },
  es: {
    network: 'Por favor, verifica tu conexión de red.',
    server: 'Ocurrió un error temporal. Por favor, intenta de nuevo.',
    timeout: 'La solicitud ha caducado. Por favor, intenta de nuevo.',
    qualityDefault: 'La calidad de la foto es baja. Por favor, toma otra foto.',
  },
};

/**
 * 분석에 사용할 언어를 정규화합니다.
 * 모든 지원 언어(ko, en, ja, zh, es)를 그대로 반환합니다.
 */
const normalizeLanguageForAnalysis = (language: Language): Language => language;

/**
 * 사용자 알레르기/식단 정보 조회 헬퍼 함수
 *
 * Supabase에서 로그인한 사용자의 user_allergies, user_diets 테이블을 조회하여
 * allergy_code, diet_code 배열을 반환합니다.
 *
 * @returns {Promise<UserContext>} 사용자 알레르기/식단 정보
 *
 * 동작:
 * - 로그인한 사용자의 경우: 해당 사용자의 알레르기/식단 코드 배열 반환
 * - 미로그인 또는 조회 실패 시: 빈 배열([])로 기본값 반환
 * - 에러 발생 시에도 API 요청을 막지 않음
 */
async function fetchUserAllergyDietContext(): Promise<UserContext> {
  const defaultContext: UserContext = { allergies: [], diets: [] };

  try {
    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    // 미로그인 상태 시 빈 배열 반환
    if (!userId) {
      return defaultContext;
    }

    // 병렬로 알레르기/식단 정보 조회
    const [allergiesResult, dietsResult] = await Promise.all([
      supabase
        .from('user_allergies')
        .select('allergy_code')
        .eq('user_id', userId),
      supabase.from('user_diets').select('diet_code').eq('user_id', userId),
    ]);

    // 알레르기 코드 배열 추출 (에러 시 빈 배열)
    const allergies: string[] = allergiesResult.error
      ? []
      : (allergiesResult.data?.map((item) => item.allergy_code) ?? []);

    // 식단 코드 배열 추출 (에러 시 빈 배열)
    const diets: string[] = dietsResult.error
      ? []
      : (dietsResult.data?.map((item) => item.diet_code) ?? []);

    return { allergies, diets };
  } catch {
    // 에러 발생 시 빈 배열 반환 (API 요청은 계속 진행)
    return defaultContext;
  }
}

/**
 * 폴링 설정
 */
const POLL_INTERVAL_MS = 2000; // 2초마다 폴링
const MAX_POLL_ATTEMPTS = 30; // 최대 60초 (30 * 2초)

/**
 * 이미지 분석 제출 커스텀 훅
 *
 * 기능:
 * 1) 촬영된 이미지를 Edge Function으로 전송
 * 2) 품질 검사 결과 처리
 * 3) 분석 결과 저장 및 페이지 이동
 * 4) 에러 처리 및 로딩 상태 관리
 * 5) PARTIAL 응답 시 백그라운드 폴링으로 FINAL 결과 업데이트
 */
export function useAnalyzeSubmit(): UseAnalyzeSubmitReturn {
  const router = useRouter();
  const { setAnalysisResult, clearAnalysisResult } = useAnalyzeResult();

  const [imageData, setImageData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AbortController 참조
  const abortControllerRef = useRef<AbortController | null>(null);

  // 폴링 타이머 참조
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 성능 트래커 참조 (계측용)
  const performanceTrackerRef = useRef<PerformanceTracker | null>(null);

  /**
   * File을 Base64로 변환
   */
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * PARTIAL 응답 후 FINAL 결과 폴링
   * - 2초마다 /api/scan/result 호출
   * - FINAL 상태가 되면 결과 업데이트
   */
  const pollForFinalResult = useCallback(
    async (jobId: string, language: Language) => {
      let attempts = 0;

      const poll = async () => {
        if (attempts >= MAX_POLL_ATTEMPTS) {
          console.log('[Polling] 최대 시도 횟수 도달, 폴링 중단');
          return;
        }

        attempts++;
        console.log(
          `[Polling] 시도 ${attempts}/${MAX_POLL_ATTEMPTS} - jobId: ${jobId}`
        );

        try {
          const response = await axios.get(`/api/scan/result?jobId=${jobId}`);
          const data = response.data;

          // 서버 응답: { status: 'FINAL', result: {...}, results: [...] }
          if (data.status === 'FINAL' && (data.result || data.results)) {
            console.log('[Polling] FINAL 결과 수신!');

            // 폴링 중단
            if (pollTimerRef.current) {
              clearTimeout(pollTimerRef.current);
              pollTimerRef.current = null;
            }

            // FINAL 결과로 업데이트
            // 서버에서 result 또는 최상위 results를 사용
            const results = data.results || data.result?.results || [];

            if (results.length > 0) {
              const overallStatus = data.overall_status || data.result?.overall_status || 'SAFE';
              const detectedIngredients: string[] = [];
              const warnings: Array<{
                ingredient: string;
                allergen: string;
                severity: 'HIGH' | 'MEDIUM' | 'LOW';
              }> = [];

              for (const item of results) {
                detectedIngredients.push(...item.ingredients);

                if (item.safety_status === 'DANGER') {
                  warnings.push({
                    ingredient: item.original_name,
                    allergen: item.reason,
                    severity: 'HIGH',
                  });
                } else if (item.safety_status === 'CAUTION') {
                  warnings.push({
                    ingredient: item.original_name,
                    allergen: item.reason,
                    severity: 'MEDIUM',
                  });
                }
              }

              const analysis: AnalysisResult = {
                overall_status: overallStatus,
                detected_ingredients: [...new Set(detectedIngredients)],
                warnings,
                message_ko:
                  overallStatus === 'SAFE'
                    ? '안전하게 섭취할 수 있습니다.'
                    : overallStatus === 'CAUTION'
                      ? '주의가 필요한 메뉴가 있습니다.'
                      : '알레르기 유발 성분이 포함된 메뉴가 있습니다.',
                message_en:
                  overallStatus === 'SAFE'
                    ? 'Safe to consume.'
                    : overallStatus === 'CAUTION'
                      ? 'Some items require caution.'
                      : 'Some items contain allergens.',
                results,
                _isPartial: false, // FINAL 결과임
              };

              setAnalysisResult(analysis);
              console.log('[Polling] 결과 업데이트 완료');
            }
          } else if (data.status === 'PENDING') {
            // 아직 처리 중 - 다음 폴링 예약
            pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
          } else if (data.status === 'ERROR') {
            console.error('[Polling] 에러 발생:', data.error);
            // 에러 시 폴링 중단 (PARTIAL 결과는 유지)
          }
        } catch (err) {
          console.error('[Polling] 네트워크 에러:', err);
          // 네트워크 에러 시 다음 폴링 계속 시도
          pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        }
      };

      // 첫 폴링 시작 (2초 후)
      pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    },
    [setAnalysisResult]
  );

  /**
   * 분석 제출
   */
  const submitAnalyze = useCallback(
    async (image: File | string, language: Language): Promise<void> => {
      const analysisLanguage = normalizeLanguageForAnalysis(language);

      // 이전 폴링 중단
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }

      // 성능 트래커 초기화
      const tracker = new PerformanceTracker();
      performanceTrackerRef.current = tracker;

      // 전역 참조 설정 (결과 화면에서 렌더링 완료 시점 기록용)
      if (typeof window !== 'undefined') {
        (window as any).__currentPerformanceTracker = tracker;
      }

      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 새 AbortController 생성
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      setIsLoading(true);
      setError(null);

      try {
        // 🖼️ [최적화] 이미지 리사이징 및 압축
        let optimizedBlob: Blob;
        let base64Image: string;

        if (typeof image === 'string') {
          // 문자열인 경우 (이미 Base64)
          base64Image = image;
          // Base64를 Blob으로 변환
          const base64Data = base64Image.split(',')[1] || base64Image;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          optimizedBlob = new Blob([byteArray], { type: 'image/jpeg' });
        } else {
          // File 객체인 경우 - WebWorker로 최적화 수행
          console.log('[ImageOptimize] WebWorker로 이미지 최적화 시작...');

          let optimizeResult;
          try {
            // WebWorker 사용 (백그라운드 스레드에서 처리)
            optimizeResult = await optimizeImageWithWorker(image, {
              maxWidth: 1920,
              maxHeight: 1920,
              quality: 0.85,
              mimeType: 'image/jpeg',
            });
          } catch (workerError) {
            // WebWorker 실패 시 메인 스레드에서 처리
            console.warn('[ImageOptimize] WebWorker 실패, 메인 스레드로 fallback:', workerError);
            optimizeResult = await optimizeImage(image, {
              maxWidth: 1920,
              maxHeight: 1920,
              quality: 0.85,
              mimeType: 'image/jpeg',
            });
          }

          optimizedBlob = optimizeResult.blob;

          // Base64로 변환 (미리보기용)
          base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(optimizedBlob);
          });

          // [계측] 최적화 메트릭 기록
          tracker.addMetadata({
            imageOptimization: {
              originalSize: optimizeResult.originalSize,
              optimizedSize: optimizeResult.optimizedSize,
              compressionRatio: optimizeResult.compressionRatio,
              processingTime: optimizeResult.processingTime,
              originalDimensions: optimizeResult.originalDimensions,
              optimizedDimensions: optimizeResult.optimizedDimensions,
            },
          });
        }

        // 이미지 데이터 저장 (미리보기용)
        setImageData(base64Image);

        // 🔍 [최적화] OCR 캐시 확인
        // 참고: 현재는 전체 분석 결과를 캐싱하지 않고 향후 확장 가능
        const cachedOCRText = await getCachedOCRResult(optimizedBlob);
        if (cachedOCRText) {
          console.log('[OCRCache] 💡 이전에 스캔한 이미지 발견');
          console.log('   → 서버에서 최신 분석 수행 (알레르기/식단 변경 가능)');
          tracker.addMetadata({
            ocrCacheHit: true,
          });
        }

        // 사용자 알레르기/식단 정보 조회 (병렬로 실행 가능)
        const userContextPromise = fetchUserAllergyDietContext();

        // Supabase 세션에서 토큰 가져오기
        const supabase = getSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        // 사용자 컨텍스트 대기
        const userContext = await userContextPromise;

        // 타임아웃 설정
        const timeoutId = setTimeout(() => {
          abortControllerRef.current?.abort();
        }, TIMEOUT_MS);

        // 위치 정보 가져오기 (시도)
        let location: { lat: number; lng: number } | null = null;
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  timeout: 5000,
                  maximumAge: 60000, // 1분 내 캐시된 위치 허용
                });
              }
            );
            location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            console.log('[Location] 위치 정보 수집 성공:', location);
          } catch (err) {
            // 위치 정보 실패해도 스캔은 계속 진행
            console.log('[Location] 위치 정보 수집 실패 (스캔 계속):', err);
          }
        }

        // FormData 생성
        const formData = new FormData();

        // 최적화된 이미지를 File로 변환하여 추가
        const file = new File([optimizedBlob], 'menu.jpg', { type: 'image/jpeg' });

        formData.append('file', file);
        formData.append('language', analysisLanguage);

        // 위치 정보 추가 (있는 경우)
        if (location) {
          formData.append('location', JSON.stringify(location));
        }

        // [계측] 요청 크기 기록
        tracker.setRequestSize(optimizedBlob.size);

        // [계측] 업로드 구간 시작 (요청 전송)
        tracker.start('upload');
        tracker.start('network'); // 전체 네트워크도 시작

        // Edge Function 호출 (axios 사용)
        const response = await axiosFormData.post('/api/scan/analyze', formData, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          signal,
          timeout: TIMEOUT_MS,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`[Upload] ${percent}%`);
            }
          },
        });

        // [계측] 업로드 + TTFB 완료 (응답 헤더 수신됨)
        tracker.end('upload');

        // [계측] 다운로드 구간 시작
        tracker.start('download');

        // [계측] 응답 크기 및 Server-Timing 기록
        const contentLength = response.headers['content-length'];
        const serverTiming = response.headers['server-timing'];
        tracker.setResponseSize(contentLength);
        tracker.setServerTiming(serverTiming);
        tracker.addMetadata({
          httpStatus: response.status,
          contentType: response.headers['content-type'],
          transferEncoding: response.headers['transfer-encoding'],
        });

        clearTimeout(timeoutId);

        // 응답 데이터 (axios는 자동으로 JSON 파싱)
        const data: AnalyzeAPIResponse = response.data;

        // [계측] 다운로드 구간 종료
        tracker.end('download');

        // [계측] 네트워크 전체 구간 종료
        tracker.end('network');

        // API 에러 응답 처리
        if (!data.success) {
          const errorMessage =
            data.message || ERROR_MESSAGES[analysisLanguage].server;
          setError(errorMessage);
          // 에러 시에도 측정 완료
          tracker.finalize();
          tracker.printSummary();
          return;
        }

        // 💾 [최적화] OCR 결과를 캐시에 저장
        if (data.results && data.results.length > 0 && !cachedOCRText) {
          // 캐시 미스였고 분석 결과가 있으면 메뉴명들을 저장
          const menuNames = data.results.map((r) => r.original_name).join(', ');
          cacheOCRResult(optimizedBlob, menuNames).catch((err) => {
            console.warn('[OCRCache] 캐시 저장 실패 (무시):', err);
          });
        }

        // [계측] 매핑 구간 시작
        tracker.start('mapping');

        // ========================================
        // PARTIAL/FINAL 응답 처리
        // ========================================

        // Case 1: FINAL 응답 (results가 있음)
        if (
          data.status === 'FINAL' &&
          data.results &&
          data.results.length > 0
        ) {
          const overallStatus = data.overall_status || 'SAFE';
          const detectedIngredients: string[] = [];
          const warnings: Array<{
            ingredient: string;
            allergen: string;
            severity: 'HIGH' | 'MEDIUM' | 'LOW';
          }> = [];

          for (const item of data.results) {
            detectedIngredients.push(...item.ingredients);

            if (item.safety_status === 'DANGER') {
              warnings.push({
                ingredient: item.original_name,
                allergen: item.reason,
                severity: 'HIGH',
              });
            } else if (item.safety_status === 'CAUTION') {
              warnings.push({
                ingredient: item.original_name,
                allergen: item.reason,
                severity: 'MEDIUM',
              });
            }
          }

          const analysis: AnalysisResult = {
            overall_status: overallStatus,
            detected_ingredients: [...new Set(detectedIngredients)],
            warnings,
            message_ko:
              overallStatus === 'SAFE'
                ? '안전하게 섭취할 수 있습니다.'
                : overallStatus === 'CAUTION'
                  ? '주의가 필요한 메뉴가 있습니다.'
                  : '알레르기 유발 성분이 포함된 메뉴가 있습니다.',
            message_en:
              overallStatus === 'SAFE'
                ? 'Safe to consume.'
                : overallStatus === 'CAUTION'
                  ? 'Some items require caution.'
                  : 'Some items contain allergens.',
            results: data.results,
          };

          tracker.end('mapping', {
            metadata: {
              menuItemCount: data.results.length,
              ingredientCount: detectedIngredients.length,
              warningCount: warnings.length,
            },
          });

          tracker.start('rendering');
          setAnalysisResult(analysis);
          router.push('/scan/result');
        }
        // Case 2: PARTIAL 응답 (quickResult만 있음) → 바로 결과 화면으로 이동 + 백그라운드 폴링
        else if (data.status === 'PARTIAL' && data.quickResult) {
          const quickResult = data.quickResult;

          // quickResult를 임시 AnalysisResult로 변환
          const partialAnalysis: AnalysisResult = {
            overall_status: quickResult.level,
            detected_ingredients: [],
            warnings: quickResult.triggerLabels.map((label) => ({
              ingredient: label,
              allergen: quickResult.summaryText,
              severity: quickResult.level === 'DANGER' ? 'HIGH' : 'MEDIUM',
            })),
            message_ko: quickResult.summaryText,
            message_en: quickResult.summaryText,
            results: [],
            // PARTIAL 상태 표시용 추가 필드
            _isPartial: true,
            _jobId: data.jobId || null,
            _questionForStaff: quickResult.questionForStaff,
          };

          tracker.end('mapping', {
            metadata: {
              isPartial: true,
              jobId: data.jobId,
              quickLevel: quickResult.level,
            },
          });

          tracker.start('rendering');
          setAnalysisResult(partialAnalysis);
          router.push('/scan/result');

          // 백그라운드 폴링 시작 (jobId가 있는 경우)
          if (data.jobId) {
            pollForFinalResult(data.jobId, analysisLanguage);
          }
        }
        // Case 3: 결과 없음 (OCR + Gemini 둘 다 실패)
        else {
          // [계측] 매핑 구간 종료 (결과 없음)
          tracker.end('mapping');
          tracker.finalize();
          tracker.printSummary();

          // 결과가 없는 경우
          setError(
            analysisLanguage === 'ko'
              ? '메뉴를 인식할 수 없습니다. 다시 촬영해주세요.'
              : 'Could not recognize menu. Please retake the photo.'
          );
        }
      } catch (err) {
        // [계측] 에러 발생 시에도 측정 완료
        if (performanceTrackerRef.current) {
          performanceTrackerRef.current.finalize();
          performanceTrackerRef.current.printSummary();
        }

        // axios 에러 처리
        if (isAxiosError(err)) {
          if (err.code === 'ECONNABORTED' || err.code === 'ERR_CANCELED') {
            setError(ERROR_MESSAGES[analysisLanguage].timeout);
          } else if (err.response) {
            // 서버 응답이 있는 경우 (4xx, 5xx)
            const errorMessage = (err.response.data as any)?.message || ERROR_MESSAGES[analysisLanguage].server;
            setError(errorMessage);
            console.error(`[API Error] ${err.response.status}:`, err.response.data);
          } else if (err.request) {
            // 요청은 보냈지만 응답이 없는 경우 (네트워크 에러)
            setError(ERROR_MESSAGES[analysisLanguage].network);
            console.error('[Network Error] No response:', err.message);
          } else {
            // 요청 설정 중 에러
            setError(ERROR_MESSAGES[analysisLanguage].server);
            console.error('[Request Error]:', err.message);
          }
        } else if (err instanceof Error) {
          if (err.name === 'AbortError') {
            setError(ERROR_MESSAGES[analysisLanguage].timeout);
          } else {
            setError(ERROR_MESSAGES[analysisLanguage].network);
          }
        } else {
          setError(ERROR_MESSAGES[analysisLanguage].network);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [router, fileToBase64, setAnalysisResult]
  );

  /**
   * 에러 초기화
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 상태 리셋
   */
  const reset = useCallback(() => {
    setImageData(null);
    setIsLoading(false);
    setError(null);
    clearAnalysisResult();
    performanceTrackerRef.current = null;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [clearAnalysisResult]);

  /**
   * 렌더링 완료 알림 (계측용)
   * 결과 화면이 마운트된 후 useEffect에서 호출
   */
  const notifyRenderComplete = useCallback(() => {
    const tracker = performanceTrackerRef.current;
    if (tracker) {
      tracker.end('rendering');
      const metrics = tracker.finalize();
      tracker.printSummary();

      // 전역 컬렉터에 추가 (통계용)
      getGlobalCollector().add(metrics);
    }
  }, []);

  return {
    imageData,
    isLoading,
    error,
    performanceTracker: performanceTrackerRef.current,
    setImageData,
    submitAnalyze,
    clearError,
    reset,
    notifyRenderComplete,
  };
}
