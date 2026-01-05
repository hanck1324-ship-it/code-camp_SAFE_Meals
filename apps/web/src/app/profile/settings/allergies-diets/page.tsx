'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { RequireAuth } from '@/components/auth/require-auth';
import {
  useSafetyCardAllergiesDietsSubmit,
  useSafetyCardAllergiesDietsLoad,
  AllergySeverity,
} from '@/features/profile/components/settings/hooks/index.submit-allergies-diets.hook';

/**
 * 알레르기 타입 정보
 */
const ALLERGY_TYPES = [
  { code: 'eggs', name: '난류', icon: '🥚' },
  { code: 'milk', name: '우유', icon: '🥛' },
  { code: 'buckwheat', name: '메밀', icon: '🌾' },
  { code: 'peanuts', name: '땅콩', icon: '🥜' },
  { code: 'soybeans', name: '대두', icon: '🫘' },
  { code: 'wheat', name: '밀', icon: '🌾' },
  { code: 'mackerel', name: '고등어', icon: '🐟' },
  { code: 'crab', name: '게', icon: '🦀' },
  { code: 'shrimp', name: '새우', icon: '🦐' },
  { code: 'pork', name: '돼지고기', icon: '🐷' },
  { code: 'peaches', name: '복숭아', icon: '🍑' },
  { code: 'tomatoes', name: '토마토', icon: '🍅' },
  { code: 'sulfites', name: '아황산류', icon: '⚗️' },
  { code: 'walnuts', name: '호두', icon: '🌰' },
  { code: 'chicken', name: '닭고기', icon: '🐔' },
  { code: 'beef', name: '소고기', icon: '🐄' },
  { code: 'squid', name: '오징어', icon: '🦑' },
  { code: 'shellfish', name: '조개류', icon: '🐚' },
  { code: 'pine_nuts', name: '잣', icon: '🌲' },
];

/**
 * 식단 타입 정보
 */
const DIET_TYPES = [
  { code: 'vegetarian', name: '채식주의', icon: '🥬' },
  { code: 'vegan', name: '비건', icon: '🌱' },
  { code: 'halal', name: '할랄', icon: '☪️' },
  { code: 'kosher', name: '코셔', icon: '✡️' },
  { code: 'gluten_free', name: '글루텐 프리', icon: '🚫🌾' },
  { code: 'lactose_free', name: '유당 불내증', icon: '🚫🥛' },
  { code: 'low_sodium', name: '저염식', icon: '🧂' },
  { code: 'diabetic', name: '당뇨식', icon: '💉' },
];

/**
 * 심각도 옵션
 */
const SEVERITY_OPTIONS: { value: AllergySeverity; label: string }[] = [
  { value: 'mild', label: '경미' },
  { value: 'moderate', label: '보통' },
  { value: 'severe', label: '심각' },
  { value: 'life_threatening', label: '생명위협' },
];

