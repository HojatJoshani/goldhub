import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "گلد هاب | پلتفرم مدیریت طلا و جواهر",
  description: "پلتفرم جامع مدیریت فروشگاه طلا و جواهرات - انبار، فروش، مشتریان، حسابداری و هوش مصنوعی",
  keywords: ["طلا", "جواهر", "مدیریت فروشگاه", "گلد هاب", "GoldHub", "POS"],
  authors: [{ name: "GoldHub" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
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
          <Toaster />
          <SonnerToaster position="top-left" />
        </ThemeProvider>
      </body>
    </html>
  );
}
