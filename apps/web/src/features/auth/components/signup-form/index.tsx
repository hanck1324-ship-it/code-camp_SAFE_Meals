'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Globe, Phone, User } from 'lucide-react';
import { Input } from '@/components/ui/input-legacy';
import { Button } from '@/components/ui/button-legacy';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthSignupForm } from './hooks/index.form.hook';
import { useTranslation, getSupportedLanguages } from '@/hooks/useTranslation';
import { AUTH_URLS } from '@/commons/constants/url';
import type { Language } from '@/lib/translations';

export interface AuthSignupProps {
  className?: string;
}

export const AuthSignup: React.FC<AuthSignupProps> = ({ className = '' }) => {
  const {
    control,
    errors,
    onSubmit,
    onGoogleSignup,
    isFormFilled,
    isLoading,
    errorMessage,
    clearError,
    isPasswordMismatch,
  } = useAuthSignupForm();
  const { t, setLanguage, language: currentLanguage } = useTranslation();
  const supportedLanguages = getSupportedLanguages();
  const router = useRouter();

  return (
    <div
      className={`flex min-h-screen items-center justify-center p-4 ${className}`}
      data-testid="auth-signup-container"
    >
      <div className="box-content flex flex-col w-full max-w-md rounded-2xl p-8">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-foreground">
            {t.createAccount}
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentLanguage === 'en'
              ? 'Create a new account to get started'
              : currentLanguage === 'ja'
                ? '新しいアカウントを作成して始めましょう'
                : currentLanguage === 'zh'
                  ? '创建新账户开始使用'
                  : currentLanguage === 'es'
                    ? 'Crea una nueva cuenta para comenzar'
                    : '새로운 계정을 만들어 서비스를 시작해보세요'}
          </p>
        </div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(e); }}>
          <div className="w-full">
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label={
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t.email}
                    </span>
                  }
                  placeholder={t.emailPlaceholder}
                  type="email"
                  required
                  className="w-full"
                  error={!!errors.email}
                  errorMessage={errors.email?.message}
                />
              )}
            />
          </div>
          <div className="w-full">
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  name="password"
                  label={
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {t.password}
                    </span>
                  }
                  placeholder={t.passwordPlaceholder}
                  type="password"
                  required
                  className="w-full"
                  error={!!errors.password}
                  errorMessage={errors.password?.message}
                />
              )}
            />
          </div>
          <div className="w-full">
            <Controller
              name="passwordConfirm"
              control={control}
              render={({ field }) => (
                <>
                  <Input
                    {...field}
                    name="passwordConfirm"
                    label={
                      <span className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {currentLanguage === 'en'
                          ? 'Confirm Password'
                          : currentLanguage === 'ja'
                            ? 'パスワード確認'
                            : currentLanguage === 'zh'
                              ? '确认密码'
                              : currentLanguage === 'es'
                                ? 'Confirmar Contraseña'
                                : '비밀번호 재입력'}
                      </span>
                    }
                    placeholder={
                      currentLanguage === 'en'
                        ? 'Confirm your password'
                        : currentLanguage === 'ja'
                          ? 'パスワードを確認してください'
                          : currentLanguage === 'zh'
                            ? '请确认您的密码'
                            : currentLanguage === 'es'
                              ? 'Confirma tu contraseña'
                              : '비밀번호를 다시 입력해주세요'
                    }
                    type="password"
                    required
                    className="w-full"
                    error={!!errors.passwordConfirm || isPasswordMismatch}
                    errorMessage={errors.passwordConfirm?.message}
                  />
                  {isPasswordMismatch && (
                    <p
                      className="text-sm text-destructive mt-1"
                      data-testid="password-mismatch-error"
                    >
                      비밀번호가 일치하지 않습니다.
                    </p>
                  )}
                </>
              )}
            />
          </div>
          <div className="w-full">
            <Controller
              name="language"
              control={control}
              render={({ field }) => (
                <div className="flex w-full flex-col gap-1">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t.language}
                  </label>
                  <Select
                    value={field.value || currentLanguage || 'ko'}
                    defaultValue={currentLanguage || 'ko'}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // 전역 언어 상태도 즉시 업데이트하여 페이지 전체 언어 변경
                      setLanguage(value as Language);
                      // 언어 변경 후 모든 페이지를 다시 렌더링하여 즉시 반영
                      router.refresh();
                    }}
                  >
                    <SelectTrigger className="h-10 w-full border border-gray-300 hover:border-gray-400 focus-visible:border-[#2ECC71]">
                      <SelectValue
                        placeholder={
                          currentLanguage === 'en'
                            ? 'Select a language'
                            : currentLanguage === 'ja'
                              ? '言語を選択してください'
                              : currentLanguage === 'zh'
                                ? '请选择语言'
                                : currentLanguage === 'es'
                                  ? 'Selecciona un idioma'
                                  : '언어를 선택해주세요'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.map(({ code, name }) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.language && (
                    <p className="text-sm text-destructive">
                      {errors.language.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
          <div className="w-full">
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label={
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {currentLanguage === 'en'
                        ? 'Phone Number'
                        : currentLanguage === 'ja'
                          ? '電話番号'
                          : currentLanguage === 'zh'
                            ? '电话号码'
                            : currentLanguage === 'es'
                              ? 'Número de Teléfono'
                              : '휴대폰번호'}
                    </span>
                  }
                  placeholder={
                    currentLanguage === 'en'
                      ? 'Enter your phone number'
                      : currentLanguage === 'ja'
                        ? '電話番号を入力してください'
                        : currentLanguage === 'zh'
                          ? '请输入您的电话号码'
                          : currentLanguage === 'es'
                            ? 'Ingresa tu número de teléfono'
                            : '휴대폰번호를 입력해주세요'
                  }
                  type="tel"
                  className="w-full"
                  error={!!errors.phone}
                  errorMessage={errors.phone?.message}
                />
              )}
            />
          </div>
          <div className="w-full">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label={
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {currentLanguage === 'en'
                        ? 'Name'
                        : currentLanguage === 'ja'
                          ? '名前'
                          : currentLanguage === 'zh'
                            ? '姓名'
                            : currentLanguage === 'es'
                              ? 'Nombre'
                              : '이름'}
                    </span>
                  }
                  placeholder={
                    currentLanguage === 'en'
                      ? 'Enter your name'
                      : currentLanguage === 'ja'
                        ? '名前を入力してください'
                        : currentLanguage === 'zh'
                          ? '请输入您的姓名'
                          : currentLanguage === 'es'
                            ? 'Ingresa tu nombre'
                            : '이름을 입력해주세요'
                  }
                  className="w-full"
                  error={!!errors.name}
                  errorMessage={errors.name?.message}
                />
              )}
            />
          </div>
          {errorMessage && (
            <div
              className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md"
              data-testid="signup-error-message"
            >
              {errorMessage}
            </div>
          )}
          <div className="mt-12">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={!isFormFilled || isLoading}
              className="w-full rounded-[10px] flex items-center justify-center h-[55px]"
              data-testid="signup-submit-button"
            >
              {isLoading
                ? currentLanguage === 'en'
                  ? 'Signing up...'
                  : currentLanguage === 'ja'
                    ? '登録中...'
                    : currentLanguage === 'zh'
                      ? '注册中...'
                      : currentLanguage === 'es'
                        ? 'Registrando...'
                        : '회원가입 중...'
                : t.createAccount}
            </Button>
          </div>
        </form>

        {/* 구분선 */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">
              {currentLanguage === 'en'
                ? 'Or continue with'
                : currentLanguage === 'ja'
                  ? 'または'
                  : currentLanguage === 'zh'
                    ? '或者'
                    : currentLanguage === 'es'
                      ? 'O continuar con'
                      : '또는'}
            </span>
          </div>
        </div>

        {/* Google OAuth 버튼 */}
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={onGoogleSignup}
          disabled={isLoading}
          className="w-full rounded-[10px] flex items-center justify-center gap-2 h-[55px] border border-gray-300"
          data-testid="google-signup-button"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {currentLanguage === 'en'
            ? 'Sign up with Google'
            : currentLanguage === 'ja'
              ? 'Googleで登録'
              : currentLanguage === 'zh'
                ? '使用Google注册'
                : currentLanguage === 'es'
                  ? 'Registrarse con Google'
                  : 'Google로 회원가입'}
        </Button>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t.alreadyHaveAccount}{' '}
            <button
              type="button"
              onClick={() => router.push(AUTH_URLS.LOGIN)}
              className="font-medium text-[#2ECC71] no-underline hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              {t.signIn}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

AuthSignup.displayName = 'AuthSignup';

export default AuthSignup;
