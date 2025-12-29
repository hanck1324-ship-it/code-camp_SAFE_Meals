'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { RequireAuth } from '@/components/auth/require-auth';
import { CameraScreen } from '@/features/scan/components/camera-view';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
// 브릿지 프로토콜 직접 구현 (shared 패키지 경로 문제 해결)
declare global {
  interface Window {
    SafeMealsBridge?: {
      postMessage: (message: any) => void;
    };
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    isNativeApp?: boolean;
  }
}

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isNativeApp === true || window.ReactNativeWebView !== undefined;
}

function waitForNativeBridge(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.SafeMealsBridge) {
      resolve();
      return;
    }
    if (typeof window !== 'undefined') {
      const handler = () => {
        window.removeEventListener('nativeBridgeReady', handler);
        resolve();
      };
      window.addEventListener('nativeBridgeReady', handler);
      setTimeout(resolve, 5000);
    } else {
      resolve();
    }
  });
}

function addNativeMessageListener(handler: (message: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const listener = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      handler(message);
    } catch {
      // JSON 파싱 실패는 무시
    }
  };

  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

export default function ScanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = useLanguageStore((state) => state.language);
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNative, setIsNative] = useState(false);

  // 네이티브 앱인지 확인 및 네이티브 카메라로 리다이렉트
  useEffect(() => {
    const checkNativeAndRedirect = async () => {
      if (isNativeApp()) {
        setIsNative(true);
        await waitForNativeBridge();
        
        // 네이티브 카메라 열기
        if (typeof window !== 'undefined' && window.SafeMealsBridge) {
          window.SafeMealsBridge.postMessage({ type: 'SCAN_OCR' });
        }
      }
    };

    checkNativeAndRedirect();
  }, []);

  // 네이티브에서 촬영한 이미지 수신
  useEffect(() => {
    if (!isNative) return;

    const unsubscribe = addNativeMessageListener((message: any) => {
      if (message.type === 'CAMERA_IMAGE' && message.payload) {
        const { imageData } = message.payload;
        if (imageData) {
          // 촬영한 이미지로 OCR 처리
          handleCapturePhoto(imageData);
        }
      }
    });

    return unsubscribe;
  }, [isNative]);

  // 1. 이미지를 서버로 전송하고 분석하는 함수
  const handleCapturePhoto = async (imageData: string) => {
    // 연속 클릭 방지
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // 전체 Data URL을 그대로 전송 (서버에서 MIME 타입 추출)
      // 모바일 브라우저 호환성을 위해 헤더 포함하여 전송
      const imageToSend = imageData;

      // API 호출
      const response = await fetch('/api/scan/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageToSend,
          language: language,
        }),
      });

      // HTTP 에러 체크
      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '스캔 분석에 실패했습니다.');
      }

      // 2. 분석 결과를 sessionStorage에 저장
      const scanKey = `scan_${Date.now()}`;
      const imageKey = `image_${Date.now()}`;
      
      sessionStorage.setItem(scanKey, JSON.stringify(result));
      sessionStorage.setItem(imageKey, imageData);

      // 3. 결과 페이지로 이동
      router.push(`/scan/result?key=${scanKey}&imageKey=${imageKey}`);
    } catch (error: any) {
      console.error('스캔 분석 오류:', error);
      
      // 사용자 친화적인 에러 메시지
      const errorMessage = error.message || '스캔 분석에 실패했습니다. 다시 시도해주세요.';
      toast.error(errorMessage, {
        duration: 4000,
      });
      
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // 처리 중일 때는 닫기 방지
    if (isProcessing) {
      toast.info('분석이 진행 중입니다. 잠시만 기다려주세요.');
      return;
    }
    router.back();
  };

  // 네이티브 앱에서는 카메라 화면을 표시하지 않음 (네이티브 카메라 사용)
  if (isNative) {
    return (
      <RequireAuth>
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="text-center text-white">
            <p className="text-lg mb-4">카메라를 준비하고 있습니다...</p>
            <p className="text-sm text-gray-400">네이티브 카메라가 열립니다</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <CameraScreen
        onClose={handleClose}
        onCapturePhoto={handleCapturePhoto}
        isProcessing={isProcessing}
      />
    </RequireAuth>
  );
}
