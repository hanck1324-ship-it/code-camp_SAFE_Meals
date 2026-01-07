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
};

const normalizeLanguageForAnalysis = (language: Language): 'ko' | 'en' =>
  language === 'ko' ? 'ko' : 'en';

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
    async (jobId: string, language: 'ko' | 'en') => {
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
          const response = await fetch(`/api/scan/result?jobId=${jobId}`);
          const data = await response.json();

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
        // 이미지를 Base64로 변환
        let base64Image: string;
        if (typeof image === 'string') {
          base64Image = image;
        } else {
          base64Image = await fileToBase64(image);
        }

        // 이미지 데이터 저장
        setImageData(base64Image);

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

        // API 헤더 구성
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // 요청 바디 생성 (크기 측정용)
        const requestBody = JSON.stringify({
          image: base64Image,
          language: analysisLanguage,
          device_info: {
            platform:
              typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
            userAgent:
              typeof navigator !== 'undefined'
                ? navigator.userAgent
                : 'unknown',
          },
          user_context: userContext,
        });

        // [계측] 요청 크기 기록
        tracker.setRequestSize(new Blob([requestBody]).size);

        // [계측] 업로드 구간 시작 (요청 전송)
        tracker.start('upload');
        tracker.start('network'); // 전체 네트워크도 시작

        // Edge Function 호출
        const response = await fetch('/api/scan/analyze', {
          method: 'POST',
          headers,
          body: requestBody,
          signal,
        });

        // [계측] 업로드 + TTFB 완료 (응답 헤더 수신됨)
        // Note: fetch는 응답 헤더가 도착하면 resolve됨
        // 따라서 upload + ttfb가 합쳐진 시점임
        tracker.end('upload');

        // [계측] 다운로드 구간 시작
        tracker.start('download');

        // [계측] 응답 크기 및 Server-Timing 기록
        const contentLength = response.headers.get('content-length');
        const serverTiming = response.headers.get('server-timing');
        tracker.setResponseSize(contentLength);
        tracker.setServerTiming(serverTiming);
        tracker.addMetadata({
          httpStatus: response.status,
          contentType: response.headers.get('content-type'),
          transferEncoding: response.headers.get('transfer-encoding'),
        });

        clearTimeout(timeoutId);

        // 응답 JSON 파싱 (다운로드 + 파싱)
        const data: AnalyzeAPIResponse = await response.json();

        // [계측] 다운로드 구간 종료
        tracker.end('download');

        // [계측] 네트워크 전체 구간 종료
        tracker.end('network');

        // [계측] 파싱 시간은 download에 포함됨 (response.json()이 둘 다 수행)
        // 별도 파싱 계측이 필요하면 clone() 사용 필요

        // API 에러 응답 처리
        if (!response.ok || !data.success) {
          const errorMessage =
            data.message || ERROR_MESSAGES[analysisLanguage].server;
          setError(errorMessage);
          // 에러 시에도 측정 완료
          tracker.finalize();
          tracker.printSummary();
          return;
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

        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            setError(ERROR_MESSAGES[analysisLanguage].timeout);
          } else if (err.message === 'server') {
            setError(ERROR_MESSAGES[analysisLanguage].server);
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
