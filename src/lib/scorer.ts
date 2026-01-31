/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AppData {
  trackName: string;
  artistName: string;
  artworkUrl512: string;
  description: string;
  price: number;
  averageUserRating: number;
  userRatingCount: number;
  screenshotUrls: string[];
  ipadScreenshotUrls: string[];
  genres: string[];
  primaryGenreName: string;
  fileSizeBytes: string;
  currentVersionReleaseDate: string;
  releaseDate: string;
  version: string;
  trackContentRating: string;
  advisories: string[];
  sellerUrl?: string;
  supportedDevices: string[];
  languageCodesISO2A: string[];
  minimumOsVersion: string;
  releaseNotes?: string;
  formattedPrice: string;
  isGameCenterEnabled: boolean;
  trackViewUrl: string;
  contentAdvisoryRating: string;
}

export interface DimensionScore {
  name: string;
  score: number;
  maxScore: number;
  emoji: string;
  details: string;
  tip: string;
}

export function scoreApp(app: AppData) {
  const dimensions: DimensionScore[] = [
    scoreASO(app),
    scoreScreenshots(app),
    scorePricing(app),
    scoreReviews(app),
    scoreUpdateCadence(app),
    scoreAccessibility(app),
    scorePrivacy(app),
    scoreLegal(app),
    scoreCategoryRanking(app),
    scoreCrashIndicators(app),
  ];

  const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);
  const maxTotal = dimensions.reduce((sum, d) => sum + d.maxScore, 0);
  const overallScore = Math.round((totalScore / maxTotal) * 100);
  const grade = overallScore >= 90 ? "A+" : overallScore >= 80 ? "A" : overallScore >= 70 ? "B" : overallScore >= 60 ? "C" : overallScore >= 50 ? "D" : "F";

  // Top 3 improvements: lowest scoring dimensions
  const sorted = [...dimensions].sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore));
  const topImprovements = sorted.slice(0, 3).map(d => d.tip || `Improve your ${d.name} score.`);

  return {
    appName: app.trackName,
    appIcon: app.artworkUrl512,
    developer: app.artistName,
    overallScore,
    grade,
    dimensions,
    topImprovements,
  };
}

export function scorePlayApp(app: AppData) {
  return {
    ...scoreApp(app),
    platform: "google_play" as const,
  };
}

function scoreASO(app: AppData): DimensionScore {
  let score = 0;
  const max = 10;
  const tips: string[] = [];

  // Title length (30 chars ideal for App Store)
  if (app.trackName.length >= 10 && app.trackName.length <= 30) score += 3;
  else if (app.trackName.length > 0) { score += 1; tips.push("Optimize title to 10-30 chars with keywords"); }

  // Description length
  const descLen = app.description?.length || 0;
  if (descLen >= 500) score += 3;
  else if (descLen >= 200) { score += 2; tips.push("Expand description to 500+ chars for better ASO"); }
  else { tips.push("Description is too short — aim for 500+ characters with keywords"); }

  // Has paragraph breaks / formatting
  if (app.description?.includes("\n\n")) score += 2;
  else tips.push("Add paragraph breaks to description for readability");

  // Multiple genres
  if (app.genres?.length >= 2) score += 2;
  else { score += 1; tips.push("Consider adding secondary category"); }

  return { name: "ASO", score, maxScore: max, emoji: "🔍", details: `Title: "${app.trackName}" (${app.trackName.length} chars). Description: ${descLen} chars.`, tip: tips[0] || "ASO looks solid." };
}

function scoreScreenshots(app: AppData): DimensionScore {
  let score = 0;
  const max = 10;
  const iphoneCount = app.screenshotUrls?.length || 0;
  const ipadCount = app.ipadScreenshotUrls?.length || 0;
  let tip = "";

  if (iphoneCount >= 8) score += 5;
  else if (iphoneCount >= 5) score += 4;
  else if (iphoneCount >= 3) { score += 2; tip = "Add more screenshots — aim for 8+ iPhone screenshots"; }
  else { tip = "Screenshots are critical — add at least 5 iPhone screenshots"; }

  if (ipadCount >= 3) score += 3;
  else if (ipadCount > 0) { score += 1; tip = tip || "Add more iPad screenshots for universal app credibility"; }
  else { tip = tip || "Add iPad screenshots to increase device coverage"; }

  // Bonus for having enough variety
  if (iphoneCount + ipadCount >= 10) score += 2;

  return { name: "Screenshots", score: Math.min(score, max), maxScore: max, emoji: "📸", details: `${iphoneCount} iPhone + ${ipadCount} iPad screenshots.`, tip: tip || "Great screenshot coverage." };
}

