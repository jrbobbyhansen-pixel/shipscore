import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShipScore — App Launch Readiness Score",
  description: "Free app launch readiness scoring tool. Get your App Store score across 10 dimensions in seconds.",
  openGraph: {
    title: "ShipScore — Is Your App Ready to Ship?",
    description: "Free app launch readiness scoring. 10 dimensions. Instant results.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
