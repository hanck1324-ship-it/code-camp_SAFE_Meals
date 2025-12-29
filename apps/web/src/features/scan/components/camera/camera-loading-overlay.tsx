/**
 * 분석 중 로딩 오버레이 컴포넌트
 */

import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface CameraLoadingOverlayProps {
  isProcessing: boolean;
}

export function CameraLoadingOverlay({ isProcessing }: CameraLoadingOverlayProps) {
  const { t } = useTranslation();

  if (!isProcessing) return null;

  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white"
      style={{ 
        zIndex: 200, 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <Loader2 className="h-12 w-12 animate-spin mb-4 text-[#2ECC71]" />
      <p className="text-lg font-semibold">{t.scanning || '스캔 중...'}</p>
      <p className="text-sm text-white/70 mt-2">{t.analyzingMenu || '메뉴를 분석하고 있습니다...'}</p>
    </div>
  );
}

