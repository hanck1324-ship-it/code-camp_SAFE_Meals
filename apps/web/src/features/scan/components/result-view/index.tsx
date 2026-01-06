'use client';

import {
  X,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LanguageSelector } from '@/components/language-selector';
import { useAnalyzeResult } from '@/features/scan/context/analyze-result-context';
import { useTranslation } from '@/hooks/useTranslation';
import { translations } from '@/lib/translations';
import { MAIN_URLS } from '@/commons/constants/url';

// ============================================
// 타입 정의
// ============================================

type SafetyStatus = 'SAFE' | 'CAUTION' | 'DANGER';
type SeverityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

interface ScanResultScreenProps {
  onBack: () => void;
}

// ============================================
// 스타일 매핑 상수
// ============================================

/**
 * overall_status별 스타일 매핑
 */
const STATUS_STYLES: Record<
  SafetyStatus,
  { bg: string; text: string; border: string }
> = {
  SAFE: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  CAUTION: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  DANGER: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

/**
 * 경고 심각도별 스타일 매핑
 */
const SEVERITY_STYLES: Record<
  SeverityLevel,
  { bg: string; border: string; text: string }
> = {
  HIGH: {
    bg: 'bg-red-100',
    border: 'border-red-300',
    text: 'text-red-800',
  },
  MEDIUM: {
    bg: 'bg-orange-100',
    border: 'border-orange-300',
    text: 'text-orange-800',
  },
  LOW: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    text: 'text-yellow-800',
  },
};

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 전체 상태에 따른 아이콘 반환
 */
function getOverallStatusIcon(status: SafetyStatus) {
  switch (status) {
    case 'SAFE':
      return <CheckCircle className="h-8 w-8 text-green-600" />;
    case 'CAUTION':
      return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
    case 'DANGER':
      return <AlertCircle className="h-8 w-8 text-red-600" />;
  }
}

/**
 * 메뉴 아이템 안전 상태에 따른 아이콘 반환
 */
function getSafetyIcon(status: SafetyStatus) {
  switch (status) {
    case 'SAFE':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'CAUTION':
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    case 'DANGER':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
  }
}

/**
 * 메뉴 아이템 안전 상태에 따른 배지 반환
 */
function getSafetyBadge(status: SafetyStatus, t: (typeof translations)['ko']) {
  switch (status) {
    case 'SAFE':
      return (
        <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span className="text-xs text-green-700">{t.safe}</span>
        </div>
      );
    case 'CAUTION':
      return (
        <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1">
          <AlertTriangle className="h-3 w-3 text-yellow-600" />
          <span className="text-xs text-yellow-700">{t.caution}</span>
        </div>
      );
    case 'DANGER':
      return (
        <div className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1">
          <AlertCircle className="h-3 w-3 text-red-600" />
          <span className="text-xs text-red-700">{t.warning}</span>
        </div>
      );
  }
}

// ============================================
// 메인 컴포넌트
// ============================================

/**
 * ScanResultScreen
 * - 메뉴 스캔 분석 결과를 표시하는 화면
 * - Context에서 분석 결과를 가져와 표시
 * - overall_status별 UI 분기 처리
 */
