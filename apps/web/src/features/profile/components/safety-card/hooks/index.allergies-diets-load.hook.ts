/**
 * 알레르기 및 식단 데이터 로드 Hook
 *
 * @description Supabase user_allergies, user_diets 테이블에서
 *              알레르기 및 식단 정보를 조회하는 훅
 *
 * @example
 * ```tsx
 * const { allergies, diets, isLoading, error } = useSafetyCardAllergiesDietsLoad();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage message={error} />;
 *
 * return (
 *   <div>
 *     {allergies.map(a => <AllergyCard key={a.allergy_code} {...a} />)}
 *     {diets.map(d => <DietCard key={d.diet_code} {...d} />)}
 *   </div>
 * );
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

import { getSupabaseClient } from '@/lib/supabase';

/**
 * 알레르기 심각도 타입
 */
export type AllergySeverity =
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'life_threatening';

/**
 * 알레르기 데이터 타입
 */
export interface AllergyData {
  allergy_code: string;
  severity: AllergySeverity;
  notes?: string;
}

/**
 * 식단 데이터 타입
 */
export interface DietData {
  diet_code: string;
  notes?: string;
}

/**
 * 알레르기 및 식단 데이터 로드 훅 반환 타입
 */
interface UseSafetyCardAllergiesDietsLoadReturn {
  /** 알레르기 목록 */
  allergies: AllergyData[];
  /** 식단 목록 */
  diets: DietData[];
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 데이터 재조회 함수 */
  refetch: () => Promise<void>;
}

/**
 * 알레르기 및 식단 데이터 로드 Hook
 *
 * Supabase user_allergies, user_diets 테이블에서 데이터 조회
 */
export function useSafetyCardAllergiesDietsLoad(): UseSafetyCardAllergiesDietsLoadReturn {
  const [allergies, setAllergies] = useState<AllergyData[]>([]);
  const [diets, setDiets] = useState<DietData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 알레르기 및 식단 데이터 조회 함수
   */
  const loadAllergiesAndDiets = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      console.log('[DEBUG] 알레르기/식단 데이터 로드 시작');

      // 현재 로그인한 사용자 확인
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log('[DEBUG] 사용자 확인:', { userId: user?.id, authError });

      if (authError || !user) {
        throw new Error('로그인이 필요합니다.');
      }

      const userId = user.id;

      // 알레르기 및 식단 데이터 병렬 조회 (Promise.all 사용)
      const [
        { data: userAllergies, error: allergiesError },
        { data: userDiets, error: dietsError },
      ] = await Promise.all([
        supabase
          .from('user_allergies')
          .select('allergy_code, severity, notes')
          .eq('user_id', userId),
        supabase
          .from('user_diets')
          .select('diet_code, notes')
          .eq('user_id', userId),
      ]);

      console.log('[DEBUG] 병렬 조회 결과:', {
        userAllergies,
        allergiesError,
        userDiets,
        dietsError,
      });

      if (allergiesError || dietsError) {
        throw new Error('알레르기 및 식단 정보를 불러올 수 없습니다.');
      }

      // 상태 업데이트
      setAllergies(
        userAllergies?.map((a) => ({
          allergy_code: a.allergy_code,
          severity: (a.severity as AllergySeverity) || 'moderate',
          notes: a.notes || undefined,
        })) || []
      );

      setDiets(
        userDiets?.map((d) => ({
          diet_code: d.diet_code,
          notes: d.notes || undefined,
        })) || []
      );
    } catch (err) {
      // 에러 처리
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('알레르기 및 식단 정보를 불러올 수 없습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadAllergiesAndDiets();
  }, [loadAllergiesAndDiets]);

  return {
    allergies,
    diets,
    isLoading,
    error,
    refetch: loadAllergiesAndDiets,
  };
}
