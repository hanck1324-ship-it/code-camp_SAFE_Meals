/**
 * 알레르기 및 식단 정보 저장 Hook
 *
 * @description Supabase user_allergies, user_diets 테이블과 연동하여
 *              알레르기 및 식단 정보를 저장하는 훅
 *
 * @example
 * ```tsx
 * const { submitAllergiesAndDiets, isSubmitting, error, isSuccess } = useSafetyCardAllergiesDietsSubmit();
 *
 * const handleSubmit = async () => {
 *   await submitAllergiesAndDiets({
 *     allergies: [{ allergy_code: 'eggs', severity: 'moderate' }],
 *     diets: [{ diet_code: 'vegetarian' }]
 *   });
 * };
 * ```
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

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
 * 알레르기 입력 데이터 타입
 */
export interface AllergyInput {
  allergy_code: string;
  severity?: AllergySeverity;
  notes?: string;
}

/**
 * 식단 입력 데이터 타입
 */
export interface DietInput {
  diet_code: string;
  notes?: string;
}

/**
 * 알레르기 및 식단 입력 데이터 타입
 */
export interface AllergiesAndDietsInput {
  allergies: AllergyInput[];
  diets: DietInput[];
}

/**
 * 알레르기 및 식단 저장 훅 반환 타입
 */
interface UseSafetyCardAllergiesDietsSubmitReturn {
  /** 알레르기 및 식단 정보 저장 함수 */
  submitAllergiesAndDiets: (data: AllergiesAndDietsInput) => Promise<void>;
  /** 저장 진행 중 여부 */
  isSubmitting: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 저장 성공 여부 */
  isSuccess: boolean;
}

/**
 * 유효한 심각도 값 목록
 */
const VALID_SEVERITIES: AllergySeverity[] = [
  'mild',
  'moderate',
  'severe',
  'life_threatening',
];

/**
 * 노트 최대 길이
 */
const MAX_NOTES_LENGTH = 500;

/**
 * allergy_code 유효성 검증 함수
 *
 * @param code - 검증할 알레르기 코드
 * @param validCodes - 유효한 코드 목록
 * @returns 유효 여부
 */
function isValidAllergyCode(code: string, validCodes: string[]): boolean {
  return validCodes.includes(code);
}

/**
 * diet_code 유효성 검증 함수
 *
 * @param code - 검증할 식단 코드
 * @param validCodes - 유효한 코드 목록
 * @returns 유효 여부
 */
function isValidDietCode(code: string, validCodes: string[]): boolean {
  return validCodes.includes(code);
}

/**
 * severity 유효성 검증 함수
 *
 * @param severity - 검증할 심각도
 * @returns 유효 여부
 */
function isValidSeverity(severity: string): severity is AllergySeverity {
  return VALID_SEVERITIES.includes(severity as AllergySeverity);
}

/**
 * 알레르기 및 식단 정보 저장 Hook
 *
 * Supabase user_allergies, user_diets 테이블과 연동하여 저장 수행
 */
