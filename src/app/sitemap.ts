import { MetadataRoute } from 'next';
import { readGallery } from '@/lib/gallery';

export default function sitemap(): MetadataRoute.Sitemap {
  const gallery = readGallery();
  const baseUrl = 'https://squadopsai.vercel.app/ship-score';
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    }
  ];

  // Dynamic report pages
  const reportPages = gallery.map((entry) => ({
    url: `${baseUrl}/report/${entry.slug}`,
    lastModified: new Date(entry.scannedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...reportPages];
}