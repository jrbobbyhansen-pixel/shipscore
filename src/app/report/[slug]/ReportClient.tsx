"use client";

import { useState } from "react";
import type { GalleryEntry } from "@/lib/gallery";

function gradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return "#22c55e";
  if (grade === "B") return "#3b82f6";
  if (grade === "C") return "#eab308";
  return "#ef4444";
}

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const sw = 10;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#1e293b" strokeWidth={sw} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={sw} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} className="score-ring" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}</span>
        <span className="text-sm text-[var(--text-muted)]">/100</span>
      </div>
    </div>
  );
}

export default function ReportClient({ entry }: { entry: GalleryEntry }) {
  const [copied, setCopied] = useState("");
  const reportUrl = typeof window !== "undefined" ? window.location.href : `https://shipscore.app/report/${entry.slug}`;
  const badgeUrl = `/api/badge/${entry.appId}`;
  const embedSnippet = `<a href="${reportUrl}"><img src="https://shipscore.app${badgeUrl}" alt="ShipScore: ${entry.overallScore}/100" /></a>`;

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  }

  const gc = gradeColor(entry.grade);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Back */}
      <a href="/" className="text-sm text-[var(--accent-glow)] hover:underline mb-6 inline-block">← Back to ShipScore</a>

      {/* App Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] mb-8">
        {entry.appIcon && (
          <img src={entry.appIcon} alt={entry.appName} className="w-24 h-24 rounded-2xl" />
        )}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold mb-1">{entry.appName}</h1>
          <p className="text-[var(--text-muted)]">{entry.developer}</p>
          {entry.primaryGenreName && (
            <span className="inline-block mt-2 px-3 py-0.5 text-xs rounded-full bg-[var(--border)] text-[var(--text-muted)]">{entry.primaryGenreName}</span>
          )}
        </div>
        <ScoreRing score={entry.overallScore} />
      </div>

      {/* Grade Badge */}
      <div className="text-center mb-8">
        <span className="inline-block px-5 py-1.5 rounded-full text-lg font-bold border-2" style={{ borderColor: gc, color: gc }}>
          Grade: {entry.grade}
        </span>
        {entry.averageUserRating != null && (
          <p className="text-sm text-[var(--text-muted)] mt-2">
            ⭐ {entry.averageUserRating.toFixed(1)} ({(entry.userRatingCount || 0).toLocaleString()} ratings)
          </p>
        )}
      </div>

      {/* Top Improvements */}
      <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--accent)]/30 mb-8">
        <h2 className="font-bold mb-3 text-[var(--accent-glow)]">🎯 Top 3 Improvements</h2>
        <ol className="space-y-2">
          {entry.topImprovements.map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="text-[var(--accent)] font-bold">{i + 1}.</span>
              <span>{tip}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Dimensions */}
      <h2 className="font-bold text-lg mb-4">📊 Dimension Breakdown</h2>
      <div className="grid gap-3 mb-8">
        {entry.dimensions.map((dim, i) => {
          const pct = (dim.score / dim.maxScore) * 100;
          const barColor = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500";
          return (
            <div key={i} className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{dim.emoji} {dim.name}</span>
                <span className="text-sm font-mono text-[var(--text-muted)]">{dim.score}/{dim.maxScore}</span>
              </div>
              <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${barColor} transition-all duration-1000`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-[var(--text-muted)]">{dim.details}</p>
              {dim.tip && <p className="text-xs text-[var(--accent-glow)] mt-1">💡 {dim.tip}</p>}
            </div>
          );
        })}
      </div>

      {/* App Store Link */}
      {entry.trackViewUrl && (
        <div className="text-center mb-8">
          <a href={entry.trackViewUrl} target="_blank" rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            View on App Store →
          </a>
        </div>
      )}

      {/* Share */}
      <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] mb-8">
        <h3 className="font-bold mb-3">📤 Share This Report</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => copyText(reportUrl, "link")}
            className="px-4 py-2 rounded-lg bg-[var(--border)] hover:bg-[var(--bg-card-hover)] text-sm transition-colors cursor-pointer">
            {copied === "link" ? "✓ Copied!" : "📋 Copy Link"}
          </button>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${entry.appName} scored ${entry.overallScore}/100 on ShipScore! 🚀`)}&url=${encodeURIComponent(reportUrl)}`}
            target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-[var(--border)] hover:bg-[var(--bg-card-hover)] text-sm transition-colors">
            𝕏 Twitter
          </a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(reportUrl)}`}
            target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-[var(--border)] hover:bg-[var(--bg-card-hover)] text-sm transition-colors">
            💼 LinkedIn
          </a>
        </div>
      </div>

      {/* Embed Badge */}
      <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] mb-8">
        <h3 className="font-bold mb-3">🏷️ Embed Badge</h3>
        <div className="mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badgeUrl} alt={`ShipScore: ${entry.overallScore}/100`} className="h-8" />
        </div>
        <div className="relative">
          <code className="block p-3 rounded bg-[var(--bg)] text-xs text-[var(--text-muted)] overflow-x-auto">{embedSnippet}</code>
          <button onClick={() => copyText(embedSnippet, "embed")}
            className="absolute top-2 right-2 px-2 py-1 rounded text-xs bg-[var(--border)] hover:bg-[var(--bg-card-hover)] cursor-pointer">
            {copied === "embed" ? "✓" : "Copy"}
          </button>
        </div>
      </div>

      {/* CTA */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-[var(--accent)]/10 to-purple-900/20 border border-[var(--accent)]/30 text-center space-y-4">
        <h3 className="text-xl font-bold">🚀 Scan Your App</h3>
        <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
          Get a free launch readiness score across 10 dimensions in seconds.
        </p>
        <a href="/"
          className="inline-block px-6 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white font-semibold transition-colors">
          Score My App
        </a>
      </div>

      <p className="text-center text-xs text-[var(--text-muted)] mt-8">
        Scanned {new Date(entry.scannedAt).toLocaleDateString()} • <a href="https://squadops.com" className="text-[var(--accent-glow)] hover:underline" target="_blank">SquadOps</a>
      </p>
    </main>
  );
}
