'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { z } from 'zod';

import { MAIN_URLS } from '@/commons/constants/url';
import { useAppStore } from '@/commons/stores/useAppStore';
import { checkOnboardingStatus } from '@/lib/checkOnboardingStatus';
import { getSupabaseClient } from '@/lib/supabase';

type OAuthProvider = 'google' | 'apple' | 'facebook';

interface UseLoginReturn {
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: OAuthProvider) => Promise<void>;
  errorMessage: string | null;
  isLoading: boolean;
}

/**
 * Zod 스키마를 사용한 로그인 폼 검증
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요.')
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
});

/**
 * 로그인 기능을 제공하는 훅
 *
 * @description
 * - 이메일/비밀번호 로그인
 * - OAuth 소셜 로그인 (Google, Apple, Facebook)
 * - 유효성 검증
 * - 에러 처리
 *
 * @example
 * ```tsx
 * const { loginWithEmail, loginWithOAuth, errorMessage, isLoading } = useLogin();
 *
 * // 이메일 로그인
 * await loginWithEmail('user@example.com', 'password123');
 *
 * // OAuth 로그인
 * await loginWithOAuth('google');
 * ```
 */
export function useLogin(): UseLoginReturn {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setUser = useAppStore((state) => state.setUser);

  /**
   * 이메일/비밀번호로 로그인
   */
  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<void> => {
      setErrorMessage(null);

      // Zod 스키마 검증
      const validationResult = loginSchema.safeParse({ email, password });
      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        setErrorMessage(firstError.message);
        return;
      }

      setIsLoading(true);

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
          return;
        }

        if (data.user) {
          setUser(data.user);

          // 네이티브 앱에서 실행 중인 경우 토큰 저장 메시지 전송
          if (
            typeof window !== 'undefined' &&
            (window as any).SafeMealsBridge
          ) {
            const session = data.session;
            if (session?.access_token) {
              // DB에서 온보딩 완료 여부 확인
              const isNewUser = await checkOnboardingStatus(data.user.id);

              console.log('[useLogin] 사용자 정보:', {
                userId: data.user.id,
                isNewUser,
              });

              (window as any).SafeMealsBridge.postMessage({
                type: 'LOGIN_SUCCESS',
                payload: {
                  token: session.access_token,
                  refreshToken: session.refresh_token,
                  userId: data.user.id,
                  isNewUser, // 신규 사용자 여부 전달 (온보딩 필요 여부)
                },
              });
            }
          }

          // 네이티브 앱 감지: ReactNativeWebView 또는 isNativeApp 플래그 확인
          const isNativeApp =
            typeof window !== 'undefined' &&
            ((window as any).ReactNativeWebView !== undefined ||
              (window as any).isNativeApp === true);

          console.log('[useLogin] 환경 감지:', {
            hasWindow: typeof window !== 'undefined',
            hasReactNativeWebView:
              typeof window !== 'undefined' &&
              (window as any).ReactNativeWebView !== undefined,
            hasIsNativeAppFlag:
              typeof window !== 'undefined' &&
              (window as any).isNativeApp === true,
            hasSafeMealsBridge:
              typeof window !== 'undefined' &&
              (window as any).SafeMealsBridge !== undefined,
            isNativeApp,
          });

          if (!isNativeApp) {
            console.log('[useLogin] 웹 환경 - dashboard로 이동');
            alert('로그인에 성공하였습니다.');
            router.push(MAIN_URLS.DASHBOARD);
          } else {
            console.log(
              '[useLogin] 네이티브 환경 - LOGIN_SUCCESS 메시지로 라우팅 처리, router.push 호출하지 않음'
            );
            // 네이티브에서는 LOGIN_SUCCESS 메시지가 이미 전송되었으므로 라우팅은 네이티브가 처리
          }
        }
      } catch (err) {
        setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [router, setUser]
  );

  /**
   * OAuth 소셜 로그인
   */
  const loginWithOAuth = useCallback(
    async (provider: OAuthProvider): Promise<void> => {
      setErrorMessage(null);
      setIsLoading(true);

      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: window.location.origin + MAIN_URLS.DASHBOARD,
          },
        });

        if (error) {
          setErrorMessage('소셜 로그인에 실패하였습니다. 다시 시도해주세요.');
        }
        // OAuth 성공 시 redirect가 발생하므로 추가 처리 없음
        // 성공 이후 로직은 auth-provider의 onAuthStateChange에서 처리
      } catch (err) {
        setErrorMessage('소셜 로그인에 실패하였습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    loginWithEmail,
    loginWithOAuth,
    errorMessage,
    isLoading,
  };
}
