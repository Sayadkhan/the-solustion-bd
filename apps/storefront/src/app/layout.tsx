import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MainNavbar } from "@/components/navbar/main-navbar";
import { MobileBottomNav } from "@/components/navbar/mobile-bottom-nav";
import { MainFooter } from "@/components/footer/main-footer";
import { FloatingWidgets } from "@/components/floating-widgets";
import { TopProgressBar } from "@/components/top-progress-bar";

import { Roboto } from "next/font/google";
import { Suspense } from "react";

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "The Solutions BD | Bangladesh's High-Performance PC & Tech Mega Store",
  description:
    "Buy original Intel & AMD processors, RTX graphics cards, gaming motherboards, RAM, and SSDs with official box serial number warranty and instant cash discount in Bangladesh.",
  keywords: [
    "PC Builder Bangladesh",
    "The Solutions BD",
    "Computer components BD",
    "Ryzen 9000 BD price",
    "RTX 4080 price in Bangladesh",
    "Gaming PC Bangladesh",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;0,900;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${roboto.className} min-h-screen flex flex-col antialiased selection:bg-blue-600/20 selection:text-blue-500 font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>
          <MainNavbar />
          <main className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
          <MobileBottomNav />
          <FloatingWidgets />
          <MainFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
