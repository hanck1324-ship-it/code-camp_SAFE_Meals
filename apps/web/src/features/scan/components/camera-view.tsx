'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { ImagePreview } from './image-preview';
import { useCamera } from './camera/hooks/useCamera';
import { CameraLoadingOverlay } from './camera/camera-loading-overlay';
import { CameraPermissionError } from './camera/camera-permission-error';
import { CameraVideoView } from './camera/camera-video-view';
import { CameraHeader } from './camera/camera-header';
import { ScanningFrame } from './camera/scanning-frame';
import { CameraControls } from './camera/camera-controls';
import { AnalyzeConfirmDialog } from './camera/analyze-confirm-dialog';
import type { CameraScreenProps } from './camera/types';

/**
 * Expo Camera 연동 가이드:
 * 
 * 1. 패키지 설치:
 *    npx expo install expo-camera
 * 
 * 2. 필요한 import (Expo에서):
 *    import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
 *    import * as FileSystem from 'expo-file-system';
 * 
 * 3. 권한 요청:
 *    const [permission, requestPermission] = useCameraPermissions();
 * 
 * 4. 카메라 타입:
 *    const [facing, setFacing] = useState<CameraType>('back');
 * 
 * 5. 플래시 모드:
 *    const [flash, setFlash] = useState<'on' | 'off' | 'auto'>('off');
 */

export function CameraScreen({
  onClose,
  onCapturePhoto,
  isProcessing = false,
}: CameraScreenProps) {
  const { language } = useTranslation();
  const [showAnalyzeDialog, setShowAnalyzeDialog] = useState(false);
  
  // 카메라 로직 훅
  const {
    videoRef,
    canvasRef,
    capturedImage,
    flashOn,
    hasPermission,
    isStreaming,
    handleCapture,
    handleRetake,
    toggleFlash,
  } = useCamera();

  // 사진 확정 - 모달 표시
  const handleConfirm = () => {
    if (capturedImage) {
      setShowAnalyzeDialog(true); // 모달 표시
    }
  };

  // 모달에서 확인 시 API 호출
  const handleAnalyzeConfirm = () => {
    setShowAnalyzeDialog(false);
    if (capturedImage) {
      onCapturePhoto(capturedImage); // 실제 API 호출
    }
  };

  // 이벤트 버블링을 사용한 카메라 버튼 클릭 처리
  const handleCaptureAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 처리 중이면 무시
    if (isProcessing) return;

    const target = e.target as HTMLElement;
    
    // 촬영 버튼 클릭 확인 (data-action="capture" 또는 버튼 내부 요소)
    const captureButton = target.closest('[data-action="capture"]');
    
    if (captureButton) {
      // 이벤트 버블링으로 인해 이미 handleCaptureClick에서 처리되었을 수 있음
      // 중복 실행 방지를 위해 stopPropagation만 호출
      e.stopPropagation();
      // handleCapture는 버튼의 onClick에서 이미 호출됨
    }
    
    // 플래시 버튼은 별도 처리 (이미 stopPropagation 호출됨)
    const flashButton = target.closest('[data-action="flash"]');
    if (flashButton) {
      e.stopPropagation();
    }
  }, [isProcessing]);

  return (
    <div 
      className="relative min-h-screen bg-black overflow-hidden"
      onClick={handleCaptureAreaClick}
      style={{ position: 'relative', isolation: 'isolate' }}
    >
      {/* 🔄 로딩 오버레이 - 분석 중일 때 표시 (z-index: 200) */}
      <CameraLoadingOverlay isProcessing={isProcessing} />

      {/* 📸 카메라 비디오 - 가장 아래 레이어 (z-index: 1) */}
      {!capturedImage && (
        <div 
          className="absolute inset-0" 
          style={{ 
            zIndex: 1, 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <CameraVideoView
            videoRef={videoRef}
            isStreaming={isStreaming}
            hasPermission={hasPermission}
            PermissionErrorComponent={CameraPermissionError}
          />
        </div>
      )}

      {/* 🖼️ 미리보기 영역 (촬영 후 표시) */}
      {capturedImage && (
        <ImagePreview
          imageSrc={capturedImage}
          language={language}
          onRetake={handleRetake}
          onConfirm={handleConfirm}
          onClose={onClose}
        />
      )}

      {/* Header */}
      {!capturedImage && <CameraHeader onClose={onClose} />}

      {/* Scanning Frame */}
      {!capturedImage && <ScanningFrame />}

      {/* Bottom Controls - 이벤트 버블링으로 촬영 버튼 클릭 처리 */}
      {!capturedImage && (
        <CameraControls
          isProcessing={isProcessing}
          flashOn={flashOn}
          onCapture={handleCapture}
          onToggleFlash={toggleFlash}
        />
      )}

      {/* Hidden Canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 확인 모달 */}
      <AnalyzeConfirmDialog
        open={showAnalyzeDialog}
        onOpenChange={setShowAnalyzeDialog}
        imageSrc={capturedImage}
        onConfirm={handleAnalyzeConfirm}
      />
    </div>
  );
}
