import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PwaRegister from "../components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fox Report Generator",
  description: "Fox Pest Control report generator",
  manifest: "/manifest.webmanifest",

  // ✅ Improves iPhone app experience
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fox Reports",
  },

  // Optional but nice polish
  applicationName: "Fox Reports",
};

export const viewport: Viewport = {
  width: "device-width",        // ✅ fixes “small screen” issue
  initialScale: 1,              // ✅ prevents zoomed-out UI
  maximumScale: 1,              // ✅ locks scaling (optional)
  viewportFit: "cover",         // ✅ enables safe-area (notch support)
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}