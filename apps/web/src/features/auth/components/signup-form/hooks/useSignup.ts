'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

import { AUTH_URLS } from '@/commons/constants/url';
import { getSupabaseClient } from '@/lib/supabase';

interface SignupData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  language: string;
}

interface UseSignupReturn {
  signupWithEmail: (data: SignupData) => Promise<void>;
  signupWithGoogle: (language: string) => Promise<void>;
  errorMessage: string | null;
  isLoading: boolean;
  clearError: () => void;
}

/**
 * 회원가입 기능을 제공하는 훅
 *
 * @description
 * - 이메일/비밀번호 회원가입 (Supabase Auth)
 * - Google OAuth 회원가입
 * - 에러 처리 및 상태 관리
 *
 * @example
 * ```tsx
 * const { signupWithEmail, signupWithGoogle, errorMessage, isLoading } = useSignup();
 *
 * // 이메일 회원가입
 * await signupWithEmail({
 *   email: 'user@example.com',
 *   password: 'password123',
 *   language: 'ko'
 * });
 *
 * // Google 회원가입
 * await signupWithGoogle('ko');
 * ```
 */
export function useSignup(): UseSignupReturn {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /**
   * 에러 메시지 초기화
   */
  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  /**
   * 이메일/비밀번호로 회원가입
   */
  const signupWithEmail = useCallback(
    async (data: SignupData): Promise<void> => {
      setErrorMessage(null);
      setIsLoading(true);

      try {
        const supabase = getSupabaseClient();
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name || '',
              phone: data.phone || '',
              language: data.language || 'ko',
            },
          },
        });

        if (error) {
          console.log('Supabase signup error:', error.message, error.code);
          // 이미 존재하는 이메일 처리 - Supabase 에러 메시지 패턴 확장
          if (
            error.message.includes('already registered') ||
            error.message.includes('already exists') ||
            error.message.includes('User already registered') ||
            error.message.includes('Email already') ||
            error.message.includes('duplicate') ||
            error.code === 'user_already_exists' ||
            error.code === '23505' // PostgreSQL unique constraint violation
          ) {
            setErrorMessage('이미 가입된 이메일입니다.');
          } else {
            setErrorMessage('회원가입에 실패하였습니다. 다시 시도해주세요.');
          }
          return;
        }

        // 회원가입 성공 처리
        if (authData.user) {
          // 이메일 인증이 필요한 경우 체크
          if (
            authData.user.identities &&
            authData.user.identities.length === 0
          ) {
            // 이미 존재하는 사용자 (이메일 인증 전 상태)
            setErrorMessage('이미 가입된 이메일입니다.');
            return;
          }

          // 회원가입 성공 시 - 항상 로그인 페이지로 이동
          if (authData.session) {
            // 세션이 자동 생성되었지만 즉시 로그아웃하여 사용자가 수동으로 로그인하도록 유도
            const supabase = getSupabaseClient();
            await supabase.auth.signOut();

            console.log(
              '[useSignup] 회원가입 성공 - 세션 로그아웃 후 로그인 페이지로 이동'
            );

            alert(
              '회원가입에 성공하였습니다. 로그인 페이지에서 로그인해주세요.'
            );
            router.push(AUTH_URLS.LOGIN);
          } else {
            // 이메일 인증이 필요한 경우
            alert(
              '회원가입에 성공하였습니다. 이메일을 확인하여 인증을 완료해주세요.'
            );
            router.push(AUTH_URLS.LOGIN);
          }
        }
      } catch (err) {
        setErrorMessage('회원가입에 실패하였습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Google OAuth 회원가입
   */
  const signupWithGoogle = useCallback(
    async (language: string): Promise<void> => {
      setErrorMessage(null);
      setIsLoading(true);

      try {
        const supabase = getSupabaseClient();
        // OAuth 로그인 후 user_metadata에 language를 저장하기 위해 queryParams 활용
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo:
              window.location.origin +
              AUTH_URLS.LOGIN +
              `?language=${language || 'ko'}`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          setErrorMessage('소셜 회원가입에 실패하였습니다. 다시 시도해주세요.');
        }
        // OAuth 성공 시 redirect가 발생하므로 추가 처리 없음
        // 성공 메시지는 redirect 후 auth-provider에서 처리
      } catch (err) {
        setErrorMessage('소셜 회원가입에 실패하였습니다. 다시 시도해주세요.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    signupWithEmail,
    signupWithGoogle,
    errorMessage,
    isLoading,
    clearError,
  };
}
