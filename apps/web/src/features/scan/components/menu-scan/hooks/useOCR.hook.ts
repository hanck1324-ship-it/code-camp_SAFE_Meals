'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * OCR 결과 항목 인터페이스
 */
export interface OCRResult {
  /** 추출된 텍스트 */
  text: string;
  /** 신뢰도 점수 (0-1) */
  confidence: number;
  /** 텍스트 위치 정보 */
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * OCR 응답 인터페이스
 */
export interface OCRResponse {
  /** 개별 OCR 결과 배열 */
  results: OCRResult[];
  /** 전체 추출 텍스트 */
  fullText: string;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
}

/**
 * OCR 훅 반환 타입
 */
export interface UseOCRReturn extends OCRResponse {
  /** 텍스트 추출 시작 */
  extractText: (image: Blob) => Promise<void>;
  /** 재시도 */
  retry: () => Promise<void>;
  /** 상태 초기화 */
  reset: () => void;
}

/**
 * Google Vision API 응답 타입
 */
interface VisionAPIResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly?: {
        vertices: Array<{
          x?: number;
          y?: number;
        }>;
      };
      confidence?: number;
    }>;
    fullTextAnnotation?: {
      text: string;
    };
    error?: {
      message: string;
    };
  }>;
}

/**
 * 최대 재시도 횟수
 */
const MAX_RETRIES = 3;

/**
 * 재시도 대기 시간 (ms)
 */
const RETRY_DELAY = 1000;

/**
 * Google Cloud Vision API를 연동한 OCR 커스텀 훅
 *
 * 기능:
 * 1) Google Cloud Vision API 연동 (TEXT_DETECTION)
 * 2) OCR 텍스트 추출 (fullTextAnnotation, textAnnotations)
 * 3) Bounding Box 정보 추출
 * 4) 에러 처리 및 재시도 로직
 */
export function useOCR(): UseOCRReturn {
  const [results, setResults] = useState<OCRResult[]>([]);
  const [fullText, setFullText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 마지막 이미지 참조 (재시도용)
  const lastImageRef = useRef<Blob | null>(null);
  // 재시도 횟수 참조
  const retryCountRef = useRef<number>(0);

  /**
   * Blob을 Base64로 변환
   */
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // data:image/...;base64, 부분 제거
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  /**
   * Google Vision API 호출
   */
  const callVisionAPI = useCallback(
    async (base64Image: string): Promise<VisionAPIResponse> => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;

      if (!apiKey) {
        throw new Error('Google Vision API 키가 설정되지 않았습니다.');
      }

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 50,
                  },
                ],
                imageContext: {
                  languageHints: ['ko', 'en'],
                },
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message || `API 오류: ${response.status}`
        );
      }

      return response.json();
    },
    []
  );

  /**
   * Vision API 응답을 OCRResult 배열로 변환
   */
  const parseVisionResponse = useCallback(
    (
      response: VisionAPIResponse
    ): { results: OCRResult[]; fullText: string } => {
      const firstResponse = response.responses?.[0];

      if (!firstResponse) {
        return { results: [], fullText: '' };
      }

      // 에러 응답 처리
      if (firstResponse.error) {
        throw new Error(firstResponse.error.message);
      }

      // 전체 텍스트 추출
      const fullTextResult = firstResponse.fullTextAnnotation?.text || '';

      // 개별 텍스트 추출 (첫 번째 항목은 전체 텍스트이므로 제외)
      const textAnnotations = firstResponse.textAnnotations?.slice(1) || [];

      const ocrResults: OCRResult[] = textAnnotations.map((annotation) => {
        const vertices = annotation.boundingPoly?.vertices || [];

        // 바운딩 박스 계산
        const xValues = vertices.map((v) => v.x || 0);
        const yValues = vertices.map((v) => v.y || 0);

        const minX = Math.min(...xValues);
        const minY = Math.min(...yValues);
        const maxX = Math.max(...xValues);
        const maxY = Math.max(...yValues);

        return {
          text: annotation.description,
          confidence: annotation.confidence || 0.95, // 기본 신뢰도
          boundingBox: {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          },
        };
      });

      return { results: ocrResults, fullText: fullTextResult };
    },
    []
  );

  /**
   * 지연 함수
   */
  const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * OCR 처리 내부 함수 (재시도 로직 포함)
   */
  const processOCR = useCallback(
    async (image: Blob, currentRetry: number = 0): Promise<void> => {
      try {
        // Base64 인코딩
        const base64Image = await blobToBase64(image);

        // Vision API 호출
        const response = await callVisionAPI(base64Image);

        // 응답 파싱
        const { results: parsedResults, fullText: parsedFullText } =
          parseVisionResponse(response);

        // 상태 업데이트
        setResults(parsedResults);
        setFullText(parsedFullText);
        setError(null);
        retryCountRef.current = 0;
      } catch (err) {
        // 재시도 로직
        if (currentRetry < MAX_RETRIES - 1) {
          await delay(RETRY_DELAY);
          return processOCR(image, currentRetry + 1);
        }

        // 최대 재시도 횟수 초과
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'OCR 처리 중 오류가 발생했습니다.';
        setError(errorMessage);
        setResults([]);
        setFullText('');
      }
    },
    [blobToBase64, callVisionAPI, parseVisionResponse]
  );

  /**
   * 텍스트 추출 시작
   */
  const extractText = useCallback(
    async (image: Blob): Promise<void> => {
      setIsLoading(true);
      setError(null);
      lastImageRef.current = image;
      retryCountRef.current = 0;

      try {
        await processOCR(image);
      } finally {
        setIsLoading(false);
      }
    },
    [processOCR]
  );

  /**
   * 재시도
   */
  const retry = useCallback(async (): Promise<void> => {
    if (!lastImageRef.current) {
      setError('재시도할 이미지가 없습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await processOCR(lastImageRef.current);
    } finally {
      setIsLoading(false);
    }
  }, [processOCR]);

  /**
   * 상태 초기화
   */
  const reset = useCallback((): void => {
    setResults([]);
    setFullText('');
    setIsLoading(false);
    setError(null);
    lastImageRef.current = null;
    retryCountRef.current = 0;
  }, []);

  return {
    results,
    fullText,
    isLoading,
    error,
    extractText,
    retry,
    reset,
  };
}
