'use client';

import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import {
  AnalysisLoadingStage,
  LOADING_STAGE_PROGRESS,
  LOADING_STAGE_MESSAGES,
} from '@/features/scan/types/loading';

interface AnalysisLoadingOverlayProps {
  stage: AnalysisLoadingStage;
  isVisible: boolean;
  language?: 'ko' | 'en';
}

/**
 * 분석 로딩 오버레이
 * 원칙 5: 스피너 + 진행률 + 단계별 메시지
 * 원칙 9: 한 화면 하나의 목적 (로딩 상태만 표시)
 */
export function AnalysisLoadingOverlay({
  stage,
  isVisible,
  language = 'ko',
}: AnalysisLoadingOverlayProps) {
  if (!isVisible || stage === 'idle' || stage === 'complete') {
    return null;
  }

  const progress = LOADING_STAGE_PROGRESS[stage];
  const messages = LOADING_STAGE_MESSAGES[language];
  const message = messages[stage as keyof typeof messages] || '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-message"
    >
      <div className="w-[90%] max-w-md rounded-2xl bg-white p-sm-lg shadow-2xl dark:bg-gray-900">
        {/* 스피너 (원칙 5) */}
        <div className="mb-sm-md flex justify-center">
          <Loader2
            className="animate-spin text-primary"
            style={{
              width: '40px',
              height: '40px',
            }}
          />
        </div>

        {/* 메시지 (원칙 2: 정보 위계 - 굵은 폰트) */}
        <p
          id="loading-message"
          className="mb-sm-sm text-center font-semibold text-gray-900 dark:text-gray-50"
          style={{
            fontSize: '18px',
            lineHeight: '1.5',
          }}
        >
          {message}
        </p>

        {/* 진행률 바 */}
        <Progress
          value={progress}
          className="mb-sm-sm h-2"
          aria-label={`분석 진행률 ${progress}%`}
        />

        {/* 진행률 텍스트 (원칙 2: 보조 정보 - 얇은 색상) */}
        <p
          className="text-center text-gray-500 dark:text-gray-400"
          style={{
            fontSize: '14px',
            lineHeight: '1.4',
          }}
        >
          {progress}%
        </p>
      </div>
    </div>
  );
}
