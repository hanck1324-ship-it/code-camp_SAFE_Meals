"use client";

import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';

export function ConditionalBottomNav() {
  const pathname = usePathname();

  // 하단 네비게이션을 숨길 페이지 경로들
  const hideNavPaths = [
    '/auth/login',
    '/auth/signup',
    '/onboarding',
  ];

  // 현재 경로가 숨김 목록에 포함되는지 확인
  const shouldHideNav = hideNavPaths.some(path => pathname?.startsWith(path));

  // 숨겨야 하는 페이지면 null 반환
  if (shouldHideNav) {
    return null;
  }

  return <BottomNav />;
}

