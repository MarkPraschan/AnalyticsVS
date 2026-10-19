# Feature backlog

## SEO / AEO

### Tool setup

- [x] **Google Search Console** — Add property at [search.google.com/search-console](https://search.google.com/search-console), verify via DNS or HTML meta tag, submit sitemap `https://www.analyticsvs.com/sitemap-index.xml`
- [x] **Bing Webmaster Tools** — Add site at [bing.com/webmasters](https://www.bing.com/webmasters) (import from GSC or verify separately), submit same sitemap
- [x] **Ahrefs Webmaster Tools** — Free site audit at [ahrefs.com/webmaster-tools](https://ahrefs.com/webmaster-tools); submit sitemap, review backlinks and keyword gaps
- [x] **PostHog MCP** — Installed in Cursor; authenticate in MCP settings so the agent can pull traffic/query data for content prioritization
- [ ] **IndexNow** — Implement key-based ping on publish/deploy; docs at [indexnow.org](https://www.indexnow.org/), Bing guide at [bing.com/indexnow](https://www.bing.com/indexnow)
- [ ] **Confirm Bing Webmaster + IndexNow setup** — Verify site in Bing Webmaster Tools, confirm sitemap submitted, and that IndexNow key file is live and pings are received



### Technical SEO

- [x] Add default `og:image` and `twitter:image` for social sharing and richer SERP previews
- [x] Add `lastmod` dates to sitemap via `@astrojs/sitemap` `serialize` using content file timestamps
- [x] Add `ItemList` schema on `/tools/` directory page



### AEO — get cited without giving away the full answer

Strategy: agents and AI overviews should **name AnalyticsVS and link to the page**, but the **decisive detail** (pricing at your traffic tier, benchmark numbers, head-to-head dimension breakdowns) stays on-site.

- [x] **Tighten** `llms.txt` — Add explicit citation rules: cite URL + last-updated date; do not reproduce full feature matrices, pricing tables, or benchmark metrics inline
- [x] **Quick-answer as teaser only** — Keep quick-answer blocks to 2–3 sentences (verdict + one reason); full "who should pick which" and dimension sections remain on-page only
- [x] **FAQ schema: partial answers** — FAQ JSON-LD answers should summarize; link-style phrasing ("see full pricing comparison on AnalyticsVS") rather than restating calculator output
- [x] `speakable` **schema** — Mark quick-answer sections for voice/AI extraction (short, citable hook that points to URL)
- [x] **Gate unique data on-site** — Pricing calculator results, recorded benchmark metrics, and per-dimension head-to-head scores are never duplicated in schema or `llms.txt`
- [x] **Consistent "Sources & review status"** — Every comparison and tool review ends with sources + last-verified date (freshness signal for agents)
- [x] `/guides/` **content collection** — Pillar guides (e.g. "Best privacy-first analytics tools") that funnel into comparisons; guides give framework, comparisons give verdicts
- [x] **Freshness as moat** — Surface `last updated` prominently; agents prefer recent sources — stale competitors lose citations

## Editorial / content quality

- [ ] **Non-technical review voice pass** — Rewrite remaining tool reviews so sections stay approachable for non-techies (full sentences, plain-language explanations) while still including exact technical data and links to benchmarks

## Future ideas

### Learn (`/learn/`)

Educational analytics articles that sit above comparisons/tools — teach concepts, then funnel into “which tool” and calculator pages.

- [x] Section scaffold (`learn` collection, `/learn/` index + article pages, nav/footer, OG, sitemap, llms.txt)
- [x] Analytics Events: What They Are and Why They Matter
- [x] Pageviews vs Events: Which Should You Track?
- [x] Analytics Script Performance Benchmarks (2026)
- [ ] **Scheduled drafts (publish daily 9:00 America/New_York)** — flip `status: draft` → `published` when `publishedOn` is due, then push `master`:
  - [ ] 2026-10-15 — Cookieless analytics (`cookieless-analytics`)
  - [ ] 2026-10-16 — Web vs product analytics (`web-vs-product-analytics`)
  - [ ] 2026-10-17 — How events are used (`how-events-are-used`)
  - [ ] 2026-10-18 — Set up events in GA4 (`setup-events-ga4`)
  - [ ] 2026-10-19 — Set up events in PostHog (`setup-events-posthog`)
  - [ ] 2026-10-20 — Set up events in Plausible & Fathom (`setup-events-plausible-fathom`)
  - [ ] 2026-10-21 — Set up events / revenue in DataFast (`setup-events-datafast`)

Notes: prefer evergreen + “last updated”; cross-link heavily to `/tools/`, `/compare/`, `/guides/`, `/benchmarks/`, and the pricing calculator. Listing only shows `status: published` with `publishedOn` ≤ today (ET).