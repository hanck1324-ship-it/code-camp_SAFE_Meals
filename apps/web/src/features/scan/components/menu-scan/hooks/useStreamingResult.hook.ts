'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 스트리밍 요청 페이로드 타입
 *
 * startStreaming이 모든 필요 데이터를 인자로 받음 (stale closure 방지)
 */
export interface StreamingPayload {
  /** Base64 인코딩된 이미지 데이터 */
  image: string;
  /** 사용자 알레르기 코드 목록 */
  userAllergies: string[];
  /** OCR에서 추출된 메뉴 토큰 목록 */
  menuTokens: string[];
}

/**
 * 스트리밍 응답 데이터 타입 (NDJSON 파싱 결과)
 */
interface StreamChunk {
  text?: string;
  accumulated?: string;
  done?: boolean;
  status?: 'SAFE' | 'DANGER';
  ttft?: number;
  totalMs?: number;
  error?: string;
  user_context?: {
    allergies: string[];
    diet: string;
  };
}

/**
 * 스트리밍 결과 훅 반환 타입
 */
export interface UseStreamingResultReturn {
  /** 안전 상태 (2분류: SAFE | DANGER) */
  status: 'SAFE' | 'DANGER' | null;
  /** 스트리밍 진행 중 여부 */
  isStreaming: boolean;
  /** 첫 토큰까지의 시간 (ms) */
  firstTokenTime: number | null;
  /** 에러 메시지 */
  error: string | null;
  /** 서버에서 받은 TTFT */
  serverTtft: number | null;
  /** 사용자 컨텍스트 (응답에서 받은 값) */
  userContext: { allergies: string[]; diet: string } | null;
  /** 스트리밍 시작 함수 */
  startStreaming: (payload: StreamingPayload) => Promise<void>;
  /** 요청 취소 함수 */
  abort: () => void;
}

/**
 * 스트리밍 결과 훅
 *
 * AI 출력 스트리밍을 처리하여 첫 토큰 UX를 최적화합니다.
 *
 * 핵심 해결 포인트:
 * - 청크 경계 문제 해결 (buffer 누적 → \n 단위 프레임 분리)
 * - 레이스 조건 방지 (useRef + 로컬 변수)
 * - 연속 요청 레이스 방지 (AbortController + requestIdRef)
 * - stale closure 방지 (payload 파라미터로 모든 데이터 전달)
 *
 * @example
 * ```tsx
 * const { status, firstTokenTime, isStreaming, startStreaming, abort } = useStreamingResult();
 *
 * const handleScan = async () => {
 *   await startStreaming({
 *     image: imageData,
 *     userAllergies: ['shellfish', 'eggs'],
 *     menuTokens: ['shrimp', 'pasta']
 *   });
 * };
 *
 * // 컴포넌트 언마운트 시 요청 취소
 * useEffect(() => {
 *   return () => abort();
 * }, [abort]);
 * ```
 *
 * @see 36prompts.403.ai-output-streaming-optimization.txt
 */
export function useStreamingResult(): UseStreamingResultReturn {
  const [status, setStatus] = useState<'SAFE' | 'DANGER' | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [firstTokenTime, setFirstTokenTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverTtft, setServerTtft] = useState<number | null>(null);
  const [userContext, setUserContext] = useState<{
    allergies: string[];
    diet: string;
  } | null>(null);

  // ✅ 훅 최상위에서 선언 (startStreaming 내부 ❌)
  const firstTokenCapturedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0); // (H-1) 연속 요청 레이스 방지

  /**
   * 이전 요청 취소
   */
  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  /**
   * 스트리밍 시작
   *
   * @param payload - 스트리밍 요청에 필요한 모든 데이터
   */
  const startStreaming = useCallback(
    async (payload: StreamingPayload) => {
      const { image, userAllergies, menuTokens } = payload;

      // (H-1) 이전 요청 취소 + 새 requestId
      abort();
      const currentRequestId = ++requestIdRef.current;
      abortControllerRef.current = new AbortController();

      // 상태 초기화
      setIsStreaming(true);
      setError(null);
      setStatus(null);
      setServerTtft(null);
      setUserContext(null);
      firstTokenCapturedRef.current = false;

      const startTime = Date.now();
      let localFirstTokenTime: number | null = null;
      let buffer = '';

      try {
        const response = await fetch('/api/scan/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/x-ndjson', // (H-2) 스트리밍 요청 명시
          },
          body: JSON.stringify({
            image,
            user_allergies: userAllergies,
            menu_tokens: menuTokens,
          }),
          signal: abortControllerRef.current.signal, // (H-1) 취소 지원
        });

        if (!response.ok) {
          throw new Error(
            `Stream failed: ${response.status} ${response.statusText}`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // (H-1) 이미 취소된 요청이면 무시
          if (currentRequestId !== requestIdRef.current) return;

          buffer += decoder.decode(value, { stream: true });

          // 청크 경계 문제 해결: \n 단위로 프레임 분리
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 마지막 불완전 라인은 버퍼에 유지

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const data: StreamChunk = JSON.parse(line);

              // 첫 토큰 시간 캡처
              if (!firstTokenCapturedRef.current && data.text) {
                localFirstTokenTime = Date.now() - startTime;
                firstTokenCapturedRef.current = true;
              }

              // 최종 결과 처리
              if (data.done && data.status) {
                // (H-1) 최신 요청만 상태 업데이트
                if (currentRequestId === requestIdRef.current) {
                  setStatus(data.status);

                  if (data.ttft !== undefined) {
                    setServerTtft(data.ttft);
                  }

                  if (data.user_context) {
                    setUserContext(data.user_context);
                  }

                  if (data.error) {
                    setError(data.error);
                  }
                }
              }
            } catch {
              // JSON 파싱 실패 - 무시 (불완전한 청크일 수 있음)
            }
          }
        }

        // (H-1) 최신 요청만 상태 업데이트
        if (currentRequestId === requestIdRef.current) {
          setFirstTokenTime(localFirstTokenTime);
        }
      } catch (err) {
        // AbortError는 정상 취소이므로 에러로 처리하지 않음
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        if (currentRequestId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          // ⚠️ 에러 시 DANGER로 처리 (보수적 안전)
          setStatus('DANGER');
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsStreaming(false);
        }
      }
    },
    [abort]
  ); // abort만 deps에 포함 (payload는 인자로 받음)

  return {
    status,
    isStreaming,
    firstTokenTime,
    error,
    serverTtft,
    userContext,
    startStreaming,
    abort,
  };
}

/**
 * 컴포넌트에서 자동 정리를 위한 커스텀 훅
 *
 * @example
 * ```tsx
 * const streaming = useStreamingResultWithCleanup();
 * ```
 */
export function useStreamingResultWithCleanup(): UseStreamingResultReturn {
  const result = useStreamingResult();

  // 컴포넌트 언마운트 시 자동 정리
  useEffect(() => {
    return () => {
      result.abort();
    };
  }, [result.abort]);

  return result;
}

export default useStreamingResult;
