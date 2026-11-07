import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MainNavbar } from "@/components/navbar/main-navbar";
import { MobileBottomNav } from "@/components/navbar/mobile-bottom-nav";
import { MainFooter } from "@/components/footer/main-footer";
import { FloatingWidgets } from "@/components/floating-widgets";
import { TopProgressBar } from "@/components/top-progress-bar";
import { GtmAnalytics } from "@/components/analytics/gtm-analytics";

import { Hind_Siliguri, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Suspense } from "react";

const sans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex",
});

// Plex Sans has no Bangla, including the taka sign, so this supplies those glyphs.
const bangla = Hind_Siliguri({
  weight: ["400", "500", "600", "700"],
  subsets: ["bengali"],
  display: "swap",
  variable: "--font-bangla",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
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
    <html
      lang="en"
      className={`${sans.variable} ${bangla.variable} ${mono.variable}`}
      style={{ "--font-sans": "var(--font-plex), var(--font-bangla)" } as React.CSSProperties}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>
          <GtmAnalytics />
          <Suspense fallback={<div className="w-full h-[var(--header-height)] bg-card border-b border-border" />}>
            <MainNavbar />
          </Suspense>
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
