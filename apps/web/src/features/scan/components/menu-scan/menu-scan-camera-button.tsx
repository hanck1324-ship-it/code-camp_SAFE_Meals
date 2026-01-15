'use client';

/**
 * 메뉴 스캔 카메라 버튼 컴포넌트
 * 크기: 375 x 80px
 *
 * 기능:
 * - 카메라 촬영 버튼 (capture="environment")
 * - 갤러리 선택 버튼
 * - 파일 형식 검증: JPEG, PNG, WebP
 * - 파일 크기 제한: 10MB
 */

import { Camera, ImageIcon } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';

import { useMenuScan } from '@/features/scan/context';

/**
 * 허용된 파일 형식
 */
const ACCEPT_FILE_TYPES = 'image/jpeg,image/png,image/webp';

export function MenuScanCameraButton() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { handleImageSelect } = useMenuScan();

  /**
   * 카메라 버튼 클릭 핸들러
   */
  const handleCameraClick = () => {
    // 앱 환경에서는 네이티브 카메라 호출 (셔터음 없음)
    if (typeof window !== 'undefined' && (window as any).SafeMealsBridge) {
      console.log('✅ 앱 환경 감지 - 네이티브 카메라 호출');
      (window as any).SafeMealsBridge.scanMenu();
      return;
    }

    // 웹 환경에서는 input 카메라 사용
    console.log('⚠️ 웹 환경 - input 카메라 사용 (셔터음 발생)');
    cameraInputRef.current?.click();
  };

  /**
   * 갤러리 버튼 클릭 핸들러
   */
  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  /**
   * 파일 선택 핸들러
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
    // input 초기화 (같은 파일 다시 선택 가능하도록)
    event.target.value = '';
  };

  return (
    <div className="flex h-[80px] w-[375px] items-center justify-center gap-4 bg-white px-4">
      {/* 숨겨진 카메라 입력 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPT_FILE_TYPES}
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        aria-label="카메라로 촬영"
      />

      {/* 숨겨진 갤러리 입력 */}
      <input
        ref={galleryInputRef}
        type="file"
        accept={ACCEPT_FILE_TYPES}
        className="hidden"
        onChange={handleFileChange}
        aria-label="갤러리에서 선택"
      />

      {/* 카메라 버튼 */}
      <button
        type="button"
        onClick={handleCameraClick}
        className="flex h-[56px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#2ECC71] text-white transition-colors hover:bg-[#27AE60]"
      >
        <Camera className="h-5 w-5" />
        <span className="font-medium">카메라 촬영</span>
      </button>

      {/* 갤러리 버튼 */}
      <button
        type="button"
        onClick={handleGalleryClick}
        className="flex h-[56px] flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
      >
        <ImageIcon className="h-5 w-5" />
        <span className="font-medium">갤러리 선택</span>
      </button>
    </div>
  );
}
