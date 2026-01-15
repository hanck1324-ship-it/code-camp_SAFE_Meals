'use client';

import { AlertCircle, RefreshCw, Home, HelpCircle } from 'lucide-react';

import { SCAN_ERROR_INFO } from '@/features/scan/types/error';

import type { ScanErrorType } from '@/features/scan/types/error';

interface ErrorViewProps {
  errorType: ScanErrorType;
  language?: 'ko' | 'en';
  onRetry?: () => void;
  onGoHome?: () => void;
  onContactSupport?: () => void;
}

/**
 * 향상된 에러 UI 컴포넌트
 * - 에러 원인별 구체적인 메시지 표시
 * - 해결 방법 제안
 * - 재시도, 홈으로, 고객센터 액션 제공
 */
export function ErrorView({
  errorType,
  language = 'ko',
  onRetry,
  onGoHome,
  onContactSupport,
}: ErrorViewProps) {
  const errorInfo = SCAN_ERROR_INFO[errorType];
  const content = errorInfo[language];
  const isRetryable = errorInfo.retryable;

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Error Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        {/* Error Icon */}
        <div
          className="flex items-center justify-center rounded-full bg-red-100"
          style={{ width: '80px', height: '80px' }}
        >
          <AlertCircle
            className="text-red-500"
            style={{ width: '48px', height: '48px' }}
          />
        </div>

        {/* Error Title */}
        <div className="space-y-2 text-center">
          <h2
            className="font-bold text-gray-900"
            style={{ fontSize: '24px', lineHeight: '1.4' }}
          >
            {content.title}
          </h2>
          <p
            className="text-gray-600"
            style={{ fontSize: '16px', lineHeight: '1.5' }}
          >
            {content.message}
          </p>
        </div>

        {/* Suggestion Box */}
        <div className="w-full max-w-md rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <HelpCircle
              className="mt-0.5 flex-shrink-0 text-blue-600"
              style={{ width: '20px', height: '20px' }}
            />
            <div>
              <p className="mb-1 text-sm font-medium text-blue-900">
                {language === 'ko' ? '💡 해결 방법' : '💡 Solution'}
              </p>
              <p className="text-sm leading-relaxed text-blue-800">
                {content.suggestion}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md space-y-3">
          {/* Retry Button (재시도 가능한 경우만) */}
          {isRetryable && onRetry && (
            <button
              onClick={onRetry}
              className="hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-white shadow-md transition-colors active:scale-95"
              style={{
                minHeight: '56px',
                fontSize: '16px',
              }}
            >
              <RefreshCw style={{ width: '20px', height: '20px' }} />
              {language === 'ko' ? '다시 시도' : 'Try Again'}
            </button>
          )}

          {/* Home Button */}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 font-semibold text-gray-900 transition-colors hover:bg-gray-200 active:scale-95"
              style={{
                minHeight: '56px',
                fontSize: '16px',
              }}
            >
              <Home style={{ width: '20px', height: '20px' }} />
              {language === 'ko' ? '홈으로 가기' : 'Go Home'}
            </button>
          )}

          {/* Support Link */}
          {onContactSupport && (
            <button
              onClick={onContactSupport}
              className="w-full text-center text-sm text-gray-600 underline transition-colors hover:text-gray-900"
              style={{ minHeight: '44px' }}
            >
              {language === 'ko' ? '고객센터 문의하기' : 'Contact Support'}
            </button>
          )}
        </div>

        {/* Error Code (디버깅용) */}
        <p className="mt-4 text-xs text-gray-400">Error Code: {errorType}</p>
      </div>
    </div>
  );
}
