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
        data.genres = [data.primaryGenreName!];
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

  // --- Screenshots ---
  // Strategy: extract all mzstatic image URLs, then filter to actual screenshots
  // and deduplicate by the unique UUID path (ignoring size variants).
  //
  // App Store image URL anatomy:
  //   https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/<uuid>/FILENAME.png/300x650bb-60.jpg
  //   The UUID+filename combo is the unique image; everything after is a size variant.
  //
  // Real screenshots: path contains "PurpleSource" + filename like IMG_xxxx_6.5.png or similar
  // Noise to exclude: Placeholder.mill, AppIcon, Features (category badges), template {w}x{h}

  const screenshotUrls: string[] = [];
  const ipadScreenshotUrls: string[] = [];
  const seenUUIDs = new Set<string>();

  // Extract the unique identifier: the UUID + original filename portion
  function getImageUUID(url: string): string | null {
    // Match: /v4/<hex>/<hex>/<hex>/<hash>/FILENAME.ext
    const match = url.match(/\/v4\/([a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9-]+\/[^/]+\.[a-z]+)/i);
    return match ? match[1] : null;
  }

  function isScreenshot(url: string): boolean {
    // Must be a PurpleSource image (actual app screenshots)
    if (!url.includes("PurpleSource")) return false;
    // Exclude non-screenshot images
    if (url.includes("Placeholder")) return false;
    if (url.includes("AppIcon")) return false;
    // Exclude template URLs with {w}x{h}
    if (url.includes("{w}")) return false;
    return true;
  }

  function isIPadScreenshot(url: string): boolean {
    return /iPad|_pad|Simulator_Screenshot.*iPad/i.test(url);
  }

  function addScreenshot(u: string) {
    if (!isScreenshot(u)) return;
    const uuid = getImageUUID(u);
    if (!uuid || seenUUIDs.has(uuid)) return;
    seenUUIDs.add(uuid);

    // Pick the largest rendered size variant (prefer 600x or 460x)
    if (isIPadScreenshot(u)) {
      ipadScreenshotUrls.push(u);
    } else {
      screenshotUrls.push(u);
    }
  }

  // Collect all mzstatic image URLs from the page
  const allImageUrls = html.matchAll(/https:\/\/is\d+-ssl\.mzstatic\.com\/image\/thumb\/[^"'\s><]+/g);
  for (const m of allImageUrls) {
    addScreenshot(m[0]);
  }

  // Also check srcset attributes
  const srcsetMatches = html.matchAll(/srcset="([^"]+)"/g);
  for (const m of srcsetMatches) {
    const urls = m[1].split(",").map((s) => s.trim().split(" ")[0]);
    for (const u of urls) {
      addScreenshot(u);
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

// ─── Google Play Scraper ────────────────────────────────────────────

export function extractPlayId(url: string): string | null {
  const match = url.match(/[?&]id=([a-zA-Z0-9._]+)/);
  return match ? match[1] : null;
}

export function isGooglePlay(url: string): boolean {
  return url.includes("play.google.com");
}

export async function fetchPlayStoreData(packageId: string): Promise<ScrapedAppData> {
  const res = await fetch(
    `https://play.google.com/store/apps/details?id=${packageId}&hl=en&gl=us`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch Google Play page");
  const html = await res.text();

  const getMetaContent = (name: string) => {
    const m = html.match(
      new RegExp(
        `<meta\\s[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`,
        "i"
      )
    );
    return m ? m[1] : "";
  };

  const title =
    getMetaContent("og:title") || getMetaContent("twitter:title") || packageId;
  const description =
    getMetaContent("og:description") || getMetaContent("description") || "";
  const appIcon = getMetaContent("og:image") || "";

  const ratingMatch =
    html.match(/Rated\s+([\d.]+)\s+stars/i) ||
    html.match(/"ratingValue":\s*"?([\d.]+)"?/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

  const ratingCountMatch =
    html.match(/"ratingCount":\s*"?(\d+)"?/) ||
    html.match(/([\d,]+)\s+reviews/i);
  const ratingCount = ratingCountMatch
    ? parseInt(ratingCountMatch[1].replace(/,/g, ""))
    : 0;

  const developerMatch =
    html.match(/"author":\s*\{[^}]*"name":\s*"([^"]+)"/) ||
    html.match(/class="Vbfug auoIOc"[^>]*><a[^>]*>([^<]+)/);
  const developer = developerMatch ? developerMatch[1] : "Unknown Developer";

  const updatedMatch =
    html.match(/Updated on\s*<\/b>\s*([^<]+)/i) ||
    html.match(/"dateModified":\s*"([^"]+)"/);
  const lastUpdated = updatedMatch ? updatedMatch[1].trim() : "";

  const screenshotMatches =
    html.match(
      /https:\/\/play-lh\.googleusercontent\.com\/[^"'\s]+(?:=w\d+-h\d+)/g
    ) || [];
  const screenshots = [...new Set(screenshotMatches)].slice(0, 20);

  return {
    trackName: title
      .replace(/ - Apps on Google Play$/i, "")
      .replace(/ - Google Play$/i, ""),
    artistName: developer,
    artworkUrl512: appIcon,
    description,
    price: 0,
    averageUserRating: rating,
    userRatingCount: ratingCount,
    screenshotUrls: screenshots,
    ipadScreenshotUrls: [],
    genres: ["App"],
    primaryGenreName: "App",
    fileSizeBytes: "0",
    currentVersionReleaseDate: lastUpdated
      ? new Date(lastUpdated).toISOString()
      : new Date().toISOString(),
    releaseDate: "",
    version: "1.0",
    trackContentRating: "Everyone",
    advisories: [],
    sellerUrl: `https://play.google.com/store/apps/developer?id=${encodeURIComponent(developer)}`,
    supportedDevices: [],
    languageCodesISO2A: ["EN"],
    minimumOsVersion: "",
    releaseNotes: "",
    formattedPrice: "Free",
    isGameCenterEnabled: false,
    trackViewUrl: `https://play.google.com/store/apps/details?id=${packageId}`,
    contentAdvisoryRating: "Everyone",
    source: "scraper",
  };
}

// ─── Merge Helpers ──────────────────────────────────────────────────

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
