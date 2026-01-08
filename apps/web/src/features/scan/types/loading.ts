/**
 * 분석 로딩 단계
 * 원칙 5: 명확한 피드백 제공
 */
export type AnalysisLoadingStage =
  | 'idle'
  | 'compressing'        // 이미지 압축 (10%)
  | 'fetching-context'   // 사용자 정보 조회 (20%)
  | 'analyzing-ocr'      // OCR 텍스트 추출 (40%)
  | 'analyzing-ai'       // AI 분석 (100%)
  | 'complete';

export const LOADING_STAGE_PROGRESS: Record<AnalysisLoadingStage, number> = {
  idle: 0,
  compressing: 10,
  'fetching-context': 20,
  'analyzing-ocr': 40,
  'analyzing-ai': 100,
  complete: 100,
};

export const LOADING_STAGE_MESSAGES = {
  ko: {
    compressing: '이미지 최적화 중...',
    'fetching-context': '사용자 정보 확인 중...',
    'analyzing-ocr': '메뉴 텍스트 추출 중...',
    'analyzing-ai': 'AI 분석 중...',
  },
  en: {
    compressing: 'Optimizing image...',
    'fetching-context': 'Loading user info...',
    'analyzing-ocr': 'Extracting menu text...',
    'analyzing-ai': 'Analyzing with AI...',
  },
} as const;
