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
  // 네이티브 앱에서는 리다이렉트하지 않음 (네이티브 라우팅이 처리)
  useEffect(() => {
    if (isAuthLoading) return;
    if (hasCheckedAuth) return;

    setHasCheckedAuth(true);

    // 네이티브 앱 감지: ReactNativeWebView 또는 isNativeApp 플래그 확인
    const isNativeApp = typeof window !== 'undefined' && (
      (window as any).ReactNativeWebView !== undefined ||
      (window as any).isNativeApp === true
    );

    console.log('[LoginForm] 환경 감지:', {
      hasReactNativeWebView: typeof window !== 'undefined' && (window as any).ReactNativeWebView !== undefined,
      hasIsNativeAppFlag: typeof window !== 'undefined' && (window as any).isNativeApp === true,
      isNativeApp,
      authUser: !!authUser
    });

    // 로그인 상태라면 대시보드로 이동 (웹 환경에서만)
    if (authUser && !isNativeApp) {
      console.log('[LoginForm] 웹 환경 - 이미 로그인됨, dashboard로 이동');
      router.replace(MAIN_URLS.DASHBOARD);
    } else if (authUser && isNativeApp) {
      console.log('[LoginForm] 네이티브 환경 - 이미 로그인됨, 리다이렉트 안 함 (네이티브가 처리)');
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
