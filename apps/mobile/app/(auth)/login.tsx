import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Session } from '@supabase/supabase-js';

import { checkOnboardingStatus } from '@/lib/onboarding';
import {
  getSupabaseClient,
  serializeSupabaseSession,
} from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authInProgress, setAuthInProgress] = useState(false);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);
  const extra = Constants.expoConfig?.extra || {};

  // Google Sign-In 초기화
  useEffect(() => {
    const webClientId =
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      (extra as any).googleWebClientId;

    if (webClientId) {
      GoogleSignin.configure({
        webClientId,
        offlineAccess: true,
        scopes: ['openid', 'email', 'profile'],
      });
      setIsGoogleConfigured(true);
    }
  }, [extra]);

  // 로그인 완료 후 세션 저장 및 라우팅
  const completeLogin = useCallback(
    async (session: Session) => {
      try {
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
        console.error('[Login] 세션 저장 실패:', err);
        throw err;
      }
    },
    []
  );

  // 이메일/비밀번호 로그인
  const handleEmailLogin = useCallback(async () => {
    if (!email.trim()) {
      setErrorMessage('이메일을 입력해주세요.');
      return;
    }
    if (!password) {
      setErrorMessage('비밀번호를 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    try {
      setErrorMessage(null);
      setAuthInProgress(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        throw new Error(error.message);
      }

      if (!data.session) {
        throw new Error('세션이 생성되지 않았습니다.');
      }

      await completeLogin(data.session);
    } catch (err: any) {
      console.error('[Login] 이메일 로그인 실패:', err);
      setErrorMessage(err.message || '로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAuthInProgress(false);
    }
  }, [email, password, completeLogin]);

  // Google 로그인
  const handleGoogleLogin = useCallback(async () => {
    if (!isGoogleConfigured) {
      setErrorMessage('Google Sign-In이 설정되지 않았습니다.');
      return;
    }

    try {
      setErrorMessage(null);
      setAuthInProgress(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const isSignedIn = await GoogleSignin.getCurrentUser();
      if (isSignedIn) {
        await GoogleSignin.signOut();
      }

      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      if (!tokens.idToken) {
        throw new Error('ID Token을 가져오지 못했습니다.');
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: tokens.idToken,
        access_token: tokens.accessToken ?? undefined,
      });

      if (error || !data.session) {
        throw new Error(error?.message || '세션이 생성되지 않았습니다.');
      }

      await completeLogin(data.session);
    } catch (err: any) {
      console.error('[Login] Google 로그인 실패:', err);

      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        setErrorMessage('로그인이 취소되었습니다.');
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setErrorMessage('이미 로그인 진행 중입니다.');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrorMessage('Google Play Services를 사용할 수 없습니다.');
      } else {
        setErrorMessage(err.message || 'Google 로그인에 실패했습니다.');
      }
    } finally {
      setAuthInProgress(false);
    }
  }, [isGoogleConfigured, completeLogin]);

  // 회원가입 페이지로 이동
  const handleSignUp = useCallback(() => {
    router.push('/webview/auth/sign-up');
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.logoBadge}>
            <Text style={styles.logo}>🍽️</Text>
          </View>
          <Text style={styles.title}>SafeMeals</Text>
          <Text style={styles.subtitle}>
            알레르기 걱정 없는 안전한 식사를 시작하세요
          </Text>
        </View>

        {/* Error Message */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>이메일</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!authInProgress}
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>비밀번호</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="6자 이상 입력"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!authInProgress}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Email Login Button */}
        <TouchableOpacity
          style={[styles.primaryButton, authInProgress && styles.buttonDisabled]}
          onPress={handleEmailLogin}
          disabled={authInProgress}
          activeOpacity={0.8}
        >
          {authInProgress ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>로그인</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Login Button */}
        <TouchableOpacity
          style={[styles.googleButton, (!isGoogleConfigured || authInProgress) && styles.buttonDisabled]}
          onPress={handleGoogleLogin}
          disabled={!isGoogleConfigured || authInProgress}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text style={styles.googleButtonText}>Google로 로그인</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>계정이 없으신가요? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpLink}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    padding: 14,
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signUpText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signUpLink: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
});
