'use client';

import React from 'react';
import { NextThemesProvider } from '@/commons/providers/next-themes/next-themes.provider';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * 프로젝트 전역 레이아웃
 *  - 헤더 / 푸터 / 내비게이션 등 공통 UI 포함
 *  - next-themes Provider 래핑
 */
export default function Layout({ children }: LayoutProps) {
  return (
    <NextThemesProvider>
      <div className="flex min-h-screen max-w-md mx-auto flex-col shadow-lg">
        <main className="flex-grow overflow-y-auto bg-white">{children}</main>

        <footer className="bg-gray-100 p-2 text-center text-xs">
          <p className="text-gray-500">© 2025 SAFE Meals</p>
        </footer>
      </div>
    </NextThemesProvider>
  );
}
