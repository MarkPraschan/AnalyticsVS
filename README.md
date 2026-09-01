# AnalyticsVS

Independent benchmark directory and comparison engine for web, product, and revenue analytics tools.

Built with [Astro](https://astro.build), Tailwind CSS, and Astro Content Collections.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Build

```bash
npm run build
npm run preview
```

## Content structure

| Directory | Format | Purpose |
|-----------|--------|---------|
| `src/content/tools/` | JSON | Tool profiles, pricing tiers, affiliate links |
| `src/content/comparisons/` | MDX | "X vs Y" comparison pages |
| `src/content/benchmarks/` | JSON | Recorded script performance data |

## Adding content

### New tool

Create `src/content/tools/your-tool.json` following the schema in `src/content.config.ts`.

### New comparison

Create `src/content/comparisons/tool-a-vs-tool-b.json` with required fields (`title`, `description`, `tools`, `category`, `tldr`, `faq`). Last-updated dates are derived automatically from content file modification time at build.

### New benchmark

Create `src/content/benchmarks/your-benchmark.json` with `status: "pending"` until you record real data. Never publish estimated metrics.

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add custom domains `www.analyticsvs.com` (primary) and `analyticsvs.com` in Project Settings → Domains
4. Point DNS:
   - Apex (`@`): A record to Vercel's IP, or ALIAS/ANAME if your registrar supports it
   - `www`: CNAME to `cname.vercel-dns.com`
5. Vercel auto-detects Astro via `vercel.json`

Or deploy from CLI:

```bash
npx vercel --prod
```

## Deployment (Cloudflare Pages)

1. Connect GitHub repo in Cloudflare Pages
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add custom domain in Pages settings