export function ScanResultScreen({ onBack }: ScanResultScreenProps) {
  const router = useRouter();
  const { t, language } = useTranslation();

  // Context에서 분석 결과 가져오기
  const { analysisResult, clearAnalysisResult } = useAnalyzeResult();

  /**
   * 재촬영 버튼 클릭 핸들러
   * - 분석 결과 초기화 후 스캔 페이지로 이동
   */
  const handleRetake = () => {
    clearAnalysisResult();
    router.push(MAIN_URLS.SCAN);
  };

  /**
   * 다국어 메시지 반환
   */
  const getMessage = () => {
    if (!analysisResult) return '';
    return language === 'ko'
      ? analysisResult.message_ko
      : analysisResult.message_en;
  };

  // 분석 결과가 없는 경우 에러 UI 표시
  if (!analysisResult) {
    return (
      <div
        className="flex h-screen flex-col bg-white"
        data-testid="scan-result-screen"
      >
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <LanguageSelector />
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error Message */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <AlertCircle className="h-16 w-16 text-red-400" />
          <p
            className="text-center text-lg text-gray-600"
            data-testid="error-message"
          >
            {language === 'ko'
              ? '분석 결과를 불러올 수 없습니다.'
              : 'Unable to load analysis results.'}
          </p>
          <button
            onClick={handleRetake}
            className="rounded-full bg-primary px-6 py-3 text-white"
            data-testid="retake-button"
          >
            {language === 'ko' ? '다시 촬영하기' : 'Retake Photo'}
          </button>
        </div>
      </div>
    );
  }

  const { overall_status, detected_ingredients, warnings, results } =
    analysisResult;
  const statusStyle = STATUS_STYLES[overall_status];

  return (
    <div
      className="flex h-screen flex-col bg-white"
      data-testid="scan-result-screen"
    >
      {/* Top Half - Camera View */}
      <div className="relative h-1/3 min-h-[200px]">
        <img
          src="https://images.unsplash.com/photo-1639508138725-0b8e762b3cfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwbWVudSUyMGZvb2R8ZW58MXx8fHwxNzY1NDkwNjYyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Menu"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

        {/* Header Controls */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <LanguageSelector />
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Camera Frame Overlay */}
        <div className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-white/50" />
      </div>

      {/* Bottom Section - Results */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
        {/* Overall Status Banner */}
        <div
          className={`flex items-center gap-3 border-b p-4 ${statusStyle.bg} ${statusStyle.border}`}
          data-testid={`overall-status-${overall_status}`}
        >
          {getOverallStatusIcon(overall_status)}
          <div className="flex-1">
            <p
              className={`font-semibold ${statusStyle.text}`}
              data-testid="status-message"
            >
              {getMessage()}
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Detected Ingredients */}
          {detected_ingredients && detected_ingredients.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                {language === 'ko' ? '감지된 재료' : 'Detected Ingredients'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {detected_ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    data-testid="ingredient-tag"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                {language === 'ko' ? '경고 사항' : 'Warnings'}
              </h3>
              <div className="space-y-2">
                {warnings.map((warning, index) => {
                  const severityStyle = SEVERITY_STYLES[warning.severity];
                  return (
                    <div
                      key={index}
                      className={`space-y-1 rounded-lg border p-4 ${severityStyle.bg} ${severityStyle.border}`}
                      data-testid="warning-item"
                    >
                      <p className={`font-semibold ${severityStyle.text}`}>
                        {warning.ingredient}
                      </p>
                      <p className={`text-sm ${severityStyle.text}`}>
                        {warning.allergen}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Menu Items */}
          {results && results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                  {t.menuItems}
                </h3>
                <span className="text-sm text-gray-500">
                  {results.length} {t.itemsDetected}
                </span>
              </div>
              {results.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border-2 border-gray-200 bg-white p-4"
                  data-testid="menu-item"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-1 font-medium">
                        {item.translated_name}
                      </h3>
                      <p className="mb-2 text-xs text-gray-500">
                        {item.original_name}
                      </p>
                    </div>
                    {getSafetyIcon(item.safety_status)}
                  </div>

                  <p className="mb-3 text-sm text-gray-500">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between">
                    {getSafetyBadge(item.safety_status, t)}
                    {item.reason && (
                      <p className="text-xs text-red-600">{item.reason}</p>
                    )}
                  </div>

                  {/* Ingredients */}
                  {item.ingredients && item.ingredients.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.ingredients.map((ing, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Allergy & Diet Risk Details */}
                  <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                    {/* Allergy Risk */}
                    {item.allergy_risk && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-gray-500">
                          {language === 'ko' ? '알레르기:' : 'Allergy:'}
                        </span>
                        <div className="flex flex-1 flex-wrap items-center gap-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.allergy_risk.status === 'DANGER'
                                ? 'bg-red-100 text-red-700'
                                : item.allergy_risk.status === 'CAUTION'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {item.allergy_risk.status === 'DANGER'
                              ? language === 'ko'
                                ? '위험'
                                : 'Danger'
                              : item.allergy_risk.status === 'CAUTION'
                                ? language === 'ko'
                                  ? '주의'
                                  : 'Caution'
                                : language === 'ko'
                                  ? '안전'
                                  : 'Safe'}
                          </span>
                          {item.allergy_risk.matched_allergens &&
                            item.allergy_risk.matched_allergens.length > 0 && (
                              <span className="text-xs text-gray-600">
                                (
                                {item.allergy_risk.matched_allergens.join(', ')}
                                )
                              </span>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Diet Risk */}
                    {item.diet_risk && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-gray-500">
                          {language === 'ko' ? '식단:' : 'Diet:'}
                        </span>
                        <div className="flex flex-1 flex-wrap items-center gap-1">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.diet_risk.status === 'DANGER'
                                ? 'bg-red-100 text-red-700'
                                : item.diet_risk.status === 'CAUTION'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {item.diet_risk.status === 'DANGER'
                              ? language === 'ko'
                                ? '부적합'
                                : 'Not Suitable'
                              : item.diet_risk.status === 'CAUTION'
                                ? language === 'ko'
                                  ? '주의'
                                  : 'Caution'
                                : language === 'ko'
                                  ? '적합'
                                  : 'Suitable'}
                          </span>
                          {item.diet_risk.violations &&
                            item.diet_risk.violations.length > 0 && (
                              <span className="text-xs text-gray-600">
                                ({item.diet_risk.violations.join(', ')})
                              </span>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Retake Button */}
        <div className="border-t border-gray-200 bg-white p-4">
          <button
            onClick={handleRetake}
            className="w-full rounded-full bg-primary py-3 text-white"
            data-testid="retake-button"
          >
            {language === 'ko' ? '다시 촬영하기' : 'Retake Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
