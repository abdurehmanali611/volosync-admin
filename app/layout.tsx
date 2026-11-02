import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";


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
 * It renders no chrome of its own: the console shell lives in
 * `app/(console)/layout.tsx` and the sign-in page in `app/(login)/`. Keeping
 * the shell out of here means no route below gets extra providers or a
 * Suspense boundary it didn't ask for — and nothing above `/tenants/[id]`
 * reads the pathname, which would block its prerendering.
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
            {children}
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
