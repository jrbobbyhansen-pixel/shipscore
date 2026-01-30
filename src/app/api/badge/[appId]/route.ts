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
  const label = `ShipScore: ${score}/100 (${grade})`;

  // Color by grade
  let color = "#6366f1";
  if (entry) {
    if (grade === "A+" || grade === "A") color = "#22c55e";
    else if (grade === "B") color = "#3b82f6";
    else if (grade === "C") color = "#eab308";
    else color = "#ef4444";
  }

  const textWidth = label.length * 7.2;
  const padX = 12;
  const w = Math.round(textWidth + padX * 2);
  const h = 28;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" rx="6" fill="${color}"/>
  <text x="${w / 2}" y="19" fill="#fff" font-family="system-ui,sans-serif" font-size="13" font-weight="bold" text-anchor="middle">${label}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
