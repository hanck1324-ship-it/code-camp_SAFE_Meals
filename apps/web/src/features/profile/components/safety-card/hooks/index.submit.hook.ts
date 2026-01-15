/**
 * 안전카드 PIN 검증 Hook
 *
 * @description Supabase safety_cards 테이블과 연동하여 PIN 검증을 수행하는 훅
 *
 * @example
 * ```tsx
 * const { verifyPin, isVerifying, error, isUnlocked, safetyCardData } = useSafetyCardVerify();
 *
 * const handleSubmit = async () => {
 *   const success = await verifyPin(inputPin);
 *   if (success) {
 *     // 잠금 해제 성공 - safetyCardData로 안전카드 내용 표시
 *   }
 * };
 * ```
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

import { getSupabaseClient } from '@/lib/supabase';

import type { SafetyCardData } from './index.data.hook';

/**
 * PIN 유효성 검증 결과 타입
 */
interface PinValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * PIN 검증 훅 반환 타입
 */
interface UseSafetyCardVerifyReturn {
  /** PIN 검증 함수 */
  verifyPin: (pin: string) => Promise<boolean>;
  /** 검증 진행 중 여부 */
  isVerifying: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 잠금 해제 여부 */
  isUnlocked: boolean;
  /** 안전카드 데이터 (잠금 해제 후 사용 가능) */
  safetyCardData: SafetyCardData | null;
  /** 데이터 로딩 중 여부 */
  isLoading: boolean;
  /** 상태 초기화 */
  reset: () => void;
}

/**
 * PIN 유효성 검증 함수
 *
 * @param pin - 사용자 입력 PIN
 * @returns 유효성 검증 결과
 */
function validatePin(pin: string): PinValidationResult {
  // 빈 값 검증
  if (!pin) {
    return { isValid: false, error: 'PIN을 입력해주세요.' };
  }

  // 길이 검증: 정확히 4자리
  if (pin.length !== 4) {
    return { isValid: false, error: 'PIN은 정확히 4자리여야 합니다.' };
  }

  // 형식 검증: 숫자만 허용
  if (!/^\d{4}$/.test(pin)) {
    return { isValid: false, error: 'PIN은 숫자만 입력 가능합니다.' };
  }

  return { isValid: true };
}

/**
 * 안전카드 PIN 검증 Hook
 *
 * Supabase safety_cards 테이블과 연동하여 PIN 검증 수행
 */
export function useSafetyCardVerify(): UseSafetyCardVerifyReturn {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [safetyCardData, setSafetyCardData] = useState<SafetyCardData | null>(
    null
  );

  // 컴포넌트 마운트 시 안전카드 데이터 로드
  useEffect(() => {
    const loadSafetyCardData = async () => {
      try {
        setIsLoading(true);
        const supabase = getSupabaseClient();

        // 현재 로그인한 사용자 확인
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setIsLoading(false);
          return;
        }

        // safety_cards 테이블에서 데이터 조회
        const { data, error: fetchError } = await supabase
          .from('safety_cards')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          // 데이터가 없는 경우는 에러로 처리하지 않음
          if (fetchError.code !== 'PGRST116') {
            console.error('안전카드 데이터 조회 실패:', fetchError);
          }
          setIsLoading(false);
          return;
        }

        setSafetyCardData(data as SafetyCardData);
      } catch (err) {
        console.error('안전카드 데이터 로드 중 에러:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSafetyCardData();
  }, []);

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setError(null);
    setIsUnlocked(false);
  }, []);

  /**
   * PIN 검증 함수
   *
   * @param pin - 사용자 입력 PIN
   * @returns 검증 성공 여부
   */
  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      // 에러 초기화
      setError(null);
      setIsVerifying(true);

      try {
        // 1. 클라이언트 측 유효성 검증
        const validationResult = validatePin(pin);
        if (!validationResult.isValid) {
          setError(validationResult.error || 'PIN 검증에 실패했습니다.');
          return false;
        }

        // 2. 이미 로드된 데이터가 있으면 해당 데이터로 검증
        if (safetyCardData) {
          if (safetyCardData.pin_code !== pin) {
            setError('PIN 번호가 일치하지 않습니다.');
            return false;
          }
        } else {
          // 데이터가 없으면 Supabase에서 직접 조회하여 검증
          const supabase = getSupabaseClient();

          // 현재 로그인한 사용자 확인
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError || !user) {
            setError('로그인이 필요합니다.');
            return false;
          }

          // safety_cards 테이블에서 데이터 조회
          const { data, error: fetchError } = await supabase
            .from('safety_cards')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (fetchError || !data) {
            setError('안전카드가 설정되어 있지 않습니다.');
            return false;
          }

          // PIN 비교
          const cardData = data as SafetyCardData;
          setSafetyCardData(cardData);

          if (cardData.pin_code !== pin) {
            setError('PIN 번호가 일치하지 않습니다.');
            return false;
          }
        }

        // 3. 검증 성공 - 잠금 해제
        setIsUnlocked(true);
        return true;
      } catch (err) {
        console.error('PIN 검증 중 에러:', err);
        setError('PIN 검증에 실패했습니다. 다시 시도해주세요.');
        return false;
      } finally {
        setIsVerifying(false);
      }
    },
    [safetyCardData]
  );

  return {
    verifyPin,
    isVerifying,
    error,
    isUnlocked,
    safetyCardData,
    isLoading,
    reset,
  };
}

export default useSafetyCardVerify;
