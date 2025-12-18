'use client';

import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/auth/require-auth';
import { ScanResultScreen } from '@/components/scan-result-screen';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';

export default function ScanResultPage() {
  const router = useRouter();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const handleBack = () => {
    router.back();
  };

  return (
    <RequireAuth>
      <ScanResultScreen
        onBack={handleBack}
        language={language}
        onLanguageChange={setLanguage}
      />
    </RequireAuth>
  );
}

