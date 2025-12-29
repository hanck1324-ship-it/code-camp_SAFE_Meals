'use client';

import { useState, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * 전화번호 유효성 검사 함수
 */
const isValidPhone = (phone: string): boolean => {
  // 전화번호 형식 검증 (숫자, 하이픈, 공백 허용)
  const phoneRegex = /^[\d\s\-+()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * 이메일 찾기 훅
 * - 이름 + 전화번호로 사용자 조회
 * - SMS 인증 (6자리 코드)
 * - 인증 완료 후 이메일 반환
 */
export function useEmailFind() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStepState] = useState<'input' | 'verify' | 'result'>('input');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [foundEmail, setFoundEmail] = useState<string | null>(null);

  /**
   * 다이얼로그 열기
   */
  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
    setStepState('input');
    setName('');
    setPhone('');
    setVerificationCode('');
    setErrorMessage('');
    setSuccessMessage('');
    setFoundEmail(null);
  }, []);

  /**
   * 다이얼로그 닫기
   */
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setStepState('input');
    setName('');
    setPhone('');
    setVerificationCode('');
    setErrorMessage('');
    setSuccessMessage('');
    setFoundEmail(null);
  }, []);

  /**
   * 이름 + 전화번호로 사용자 조회 및 SMS 인증 코드 발송
   */
  const sendVerificationCode = useCallback(async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // 이름 검증
    if (!name.trim()) {
      setErrorMessage('이름을 입력해주세요.');
      return;
    }

    // 전화번호 검증
    if (!phone.trim()) {
      setErrorMessage('전화번호를 입력해주세요.');
      return;
    }

    if (!isValidPhone(phone)) {
      setErrorMessage('올바른 전화번호 형식을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 전화번호 정규화 (숫자만 추출)
      const normalizedPhone = phone.replace(/\D/g, '');

      // API 엔드포인트를 통해 사용자 조회
      const response = await fetch('/api/auth/find-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: normalizedPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || '사용자 조회에 실패했습니다.');
        setIsLoading(false);
        return;
      }

      // 사용자 확인 완료, SMS 인증 코드 발송
      const supabase = getSupabaseClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: `+82${normalizedPhone.slice(1)}`, // 한국 번호 형식 (+82)
        options: {
          channel: 'sms',
        },
      });

      if (otpError) {
        console.error('OTP 발송 실패:', otpError);
        setErrorMessage('인증 코드 발송에 실패했습니다. 다시 시도해주세요.');
        setIsLoading(false);
        return;
      }

      // userId를 저장 (나중에 이메일 조회 시 사용)
      sessionStorage.setItem('emailFindUserId', data.userId);

      setStepState('verify');
      setSuccessMessage('인증 코드가 발송되었습니다. SMS를 확인해주세요.');
    } catch (error) {
      console.error('이메일 찾기 오류:', error);
      setErrorMessage('사용자 조회에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [name, phone]);

  /**
   * 인증 코드 확인 및 이메일 반환
   */
  const verifyCode = useCallback(async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!verificationCode || verificationCode.length !== 6) {
      setErrorMessage('6자리 인증 코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      const normalizedPhone = phone.replace(/\D/g, '');

      // 인증 코드 확인
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+82${normalizedPhone.slice(1)}`,
        token: verificationCode,
        type: 'sms',
      });

      if (error) {
        setErrorMessage('인증 코드가 올바르지 않습니다.');
        setIsLoading(false);
        return;
      }

      // 인증 성공 시 이메일 조회
      const userId = sessionStorage.getItem('emailFindUserId');

      if (data.user?.email) {
        // 인증된 사용자의 이메일 사용
        setFoundEmail(data.user.email);
        setStepState('result');
        setSuccessMessage('인증이 완료되었습니다.');
        sessionStorage.removeItem('emailFindUserId');
      } else if (userId) {
        // API를 통해 이메일 조회
        const response = await fetch('/api/auth/find-email', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        const emailData = await response.json();

        if (response.ok && emailData.email) {
          setFoundEmail(emailData.email);
          setStepState('result');
          setSuccessMessage('인증이 완료되었습니다.');
        } else {
          setErrorMessage('이메일을 찾을 수 없습니다.');
        }
        sessionStorage.removeItem('emailFindUserId');
      } else {
        setErrorMessage('이메일을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('인증 코드 확인 오류:', error);
      setErrorMessage('인증 코드 확인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [verificationCode, phone, name]);

  /**
   * 단계 변경
   */
  const setStep = useCallback((newStep: 'input' | 'verify' | 'result') => {
    setStepState(newStep);
  }, []);

  return {
    isDialogOpen,
    step,
    name,
    setName,
    phone,
    setPhone,
    verificationCode,
    setVerificationCode,
    isLoading,
    errorMessage,
    successMessage,
    foundEmail,
    openDialog,
    closeDialog,
    sendVerificationCode,
    verifyCode,
    setStep,
  };
}

