// 웹뷰 ↔ 네이티브 브릿지 메시지 타입 정의

// 네이티브 → 웹뷰 메시지
export type NativeToWebMessage =
  | { type: 'SCAN_RESULT'; payload: { barcode: string; format: string } }
  | { type: 'USER_TOKEN'; payload: { token: string | null } }
  | { type: 'NAVIGATION_READY'; payload?: never }
  | { type: 'PUSH_TOKEN'; payload: { token: string } }
  | { type: 'LOCATION'; payload: { latitude: number; longitude: number } }
  | { type: 'THEME_CHANGED'; payload: { theme: 'light' | 'dark' } };

// 웹뷰 → 네이티브 메시지
export type WebToNativeMessage =
  | { type: 'SCAN_BARCODE'; payload?: never }
  | { type: 'SCAN_OCR'; payload?: never }
  | { type: 'NAVIGATE'; payload: { screen: string; params?: Record<string, unknown> } }
  | { type: 'GET_USER_TOKEN'; payload?: never }
  | { type: 'SHOW_NATIVE_ALERT'; payload: { title: string; message: string } }
  | { type: 'SHOW_TOAST'; payload: { message: string; type?: 'success' | 'error' | 'info' } }
  | { type: 'HAPTIC_FEEDBACK'; payload: { type: 'light' | 'medium' | 'heavy' } }
  | { type: 'REQUEST_PERMISSION'; payload: { permission: 'camera' | 'notifications' | 'location' } }
  | { type: 'OPEN_SETTINGS'; payload?: never }
  | { type: 'SHARE'; payload: { title: string; message: string; url?: string } }
  | { type: 'CLOSE_WEBVIEW'; payload?: never };

// 브릿지 메시지 통합 타입
export type BridgeMessage = NativeToWebMessage | WebToNativeMessage;

// 화면 타입 정의
export type NativeScreen = 
  | 'Splash'
  | 'Camera'
  | 'Settings'
  | 'Notifications';

export type WebViewScreen =
  | 'Dashboard'
  | 'Onboarding'
  | 'OnboardingAllergy'
  | 'OnboardingDiet'
  | 'Profile'
  | 'ScanResult'
  | 'SafetyCard'
  | 'Help'
  | 'Language';

export type AppScreen = NativeScreen | WebViewScreen;

// 웹뷰 URL 매핑
export const WEBVIEW_ROUTES: Record<WebViewScreen, string> = {
  Dashboard: '/',
  Onboarding: '/onboarding',
  OnboardingAllergy: '/onboarding/allergy',
  OnboardingDiet: '/onboarding/diet',
  Profile: '/profile',
  ScanResult: '/scan/result',
  SafetyCard: '/profile/safety-card',
  Help: '/profile/help',
  Language: '/profile/language',
};
