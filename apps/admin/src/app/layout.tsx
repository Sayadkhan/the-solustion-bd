import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "The Solutions BD Admin & POS Dashboard",
  description:
    "Omnichannel Point of Sale, multi-branch inventory, serial number warranty management, and outside-Dhaka COD deposit queue.",
};

import { Roboto } from "next/font/google";
import { Suspense } from "react";
import { PageLoader } from "@/components/page-loader";

const roboto = Roboto({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

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
      <body className={`${roboto.className} min-h-screen bg-background text-foreground antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<div className="p-6 w-full"><PageLoader title="Loading page content..." /></div>}>
            {children}
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
