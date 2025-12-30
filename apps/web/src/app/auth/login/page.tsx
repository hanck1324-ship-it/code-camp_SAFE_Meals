import { Suspense } from 'react';
import { AuthLogin } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          Loading...
        </div>
      }
    >
      <AuthLogin />
    </Suspense>
  );
}