function scorePricing(app: AppData): DimensionScore {
  let score = 0;
  const max = 10;
  let tip = "";

  // Free apps generally get more downloads
  if (app.price === 0) { score += 7; tip = "Free model is great for downloads. Consider in-app purchases for monetization."; }
  else if (app.price <= 4.99) { score += 5; tip = "Consider a free tier with IAP to increase download volume."; }
  else { score += 3; tip = "Premium pricing limits discoverability. Consider freemium model."; }

  // Has a formatted price (good metadata)
  if (app.formattedPrice) score += 3;

  return { name: "Pricing", score, maxScore: max, emoji: "💰", details: `Price: ${app.formattedPrice || (app.price === 0 ? "Free" : `$${app.price}`)}.`, tip };
}

function scoreReviews(app: AppData): DimensionScore {
  let score = 0;
  const max = 10;
  let tip = "";
  const rating = app.averageUserRating || 0;
  const count = app.userRatingCount || 0;

  // Rating quality
  if (rating >= 4.5) score += 5;
  else if (rating >= 4.0) { score += 4; tip = "Good rating! Focus on fixing common complaints to hit 4.5+"; }
  else if (rating >= 3.5) { score += 2; tip = "Address negative reviews. Aim for 4.0+ rating."; }
  else { tip = "Rating needs improvement. Prioritize bug fixes and user feedback."; }

  // Rating volume
  if (count >= 10000) score += 5;
  else if (count >= 1000) { score += 4; tip = tip || "Good review volume. Use in-app prompts to increase ratings."; }
  else if (count >= 100) { score += 2; tip = tip || "Increase review volume with SKStoreReviewController prompts."; }
  else { score += 1; tip = tip || "Very few reviews. Implement smart review prompts after positive moments."; }

  return { name: "Reviews", score, maxScore: max, emoji: "⭐", details: `${rating.toFixed(1)} stars from ${count.toLocaleString()} ratings.`, tip: tip || "Excellent review profile." };
}

function scoreUpdateCadence(app: AppData): DimensionScore {
  let score = 0;
  const max = 10;
  let tip = "";

  const lastUpdate = new Date(app.currentVersionReleaseDate);
  const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSince <= 30) score += 6;
  else if (daysSince <= 90) { score += 4; tip = "Update more frequently — monthly updates signal active development."; }
  else if (daysSince <= 180) { score += 2; tip = "App hasn't been updated in months. Regular updates improve ranking."; }
  else { tip = "App appears abandoned. Update ASAP to maintain App Store visibility."; }

  // Has release notes
  if (app.releaseNotes && app.releaseNotes.length > 50) score += 3;
  else if (app.releaseNotes) { score += 1; tip = tip || "Write detailed release notes — users read them."; }
  else { tip = tip || "Add release notes to each update."; }

  // Version number suggests maturity
  const vMajor = parseInt(app.version?.split(".")[0] || "1");
  if (vMajor >= 3) score += 1;

  return { name: "Update Cadence", score: Math.min(score, max), maxScore: max, emoji: "🔄", details: `Last updated ${daysSince} days ago (v${app.version}).`, tip: tip || "Great update frequency." };
}

function scoreAccessibility(app: AppData): DimensionScore {
  let score = 0;
  const max = 10;
  let tip = "";

  // Language support
  const langCount = app.languageCodesISO2A?.length || 0;
  if (langCount >= 10) score += 4;
  else if (langCount >= 5) { score += 3; tip = "Add more localizations to expand market reach."; }
  else if (langCount >= 2) { score += 2; tip = "Limited language support. Localize for top markets."; }
  else { score += 1; tip = "Single language only — localization can 2-3x downloads."; }

  // Device support breadth
  const deviceCount = app.supportedDevices?.length || 0;
  if (deviceCount >= 20) score += 3;
  else if (deviceCount >= 10) score += 2;
  else { score += 1; tip = tip || "Support more devices for wider reach."; }

  // Content rating (accessible to more users if lower)
  if (app.trackContentRating === "4+") score += 3;
  else if (app.trackContentRating === "9+") score += 2;
  else score += 1;

  return { name: "Accessibility", score, maxScore: max, emoji: "♿", details: `${langCount} languages, ${deviceCount} devices, rated ${app.trackContentRating}.`, tip: tip || "Good accessibility signals." };
}

