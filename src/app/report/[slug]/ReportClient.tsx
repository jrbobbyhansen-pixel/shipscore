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

      {/* Score Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="text-center p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <div className="text-3xl font-bold mb-1" style={{ color: gc }}>
            {entry.grade}
          </div>
          <div className="text-sm text-[var(--text-muted)]">Overall Grade</div>
        </div>
        <div className="text-center p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <div className="text-3xl font-bold mb-1">
            {entry.overallScore}
            <span className="text-lg text-[var(--text-muted)]">/100</span>
          </div>
          <div className="text-sm text-[var(--text-muted)]">Launch Score</div>
        </div>
        <div className="text-center p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          {entry.averageUserRating != null ? (
            <>
              <div className="text-3xl font-bold mb-1">
                ⭐ {entry.averageUserRating.toFixed(1)}
              </div>
              <div className="text-sm text-[var(--text-muted)]">
                {(entry.userRatingCount || 0).toLocaleString()} reviews
              </div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold mb-1 text-[var(--text-muted)]">—</div>
              <div className="text-sm text-[var(--text-muted)]">No reviews yet</div>
            </>
          )}
        </div>
      </div>

      {/* Priority Improvements */}
      <div className="p-8 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-800/50 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold">
            🎯
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Priority Improvements</h2>
        </div>
        <div className="space-y-4">
          {entry.topImprovements.map((tip, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-lg bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm border border-orange-200/50 dark:border-orange-800/30">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center font-bold text-sm">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{tip}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
          <p className="text-blue-800 dark:text-blue-200 text-sm flex items-center gap-2">
            <span>💡</span>
            <span>Need help implementing these improvements? Our experts can help you execute these recommendations and boost your app's performance.</span>
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold">
            📊
          </div>
          <h2 className="text-xl font-bold">Detailed Breakdown</h2>
        </div>
        <div className="grid gap-4">
          {entry.dimensions.map((dim, i) => {
            const pct = (dim.score / dim.maxScore) * 100;
            const barColor = pct >= 80 ? "from-green-500 to-emerald-500" : pct >= 60 ? "from-yellow-500 to-orange-500" : "from-red-500 to-red-600";
            const bgColor = pct >= 80 ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50" : 
                           pct >= 60 ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50" : 
                           "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50";
            
            return (
              <div key={i} className={`p-6 rounded-xl ${bgColor} border transition-all duration-200 hover:shadow-md`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{dim.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{dim.name}</h3>
                      <p className="text-sm text-[var(--text-muted)] mt-1">{dim.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{dim.score}</div>
                    <div className="text-sm text-[var(--text-muted)]">/ {dim.maxScore}</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Score</span>
                    <span className="font-mono">{Math.round(pct)}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000 ease-out`} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
                
                {dim.tip && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                    <p className="text-blue-800 dark:text-blue-200 text-sm flex items-start gap-2">
                      <span className="text-base">💡</span>
                      <span>{dim.tip}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
      <div className="p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold">
            🏷️
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Show Off Your Score</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
          Add this badge to your website, GitHub README, or app listing to showcase your ShipScore rating.
        </p>
        
        <div className="space-y-4">
          {/* Badge Preview */}
          <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
            <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Preview</h4>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={badgeUrl} alt={`ShipScore: ${entry.overallScore}/100`} className="h-5" />
              <span className="text-xs text-gray-500">Standard size</span>
            </div>
          </div>

          {/* HTML Embed Code */}
          <div className="relative">
            <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">HTML Embed Code</h4>
            <div className="relative">
              <pre className="p-4 rounded-lg bg-gray-900 text-green-400 text-xs overflow-x-auto border">
                <code>{`<a href="${reportUrl}" target="_blank">
  <img src="https://squadopsai.vercel.app/ship-score${badgeUrl}" 
       alt="ShipScore: ${entry.overallScore}/100" />
</a>`}</code>
              </pre>
              <button 
                onClick={() => copyText(`<a href="${reportUrl}" target="_blank"><img src="https://squadopsai.vercel.app/ship-score${badgeUrl}" alt="ShipScore: ${entry.overallScore}/100" /></a>`, "html")}
                className="absolute top-2 right-2 px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                {copied === "html" ? "✓ Copied!" : "📋 Copy HTML"}
              </button>
            </div>
          </div>

          {/* Markdown Embed Code */}
          <div className="relative">
            <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Markdown (GitHub README)</h4>
            <div className="relative">
              <pre className="p-4 rounded-lg bg-gray-900 text-blue-400 text-xs overflow-x-auto border">
                <code>{`[![ShipScore](https://squadopsai.vercel.app/ship-score${badgeUrl})](${reportUrl})`}</code>
              </pre>
              <button 
                onClick={() => copyText(`[![ShipScore](https://squadopsai.vercel.app/ship-score${badgeUrl})](${reportUrl})`, "markdown")}
                className="absolute top-2 right-2 px-3 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                {copied === "markdown" ? "✓ Copied!" : "📋 Copy Markdown"}
              </button>
            </div>
          </div>

          {/* Direct Image URL */}
          <div className="relative">
            <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Direct Image URL</h4>
            <div className="relative">
              <pre className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs overflow-x-auto border">
                <code>{`https://squadopsai.vercel.app/ship-score${badgeUrl}`}</code>
              </pre>
              <button 
                onClick={() => copyText(`https://squadopsai.vercel.app/ship-score${badgeUrl}`, "url")}
                className="absolute top-2 right-2 px-3 py-1 rounded text-xs bg-gray-600 hover:bg-gray-500 text-white transition-colors"
              >
                {copied === "url" ? "✓ Copied!" : "📋 Copy URL"}
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
            <p className="text-blue-800 dark:text-blue-200 text-xs flex items-start gap-2">
              <span className="text-sm">💡</span>
              <span>Badges update automatically when you re-scan your app. Perfect for showing continuous improvement in your development process!</span>
            </p>
          </div>
        </div>
      </div>

      {/* Expert Help CTA */}
      <div className="p-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50 text-center space-y-6 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl mb-4">
          🚀
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Need Expert Help?</h3>
          <p className="text-gray-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed">
            Get personalized launch strategy, ASO optimization, and conversion rate improvements from our team of app growth experts.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <a href="https://squadopsai.vercel.app/pricing" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
            <span>Get Expert Help</span>
            <span>→</span>
          </a>
          <span className="text-sm text-gray-500 dark:text-gray-400">Starting at $497/month</span>
        </div>
      </div>

      {/* Scan Another App CTA */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-[var(--accent)]/10 to-purple-900/20 border border-[var(--accent)]/30 text-center space-y-4">
        <h3 className="text-xl font-bold">🔍 Scan Another App</h3>
        <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
          Compare scores or analyze your competition. Free launch readiness scoring for any App Store or Google Play app.
        </p>
        <a href="/"
          className="inline-block px-6 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white font-semibold transition-colors">
          Score Another App
        </a>
      </div>

      <p className="text-center text-xs text-[var(--text-muted)] mt-8">
        Scanned {new Date(entry.scannedAt).toLocaleDateString()} • <a href="https://squadops.com" className="text-[var(--accent-glow)] hover:underline" target="_blank">SquadOps</a>
      </p>
    </main>
  );
}
