import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/use-auth";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { GlobalMarketTicker } from "@/components/layout/GlobalMarketTicker";
import { NotificationPopup } from "@/components/layout/NotificationPopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Portfolio Manager Pro | نظام إدارة الاستثمار",
  description: "منصة احترافية لإدارة المحافظ الاستثمارية وتحليل الأسهم والصناديق مع الذكاء الاصطناعي",
  keywords: ["استثمار", "أسهم", "محفظة", "تحليل", "AI", "تداول", "صناديق", "سندات"],
  authors: [{ name: "Faisal Mohammed" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Portfolio Manager Pro",
    description: "منصة احترافية لإدارة المحافظ الاستثمارية",
    type: "website",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} font-sans antialiased bg-background text-foreground`}
        style={{ fontFamily: "'Cairo', var(--font-geist-sans), sans-serif" }}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="classic-light"
          themes={['classic-light', 'classic-dark', 'premium-light', 'premium-dark', 'ocean-blue', 'emerald-green', 'midnight', 'royal-red']}
          disableTransitionOnChange
        >
          <AuthProvider>
            <AuthGuard>
              <GlobalMarketTicker />
              {children}
            </AuthGuard>
          </AuthProvider>
          <Toaster />
          <NotificationPopup />
        </ThemeProvider>
      </body>
    </html>
  );
}
