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

type LoadingStage = "validating" | "fetching" | "analyzing" | "generating";

export default function Scanner() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("validating");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);

  // Real-time URL validation
  function validateUrl(inputUrl: string): boolean {
    if (!inputUrl.trim()) return false;
    
    const appStorePattern = /^https:\/\/apps\.apple\.com\/.+/;
    const playStorePattern = /^https:\/\/play\.google\.com\/store\/apps\/details\?id=.+/;
    
    return appStorePattern.test(inputUrl) || playStorePattern.test(inputUrl);
  }

  function handleUrlChange(newUrl: string) {
    setUrl(newUrl);
    setError("");
    if (newUrl.trim()) {
      setIsValidUrl(validateUrl(newUrl));
    } else {
      setIsValidUrl(null);
    }
  }

  function clearInput() {
    setUrl("");
    setError("");
    setReport(null);
    setIsValidUrl(null);
  }

  async function analyze() {
    setError("");
    setReport(null);
    
    if (!url.trim()) { 
      setError("Please paste an App Store or Google Play URL to get started"); 
      return; 
    }
    
    if (!validateUrl(url)) {
      setError("Please enter a valid App Store or Google Play URL");
      return;
    }
    
    setLoading(true);
    
    try {
      // Stage 1: Validating
      setLoadingStage("validating");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Stage 2: Fetching
      setLoadingStage("fetching");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Stage 3: Analyzing
      setLoadingStage("analyzing");
      
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      
      // Stage 4: Generating report
      setLoadingStage("generating");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setReport(data);
    } catch (e: unknown) {
      let errorMessage = "Something went wrong. Please try again.";
      
      if (e instanceof Error) {
        if (e.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (e.message.includes("404")) {
          errorMessage = "App not found. Please check the URL and try again.";
        } else if (e.message.includes("rate limit")) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else {
          errorMessage = e.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const getLoadingMessage = () => {
    switch (loadingStage) {
      case "validating": return "Validating URL...";
      case "fetching": return "Fetching app data...";
      case "analyzing": return "Analyzing across 10 dimensions...";
      case "generating": return "Generating your report...";
      default: return "Processing...";
    }
  };

  const getLoadingProgress = () => {
    switch (loadingStage) {
      case "validating": return 25;
      case "fetching": return 50;
      case "analyzing": return 75;
      case "generating": return 95;
      default: return 0;
    }
  };

  return (
    <>
      {/* Input Section */}
      <div className="space-y-4 mb-8">
        <div className="relative">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="url"
                placeholder="Paste an App Store or Google Play URL..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && analyze()}
                disabled={loading}
                className={`w-full px-4 py-3 pr-12 rounded-lg bg-[var(--bg-card)] border text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none transition-all duration-200 ${
                  isValidUrl === false 
                    ? "border-red-400 focus:border-red-400" 
                    : isValidUrl === true 
                      ? "border-green-400 focus:border-green-400" 
                      : "border-[var(--border)] focus:border-[var(--accent)]"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              
              {/* URL Validation Indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {url.trim() && (
                  <div className="text-lg">
                    {isValidUrl === true ? "✅" : isValidUrl === false ? "❌" : ""}
                  </div>
                )}
              </div>
              
              {/* Clear Button */}
              {url && !loading && (
                <button
                  onClick={clearInput}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
            
            <button
              onClick={analyze}
              disabled={loading || !url.trim() || isValidUrl === false}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-[var(--accent)] to-purple-600 hover:from-[var(--accent-glow)] hover:to-purple-700 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                "🚀 Score My App"
              )}
            </button>
          </div>
        </div>

        {/* URL Format Help */}
        {url && isValidUrl === false && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50">
            <p className="text-red-800 dark:text-red-200 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>Please enter a valid URL. Examples:</span>
            </p>
            <div className="mt-2 space-y-1 text-xs text-red-700 dark:text-red-300">
              <div>• App Store: https://apps.apple.com/us/app/your-app/id123456789</div>
              <div>• Google Play: https://play.google.com/store/apps/details?id=com.yourapp</div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 mb-6">
          <p className="text-red-800 dark:text-red-200 text-sm flex items-center gap-2">
            <span>❌</span>
            <span>{error}</span>
          </p>
        </div>
      )}

      {/* Enhanced Loading State */}
      {loading && (
        <div className="text-center py-16 space-y-6">
          <div className="relative w-32 h-32 mx-auto">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin"></div>
            {/* Inner progress ring */}
            <div className="absolute inset-2 border-2 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-3xl animate-pulse">🔬</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[var(--text)]">{getLoadingMessage()}</span>
              <span className="text-xs text-[var(--text-muted)]">{getLoadingProgress()}%</span>
            </div>
            <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getLoadingProgress()}%` }}
              ></div>
            </div>
          </div>

          {/* Loading Tips */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 max-w-md mx-auto">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              💡 <strong>Did you know?</strong> We analyze metadata, screenshots, reviews, pricing strategy, and 6 other key factors that impact your app's success.
            </p>
          </div>
        </div>
      )}

      {report && (
        <div className="animate-fade-in space-y-8">
          <div className="flex items-center gap-4 p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            {report.appIcon && <img src={report.appIcon} alt="" className="w-16 h-16 rounded-2xl" />}
            <div className="flex-1">
              <h2 className="text-xl font-bold">{report.appName}</h2>
              <p className="text-sm text-[var(--text-muted)]">{report.developer}</p>
            </div>
            <ScoreRing score={report.overallScore} />
          </div>

          <div className="text-center">
            <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold border" style={{
              borderColor: report.overallScore >= 80 ? "#22c55e" : report.overallScore >= 60 ? "#eab308" : "#ef4444",
              color: report.overallScore >= 80 ? "#22c55e" : report.overallScore >= 60 ? "#eab308" : "#ef4444",
            }}>
              Grade: {report.grade}
            </span>
          </div>

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

          <div>
            <h3 className="font-bold mb-4 text-lg">📊 Dimension Breakdown</h3>
            <div className="grid gap-3">
              {report.dimensions.map((dim, i) => <DimensionBar key={i} dim={dim} />)}
            </div>
          </div>

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

          <p className="text-center text-xs text-[var(--text-muted)] pt-4">
            ShipScore analyzes publicly available App Store data. Scores are estimates based on best practices.
          </p>
        </div>
      )}

      {!report && !loading && (
        <div className="text-center text-sm text-[var(--text-muted)] mt-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border)]">
            <span>🍎</span>
            <span>Apple App Store</span>
            <span className="text-[var(--border)]">|</span>
            <span>▶️</span>
            <span>Google Play</span>
          </div>
          <p className="text-xs">
            Built by <a href="https://squadops.com" className="text-[var(--accent-glow)] hover:underline" target="_blank">SquadOps</a> — App launch experts
          </p>
        </div>
      )}
    </>
  );
}
