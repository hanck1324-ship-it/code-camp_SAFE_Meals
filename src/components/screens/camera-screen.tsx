'use client';

import { Camera, X, Zap } from 'lucide-react';
import { Language } from '@/lib/translations';

interface CameraScreenProps {
  onCapture?: () => void;
  onClose: () => void;
  language: Language;
  onCapturePhoto: () => void;
}

const cameraText = {
  ko: {
    title: '메뉴를 촬영하세요',
    subtitle: '메뉴판을 프레임 안에 맞춰주세요',
    capture: '촬영',
    flashOn: '플래시 켜기',
  },
  en: {
    title: 'Scan the Menu',
    subtitle: 'Align the menu within the frame',
    capture: 'Capture',
    flashOn: 'Flash On',
  },
  ja: {
    title: 'メニューをスキャン',
    subtitle: 'フレーム内にメニューを合わせてください',
    capture: '撮影',
    flashOn: 'フラッシュオン',
  },
  zh: {
    title: '扫描菜单',
    subtitle: '将菜单对准框内',
    capture: '拍摄',
    flashOn: '打开闪光灯',
  },
  es: {
    title: 'Escanear el menú',
    subtitle: 'Alinea el menú dentro del marco',
    capture: 'Capturar',
    flashOn: 'Flash activado',
  },
};

export function CameraScreen({
  onCapture,
  onClose,
  language,
  onCapturePhoto,
}: CameraScreenProps) {
  const t = cameraText[language];

  return (
    <div className="relative min-h-screen bg-black">
      {/* Mock Camera Viewfinder */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800">
        {/* Placeholder for camera feed */}
        <div className="flex h-full w-full items-center justify-center text-white/50">
          <Camera className="h-32 w-32" />
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-white">{t.title}</h2>
            <p className="text-sm text-white/70">{t.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      {/* Scanning Frame */}
      <div className="absolute inset-0 flex items-center justify-center p-12">
        <div className="relative h-96 w-full rounded-2xl border-4 border-[#2ECC71]">
          {/* Corner decorations */}
          <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-white" />
          <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-white" />
          <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-white" />
          <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-white" />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-12">
        <div className="flex items-center justify-between">
          {/* Flash Toggle */}
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20">
            <Zap className="h-6 w-6 text-white" />
          </button>

          {/* Capture Button */}
          <button
            onClick={onCapturePhoto}
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60]" />
          </button>

          {/* Spacer */}
          <div className="w-12" />
        </div>
      </div>
    </div>
  );
}
