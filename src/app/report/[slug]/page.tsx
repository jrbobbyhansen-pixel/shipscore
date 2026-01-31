import { findBySlug, readGallery } from "@/lib/gallery";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReportClient from "./ReportClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const gallery = readGallery();
  return gallery.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = findBySlug(slug);
  if (!entry) return { 
    title: "Report Not Found — ShipScore",
    description: "The requested app report could not be found. Try scanning a new app on ShipScore.",
    robots: "noindex, nofollow"
  };

  const desc = `${entry.appName} by ${entry.developer} scored ${entry.overallScore}/100 (Grade ${entry.grade}) on ShipScore. Detailed analysis across ASO, screenshots, pricing, reviews, and 6 other critical launch factors.`;
  const title = `${entry.appName} App Analysis — ${entry.overallScore}/100 ShipScore (Grade ${entry.grade})`;
  
  return {
    title,
    description: desc,
    keywords: [`${entry.appName}`, `${entry.developer}`, "app analysis", "app store optimization", "ASO", "app launch", "app score", ...(entry.primaryGenreName ? [entry.primaryGenreName] : [])],
    authors: [{ name: "SquadOps" }],
    robots: "index, follow",
    openGraph: {
      title: `${entry.appName} ShipScore: ${entry.overallScore}/100 (Grade ${entry.grade})`,
      description: desc,
      type: "article",
      url: `https://squadopsai.vercel.app/ship-score/report/${slug}`,
      siteName: "ShipScore by SquadOps",
      publishedTime: entry.scannedAt,
      images: [
        {
          url: entry.appIcon || "/api/og-image",
          width: 512,
          height: 512,
          alt: `${entry.appName} app icon`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      site: "@squadopsai",
      creator: "@bobbyhansenjr",
      title: `${entry.appName} ShipScore: ${entry.overallScore}/100`,
      description: desc,
      images: [entry.appIcon || "/api/og-image"]
    },
    alternates: {
      canonical: `https://squadopsai.vercel.app/ship-score/report/${slug}`
    }
  };
}

export const dynamic = "force-static";
export const dynamicParams = true;

export default async function ReportPage({ params }: Props) {
  const { slug } = await params;
  const entry = findBySlug(slug);
  if (!entry) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    "reviewBody": `Comprehensive analysis of ${entry.appName} across 10 key launch readiness dimensions including ASO, visual assets, pricing strategy, and user experience.`,
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": entry.overallScore,
      "bestRating": 100,
      "worstRating": 0
    },
    "author": {
      "@type": "Organization", 
      "name": "ShipScore by SquadOps",
      "url": "https://squadopsai.vercel.app"
    },
    "itemReviewed": {
      "@type": "SoftwareApplication",
      "name": entry.appName,
      "operatingSystem": entry.appId.match(/^\d+$/) ? "iOS" : "Android",
      "applicationCategory": entry.primaryGenreName || "MobileApplication",
      "author": { "@type": "Organization", name: entry.developer },
      "aggregateRating": entry.averageUserRating ? {
        "@type": "AggregateRating",
        "ratingValue": entry.averageUserRating,
        "bestRating": 5,
        "worstRating": 1,
        "ratingCount": entry.userRatingCount || 1,
      } : undefined,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    "datePublished": entry.scannedAt,
    "publisher": {
      "@type": "Organization",
      "name": "SquadOps",
      "url": "https://squadopsai.vercel.app"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReportClient entry={entry} />
    </>
  );
}
