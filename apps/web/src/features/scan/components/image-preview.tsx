'use client';

import { Check, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Language } from '@/lib/translations';

interface ImagePreviewProps {
  imageSrc: string;
  language: Language;
  onRetake: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

const previewText = {
  ko: {
    title: '사진 확인',
    retake: '다시 촬영',
    usePhoto: '사용하기',
  },
  en: {
    title: 'Photo Preview',
    retake: 'Retake',
    usePhoto: 'Use Photo',
  },
  ja: {
    title: '写真確認',
    retake: '再撮影',
    usePhoto: '使用する',
  },
  zh: {
    title: '照片预览',
    retake: '重拍',
    usePhoto: '使用照片',
  },
  es: {
    title: 'Vista Previa',
    retake: 'Volver a tomar',
    usePhoto: 'Usar foto',
  },
};

export function ImagePreview({
  imageSrc,
  language,
  onRetake,
  onConfirm,
  onClose,
}: ImagePreviewProps) {
  const t = previewText[language];

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black">
      {/* 이미지 영역 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <img 
          src={imageSrc} 
          alt="Captured" 
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>

      {/* 상단 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-30 p-6 pt-12 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div className="w-full text-center">
            <h2 className="text-white font-bold text-lg">{t.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="absolute right-6 top-12 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition-colors hover:bg-black/60"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      {/* 하단 컨트롤 바 */}
      <div className="fixed bottom-20 left-0 right-0 z-[60] bg-gradient-to-t from-black via-black/80 to-transparent p-8 pb-4">
        <div className="flex items-center justify-center gap-6 px-4">
          <Button
            onClick={onRetake}
            className="h-14 flex-1 rounded-2xl bg-gray-600 text-lg font-semibold text-white hover:bg-gray-700"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            {t.retake}
          </Button>
          <Button
            onClick={onConfirm}
            className="h-14 flex-1 rounded-2xl bg-[#2ECC71] text-lg font-semibold text-white hover:bg-[#27AE60]"
          >
            <Check className="mr-2 h-5 w-5" />
            {t.usePhoto}
          </Button>
        </div>
      </div>
    </div>
  );
}

