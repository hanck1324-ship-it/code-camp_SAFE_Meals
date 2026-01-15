import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { getSupabaseAuthStorageKey } from '@/lib/supabase';

import type { WebViewMessageEvent } from 'react-native-webview';

interface WebViewScreenProps {
  path: string;
  showHeader?: boolean;
}

/**
 * WebView Base URL 결정 우선순위:
 * 1. 환경변수 (EXPO_PUBLIC_WEB_URL)
 * 2. app.json의 extra.webviewUrl
 * 3. __DEV__ 모드:
 *    - iOS 시뮬레이터: localhost
 *    - Android 에뮬레이터: 10.0.2.2
 *    - 실제 디바이스: debuggerHost에서 IP 추출
 * 4. 프로덕션: 배포된 웹 URL
 */
const resolveWebviewBaseUrl = (): string => {
  // 1. 환경변수 우선 (가장 유연함)
  const envUrl = process.env.EXPO_PUBLIC_WEB_URL;
  if (envUrl) {
    return envUrl;
  }

  // 2. app.json의 extra.webviewUrl
  const extra = Constants.expoConfig?.extra as
    | { webviewUrl?: string }
    | undefined;
  if (extra?.webviewUrl) {
    return extra.webviewUrl;
  }

  // 3. 개발 모드일 때 자동 감지
  if (__DEV__) {
    // iOS 시뮬레이터
    if (Platform.OS === 'ios') {
      return 'http://localhost:3000';
    }

    // Android
    if (Platform.OS === 'android') {
      // 실제 디바이스인 경우 debuggerHost에서 IP 추출
      const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
      if (debuggerHost && !debuggerHost.includes('localhost')) {
        return `http://${debuggerHost}:3000`;
      }
      // 에뮬레이터
      return 'http://10.0.2.2:3000';
    }
  }

  // 4. 프로덕션 fallback
  return 'https://your-production-domain.com';
};

const WEBVIEW_BASE_URL = resolveWebviewBaseUrl();

// 디버깅용 로그
if (__DEV__) {
  console.log('[WebView] Base URL:', WEBVIEW_BASE_URL);
  console.log('[WebView] Platform:', Platform.OS);
  console.log('[WebView] debuggerHost:', Constants.expoConfig?.hostUri);
}

