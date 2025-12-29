/**
 * 카메라 권한 에러 화면 컴포넌트
 */

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

export function CameraPermissionError() {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center text-white p-6">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <p className="mb-4">{t.cameraPermissionError}</p>
        <Button 
          variant="outline" 
          className="border-white text-white hover:bg-white/20"
          onClick={() => window.location.reload()}
        >
          새로고침
        </Button>
      </div>
    </div>
  );
}

