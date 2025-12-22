'use client';

import React from 'react';
import { NextThemesProvider } from '@/commons/providers/next-themes/next-themes.provider';
import styles from './styles.module.css';

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
      <div className={styles.container}>
        <main className={styles.main}>{children}</main>

        <footer className={styles.footer}>
          <p className={styles.footerText}>© 2025 SAFE Meals</p>
        </footer>
      </div>
    </NextThemesProvider>
  );
}
