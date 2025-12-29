/**
 * 스캔 프레임 오버레이 컴포넌트
 */

export function ScanningFrame() {
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none"
      style={{ 
        zIndex: 45, 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <div className="relative w-full h-96 border-4 border-[#2ECC71] rounded-2xl shadow-2xl">
        {/* 배경 반투명 오버레이로 프레임 강조 */}
        <div className="absolute inset-0 bg-black/10 rounded-2xl" />
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl shadow-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl shadow-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl shadow-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl shadow-lg" />
      </div>
    </div>
  );
}

