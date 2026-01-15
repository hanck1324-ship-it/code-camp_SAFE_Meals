'use client';

/**
 * 메뉴 스캔 처리 버튼 컴포넌트
 * 크기: 375 x 60px
 *
 * 기능:
 * - 이미지 선택 전: 비활성화 상태
 * - 이미지 선택 후: 활성화
 * - OCR 분석 시작 버튼
 */

import { Scan } from 'lucide-react';

import { useMenuScan } from '@/features/scan/context';

export function MenuScanProcessButton() {
  const { selectedImage } = useMenuScan();

  const isDisabled = !selectedImage;

  const handleAnalyze = () => {
    if (!selectedImage) return;
    // TODO: OCR 분석 로직 구현
    console.log('OCR 분석 시작:', selectedImage.name);
  };

  return (
    <div className="flex h-[60px] w-[375px] items-center justify-center bg-white px-4">
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={isDisabled}
        className="flex h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#2ECC71] font-medium text-white transition-colors hover:bg-[#27AE60] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
      >
        <Scan className="h-5 w-5" />
        <span>메뉴 분석하기</span>
      </button>
    </div>
  );
}
