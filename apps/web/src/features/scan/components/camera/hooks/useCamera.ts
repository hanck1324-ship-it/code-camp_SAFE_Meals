/**
 * 카메라 스트림 관리 및 이미지 캡처 로직을 담당하는 커스텀 훅
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { UseCameraReturn, FacingMode } from '../types';

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');

  // 카메라 시작 함수
  const startCamera = useCallback(async () => {
    // 기존 스트림 정리
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsStreaming(true);
          videoRef.current?.play();
        };
      }
      setHasPermission(true);
    } catch (err) {
      console.error('Camera Error:', err);
      setHasPermission(false);
    }
  }, [facingMode]);

  // 카메라 초기화 및 cleanup
  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera, capturedImage]);

  // 플래시 제어
  const toggleFlash = async () => {
    if (!streamRef.current) return;
    
    const videoTrack = streamRef.current.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();

    // @ts-ignore: torch 지원 여부 확인
    if (!capabilities.torch) {
      return;
    }

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: !flashOn } as any],
      });
      setFlashOn(!flashOn);
    } catch (err) {
      setFlashOn(!flashOn);
    }
  };

  // 사진 촬영
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageSrc);
    
    // 촬영 후 배터리 절약을 위해 카메라 잠시 끄기
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // 다시 촬영 (카메라 재시작)
  const handleRetake = () => {
    setCapturedImage(null);
    setIsStreaming(false);
  };

  return {
    videoRef,
    canvasRef,
    capturedImage,
    flashOn,
    hasPermission,
    isStreaming,
    facingMode,
    handleCapture,
    handleRetake,
    toggleFlash,
  };
}

