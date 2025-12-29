'use client';

import React from 'react';
import { Controller } from 'react-hook-form';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input-legacy';
import { Button } from '@/components/ui/button-legacy';
import { useAuthLoginForm } from './hooks/index.form.hook';
import { usePasswordReset } from './hooks/usePasswordReset';
import { useEmailFind } from './hooks/useEmailFind';
import { AUTH_URLS } from '@/commons/constants/url';
import { LanguageSelector } from '@/components/language-selector';
import { useTranslation } from '@/hooks/useTranslation';
import { Language } from '@/lib/translations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { User, Phone } from 'lucide-react';

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

  const {
    isDialogOpen,
    email: resetEmail,
    setEmail: setResetEmail,
    isLoading: isResetLoading,
    errorMessage: resetErrorMessage,
    successMessage: resetSuccessMessage,
    openDialog: openPasswordResetDialog,
    closeDialog: closePasswordResetDialog,
    sendResetEmail,
  } = usePasswordReset();

  const {
    isDialogOpen: isEmailFindDialogOpen,
    step: emailFindStep,
    name: emailFindName,
    setName: setEmailFindName,
    phone: emailFindPhone,
    setPhone: setEmailFindPhone,
    verificationCode,
    setVerificationCode,
    isLoading: isEmailFindLoading,
    errorMessage: emailFindErrorMessage,
    successMessage: emailFindSuccessMessage,
    foundEmail,
    openDialog: openEmailFindDialog,
    closeDialog: closeEmailFindDialog,
    sendVerificationCode,
    verifyCode,
    setStep: setEmailFindStep,
  } = useEmailFind();

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
      passwordResetTitle: string;
      passwordResetDescription: string;
      passwordResetEmailPlaceholder: string;
      passwordResetSubmit: string;
      passwordResetCancel: string;
      preparing: string;
      emailFindTitle: string;
      emailFindDescription: string;
      emailFindNameLabel: string;
      emailFindPhoneLabel: string;
      emailFindNamePlaceholder: string;
      emailFindPhonePlaceholder: string;
      emailFindSubmit: string;
      emailFindVerifyTitle: string;
      emailFindVerifyDescription: string;
      emailFindCodeLabel: string;
      emailFindCodePlaceholder: string;
      emailFindVerifySubmit: string;
      emailFindResultTitle: string;
      emailFindResultDescription: string;
      emailFindFoundEmail: string;
      emailFindClose: string;
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
      passwordResetTitle: '비밀번호 재설정',
      passwordResetDescription:
        '가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.',
      passwordResetEmailPlaceholder: '이메일 주소',
      passwordResetSubmit: '재설정 메일 발송',
      passwordResetCancel: '취소',
      preparing: '준비 중입니다',
      emailFindTitle: '이메일 찾기',
      emailFindDescription:
        '가입하신 이름과 전화번호를 입력하시면 인증 코드를 발송해드립니다.',
      emailFindNameLabel: '이름',
      emailFindPhoneLabel: '전화번호',
      emailFindNamePlaceholder: '이름을 입력하세요',
      emailFindPhonePlaceholder: '010-1234-5678',
      emailFindSubmit: '인증 코드 발송',
      emailFindVerifyTitle: '인증 코드 입력',
      emailFindVerifyDescription: 'SMS로 발송된 6자리 인증 코드를 입력해주세요.',
      emailFindCodeLabel: '인증 코드',
      emailFindCodePlaceholder: '000000',
      emailFindVerifySubmit: '인증 확인',
      emailFindResultTitle: '이메일 찾기 완료',
      emailFindResultDescription: '등록하신 이메일 주소입니다.',
      emailFindFoundEmail: '이메일',
      emailFindClose: '닫기',
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
      passwordResetTitle: 'Reset Password',
      passwordResetDescription:
        'Enter your email address and we will send you a password reset link.',
      passwordResetEmailPlaceholder: 'Email address',
      passwordResetSubmit: 'Send Reset Email',
      passwordResetCancel: 'Cancel',
      preparing: 'Coming soon',
      emailFindTitle: 'Find Email',
      emailFindDescription:
        'Enter your name and phone number to receive a verification code.',
      emailFindNameLabel: 'Name',
      emailFindPhoneLabel: 'Phone Number',
      emailFindNamePlaceholder: 'Enter your name',
      emailFindPhonePlaceholder: '010-1234-5678',
      emailFindSubmit: 'Send Verification Code',
      emailFindVerifyTitle: 'Enter Verification Code',
      emailFindVerifyDescription: 'Please enter the 6-digit verification code sent via SMS.',
      emailFindCodeLabel: 'Verification Code',
      emailFindCodePlaceholder: '000000',
      emailFindVerifySubmit: 'Verify',
      emailFindResultTitle: 'Email Found',
      emailFindResultDescription: 'Your registered email address.',
      emailFindFoundEmail: 'Email',
      emailFindClose: 'Close',
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
      passwordResetTitle: 'パスワードリセット',
      passwordResetDescription:
        'メールアドレスを入力してください。パスワードリセットリンクをお送りします。',
      passwordResetEmailPlaceholder: 'メールアドレス',
      passwordResetSubmit: 'リセットメールを送信',
      passwordResetCancel: 'キャンセル',
      preparing: '準備中です',
      emailFindTitle: 'メールアドレス検索',
      emailFindDescription:
        '登録されたお名前と電話番号を入力すると、認証コードを送信します。',
      emailFindNameLabel: 'お名前',
      emailFindPhoneLabel: '電話番号',
      emailFindNamePlaceholder: 'お名前を入力してください',
      emailFindPhonePlaceholder: '010-1234-5678',
      emailFindSubmit: '認証コード送信',
      emailFindVerifyTitle: '認証コード入力',
      emailFindVerifyDescription: 'SMSで送信された6桁の認証コードを入力してください。',
      emailFindCodeLabel: '認証コード',
      emailFindCodePlaceholder: '000000',
      emailFindVerifySubmit: '認証確認',
      emailFindResultTitle: 'メールアドレス検索完了',
      emailFindResultDescription: '登録されたメールアドレスです。',
      emailFindFoundEmail: 'メールアドレス',
      emailFindClose: '閉じる',
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
      passwordResetTitle: '重置密码',
      passwordResetDescription: '输入您的电子邮件地址，我们将向您发送密码重置链接。',
      passwordResetEmailPlaceholder: '电子邮件地址',
      passwordResetSubmit: '发送重置邮件',
      passwordResetCancel: '取消',
      preparing: '即将推出',
      emailFindTitle: '查找电子邮件',
      emailFindDescription: '请输入您的姓名和电话号码，我们将发送验证码。',
      emailFindNameLabel: '姓名',
      emailFindPhoneLabel: '电话号码',
      emailFindNamePlaceholder: '请输入您的姓名',
      emailFindPhonePlaceholder: '010-1234-5678',
      emailFindSubmit: '发送验证码',
      emailFindVerifyTitle: '输入验证码',
      emailFindVerifyDescription: '请输入通过短信发送的6位验证码。',
      emailFindCodeLabel: '验证码',
      emailFindCodePlaceholder: '000000',
      emailFindVerifySubmit: '验证',
      emailFindResultTitle: '电子邮件查找完成',
      emailFindResultDescription: '您注册的电子邮件地址。',
      emailFindFoundEmail: '电子邮件',
      emailFindClose: '关闭',
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
      passwordResetTitle: 'Restablecer contraseña',
      passwordResetDescription:
        'Ingrese su dirección de correo electrónico y le enviaremos un enlace para restablecer su contraseña.',
      passwordResetEmailPlaceholder: 'Dirección de correo electrónico',
      passwordResetSubmit: 'Enviar correo de restablecimiento',
      passwordResetCancel: 'Cancelar',
      preparing: 'Próximamente',
      emailFindTitle: 'Buscar correo electrónico',
      emailFindDescription:
        'Ingrese su nombre y número de teléfono para recibir un código de verificación.',
      emailFindNameLabel: 'Nombre',
      emailFindPhoneLabel: 'Número de teléfono',
      emailFindNamePlaceholder: 'Ingrese su nombre',
      emailFindPhonePlaceholder: '010-1234-5678',
      emailFindSubmit: 'Enviar código de verificación',
      emailFindVerifyTitle: 'Ingresar código de verificación',
      emailFindVerifyDescription:
        'Por favor, ingrese el código de verificación de 6 dígitos enviado por SMS.',
      emailFindCodeLabel: 'Código de verificación',
      emailFindCodePlaceholder: '000000',
      emailFindVerifySubmit: 'Verificar',
      emailFindResultTitle: 'Correo electrónico encontrado',
      emailFindResultDescription: 'Su dirección de correo electrónico registrada.',
      emailFindFoundEmail: 'Correo electrónico',
      emailFindClose: 'Cerrar',
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
            className="flex h-12 w-full items-center justify-center rounded-full border-2 border-[#2ECC71] font-medium text-[#2ECC71] transition-colors hover:bg-[#2ECC71]/10"
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
              onClick={openEmailFindDialog}
              data-testid="forgot-email-button"
            >
              {currentText.forgotEmail}
            </button>
            <button
              type="button"
              className="text-sm text-[#2ECC71] hover:underline"
              onClick={openPasswordResetDialog}
              data-testid="forgot-password-button"
            >
              {currentText.forgot}
            </button>
          </div>
        </form>

        {/* 비밀번호 재설정 다이얼로그 */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closePasswordResetDialog()}>
          <DialogContent data-testid="password-reset-dialog">
            <DialogHeader>
              <DialogTitle>{currentText.passwordResetTitle}</DialogTitle>
              <DialogDescription>
                {currentText.passwordResetDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {currentText.email}
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={currentText.passwordResetEmailPlaceholder}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="password-reset-email-input"
                />
              </div>
              {resetErrorMessage && (
                <p
                  className="text-sm text-red-500"
                  data-testid="password-reset-error-message"
                >
                  {resetErrorMessage}
                </p>
              )}
              {resetSuccessMessage && (
                <p
                  className="text-sm text-green-600"
                  data-testid="password-reset-success-message"
                >
                  {resetSuccessMessage}
                </p>
              )}
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={closePasswordResetDialog}
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                data-testid="password-reset-cancel-button"
              >
                {currentText.passwordResetCancel}
              </button>
              <button
                type="button"
                onClick={sendResetEmail}
                disabled={isResetLoading}
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#2ECC71] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#27AE60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                data-testid="password-reset-submit-button"
              >
                {isResetLoading ? '발송 중...' : currentText.passwordResetSubmit}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 이메일 찾기 다이얼로그 */}
        <Dialog
          open={isEmailFindDialogOpen}
          onOpenChange={(open) => !open && closeEmailFindDialog()}
        >
          <DialogContent
            data-testid="email-find-dialog"
            className="max-w-md"
          >
            {emailFindStep === 'input' && (
              <>
                <DialogHeader>
                  <DialogTitle>{currentText.emailFindTitle}</DialogTitle>
                  <DialogDescription>
                    {currentText.emailFindDescription}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {currentText.emailFindNameLabel}
                    </label>
                    <input
                      type="text"
                      value={emailFindName}
                      onChange={(e) => setEmailFindName(e.target.value)}
                      placeholder={currentText.emailFindNamePlaceholder}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      data-testid="email-find-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {currentText.emailFindPhoneLabel}
                    </label>
                    <input
                      type="tel"
                      value={emailFindPhone}
                      onChange={(e) => setEmailFindPhone(e.target.value)}
                      placeholder={currentText.emailFindPhonePlaceholder}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      data-testid="email-find-phone-input"
                    />
                  </div>
                  {emailFindErrorMessage && (
                    <p
                      className="text-sm text-red-500"
                      data-testid="email-find-error-message"
                    >
                      {emailFindErrorMessage}
                    </p>
                  )}
                  {emailFindSuccessMessage && (
                    <p
                      className="text-sm text-green-600"
                      data-testid="email-find-success-message"
                    >
                      {emailFindSuccessMessage}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <button
                    type="button"
                    onClick={closeEmailFindDialog}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    data-testid="email-find-cancel-button"
                  >
                    {currentText.passwordResetCancel}
                  </button>
                  <button
                    type="button"
                    onClick={sendVerificationCode}
                    disabled={isEmailFindLoading}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-[#2ECC71] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#27AE60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    data-testid="email-find-submit-button"
                  >
                    {isEmailFindLoading
                      ? '발송 중...'
                      : currentText.emailFindSubmit}
                  </button>
                </DialogFooter>
              </>
            )}

            {emailFindStep === 'verify' && (
              <>
                <DialogHeader>
                  <DialogTitle>{currentText.emailFindVerifyTitle}</DialogTitle>
                  <DialogDescription>
                    {currentText.emailFindVerifyDescription}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {currentText.emailFindCodeLabel}
                    </label>
                    <InputOTP
                      maxLength={6}
                      value={verificationCode}
                      onChange={(value) => setVerificationCode(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {emailFindErrorMessage && (
                    <p
                      className="text-sm text-red-500"
                      data-testid="email-find-verify-error-message"
                    >
                      {emailFindErrorMessage}
                    </p>
                  )}
                  {emailFindSuccessMessage && (
                    <p
                      className="text-sm text-green-600"
                      data-testid="email-find-verify-success-message"
                    >
                      {emailFindSuccessMessage}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <button
                    type="button"
                    onClick={() => setEmailFindStep('input')}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    data-testid="email-find-back-button"
                  >
                    뒤로
                  </button>
                  <button
                    type="button"
                    onClick={verifyCode}
                    disabled={isEmailFindLoading || verificationCode.length !== 6}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-[#2ECC71] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#27AE60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    data-testid="email-find-verify-button"
                  >
                    {isEmailFindLoading
                      ? '확인 중...'
                      : currentText.emailFindVerifySubmit}
                  </button>
                </DialogFooter>
              </>
            )}

            {emailFindStep === 'result' && (
              <>
                <DialogHeader>
                  <DialogTitle>{currentText.emailFindResultTitle}</DialogTitle>
                  <DialogDescription>
                    {currentText.emailFindResultDescription}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {currentText.emailFindFoundEmail}
                    </label>
                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm">
                      {foundEmail || '이메일을 찾을 수 없습니다.'}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <button
                    type="button"
                    onClick={closeEmailFindDialog}
                    className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#2ECC71] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#27AE60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    data-testid="email-find-close-button"
                  >
                    {currentText.emailFindClose}
                  </button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

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
