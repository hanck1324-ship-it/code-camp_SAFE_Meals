/**
 * 안전카드 데이터 로드 Hook
 *
 * @description React Query + Supabase를 사용하여 안전카드 데이터를 로드하는 훅
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError, getMessage } = useSafetyCardData();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (isError) return <ErrorMessage />;
 *
 * const message = getMessage('ko'); // 언어에 맞는 메시지 가져오기
 * ```
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { getSupabaseClient } from '@/lib/supabase';

import type { Language } from '@/commons/stores/useLanguageStore';

/**
 * 안전카드 데이터 타입
 */
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

/**
 * 언어별 메시지 필드 매핑
 */
const LANGUAGE_FIELD_MAP: Record<Language, keyof SafetyCardData> = {
  ko: 'message_ko',
  en: 'message_en',
  ja: 'message_ja',
  zh: 'message_zh',
  es: 'message_ko', // 스페인어는 한국어를 기본값으로 사용
};

/**
 * 안전카드 데이터 훅 옵션 타입
 */
interface UseSafetyCardDataOptions {
  /** 쿼리 활성화 여부 (기본값: true) */
  enabled?: boolean;
}

/**
 * 안전카드 데이터 훅 반환 타입
 */
interface UseSafetyCardDataReturn {
  /** 안전카드 데이터 */
  data: SafetyCardData | null;
  /** 데이터 로딩 중 여부 */
  isLoading: boolean;
  /** 데이터 로드 에러 여부 */
  isError: boolean;
  /** 에러 메시지 */
  errorMessage: string | null;
  /** 데이터 없음 여부 */
  isEmpty: boolean;
  /** 언어에 맞는 메시지 가져오기 */
  getMessage: (language?: Language) => string;
  /** 데이터 새로고침 */
  refetch: () => void;
}

/**
 * Supabase에서 안전카드 데이터를 조회하는 함수
 */
async function fetchSafetyCardData(): Promise<SafetyCardData | null> {
  const supabase = getSupabaseClient();

  // 현재 로그인한 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  // safety_cards 테이블에서 데이터 조회
  const { data, error: fetchError } = await supabase
    .from('safety_cards')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    // 데이터가 없는 경우 (PGRST116: Row not found)
    if (fetchError.code === 'PGRST116') {
      return null;
    }
    throw new Error('데이터를 불러올 수 없습니다. 다시 시도해주세요.');
  }

  return data as SafetyCardData;
}

/**
 * 안전카드 데이터 로드 Hook
 *
 * React Query를 사용하여 Supabase에서 안전카드 데이터를 조회
 *
 * @param options - 옵션 객체
 * @param options.enabled - 쿼리 활성화 여부 (기본값: true)
 */
export function useSafetyCardData(
  options: UseSafetyCardDataOptions = {}
): UseSafetyCardDataReturn {
  const { enabled = true } = options;
  const { language } = useLanguageStore();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['safety-card-data'],
    queryFn: fetchSafetyCardData,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    retry: 1, // 1번 재시도
    enabled, // 쿼리 활성화 조건
  });

  /**
   * 언어에 맞는 메시지 가져오기
   *
   * @param lang - 언어 코드 (기본값: 스토어의 현재 언어)
   * @returns 해당 언어의 메시지 또는 fallback 메시지
   */
  const getMessage = (lang?: Language): string => {
    const targetLang = lang || language;

    if (!data) {
      return '';
    }

    // 해당 언어의 메시지 필드 가져오기
    const fieldName = LANGUAGE_FIELD_MAP[targetLang] || 'message_ko';
    const message = data[fieldName] as string | null;

    // Fallback 처리: 선택된 언어의 메시지가 없으면 message_ko 사용
    if (message) {
      return message;
    }

    // message_ko를 기본값으로 사용
    if (data.message_ko) {
      return data.message_ko;
    }

    // message_ko도 없으면 빈 문자열
    return '';
  };

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

export default useSafetyCardData;
