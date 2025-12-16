'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/app/_providers/auth-provider';
import { HomeDashboard } from '@/components/home-dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  // 로그인되지 않았으면 로그인 페이지로
  useEffect(() => {
    if (!user) router.replace('/auth/login?redirect=/dashboard');
  }, [user, router]);

  if (!user) return null;

  return (
    <HomeDashboard onScanMenu={() => router.push('/scan')} />
  );
}
