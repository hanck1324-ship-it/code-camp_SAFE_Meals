'use client';

import dynamic from 'next/dynamic';
import { NextThemesProvider } from '@/commons/providers/next-themes/next-themes.provider';
import Layout from '@/components/layout';

const BottomNav = dynamic(
  () => import('@/components/bottom-nav').then((m) => m.BottomNav),
  { ssr: false }
);

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider>
      <Layout>
        {children}
        <BottomNav />
      </Layout>
    </NextThemesProvider>
  );
}
