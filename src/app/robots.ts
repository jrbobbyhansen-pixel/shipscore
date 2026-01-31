import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/_next/',
        '/.*',
      ],
    },
    sitemap: 'https://squadopsai.vercel.app/ship-score/sitemap.xml',
  };
}