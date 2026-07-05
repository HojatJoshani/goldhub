import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { PwaInstaller } from "@/components/pwa-installer";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "گلد هاب | پلتفرم مدیریت طلا و جواهر",
  description:
    "پلتفرم جامع مدیریت فروشگاه طلا و جواهرات - انبار، فروش، مشتریان، حسابداری و هوش مصنوعی",
  keywords: [
    "طلا",
    "جواهر",
    "مدیریت فروشگاه",
    "گلد هاب",
    "GoldHub",
    "POS",
    "صندوق فروش",
    "انبار طلا",
  ],
  authors: [{ name: "گروه توسعه آریا" }],
  creator: "گروه توسعه آریا",
  publisher: "گروه توسعه آریا",
  applicationName: "گلد هاب",
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "گلد هاب",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: [
      { url: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.webmanifest",
  appLinks: {
    web: {
      url: "https://goldhub.app",
      name: "گلد هاب",
      images: ["/icon-512.svg"],
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#D4A017" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="گلد هاب" />
        <meta name="application-name" content="گلد هاب" />
        <meta name="msapplication-TileColor" content="#D4A017" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#D4A017" />
        {/* Splash screen background */}
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${vazirmatn.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <PwaInstaller />
          <ServiceWorkerRegister />
          <Toaster />
          <SonnerToaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
