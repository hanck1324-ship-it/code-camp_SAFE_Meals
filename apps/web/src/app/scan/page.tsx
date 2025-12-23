'use client';

import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/auth/require-auth';
import { CameraScreen } from '@/features/scan/components/camera-view';
import { useLanguageStore } from '@/commons/stores/useLanguageStore';

export default function ScanPage() {
  const router = useRouter();
  const language = useLanguageStore((state) => state.language);

  const handleCapturePhoto = () => {
    // TODO: 실제 카메라 촬영 로직 구현
    console.log('Photo captured');
    // 촬영 후 결과 페이지로 이동
    router.push('/scan/result');
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <RequireAuth>
      <CameraScreen
        onClose={handleClose}
        language={language}
        onCapturePhoto={handleCapturePhoto}
      />
    </RequireAuth>
  );
}
