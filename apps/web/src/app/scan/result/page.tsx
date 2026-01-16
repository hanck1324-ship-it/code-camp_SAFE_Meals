'use client';

import { RequireAuth } from '@/components/auth/require-auth';
import { ScanResultScreen } from '@/features/scan/components/result-view';

export default function ScanResultPage() {
  return (
    <RequireAuth>
      <ScanResultScreen />
    </RequireAuth>
  );
}
