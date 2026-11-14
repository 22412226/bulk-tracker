import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0B0F19",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Lean Bulking & Macro Tracker",
  description: "Mobile-first Macro & Lean Bulking Tracker with GZCLP training mode and batch recipe builder.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bulking",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-[#0B0F19]">
      <body className="min-h-screen bg-[#0B0F19] text-gray-100 antialiased selection:bg-brand selection:text-white">
        {children}
      </body>
    </html>
  );
}
