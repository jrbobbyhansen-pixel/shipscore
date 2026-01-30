"use client";
import { useState } from "react";

interface DimensionScore {
  name: string;
  score: number;
  maxScore: number;
  emoji: string;
  details: string;
  tip: string;
}

interface Report {
  appName: string;
  appIcon: string;
  developer: string;
  overallScore: number;
  grade: string;
  dimensions: DimensionScore[];
  topImprovements: string[];
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#1e293b" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="score-ring" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-[var(--text-muted)]">/100</span>
      </div>
    </div>
  );
}

function DimensionBar({ dim }: { dim: DimensionScore }) {
  const pct = (dim.score / dim.maxScore) * 100;
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">{dim.emoji} {dim.name}</span>
        <span className="text-sm font-mono text-[var(--text-muted)]">{dim.score}/{dim.maxScore}</span>
      </div>
      <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-[var(--text-muted)]">{dim.details}</p>
      {dim.tip && <p className="text-xs text-[var(--accent-glow)] mt-1">💡 {dim.tip}</p>}
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  async function analyze() {
    setError("");
    setReport(null);
    if (!url.trim()) { setError("Paste an App Store URL to get started"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setReport(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          🚀 <span className="gradient-text">ShipScore</span>
        </h1>
        <p className="text-lg text-[var(--text-muted)] max-w-lg mx-auto">
          Is your app ready to ship? Get a free launch readiness score across 10 dimensions in seconds.
        </p>
      </div>

      {/* Input */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="url"
          placeholder="Paste an App Store URL (e.g. https://apps.apple.com/...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
        <button
          onClick={analyze}
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white font-semibold transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
        >
          {loading ? "Analyzing..." : "Score My App"}
        </button>
      </div>

      {error && <p className="text-center text-red-400 mb-6">{error}</p>}

      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-10 h-10 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mb-4" />
          <p className="text-[var(--text-muted)]">Analyzing your app across 10 dimensions...</p>
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="animate-fade-in space-y-8">
          {/* App Header */}
          <div className="flex items-center gap-4 p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            {report.appIcon && (
              <img src={report.appIcon} alt="" className="w-16 h-16 rounded-2xl" />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold">{report.appName}</h2>
              <p className="text-sm text-[var(--text-muted)]">{report.developer}</p>
            </div>
            <ScoreRing score={report.overallScore} />
          </div>

          {/* Grade */}
          <div className="text-center">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold border" style={{
              borderColor: report.overallScore >= 80 ? "#22c55e" : report.overallScore >= 60 ? "#eab308" : "#ef4444",
              color: report.overallScore >= 80 ? "#22c55e" : report.overallScore >= 60 ? "#eab308" : "#ef4444",
            }}>
              Grade: {report.grade}
            </span>
          </div>

          {/* Top Improvements */}
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--accent)]/30">
            <h3 className="font-bold mb-3 text-[var(--accent-glow)]">🎯 Top 3 Improvements</h3>
            <ol className="space-y-2">
              {report.topImprovements.map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-[var(--accent)] font-bold">{i + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Dimension Scores */}
          <div>
            <h3 className="font-bold mb-4 text-lg">📊 Dimension Breakdown</h3>
            <div className="grid gap-3">
              {report.dimensions.map((dim, i) => (
                <DimensionBar key={i} dim={dim} />
              ))}
            </div>
          </div>

          {/* Upsell CTA */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-[var(--accent)]/10 to-purple-900/20 border border-[var(--accent)]/30 text-center space-y-4">
            <h3 className="text-xl font-bold">Want the full picture?</h3>
            <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
              Get a detailed report with actionable fixes for every dimension, competitive analysis, and ASO keyword recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://squadops.com" target="_blank" rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white font-semibold transition-colors">
                Full Report — $97
              </a>
              <a href="https://squadops.com" target="_blank" rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-lg border border-[var(--accent)] text-[var(--accent-glow)] hover:bg-[var(--accent)]/10 font-semibold transition-colors">
                Done-for-You Fixes — $297
              </a>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Powered by <a href="https://squadops.com" className="text-[var(--accent-glow)] hover:underline" target="_blank">SquadOps</a></p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-[var(--text-muted)] pt-4">
            ShipScore analyzes publicly available App Store data. Scores are estimates based on best practices.
          </p>
        </div>
      )}

      {/* Footer when no report */}
      {!report && !loading && (
        <div className="text-center text-sm text-[var(--text-muted)] mt-16 space-y-4">
          <p>Supports Apple App Store URLs • Google Play coming soon</p>
          <p className="text-xs">
            Built by <a href="https://squadops.com" className="text-[var(--accent-glow)] hover:underline" target="_blank">SquadOps</a> — App launch experts
          </p>
        </div>
      )}
    </main>
  );
}
