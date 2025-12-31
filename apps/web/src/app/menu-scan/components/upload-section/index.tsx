'use client';

/**
 * 메뉴 스캔 업로드 섹션 컴포넌트
 *
 * 모바일 최적화된 이미지 업로드 UI를 제공합니다.
 *
 * 기능:
 * 1. camera-button 영역: 카메라 촬영 버튼, 갤러리 선택 버튼
 * 2. preview-area 영역: 이미지 미리보기, 삭제/재선택 버튼
 * 3. process-button 영역: OCR 분석 시작 버튼 (이미지 선택 후 활성화)
 *
 * 파일 입력 처리 조건:
 * - 허용 파일 형식: image/jpeg, image/png, image/webp
 * - 최대 파일 크기: 10MB
 */

import { MenuScanCameraButton } from '@/features/scan/components/menu-scan/menu-scan-camera-button';
import { MenuScanPreviewArea } from '@/features/scan/components/menu-scan/menu-scan-preview-area';
import { MenuScanProcessButton } from '@/features/scan/components/menu-scan/menu-scan-process-button';
import { MenuScanProvider } from '@/features/scan/context';

interface UploadSectionProps {
  /**
   * OCR 분석 완료 시 호출되는 콜백
   */
  onAnalyzeComplete?: (result: unknown) => void;
}

export function UploadSection({ onAnalyzeComplete }: UploadSectionProps) {
  return (
    <MenuScanProvider>
      <div className="flex w-full flex-col items-center bg-gray-100">
        {/* Camera Button: 375 x 80 */}
        <MenuScanCameraButton />

        {/* Gap: 10px */}
        <div className="h-[10px] w-full" />

        {/* Preview Area: 375 x 400 */}
        <MenuScanPreviewArea />

        {/* Gap: 10px */}
        <div className="h-[10px] w-full" />

        {/* Process Button: 375 x 60 */}
        <MenuScanProcessButton />
      </div>
    </MenuScanProvider>
  );
}

export default UploadSection;
