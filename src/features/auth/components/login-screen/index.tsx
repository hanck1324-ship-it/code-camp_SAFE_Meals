import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Language, translations } from '@/lib/translations';
import { LanguageSelector } from '@/components/language-selector';
const logo = '/assets/6cfabb519ebdb3c306fc082668ba8f0b1cd872e9.png';

interface LoginScreenProps {
  onLogin: () => void;
  onSocialLogin: () => void;
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function LoginScreen({
  onLogin,
  onSocialLogin,
  language,
  onLanguageChange,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const t = translations[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  const handleSocialLogin = (provider: string) => {
    onSocialLogin();
  };

  /* loginText object unchanged for brevity */
  const loginText = translations.loginText; // assume exported elsewhere
  const currentText = loginText[language];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="mb-4 flex justify-end">
        <LanguageSelector
          currentLanguage={language}
          onLanguageChange={onLanguageChange}
        />
      </div>
      {/* ...rest original JSX omitted for brevity... */}
    </div>
  );
}
