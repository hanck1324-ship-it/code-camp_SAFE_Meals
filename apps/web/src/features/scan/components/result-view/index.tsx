'use client';

import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/app/_providers/auth-provider';
import { MAIN_URLS } from '@/commons/constants/url';
import { useRecentScans } from '@/features/dashboard/hooks/useRecentScans';
import { useSafetyCardAllergiesDietsLoad } from '@/features/profile/components/safety-card/hooks/useSafetyCard';
import {
  generatePersonalizedInsights,
  PersonalizedInsights,
  RecommendationBadge,
} from '@/features/scan/components/personalized-insights';
import { ShareResult } from '@/features/scan/components/share-result';
import { useAnalyzeResult } from '@/features/scan/context/analyze-result-context';
import { useSaveAnalysisResult } from '@/hooks/useSaveAnalysisResult';
import { useTranslation } from '@/hooks/useTranslation';
import { convertSafetyLevel } from '@/types/scan-history.types';
import { getGlobalCollector } from '@/utils/performance-metrics';

import type { translations } from '@/lib/translations';

// ============================================
// 타입 정의
// ============================================

type SafetyStatus = 'SAFE' | 'CAUTION' | 'DANGER';

interface ScanResultScreenProps {
  onBack?: () => void;
}

// ============================================
// 스타일 매핑 상수 (디자인 시스템)
// ============================================

/**
 * overall_status별 스타일 매핑
 * 원칙 6: 신호등 컬러 사용
 * 원칙 7: WCAG 4.5:1 명도 대비
 * CSS 변수를 인라인 스타일로 직접 적용
 */
const STATUS_STYLES: Record<
  SafetyStatus,
  {
    bg: string;
    text: string;
    border: string;
    bgStyle: string;
    textStyle: string;
    borderStyle: string;
  }
> = {
  SAFE: {
    bg: 'bg-sm-safe-bg',
    text: 'text-sm-safe-text',
    border: 'border-sm-safe-border',
    bgStyle: 'var(--sm-safe-bg)',
    textStyle: 'var(--sm-safe-text)',
    borderStyle: 'var(--sm-safe-border)',
  },
  CAUTION: {
    bg: 'bg-sm-caution-bg',
    text: 'text-sm-caution-text',
    border: 'border-sm-caution-border',
    bgStyle: 'var(--sm-caution-bg)',
    textStyle: 'var(--sm-caution-text)',
    borderStyle: 'var(--sm-caution-border)',
  },
  DANGER: {
    bg: 'bg-sm-danger-bg',
    text: 'text-sm-danger-text',
    border: 'border-sm-danger-border',
    bgStyle: 'var(--sm-danger-bg)',
    textStyle: 'var(--sm-danger-text)',
    borderStyle: 'var(--sm-danger-border)',
  },
};

/**
 * 아이콘 색상 스타일 매핑
 */
const ICON_STYLES: Record<SafetyStatus, string> = {
  SAFE: 'var(--sm-safe-icon)',
  CAUTION: 'var(--sm-caution-icon)',
  DANGER: 'var(--sm-danger-icon)',
};

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 전체 상태에 따른 아이콘 반환
 * 원칙 3: 통일된 아이콘 크기
 */
function getOverallStatusIcon(status: SafetyStatus) {
  const Icon = {
    SAFE: CheckCircle2,
    CAUTION: AlertTriangle,
    DANGER: XCircle,
  }[status];

  return (
    <Icon
      style={{ width: '32px', height: '32px', color: ICON_STYLES[status] }}
    />
  );
}

/**
 * 메뉴 아이템 안전 상태에 따른 아이콘 반환
 * 원칙 3: 통일된 아이콘 크기
 */
function getSafetyIcon(status: SafetyStatus) {
  const Icon = {
    SAFE: CheckCircle2,
    CAUTION: AlertTriangle,
    DANGER: XCircle,
  }[status];

  return (
    <Icon
      style={{ width: '20px', height: '20px', color: ICON_STYLES[status] }}
    />
  );
}

