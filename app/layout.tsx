import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LoginPage from "./page";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApexBareRouteOnly } from "@/components/apex/ApexBareRoutes";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
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
            {/* Page content — every route, wrapped in the console shell. */}
            <ApexRootLayout>{children}</ApexRootLayout>
            {/* Login page — bare, and rendered here because the shell
                wrapper above needs `children`. */}
            <ApexBareRouteOnly>
              <LoginPage />
            </ApexBareRouteOnly>
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
