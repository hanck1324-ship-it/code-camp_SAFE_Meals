import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from './_providers/auth-provider';
import { AnalyzeResultProvider } from '@/features/scan/context/analyze-result-context';
import Layout from '@/components/layout';
import { LanguageHydrationGuard } from '@/components/language-hydration-guard';
import { ToastContainer } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'SafeMeals',
  description: 'SafeMeals - 안전하게, 어디서나',
  manifest: '/manifest.json', // PWA 설정 연결
  icons: { apple: '/icon-192.png' }, // 아이폰 홈 화면 아이콘
};

// 📱 [필수] 모바일에서 화면 확대 방지 (앱처럼 느낌)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        // 📱 [필수] 터치 하이라이트 제거, 스크롤 튕김 방지, 전체 화면 꽉 채우기
        className="webkit-tap-highlight-transparent size-full touch-pan-y select-none overscroll-none bg-white antialiased"
      >
        <AuthProvider>
          <LanguageHydrationGuard>
            <AnalyzeResultProvider>
              <Layout>
                <div className="no-scrollbar flex-grow overflow-y-auto">
                  {children}
                </div>
              </Layout>
              <ToastContainer />
            </AnalyzeResultProvider>
          </LanguageHydrationGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
