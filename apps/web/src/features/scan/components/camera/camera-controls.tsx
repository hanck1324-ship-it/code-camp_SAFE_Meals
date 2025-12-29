/**
 * 카메라 하단 컨트롤 컴포넌트
 * 
 * 디자인 참조: SafeMeals App Design/src/components/screens/camera-screen.tsx
 * - 플래시 토글 버튼 (왼쪽)
 * - 캡처 버튼 (중앙)
 * - 스페이서 (오른쪽, 레이아웃 균형)
 * 
 * 이벤트 버블링을 사용하여 부모 컴포넌트에서 클릭 이벤트를 처리합니다.
 */

import { Zap } from 'lucide-react';

interface CameraControlsProps {
  isProcessing: boolean;
  flashOn: boolean;
  onCapture?: () => void; // 직접 클릭 핸들러 (이벤트 버블링과 함께 사용)
  onToggleFlash?: () => void; // 플래시 토글 핸들러
}

export function CameraControls({
  isProcessing,
  flashOn,
  onCapture,
  onToggleFlash,
}: CameraControlsProps) {
  // 캡처 버튼 클릭 핸들러 - 이벤트 버블링과 함께 작동
  const handleCaptureClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 이벤트 버블링을 위해 기본 동작은 유지하되, 직접 핸들러도 호출
    if (onCapture && !isProcessing) {
      onCapture();
    }
    // 이벤트가 부모로 버블링되어 handleCaptureAreaClick도 실행됨
  };

  // 플래시 토글 핸들러
  const handleFlashClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // 부모로 버블링 방지
    if (onToggleFlash && !isProcessing) {
      onToggleFlash();
    }
  };

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 p-8 pb-12" 
      style={{ 
        zIndex: 100, 
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: '80px', // 하단 네비게이션 높이(80px) 고려
        pointerEvents: 'none' // 컨테이너는 클릭 통과
      }}
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* 플래시 토글 버튼 (왼쪽) */}
        <button
          data-action="flash"
          data-testid="flash-button"
          disabled={isProcessing}
          onClick={handleFlashClick}
          className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
            flashOn 
              ? 'bg-white/30 hover:bg-white/40' 
              : 'bg-white/10 hover:bg-white/20'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          style={{ 
            pointerEvents: 'auto', // 버튼은 클릭 가능
            cursor: isProcessing ? 'not-allowed' : 'pointer'
          }}
        >
          <Zap 
            className={`w-6 h-6 ${flashOn ? 'text-yellow-300' : 'text-white'}`} 
          />
        </button>

        {/* 캡처 버튼 (중앙) - 이벤트 버블링으로 처리 */}
        <button
          data-action="capture"
          data-testid="capture-button"
          disabled={isProcessing}
          onClick={handleCaptureClick}
          className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ 
            pointerEvents: 'auto', // 버튼은 클릭 가능
            cursor: isProcessing ? 'not-allowed' : 'pointer'
          }}
        >
          {/* 외부 흰색 원 (디자인 참조) */}
          <div className="absolute inset-0 rounded-full bg-white" />
          {/* 내부 그라데이션 원 */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60] pointer-events-none" />
        </button>

        {/* 스페이서 (오른쪽, 레이아웃 균형) */}
        <div className="w-12" />
      </div>
    </div>
  );
}

