/**
 * App Store page scraper — extracts data that the iTunes Lookup API misses:
 * screenshots, privacy labels, ratings breakdown, What's New, app previews.
 *
 * Strategy: Scrape first, API fallback.
 */

export interface ScrapedAppData {
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
  // Scraper-exclusive fields
  privacyLabels?: string[];
  whatsNew?: string;
  appPreviewUrls?: string[];
  ratingsBreakdown?: Record<string, number>;
  source: "scraper" | "api" | "merged";
}

/**
 * Scrape the App Store product page for an app.
 * Returns partial data extracted from the HTML + JSON-LD.
 */
export async function scrapeAppStore(appId: string): Promise<Partial<ScrapedAppData> | null> {
  try {
    const url = `https://apps.apple.com/us/app/id${appId}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    return parseAppStorePage(html, appId);
  } catch {
    return null;
  }
}

function parseAppStorePage(html: string, appId: string): Partial<ScrapedAppData> {
  const data: Partial<ScrapedAppData> = {
    source: "scraper",
    trackViewUrl: `https://apps.apple.com/us/app/id${appId}`,
  };

  // --- JSON-LD structured data (richest source) ---
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (jsonLdMatch) {
    try {
      const ld = JSON.parse(jsonLdMatch[1]);
      if (ld.name) data.trackName = ld.name;
      if (ld.author?.name) data.artistName = ld.author.name;
      if (ld.image?.url) data.artworkUrl512 = ld.image.url;
      if (ld.description) data.description = ld.description;
      if (ld.operatingSystem) data.minimumOsVersion = ld.operatingSystem;
      if (ld.applicationCategory) {
        data.primaryGenreName = ld.applicationCategory.replace("GameCategory", "Games").replace("Category", "");
        data.genres = [data.primaryGenreName];
      }
      if (ld.aggregateRating) {
        data.averageUserRating = parseFloat(ld.aggregateRating.ratingValue) || 0;
        data.userRatingCount = parseInt(ld.aggregateRating.ratingCount) || 0;
      }
      if (ld.offers) {
        const price = parseFloat(ld.offers.price) || 0;
        data.price = price;
        data.formattedPrice = price === 0 ? "Free" : `$${price.toFixed(2)}`;
      }
      if (ld.softwareVersion) data.version = ld.softwareVersion;
      if (ld.datePublished) data.releaseDate = ld.datePublished;
    } catch {
      // JSON-LD parse failed, continue with regex
    }
  }

  // --- Screenshots (source sets from picture elements) ---
  // Deduplicate by base image path (before size suffix like /600x0w.webp)
  const seenBases = new Set<string>();
  const screenshotUrls: string[] = [];
  const ipadScreenshotUrls: string[] = [];

  function getBaseImagePath(url: string): string {
    // Strip the trailing size/format part: /600x0w.webp, /460x0w.webp, etc.
    return url.replace(/\/\d+x\d+\w*\.\w+$/, "");
  }

  function addScreenshot(u: string) {
    const base = getBaseImagePath(u);
    if (seenBases.has(base)) return;
    seenBases.add(base);
    // Determine iPhone vs iPad by URL hints
    if (u.includes("2048") || u.includes("1024") || u.includes("pad")) {
      ipadScreenshotUrls.push(u);
    } else {
      screenshotUrls.push(u);
    }
  }

  // Match screenshot source URLs — App Store uses srcset with multiple sizes
  const srcsetMatches = html.matchAll(/srcset="([^"]+)"/g);
  for (const m of srcsetMatches) {
    const urls = m[1].split(",").map((s) => s.trim().split(" ")[0]);
    for (const u of urls) {
      if (u.includes("mzstatic.com/image") && (u.includes("SS") || u.includes("screen") || u.includes("/Purple"))) {
        addScreenshot(u);
      }
    }
  }

  // Fallback: grab any image URLs that look like screenshots
  if (screenshotUrls.length === 0 && ipadScreenshotUrls.length === 0) {
    const imgMatches = html.matchAll(/https:\/\/is\d+-ssl\.mzstatic\.com\/image\/thumb\/[^"'\s]+/g);
    for (const m of imgMatches) {
      const u = m[0];
      if (u.includes("Purple") && !u.includes("AppIcon") && !u.includes("512x512")) {
        addScreenshot(u);
      }
    }
  }

  if (screenshotUrls.length > 0) data.screenshotUrls = screenshotUrls;
  if (ipadScreenshotUrls.length > 0) data.ipadScreenshotUrls = ipadScreenshotUrls;

  // --- App Previews (video) ---
  const previewUrls: string[] = [];
  const videoMatches = html.matchAll(/src="(https:\/\/[^"]*video[^"]*)"/gi);
  for (const m of videoMatches) {
    if (!previewUrls.includes(m[1])) previewUrls.push(m[1]);
  }
  if (previewUrls.length > 0) data.appPreviewUrls = previewUrls;

  // --- What's New ---
  const whatsNewMatch = html.match(/What&#x27;s New[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i) ||
    html.match(/data-test-version-history[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
  if (whatsNewMatch) {
    data.whatsNew = whatsNewMatch[1].replace(/<[^>]+>/g, "").trim();
    data.releaseNotes = data.whatsNew;
  }

  // --- Privacy labels ---
  const privacyLabels: string[] = [];
  const privacyMatches = html.matchAll(/privacy-type[^>]*>([^<]+)</g);
  for (const m of privacyMatches) {
    const label = m[1].trim();
    if (label && !privacyLabels.includes(label)) privacyLabels.push(label);
  }
  if (privacyLabels.length > 0) data.privacyLabels = privacyLabels;

  // --- File size ---
  const sizeMatch = html.match(/(\d+(?:\.\d+)?)\s*(MB|GB|KB)/i);
  if (sizeMatch) {
    let bytes = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toUpperCase();
    if (unit === "GB") bytes *= 1024 * 1024 * 1024;
    else if (unit === "MB") bytes *= 1024 * 1024;
    else if (unit === "KB") bytes *= 1024;
    data.fileSizeBytes = String(Math.round(bytes));
  }

  // --- Content rating ---
  const ratingMatch = html.match(/Rated\s+([\d+]+)/i) || html.match(/(\d+\+)/);
  if (ratingMatch) {
    data.trackContentRating = ratingMatch[1];
    data.contentAdvisoryRating = ratingMatch[1];
  }

  // --- Seller URL ---
  const sellerMatch = html.match(/Developer Website[\s\S]*?href="([^"]+)"/i) ||
    html.match(/class="link"[^>]*href="(https?:\/\/[^"]+)"[^>]*>.*?website/i);
  if (sellerMatch) data.sellerUrl = sellerMatch[1];

  // --- Last updated ---
  const dateMatch = html.match(/currentVersionReleaseDate[^"]*"([^"]+)"/) ||
    html.match(/(\w{3}\s+\d{1,2},\s+\d{4})/);
  if (dateMatch) data.currentVersionReleaseDate = dateMatch[1];

  return data;
}

/**
 * Fetch from iTunes Lookup API (fallback).
 */
export async function fetchFromAPI(appId: string): Promise<ScrapedAppData | null> {
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${appId}&country=us`);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    return { ...data.results[0], source: "api" as const };
  } catch {
    return null;
  }
}

/**
 * Merge scraped data with API data. Scraper wins for fields it found.
 */
export function mergeData(
  scraped: Partial<ScrapedAppData> | null,
  api: ScrapedAppData | null
): ScrapedAppData | null {
  if (!scraped && !api) return null;
  if (!scraped) return api ? { ...api, source: "api" } : null;
  if (!api) {
    // Fill in defaults for required fields the scraper may have missed
    return {
      trackName: "",
      artistName: "",
      artworkUrl512: "",
      description: "",
      price: 0,
      averageUserRating: 0,
      userRatingCount: 0,
      screenshotUrls: [],
      ipadScreenshotUrls: [],
      genres: [],
      primaryGenreName: "",
      fileSizeBytes: "0",
      currentVersionReleaseDate: "",
      releaseDate: "",
      version: "",
      trackContentRating: "",
      advisories: [],
      supportedDevices: [],
      languageCodesISO2A: [],
      minimumOsVersion: "",
      formattedPrice: "Free",
      isGameCenterEnabled: false,
      trackViewUrl: "",
      contentAdvisoryRating: "",
      ...scraped,
      source: "scraper",
    } as ScrapedAppData;
  }

  // Merge: scraper fields override API where present and non-empty
  const merged: ScrapedAppData = { ...api, source: "merged" };

  // Screenshots: prefer scraper if it found any
  if (scraped.screenshotUrls && scraped.screenshotUrls.length > 0) {
    merged.screenshotUrls = scraped.screenshotUrls;
  }
  if (scraped.ipadScreenshotUrls && scraped.ipadScreenshotUrls.length > 0) {
    merged.ipadScreenshotUrls = scraped.ipadScreenshotUrls;
  }

  // Scraper-exclusive fields
  if (scraped.privacyLabels) merged.privacyLabels = scraped.privacyLabels;
  if (scraped.whatsNew) merged.whatsNew = scraped.whatsNew;
  if (scraped.appPreviewUrls) merged.appPreviewUrls = scraped.appPreviewUrls;
  if (scraped.ratingsBreakdown) merged.ratingsBreakdown = scraped.ratingsBreakdown;

  // Override API with scraper for text fields if scraper has better data
  if (scraped.releaseNotes && (!api.releaseNotes || scraped.releaseNotes.length > api.releaseNotes.length)) {
    merged.releaseNotes = scraped.releaseNotes;
  }
  if (scraped.sellerUrl && !api.sellerUrl) merged.sellerUrl = scraped.sellerUrl;
  if (scraped.fileSizeBytes && (!api.fileSizeBytes || api.fileSizeBytes === "0")) {
    merged.fileSizeBytes = scraped.fileSizeBytes;
  }

  return merged;
}
