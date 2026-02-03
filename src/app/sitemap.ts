import { MetadataRoute } from 'next';
import { readGallery } from '@/lib/gallery';

export default function sitemap(): MetadataRoute.Sitemap {
  const gallery = readGallery();
  const baseUrl = `https://${process.env.VERCEL_URL ?? 'shipscore.vercel.app'}`;
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    }
  ];

  // Dynamic ShipScore pages
  const reportPages = gallery.map((entry) => ({
    url: `${baseUrl}${entry.slug}`,
    lastModified: new Date(entry.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...reportPages];
}