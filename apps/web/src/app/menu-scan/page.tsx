'use client';

/**
 * 메뉴 스캔 페이지 와이어프레임
 *
 * 레이아웃 구조:
 * - header: 375 x 60px
 * - gap: 10px
 * - camera-button: 375 x 80px
 * - gap: 10px
 * - preview-area: 375 x 400px
 * - gap: 10px
 * - process-button: 375 x 60px
 * - gap: 10px
 * - result-area: 375 x 300px
 */

import { MenuScanHeader } from '@/features/scan/components/menu-scan/menu-scan-header';
import { MenuScanCameraButton } from '@/features/scan/components/menu-scan/menu-scan-camera-button';
import { MenuScanPreviewArea } from '@/features/scan/components/menu-scan/menu-scan-preview-area';
import { MenuScanProcessButton } from '@/features/scan/components/menu-scan/menu-scan-process-button';
import { MenuScanResultArea } from '@/features/scan/components/menu-scan/menu-scan-result-area';
import { MenuScanProvider } from '@/features/scan/context';

export default function MenuScanPage() {
  return (
    <MenuScanProvider>
      <div className="mx-auto flex w-[375px] flex-col items-center bg-gray-100">
        {/* Header: 375 x 60 */}
        <MenuScanHeader />

        {/* Gap: 10px */}
        <div className="h-[10px] w-full" />

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

        {/* Gap: 10px */}
        <div className="h-[10px] w-full" />

        {/* Result Area: 375 x 300 */}
        <MenuScanResultArea />
      </div>
    </MenuScanProvider>
  );
}
