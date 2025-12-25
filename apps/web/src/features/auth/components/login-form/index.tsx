'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input-legacy';
import { Button } from '@/components/ui/button-legacy';
import { useAuthLoginForm } from './hooks/index.form.hook';
import { AUTH_URLS } from '@/commons/constants/url';
import { LanguageSelector } from '@/components/language-selector';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/lib/translations';

export interface AuthLoginProps {
  className?: string;
}

export const AuthLogin: React.FC<AuthLoginProps> = ({ className = '' }) => {
  const {
    control,
    onSubmit,
    showPassword,
    setShowPassword,
    handleSocialLogin,
    errorMessage,
    isLoading,
  } = useAuthLoginForm();

  const { language } = useTranslation();

  const loginText: Record<
    Language,
    {
      title: string;
      subtitle: string;
      email: string;
      password: string;
      login: string;
      or: string;
      signup: string;
      forgot: string;
      forgotEmail: string;
      continueWithGoogle: string;
      continueWithApple: string;
      continueWithFacebook: string;
    }
  > = {
    ko: {
      title: 'SafeMeals에 로그인',
      subtitle: '안전한 식사를 시작하세요',
      email: '이메일',
      password: '비밀번호',
      login: '로그인',
      or: '또는',
      signup: '회원가입',
      forgot: '비밀번호를 잊으셨나요?',
      forgotEmail: '이메일을 잊으셨나요?',
      continueWithGoogle: 'Google로 계속하기',
      continueWithApple: 'Apple로 계속하기',
      continueWithFacebook: 'Facebook으로 계속하기',
    },
    en: {
      title: 'Login to SafeMeals',
      subtitle: 'Start your safe dining experience',
      email: 'Email',
      password: 'Password',
      login: 'Login',
      or: 'or',
      signup: 'Sign Up',
      forgot: 'Forgot password?',
      forgotEmail: 'Forgot email?',
      continueWithGoogle: 'Continue with Google',
      continueWithApple: 'Continue with Apple',
      continueWithFacebook: 'Continue with Facebook',
    },
    ja: {
      title: 'SafeMealsにログイン',
      subtitle: '安全な食事体験を始めましょう',
      email: 'メールアドレス',
      password: 'パスワード',
      login: 'ログイン',
      or: 'または',
      signup: '新規登録',
      forgot: 'パスワードをお忘れですか？',
      forgotEmail: 'メールアドレスをお忘れですか？',
      continueWithGoogle: 'Googleで続ける',
      continueWithApple: 'Appleで続ける',
      continueWithFacebook: 'Facebookで続ける',
    },
    zh: {
      title: '登录SafeMeals',
      subtitle: '开始您的安全用餐体验',
      email: '电子邮件',
      password: '密码',
      login: '登录',
      or: '或',
      signup: '注册',
      forgot: '忘记密码？',
      forgotEmail: '忘记电子邮件？',
      continueWithGoogle: '使用Google继续',
      continueWithApple: '使用Apple继续',
      continueWithFacebook: '使用Facebook继续',
    },
    es: {
      title: 'Iniciar sesión en SafeMeals',
      subtitle: 'Comienza tu experiencia gastronómica segura',
      email: 'Correo electrónico',
      password: 'Contraseña',
      login: 'Iniciar sesión',
      or: 'o',
      signup: 'Registrarse',
      forgot: '¿Olvidaste tu contraseña?',
      forgotEmail: '¿Olvidaste tu correo electrónico?',
      continueWithGoogle: 'Continuar con Google',
      continueWithApple: 'Continuar con Apple',
      continueWithFacebook: 'Continuar con Facebook',
    },
  } as const;

  const currentText = loginText[language as Language];

  return (
    <div
      className={`flex min-h-screen flex-col bg-white p-6 pb-28 ${className}`}
      data-testid="login-page-container"
    >
      <div className="mb-4 flex justify-end">
        <LanguageSelector />
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-12 flex flex-col items-center">
          <div className="mb-4 rounded-2xl bg-white p-6 shadow-lg">
            <Image
              src="/assets/6cfabb519ebdb3c306fc082668ba8f0b1cd872e9.png"
              alt="SafeMeals Logo"
              width={160}
              height={160}
              className="object-contain"
            />
          </div>
          <p className="text-center text-muted-foreground">
            {currentText.subtitle}
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {currentText.email}
            </label>
            <div className="relative">
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    className="h-12 rounded-xl border-gray-200 bg-white"
                    placeholder="you@example.com"
                    required
                  />
                )}
              />
            </div>
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-muted-foreground" />
              {currentText.password}
            </label>
            <div className="relative">
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    className="h-12 rounded-xl border-gray-200 bg-white pr-12"
                    placeholder="••••••••"
                    required
                  />
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="login-submit-button"
            className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white shadow-lg shadow-[#2ECC71]/30 hover:from-[#27AE60] hover:to-[#229954]"
          >
            {isLoading ? '로그인 중...' : currentText.login}
          </Button>

          {/* 회원가입 버튼 */}
          <Link
            href={AUTH_URLS.SIGNUP}
            className="flex h-12 w-full items-center justify-center rounded-full border-2 border-[#2ECC71] text-[#2ECC71] font-medium hover:bg-[#2ECC71]/10 transition-colors"
            data-testid="signup-button"
          >
            {currentText.signup}
          </Link>

          {/* 에러 메시지 영역 */}
          {errorMessage && (
            <div
              data-testid="login-error-message"
              className="mt-2 text-center text-sm text-red-500"
            >
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-sm text-[#2ECC71] hover:underline"
            >
              {currentText.forgotEmail}
            </button>
            <button
              type="button"
              className="text-sm text-[#2ECC71] hover:underline"
            >
              {currentText.forgot}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span className="text-sm text-muted-foreground">
            {currentText.or}
          </span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin('google')}
            className="h-12 w-full rounded-full border-2 border-gray-200 hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
          >
            {currentText.continueWithGoogle}
          </button>
          <button
            onClick={() => handleSocialLogin('apple')}
            className="h-12 w-full rounded-full border-2 border-gray-200 hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
          >
            {currentText.continueWithApple}
          </button>
          <button
            onClick={() => handleSocialLogin('facebook')}
            className="h-12 w-full rounded-full border-2 border-gray-200 hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
          >
            {currentText.continueWithFacebook}
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {currentText.signup === 'Sign Up'
            ? "Don't have an account? "
            : '계정이 없으신가요? '}
          <Link
            href={AUTH_URLS.SIGNUP}
            className="text-[#2ECC71] hover:underline"
          >
            {currentText.signup}
          </Link>
        </p>
      </div>
    </div>
  );
};

AuthLogin.displayName = 'AuthLogin';

export default AuthLogin;
