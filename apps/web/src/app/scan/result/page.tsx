'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/auth/require-auth';
import { ScanResultScreen } from '@/features/scan/components/result-view';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';

export default function ScanResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [scanData, setScanData] = useState<any>(null);

  useEffect(() => {
    // 쿼리 파라미터에서 결과 데이터 가져오기
    const key = searchParams.get('key');
    if (key) {
      const storedData = sessionStorage.getItem(key);
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setScanData(parsed);
          // 사용 후 삭제
          sessionStorage.removeItem(key);
        } catch (error) {
          console.error('결과 데이터 파싱 오류:', error);
        }
      }
    }
    
    // 이미지 데이터도 가져오기
    const imageKey = searchParams.get('imageKey');
    if (imageKey) {
      const imageData = sessionStorage.getItem(imageKey);
      if (imageData) {
        // 이미지 데이터를 scanData에 추가
        setScanData((prev) => ({
          ...prev,
          capturedImage: imageData,
        }));
        sessionStorage.removeItem(imageKey);
      }
    }
  }, [searchParams]);

  const handleBack = () => {
    router.back();
  };

  return (
    <RequireAuth>
      <ScanResultScreen
        onBack={handleBack}
        language={language}
        onLanguageChange={setLanguage}
        scanData={scanData}
      />
    </RequireAuth>
  );
}
