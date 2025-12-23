'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import Link from 'next/link';
import { Input } from '@/components/ui/input-legacy';
import { Button } from '@/components/ui/button-legacy';
import { useAuthLoginForm } from './hooks/index.form.hook';
import { AUTH_URLS } from '@/commons/constants/url';

export interface AuthLoginProps {
  className?: string;
}

export const AuthLogin: React.FC<AuthLoginProps> = ({ className = '' }) => {
  const { control, errors, onSubmit, isFormFilled, isLoading } =
    useAuthLoginForm();

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-white p-4 ${className}`}
      data-testid="auth-login-container"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-foreground">
            로그인
          </h1>
          <p className="text-sm text-muted-foreground">
            계정에 로그인하여 서비스를 이용해보세요
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
                  label="이메일"
                  placeholder="이메일을 입력해주세요"
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
                  label="비밀번호"
                  placeholder="비밀번호를 입력해주세요"
                  type="password"
                  required
                  className="w-full"
                  error={!!errors.password}
                  errorMessage={errors.password?.message}
                />
              )}
            />
          </div>
          <div className="mt-6">
            <Button
              type="submit"
              fullWidth
              disabled={!isFormFilled || isLoading}
              className="w-full"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            아직 계정이 없으신가요?{' '}
            <Link
              href={AUTH_URLS.SIGNUP}
              className="font-medium text-[#2ECC71] no-underline hover:underline"
            >
              회원가입하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

AuthLogin.displayName = 'AuthLogin';

export default AuthLogin;
