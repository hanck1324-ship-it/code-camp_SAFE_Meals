'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/commons/stores/useAppStore';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * 인증이 필요한 페이지를 보호하는 컴포넌트
 * 사용자가 로그인하지 않은 경우 로그인 페이지로 리다이렉트합니다.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      // 현재 경로를 redirect 파라미터로 전달하여 로그인 후 원래 페이지로 돌아올 수 있도록 함
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [user, router, pathname]);

  // 로그인하지 않은 경우 아무것도 렌더링하지 않음
  if (!user) {
    return null;
  }

  return <>{children}</>;
}





