/**
 * 카메라 비디오 스트림 뷰 컴포넌트
 */

import { Camera } from 'lucide-react';

interface CameraVideoViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
  hasPermission: boolean | null;
  PermissionErrorComponent: React.ComponentType;
}

export function CameraVideoView({
  videoRef,
  isStreaming,
  hasPermission,
  PermissionErrorComponent,
}: CameraVideoViewProps) {
  if (hasPermission === false) {
    return <PermissionErrorComponent />;
  }

  return (
    <>
      {/* 로딩 중일 때 카메라 아이콘 표시 */}
      {!isStreaming && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800">
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <Camera className="w-32 h-32" />
          </div>
        </div>
      )}
      {/* 실제 카메라 비디오 - 가장 아래 레이어, pointer-events-none으로 클릭 이벤트 차단 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover pointer-events-none"
        style={{ 
          zIndex: 1, 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    </>
  );
}

