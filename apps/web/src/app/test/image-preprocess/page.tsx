'use client';

import { useState, useRef } from 'react';

import { useImagePreprocess } from '@/features/scan/components/menu-scan/hooks/useImagePreprocess.hook';

/**
 * 이미지 전처리 훅 테스트 페이지
 * Playwright 테스트를 위한 UI 컴포넌트
 */
export default function ImagePreprocessTestPage() {
  const {
    preprocessedImage,
    base64,
    isProcessing,
    error,
    dimensions,
    originalPreserved,
    processImage,
    rotate,
    crop,
    autoCrop,
    adjustContrast,
    optimizeForOCR,
  } = useImagePreprocess();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropArea, setCropArea] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [contrastValue, setContrastValue] = useState(1.0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleProcessImage = async () => {
    if (selectedFile) {
      await processImage(selectedFile);
    }
  };

  const handleRotate = async () => {
    await rotate(90);
  };

  const handleCrop = async () => {
    await crop(cropArea);
  };

  const handleAutoCrop = async () => {
    await autoCrop();
  };

  const handleAdjustContrast = async () => {
    await adjustContrast(contrastValue);
  };

  const handleOptimizeOCR = async () => {
    await optimizeForOCR();
  };

  // 현재 훅 상태를 JSON으로 직렬화
  const hookState = {
    preprocessedImage: preprocessedImage ? 'Blob' : null,
    base64,
    isProcessing,
    error,
  };

  return (
    <div
      data-testid="image-preprocess-test-page"
      className="flex min-h-screen flex-col gap-4 p-8"
    >
      <h1 className="text-2xl font-bold">이미지 전처리 테스트 페이지</h1>

      {/* 훅 상태 표시 */}
      <div data-testid="hook-state" className="rounded bg-gray-100 p-4">
        {JSON.stringify(hookState)}
      </div>

      {/* 처리 중 표시 */}
      {isProcessing && (
        <div data-testid="is-processing" className="text-blue-500">
          처리 중...
        </div>
      )}

      {/* 처리 완료 표시 */}
      {!isProcessing && preprocessedImage && (
        <div data-testid="processing-complete" className="text-green-500">
          처리 완료
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div data-testid="error-message" className="text-red-500">
          {error}
        </div>
      )}

      {/* 이미지 차원 */}
      {dimensions && (
        <div data-testid="image-dimensions" className="text-sm text-gray-600">
          {JSON.stringify(dimensions)}
        </div>
      )}

      {/* 원본 보존 상태 */}
      <div data-testid="original-preserved" className="hidden">
        {String(originalPreserved)}
      </div>

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

      {/* 이미지 처리 버튼 */}
      <button
        data-testid="process-image-button"
        onClick={handleProcessImage}
        disabled={!selectedFile || isProcessing}
        className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        이미지 처리
      </button>

      {/* 회전 버튼 */}
      <button
        data-testid="rotate-button"
        onClick={handleRotate}
        disabled={!preprocessedImage || isProcessing}
        className="rounded bg-green-500 px-4 py-2 text-white disabled:opacity-50"
      >
        90도 회전
      </button>

      {/* 크롭 영역 입력 */}
      <div className="flex gap-2">
        <input
          data-testid="crop-x"
          type="number"
          value={cropArea.x}
          onChange={(e) =>
            setCropArea({ ...cropArea, x: Number(e.target.value) })
          }
          placeholder="X"
          className="w-20 rounded border p-2"
        />
        <input
          data-testid="crop-y"
          type="number"
          value={cropArea.y}
          onChange={(e) =>
            setCropArea({ ...cropArea, y: Number(e.target.value) })
          }
          placeholder="Y"
          className="w-20 rounded border p-2"
        />
        <input
          data-testid="crop-width"
          type="number"
          value={cropArea.width}
          onChange={(e) =>
            setCropArea({ ...cropArea, width: Number(e.target.value) })
          }
          placeholder="Width"
          className="w-20 rounded border p-2"
        />
        <input
          data-testid="crop-height"
          type="number"
          value={cropArea.height}
          onChange={(e) =>
            setCropArea({ ...cropArea, height: Number(e.target.value) })
          }
          placeholder="Height"
          className="w-20 rounded border p-2"
        />
      </div>

      {/* 크롭 버튼 */}
      <button
        data-testid="crop-button"
        onClick={handleCrop}
        disabled={!preprocessedImage || isProcessing}
        className="rounded bg-yellow-500 px-4 py-2 text-white disabled:opacity-50"
      >
        크롭
      </button>

      {/* 자동 크롭 버튼 */}
      <button
        data-testid="auto-crop-button"
        onClick={handleAutoCrop}
        disabled={!preprocessedImage || isProcessing}
        className="rounded bg-orange-500 px-4 py-2 text-white disabled:opacity-50"
      >
        자동 크롭
      </button>

      {/* 대비 조정 */}
      <div className="flex gap-2">
        <input
          data-testid="contrast-value"
          type="number"
          step="0.1"
          value={contrastValue}
          onChange={(e) => setContrastValue(Number(e.target.value))}
          className="w-20 rounded border p-2"
        />
        <button
          data-testid="adjust-contrast-button"
          onClick={handleAdjustContrast}
          disabled={!preprocessedImage || isProcessing}
          className="rounded bg-purple-500 px-4 py-2 text-white disabled:opacity-50"
        >
          대비 조정
        </button>
      </div>

      {/* OCR 최적화 버튼 */}
      <button
        data-testid="optimize-ocr-button"
        onClick={handleOptimizeOCR}
        disabled={!preprocessedImage || isProcessing}
        className="rounded bg-indigo-500 px-4 py-2 text-white disabled:opacity-50"
      >
        OCR 최적화
      </button>

      {/* 미리보기 */}
      {base64 && (
        <div className="mt-4">
          <h2 className="mb-2 text-lg font-semibold">미리보기:</h2>
          <img
            src={base64}
            alt="전처리된 이미지"
            className="max-h-96 rounded border"
          />
        </div>
      )}
    </div>
  );
}
