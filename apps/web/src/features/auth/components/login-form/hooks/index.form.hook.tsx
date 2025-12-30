import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/useLogin';
import { useAuth } from '@/app/_providers/auth-provider';
import { MAIN_URLS } from '@/commons/constants/url';

interface LoginForm {
  email: string;
  password: string;
}

export function useAuthLoginForm() {
  const router = useRouter();
  const { user: authUser, isAuthLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const { loginWithEmail, loginWithOAuth, errorMessage, isLoading } =
    useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<LoginForm>({ mode: 'onChange' });

  // 이미 로그인된 사용자는 dashboard로 리다이렉트
  // 단, 최초 로딩 시 한 번만 체크
  useEffect(() => {
    if (isAuthLoading) return;
    if (hasCheckedAuth) return;

    setHasCheckedAuth(true);

    // 로그인 상태라면 대시보드로 이동
    if (authUser) {
      router.replace(MAIN_URLS.DASHBOARD);
    }
  }, [authUser, isAuthLoading, hasCheckedAuth, router]);

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
