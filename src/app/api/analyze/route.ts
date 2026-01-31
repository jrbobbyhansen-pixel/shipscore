import { NextRequest, NextResponse } from "next/server";
import { scoreApp, scorePlayApp } from "@/lib/scorer";
import {
  scrapeAppStore,
  fetchFromAPI,
  mergeData,
  isGooglePlay,
  extractPlayId,
  fetchPlayStoreData,
} from "@/lib/scraper";
import { upsertGalleryEntry } from "@/lib/gallery";

function extractAppId(url: string): string | null {
  const match = url.match(/id(\d+)/);
  return match ? match[1] : null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Please provide an App Store or Google Play URL" },
        { status: 400 }
      );
    }

    // ─── Google Play ───────────────────────────────────────────────
    if (isGooglePlay(url)) {
      const packageId = extractPlayId(url);
      if (!packageId) {
        return NextResponse.json(
          { error: "Could not extract package ID from Google Play URL" },
          { status: 400 }
        );
      }
      try {
        const playData = await fetchPlayStoreData(packageId);
        const report = scorePlayApp(playData);

        try {
          upsertGalleryEntry({
            appId: packageId,
            appName: report.appName || playData.trackName,
            appIcon: report.appIcon || playData.artworkUrl512,
            developer: report.developer || playData.artistName,
            overallScore: report.overallScore,
            grade: report.grade,
            dimensions: report.dimensions,
            topImprovements: report.topImprovements,
            trackViewUrl: playData.trackViewUrl,
            averageUserRating: playData.averageUserRating,
            userRatingCount: playData.userRatingCount,
            primaryGenreName: playData.primaryGenreName,
          });
        } catch {
          /* gallery save failed, don't block response */
        }

        return NextResponse.json({
          ...report,
          appId: packageId,
          platform: "google_play",
          trackViewUrl: playData.trackViewUrl,
          averageUserRating: playData.averageUserRating,
          userRatingCount: playData.userRatingCount,
          primaryGenreName: playData.primaryGenreName,
          dataSource: "scraper",
          privacyLabels: [],
          appPreviewUrls: [],
          whatsNew: null,
        });
      } catch {
        return NextResponse.json(
          {
            error:
              "Failed to fetch Google Play data. The app may not exist or the page structure changed.",
          },
          { status: 502 }
        );
      }
    }

    // ─── Apple App Store ───────────────────────────────────────────
    if (!url.includes("apps.apple.com") && !url.match(/^\d+$/)) {
      return NextResponse.json(
        {
          error:
            "Please provide an Apple App Store or Google Play URL",
        },
        { status: 400 }
      );
    }

    const appId = url.match(/^\d+$/) ? url : extractAppId(url);
    if (!appId) {
      return NextResponse.json(
        {
          error:
            "Could not extract app ID from URL. Use format: https://apps.apple.com/us/app/name/id123456789",
        },
        { status: 400 }
      );
    }

    const [scraped, apiData] = await Promise.all([
      scrapeAppStore(appId),
      fetchFromAPI(appId),
    ]);

    const app = mergeData(scraped, apiData);
    if (!app) {
      return NextResponse.json(
        { error: "App not found. Check the URL and try again." },
        { status: 404 }
      );
    }

    const report = scoreApp(app);

    try {
      upsertGalleryEntry({
        appId,
        appName: report.appName,
        appIcon: report.appIcon,
        developer: report.developer,
        overallScore: report.overallScore,
        grade: report.grade,
        dimensions: report.dimensions,
        topImprovements: report.topImprovements,
        trackViewUrl:
          app.trackViewUrl || `https://apps.apple.com/us/app/id${appId}`,
        averageUserRating: app.averageUserRating,
        userRatingCount: app.userRatingCount,
        primaryGenreName: app.primaryGenreName,
      });
    } catch {
      /* gallery save failed, don't block response */
    }

    return NextResponse.json({
      ...report,
      appId,
      platform: "app_store",
      trackViewUrl:
        app.trackViewUrl || `https://apps.apple.com/us/app/id${appId}`,
      averageUserRating: app.averageUserRating,
      userRatingCount: app.userRatingCount,
      primaryGenreName: app.primaryGenreName,
      dataSource: app.source,
      privacyLabels: app.privacyLabels || [],
      appPreviewUrls: app.appPreviewUrls || [],
      whatsNew: app.whatsNew || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
