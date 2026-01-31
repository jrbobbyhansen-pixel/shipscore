"use client";

import { useState, useMemo } from "react";

interface GalleryApp {
  appId: string;
  appName: string;
  appIcon: string;
  developer: string;
  overallScore: number;
  grade: string;
  slug: string;
  scannedAt: string;
  averageUserRating?: number;
  primaryGenreName?: string;
}

type SortMode = "recent" | "highest" | "lowest" | "rating";
type ScoreRange = "all" | "excellent" | "good" | "fair" | "poor";
type Platform = "all" | "ios" | "android";

function gradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return "#22c55e";
  if (grade === "B") return "#3b82f6";
  if (grade === "C") return "#eab308";
  return "#ef4444";
}

function detectPlatform(appId: string): Platform {
  // Simple heuristic: iOS app IDs are typically numeric, Android are package names
  return /^\d+$/.test(appId) ? "ios" : "android";
}

export default function GalleryGrid({ apps }: { apps: GalleryApp[] }) {
  const [sort, setSort] = useState<SortMode>("recent");
  const [scoreRange, setScoreRange] = useState<ScoreRange>("all");
  const [platform, setPlatform] = useState<Platform>("all");
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(apps.map(app => app.primaryGenreName).filter(Boolean));
    return Array.from(cats).sort();
  }, [apps]);

  // Filter and sort apps
  const filteredAndSorted = useMemo(() => {
    let filtered = apps.filter(app => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = app.appName.toLowerCase().includes(query);
        const matchesDeveloper = app.developer.toLowerCase().includes(query);
        if (!matchesName && !matchesDeveloper) return false;
      }

      // Score range filter
      if (scoreRange !== "all") {
        const score = app.overallScore;
        if (scoreRange === "excellent" && score < 85) return false;
        if (scoreRange === "good" && (score < 70 || score >= 85)) return false;
        if (scoreRange === "fair" && (score < 50 || score >= 70)) return false;
        if (scoreRange === "poor" && score >= 50) return false;
      }

      // Platform filter
      if (platform !== "all") {
        const appPlatform = detectPlatform(app.appId);
        if (appPlatform !== platform) return false;
      }

      // Category filter
      if (category !== "all") {
        if (app.primaryGenreName !== category) return false;
      }

      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      if (sort === "highest") return b.overallScore - a.overallScore;
      if (sort === "lowest") return a.overallScore - b.overallScore;
      if (sort === "rating") {
        const aRating = a.averageUserRating || 0;
        const bRating = b.averageUserRating || 0;
        return bRating - aRating;
      }
      return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime();
    });
  }, [apps, sort, scoreRange, platform, category, searchQuery]);

  if (apps.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">📱 App Gallery</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-muted)]">
            {filteredAndSorted.length} app{filteredAndSorted.length !== 1 ? 's' : ''}
          </span>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer border border-[var(--border)]"
          >
            🔍 {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search apps or developers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            🔍
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="mb-6 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sort */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort by</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none cursor-pointer"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Score</option>
                <option value="lowest">Lowest Score</option>
                <option value="rating">Best Rated</option>
              </select>
            </div>

            {/* Score Range */}
            <div>
              <label className="block text-sm font-medium mb-2">Score Range</label>
              <select
                value={scoreRange}
                onChange={(e) => setScoreRange(e.target.value as ScoreRange)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none cursor-pointer"
              >
                <option value="all">All Scores</option>
                <option value="excellent">Excellent (85-100)</option>
                <option value="good">Good (70-84)</option>
                <option value="fair">Fair (50-69)</option>
                <option value="poor">Poor (0-49)</option>
              </select>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none cursor-pointer"
              >
                <option value="all">All Platforms</option>
                <option value="ios">🍎 iOS</option>
                <option value="android">🤖 Android</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No apps found</h3>
          <p className="text-sm">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((app) => {
            const gc = gradeColor(app.grade);
            const appPlatform = detectPlatform(app.appId);
            
            return (
              <a key={app.appId} href={`/report/${app.slug}`}
                className="group p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] transition-all hover:scale-[1.02] hover:shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  {app.appIcon && (
                    <img src={app.appIcon} alt="" className="w-12 h-12 rounded-xl" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate group-hover:text-[var(--accent-glow)]">{app.appName}</h3>
                      <span className="text-xs">
                        {appPlatform === "ios" ? "🍎" : "🤖"}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate">{app.developer}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2"
                      style={{ borderColor: gc, color: gc }}>
                      {app.overallScore}
                    </div>
                    <span className="text-[10px] font-bold mt-0.5" style={{ color: gc }}>{app.grade}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-3">
                    {app.averageUserRating != null && <span>⭐ {app.averageUserRating.toFixed(1)}</span>}
                    {app.primaryGenreName && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--border)] truncate max-w-20">{app.primaryGenreName}</span>
                    )}
                  </div>
                  <span className="text-[10px]">
                    {new Date(app.scannedAt).toLocaleDateString()}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
