/**
 * 안전카드 통합 Hook
 *
 * 기존 3개 hook을 통합하여 중복 제거 및 React Query로 일관된 상태 관리
 * - useSafetyCardAllergiesDietsLoad → useAllergiesAndDiets
 * - useSafetyCardData → useSafetyCardMessage
 * - useSafetyCardVerify → useSafetyCardPin
 */

'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { getSupabaseClient } from '@/lib/supabase';

import type { Language } from '@/commons/stores/useLanguageStore';

// ============================================
// 타입 정의
// ============================================

/** 알레르기 심각도 타입 */
export type AllergySeverity =
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'life_threatening';

/** 알레르기 데이터 타입 */
export interface AllergyData {
  allergy_code: string;
  severity: AllergySeverity;
  notes?: string;
}

/** 식단 데이터 타입 */
export interface DietData {
  diet_code: string;
  notes?: string;
}

/** 안전카드 데이터 타입 */
export interface SafetyCardData {
  id: string;
  user_id: string;
  pin_code: string;
  message_ko: string | null;
  message_en: string | null;
  message_ja: string | null;
  message_zh: string | null;
  message_local: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/** 언어별 메시지 필드 매핑 */
const LANGUAGE_FIELD_MAP: Record<Language, keyof SafetyCardData> = {
  ko: 'message_ko',
  en: 'message_en',
  ja: 'message_ja',
  zh: 'message_zh',
  es: 'message_ko', // 스페인어는 한국어를 기본값으로 사용
};

// ============================================
// 데이터 Fetch 함수
// ============================================

/** 알레르기 및 식단 데이터 조회 */
async function fetchAllergiesAndDiets(): Promise<{
  allergies: AllergyData[];
  diets: DietData[];
}> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const [
    { data: userAllergies, error: allergiesError },
    { data: userDiets, error: dietsError },
  ] = await Promise.all([
    supabase
      .from('user_allergies')
      .select('allergy_code, severity, notes')
      .eq('user_id', user.id),
    supabase
      .from('user_diets')
      .select('diet_code, notes')
      .eq('user_id', user.id),
  ]);

  if (allergiesError || dietsError) {
    throw new Error('알레르기 및 식단 정보를 불러올 수 없습니다.');
  }

  return {
    allergies:
      userAllergies?.map((a) => ({
        allergy_code: a.allergy_code,
        severity: (a.severity as AllergySeverity) || 'moderate',
        notes: a.notes || undefined,
      })) || [],
    diets:
      userDiets?.map((d) => ({
        diet_code: d.diet_code,
        notes: d.notes || undefined,
      })) || [],
  };
}

/** 안전카드 데이터 조회 */
async function fetchSafetyCardData(): Promise<SafetyCardData | null> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data, error: fetchError } = await supabase
    .from('safety_cards')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return null; // 데이터 없음
    }
    throw new Error('데이터를 불러올 수 없습니다.');
  }

  return data as SafetyCardData;
}

// ============================================
// Hook 1: 알레르기 및 식단 데이터 로드
// ============================================

interface UseAllergiesAndDietsReturn {
  allergies: AllergyData[];
  diets: DietData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 알레르기 및 식단 데이터 로드 Hook (React Query 사용)
 */
export function useAllergiesAndDiets(): UseAllergiesAndDietsReturn {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['allergies-and-diets'],
    queryFn: fetchAllergiesAndDiets,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    retry: 1,
  });

  return {
    allergies: data?.allergies || [],
    diets: data?.diets || [],
    isLoading,
    error: isError && error instanceof Error ? error.message : null,
    refetch: () => refetch(),
  };
}

// 기존 hook 이름과 호환성 유지
export const useSafetyCardAllergiesDietsLoad = useAllergiesAndDiets;

// ============================================
// Hook 2: 안전카드 메시지 데이터 로드
// ============================================

interface UseSafetyCardMessageOptions {
  enabled?: boolean;
}

interface UseSafetyCardMessageReturn {
  data: SafetyCardData | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  isEmpty: boolean;
  getMessage: (language?: Language) => string;
  refetch: () => void;
}

/**
 * 안전카드 메시지 데이터 로드 Hook (React Query 사용)
 */
export function useSafetyCardMessage(
  options: UseSafetyCardMessageOptions = {}
): UseSafetyCardMessageReturn {
  const { enabled = true } = options;
  const { language } = useLanguageStore();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['safety-card-data'],
    queryFn: fetchSafetyCardData,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    enabled,
  });

  const getMessage = useCallback(
    (lang?: Language): string => {
      const targetLang = lang || language;
      if (!data) return '';

      const fieldName = LANGUAGE_FIELD_MAP[targetLang] || 'message_ko';
      const message = data[fieldName] as string | null;

      return message || data.message_ko || '';
    },
    [data, language]
  );

  return {
    data: data || null,
    isLoading,
    isError,
    errorMessage: isError && error instanceof Error ? error.message : null,
    isEmpty: !isLoading && !isError && !data,
    getMessage,
    refetch: () => refetch(),
  };
}

// 기존 hook 이름과 호환성 유지
export const useSafetyCardData = useSafetyCardMessage;

// ============================================
// Hook 3: PIN 검증
// ============================================

interface UseSafetyCardPinReturn {
  verifyPin: (pin: string) => Promise<boolean>;
  isVerifying: boolean;
  error: string | null;
  isUnlocked: boolean;
  safetyCardData: SafetyCardData | null;
  isLoading: boolean;
  reset: () => void;
}

/**
 * PIN 유효성 검증 함수
 */
function validatePin(pin: string): { isValid: boolean; error?: string } {
  if (!pin) {
    return { isValid: false, error: 'PIN을 입력해주세요.' };
  }
  if (pin.length !== 4) {
    return { isValid: false, error: 'PIN은 정확히 4자리여야 합니다.' };
  }
  if (!/^\d{4}$/.test(pin)) {
    return { isValid: false, error: 'PIN은 숫자만 입력 가능합니다.' };
  }
  return { isValid: true };
}

/**
 * 안전카드 PIN 검증 Hook (React Query로 데이터 공유)
 */
export function useSafetyCardPin(): UseSafetyCardPinReturn {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // React Query로 안전카드 데이터 로드 (캐시 공유)
  const { data: safetyCardData, isLoading } = useQuery({
    queryKey: ['safety-card-data'],
    queryFn: fetchSafetyCardData,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const reset = useCallback(() => {
    setError(null);
    setIsUnlocked(false);
  }, []);

  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      setError(null);
      setIsVerifying(true);

      try {
        // 클라이언트 측 유효성 검증
        const validationResult = validatePin(pin);
        if (!validationResult.isValid) {
          setError(validationResult.error || 'PIN 검증에 실패했습니다.');
          return false;
        }

        // 캐시된 데이터로 PIN 검증
        if (safetyCardData) {
          if (safetyCardData.pin_code !== pin) {
            setError('PIN 번호가 일치하지 않습니다.');
            return false;
          }
        } else {
          // 데이터가 없으면 직접 조회
          const data = await fetchSafetyCardData();
          if (!data) {
            setError('안전카드가 설정되어 있지 않습니다.');
            return false;
          }
          if (data.pin_code !== pin) {
            setError('PIN 번호가 일치하지 않습니다.');
            return false;
          }
        }

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
    safetyCardData: safetyCardData || null,
    isLoading,
    reset,
  };
}

// 기존 hook 이름과 호환성 유지
export const useSafetyCardVerify = useSafetyCardPin;
