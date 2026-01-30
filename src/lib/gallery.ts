import fs from "fs";
import path from "path";

export interface GalleryEntry {
  appId: string;
  appName: string;
  appIcon: string;
  developer: string;
  overallScore: number;
  grade: string;
  dimensions: {
    name: string;
    score: number;
    maxScore: number;
    emoji: string;
    details: string;
    tip: string;
  }[];
  topImprovements: string[];
  scannedAt: string;
  slug: string;
  trackViewUrl: string;
  averageUserRating?: number;
  userRatingCount?: number;
  primaryGenreName?: string;
}

const GALLERY_PATH = path.join(process.cwd(), "src/data/gallery.json");

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function readGallery(): GalleryEntry[] {
  try {
    const raw = fs.readFileSync(GALLERY_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function writeGallery(entries: GalleryEntry[]): void {
  fs.writeFileSync(GALLERY_PATH, JSON.stringify(entries, null, 2));
}

export function upsertGalleryEntry(entry: Omit<GalleryEntry, "slug" | "scannedAt"> & { appId: string }): GalleryEntry {
  const gallery = readGallery();
  const slug = toSlug(entry.appName);
  const full: GalleryEntry = {
    ...entry,
    slug,
    scannedAt: new Date().toISOString(),
  };

  const idx = gallery.findIndex((e) => e.appId === entry.appId);
  if (idx >= 0) {
    gallery[idx] = full;
  } else {
    gallery.unshift(full);
  }

  writeGallery(gallery);
  return full;
}

export function findBySlug(slug: string): GalleryEntry | undefined {
  return readGallery().find((e) => e.slug === slug);
}
