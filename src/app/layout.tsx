import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./_providers/auth-provider";
import dynamic from "next/dynamic";
import Layout from "@/commons/layout";

const BottomNav = dynamic(
  () => import("@/components/bottom-nav").then((m) => m.BottomNav),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "SafeMeals App Design",
  description: "SafeMeals - 안전하게, 어디서나",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="size-full bg-white">
        <AuthProvider>
          <Layout>
            <div className="flex-grow overflow-y-auto">{children}</div>
            <BottomNav />
          </Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
