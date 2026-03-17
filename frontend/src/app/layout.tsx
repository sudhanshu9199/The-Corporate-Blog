import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    template: "%s | The Corporate Blog",
    default: "The Corporate Blog - Industry Insights",
  },
  description: "Expert insights, engineering blogs",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "The Corporate Blog",
  },
  twitter: {
    card: "summary_large_image",
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
        className={`bg-gray-50 text-gray-900 ${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <main className="flex-grow container mx-auto px-4 py-8">
        {children}
        </main>
      </body>
    </html>
  );
}
