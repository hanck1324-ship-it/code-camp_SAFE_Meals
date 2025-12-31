'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// ============================================
// 타입 정의
// ============================================

/**
 * 메뉴 분석 아이템 인터페이스
 * - 개별 메뉴 항목의 분석 결과를 나타냄
 */
export interface MenuAnalysisItem {
  /** 고유 식별자 */
  id: string;
  /** 원본 메뉴명 */
  original_name: string;
  /** 번역된 메뉴명 */
  translated_name: string;
  /** 메뉴 설명 */
  description: string;
  /** 안전 상태 (SAFE: 안전, CAUTION: 주의, DANGER: 위험) */
  safety_status: 'SAFE' | 'CAUTION' | 'DANGER';
  /** 안전 상태 사유 */
  reason: string;
  /** 감지된 재료 목록 */
  ingredients: string[];
  /** 알레르기 위험 평가 */
  allergy_risk: {
    status: 'SAFE' | 'CAUTION' | 'DANGER';
    matched_allergens: string[];
  };
  /** 식단 위험 평가 */
  diet_risk: {
    status: 'SAFE' | 'CAUTION' | 'DANGER';
    violations: string[];
  };
}

/**
 * 분석 결과 인터페이스
 * - 전체 메뉴 분석 결과를 나타냄
 */
export interface AnalysisResult {
  /** 전체 안전 상태 */
  overall_status: 'SAFE' | 'CAUTION' | 'DANGER';
  /** 감지된 재료 목록 */
  detected_ingredients: string[];
  /** 경고 목록 */
  warnings: Array<{
    /** 재료명 */
    ingredient: string;
    /** 알레르겐명 */
    allergen: string;
    /** 심각도 (HIGH: 높음, MEDIUM: 중간, LOW: 낮음) */
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  /** 한국어 메시지 */
  message_ko: string;
  /** 영어 메시지 */
  message_en: string;
  /** 개별 메뉴 분석 결과 목록 */
  results?: MenuAnalysisItem[];
}

// ============================================
// Context 정의
// ============================================

interface AnalyzeResultContextValue {
  /** 분석 결과 */
  analysisResult: AnalysisResult | null;
  /** 분석 결과 설정 함수 */
  setAnalysisResult: (result: AnalysisResult | null) => void;
  /** 분석 결과 초기화 함수 */
  clearAnalysisResult: () => void;
}

const AnalyzeResultContext = createContext<AnalyzeResultContextValue | null>(
  null
);

// ============================================
// Provider 컴포넌트
// ============================================

interface AnalyzeResultProviderProps {
  children: ReactNode;
}

/**
 * AnalyzeResultProvider
 * - 분석 결과를 전역으로 관리하는 Provider
 * - 분석 결과 저장, 조회, 초기화 기능 제공
 */
export function AnalyzeResultProvider({
  children,
}: AnalyzeResultProviderProps) {
  const [analysisResult, setAnalysisResultState] =
    useState<AnalysisResult | null>(null);

  /**
   * 분석 결과 설정 함수
   * - 새로운 분석 결과를 저장
   */
  const setAnalysisResult = useCallback((result: AnalysisResult | null) => {
    setAnalysisResultState(result);
  }, []);

  /**
   * 분석 결과 초기화 함수
   * - 분석 결과를 null로 초기화
   */
  const clearAnalysisResult = useCallback(() => {
    setAnalysisResultState(null);
  }, []);

  const value: AnalyzeResultContextValue = {
    analysisResult,
    setAnalysisResult,
    clearAnalysisResult,
  };

  return (
    <AnalyzeResultContext.Provider value={value}>
      {children}
    </AnalyzeResultContext.Provider>
  );
}

// ============================================
// Custom Hook
// ============================================

/**
 * useAnalyzeResult
 * - AnalyzeResultContext를 사용하기 위한 커스텀 훅
 * - Provider 외부에서 호출 시 에러 발생
 */
export function useAnalyzeResult(): AnalyzeResultContextValue {
  const context = useContext(AnalyzeResultContext);

  if (context === null) {
    throw new Error(
      'useAnalyzeResult must be used within an AnalyzeResultProvider'
    );
  }

  return context;
}
