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
  if (!entry) return { title: "Report Not Found — ShipScore" };

  const desc = `${entry.appName} scored ${entry.overallScore}/100 (Grade ${entry.grade}) on ShipScore. See the full breakdown across 10 dimensions.`;
  return {
    title: `${entry.appName} — ${entry.overallScore}/100 (${entry.grade}) | ShipScore`,
    description: desc,
    openGraph: {
      title: `${entry.appName} ShipScore: ${entry.overallScore}/100`,
      description: desc,
      type: "website",
      url: `https://shipscore.app/report/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${entry.appName} ShipScore: ${entry.overallScore}/100`,
      description: desc,
    },
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
    "@type": "SoftwareApplication",
    name: entry.appName,
    operatingSystem: "iOS",
    applicationCategory: entry.primaryGenreName || "App",
    author: { "@type": "Organization", name: entry.developer },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: entry.overallScore,
      bestRating: 100,
      worstRating: 0,
      ratingCount: entry.userRatingCount || 1,
    },
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
