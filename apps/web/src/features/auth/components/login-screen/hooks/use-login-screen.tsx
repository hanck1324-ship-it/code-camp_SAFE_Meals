import { useState } from 'react';
import { Language } from '@/lib/translations';
import { useTranslation } from '@/hooks/useTranslation';
import { LOGIN_TEXT } from '../constants';

interface UseLoginScreenProps {
  propLanguage?: Language;
  onLogin: () => void;
  onSocialLogin: () => void;
}

export function useLoginScreen({
  propLanguage,
  onLogin,
  onSocialLogin,
}: UseLoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { language } = useTranslation();
  const currentLanguage = propLanguage || language;
  const currentText = LOGIN_TEXT[currentLanguage];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  const handleSocialLogin = (provider: string) => {
    onSocialLogin();
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return {
    // 상태
    email,
    password,
    showPassword,
    currentText,
    // 액션
    setEmail,
    setPassword,
    handleSubmit,
    handleSocialLogin,
    togglePasswordVisibility,
  };
}

