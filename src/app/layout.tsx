import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { Toaster } from "react-hot-toast";
import { CsrfProvider } from "@/contexts/CsrfContext";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SubTranslate",
  description: "Automated video subtitle extraction and translation app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the nonce from the middleware
  const headersList = await headers()
  const nonce = headersList.get('X-Nonce') || ''

  return (
    <html lang="en">
      <head>
        {/* CSP nonce script for client-side access */}
        {nonce && (
          <script 
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `window.__CSP_NONCE__ = "${nonce}"`
            }}
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CsrfProvider>
          <Toaster position="top-center" />
          <Navigation />
          {children}
        </CsrfProvider>
      </body>
    </html>
  );
}
