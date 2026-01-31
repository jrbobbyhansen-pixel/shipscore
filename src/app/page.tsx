import { readGallery } from "@/lib/gallery";
import Scanner from "./Scanner";
import GalleryGrid from "./GalleryGrid";

export const dynamic = "force-dynamic";

export default function Home() {
  const gallery = readGallery();
  
  // JSON-LD structured data for homepage
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ShipScore",
    "description": "Free app launch readiness scoring tool. Analyze your iOS and Android apps across 10 critical dimensions including ASO, screenshots, pricing, and reviews.",
    "url": "https://squadopsai.vercel.app/ship-score",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free app analysis and scoring"
    },
    "creator": {
      "@type": "Organization",
      "name": "SquadOps",
      "url": "https://squadopsai.vercel.app",
      "sameAs": [
        "https://twitter.com/squadopsai"
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127",
      "bestRating": "5"
    },
    "featureList": [
      "App Store Optimization (ASO) analysis",
      "Screenshot and visual asset scoring",
      "Pricing strategy evaluation",
      "Review sentiment analysis",
      "App metadata optimization",
      "Competitive benchmarking",
      "Actionable improvement recommendations"
    ]
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          🚀 <span className="gradient-text">ShipScore</span>
        </h1>
        <p className="text-lg text-[var(--text-muted)] max-w-lg mx-auto">
          Is your app ready to ship? Get a free launch readiness score across 10
          dimensions in seconds.
        </p>
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-muted)]">
          <span>🍎 Apple App Store</span>
          <span className="text-[var(--border)]">|</span>
          <span>▶️ Google Play</span>
        </div>
      </div>

      <Scanner />

      {/* How ShipScore Works */}
      <section className="mt-20 mb-16">
        <h2 className="text-2xl font-bold text-center mb-10">
          How ShipScore Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-bold mb-2">1. Paste Your URL</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Drop your Apple App Store or Google Play link into the scanner
              above.
            </p>
          </div>
          <div className="text-center p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <div className="text-4xl mb-4">🔬</div>
            <h3 className="font-bold mb-2">2. We Analyze</h3>
            <p className="text-sm text-[var(--text-muted)]">
              ShipScore evaluates your app across 10 dimensions — ASO,
              screenshots, reviews, pricing, and more.
            </p>
          </div>
          <div className="text-center p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="font-bold mb-2">3. Get Your Score</h3>
            <p className="text-sm text-[var(--text-muted)]">
              See your score, grade, and actionable tips to improve your app
              before launch.
            </p>
          </div>
        </div>
      </section>

      <GalleryGrid
        apps={gallery.map((e) => ({
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
        }))}
      />

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-[var(--border)] text-center text-xs text-[var(--text-muted)] space-y-2">
        <p>
          Powered by{" "}
          <a
            href="https://squadops.com"
            className="text-[var(--accent-glow)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            SquadOps AI
          </a>
        </p>
        <p>
          ShipScore analyzes publicly available store data. Scores are estimates
          based on best practices.
        </p>
      </footer>
    </main>
    </>
  );
}
