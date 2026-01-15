'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/app/_providers/auth-provider';

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
  const { user, isAuthLoading } = useAuth();

  useEffect(() => {
    // 로딩 중이면 아직 리다이렉트하지 않음
    if (isAuthLoading) return;

    if (!user) {
      // 현재 경로를 redirect 파라미터로 전달하여 로그인 후 원래 페이지로 돌아올 수 있도록 함
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [user, isAuthLoading, router, pathname]);

  // 로딩 중이면 로딩 UI 표시
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#2ECC71]" />
      </div>
    );
  }

  // 로그인하지 않은 경우 아무것도 렌더링하지 않음
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
