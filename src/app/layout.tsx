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
  title: "Streamings PZO",
  description: "Gestión de suscripciones de streaming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 antialiased`}
      >
        <ReactQueryProvider>
          <TooltipProvider delayDuration={500}>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "#4a4a4a",
                  color: "white",
                },
              }}
            />
          </TooltipProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
