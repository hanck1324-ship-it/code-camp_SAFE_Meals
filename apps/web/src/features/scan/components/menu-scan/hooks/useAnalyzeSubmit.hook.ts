'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import {
  useAnalyzeResult,
  type AnalysisResult,
  type MenuAnalysisItem,
} from '@/features/scan/context/analyze-result-context';

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
export interface AnalyzeAPIResponse {
  success: boolean;
  message?: string;
  analyzed_at?: string;
  user_context?: {
    allergies: string[];
    diet: string;
  };
  overall_status?: 'SAFE' | 'CAUTION' | 'DANGER';
  results?: MenuAnalysisItem[];
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
  /** 이미지 설정 */
  setImageData: (data: string | null) => void;
  /** 분석 제출 */
  submitAnalyze: (image: File | string, language: 'ko' | 'en') => Promise<void>;
  /** 에러 초기화 */
  clearError: () => void;
  /** 상태 리셋 */
  reset: () => void;
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
 * 이미지 분석 제출 커스텀 훅
 *
 * 기능:
 * 1) 촬영된 이미지를 Edge Function으로 전송
 * 2) 품질 검사 결과 처리
 * 3) 분석 결과 저장 및 페이지 이동
 * 4) 에러 처리 및 로딩 상태 관리
 */
export function useAnalyzeSubmit(): UseAnalyzeSubmitReturn {
  const router = useRouter();
  const { setAnalysisResult, clearAnalysisResult } = useAnalyzeResult();

  const [imageData, setImageData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AbortController 참조
  const abortControllerRef = useRef<AbortController | null>(null);

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
   * 분석 제출
   */
  const submitAnalyze = useCallback(
    async (image: File | string, language: 'ko' | 'en'): Promise<void> => {
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

        // Edge Function 호출
        const response = await fetch('/api/scan/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            image: base64Image,
            language,
            device_info: {
              platform:
                typeof navigator !== 'undefined'
                  ? navigator.platform
                  : 'unknown',
              userAgent:
                typeof navigator !== 'undefined'
                  ? navigator.userAgent
                  : 'unknown',
            },
            user_context: userContext,
          }),
          signal,
        });

        clearTimeout(timeoutId);

        // 응답 JSON 파싱
        const data: AnalyzeAPIResponse = await response.json();

        // API 에러 응답 처리
        if (!response.ok || !data.success) {
          const errorMessage = data.message || ERROR_MESSAGES[language].server;
          setError(errorMessage);
          return;
        }

        // 분석 결과가 있는 경우
        if (data.results && data.results.length > 0) {
          // 백엔드에서 받은 overall_status 사용 (없으면 SAFE 기본값)
          const overallStatus = data.overall_status || 'SAFE';
          const detectedIngredients: string[] = [];
          const warnings: Array<{
            ingredient: string;
            allergen: string;
            severity: 'HIGH' | 'MEDIUM' | 'LOW';
          }> = [];

          for (const item of data.results) {
            // 재료 수집
            detectedIngredients.push(...item.ingredients);

            // warnings 생성 (DANGER, CAUTION 항목만)
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

          // 분석 결과 변환
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

          setAnalysisResult(analysis);
          // 결과 페이지로 이동
          router.push('/scan/result');
        } else {
          // 결과가 없는 경우
          setError(
            language === 'ko'
              ? '메뉴를 인식할 수 없습니다. 다시 촬영해주세요.'
              : 'Could not recognize menu. Please retake the photo.'
          );
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            setError(ERROR_MESSAGES[language].timeout);
          } else if (err.message === 'server') {
            setError(ERROR_MESSAGES[language].server);
          } else {
            setError(ERROR_MESSAGES[language].network);
          }
        } else {
          setError(ERROR_MESSAGES[language].network);
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [clearAnalysisResult]);

  return {
    imageData,
    isLoading,
    error,
    setImageData,
    submitAnalyze,
    clearError,
    reset,
  };
}
