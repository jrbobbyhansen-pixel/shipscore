# ShipScore 🛳️

AI-powered analyzer for App Store \"ship scores\" – grading apps on readiness criteria like localization, IAP, screenshots, etc.

## Quick Start

```bash
npm i
npm run dev
```

## Build & Deploy

```bash
npm run build
vercel --prod
```

## Gallery Data

Static data in `src/data/gallery.json`. Updated via `/api/analyze`.

## Sitemap

Dynamic `/sitemap.xml` generated from gallery.