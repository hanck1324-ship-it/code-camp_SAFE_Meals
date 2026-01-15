'use client';

import { RequireAuth } from '@/components/auth/require-auth';
import { useTranslation } from '@/hooks/useTranslation';

export default function ScanPage() {
  const { t } = useTranslation();

  return (
    <RequireAuth>
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-[var(--color-text-primary)]">
            {t.scanFeatureComingSoon}
          </h1>
          <p className="text-[var(--color-text-secondary)]">{t.comingSoon}</p>
        </div>
      </div>
    </RequireAuth>
  );
}
