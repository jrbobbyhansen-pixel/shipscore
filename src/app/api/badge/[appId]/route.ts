import { NextRequest, NextResponse } from "next/server";
import { readGallery } from "@/lib/gallery";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  const gallery = readGallery();
  const entry = gallery.find((e) => e.appId === appId);

  const score = entry?.overallScore ?? "?";
  const grade = entry?.grade ?? "?";
  const appName = entry?.appName ?? "Unknown App";

  // Two-part badge design: left side with "ShipScore", right side with score
  const leftText = "ShipScore";
  const rightText = `${score}/100 (${grade})`;

  // Colors by grade
  let gradeColor = "#6366f1";
  if (entry) {
    if (grade === "A+" || grade === "A") gradeColor = "#22c55e";
    else if (grade === "B") gradeColor = "#3b82f6"; 
    else if (grade === "C") gradeColor = "#eab308";
    else gradeColor = "#ef4444";
  }

  const leftColor = "#555";
  const rightColor = gradeColor;

  // Calculate dimensions
  const leftWidth = leftText.length * 6.8 + 16;
  const rightWidth = rightText.length * 6.8 + 16;
  const totalWidth = Math.round(leftWidth + rightWidth);
  const height = 20;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <defs>
    <linearGradient id="leftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${leftColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#444;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="rightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${rightColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${rightColor};stop-opacity:0.8" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.2"/>
    </filter>
  </defs>
  
  <!-- Left side (ShipScore label) -->
  <rect x="0" y="0" width="${leftWidth}" height="${height}" rx="3" ry="3" fill="url(#leftGrad)" filter="url(#shadow)"/>
  <text x="${leftWidth/2}" y="14" fill="#fff" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="10" font-weight="bold" text-anchor="middle">${leftText}</text>
  
  <!-- Right side (Score) -->
  <rect x="${leftWidth}" y="0" width="${rightWidth}" height="${height}" rx="3" ry="3" fill="url(#rightGrad)"/>
  <text x="${leftWidth + rightWidth/2}" y="14" fill="#fff" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="10" font-weight="bold" text-anchor="middle">${rightText}</text>
  
  <!-- Separator line -->
  <line x1="${leftWidth}" y1="2" x2="${leftWidth}" y2="${height-2}" stroke="#fff" stroke-width="0.5" stroke-opacity="0.3"/>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
