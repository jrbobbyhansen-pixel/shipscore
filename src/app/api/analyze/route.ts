import { NextRequest, NextResponse } from "next/server";
import { scoreApp } from "@/lib/scorer";
import { scrapeAppStore, fetchFromAPI, mergeData } from "@/lib/scraper";

function extractAppId(url: string): string | null {
  // https://apps.apple.com/us/app/some-name/id123456789
  const match = url.match(/id(\d+)/);
  return match ? match[1] : null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Please provide an App Store URL" }, { status: 400 });
    }

    // Validate it's an App Store URL
    if (!url.includes("apps.apple.com") && !url.match(/^\d+$/)) {
      return NextResponse.json({ error: "Currently only Apple App Store URLs are supported. Google Play coming soon!" }, { status: 400 });
    }

    const appId = url.match(/^\d+$/) ? url : extractAppId(url);
    if (!appId) {
      return NextResponse.json({ error: "Could not extract app ID from URL. Use format: https://apps.apple.com/us/app/name/id123456789" }, { status: 400 });
    }

    // Strategy: Scrape first, API fallback, merge both
    const [scraped, apiData] = await Promise.all([
      scrapeAppStore(appId),
      fetchFromAPI(appId),
    ]);

    const app = mergeData(scraped, apiData);
    if (!app) {
      return NextResponse.json({ error: "App not found. Check the URL and try again." }, { status: 404 });
    }

    const report = scoreApp(app);

    return NextResponse.json({
      ...report,
      dataSource: app.source,
      privacyLabels: app.privacyLabels || [],
      appPreviewUrls: app.appPreviewUrls || [],
      whatsNew: app.whatsNew || null,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