export function useSafetyCardAllergiesDietsSubmit(): UseSafetyCardAllergiesDietsSubmitReturn {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  /**
   * 알레르기 및 식단 정보 저장 함수
   */
  const submitAllergiesAndDiets = useCallback(
    async (data: AllergiesAndDietsInput): Promise<void> => {
      setIsSubmitting(true);
      setError(null);
      setIsSuccess(false);

      try {
        const supabase = getSupabaseClient();
        console.log('[DEBUG] submitAllergiesAndDiets 시작', data);

        // 1. 현재 로그인한 사용자 확인
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        console.log('[DEBUG] 사용자 확인:', { user: user?.id, authError });

        if (authError || !user) {
          throw new Error('로그인이 필요합니다.');
        }

        const userId = user.id;

        // 2. 유효한 allergy_types 코드 조회
        const { data: allergyTypes, error: allergyTypesError } = await supabase
          .from('allergy_types')
          .select('code');

        console.log('[DEBUG] allergy_types 조회:', {
          allergyTypes,
          allergyTypesError,
        });

        if (allergyTypesError) {
          throw new Error('저장에 실패했습니다. 다시 시도해주세요.');
        }

        const validAllergyCodes = allergyTypes?.map((t) => t.code) || [];

        // 3. 유효한 diet_types 코드 조회
        const { data: dietTypes, error: dietTypesError } = await supabase
          .from('diet_types')
          .select('code');

        if (dietTypesError) {
          throw new Error('저장에 실패했습니다. 다시 시도해주세요.');
        }

        const validDietCodes = dietTypes?.map((t) => t.code) || [];

        // 4. 입력 데이터 유효성 검증
        // 4-1. 알레르기 코드 검증
        for (const allergy of data.allergies) {
          if (!isValidAllergyCode(allergy.allergy_code, validAllergyCodes)) {
            throw new Error('유효하지 않은 알레르기/식단 정보입니다.');
          }

          // severity 검증
          if (allergy.severity && !isValidSeverity(allergy.severity)) {
            throw new Error('유효하지 않은 알레르기/식단 정보입니다.');
          }

          // notes 길이 검증
          if (allergy.notes && allergy.notes.length > MAX_NOTES_LENGTH) {
            throw new Error('노트는 500자 이하로 입력해주세요.');
          }
        }

        // 4-2. 식단 코드 검증
        for (const diet of data.diets) {
          if (!isValidDietCode(diet.diet_code, validDietCodes)) {
            throw new Error('유효하지 않은 알레르기/식단 정보입니다.');
          }

          // notes 길이 검증
          if (diet.notes && diet.notes.length > MAX_NOTES_LENGTH) {
            throw new Error('노트는 500자 이하로 입력해주세요.');
          }
        }

        // 5. 트랜잭션 처리: 기존 데이터 삭제 후 새 데이터 삽입
        // 5-1. 기존 알레르기 데이터 삭제
        console.log('[DEBUG] 알레르기 삭제 시도, userId:', userId);
        const { error: deleteAllergiesError } = await supabase
          .from('user_allergies')
          .delete()
          .eq('user_id', userId);

        console.log('[DEBUG] 알레르기 삭제 결과:', { deleteAllergiesError });

        if (deleteAllergiesError) {
          console.error('[DEBUG] 알레르기 삭제 에러:', deleteAllergiesError);
          throw new Error('저장에 실패했습니다. 다시 시도해주세요.');
        }

        // 5-2. 기존 식단 데이터 삭제
        console.log('[DEBUG] 식단 삭제 시도, userId:', userId);
        const { error: deleteDietsError } = await supabase
          .from('user_diets')
          .delete()
          .eq('user_id', userId);

        console.log('[DEBUG] 식단 삭제 결과:', { deleteDietsError });

        if (deleteDietsError) {
          console.error('[DEBUG] 식단 삭제 에러:', deleteDietsError);
          throw new Error('저장에 실패했습니다. 다시 시도해주세요.');
        }

        // 5-3. 새 알레르기 데이터 삽입 (빈 배열이 아닌 경우만)
        if (data.allergies.length > 0) {
          const allergyInsertData = data.allergies.map((allergy) => ({
            user_id: userId,
            allergy_code: allergy.allergy_code,
            severity: allergy.severity || 'moderate',
            notes: allergy.notes || null,
          }));

          console.log('[DEBUG] 알레르기 삽입 시도:', allergyInsertData);
          const { error: insertAllergiesError } = await supabase
            .from('user_allergies')
            .insert(allergyInsertData);

          console.log('[DEBUG] 알레르기 삽입 결과:', { insertAllergiesError });

          if (insertAllergiesError) {
            console.error('[DEBUG] 알레르기 삽입 에러:', insertAllergiesError);
            // 중복 데이터 에러 처리
            if (insertAllergiesError.code === '23505') {
              throw new Error('이미 등록된 정보입니다.');
            }
            throw new Error('저장에 실패했습니다. 다시 시도해주세요.');
          }
        }

        // 5-4. 새 식단 데이터 삽입 (빈 배열이 아닌 경우만)
        if (data.diets.length > 0) {
          const dietInsertData = data.diets.map((diet) => ({
            user_id: userId,
            diet_code: diet.diet_code,
            notes: diet.notes || null,
          }));

          console.log('[DEBUG] 식단 삽입 시도:', dietInsertData);
          const { error: insertDietsError } = await supabase
            .from('user_diets')
            .insert(dietInsertData);

          console.log('[DEBUG] 식단 삽입 결과:', { insertDietsError });

          if (insertDietsError) {
            console.error('[DEBUG] 식단 삽입 에러:', insertDietsError);
            // 중복 데이터 에러 처리
            if (insertDietsError.code === '23505') {
              throw new Error('이미 등록된 정보입니다.');
            }
            throw new Error('저장에 실패했습니다. 다시 시도해주세요.');
          }
        }

        // 6. 저장 성공
        setIsSuccess(true);

        // 7. 성공 메시지 표시 후 페이지 이동 (약간의 딜레이 후)
        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      } catch (err) {
        // 에러 처리
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('저장에 실패했습니다. 다시 시도해주세요.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  return {
    submitAllergiesAndDiets,
    isSubmitting,
    error,
    isSuccess,
  };
}

/**
 * 사용자의 알레르기 및 식단 정보 조회 Hook
 *
 * @description 현재 사용자의 알레르기 및 식단 정보를 조회하는 훅
 */
export function useSafetyCardAllergiesDietsLoad() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allergies, setAllergies] = useState<AllergyInput[]>([]);
  const [diets, setDiets] = useState<DietInput[]>([]);

  /**
   * 사용자의 알레르기 및 식단 정보 조회 함수
   */
  const loadAllergiesAndDiets = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();

      // 현재 로그인한 사용자 확인
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('로그인이 필요합니다.');
      }

      const userId = user.id;

      // 알레르기 정보 조회
      const { data: userAllergies, error: allergiesError } = await supabase
        .from('user_allergies')
        .select('allergy_code, severity, notes')
        .eq('user_id', userId);

      if (allergiesError) {
        throw new Error('데이터를 불러올 수 없습니다. 다시 시도해주세요.');
      }

      // 식단 정보 조회
      const { data: userDiets, error: dietsError } = await supabase
        .from('user_diets')
        .select('diet_code, notes')
        .eq('user_id', userId);

      if (dietsError) {
        throw new Error('데이터를 불러올 수 없습니다. 다시 시도해주세요.');
      }

      setAllergies(
        userAllergies?.map((a) => ({
          allergy_code: a.allergy_code,
          severity: a.severity as AllergySeverity,
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
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('데이터를 불러올 수 없습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    loadAllergiesAndDiets,
    isLoading,
    error,
    allergies,
    diets,
  };
}
