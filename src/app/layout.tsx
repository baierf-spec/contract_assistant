import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Contract Assistant – Understand Any Contract in Seconds",
  description:
    "Use AI to quickly understand legal contracts. Upload documents, ask questions, and get clear answers – secure, fast, and senior-friendly.",
  openGraph: {
    title: "AI Contract Assistant – Understand Any Contract in Seconds",
    description:
      "Use AI to quickly understand legal contracts. Upload documents, ask questions, and get clear answers – secure, fast, and senior-friendly.",
    url: "https://beicy.com",
    siteName: "AI Contract Assistant",
    images: [
      {
        url: "/vercel.svg",
        width: 1200,
        height: 630,
        alt: "AI Contract Assistant",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3S4YK6KHTS"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3S4YK6KHTS');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
