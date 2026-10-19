import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "./provider";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina Play",
  description: "Gestión de suscripciones de streaming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
          <TooltipProvider delayDuration={500}>
            {children}
            <Toaster
              position="top-center"
              // Colors come from the theme (ui/sonner.tsx); dark only
              theme="dark"
            />
          </TooltipProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
