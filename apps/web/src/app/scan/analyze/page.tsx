'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, Camera, ArrowLeft } from 'lucide-react';
import { useAnalyzeSubmit } from '@/features/scan/components/menu-scan/hooks/useAnalyzeSubmit.hook';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { Button } from '@/components/ui/button';

/**
 * 번역 텍스트
 */
const TEXTS = {
  ko: {
    title: '메뉴 분석',
    analyzing: '분석 중...',
    analyzeButton: '분석하기',
    retakeButton: '다시 촬영',
    backButton: '뒤로',
    noImage: '분석할 이미지가 없습니다.',
    goToCamera: '카메라로 이동',
  },
  en: {
    title: 'Menu Analysis',
    analyzing: 'Analyzing...',
    analyzeButton: 'Analyze',
    retakeButton: 'Retake Photo',
    backButton: 'Back',
    noImage: 'No image to analyze.',
    goToCamera: 'Go to Camera',
  },
};

/**
 * 분석 페이지 컨텐츠 컴포넌트
 */
function AnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = useLanguageStore((state) => state.language);
  const texts = TEXTS[language];

  const { isLoading, error, submitAnalyze, clearError, reset } =
    useAnalyzeSubmit();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);

  // URL 또는 네이티브 브릿지에서 이미지 URI 추출
  useEffect(() => {
    // 1. URL 파라미터에서 확인
    const uri = searchParams.get('imageUri');
    if (uri) {
      setImageUri(decodeURIComponent(uri));
      return;
    }

    // 2. 네이티브 앱에서 주입된 이미지 확인
    const checkNativeImage = () => {
      if (
        typeof window !== 'undefined' &&
        (window as any).pendingAnalyzeImage
      ) {
        setImageUri((window as any).pendingAnalyzeImage);
        // 사용 후 삭제
        (window as any).pendingAnalyzeImage = null;
      }
    };

    // 바로 확인
    checkNativeImage();

    // nativeBridgeReady 이벤트 대기
    const handleBridgeReady = () => checkNativeImage();
    window.addEventListener('nativeBridgeReady', handleBridgeReady);

    return () => {
      window.removeEventListener('nativeBridgeReady', handleBridgeReady);
    };
  }, [searchParams]);

  // 이미지가 있으면 자동으로 분석 시작
  useEffect(() => {
    if (imageUri && !hasStartedAnalysis && !isLoading && !error) {
      setHasStartedAnalysis(true);
      handleAnalyze();
    }
  }, [imageUri, hasStartedAnalysis, isLoading, error]);

  /**
   * 분석 시작
   */
  const handleAnalyze = useCallback(async () => {
    if (!imageUri) return;

    try {
      await submitAnalyze(imageUri, language);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  }, [imageUri, language, submitAnalyze]);

  /**
   * 다시 촬영 (카메라로 돌아가기)
   */
  const handleRetake = useCallback(() => {
    reset();
    clearError();
    router.back();
  }, [reset, clearError, router]);

  /**
   * 뒤로 가기
   */
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // 이미지가 없는 경우
  if (!imageUri) {
    return (
      <div
        data-testid="analyze-page"
        className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] p-4"
      >
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-[var(--color-text-secondary)]" />
          <p
            data-testid="no-image-message"
            className="mb-6 text-lg text-[var(--color-text-secondary)]"
          >
            {texts.noImage}
          </p>
          <Button
            data-testid="go-to-camera-button"
            onClick={handleBack}
            className="bg-[var(--color-primary)] text-white"
          >
            <Camera className="mr-2 h-4 w-4" />
            {texts.goToCamera}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="analyze-page"
      className="flex min-h-screen flex-col bg-[var(--color-background)]"
    >
      {/* 헤더 */}
      <header className="flex items-center gap-4 border-b border-[var(--color-border)] p-4">
        <button
          data-testid="back-button"
          onClick={handleBack}
          className="rounded-lg p-2 hover:bg-[var(--color-surface)]"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--color-text-primary)]" />
        </button>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          {texts.title}
        </h1>
      </header>

      {/* 이미지 미리보기 */}
      <div className="flex-1 p-4">
        <div className="relative mx-auto max-w-md overflow-hidden rounded-lg bg-[var(--color-surface)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-testid="preview-image"
            src={imageUri}
            alt="Menu preview"
            className="h-auto w-full object-contain"
          />

          {/* 로딩 오버레이 */}
          {isLoading && (
            <div
              data-testid="loading-overlay"
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/50"
            >
              <Loader2
                data-testid="loading-spinner"
                className="mb-4 h-12 w-12 animate-spin text-white"
              />
              <p
                data-testid="loading-text"
                className="text-lg font-medium text-white"
              >
                {texts.analyzing}
              </p>
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div
            data-testid="error-message"
            className="bg-[var(--color-error)]/10 mx-auto mt-4 max-w-md rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-error)]" />
              <p className="text-sm text-[var(--color-error)]">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 영역 */}
      <div className="border-t border-[var(--color-border)] p-4">
        <div className="mx-auto flex max-w-md gap-3">
          {error ? (
            <>
              <Button
                data-testid="retake-button"
                variant="outline"
                className="flex-1"
                onClick={handleRetake}
              >
                <Camera className="mr-2 h-4 w-4" />
                {texts.retakeButton}
              </Button>
              <Button
                data-testid="retry-button"
                className="flex-1 bg-[var(--color-primary)] text-white"
                onClick={handleAnalyze}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {texts.analyzeButton}
              </Button>
            </>
          ) : (
            <Button
              data-testid="analyze-button"
              className="w-full bg-[var(--color-primary)] text-white"
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {texts.analyzing}
                </>
              ) : (
                texts.analyzeButton
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 분석 페이지
 */
export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
        </div>
      }
    >
      <AnalyzeContent />
    </Suspense>
  );
}
