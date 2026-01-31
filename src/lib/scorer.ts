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
    scoreVisualAssets(app), // Enhanced from just screenshots
    scorePricing(app),
    scoreReviews(app),
    scoreUpdateCadence(app),
    scoreAccessibility(app),
    scorePrivacy(app),
    scoreLegal(app),
    scoreCategoryRanking(app),
    scoreAppIcon(app), // New: App icon analysis
  ];

  // Apply weighted scoring for more realistic results
  const weights: { [key: string]: number } = {
    "ASO": 0.20,              // 20% - Most critical for discovery
    "Visual Assets": 0.15,    // 15% - Critical for conversion
    "Reviews": 0.15,          // 15% - Trust and ranking factor
    "App Icon": 0.12,         // 12% - First impression
    "Category Ranking": 0.10, // 10% - Market position
    "Pricing": 0.10,          // 10% - Strategy impact
    "Update Cadence": 0.08,   // 8% - Health indicator
    "Accessibility": 0.05,    // 5% - Market reach
    "Privacy & Security": 0.03, // 3% - Basic requirement
    "Legal": 0.02,            // 2% - Basic requirement
  };

  let weightedScore = 0;
  let totalWeight = 0;

  dimensions.forEach(dim => {
    const weight = weights[dim.name] || 0.1;
    const percentage = (dim.score / dim.maxScore);
    weightedScore += percentage * weight;
    totalWeight += weight;
  });

  const overallScore = Math.round((weightedScore / totalWeight) * 100);
  
  // Adjusted grading scale for more meaningful differentiation
  const grade = overallScore >= 92 ? "A+" : 
               overallScore >= 85 ? "A" : 
               overallScore >= 75 ? "B" : 
               overallScore >= 65 ? "C" : 
               overallScore >= 55 ? "D" : "F";

  // Top 3 improvements: lowest scoring dimensions weighted by importance
  const sorted = [...dimensions].sort((a, b) => {
    const aWeighted = (a.score / a.maxScore) * (weights[a.name] || 0.1);
    const bWeighted = (b.score / b.maxScore) * (weights[b.name] || 0.1);
    return aWeighted - bWeighted;
  });
  
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
  const max = 100; // Increased for more granular scoring
  const tips: string[] = [];
  const title = app.trackName || "";
  const description = app.description || "";

  // Title optimization (25 points total)
  if (title.length >= 15 && title.length <= 30) {
    score += 15; // Sweet spot
  } else if (title.length >= 10 && title.length <= 40) {
    score += 12;
    tips.push("Optimize title length to 15-30 characters for best visibility");
  } else if (title.length > 0) {
    score += 8;
    tips.push("Title should be 15-30 characters with primary keywords");
  }

  // Keyword density in title (10 points)
  const hasKeywords = /\b(app|free|pro|best|top|easy|quick|fast|new)\b/i.test(title);
  if (hasKeywords) {
    score += 10;
  } else {
    tips.push("Include relevant keywords in your app title");
    score += 5; // Partial credit
  }

  // Description optimization (35 points total)
  const descLen = description.length;
  if (descLen >= 800) {
    score += 20;
  } else if (descLen >= 500) {
    score += 18;
    tips.push("Expand description to 800+ characters for better keyword coverage");
  } else if (descLen >= 200) {
    score += 12;
    tips.push("Description too short — aim for 800+ characters with keywords");
  } else {
    score += 5;
    tips.push("Critical: Description must be at least 500 characters for ASO");
  }

  // Description structure and formatting (15 points)
  const hasBullets = /[•\-\*]|\d+\./.test(description);
  const hasBreaks = description.includes("\n");
  const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(description);
  
  if (hasBreaks && hasBullets) score += 15;
  else if (hasBreaks || hasBullets) { score += 10; tips.push("Add bullet points and line breaks for better description formatting"); }
  else { score += 5; tips.push("Structure description with bullet points and paragraphs"); }

  if (hasEmojis) score += 3; // Small bonus for visual appeal

  // Category optimization (15 points)
  if (app.genres?.length >= 2) {
    score += 15;
  } else {
    score += 8;
    tips.push("Add a secondary category to increase discoverability");
  }

  // Localization signals (10 points)
  const langCount = app.languageCodesISO2A?.length || 1;
  if (langCount >= 10) score += 10;
  else if (langCount >= 5) { score += 8; tips.push("Localize for more languages to expand keyword reach"); }
  else if (langCount >= 3) { score += 6; }
  else { score += 3; tips.push("Localization is critical for ASO — start with Spanish, French, German"); }

  // Normalize to 10-point scale for consistency with other dimensions
  const normalizedScore = Math.round((score / max) * 10);
  
  return { 
    name: "ASO", 
    score: normalizedScore, 
    maxScore: 10, 
    emoji: "🔍", 
    details: `Title: ${title.length} chars, Description: ${descLen} chars, ${langCount} languages`, 
    tip: tips[0] || "Strong ASO foundation — continue optimizing keywords and descriptions" 
  };
}

