'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button-legacy';
import { Input } from '@/components/ui/input-legacy';
import { AUTH_URLS } from '@/commons/constants/url';
import { LanguageSelector } from '@/components/language-selector';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/lib/translations';

export default function ForgotEmailPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  const { language } = useTranslation();

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const forgotEmailText: Record<
    Language,
    {
      title: string;
      subtitle: string;
      name: string;
      phone: string;
      verificationCode: string;
      sendCode: string;
      resendCode: string;
      verify: string;
      backToLogin: string;
      namePlaceholder: string;
      phonePlaceholder: string;
      codePlaceholder: string;
      processing: string;
      sendingCode: string;
      verifying: string;
      success: string;
      error: string;
      invalidCode: string;
      expiredCode: string;
      codeSent: string;
      timeRemaining: string;
    }
  > = {
    ko: {
      title: '이메일 찾기',
      subtitle: '가입 시 등록한 이름과 전화번호로 인증해주세요',
      name: '이름',
      phone: '전화번호',
      verificationCode: '인증번호',
      sendCode: '인증번호 받기',
      resendCode: '재전송',
      verify: '인증하기',
      backToLogin: '로그인으로 돌아가기',
      namePlaceholder: '홍길동',
      phonePlaceholder: '010-1234-5678',
      codePlaceholder: '6자리 숫자',
      processing: '처리 중...',
      sendingCode: '전송 중...',
      verifying: '인증 중...',
      success: '등록된 이메일 주소: ',
      error: '일치하는 정보가 없습니다. 다시 확인해주세요.',
      invalidCode: '인증번호가 일치하지 않습니다.',
      expiredCode: '인증번호가 만료되었습니다. 다시 시도해주세요.',
      codeSent: '인증번호가 전송되었습니다.',
      timeRemaining: '남은 시간: ',
    },
    en: {
      title: 'Find Email',
      subtitle: 'Verify with your registered name and phone number',
      name: 'Name',
      phone: 'Phone Number',
      verificationCode: 'Verification Code',
      sendCode: 'Send Code',
      resendCode: 'Resend',
      verify: 'Verify',
      backToLogin: 'Back to Login',
      namePlaceholder: 'John Doe',
      phonePlaceholder: '+1-234-567-8900',
      codePlaceholder: '6-digit code',
      processing: 'Processing...',
      sendingCode: 'Sending...',
      verifying: 'Verifying...',
      success: 'Registered email: ',
      error: 'No matching information found. Please try again.',
      invalidCode: 'Invalid verification code.',
      expiredCode: 'Verification code expired. Please try again.',
      codeSent: 'Verification code sent.',
      timeRemaining: 'Time remaining: ',
    },
    ja: {
      title: 'メールアドレス検索',
      subtitle: '登録した名前と電話番号で認証してください',
      name: '名前',
      phone: '電話番号',
      verificationCode: '認証番号',
      sendCode: '認証番号を受け取る',
      resendCode: '再送信',
      verify: '認証する',
      backToLogin: 'ログインに戻る',
      namePlaceholder: '山田太郎',
      phonePlaceholder: '090-1234-5678',
      codePlaceholder: '6桁の数字',
      processing: '処理中...',
      sendingCode: '送信中...',
      verifying: '認証中...',
      success: '登録されたメールアドレス: ',
      error: '一致する情報が見つかりません。もう一度確認してください。',
      invalidCode: '認証番号が一致しません。',
      expiredCode: '認証番号の有効期限が切れました。もう一度お試しください。',
      codeSent: '認証番号が送信されました。',
      timeRemaining: '残り時間: ',
    },
    zh: {
      title: '查找电子邮件',
      subtitle: '使用注册的姓名和电话号码进行验证',
      name: '姓名',
      phone: '电话号码',
      verificationCode: '验证码',
      sendCode: '发送验证码',
      resendCode: '重新发送',
      verify: '验证',
      backToLogin: '返回登录',
      namePlaceholder: '张三',
      phonePlaceholder: '+86-123-4567-8900',
      codePlaceholder: '6位数字',
      processing: '处理中...',
      sendingCode: '发送中...',
      verifying: '验证中...',
      success: '注册的电子邮件: ',
      error: '未找到匹配的信息。请重试。',
      invalidCode: '验证码不正确。',
      expiredCode: '验证码已过期。请重试。',
      codeSent: '验证码已发送。',
      timeRemaining: '剩余时间: ',
    },
    es: {
      title: 'Buscar correo electrónico',
      subtitle: 'Verifique con su nombre y número de teléfono registrado',
      name: 'Nombre',
      phone: 'Número de teléfono',
      verificationCode: 'Código de verificación',
      sendCode: 'Enviar código',
      resendCode: 'Reenviar',
      verify: 'Verificar',
      backToLogin: 'Volver al inicio de sesión',
      namePlaceholder: 'Juan Pérez',
      phonePlaceholder: '+34-123-456-789',
      codePlaceholder: 'Código de 6 dígitos',
      processing: 'Procesando...',
      sendingCode: 'Enviando...',
      verifying: 'Verificando...',
      success: 'Correo electrónico registrado: ',
      error: 'No se encontró información coincidente. Intente de nuevo.',
      invalidCode: 'Código de verificación no válido.',
      expiredCode: 'El código de verificación ha caducado. Intente de nuevo.',
      codeSent: 'Código de verificación enviado.',
      timeRemaining: 'Tiempo restante: ',
    },
  } as const;

  const currentText = forgotEmailText[language as Language];

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || currentText.error);
        return;
      }

      setIsCodeSent(true);
      setCountdown(180); // 3분
      setSuccessMessage(currentText.codeSent);
    } catch (error) {
      console.error('Error sending verification code:', error);
      setErrorMessage(currentText.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verification/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || currentText.invalidCode);
        return;
      }

      setSuccessMessage(`${currentText.success}${data.email}`);
      setIsCodeSent(false);
      setCountdown(0);
    } catch (error) {
      console.error('Error verifying code:', error);
      setErrorMessage(currentText.invalidCode);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-white p-6 pb-28">
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

        <form onSubmit={isCodeSent ? handleVerify : handleSendCode} className="space-y-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              {currentText.name}
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl border-gray-200 bg-white"
              placeholder={currentText.namePlaceholder}
              required
              disabled={isCodeSent}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {currentText.phone}
            </label>
            <div className="flex gap-2">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 flex-1 rounded-xl border-gray-200 bg-white"
                placeholder={currentText.phonePlaceholder}
                required
                disabled={isCodeSent}
              />
              {isCodeSent && countdown > 0 && (
                <Button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isLoading}
                  className="h-12 rounded-xl bg-gray-400 px-4 hover:bg-gray-500"
                >
                  {currentText.resendCode}
                </Button>
              )}
            </div>
          </div>

          {isCodeSent && (
            <>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {currentText.verificationCode}
                </label>
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="h-12 rounded-xl border-gray-200 bg-white"
                  placeholder={currentText.codePlaceholder}
                  maxLength={6}
                  required
                />
                {countdown > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    {currentText.timeRemaining}
                    <span className="font-semibold text-[#2ECC71]">
                      {formatTime(countdown)}
                    </span>
                  </p>
                )}
              </div>
            </>
          )}

          {errorMessage && (
            <div className="text-sm text-red-500">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || (isCodeSent && countdown === 0)}
            className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white shadow-lg shadow-[#2ECC71]/30 hover:from-[#27AE60] hover:to-[#229954]"
          >
            {isLoading
              ? isCodeSent
                ? currentText.verifying
                : currentText.sendingCode
              : isCodeSent
                ? currentText.verify
                : currentText.sendCode}
          </Button>
        </form>

        <Link
          href={AUTH_URLS.LOGIN}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#2ECC71] font-medium text-[#2ECC71] transition-colors hover:bg-[#2ECC71]/10"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentText.backToLogin}
        </Link>
      </div>
    </div>
  );
}
