/**
 * 메뉴 스캔 결과 영역 컴포넌트
 * 크기: 375 x 300px
 */

import { FileText } from 'lucide-react';

export function MenuScanResultArea() {
  return (
    <div className="flex h-[300px] w-[375px] flex-col overflow-y-auto bg-white">
      {/* 결과 헤더 */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <FileText className="h-5 w-5 text-[#2ECC71]" />
        <span className="font-semibold text-gray-900">분석 결과</span>
      </div>

      {/* 결과 내용 플레이스홀더 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-500">분석 결과가 여기에 표시됩니다</p>
        <p className="text-xs text-gray-400">
          메뉴 이미지를 업로드하고 분석을 시작하세요
        </p>
      </div>
    </div>
  );
}
