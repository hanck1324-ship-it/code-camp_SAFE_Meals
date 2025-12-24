import { Camera, X, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Language } from '../../lib/translations';

interface CameraScreenProps {
  onCapture: () => void;
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

export function CameraScreen({ onCapture, onClose, language, onCapturePhoto }: CameraScreenProps) {
  const t = cameraText[language];

  return (
    <div className="relative min-h-screen bg-black">
      {/* Mock Camera Viewfinder */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800">
        {/* Placeholder for camera feed */}
        <div className="w-full h-full flex items-center justify-center text-white/50">
          <Camera className="w-32 h-32" />
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white mb-1">{t.title}</h2>
            <p className="text-white/70 text-sm">{t.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Scanning Frame */}
      <div className="absolute inset-0 flex items-center justify-center p-12">
        <div className="relative w-full h-96 border-4 border-[#2ECC71] rounded-2xl">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-12">
        <div className="flex items-center justify-between">
          {/* Flash Toggle */}
          <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
            <Zap className="w-6 h-6 text-white" />
          </button>

          {/* Capture Button */}
          <button
            onClick={onCapturePhoto}
            className="relative w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#27AE60]" />
          </button>

          {/* Spacer */}
          <div className="w-12" />
        </div>
      </div>
    </div>
  );
}