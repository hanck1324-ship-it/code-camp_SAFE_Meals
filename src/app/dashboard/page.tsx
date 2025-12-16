'use client';

import { useRouter } from 'next/navigation';
import { HomeDashboard } from '@/components/home-dashboard';
import { RequireAuth } from '@/components/auth/require-auth';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <RequireAuth>
      <HomeDashboard
        onScanMenu={() => router.push('/scan')}
      />
    </RequireAuth>
  );
}
