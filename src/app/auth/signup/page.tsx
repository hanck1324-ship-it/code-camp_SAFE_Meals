'use client';

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/auth-provider';
import AuthSignup from '@/components/auth-signup';

export default function SignupPage() {
  const { user } = useAuth();
  const router = useRouter();

  // 로그인되어 있으면 대시보드로
  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  if (user) return null;
  return <AuthSignup />;
}
