'use client';

import { useRouter } from 'next/navigation';
import { HomeDashboard } from '@/components/home-dashboard';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <HomeDashboard
      onScanMenu={() => router.push('/scan')}
    />
  );
}
