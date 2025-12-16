import { useState } from 'react';
import { Mail, Lock, Leaf, ChevronLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Language, translations } from '../../lib/translations';
import { LanguageSelector } from '../language-selector';

interface SignupScreenProps {
  onComplete: () => void;
  onBack: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function SignupScreen({ onComplete, onBack, language, onLanguageChange }: SignupScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const t = translations[language];

  const isValid = email.includes('@') && password.length >= 6;

  return (
    <div className="min-h-screen bg-white flex flex-col p-6">
      {/* Header with Back Button and Language Selector */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <LanguageSelector currentLanguage={language} onLanguageChange={onLanguageChange} />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="w-20 h-20 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-[#2ECC71]/20">
          <Leaf className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="mb-3">{t.createAccount}</h1>
        <p className="text-muted-foreground mb-8">
          {t.tagline}
        </p>

        {/* Form */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm mb-2 text-gray-700">{t.email}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="pl-12 h-14 rounded-xl border-2 border-gray-200 focus:border-[#2ECC71]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-gray-700">{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="pl-12 h-14 rounded-xl border-2 border-gray-200 focus:border-[#2ECC71]"
              />
            </div>
          </div>
        </div>

        {/* Get Started Button */}
        <Button
          onClick={onComplete}
          disabled={!isValid}
          className="w-full h-14 rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#229954] text-white shadow-lg shadow-[#2ECC71]/30 mb-4"
        >
          {t.getStarted}
        </Button>

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-600">
          {t.alreadyHaveAccount}{' '}
          <button className="text-[#2ECC71] hover:underline">
            {t.signIn}
          </button>
        </p>
      </div>
    </div>
  );
}