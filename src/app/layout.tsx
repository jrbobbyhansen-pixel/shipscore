import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShipScore — Free App Store Launch Readiness Score | SquadOps",
  description: "Free app launch readiness scoring tool. Analyze your iOS and Android apps across 10 critical dimensions including ASO, screenshots, pricing, and reviews. Get actionable insights to improve your App Store performance instantly.",
  keywords: ["app store optimization", "ASO", "app launch", "app store score", "mobile app marketing", "app store analytics", "iOS app", "Android app", "Google Play"],
  authors: [{ name: "SquadOps" }],
  creator: "SquadOps",
  publisher: "SquadOps",
  robots: "index, follow",
  openGraph: {
    title: "ShipScore — Free App Store Launch Readiness Score",
    description: "Analyze your app across 10 critical dimensions. Get your free launch readiness score for iOS and Android apps instantly.",
    type: "website",
    url: "https://squadopsai.vercel.app/ship-score",
    siteName: "ShipScore by SquadOps",
    locale: "en_US",
    images: [
      {
        url: "/api/og-image",
        width: 1200,
        height: 630,
        alt: "ShipScore - Free App Launch Readiness Scoring Tool"
      }
    ]
  },
  twitter: {
    card: "summary_large_image", 
    site: "@squadopsai",
    creator: "@bobbyhansenjr",
    title: "ShipScore — Free App Store Launch Readiness Score",
    description: "Analyze your app across 10 critical dimensions. Get your free launch readiness score instantly.",
    images: ["/api/og-image"]
  },
  verification: {
    google: "your-google-verification-code"
  },
  alternates: {
    canonical: "https://squadopsai.vercel.app/ship-score"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
