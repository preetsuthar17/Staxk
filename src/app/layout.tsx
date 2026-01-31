import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SWRProvider } from "@/lib/swr-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Staxk",
  description: "Project management and team collaboration platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      style={{ colorScheme: "light dark" }}
      suppressHydrationWarning
    >
      <head>
        <meta
          content="#fafafa"
          media="(prefers-color-scheme: light)"
          name="theme-color"
        />
        <meta
          content="#262626"
          media="(prefers-color-scheme: dark)"
          name="theme-color"
        />
        <link href="https://api.dicebear.com" rel="preconnect" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-md"
          href="#main-content"
        >
          Skip to main content
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SWRProvider>
            <TooltipProvider delay={400}>
              <Toaster position="bottom-center" />
              <main className="root" id="main-content">
                {children}
              </main>
            </TooltipProvider>
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