/**
 * 메뉴 아이템 안전 상태에 따른 배지 반환
 * 원칙 6: 신호등 컬러 사용
 * 원칙 8: 8배수 간격 시스템
 */
function getSafetyBadge(status: SafetyStatus, t: (typeof translations)['ko']) {
  const config = {
    SAFE: {
      Icon: CheckCircle2,
      label: t.safe,
    },
    CAUTION: {
      Icon: AlertTriangle,
      label: t.caution,
    },
    DANGER: {
      Icon: XCircle,
      label: t.warning,
    },
  }[status];

  const { Icon, label } = config;
  const styles = STATUS_STYLES[status];

  return (
    <div
      className="flex items-center gap-1 rounded-full"
      style={{
        backgroundColor: styles.bgStyle,
        paddingLeft: '8px',
        paddingRight: '8px',
        paddingTop: '4px',
        paddingBottom: '4px',
      }}
    >
      <Icon
        style={{ width: '16px', height: '16px', color: ICON_STYLES[status] }}
      />
      <span
        style={{
          color: styles.textStyle,
          fontSize: '14px',
          lineHeight: '1.4',
          fontWeight: '500',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

/**
 * ScanResultScreen
 * - 메뉴 스캔 분석 결과를 표시하는 화면
 * - Context에서 분석 결과를 가져와 표시
 * - overall_status별 UI 분기 처리
 * - FINAL 상태 도달 시 자동으로 Supabase에 저장
 */
export function ScanResultScreen({ onBack }: ScanResultScreenProps) {
  const router = useRouter();

  // onBack이 제공되지 않으면 router.back() 사용
  const handleBack = onBack ?? (() => router.back());
  const { t, language } = useTranslation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 필터 모드 상태: 'SAFE' | 'CAUTION' | 'DANGER' | 'ALL'
  const [filterMode, setFilterMode] = useState<SafetyStatus | 'ALL'>('ALL');

  // Context에서 분석 결과 가져오기
  const { analysisResult, clearAnalysisResult } = useAnalyzeResult();

  // Auth 훅에서 사용자 정보 가져오기
  const { user } = useAuth();

  // 분석 결과 자동 저장 Hook
  const { saveResult, savedScanId, isDuplicate, resetSaveState } =
    useSaveAnalysisResult();

  // 사용자 프로필 데이터 로드 (알레르기, 식단)
  const { allergies, diets } = useSafetyCardAllergiesDietsLoad();

  // 최근 스캔 이력 로드
  const { recentScans } = useRecentScans();

  /**
   * [자동 저장] FINAL 상태 도달 시 Supabase에 저장
   * - 중복 저장 방지 (savedScanId, isDuplicate 체크)
   * - 로그인한 사용자만 저장
   * - 저장 실패해도 UI 경험에 영향 없음
   */
  useEffect(() => {
    // 저장 조건 확인
    const shouldSave =
      analysisResult && // 분석 결과 존재
      !analysisResult._isPartial && // FINAL 상태 (PARTIAL 아님)
      !savedScanId && // 아직 저장 안됨
      !isDuplicate && // 중복 아님
      user?.id && // 로그인한 사용자
      analysisResult.results && // 결과 목록 존재
      analysisResult.results.length > 0; // 결과가 1개 이상

    if (!shouldSave) return;

    // 저장 실행
    saveResult({
      userId: user.id,
      jobId: analysisResult._jobId ?? null,
      scanType: 'menu',
      restaurantName: null, // TODO: 추후 레스토랑 정보 연동
      results: (analysisResult.results ?? []).map((item) => ({
        itemName: item.translated_name || item.original_name,
        safetyLevel: convertSafetyLevel(item.safety_status),
        warningMessage: item.reason || null,
        matchedAllergens: item.allergy_risk?.matched_allergens || null,
        matchedDiets: item.diet_risk?.violations || null,
        confidenceScore: null, // TODO: 추후 AI confidence 연동
      })),
    });
  }, [analysisResult, savedScanId, isDuplicate, user?.id, saveResult]);

  /**
   * [계측] 렌더링 완료 시점 기록
   * - 분석 결과가 있고 화면이 마운트되었을 때 렌더링 완료로 간주
   */
  useEffect(() => {
    if (analysisResult) {
      // 브라우저의 다음 프레임에서 렌더링 완료로 기록
      requestAnimationFrame(() => {
        // 전역 윈도우 객체에서 현재 트래커 가져오기
        if (
          typeof window !== 'undefined' &&
          (window as any).__currentPerformanceTracker
        ) {
          const tracker = (window as any).__currentPerformanceTracker;
          tracker.end('rendering');
          const metrics = tracker.finalize();
          tracker.printSummary();
          getGlobalCollector().add(metrics);
          delete (window as any).__currentPerformanceTracker;
        }
      });
    }
  }, [analysisResult]);

  /**
   * 재촬영 버튼 클릭 핸들러
   * - 분석 결과 초기화 후 스캔 페이지로 이동
   */
  const handleRetake = () => {
    clearAnalysisResult();
    resetSaveState(); // 저장 상태도 초기화
    router.push(MAIN_URLS.SCAN);
  };

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
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
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div /> {/* Spacer */}
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error Message */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <XCircle className="h-16 w-16 text-sm-danger-icon" />
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

  const { overall_status, results } = analysisResult;
  const statusStyle = STATUS_STYLES[overall_status];
  const isPartial = analysisResult._isPartial === true;
  const questionForStaff = analysisResult._questionForStaff;

  // 위험도 순으로 정렬 (DANGER > CAUTION > SAFE)
  const sortedResults = results
    ? [...results].sort((a, b) => {
        const priority = { DANGER: 0, CAUTION: 1, SAFE: 2 };
        return priority[a.safety_status] - priority[b.safety_status];
      })
    : [];

  // 각 등급별 메뉴 개수 계산
  const safeCount = sortedResults.filter(
    (item) => item.safety_status === 'SAFE'
  ).length;
  const cautionCount = sortedResults.filter(
    (item) => item.safety_status === 'CAUTION'
  ).length;
  const dangerCount = sortedResults.filter(
    (item) => item.safety_status === 'DANGER'
  ).length;
  const totalCount = sortedResults.length;

  // 필터링된 결과
  const filteredResults =
    filterMode === 'ALL'
      ? sortedResults
      : sortedResults.filter((item) => item.safety_status === filterMode);

  /**
   * 필터 모드 전환 핸들러
   */
  const handleFilterModeChange = (mode: SafetyStatus | 'ALL') => {
    setFilterMode(mode);
  };

  return (
    <div
      className="flex h-screen flex-col bg-white"
      data-testid="scan-result-screen"
    >
      {/* Top Half - Camera View */}
      <div className="relative h-1/4 min-h-[150px]">
        <img
          src="https://images.unsplash.com/photo-1639508138725-0b8e762b3cfd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwbWVudSUyMGZvb2R8ZW58MXx8fHwxNzY1NDkwNjYyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Menu"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />

        {/* Header Controls (원칙 4: 44px 터치 영역) */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-3">
          <button
            onClick={handleBack}
            className="flex items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm"
            style={{
              minWidth: '44px',
              minHeight: '44px',
            }}
          >
            <ChevronLeft style={{ width: '20px', height: '20px' }} />
          </button>
          <div /> {/* Spacer */}
          <button
            onClick={handleBack}
            className="flex items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm"
            style={{
              minWidth: '44px',
              minHeight: '44px',
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>

      {/* Bottom Section - Results */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
        {/* PARTIAL 상태 표시 (분석 진행 중) */}
        {isPartial && (
          <div
            className="flex items-center gap-2 border-b border-blue-200 bg-blue-50 p-3"
            data-testid="partial-status-banner"
          >
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm text-blue-700">
              {language === 'ko'
                ? '1차 분석 결과입니다. AI 상세 분석 중...'
                : 'Preliminary result. AI analysis in progress...'}
            </p>
          </div>
        )}

        {/* Overall Status Banner */}
        <div
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{
            backgroundColor: statusStyle.bgStyle,
            borderColor: statusStyle.borderStyle,
          }}
          data-testid={`overall-status-${overall_status}`}
        >
          {getOverallStatusIcon(overall_status)}
          <div className="flex-1">
            <p
              className="text-sm font-semibold"
              style={{ color: statusStyle.textStyle }}
              data-testid="status-message"
            >
              {getMessage()}
            </p>
            {(dangerCount > 0 || cautionCount > 0) && (
              <p className="mt-0.5 text-xs text-gray-600">
                {dangerCount > 0 &&
                  `${language === 'ko' ? '위험' : 'Danger'} ${dangerCount}${language === 'ko' ? '개' : ''}`}
                {dangerCount > 0 && cautionCount > 0 && ' · '}
                {cautionCount > 0 &&
                  `${language === 'ko' ? '주의' : 'Caution'} ${cautionCount}${language === 'ko' ? '개' : ''}`}
              </p>
            )}
          </div>
        </div>

        {/* 안전 등급 필터 버튼 - 2x2 그리드 레이아웃 */}
        <div className="border-b border-gray-200 bg-white px-3 py-3">
          <div className="grid w-full grid-cols-2 gap-2">
            {/* ALL 버튼 */}
            <button
              onClick={() => handleFilterModeChange('ALL')}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-3 text-sm font-bold transition-colors ${
                filterMode === 'ALL'
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              style={{ minHeight: '64px' }}
              data-testid="filter-all"
            >
              <span className="whitespace-nowrap">
                {t.all || (language === 'ko' ? '전체' : 'All')}
              </span>
              <span className="text-lg font-semibold">{totalCount}</span>
            </button>

            {/* SAFE 버튼 */}
            <button
              onClick={() => handleFilterModeChange('SAFE')}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-3 text-sm font-bold transition-colors ${
                filterMode === 'SAFE'
                  ? 'bg-[#2ECC71] text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              style={{ minHeight: '64px' }}
              data-testid="filter-safe"
            >
              <span className="whitespace-nowrap">
                {t.safe || (language === 'ko' ? '안전' : 'Safe')}
              </span>
              <span className="text-lg font-semibold">{safeCount}</span>
            </button>

            {/* CAUTION 버튼 */}
            <button
              onClick={() => handleFilterModeChange('CAUTION')}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-3 text-sm font-bold transition-colors ${
                filterMode === 'CAUTION'
                  ? 'bg-[#F39C12] text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              style={{ minHeight: '64px' }}
              data-testid="filter-caution"
            >
              <span className="whitespace-nowrap">
                {t.caution || (language === 'ko' ? '주의' : 'Caution')}
              </span>
              <span className="text-lg font-semibold">{cautionCount}</span>
            </button>

            {/* DANGER 버튼 */}
            <button
              onClick={() => handleFilterModeChange('DANGER')}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-3 text-sm font-bold transition-colors ${
                filterMode === 'DANGER'
                  ? 'bg-[#E74C3C] text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              style={{ minHeight: '64px' }}
              data-testid="filter-danger"
            >
              <span className="whitespace-nowrap">
                {t.danger || (language === 'ko' ? '위험' : 'Danger')}
              </span>
              <span className="text-lg font-semibold">{dangerCount}</span>
            </button>
          </div>
        </div>

        {/* 직원에게 물어볼 질문 (PARTIAL 상태에서만) */}
        {isPartial && questionForStaff && (
          <div
            className="border-b border-amber-200 bg-amber-50 p-4"
            data-testid="staff-question"
          >
            <p className="mb-1 text-xs font-medium text-amber-600">
              {language === 'ko'
                ? '💬 직원에게 물어보세요'
                : '💬 Ask the staff'}
            </p>
            <p className="text-sm font-medium text-amber-800">
              {questionForStaff}
            </p>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {/* Menu Items */}
          {filteredResults.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  {t.menuItems}
                </h3>
                <span className="text-xs text-gray-500">
                  {filteredResults.length} {t.itemsDetected}
                </span>
              </div>
              {filteredResults.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                const hasDetails =
                  (item.ingredients && item.ingredients.length > 0) ||
                  item.allergy_risk ||
                  item.diet_risk;

                // 메뉴 아이템 카드 스타일
                const cardStyle = {
                  borderRadius: '16px',
                  padding: '16px',
                  borderWidth: '2px',
                  borderStyle: 'solid' as const,
                  ...(item.safety_status === 'DANGER'
                    ? {
                        borderColor: 'var(--sm-danger-border)',
                        backgroundColor: 'rgba(254, 242, 242, 0.5)', // --sm-danger-bg with opacity
                      }
                    : item.safety_status === 'CAUTION'
                      ? {
                          borderColor: 'var(--sm-caution-border)',
                          backgroundColor: 'rgba(255, 251, 235, 0.3)', // --sm-caution-bg with opacity
                        }
                      : {
                          borderColor: '#e5e7eb', // gray-200
                          backgroundColor: 'white',
                        }),
                };

                return (
                  <div
                    key={item.id}
                    className="shadow-sm transition-all"
                    style={cardStyle}
                    data-testid="menu-item"
                  >
                    {/* 메인 카드 내용 (원칙 2: 정보 위계) */}
                    <div>
                      <div className="mb-sm-sm flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="mb-sm-xs flex flex-wrap items-center gap-2">
                            {/* 제목 - 원칙 1, 2: 18px 강조 본문 */}
                            <h3
                              className="font-semibold text-gray-900"
                              style={{
                                fontSize: '18px',
                                lineHeight: '1.4',
                                fontWeight: '600',
                              }}
                            >
                              {item.translated_name}
                            </h3>
                            {item.price && (
                              <span
                                className="ml-auto whitespace-nowrap font-extrabold text-[#2ECC71]"
                                style={{
                                  fontSize: '16px',
                                  lineHeight: '1.4',
                                }}
                                data-testid="menu-item-price"
                              >
                                {item.price}
                              </span>
                            )}
                          </div>
                          {/* 부제목 - 원칙 1, 2: 14px 보조 정보 */}
                          <p
                            className="truncate text-gray-500"
                            style={{
                              fontSize: '14px',
                              lineHeight: '1.4',
                            }}
                          >
                            {item.original_name}
                          </p>
                        </div>
                        {getSafetyIcon(item.safety_status)}
                      </div>

                      {/* 간단한 요약 정보 */}
                      <div className="flex items-center justify-between gap-2">
                        {getSafetyBadge(item.safety_status, t)}
                        {item.reason && (
                          <p
                            className="flex-1 truncate text-xs font-medium"
                            style={{ color: 'var(--sm-danger-text)' }}
                          >
                            {item.reason}
                          </p>
                        )}
                      </div>

                      {/* 펼치기/접기 버튼 (원칙 4: 44px 터치 영역) */}
                      {hasDetails && (
                        <button
                          onClick={() => toggleItemExpanded(item.id)}
                          className="mt-sm-sm flex w-full items-center justify-center gap-1 bg-gray-50 font-medium text-gray-600 transition-colors hover:bg-gray-100"
                          style={{
                            minHeight: '44px',
                            borderRadius: '12px',
                            fontSize: '14px',
                          }}
                        >
                          {isExpanded
                            ? language === 'ko'
                              ? '간단히 보기'
                              : 'Show Less'
                            : language === 'ko'
                              ? '자세히 보기'
                              : 'Show More'}
                          {isExpanded ? (
                            <ChevronUp
                              style={{ width: '16px', height: '16px' }}
                            />
                          ) : (
                            <ChevronDown
                              style={{ width: '16px', height: '16px' }}
                            />
                          )}
                        </button>
                      )}
                    </div>

                    {/* 상세 정보 (펼쳤을 때만 표시) */}
                    {isExpanded && hasDetails && (
                      <div className="space-y-3 border-t border-gray-200 bg-white p-3">
                        {/* 설명 */}
                        {item.description && (
                          <p className="text-sm leading-relaxed text-gray-700">
                            {item.description}
                          </p>
                        )}

                        {/* 재료 */}
                        {item.ingredients && item.ingredients.length > 0 && (
                          <div>
                            <h4 className="mb-1.5 text-xs font-semibold text-gray-700">
                              {language === 'ko' ? '재료' : 'Ingredients'}
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {item.ingredients.map((ing, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                                  data-testid="ingredient-tag"
                                >
                                  {ing}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 알레르기 & 식단 위험도 */}
                        <div className="space-y-2">
                          {/* Allergy Risk */}
                          {item.allergy_risk && (
                            <div
                              className={`flex items-start gap-2 rounded-lg p-2 ${
                                item.allergy_risk.status === 'DANGER'
                                  ? 'bg-red-100'
                                  : item.allergy_risk.status === 'CAUTION'
                                    ? 'bg-orange-100'
                                    : 'bg-yellow-100'
                              }`}
                              data-testid="warning-item"
                            >
                              <span className="whitespace-nowrap text-xs font-semibold text-gray-700">
                                알레르기:
                              </span>
                              <div className="flex flex-1 flex-wrap items-center gap-1.5">
                                <span
                                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                  style={{
                                    backgroundColor:
                                      ICON_STYLES[
                                        item.allergy_risk.status as SafetyStatus
                                      ],
                                    color: 'white',
                                  }}
                                >
                                  {item.allergy_risk.status === 'DANGER'
                                    ? '위험'
                                    : item.allergy_risk.status === 'CAUTION'
                                      ? '주의'
                                      : '안전'}
                                </span>
                                {item.allergy_risk.matched_allergens &&
                                  item.allergy_risk.matched_allergens.length >
                                    0 && (
                                    <span className="text-xs font-medium text-gray-700">
                                      {item.allergy_risk.matched_allergens.join(
                                        ', '
                                      )}
                                    </span>
                                  )}
                              </div>
                            </div>
                          )}

                          {/* Diet Risk */}
                          {item.diet_risk && (
                            <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2">
                              <span className="whitespace-nowrap text-xs font-semibold text-gray-700">
                                {language === 'ko' ? '식단:' : 'Diet:'}
                              </span>
                              <div className="flex flex-1 flex-wrap items-center gap-1.5">
                                <span
                                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                  style={{
                                    backgroundColor:
                                      ICON_STYLES[
                                        item.diet_risk.status as SafetyStatus
                                      ],
                                    color: 'white',
                                  }}
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
                                    <span className="text-xs font-medium text-gray-700">
                                      {item.diet_risk.violations.join(', ')}
                                    </span>
                                  )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // 필터링 결과가 없을 때
            <div className="flex flex-col items-center justify-center py-12">
              <p className="mb-2 text-sm text-gray-600">
                {language === 'ko'
                  ? filterMode === 'ALL'
                    ? '메뉴가 없습니다'
                    : filterMode === 'SAFE'
                      ? '안전한 메뉴가 없습니다'
                      : filterMode === 'CAUTION'
                        ? '주의 메뉴가 없습니다'
                        : '위험 메뉴가 없습니다'
                  : filterMode === 'ALL'
                    ? 'No items'
                    : `No ${filterMode.toLowerCase()} items`}
              </p>
              {filterMode !== 'ALL' && (
                <button
                  onClick={() => setFilterMode('ALL')}
                  className="text-sm text-[#2ECC71] hover:underline"
                >
                  {language === 'ko' ? '모든 메뉴 보기' : 'Show all items'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Retake Button (원칙 4: 56px 주요 버튼, 원칙 5: 피드백) */}
        <div className="border-t border-gray-200 bg-white p-sm-md">
          <button
            onClick={handleRetake}
            className="hover:bg-primary/90 w-full bg-primary font-semibold text-white transition-colors active:scale-95"
            style={{
              minHeight: '56px',
              borderRadius: '16px',
              fontSize: '16px',
              lineHeight: '1.5',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
            data-testid="retake-button"
          >
            {language === 'ko' ? '다시 촬영하기' : 'Retake Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
