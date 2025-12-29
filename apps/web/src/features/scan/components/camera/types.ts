/**
 * 카메라 관련 타입 정의
 */

export interface CameraScreenProps {
  onClose: () => void;
  onCapturePhoto: (imageSrc: string) => void;
  isProcessing?: boolean;
}

export type FacingMode = 'user' | 'environment';

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  capturedImage: string | null;
  flashOn: boolean;
  hasPermission: boolean | null;
  isStreaming: boolean;
  facingMode: FacingMode;
  handleCapture: () => void;
  handleRetake: () => void;
  toggleFlash: () => Promise<void>;
}

