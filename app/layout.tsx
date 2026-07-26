import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/src/shared/AppShell";

export const metadata: Metadata = {
  title: "Speech Quest | 영어 문장 생성 훈련",
  description: "표현을 떠올리고 문장을 직접 만드는 로컬 OPIc 말하기 훈련 앱",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
