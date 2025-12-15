'use client';

import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/commons/components/button';
import { Input } from '@/commons/components/input';
import { Language, translations } from '@/lib/translations';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/commons/stores/useAppStore';
import { LanguageSelector } from '@/components/language-selector';

interface Props {
  searchParams?: { redirect?: string };
}

export default function LoginPage({ searchParams }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  const t = translations[language];
  const currentText = {
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
  }[language];

  const router = useRouter();
  const login = useAppStore((s) => s.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // simple mock auth
    login({ email });
    const redirect = searchParams?.redirect || '/dashboard';
    router.replace(redirect);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col p-6">
      <div className="flex justify-end mb-4">
        <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="flex flex-col items-center mb-12">
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
          <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 rounded-full">
            {currentText.login}
          </Button>
        </form>
      </div>
    </div>
  );
}
