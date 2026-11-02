import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApexRootLayout } from "@/components/apex/ApexRootLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoloSync — Apex console",
  description:
    "Apex operations console for VoloSync — tenants, payments, modules, and analytics in one place.",
};

/**
 * Root layout — `<html>`/`<body>` and app-wide providers only.
 *
 * It must stay free of `usePathname()`/`useSearchParams()`: this layout wraps
 * `/tenants/[id]`, whose param isn't known at build time, and a client-router
 * read here blocks prerendering (`CLIENT_HOOK_DYNAMIC`). Shell vs. bare
 * routing is handled by `ApexConsoleChrome` / `ApexLoginChrome` in the
 * `(console)` and `(login)` layouts.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <ApexRootLayout>{children}</ApexRootLayout>
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                classNames: {
                  toast:
                    "rounded-lg border border-border/60 shadow-lg backdrop-blur-sm",
                },
              }}
            />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
