import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from './_providers/auth-provider';
import Layout from '@/components/layout';
import { ConditionalBottomNav } from '@/commons/onboarding/conditional-bottom-nav';

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
        className="size-full bg-white select-none touch-pan-y antialiased webkit-tap-highlight-transparent overscroll-none"
      >
        <AuthProvider>
          <Layout>
            <div className="flex-grow overflow-y-auto no-scrollbar">
              {children}
            </div>
            <ConditionalBottomNav />
          </Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
