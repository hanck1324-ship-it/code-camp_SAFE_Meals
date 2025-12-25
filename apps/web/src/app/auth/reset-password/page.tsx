'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { LanguageSelector } from '@/components/language-selector';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/lib/translations';
import { AUTH_URLS } from '@/commons/constants/url';

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { language } = useTranslation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetPasswordText: Record<
    Language,
    {
      title: string;
      subtitle: string;
      newPassword: string;
      confirmPassword: string;
      changePassword: string;
      passwordMismatch: string;
      passwordTooShort: string;
      linkExpired: string;
      changeSuccess: string;
      changeFailed: string;
      newPasswordPlaceholder: string;
      confirmPasswordPlaceholder: string;
    }
  > = {
    ko: {
      title: '비밀번호 재설정',
      subtitle: '새로운 비밀번호를 입력해주세요',
      newPassword: '새 비밀번호',
      confirmPassword: '비밀번호 확인',
      changePassword: '비밀번호 변경',
      passwordMismatch: '비밀번호가 일치하지 않습니다.',
      passwordTooShort: `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`,
      linkExpired: '링크가 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.',
      changeSuccess: '비밀번호가 성공적으로 변경되었습니다.',
      changeFailed: '비밀번호 변경에 실패하였습니다. 다시 시도해주세요.',
      newPasswordPlaceholder: '새 비밀번호 입력',
      confirmPasswordPlaceholder: '비밀번호 확인 입력',
    },
    en: {
      title: 'Reset Password',
      subtitle: 'Please enter your new password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      changePassword: 'Change Password',
      passwordMismatch: 'Passwords do not match.',
      passwordTooShort: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      linkExpired: 'Link has expired. Please request a password reset again.',
      changeSuccess: 'Password changed successfully.',
      changeFailed: 'Failed to change password. Please try again.',
      newPasswordPlaceholder: 'Enter new password',
      confirmPasswordPlaceholder: 'Confirm password',
    },
    ja: {
      title: 'パスワードリセット',
      subtitle: '新しいパスワードを入力してください',
      newPassword: '新しいパスワード',
      confirmPassword: 'パスワード確認',
      changePassword: 'パスワードを変更',
      passwordMismatch: 'パスワードが一致しません。',
      passwordTooShort: `パスワードは${MIN_PASSWORD_LENGTH}文字以上である必要があります。`,
      linkExpired:
        'リンクの有効期限が切れました。パスワードリセットを再度リクエストしてください。',
      changeSuccess: 'パスワードが正常に変更されました。',
      changeFailed:
        'パスワードの変更に失敗しました。もう一度お試しください。',
      newPasswordPlaceholder: '新しいパスワードを入力',
      confirmPasswordPlaceholder: 'パスワードを確認',
    },
    zh: {
      title: '重置密码',
      subtitle: '请输入您的新密码',
      newPassword: '新密码',
      confirmPassword: '确认密码',
      changePassword: '更改密码',
      passwordMismatch: '密码不匹配。',
      passwordTooShort: `密码必须至少${MIN_PASSWORD_LENGTH}个字符。`,
      linkExpired: '链接已过期。请重新请求密码重置。',
      changeSuccess: '密码更改成功。',
      changeFailed: '密码更改失败。请重试。',
      newPasswordPlaceholder: '输入新密码',
      confirmPasswordPlaceholder: '确认密码',
    },
    es: {
      title: 'Restablecer contraseña',
      subtitle: 'Por favor, ingrese su nueva contraseña',
      newPassword: 'Nueva contraseña',
      confirmPassword: 'Confirmar contraseña',
      changePassword: 'Cambiar contraseña',
      passwordMismatch: 'Las contraseñas no coinciden.',
      passwordTooShort: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      linkExpired:
        'El enlace ha expirado. Por favor, solicite un restablecimiento de contraseña nuevamente.',
      changeSuccess: 'Contraseña cambiada exitosamente.',
      changeFailed:
        'Error al cambiar la contraseña. Por favor, inténtelo de nuevo.',
      newPasswordPlaceholder: 'Ingrese nueva contraseña',
      confirmPasswordPlaceholder: 'Confirmar contraseña',
    },
  };

  const currentText = resetPasswordText[language as Language];

  const handleChangePassword = useCallback(async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // 비밀번호 길이 검증
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(currentText.passwordTooShort);
      return;
    }

    // 비밀번호 일치 검증
    if (newPassword !== confirmPassword) {
      setErrorMessage(currentText.passwordMismatch);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          setErrorMessage(currentText.linkExpired);
        } else {
          setErrorMessage(currentText.changeFailed);
        }
        setIsLoading(false);
        return;
      }

      // 성공 메시지 표시
      setSuccessMessage(currentText.changeSuccess);

      // 로그인 페이지로 리다이렉트
      setTimeout(() => {
        router.push(AUTH_URLS.LOGIN);
      }, 1500);
    } catch {
      setErrorMessage(currentText.changeFailed);
    } finally {
      setIsLoading(false);
    }
  }, [newPassword, confirmPassword, currentText, router]);

  return (
    <div
      className="flex min-h-screen flex-col bg-white p-6 pb-28"
      data-testid="reset-password-page-container"
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
          <h1 className="mb-2 text-2xl font-bold">{currentText.title}</h1>
          <p className="text-center text-muted-foreground">
            {currentText.subtitle}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-muted-foreground" />
              {currentText.newPassword}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-base outline-none transition-colors focus:border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71]/20"
                placeholder={currentText.newPasswordPlaceholder}
                data-testid="new-password-input"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-gray-700"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-muted-foreground" />
              {currentText.confirmPassword}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-base outline-none transition-colors focus:border-[#2ECC71] focus:ring-2 focus:ring-[#2ECC71]/20"
                  placeholder={currentText.confirmPasswordPlaceholder}
                  data-testid="confirm-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

          {errorMessage && (
            <p
              className="text-center text-sm text-red-500"
              data-testid="reset-password-error-message"
            >
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p
              className="text-center text-sm text-green-600"
              data-testid="reset-password-success-message"
            >
              {successMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleChangePassword}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white shadow-lg shadow-[#2ECC71]/30 hover:from-[#27AE60] hover:to-[#229954] disabled:opacity-50"
            data-testid="change-password-button"
          >
            {isLoading ? '변경 중...' : currentText.changePassword}
          </button>
        </div>
      </div>
    </div>
  );
}
