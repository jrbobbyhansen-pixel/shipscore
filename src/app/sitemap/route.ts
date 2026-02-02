import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const baseUrl = origin; // Use origin for production
  const siteUrl = `${baseUrl}/sitemap.xml`;

  const gallery = await import('../../../data/gallery.json');

  const dates = gallery.default.map((item) => item.date).sort().reverse();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${gallery.default.map((item) => `
  <url>
    <loc>${baseUrl}${item.slug}</loc>
    <lastmod>${item.date || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n  ')}
</urlset>`;

  return new NextResponse(sitemap, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
}