'use client';

import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/commons/components/button';
import { Input } from '@/commons/components/input';
import { Language } from '@/lib/translations';
import Image from 'next/image';
import logo from '@/assets/6cfabb519ebdb3c306fc082668ba8f0b1cd872e9.png';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/auth-provider';
import { LanguageSelector } from '@/components/language-selector';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  searchParams?: { redirect?: string };
}

export default function LoginPage({ searchParams }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { language } = useTranslation();

  const loginText: Record<Language, {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    login: string;
    or: string;
    signup: string;
    forgot: string;
    continueWithGoogle: string;
    continueWithApple: string;
    continueWithFacebook: string;
  }> = {
    ko: {
      title: 'SafeMeals에 로그인',
      subtitle: '안전한 식사를 시작하세요',
      email: '이메일',
      password: '비밀번호',
      login: '로그인',
      or: '또는',
      signup: '회원가입',
      forgot: '비밀번호를 잊으셨나요?',
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
      continueWithGoogle: 'Continuar con Google',
      continueWithApple: 'Continuar con Apple',
      continueWithFacebook: 'Continuar con Facebook',
    },
  } as const;

  const currentText = loginText[language];

  const router = useRouter();

  const handleSocialLogin = (provider: string) => {
    // TODO: OAuth flow
    alert(`${provider} login is not implemented yet.`);
  };
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      const redirectTo = searchParams?.redirect || '/dashboard';
      router.replace(redirectTo);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-6 pb-28">
      <div className="flex justify-end mb-4">
        <LanguageSelector />
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="flex flex-col items-center mb-12">
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-4">
              <Image src={logo} alt="SafeMeals Logo" width={128} height={128} className="object-contain" />
            </div>
          <p className="text-muted-foreground text-center">{currentText.subtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">{currentText.email}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 rounded-xl h-12 bg-white border-gray-200"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">{currentText.password}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 pr-11 rounded-xl h-12 bg-white border-gray-200"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white h-12 rounded-full shadow-lg shadow-[#2ECC71]/30"
          >
            {currentText.login}
          </Button>
        
          <button
            type="button"
            className="text-sm text-[#2ECC71] hover:underline"
          >
            {currentText.forgot}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-muted-foreground">{currentText.or}</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin('google')}
            className="w-full h-12 rounded-full border-2 border-gray-200 hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
          >
            {currentText.continueWithGoogle}
          </button>
          <button
            onClick={() => handleSocialLogin('apple')}
            className="w-full h-12 rounded-full border-2 border-gray-200 hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
          >
            {currentText.continueWithApple}
          </button>
          <button
            onClick={() => handleSocialLogin('facebook')}
            className="w-full h-12 rounded-full border-2 border-gray-200 hover:border-[#2ECC71] hover:bg-[#2ECC71]/5"
          >
            {currentText.continueWithFacebook}
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          {currentText.signup === 'Sign Up' ? "Don't have an account? " : '계정이 없으신가요? '}
          <button
            type="button"
            onClick={() => router.push('/auth/signup')}
            className="text-[#2ECC71] hover:underline"
          >
            {currentText.signup}
          </button>
        </p>
      </div>
    </div>
  );
}
