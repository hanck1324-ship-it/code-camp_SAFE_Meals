/**
 * 알레르기 및 식단 데이터 바인딩 컴포넌트
 *
 * @description Supabase에서 알레르기/식단 데이터를 불러와
 *              카드 리스트 형태로 표시하는 컴포넌트
 *
 * @example
 * ```tsx
 * <AllergiesDietsDatabinding />
 * ```
 */

'use client';

import { Loader2, AlertTriangle, Utensils, AlertCircle } from 'lucide-react';

import { useTranslation } from '@/hooks/useTranslation';

import {
  getAllergyTypeInfo,
  getDietTypeInfo,
  getSeverityLabel,
} from './constants';
import { useSafetyCardAllergiesDietsLoad } from '../hooks/useSafetyCard';

import type { Language } from '@/commons/stores/useLanguageStore';

/**
 * 알레르기 카드 컴포넌트 Props
 */
interface AllergyCardProps {
  code: string;
  severity: string;
  notes?: string;
  language: Language;
}

/**
 * 알레르기 카드 컴포넌트
 */
function AllergyCard({ code, severity, notes, language }: AllergyCardProps) {
  const allergyInfo = getAllergyTypeInfo(code, language);
  const severityLabel = getSeverityLabel(severity, language);

  return (
    <div
      className="rounded-2xl border-2 border-red-400 bg-red-50 p-4 shadow-sm"
      data-testid={`allergy-card-${code}`}
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <span className="text-2xl" data-testid={`allergy-icon-${code}`}>
          {allergyInfo.icon}
        </span>

        {/* 정보 */}
        <div className="flex-1">
          {/* 이름 */}
          <span
            className="text-base font-semibold text-gray-900"
            data-testid={`allergy-name-${code}`}
          >
            {allergyInfo.name}
          </span>

          {/* 심각도 뱃지 */}
          <span
            className="ml-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-sm text-red-600"
            data-testid={`severity-badge-${code}`}
          >
            {severityLabel}
          </span>

          {/* 노트 (있는 경우만) */}
          {notes && (
            <p
              className="mt-2 text-sm italic text-gray-600"
              data-testid={`notes-${code}`}
            >
              {notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 식단 카드 컴포넌트 Props
 */
interface DietCardProps {
  code: string;
  notes?: string;
  language: Language;
}

/**
 * 식단 카드 컴포넌트
 */
function DietCard({ code, notes, language }: DietCardProps) {
  const dietInfo = getDietTypeInfo(code, language);

  return (
    <div
      className="rounded-2xl border-2 border-green-400 bg-green-50 p-4 shadow-sm"
      data-testid={`diet-card-${code}`}
    >
      <div className="flex items-start gap-3">
        {/* 아이콘 */}
        <span className="text-2xl" data-testid={`diet-icon-${code}`}>
          {dietInfo.icon}
        </span>

        {/* 정보 */}
        <div className="flex-1">
          {/* 이름 */}
          <span
            className="text-base font-semibold text-gray-900"
            data-testid={`diet-name-${code}`}
          >
            {dietInfo.name}
          </span>

          {/* 노트 (있는 경우만) */}
          {notes && (
            <p
              className="mt-2 text-sm italic text-gray-600"
              data-testid={`notes-diet-${code}`}
            >
              {notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 로딩 상태 컴포넌트
 */
function LoadingState() {
  return (
    <div
      className="flex items-center justify-center py-8"
      data-testid="allergies-diets-loading"
    >
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}

/**
 * 에러 상태 컴포넌트
 */
function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border-2 border-red-200 bg-red-50 p-6"
      data-testid="allergies-diets-error"
    >
      <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
      <p className="text-center text-red-600">{message}</p>
    </div>
  );
}

/**
 * 빈 상태 컴포넌트
 */
function EmptyState() {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-gray-50 p-6"
      data-testid="allergies-diets-empty"
    >
      <AlertTriangle className="mb-2 h-8 w-8 text-gray-400" />
      <p className="text-center text-gray-600">
        {t.safetyCardAllergyDietEmpty}
      </p>
    </div>
  );
}

/**
 * 알레르기 및 식단 데이터 바인딩 메인 컴포넌트
 */
export function AllergiesDietsDatabinding() {
  const { allergies, diets, isLoading, error } =
    useSafetyCardAllergiesDietsLoad();
  const { t, language } = useTranslation();

  return (
    <div
      className="mt-6 w-full max-w-md space-y-6"
      data-testid="allergies-diets-databinding-container"
    >
      {/* 로딩 상태 */}
      {isLoading && <LoadingState />}

      {/* 에러 상태 */}
      {!isLoading && error && (
        <ErrorState message={t.safetyCardAllergyDietLoadError || error} />
      )}

      {/* 빈 상태 */}
      {!isLoading && !error && allergies.length === 0 && diets.length === 0 && (
        <EmptyState />
      )}

      {/* 알레르기 섹션 */}
      {!isLoading && !error && allergies.length > 0 && (
        <div data-testid="allergies-section">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {t.safetyCardAllergyInfoTitle}
          </h3>
          <div className="space-y-3">
            {allergies.map((allergy) => (
              <AllergyCard
                key={allergy.allergy_code}
                code={allergy.allergy_code}
                severity={allergy.severity}
                notes={allergy.notes}
                language={language}
              />
            ))}
          </div>
        </div>
      )}

      {/* 식단 섹션 */}
      {!isLoading && !error && diets.length > 0 && (
        <div data-testid="diets-section">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-green-600">
            <Utensils className="h-5 w-5" />
            {t.safetyCardDietInfoTitle}
          </h3>
          <div className="space-y-3">
            {diets.map((diet) => (
              <DietCard
                key={diet.diet_code}
                code={diet.diet_code}
                notes={diet.notes}
                language={language}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AllergiesDietsDatabinding;
