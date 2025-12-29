/**
 * 카메라 화면 헤더 컴포넌트
 */

import { X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface CameraHeaderProps {
  onClose: () => void;
}

export function CameraHeader({ onClose }: CameraHeaderProps) {
  const { t } = useTranslation();

  return (
    <div 
      className="absolute top-0 left-0 right-0 p-6 pointer-events-none"
      style={{ 
        zIndex: 50, 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0
      }}
    >
      {/* 배경 그라데이션 - pointer-events-none으로 클릭 통과 */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent pointer-events-none"
        style={{ zIndex: 1 }}
      />
      {/* 헤더 컨텐츠 - pointer-events-auto로 클릭 가능 */}
      <div 
        className="relative flex items-center justify-between pointer-events-auto"
        style={{ zIndex: 2, position: 'relative' }}
      >
        <div>
          <h2 className="text-white mb-1 font-semibold drop-shadow-lg">{t.scanTitle}</h2>
          <p className="text-white/90 text-sm drop-shadow-md">{t.scanSubtitle}</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-colors shadow-lg"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}

