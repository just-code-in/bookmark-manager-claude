import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppNav } from "@/components/layout/app-nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bookmark Manager",
  description:
    "Import, categorize, and search your browser bookmarks with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
