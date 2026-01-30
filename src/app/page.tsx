import { readGallery } from "@/lib/gallery";
import Scanner from "./Scanner";
import GalleryGrid from "./GalleryGrid";

export const dynamic = "force-dynamic";

export default function Home() {
  const gallery = readGallery();

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          🚀 <span className="gradient-text">ShipScore</span>
        </h1>
        <p className="text-lg text-[var(--text-muted)] max-w-lg mx-auto">
          Is your app ready to ship? Get a free launch readiness score across 10 dimensions in seconds.
        </p>
      </div>

      <Scanner />

      <GalleryGrid apps={gallery.map((e) => ({
        appId: e.appId,
        appName: e.appName,
        appIcon: e.appIcon,
        developer: e.developer,
        overallScore: e.overallScore,
        grade: e.grade,
        slug: e.slug,
        scannedAt: e.scannedAt,
        averageUserRating: e.averageUserRating,
        primaryGenreName: e.primaryGenreName,
      }))} />
    </main>
  );
}
