import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSelector } from '@/components/language-selector';
import Image from 'next/image';
import { useLoginScreen } from './hooks/use-login-screen';

const logo = '/assets/6cfabb519ebdb3c306fc082668ba8f0b1cd872e9.png';

interface LoginScreenProps {
  onLogin: () => void;
  onSocialLogin: () => void;
}

export function LoginScreen({ onLogin, onSocialLogin }: LoginScreenProps) {
  const {
    email,
    password,
    showPassword,
    currentText,
    setEmail,
    setPassword,
    handleSubmit,
    handleSocialLogin,
    togglePasswordVisibility,
  } = useLoginScreen({
    onLogin,
    onSocialLogin,
  });

  return (
    <div
      className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6"
      data-testid="login-screen"
    >
      <div className="mb-4 flex justify-end">
        <LanguageSelector />
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-8 flex flex-col items-center sm:mb-12">
          <div className="mb-4 rounded-2xl bg-white p-4 shadow-lg sm:p-6">
            <Image
              src={logo}
              alt="SafeMeals Logo"
              width={160}
              height={160}
              className="object-contain"
              data-testid="login-logo"
            />
          </div>
          <p className="text-center text-sm text-muted-foreground sm:text-base">
            {currentText.subtitle}
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          data-testid="login-form"
        >
          <div>
            <label
              className="mb-2 flex items-center gap-2 text-sm"
              htmlFor="login-email"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              {currentText.email}
            </label>
            <div className="relative">
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-gray-200 bg-white"
                placeholder="you@example.com"
                required
                data-testid="login-email-input"
                aria-label={currentText.email}
              />
            </div>
          </div>
          <div>
            <label
              className="mb-2 flex items-center gap-2 text-sm"
              htmlFor="login-password"
            >
              <Lock className="h-4 w-4 text-muted-foreground" />
              {currentText.password}
            </label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-gray-200 bg-white pr-12"
                placeholder="••••••••"
                required
                data-testid="login-password-input"
                aria-label={currentText.password}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-gray-700"
                data-testid="login-password-toggle"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
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
            className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] text-white shadow-lg shadow-[#2ECC71]/30 hover:from-[#27AE60] hover:to-[#229954]"
            data-testid="login-submit-button"
          >
            {currentText.login}
          </Button>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="text-sm text-[#2ECC71] hover:underline"
              data-testid="login-forgot-email-button"
            >
              {currentText.forgotEmail}
            </button>
            <button
              type="button"
              className="text-sm text-[#2ECC71] hover:underline"
              data-testid="login-forgot-password-button"
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
            className="h-12 w-full rounded-full border-2 border-gray-200 transition-colors hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
            data-testid="login-social-google-button"
          >
            {currentText.continueWithGoogle}
          </button>
          <button
            onClick={() => handleSocialLogin('apple')}
            className="h-12 w-full rounded-full border-2 border-gray-200 transition-colors hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
            data-testid="login-social-apple-button"
          >
            {currentText.continueWithApple}
          </button>
          <button
            onClick={() => handleSocialLogin('facebook')}
            className="h-12 w-full rounded-full border-2 border-gray-200 transition-colors hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
            data-testid="login-social-facebook-button"
          >
            {currentText.continueWithFacebook}
          </button>
        </div>
      </div>
    </div>
  );
}
