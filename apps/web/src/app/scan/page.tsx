'use client';

import { RequireAuth } from '@/components/auth/require-auth';

export default function ScanPage() {
  return (
    <RequireAuth>
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            스캔 기능 준비 중
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            곧 만나보실 수 있습니다.
          </p>
        </div>
      </div>
    </RequireAuth>
  );
}
