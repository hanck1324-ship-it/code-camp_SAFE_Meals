/**
 * 메뉴 스캔 헤더 컴포넌트
 * 크기: 375 x 60px
 */

import { ArrowLeft } from 'lucide-react';

export function MenuScanHeader() {
  return (
    <header className="flex h-[60px] w-[375px] items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* 뒤로가기 버튼 */}
      <button className="flex h-10 w-10 items-center justify-center">
        <ArrowLeft className="h-6 w-6 text-gray-700" />
      </button>

      {/* 타이틀 */}
      <h1 className="text-lg font-semibold text-gray-900">메뉴 스캔</h1>

      {/* 우측 공간 (균형용) */}
      <div className="h-10 w-10" />
    </header>
  );
}
