"use client";

import { useState } from "react";

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

type SortMode = "recent" | "highest" | "lowest";

function gradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return "#22c55e";
  if (grade === "B") return "#3b82f6";
  if (grade === "C") return "#eab308";
  return "#ef4444";
}

export default function GalleryGrid({ apps }: { apps: GalleryApp[] }) {
  const [sort, setSort] = useState<SortMode>("recent");

  const sorted = [...apps].sort((a, b) => {
    if (sort === "highest") return b.overallScore - a.overallScore;
    if (sort === "lowest") return a.overallScore - b.overallScore;
    return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime();
  });

  if (apps.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">📱 Recently Scored Apps</h2>
        <div className="flex gap-2">
          {(["recent", "highest", "lowest"] as SortMode[]).map((m) => (
            <button key={m} onClick={() => setSort(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                sort === m ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}>
              {m === "recent" ? "Most Recent" : m === "highest" ? "Highest Score" : "Lowest Score"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((app) => {
          const gc = gradeColor(app.grade);
          return (
            <a key={app.appId} href={`/report/${app.slug}`}
              className="group p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-3">
                {app.appIcon && (
                  <img src={app.appIcon} alt="" className="w-12 h-12 rounded-xl" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate group-hover:text-[var(--accent-glow)]">{app.appName}</h3>
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
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                {app.averageUserRating != null && <span>⭐ {app.averageUserRating.toFixed(1)}</span>}
                {app.primaryGenreName && <span className="px-2 py-0.5 rounded-full bg-[var(--border)]">{app.primaryGenreName}</span>}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
