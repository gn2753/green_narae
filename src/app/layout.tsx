import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { DataProvider } from "@/data/DataProvider";
import "@fontsource/jua/latin-400.css";
import "@fontsource/jua/korean-400.css";
import "@fontsource/noto-sans-kr/korean-400.css";
import "@fontsource/noto-sans-kr/korean-500.css";
import "@fontsource/noto-sans-kr/korean-700.css";
import "@fontsource/noto-sans-kr/korean-900.css";
import "@fontsource/noto-sans-kr/latin-400.css";
import "@fontsource/noto-sans-kr/latin-500.css";
import "@fontsource/noto-sans-kr/latin-700.css";
import "@fontsource/noto-sans-kr/latin-900.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "그린나래디자인 | 간판 디자인·시공", template: "%s | 그린나래디자인" },
  description: "상담·실측부터 시안 디자인, 제작, 시공까지 직접 하는 우리 동네 간판집",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "그린나래디자인",
    title: "그린나래디자인 | 간판 디자인·시공",
    description: "상담·실측부터 시안 디자인, 제작, 시공까지 직접 하는 우리 동네 간판집",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" >
      <body className="font-sans antialiased">
        <DataProvider>
          {children}
          <Toaster position="bottom-center" richColors mobileOffset={{ bottom: "calc(var(--mobile-bar-h) + 12px)" }} />
        </DataProvider>
      </body>
    </html>
  );
}
