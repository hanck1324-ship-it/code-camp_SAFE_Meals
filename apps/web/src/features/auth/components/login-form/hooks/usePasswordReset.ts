'use client';

import { useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * 이메일 유효성 검사 함수
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 비밀번호 재설정 훅
 * - 다이얼로그 상태 관리
 * - 비밀번호 재설정 메일 발송 기능
 */
export function usePasswordReset() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * 다이얼로그 열기
   */
  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
    setEmail('');
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

  /**
   * 다이얼로그 닫기
   */
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEmail('');
    setErrorMessage('');
  }, []);

  /**
   * 비밀번호 재설정 메일 발송
   */
  const sendResetEmail = useCallback(async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // 이메일 빈 값 검증
    if (!email.trim()) {
      setErrorMessage('이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    if (!isValidEmail(email)) {
      setErrorMessage('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        setErrorMessage('비밀번호 재설정 메일 발송에 실패하였습니다.');
        setIsLoading(false);
        return;
      }

      // 성공 메시지 표시
      setSuccessMessage(
        '비밀번호 재설정 메일을 발송하였습니다. 이메일을 확인해주세요.'
      );

      // 다이얼로그 닫기 (성공 메시지가 잠시 표시된 후)
      setTimeout(() => {
        setIsDialogOpen(false);
        setEmail('');
        setSuccessMessage('');
      }, 1500);
    } catch {
      setErrorMessage('비밀번호 재설정 메일 발송에 실패하였습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  return {
    isDialogOpen,
    email,
    setEmail,
    isLoading,
    errorMessage,
    successMessage,
    openDialog,
    closeDialog,
    sendResetEmail,
  };
}
