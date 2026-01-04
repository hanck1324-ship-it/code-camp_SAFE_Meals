import { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WebViewScreenProps {
  path: string;
  showHeader?: boolean;
}

// 항상 이 주소를 사용 (필요시 아래 한 줄만 수정)
const WEBVIEW_BASE_URL = 'http://172.30.1.96:3000';

export default function WebViewScreen({
  path,
  showHeader = false,
}: WebViewScreenProps) {
  const webViewRef = useRef<WebView>(null);
  const params = useLocalSearchParams();
  const [pendingImageData, setPendingImageData] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [savedLanguage, setSavedLanguage] = useState<string | null>(null);

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

  // URL 쿼리 파라미터 추가
  const queryString = Object.keys(params)
    .filter((key) => key !== 'path' && key !== 'hasImage')
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`
    )
    .join('&');

  const url = `${WEBVIEW_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;

  // 디버그: URL 로깅
  console.log('[WebViewScreen] Loading URL:', url);

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
            console.log('[LANGUAGE_CHANGE] 언어 저장됨:', language);
          } catch (error) {
            console.error('Failed to save language:', error);
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
        }
      };
      
      // 분석용 이미지 데이터 주입
      ${pendingImageData ? `window.pendingAnalyzeImage = "${pendingImageData.replace(/"/g, '\\"')}";` : 'window.pendingAnalyzeImage = null;'}
      
      window.isNativeApp = true;
      window.nativeAppVersion = '${Constants.expoConfig?.version || '1.0.0'}';
      
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
  if (!isImageLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={showHeader ? ['top'] : []}>
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
          console.log(
            '[WebView] Load finished:',
            syntheticEvent.nativeEvent.url
          );
        }}
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
