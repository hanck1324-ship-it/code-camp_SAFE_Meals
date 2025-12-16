'use client';

import { useRouter } from 'next/navigation';
import { HomeDashboard } from '@/components/home-dashboard';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';

export default function DashboardPage() {
  const router = useRouter();

  // 글로벌 언어 스토어에서 현재 언어와 변경 함수를 가져옵니다.
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  return (
    <HomeDashboard
      language={language}
      onLanguageChange={setLanguage}
      onScanMenu={() => router.push('/scan')}
    />
  );
}
