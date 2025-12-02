import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppKitProvider } from "./AppKitProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ANYWORK - Connect with Verified Artisans",
  description: "Find skilled professionals across Africa for your projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <AppKitProvider>{children}</AppKitProvider>
      </body>
    </html>
  );
}