function scorePrivacy(app: AppData): DimensionScore {
  // Can't deeply inspect from lookup API — estimate based on available signals
  let score = 5; // Default moderate
  const max = 10;
  let tip = "Privacy labels aren't available via public API — get full analysis with a detailed report.";

  // If app is a known privacy-sensitive category, adjust
  const sensitive = ["Health & Fitness", "Finance", "Medical", "Social Networking"];
  if (sensitive.includes(app.primaryGenreName)) {
    score = 4;
    tip = "Privacy-sensitive category detected. Ensure App Privacy labels are thorough.";
  }

  // Advisories suggest content concerns
  if (app.advisories?.length > 0) score -= 1;

  return { name: "Privacy & Security", score: Math.max(score, 1), maxScore: max, emoji: "🔒", details: `Category: ${app.primaryGenreName}. ${app.advisories?.length || 0} content advisories.`, tip };
}

function scoreLegal(app: AppData): DimensionScore {
  let score = 0;
  const max = 10;
  let tip = "";

  // Has developer website (proxy for privacy policy / terms)
  if (app.sellerUrl) { score += 5; }
  else { tip = "No developer website found. Add one with privacy policy and terms."; }

  // Content rating exists
  if (app.contentAdvisoryRating) score += 3;

  // Has a seller name (proper legal entity)
  if (app.artistName && app.artistName.length > 3) score += 2;

  if (!tip) tip = "Legal basics covered. Ensure privacy policy is linked and up-to-date.";

  return { name: "Legal", score, maxScore: max, emoji: "⚖️", details: `Developer: ${app.artistName}. Website: ${app.sellerUrl ? "Yes" : "None"}.`, tip };
}

function scoreCategoryRanking(app: AppData): DimensionScore {
  // Can't get ranking from lookup API — estimate from rating count + rating
  let score = 0;
  const max = 10;
  const count = app.userRatingCount || 0;
  const rating = app.averageUserRating || 0;
  let tip = "";

  // Volume as proxy for ranking
  if (count >= 50000) score += 5;
  else if (count >= 10000) score += 4;
  else if (count >= 1000) { score += 3; tip = "Moderate traction. Focus on ASO and marketing to climb rankings."; }
  else if (count >= 100) { score += 2; tip = "Low visibility. Invest in ASO keywords and marketing campaigns."; }
  else { score += 1; tip = "Very low visibility. You need marketing and ASO optimization urgently."; }

  // Rating helps ranking
  if (rating >= 4.5) score += 3;
  else if (rating >= 4.0) score += 2;
  else score += 1;

  // Multi-genre presence
  if (app.genres?.length >= 2) score += 2;
  else score += 1;

  return { name: "Category Ranking", score: Math.min(score, max), maxScore: max, emoji: "📈", details: `${count.toLocaleString()} ratings in ${app.primaryGenreName}. Estimated from public signals.`, tip: tip || "Strong category presence." };
}

function scoreCrashIndicators(app: AppData): DimensionScore {
  let score = 6; // Default — can't directly measure crashes from API
  const max = 10;
  let tip = "Crash data isn't public — this score is estimated from update frequency and ratings.";

  // Recent updates suggest active bug fixing
  const daysSince = Math.floor((Date.now() - new Date(app.currentVersionReleaseDate).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince <= 30) score += 2;
  else if (daysSince <= 90) score += 1;

  // Good ratings suggest fewer crashes
  if (app.averageUserRating >= 4.5) score += 2;
  else if (app.averageUserRating >= 4.0) score += 1;

  // File size — very large apps may have more issues
  const sizeMB = parseInt(app.fileSizeBytes || "0") / (1024 * 1024);
  if (sizeMB > 500) { score -= 1; tip = "Large app size (500MB+) correlates with more crash vectors. Optimize bundle size."; }

  return { name: "Stability", score: Math.min(score, max), maxScore: max, emoji: "💎", details: `File size: ${sizeMB.toFixed(0)}MB. Last update: ${daysSince}d ago.`, tip };
}
