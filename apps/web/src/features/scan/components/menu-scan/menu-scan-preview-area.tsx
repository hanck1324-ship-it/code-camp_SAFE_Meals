'use client';

/**
 * 메뉴 스캔 프리뷰 영역 컴포넌트
 * 크기: 375 x 400px
 *
 * 기능:
 * - 이미지 선택 전: 안내 문구 표시
 * - 이미지 선택 후: 선택된 이미지 미리보기
 * - 이미지 삭제/재선택 버튼
 * - 에러 메시지 표시
 */

import { ImageIcon, X, RotateCcw } from 'lucide-react';
import Image from 'next/image';

import { useMenuScan } from '@/features/scan/context';

export function MenuScanPreviewArea() {
  const {
    previewUrl,
    selectedImage,
    errorMessage,
    handleImageRemove,
    clearError,
  } = useMenuScan();

  return (
    <div className="relative flex h-[400px] w-[375px] flex-col items-center justify-center overflow-hidden border border-dashed border-gray-300 bg-white">
      {/* 에러 메시지 표시 */}
      {errorMessage && (
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{errorMessage}</p>
          <button
            type="button"
            onClick={clearError}
            className="text-red-400 transition-colors hover:text-red-600"
            aria-label="에러 메시지 닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 이미지가 있을 때 */}
      {previewUrl && selectedImage ? (
        <div className="relative h-full w-full">
          {/* 이미지 미리보기 */}
          <Image
            src={previewUrl}
            alt="선택된 메뉴 이미지"
            fill
            className="object-contain"
          />

          {/* 이미지 컨트롤 버튼 */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3">
            {/* 삭제 버튼 */}
            <button
              type="button"
              onClick={handleImageRemove}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white shadow-lg transition-colors hover:bg-red-600"
              aria-label="이미지 삭제"
            >
              <X className="h-4 w-4" />
              <span className="text-sm font-medium">삭제</span>
            </button>

            {/* 재선택 버튼 */}
            <button
              type="button"
              onClick={handleImageRemove}
              className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-white shadow-lg transition-colors hover:bg-gray-700"
              aria-label="이미지 재선택"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm font-medium">재선택</span>
            </button>
          </div>

          {/* 파일 정보 */}
          <div className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
            {selectedImage.name}
          </div>
        </div>
      ) : (
        /* 이미지 없을 때 플레이스홀더 */
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <ImageIcon className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            메뉴판을 촬영하거나 선택해주세요
          </p>
          <p className="text-xs text-gray-400">
            지원 형식: JPEG, PNG, WebP (최대 10MB)
          </p>
        </div>
      )}
    </div>
  );
}
