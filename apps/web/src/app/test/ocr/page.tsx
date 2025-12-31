'use client';

import { useState, useRef } from 'react';
import { useOCR } from '@/features/scan/components/menu-scan/hooks/useOCR.hook';

/**
 * OCR 훅 테스트 페이지
 * Playwright 테스트를 위한 UI 컴포넌트
 */
export default function OCRTestPage() {
  const { results, fullText, isLoading, error, extractText, retry, reset } =
    useOCR();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageBlob(file);
    }
  };

  const handleExtractText = async () => {
    if (imageBlob) {
      setHasAttempted(true);
      await extractText(imageBlob);
    }
  };

  const handleRetry = async () => {
    setHasAttempted(true);
    await retry();
  };

  const handleReset = () => {
    reset();
    setSelectedFile(null);
    setImageBlob(null);
    setHasAttempted(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 현재 훅 상태를 JSON으로 직렬화
  const hookState = {
    results,
    fullText,
    isLoading,
    error,
  };

  // OCR 처리 완료 여부 (로딩이 끝나고 시도한 적이 있으며 에러가 없는 경우)
  const isOCRComplete = hasAttempted && !isLoading && !error;

  return (
    <div
      data-testid="ocr-test-page"
      className="flex min-h-screen flex-col gap-4 p-8"
    >
      <h1 className="text-2xl font-bold">OCR 테스트 페이지</h1>

      {/* 훅 상태 표시 */}
      <div
        data-testid="hook-state"
        className="whitespace-pre-wrap break-all rounded bg-gray-100 p-4"
      >
        {JSON.stringify(hookState)}
      </div>

      {/* 로딩 중 표시 */}
      {isLoading && (
        <div data-testid="is-loading" className="text-blue-500">
          OCR 처리 중...
        </div>
      )}

      {/* OCR 완료 표시 */}
      {isOCRComplete && (
        <div data-testid="ocr-complete" className="text-green-500">
          {results.length > 0 || fullText !== ''
            ? 'OCR 완료'
            : '텍스트를 찾을 수 없습니다'}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div data-testid="ocr-error" className="text-red-500">
          {error}
        </div>
      )}

      {/* fullText 표시 */}
      {fullText && (
        <div data-testid="full-text" className="rounded bg-blue-100 p-4">
          <h3 className="font-semibold">추출된 전체 텍스트:</h3>
          <p className="whitespace-pre-wrap">{fullText}</p>
        </div>
      )}

      {/* 개별 결과 표시 */}
      {results.length > 0 && (
        <div data-testid="ocr-results" className="rounded bg-green-100 p-4">
          <h3 className="font-semibold">개별 OCR 결과:</h3>
          <ul className="list-disc pl-5">
            {results.map((result, index) => (
              <li key={index} className="mb-2">
                <span className="font-medium">{result.text}</span>
                <span className="ml-2 text-sm text-gray-500">
                  (신뢰도: {(result.confidence * 100).toFixed(1)}%, 위치: [
                  {result.boundingBox.x}, {result.boundingBox.y}] 크기:{' '}
                  {result.boundingBox.width}x{result.boundingBox.height})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 파일 입력 */}
      <div className="flex flex-col gap-2">
        <label htmlFor="image-input">이미지 선택:</label>
        <input
          ref={fileInputRef}
          id="image-input"
          data-testid="image-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />
      </div>

      {/* extractText 버튼 */}
      <button
        data-testid="extract-text-button"
        onClick={handleExtractText}
        disabled={!imageBlob || isLoading}
        className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        텍스트 추출
      </button>

      {/* retry 버튼 */}
      <button
        data-testid="retry-button"
        onClick={handleRetry}
        disabled={isLoading || !error}
        className="rounded bg-yellow-500 px-4 py-2 text-white disabled:opacity-50"
      >
        재시도
      </button>

      {/* reset 버튼 */}
      <button
        data-testid="reset-button"
        onClick={handleReset}
        disabled={isLoading}
        className="rounded bg-gray-500 px-4 py-2 text-white disabled:opacity-50"
      >
        초기화
      </button>
    </div>
  );
}