function scoreVisualAssets(app: AppData): DimensionScore {
  let score = 0;
  const max = 10;
  const iphoneCount = app.screenshotUrls?.length || 0;
  const ipadCount = app.ipadScreenshotUrls?.length || 0;
  const tips: string[] = [];

  // iPhone screenshots (0-6 points)
  if (iphoneCount >= 8) {
    score += 6;
  } else if (iphoneCount >= 5) {
    score += 5;
    tips.push("Add 3+ more iPhone screenshots to maximize conversion potential");
  } else if (iphoneCount >= 3) {
    score += 3;
    tips.push("Need at least 5 iPhone screenshots — each one increases conversion rates");
  } else if (iphoneCount > 0) {
    score += 1;
    tips.push("Critical: Add more iPhone screenshots (minimum 5, ideal 8-10)");
  } else {
    tips.push("No screenshots detected — this will kill conversion rates");
  }

  // iPad screenshots (0-2 points)
  if (ipadCount >= 5) {
    score += 2;
  } else if (ipadCount >= 3) {
    score += 1.5;
    tips.push("Add 2+ more iPad screenshots for better universal app appeal");
  } else if (ipadCount > 0) {
    score += 1;
    tips.push("Add more iPad screenshots — tablet users have higher LTV");
  } else {
    tips.push("Add iPad screenshots to appeal to tablet users (higher engagement)");
  }

  // Portfolio completeness bonus (0-2 points)
  const totalAssets = iphoneCount + ipadCount;
  if (totalAssets >= 12) {
    score += 2;
  } else if (totalAssets >= 8) {
    score += 1.5;
  } else if (totalAssets >= 6) {
    score += 1;
  }

  return { 
    name: "Visual Assets", 
    score: Math.min(Math.round(score), max), 
    maxScore: max, 
    emoji: "📸", 
    details: `${iphoneCount} iPhone + ${ipadCount} iPad screenshots`, 
    tip: tips[0] || "Excellent visual asset portfolio" 
  };
}

function scoreAppIcon(app: AppData): DimensionScore {
  let score = 5; // Base score since we can't analyze the actual icon design
  const max = 10;
  let tip = "Icon quality analysis requires manual review — ensure it's clear, distinctive, and follows platform guidelines";

  // We can make some inferences from the icon URL structure
  const iconUrl = app.artworkUrl512 || "";
  
  if (iconUrl.includes("512x512")) {
    score += 2; // Good resolution indicator
  }

  // If the app has high ratings, likely the icon is decent
  if (app.averageUserRating >= 4.5 && app.userRatingCount >= 100) {
    score += 2;
    tip = "High user ratings suggest good visual design including icon — keep it consistent";
  } else if (app.averageUserRating >= 4.0 && app.userRatingCount >= 50) {
    score += 1;
    tip = "Good ratings but consider A/B testing your icon for higher conversion rates";
  } else {
    tip = "Low ratings may indicate visual issues — consider redesigning your app icon";
  }

  // Apps in Design/Photography categories typically have better visual design
  const designCategories = ["Photo & Video", "Design", "Graphics & Design"];
  if (designCategories.includes(app.primaryGenreName)) {
    score += 1;
  }

  return { 
    name: "App Icon", 
    score: Math.min(score, max), 
    maxScore: max, 
    emoji: "🎨", 
    details: `Primary category: ${app.primaryGenreName}`, 
    tip 
  };
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
  const tips: string[] = [];
  const rating = app.averageUserRating || 0;
  const count = app.userRatingCount || 0;

  // Rating quality (0-6 points) - More granular scoring
  if (rating >= 4.7) {
    score += 6;
  } else if (rating >= 4.5) {
    score += 5.5;
    tips.push("Excellent rating! Focus on maintaining quality and gathering more reviews");
  } else if (rating >= 4.2) {
    score += 4.5;
    tips.push("Strong rating. Address top complaints to reach 4.5+ stars");
  } else if (rating >= 4.0) {
    score += 3.5;
    tips.push("Good rating but needs improvement. Analyze negative reviews and fix pain points");
  } else if (rating >= 3.7) {
    score += 2.5;
    tips.push("Below average rating. Urgent: fix bugs and usability issues");
  } else if (rating >= 3.0) {
    score += 1.5;
    tips.push("Poor rating indicates serious issues. Major quality improvements needed");
  } else if (rating > 0) {
    score += 0.5;
    tips.push("Critical rating issues. Consider major app redesign and quality improvements");
  } else {
    tips.push("No ratings yet. Implement review prompts and focus on user retention");
  }

  // Rating volume (0-4 points) - Social proof factor
  if (count >= 50000) {
    score += 4;
  } else if (count >= 10000) {
    score += 3.5;
    tips.push("Strong review volume. Optimize review prompts for even more social proof");
  } else if (count >= 5000) {
    score += 3;
    tips.push("Good review volume. Use in-app review prompts to increase ratings");
  } else if (count >= 1000) {
    score += 2.5;
    tips.push("Moderate review volume. Implement smart review requests after positive actions");
  } else if (count >= 500) {
    score += 2;
    tips.push("Low review volume. Add SKStoreReviewController prompts strategically");
  } else if (count >= 100) {
    score += 1.5;
    tips.push("Very few reviews. Focus on user engagement and review acquisition");
  } else if (count >= 20) {
    score += 1;
    tips.push("Minimal reviews. Implement review prompts and improve user experience");
  } else if (count > 0) {
    score += 0.5;
    tips.push("Almost no reviews. Critical: implement review requests and fix retention");
  }

  // Rating velocity bonus (estimated)
  const ratingDensity = count > 0 ? rating * Math.log10(count + 1) : 0;
  if (ratingDensity > 15) score += 0.5; // Bonus for high engagement

  return { 
    name: "Reviews", 
    score: Math.min(Math.round(score * 10) / 10, max), 
    maxScore: max, 
    emoji: "⭐", 
    details: `${rating.toFixed(1)} stars from ${count.toLocaleString()} ratings`, 
    tip: tips[0] || "Outstanding review profile — maintain this excellence" 
  };
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

// Removed scoreCrashIndicators - replaced with scoreAppIcon for more actionable insights
