import galleryData from '../data/gallery.json';

export interface GalleryEntry {
  name: string;
  score: number;
  overallScore?: number;
  grade: string;
  issue: string;
  slug: string;
  date: string;
  appId?: string;
  appName?: string;
  appIcon?: string;
  developer?: string;
}

export function readGallery(): GalleryEntry[] {
  return galleryData as GalleryEntry[];
}

export function findBySlug(slug: string): GalleryEntry | null {
  return readGallery().find((item) => item.slug === slug) || null;
}

export async function upsertGalleryEntry(entry: any): Promise<any> {
  // TODO: Persist to database (Vercel Postgres, Upstash, etc.)
  console.log('Upsert gallery entry (stub):', entry);
  return entry;
}