import { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Platform } from 'react-native';
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
const WEBVIEW_BASE_URL = "http://172.16.2.168:3000";

export default function WebViewScreen({ path, showHeader = false }: WebViewScreenProps) {
  const webViewRef = useRef<WebView>(null);
  const params = useLocalSearchParams();
  
  // URL 쿼리 파라미터 추가
  const queryString = Object.keys(params)
    .filter(key => key !== 'path')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`)
    .join('&');

  const url = `${WEBVIEW_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;

  // 웹뷰에서 메시지 수신 처리
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'SCAN_BARCODE':
          router.push('/camera');
          break;
          
        case 'SCAN_OCR':
        case 'OPEN_CAMERA':
          // 메뉴 촬영용 카메라 열기
          const mode = message.payload?.mode || 'photo';
          if (mode === 'photo') {
            router.push('/scan-camera' as any);
          } else {
            router.push('/camera');
          }
          break;
          
        case 'NAVIGATE':
          const { screen, params: navParams } = message.payload;
          if (screen === 'Camera' || screen === 'camera') {
            router.push('/camera');
          } else if (screen === 'ScanCamera' || screen === 'scan-camera') {
            router.push('/scan-camera' as any);
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
          
        case 'CLOSE_WEBVIEW':
          router.back();
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
      
      window.isNativeApp = true;
      window.nativeAppVersion = '${Constants.expoConfig?.version || '1.0.0'}';
      window.dispatchEvent(new Event('nativeBridgeReady'));
      
      true;
    })();
  `;

  return (
    <SafeAreaView style={styles.container} edges={showHeader ? ['top'] : []}>
      {showHeader && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        )}
        onLoadEnd={() => {
          // 웹뷰 로드 완료 후 이미지 전달
          const imageKey = params.imageKey as string;
          const timestamp = params.timestamp as string;
          
          if (imageKey && timestamp) {
            AsyncStorage.getItem(imageKey).then((imageData) => {
              if (imageData && webViewRef.current) {
                const message = JSON.stringify({
                  type: 'CAMERA_IMAGE',
                  payload: {
                    imageData,
                    timestamp: parseInt(timestamp, 10),
                  },
                });
                
                webViewRef.current?.postMessage(message);
                AsyncStorage.removeItem(imageKey);
              }
            }).catch((error) => {
              console.error('이미지 전달 오류:', error);
            });
          }
        }}
        // 캐시 설정
        cacheEnabled={true}
        // iOS
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Android
        mixedContentMode="compatibility"
        // 에러 처리
        onError={(syntheticEvent) => {
          console.error('WebView error:', syntheticEvent.nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          console.error('WebView HTTP error:', syntheticEvent.nativeEvent);
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
