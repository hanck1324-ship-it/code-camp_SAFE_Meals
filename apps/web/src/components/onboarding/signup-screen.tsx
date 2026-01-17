import { Mail, Lock, Leaf, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/hooks/useTranslation';

import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SignupScreenProps {
  onComplete: () => void;
  onBack: () => void;
}

export function SignupScreen({ onComplete, onBack }: SignupScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t } = useTranslation();

  const isValid = email.includes('@') && password.length >= 6;

  return (
    <div className="flex min-h-screen flex-col bg-white p-6">
      {/* Header with Back Button and Language Selector */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <LanguageSelector />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        {/* Logo */}
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/20">
          <Leaf className="h-10 w-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="mb-3">{t.createAccount}</h1>
        <p className="mb-8 text-muted-foreground">{t.tagline}</p>

        {/* Form */}
        <div className="mb-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-700">
              {t.email}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="h-14 rounded-xl border-2 border-gray-200 pl-12 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-700">
              {t.password}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="h-14 rounded-xl border-2 border-gray-200 pl-12 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Get Started Button */}
        <Button
          onClick={onComplete}
          disabled={!isValid}
          className="mb-4 h-14 w-full rounded-full bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30 hover:from-primary/90 hover:to-primary/70"
        >
          {t.getStarted}
        </Button>

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-600">
          {t.alreadyHaveAccount}{' '}
          <button className="text-primary hover:underline">{t.signIn}</button>
        </p>
      </div>
    </div>
  );
}
