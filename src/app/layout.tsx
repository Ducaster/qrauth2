import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QrProvider } from "./importsheet";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QR 인증 시스템 - WaveOn",
  description:
    "QR 코드를 스캔하여 데이터를 수집하고 Google Sheets에 저장하는 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <QrProvider>{children}</QrProvider>
      </body>
    </html>
  );
}
