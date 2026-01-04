'use client';

import Layout from '@/components/layout';
import { LanguageHydrationGuard } from '@/components/language-hydration-guard';

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