export default function AllergiesDietsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  // 선택된 알레르기 및 식단 상태
  const [selectedAllergies, setSelectedAllergies] = useState<
    Map<string, { severity: AllergySeverity; notes: string }>
  >(new Map());
  const [selectedDiets, setSelectedDiets] = useState<
    Map<string, { notes: string }>
  >(new Map());

  // 훅 사용
  const { submitAllergiesAndDiets, isSubmitting, error, isSuccess } =
    useSafetyCardAllergiesDietsSubmit();
  const {
    loadAllergiesAndDiets,
    isLoading,
    allergies: loadedAllergies,
    diets: loadedDiets,
  } = useSafetyCardAllergiesDietsLoad();

  // 페이지 로드 시 기존 데이터 로드
  useEffect(() => {
    loadAllergiesAndDiets();
  }, [loadAllergiesAndDiets]);

  // 로드된 데이터를 상태에 반영
  useEffect(() => {
    if (loadedAllergies.length > 0) {
      const allergiesMap = new Map<
        string,
        { severity: AllergySeverity; notes: string }
      >();
      loadedAllergies.forEach((a) => {
        allergiesMap.set(a.allergy_code, {
          severity: a.severity || 'moderate',
          notes: a.notes || '',
        });
      });
      setSelectedAllergies(allergiesMap);
    }

    if (loadedDiets.length > 0) {
      const dietsMap = new Map<string, { notes: string }>();
      loadedDiets.forEach((d) => {
        dietsMap.set(d.diet_code, { notes: d.notes || '' });
      });
      setSelectedDiets(dietsMap);
    }
  }, [loadedAllergies, loadedDiets]);

  // 유효하지 않은 데이터 테스트를 위한 이벤트 리스너
  useEffect(() => {
    const handleInvalidAllergy = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { allergy_code } = customEvent.detail;
      await submitAllergiesAndDiets({
        allergies: [{ allergy_code }],
        diets: [],
      });
    };

    const handleInvalidDiet = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { diet_code } = customEvent.detail;
      await submitAllergiesAndDiets({
        allergies: [],
        diets: [{ diet_code }],
      });
    };

    window.addEventListener('test-invalid-allergy', handleInvalidAllergy);
    window.addEventListener('test-invalid-diet', handleInvalidDiet);

    return () => {
      window.removeEventListener('test-invalid-allergy', handleInvalidAllergy);
      window.removeEventListener('test-invalid-diet', handleInvalidDiet);
    };
  }, [submitAllergiesAndDiets]);

  /**
   * 알레르기 토글 핸들러
   */
  const toggleAllergy = (code: string) => {
    setSelectedAllergies((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(code)) {
        newMap.delete(code);
      } else {
        newMap.set(code, { severity: 'moderate', notes: '' });
      }
      return newMap;
    });
  };

  /**
   * 알레르기 심각도 변경 핸들러
   */
  const updateAllergySeverity = (code: string, severity: AllergySeverity) => {
    setSelectedAllergies((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(code);
      if (existing) {
        newMap.set(code, { ...existing, severity });
      }
      return newMap;
    });
  };

  /**
   * 알레르기 노트 변경 핸들러
   */
  const updateAllergyNotes = (code: string, notes: string) => {
    setSelectedAllergies((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(code);
      if (existing) {
        newMap.set(code, { ...existing, notes });
      }
      return newMap;
    });
  };

  /**
   * 식단 토글 핸들러
   */
  const toggleDiet = (code: string) => {
    setSelectedDiets((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(code)) {
        newMap.delete(code);
      } else {
        newMap.set(code, { notes: '' });
      }
      return newMap;
    });
  };

  /**
   * 식단 노트 변경 핸들러
   */
  const updateDietNotes = (code: string, notes: string) => {
    setSelectedDiets((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(code);
      if (existing) {
        newMap.set(code, { ...existing, notes });
      }
      return newMap;
    });
  };

  /**
   * 저장 핸들러
   */
  const handleSubmit = async () => {
    const allergiesData = Array.from(selectedAllergies.entries()).map(
      ([code, data]) => ({
        allergy_code: code,
        severity: data.severity,
        notes: data.notes || undefined,
      })
    );

    const dietsData = Array.from(selectedDiets.entries()).map(
      ([code, data]) => ({
        diet_code: code,
        notes: data.notes || undefined,
      })
    );

    await submitAllergiesAndDiets({
      allergies: allergiesData,
      diets: dietsData,
    });
  };

  if (isLoading) {
    return (
      <RequireAuth>
        <div
          className="flex min-h-screen flex-col items-center justify-center bg-white"
          data-testid="allergies-diets-loading"
        >
          <Loader2 className="h-12 w-12 animate-spin text-[#2ECC71]" />
          <p className="mt-4 text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div
        className="flex min-h-screen flex-col bg-white"
        data-testid="allergies-diets-page-container"
      >
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 pb-4 pt-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="-ml-2 flex h-10 w-10 items-center justify-center"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold">
              {t.editAllergiesDiets || '알레르기 및 식습관 편집'}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* 성공 메시지 */}
          {isSuccess && (
            <div
              className="mb-6 rounded-xl bg-green-50 p-4 text-center text-green-600"
              data-testid="success-message"
            >
              알레르기 및 식단 정보가 저장되었습니다.
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div
              className="mb-6 rounded-xl bg-red-50 p-4 text-center text-red-600"
              data-testid="error-message"
            >
              {error}
            </div>
          )}

          {/* 알레르기 섹션 */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">
              {t.allergies || '알레르기'}
            </h2>
            <div className="space-y-3">
              {ALLERGY_TYPES.map((allergy) => {
                const isSelected = selectedAllergies.has(allergy.code);
                const allergyData = selectedAllergies.get(allergy.code);

                return (
                  <div
                    key={allergy.code}
                    className={`rounded-2xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-[#E74C3C] bg-[#E74C3C]/5'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAllergy(allergy.code)}
                        className="h-5 w-5 rounded border-gray-300 text-[#E74C3C] focus:ring-[#E74C3C]"
                        data-testid={`allergy-checkbox-${allergy.code}`}
                      />
                      <span className="text-2xl">{allergy.icon}</span>
                      <span className="flex-1 font-medium">{allergy.name}</span>
                    </div>

                    {/* 선택된 경우 추가 옵션 표시 */}
                    {isSelected && (
                      <div className="mt-4 space-y-3 pl-8">
                        {/* 심각도 선택 */}
                        <div>
                          <label className="mb-1 block text-sm text-gray-600">
                            심각도
                          </label>
                          <select
                            value={allergyData?.severity || 'moderate'}
                            onChange={(e) =>
                              updateAllergySeverity(
                                allergy.code,
                                e.target.value as AllergySeverity
                              )
                            }
                            className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                            data-testid={`allergy-severity-${allergy.code}`}
                          >
                            {SEVERITY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 노트 입력 */}
                        <div>
                          <label className="mb-1 block text-sm text-gray-600">
                            메모 (선택)
                          </label>
                          <input
                            type="text"
                            value={allergyData?.notes || ''}
                            onChange={(e) =>
                              updateAllergyNotes(allergy.code, e.target.value)
                            }
                            placeholder="추가 정보를 입력하세요"
                            maxLength={500}
                            className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                            data-testid={`allergy-notes-${allergy.code}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 식단 섹션 */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">
              {t.dietaryPreferences || '식단 선호'}
            </h2>
            <div className="space-y-3">
              {DIET_TYPES.map((diet) => {
                const isSelected = selectedDiets.has(diet.code);
                const dietData = selectedDiets.get(diet.code);

                return (
                  <div
                    key={diet.code}
                    className={`rounded-2xl border-2 p-4 transition-all ${
                      isSelected
                        ? 'border-[#2ECC71] bg-[#2ECC71]/5'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDiet(diet.code)}
                        className="h-5 w-5 rounded border-gray-300 text-[#2ECC71] focus:ring-[#2ECC71]"
                        data-testid={`diet-checkbox-${diet.code}`}
                      />
                      <span className="text-2xl">{diet.icon}</span>
                      <span className="flex-1 font-medium">{diet.name}</span>
                    </div>

                    {/* 선택된 경우 노트 입력 표시 */}
                    {isSelected && (
                      <div className="mt-4 pl-8">
                        <label className="mb-1 block text-sm text-gray-600">
                          메모 (선택)
                        </label>
                        <input
                          type="text"
                          value={dietData?.notes || ''}
                          onChange={(e) =>
                            updateDietNotes(diet.code, e.target.value)
                          }
                          placeholder="추가 정보를 입력하세요"
                          maxLength={500}
                          className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                          data-testid={`diet-notes-${diet.code}`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer - 저장 버튼 */}
        <div className="border-t border-gray-200 bg-white p-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-14 w-full rounded-2xl bg-[#2ECC71] text-lg font-semibold text-white hover:bg-[#27AE60]"
            data-testid="allergies-diets-submit-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                저장 중...
              </>
            ) : (
              t.confirm || '저장'
            )}
          </Button>
        </div>
      </div>
    </RequireAuth>
  );
}