export default function WebViewScreen({
  path,
  showHeader = false,
}: WebViewScreenProps) {
  const webViewRef = useRef<WebView>(null);
  const params = useLocalSearchParams();
  const [pendingImageData, setPendingImageData] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [savedLanguage, setSavedLanguage] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [supabaseSession, setSupabaseSession] = useState<string | null>(null);
  const [isAuthSessionLoaded, setIsAuthSessionLoaded] = useState(false);

  // ✅ 동적 리다이렉트 URL 생성 (IP가 바뀌어도 자동으로 현재 Expo 환경에 맞는 URL 생성)
  const appRedirectUrl = Linking.createURL('/');

  // URL 쿼리 파라미터 추가
  const queryString = Object.keys(params)
    .filter((key) => key !== 'path' && key !== 'hasImage')
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`
    )
    // 웹에게 돌아올 주소를 알려줌 (예: &app_redirect_url=exp+safemeals://...)
    .concat(`app_redirect_url=${encodeURIComponent(appRedirectUrl)}`)
    .join('&');

  const url = `${WEBVIEW_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;
  const supabaseStorageKey = getSupabaseAuthStorageKey();
  const safeAreaEdges: Array<'top'> = ['top'];

  // AsyncStorage에서 저장된 언어 로드
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const lang = await AsyncStorage.getItem('app_language');
        setSavedLanguage(lang);
        console.log('[WebViewScreen] 저장된 언어:', lang);
      } catch (error) {
        console.error('언어 로드 실패:', error);
      }
    };
    loadSavedLanguage();
  }, []);

  // AsyncStorage에서 이미지 데이터 로드
  useEffect(() => {
    const loadPendingImage = async () => {
      if (params.hasImage === 'true') {
        try {
          const imageData = await AsyncStorage.getItem('pending_analyze_image');
          if (imageData) {
            setPendingImageData(imageData);
            // 사용 후 삭제
            await AsyncStorage.removeItem('pending_analyze_image');
          }
        } catch (error) {
          console.error('이미지 로드 실패:', error);
        }
      }
      setIsImageLoaded(true);
    };
    loadPendingImage();
  }, [params.hasImage]);

  // AsyncStorage에 저장된 Supabase 세션 로드 (WebView에 주입)
  useEffect(() => {
    const loadSupabaseSession = async () => {
      try {
        // 로그인/회원가입 페이지에서는 세션 주입 하지 않음 (에러 방지)
        const isAuthPage =
          path.includes('/auth/login') || path.includes('/auth/signup');

        if (!isAuthPage) {
          const storedSession = await AsyncStorage.getItem('supabaseSession');
          if (storedSession) {
            setSupabaseSession(storedSession);
          }
        }
      } catch (error) {
        console.error('Supabase 세션 로드 실패:', error);
      } finally {
        setIsAuthSessionLoaded(true);
      }
    };

    loadSupabaseSession();
  }, [path]);

  useEffect(() => {
    setCanGoBack(false);
  }, [url]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true; // 웹뷰 내에서 처리
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  // 디버그: URL 로깅 (마운트 시 한 번만)
  useEffect(() => {
    if (__DEV__) {
      console.log('[WebViewScreen] Initial URL:', url);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 웹뷰에서 메시지 수신 처리
  const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'LOGIN_SUCCESS':
          // 로그인 성공 시 토큰 저장 및 화면 이동
          const { token, refreshToken, userId, isNewUser } = message.payload;
          try {
            await AsyncStorage.setItem('authToken', token);
            if (refreshToken) {
              await AsyncStorage.setItem('refreshToken', refreshToken);
            }
            if (userId) {
              await AsyncStorage.setItem('userId', userId);
            }

            // 신규 사용자인 경우 온보딩으로, 기존 사용자는 메인으로
            if (isNewUser) {
              // 신규 사용자: 온보딩 필요
              console.log('[LOGIN_SUCCESS] 신규 사용자 - 온보딩으로 이동');
              router.replace('/(auth)/onboarding');
            } else {
              // 기존 사용자: 온보딩 완료로 설정하고 메인으로
              await AsyncStorage.setItem('hasOnboarded', 'true');
              console.log('[LOGIN_SUCCESS] 기존 사용자 - 메인 화면으로 이동');
              router.replace('/(tabs)');
            }
          } catch (error) {
            console.error('Failed to save auth token:', error);
          }
          break;

        case 'SCAN_BARCODE':
          router.push('/camera');
          break;

        case 'SCAN_MENU':
          // 메뉴 스캔 화면으로 이동 (네이티브 카메라 사용)
          router.push('/(tabs)/scan');
          break;

        case 'NAVIGATE':
          const { screen, params: navParams } = message.payload;
          if (screen === 'Camera' || screen === 'camera') {
            router.push('/camera');
          } else {
            router.push(`/webview/${screen.toLowerCase()}`);
          }
          break;

        case 'GO_BACK':
          router.back();
          break;

        case 'HAPTIC_FEEDBACK':
          const hapticType = message.payload?.type || 'medium';
          if (hapticType === 'light') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else if (hapticType === 'heavy') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          break;

        case 'ONBOARDING_COMPLETE':
          // 온보딩 완료 시 플래그 설정 및 메인 화면으로 이동
          try {
            await AsyncStorage.setItem('hasOnboarded', 'true');
            console.log(
              '[ONBOARDING_COMPLETE] 온보딩 완료 - 메인 화면으로 이동'
            );
            router.replace('/(tabs)');
          } catch (error) {
            console.error('Failed to save onboarding status:', error);
          }
          break;

        case 'LOGOUT':
          // 로그아웃 시 모든 인증 정보 삭제 및 로그인 화면으로 이동
          try {
            await AsyncStorage.multiRemove([
              'authToken',
              'refreshToken',
              'userId',
              'hasOnboarded',
              'supabaseSession',
            ]);
            console.log('[LOGOUT] AsyncStorage 클리어 완료');

            // WebView 새로고침 (Supabase 세션 초기화)
            if (webViewRef.current) {
              console.log('[LOGOUT] WebView 새로고침 - Supabase 세션 초기화');
              webViewRef.current.reload();
            }

            console.log('[LOGOUT] 로그아웃 완료 - 로그인 화면으로 이동');
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('Failed to clear auth data:', error);
          }
          break;

        case 'CLOSE_WEBVIEW':
          router.back();
          break;

        case 'LANGUAGE_CHANGE':
          // 언어 변경 시 AsyncStorage에 저장
          try {
            const { language } = message.payload;
            await AsyncStorage.setItem('app_language', language);
            setSavedLanguage(language);
            console.log('[LANGUAGE_CHANGE] 언어 저장됨:', language);
          } catch (error) {
            console.error('Failed to save language:', error);
          }
          break;

        case 'CONSOLE_LOG':
          // WebView 콘솔 로그를 React Native 콘솔에 출력 (성능 계측용)
          {
            const { level, message: logMessage } = message.payload;
            const prefix = '[WebView]';
            if (level === 'error') {
              console.error(prefix, logMessage);
            } else if (level === 'warn') {
              console.warn(prefix, logMessage);
            } else {
              console.log(prefix, logMessage);
            }
          }
          break;

        case 'PERFORMANCE_METRICS':
          // 성능 메트릭 수신 (개발 모드)
          {
            const metrics = message.payload;
            console.log('\n📊 [Performance Metrics from WebView]');
            console.log('Request ID:', metrics.requestId);
            console.log('Network:', metrics.phases?.network?.toFixed(2), 'ms');
            console.log('Parsing:', metrics.phases?.parsing?.toFixed(2), 'ms');
            console.log('Mapping:', metrics.phases?.mapping?.toFixed(2), 'ms');
            console.log(
              'Rendering:',
              metrics.phases?.rendering?.toFixed(2),
              'ms'
            );
            console.log('Total:', metrics.phases?.total?.toFixed(2), 'ms');
            console.log('Response Size:', metrics.responseSize, 'bytes\n');
          }
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  }, []);

  // 웹뷰에 주입할 JavaScript (브릿지 설정)
  const injectedJavaScript = `
    (function() {
      // 네이티브 브릿지 설정
      window.SafeMealsBridge = {
        postMessage: function(message) {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        },
        scanBarcode: function() {
          this.postMessage({ type: 'SCAN_BARCODE' });
        },
        scanMenu: function() {
          this.postMessage({ type: 'SCAN_MENU' });
        },
        navigate: function(screen, params) {
          this.postMessage({ type: 'NAVIGATE', payload: { screen, params } });
        },
        goBack: function() {
          this.postMessage({ type: 'GO_BACK' });
        },
        haptic: function(type) {
          this.postMessage({ type: 'HAPTIC_FEEDBACK', payload: { type: type || 'medium' } });
        },
        close: function() {
          this.postMessage({ type: 'CLOSE_WEBVIEW' });
        },
        // 성능 메트릭 전송 (개발 모드용)
        sendMetrics: function(metrics) {
          this.postMessage({ type: 'PERFORMANCE_METRICS', payload: metrics });
        }
      };
      
      // 개발 모드에서 콘솔 로그를 네이티브로 전달 (중복 방지)
      (function setupConsoleForward() {
        // 이미 설정되었으면 스킵 (중복 방지)
        if (window.__consoleForwardSetup) return;
        window.__consoleForwardSetup = true;

        const originalConsole = {
          log: console.log,
          warn: console.warn,
          error: console.error,
          info: console.info
        };

        // 이미 전달한 메시지 캐시 (중복 방지)
        const sentMessages = new Set();
        const MESSAGE_CACHE_SIZE = 50;

        function shouldForward(message) {
          // 성능 계측 관련 메시지만 전달
          if (!message.includes('[Metrics:') && 
              !message.includes('Performance Metrics') && 
              !message.includes('📊') && 
              !message.includes('📈')) {
            return false;
          }
          // 중복 메시지 방지
          const msgHash = message.substring(0, 100);
          if (sentMessages.has(msgHash)) return false;
          sentMessages.add(msgHash);
          // 캐시 크기 제한
          if (sentMessages.size > MESSAGE_CACHE_SIZE) {
            const first = sentMessages.values().next().value;
            sentMessages.delete(first);
          }
          return true;
        }
        
        console.log = function(...args) {
          originalConsole.log.apply(console, args);
          const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          if (shouldForward(message)) {
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CONSOLE_LOG',
                payload: { level: 'log', message: message }
              }));
            } catch (e) {}
          }
        };
        
        console.warn = function(...args) {
          originalConsole.warn.apply(console, args);
          const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          if (shouldForward(message)) {
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CONSOLE_LOG',
                payload: { level: 'warn', message: message }
              }));
            } catch (e) {}
          }
        };
        
        console.error = function(...args) {
          originalConsole.error.apply(console, args);
          const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          if (shouldForward(message)) {
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CONSOLE_LOG',
                payload: { level: 'error', message: message }
              }));
            } catch (e) {}
          }
        };
      })();
      
      // 분석용 이미지 데이터 주입
      ${pendingImageData ? `window.pendingAnalyzeImage = "${pendingImageData.replace(/"/g, '\\"')}";` : 'window.pendingAnalyzeImage = null;'}
      
      window.isNativeApp = true;
      window.nativeAppVersion = '${Constants.expoConfig?.version || '1.0.0'}';
      
      // 네이티브 Supabase 세션을 WebView localStorage에 주입
      ${
        supabaseSession && supabaseStorageKey
          ? `
      try {
        // supabaseSession은 이미 JSON 문자열이므로 그대로 저장
        // JSON.stringify로 감싸서 JavaScript 문자열 리터럴로 안전하게 전달
        var sessionData = ${JSON.stringify(supabaseSession)};
        localStorage.setItem('${supabaseStorageKey}', sessionData);
        console.log('[WebView] Supabase 세션이 주입되었습니다. Key:', '${supabaseStorageKey}');
      } catch (e) {
        console.error('[WebView] Supabase 세션 주입 실패:', e);
      }
      `
          : `console.log('[WebView] Supabase 세션 없음 - 세션:', ${!!supabaseSession}, '키:', '${supabaseStorageKey}');`
      }
      
      // 네이티브에서 저장된 언어가 있으면 localStorage에 동기화
      (function syncLanguageFromNative() {
        const savedLang = '${savedLanguage || ''}';
        if (savedLang) {
          const STORAGE_KEY = 'safemeals-language-storage';
          const currentStorage = localStorage.getItem(STORAGE_KEY);
          try {
            const current = currentStorage ? JSON.parse(currentStorage) : { state: {} };
            if (current.state.language !== savedLang) {
              current.state.language = savedLang;
              // 직접 원본 setItem 호출하여 무한 루프 방지
              Object.getPrototypeOf(localStorage).setItem.call(localStorage, STORAGE_KEY, JSON.stringify(current));
              console.log('[WebView] 언어 동기화됨:', savedLang);
              // focus 이벤트를 트리거하여 웹 앱이 언어를 다시 읽도록 함
              window.dispatchEvent(new Event('focus'));
            }
          } catch (e) {
            console.error('[WebView] 언어 동기화 실패:', e);
          }
        }
      })();
      
      // 언어 변경 감지 및 네이티브로 전달
      (function setupLanguageSync() {
        const STORAGE_KEY = 'safemeals-language-storage';
        
        // localStorage 변경 감지
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
          originalSetItem.apply(this, arguments);
          if (key === STORAGE_KEY) {
            try {
              const parsed = JSON.parse(value);
              if (parsed.state && parsed.state.language) {
                window.SafeMealsBridge.postMessage({
                  type: 'LANGUAGE_CHANGE',
                  payload: { language: parsed.state.language }
                });
              }
            } catch (e) {}
          }
        };
      })();
      
      window.dispatchEvent(new Event('nativeBridgeReady'));
      
      true;
    })();
  `;

  // 이미지 로딩 중이면 로딩 표시
  if (!isImageLoaded || !isAuthSessionLoaded) {
    return (
      <SafeAreaView style={styles.container} edges={safeAreaEdges}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={safeAreaEdges}>
      {showHeader && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            {/* 필요시 타이틀 추가 */}
          </View>
          <View style={styles.headerRight} />
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        originWhitelist={[
          'http://*',
          'https://*',
          'file://*',
          'data:*',
          'blob:*',
          'sms://*',
          'tel://*',
          'mailto:*',
          'geo:*',
        ]}
        onMessage={handleMessage}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        )}
        // 캐시 설정
        cacheEnabled={true}
        // iOS
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Android
        mixedContentMode="compatibility"
        // 에러 처리
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[WebView] Error:', {
            url: nativeEvent.url,
            code: nativeEvent.code,
            description: nativeEvent.description,
          });
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[WebView] HTTP Error:', {
            url: nativeEvent.url,
            statusCode: nativeEvent.statusCode,
            description: nativeEvent.description,
          });
        }}
        onLoadEnd={(syntheticEvent) => {
          if (__DEV__) {
            console.log(
              '[WebView] Load finished:',
              syntheticEvent.nativeEvent.url
            );
          }
        }}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 44,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
