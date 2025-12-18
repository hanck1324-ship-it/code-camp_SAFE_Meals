'use client';

import { useRouter } from 'next/navigation';
import { HomeDashboard } from '@/components/home-dashboard';
import { RequireAuth } from '@/components/auth/require-auth';
import { useHaccp } from '@/hooks/useHaccp'; // 1. 훅 불러오기

export default function DashboardPage() {
  const router = useRouter();
  const { haccpList, loading, error } = useHaccp(); // 2. 데이터 가져오기

  // 디버깅용 콘솔 로그
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard - HACCP 데이터:', {
      count: haccpList.length,
      loading,
      error,
      sample: haccpList[0],
    });
  }

  return (
    <RequireAuth>
      <HomeDashboard
        onScanMenu={() => router.push('/scan')}
        haccpList={haccpList} // 3. 데이터 넘겨주기
        isLoading={loading} // 4. 로딩 상태 넘겨주기
        error={error} // 5. 에러 상태 넘겨주기
      />
    </RequireAuth>
  );
}
