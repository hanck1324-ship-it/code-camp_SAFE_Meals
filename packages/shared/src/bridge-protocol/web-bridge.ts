// 웹에서 네이티브 브릿지 사용을 위한 훅 및 유틸리티

import { WebToNativeMessage, NativeToWebMessage } from './types';

// 전역 타입 확장
declare global {
  interface Window {
    SafeMealsBridge?: {
      postMessage: (message: WebToNativeMessage) => void;
      scanBarcode: () => void;
      navigate: (screen: string, params?: Record<string, unknown>) => void;
      showAlert: (title: string, message: string) => void;
      haptic: (type?: 'light' | 'medium' | 'heavy') => void;
      close: () => void;
    };
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    isNativeApp?: boolean;
  }
}

/**
 * 네이티브 앱 환경인지 확인
 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return window.isNativeApp === true || window.ReactNativeWebView !== undefined;
}

/**
 * 네이티브로 메시지 전송
 */
export function sendToNative(message: WebToNativeMessage): void {
  if (window.SafeMealsBridge) {
    window.SafeMealsBridge.postMessage(message);
  } else if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  } else {
    console.warn('Native bridge not available');
  }
}

/**
 * 네이티브에서 메시지 수신 리스너 등록
 */
export function addNativeMessageListener(
  handler: (message: NativeToWebMessage) => void
): () => void {
  const listener = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as NativeToWebMessage;
      handler(message);
    } catch {
      // JSON 파싱 실패는 무시
    }
  };

  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

/**
 * 네이티브 브릿지 준비 대기
 */
export function waitForNativeBridge(): Promise<void> {
  return new Promise((resolve) => {
    if (window.SafeMealsBridge) {
      resolve();
      return;
    }

    const handler = () => {
      window.removeEventListener('nativeBridgeReady', handler);
      resolve();
    };

    window.addEventListener('nativeBridgeReady', handler);

    // 타임아웃 (5초 후 resolve)
    setTimeout(resolve, 5000);
  });
}

// 편의 함수들
export const nativeBridge = {
  scanBarcode: () => sendToNative({ type: 'SCAN_BARCODE' }),
  
  navigate: (screen: string, params?: Record<string, unknown>) => 
    sendToNative({ type: 'NAVIGATE', payload: { screen, params } }),
  
  showAlert: (title: string, message: string) => 
    sendToNative({ type: 'SHOW_NATIVE_ALERT', payload: { title, message } }),
  
  showToast: (message: string, type?: 'success' | 'error' | 'info') =>
    sendToNative({ type: 'SHOW_TOAST', payload: { message, type } }),
  
  haptic: (type: 'light' | 'medium' | 'heavy' = 'medium') =>
    sendToNative({ type: 'HAPTIC_FEEDBACK', payload: { type } }),
  
  requestPermission: (permission: 'camera' | 'notifications' | 'location') =>
    sendToNative({ type: 'REQUEST_PERMISSION', payload: { permission } }),
  
  openSettings: () => sendToNative({ type: 'OPEN_SETTINGS' }),
  
  share: (title: string, message: string, url?: string) =>
    sendToNative({ type: 'SHARE', payload: { title, message, url } }),
  
  close: () => sendToNative({ type: 'CLOSE_WEBVIEW' }),
};
