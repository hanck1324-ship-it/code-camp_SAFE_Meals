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
  const { control, errors, onSubmit, isFormFilled, isLoading } =
    useAuthSignupForm();
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
        <form className="space-y-4" onSubmit={onSubmit}>
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
                <Input
                  {...field}
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
                  error={!!errors.passwordConfirm}
                  errorMessage={errors.passwordConfirm?.message}
                />
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
                    value={field.value || currentLanguage}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // 전역 언어 상태도 즉시 업데이트하여 페이지 전체 언어 변경
                      setLanguage(value as Language);
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
          <div className="mt-12">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={!isFormFilled || isLoading}
              className="w-full rounded-[10px] flex items-center justify-center h-[55px]"
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
