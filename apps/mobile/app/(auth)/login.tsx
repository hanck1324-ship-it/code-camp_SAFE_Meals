import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';

import { checkOnboardingStatus } from '@/lib/onboarding';
import {
  getSupabaseClient,
  serializeSupabaseSession,
} from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authInProgress, setAuthInProgress] = useState(false);
  const extra = Constants.expoConfig?.extra || {};
  const isWebBrowserAvailable =
    typeof WebBrowser.openBrowserAsync === 'function';

  // 환경 변수 + app.json extra 동시 지원
  const googleClientIds = useMemo(() => {
    const androidClientId =
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
      (extra as any).googleAndroidClientId ||
      process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
      (extra as any).googleExpoClientId;

    const iosClientId =
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      (extra as any).googleIosClientId ||
      process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
      (extra as any).googleExpoClientId;

    const webClientId =
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      (extra as any).googleWebClientId;

    const expoClientId =
      process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
      (extra as any).googleExpoClientId;

    // 라이브러리의 필수 값 검증 에러를 피하기 위해 최소 더미 값 설정
    const fallback = 'missing-client-id';

    return {
      androidClientId: androidClientId || fallback,
      iosClientId: iosClientId || fallback,
      webClientId: webClientId || fallback,
      expoClientId: expoClientId || fallback,
      hasConfig:
        (Platform.OS === 'android' ? !!androidClientId : true) &&
        (Platform.OS === 'ios' ? !!iosClientId : true),
    };
  }, [extra]);

  const redirectUri = useMemo(
    () =>
      makeRedirectUri({
        scheme: 'safemeals',
      }),
    []
  );

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: googleClientIds.androidClientId,
    iosClientId: googleClientIds.iosClientId,
    webClientId: googleClientIds.webClientId,
    expoClientId: googleClientIds.expoClientId,
    scopes: ['openid', 'email', 'profile'],
    redirectUri,
    responseType: 'id_token',
  });

  const completeNativeLogin = useCallback(
    async (idToken: string, accessToken?: string | null) => {
      setAuthInProgress(true);
      setErrorMessage(null);

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
          access_token: accessToken ?? undefined,
        });

        if (error || !data.session) {
          throw new Error(error?.message || '세션이 생성되지 않았습니다.');
        }

        const { session } = data;
        const supabaseSessionString = serializeSupabaseSession(session);

        const isNewUser = await checkOnboardingStatus(session.user.id);

        const storageEntries: [string, string][] = [
          ['authToken', session.access_token],
          ['refreshToken', session.refresh_token ?? ''],
          ['userId', session.user.id],
        ];

        if (supabaseSessionString) {
          storageEntries.push(['supabaseSession', supabaseSessionString]);
        }

        if (isNewUser) {
          // 온보딩이 필요하면 기존 플래그 제거
          await AsyncStorage.multiRemove(['hasOnboarded']);
        } else {
          storageEntries.push(['hasOnboarded', 'true']);
        }

        await AsyncStorage.multiSet(storageEntries);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (isNewUser) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      } catch (err) {
        console.error('[NativeLogin] 로그인 실패:', err);
        setErrorMessage('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      } finally {
        setAuthInProgress(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken =
        response.authentication?.idToken || (response.params as any)?.id_token;
      const accessToken =
        response.authentication?.accessToken ||
        (response.params as any)?.access_token;

      if (!idToken) {
        setErrorMessage('Google 토큰을 불러오지 못했습니다. 다시 시도해주세요.');
        setAuthInProgress(false);
        return;
      }

      completeNativeLogin(idToken, accessToken);
    } else if (response.type === 'error') {
      setErrorMessage('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      setAuthInProgress(false);
    } else {
      setAuthInProgress(false);
    }
  }, [response, completeNativeLogin]);

  const handleGoogleLogin = useCallback(async () => {
    if (!isWebBrowserAvailable) {
      setErrorMessage(
        '이 빌드에는 expo-web-browser 네이티브 모듈이 없습니다.\nexpo run:android 등으로 dev client를 다시 빌드 후 시도해주세요.'
      );
      return;
    }

    if (!googleClientIds.hasConfig) {
      setErrorMessage(
        'Google 클라이언트 ID가 설정되지 않았습니다.\nEXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID / EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID를 환경변수나 app.json extra에 추가해주세요.'
      );
      return;
    }

    try {
      setErrorMessage(null);
      setAuthInProgress(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await promptAsync();

      if (!result || result.type !== 'success') {
        setAuthInProgress(false);
      }
    } catch (err) {
      console.error('[NativeLogin] Google 로그인 실행 실패:', err);
      setErrorMessage('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      setAuthInProgress(false);
    }
  }, [promptAsync]);

  const handleOpenWebLogin = useCallback(() => {
    router.push('/webview/auth/login');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoBadge}>
          <Text style={styles.logo}>🍽️</Text>
        </View>
        <Text style={styles.title}>SafeMeals</Text>
        <Text style={styles.subtitle}>
          Google로 빠르고 안전하게 로그인하고
          {'\n'}
          알레르기 걱정 없는 식사를 시작하세요.
        </Text>
      </View>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      <TouchableOpacity
        style={[
          styles.googleButton,
          (!request || authInProgress || !isWebBrowserAvailable) &&
            styles.googleButtonDisabled,
        ]}
        onPress={handleGoogleLogin}
        disabled={!request || authInProgress || !isWebBrowserAvailable}
        activeOpacity={0.8}
      >
        {authInProgress ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#ffffff" />
            <Text style={styles.googleButtonText}>Google로 로그인</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleOpenWebLogin}
      >
        <Text style={styles.secondaryText}>이메일/기타 로그인(웹뷰 열기)</Text>
      </TouchableOpacity>

      {!googleClientIds.hasConfig && (
        <Text style={styles.helperText}>
          Android/iOS Google Client ID를 설정하면 버튼이 정상 동작합니다.
          {'\n'}app.json extra나 EXPO_PUBLIC_GOOGLE_* 환경변수를 확인하세요.
        </Text>
      )}

      {!isWebBrowserAvailable && (
        <Text style={styles.helperText}>
          현재 빌드에 expo-web-browser 네이티브 모듈이 없어요.
          {'\n'}`expo run:android` 또는 EAS 개발 빌드로 재설치한 뒤 다시 시도해주세요.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F1F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 44,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
  },
  error: {
    marginBottom: 16,
    color: '#DC2626',
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#6B7280',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  helperText: {
    marginTop: 12,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
});
