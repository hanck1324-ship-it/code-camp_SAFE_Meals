'use client';

import { useRouter } from 'next/navigation';

import { RequireAuth } from '@/components/auth/require-auth';
import { ScanResultScreen } from '@/features/scan/components/result-view';

export default function ScanResultPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <RequireAuth>
      <ScanResultScreen onBack={handleBack} />
    </RequireAuth>
  );
}
