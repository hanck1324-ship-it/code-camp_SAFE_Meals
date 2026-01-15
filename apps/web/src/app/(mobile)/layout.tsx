'use client';

import { LanguageHydrationGuard } from '@/components/language-hydration-guard';
import Layout from '@/components/layout';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageHydrationGuard>
      <Layout>{children}</Layout>
    </LanguageHydrationGuard>
  );
}
