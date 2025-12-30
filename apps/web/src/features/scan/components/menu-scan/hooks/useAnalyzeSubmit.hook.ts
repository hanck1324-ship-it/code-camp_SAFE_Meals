'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * 메뉴 분석 결과 항목
 */
export interface MenuAnalysisItem {
  id: string;
  original_name: string;
  translated_name: string;
  description: string;
  safety_status: 'SAFE' | 'CAUTION' | 'DANGER';
  reason: string;
  ingredients: string[];
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
  /** 분석 결과 */
  analysisResult: AnalyzeResponse['analysis'] | null;
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
 * 타임아웃 시간 (60초) - gemini-2.5-flash는 이미지 분석에 시간이 걸림
 */
const TIMEOUT_MS = 60000;

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

  const [imageData, setImageData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<
    AnalyzeResponse['analysis'] | null
  >(null);

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

        // Supabase 세션에서 토큰 가져오기
        const supabase = getSupabaseClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

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
          // 전체 상태 계산 (DANGER > CAUTION > SAFE)
          let overallStatus: 'SAFE' | 'CAUTION' | 'DANGER' = 'SAFE';
          const detectedIngredients: string[] = [];
          const warnings: Array<{
            ingredient: string;
            allergen: string;
            severity: 'HIGH' | 'MEDIUM' | 'LOW';
          }> = [];

          for (const item of data.results) {
            // 재료 수집
            detectedIngredients.push(...item.ingredients);

            // 상태 업데이트
            if (item.safety_status === 'DANGER') {
              overallStatus = 'DANGER';
              warnings.push({
                ingredient: item.original_name,
                allergen: item.reason,
                severity: 'HIGH',
              });
            } else if (
              item.safety_status === 'CAUTION' &&
              overallStatus !== 'DANGER'
            ) {
              overallStatus = 'CAUTION';
              warnings.push({
                ingredient: item.original_name,
                allergen: item.reason,
                severity: 'MEDIUM',
              });
            }
          }

          // 분석 결과 변환
          const analysis: AnalyzeResponse['analysis'] = {
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
    [router, fileToBase64]
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
    setAnalysisResult(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    imageData,
    isLoading,
    error,
    analysisResult,
    setImageData,
    submitAnalyze,
    clearError,
    reset,
  };
}
