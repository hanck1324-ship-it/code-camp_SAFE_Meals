'use client';

import dynamic from 'next/dynamic';
import { NextThemesProvider } from '@/commons/providers/next-themes/next-themes.provider';
import { AnalyzeResultProvider } from '@/features/scan/context/analyze-result-context';
import Layout from '@/components/layout';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider>
      <AnalyzeResultProvider>
        <Layout>{children}</Layout>
      </AnalyzeResultProvider>
    </NextThemesProvider>
  );
}
