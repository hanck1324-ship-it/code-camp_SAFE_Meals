import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/commons/stores/useAppStore';
import { useLogin } from '@/hooks/useLogin';
import { MAIN_URLS } from '@/commons/constants/url';

interface LoginForm {
  email: string;
  password: string;
}

export function useAuthLoginForm() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithEmail, loginWithOAuth, errorMessage, isLoading } =
    useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<LoginForm>({ mode: 'onChange' });

  // 이미 로그인된 사용자는 dashboard로 리다이렉트
  useEffect(() => {
    if (user) {
      router.replace(MAIN_URLS.DASHBOARD);
    }
  }, [user, router]);

  const onSubmit = handleSubmit(async (data) => {
    await loginWithEmail(data.email, data.password);
  });

  const handleSocialLogin = async (
    provider: 'google' | 'apple' | 'facebook'
  ) => {
    await loginWithOAuth(provider);
  };

  return {
    control,
    errors,
    onSubmit,
    isFormFilled: isValid,
    isLoading,
    showPassword,
    setShowPassword,
    handleSocialLogin,
    errorMessage,
    getValues,
  };
}
