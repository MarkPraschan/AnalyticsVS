# AnalyticsVS content guide

Read this before adding or editing `/learn/` or `/compare/` pages. Future agents should follow it instead of rediscovering the repo.

Site: [https://www.analyticsvs.com](https://www.analyticsvs.com). Stack: Astro 7 content collections (JSON), Tailwind, Vercel static output (`vercel.json`: `buildCommand` `npm run build`, `outputDirectory` `dist`).

## Blog checklist (every Learn article)

Mirror Jake Ward’s “Anatomy of the Perfect Blog Post”:

1. **Keyword-focused H1 and metadata.** `title` is the H1. `seoTitle` (max 70 chars) is the document `<title>` when set. `description` is the meta description (aim ~140–160 chars). Put the target query in the H1 and in the first sentence of the description.
2. **Published and updated dates.** Set `publishedOn` (`YYYY-MM-DD`). The Learn template shows published + updated (file mtime via `getEntryUpdatedDate`). Do not hide dates.
3. **Author byline.** Keep it generic: `Written by AnalyticsVS` (`SITE.author` in `src/lib/site.ts`). Do **not** add a human author, reviewer, co-founder, or “Personally tested” badge — Learn posts are often agent-written and no named person should be credited unless a human actually wrote the article.
4. **Solution + CTA above the fold.** Use optional `heroCta` (`toolId`, `headline`, `note`, `label`). `LearnPostArticle` renders `ArticleSolutionCta` immediately after key takeaways, and a compact copy in the desktop sidebar. The TOC and compact CTA share one `sticky top-28` column (`max-h-[calc(100vh-8rem)]`); the TOC scrolls if needed so the CTA stays fully visible. Mobile is unchanged (sidebar is `hidden lg:block`).
5. **Key takeaways box.** Fill `keyTakeaways` (string array). Rendered by `src/components/KeyTakeaways.astro` (`#key-takeaways`).
6. **H1–H3 structure.** One H1 (`title`). Each `sections[]` item is an H2. Use `###` inside `content` markdown for H3s (`renderReviewMarkdown` supports that).
7. **Short paragraphs.** Split on blank lines. Avoid walls of text.
8. **Contextual internal links.** Link to existing `/compare/`, `/learn/`, `/tools/`, `/calculators/pricing/`, and `/benchmarks/` pages in the body — not only in a related-links dump.
9. **FAQ + schema.** If the page answers distinct questions, add `faq[]`. `LearnPostArticle` outputs FAQPage JSON-LD via `buildFaqSchema`.
10. **Closing CTA.** `toolShortlist` + `toolShortlistHeading` (defaults to “Tools to consider”). Affiliate visit buttons already use `rel="sponsored"` and `AffiliateDisclosure`.
11. **Original visual.** Add `featuredImage` under `public/learn/` (prefer ~1600px-wide 16:9 WebP or JPG under ~300KB) and set `featuredImageAlt` to a real description — never a blank alt on a unique illustration. Tables in markdown are supported.
12. **Evidence.** Every pricing or feature claim must link to a directory profile, comparison, benchmark, or a vendor URL **checked the day you write**. If you cannot verify it, leave it out.

Quick-answer box: `quickAnswer` (also used as speakable schema). Optional `answerUnderTitle` sits under the H1 so the meta description can stay keyword-tight.

## `/learn/` articles

Two collections render on `/learn/[slug]/` (`src/pages/learn/[slug].astro`):

| Kind | Files | Layout |
|---|---|---|
| Learn posts | `src/content/learn/*.json` | `src/components/learn/LearnPostArticle.astro` |
| Guides | `src/content/guides/*.json` | `src/components/learn/GuideLearnArticle.astro` (same URL prefix; old `/guides/` URLs 301) |

Schema: `src/content.config.ts` (`learn` and `guides`).

### Learn post fields that matter

- `title`, `slug`, `description`, `seoTitle?`, `answerUnderTitle?`
- `publishedOn`, `category` (`primers` / `how-to` / `concepts` / `performance` — labels in `src/lib/site.ts`)
- `status`: `published` or `draft` (drafts are omitted from `getPublishedLearnPosts` and the sitemap)
- `featuredImage?`, `quickAnswer?`, `faq[]`, `keyTakeaways[]`, `heroCta?`
- `sections[]`: `{ id, title, content }` — `id` is the heading slug
- `relatedComparisons` (comparison **ids** / filenames), `relatedGuides` (guide slugs), `relatedTools` (tool ids)
- `relatedLinks[]` `{ href, label }`, `relatedBenchmarks[]` (optional recorded matrix)
- `toolShortlist[]` `{ toolId, bestFor }`, `toolShortlistHeading?`

Markdown in `content` supports paragraphs, `**bold**`, `` `code` ``, links, unordered/ordered lists, tables, and `###` H3s. Affiliate outbound URLs matching Fathom / DataFast / Hotjar patterns get `rel="sponsored"`.

### Wiring a new Learn article (sitemap, nav, index)

You usually **do not** edit nav or the sitemap plugin.

1. Add `src/content/learn/<slug>.json` with `status: "published"` and `publishedOn` ≤ today (America/New_York).
2. Add `public/learn/<slug>.jpg` if you set `featuredImage`.
3. `/learn/` index (`src/pages/learn/index.astro`) lists every published post + every guide via `getLearnFeedItems()`.
4. Header nav already has **Learn** → `/learn/` (`src/components/SiteHeader.astro`). Do not add per-article nav items.
5. Sitemap: `@astrojs/sitemap` in `astro.config.ts` plus lastmod from `src/lib/sitemapLastmod.ts` (walks `src/content/learn`). New published slugs appear after `npm run build`.
6. Cross-link from 1–3 existing related pages (`relatedLinks` or a sentence in a section) so the article is not an orphan.

Guides use the same URL space. Prefer a **Learn post** for primers/how-tos with FAQ + takeaways; prefer a **guide** only when you are extending that older evaluation-framework format.

## `/compare/` pages

- Files: `src/content/comparisons/<id>.json` (id is the URL slug).
- Layout: `src/pages/compare/[slug].astro` → `src/components/comparisons/ComparisonReviewPage.astro`.
- Required: exactly two `tools` ids that exist in `src/content/tools/`, plus `verdict`, `quickAnswer`, `bottomLine`, `faq`, etc. (see `content.config.ts`).
- Index: `/compare/` auto-lists every comparison. Header nav already includes Comparisons.
- Sitemap lastmod uses the comparison file plus its tool + review JSON.
- Do not duplicate an existing pair (check `src/content/comparisons/` and `todo-comparisons.md`).

Tool profiles: `src/content/tools/*.json` + optional `src/content/tool-reviews/*.json` → `/tools/[slug]/`.

## Internal linking rules

- Link to **on-site** canonical paths with trailing slashes: `/learn/cookieless-analytics/`, `/compare/posthog-vs-hotjar/`, `/tools/hotjar/`.
- Do not invent tools, comparisons, prices, or benchmark numbers. If a benchmark is not `status: "recorded"`, say it is pending.
- Prefer one in-body contextual link the first time a related page is mentioned; add the same URL to `relatedLinks` for the footer list.
- Do not link `/guides/...` (they 301 to `/learn/...`).
- Outbound vendor links: official docs/pricing for sources; affiliate visit CTAs only as below.

## Affiliate rules

Programs **currently enabled** in `src/content/tools/*.json`:

| Tool | `affiliate.url` (use this, never invent) |
|---|---|
| Fathom | `https://usefathom.com/ref/U4V5UE` |
| DataFast | `https://datafa.st/?via=analyticsvs` |
| Hotjar | `https://invite.contentsquare.com/analyticsvs` |

Rules:

- Set `affiliate.enabled` + `url` only in the tool JSON. Resolve URLs with `getToolVisitUrl` / `isAffiliateTool` (`src/lib/affiliate.ts`). Optional env override: `AFFILIATE_URL_<TOOL_ID>`.
- **Never** paste a guessed referral code. If `enabled` is false, link the vendor `website` without `sponsored`.
- Markdown in Learn/compare bodies may use those three URLs; `src/lib/markdown.ts` stamps `rel="noopener noreferrer sponsored"`.
- **Disclosure is required** on any page that includes an affiliate link. Reuse `src/components/AffiliateDisclosure.astro` (links to `/disclosure/`). It already appears on:
  - `VisitCTA` (inline, when `affiliate` is true)
  - `ToolShortlist`, `TryTheseToolsSection`, `AlsoConsiderBox`
  - Comparison `afterVerdict` when the markdown contains an affiliate URL
  - Learn posts with `heroCta` / shortlist / markdown affiliate URLs (`LearnPostArticle`)
  - Tools index, site footer
- Site-wide policy copy lives at `/disclosure/` (`src/pages/disclosure/index.astro`). Do not duplicate a second disclosure component.

## Source-checking (prices and features)

- Feature presence (`heatmaps`, `cookieless`, …) must match `src/content/tools/<id>.json` **or** a vendor page you opened **today**. If they disagree, say so, follow the vendor page for the article, and flag the JSON snapshot as stale — do not silently pick the more convenient number.
- Prices: quote the directory snapshot **and** the vendor pricing URL with a `checkedOn` date (ISO day), or quote only the vendor page checked today. Never invent a tier.
- Tool reviews already have `sources[]` `{ label, url, checkedOn }`. When you change a price/feature, update `checkedOn` to today.
- Benchmarks: only published recorded metrics from `src/content/benchmarks/`.

## Build, preview, link-check, IndexNow

```bash
npm install          # Node >= 22.12
npm run dev          # or: astro dev --background
npm run build        # fixtures + astro build; postbuild may call IndexNow
npm run check:links  # scan dist HTML for broken internal hrefs (run after build)
npm run preview
```

`check:links` fails the process if an internal `/path` does not exist under `dist/` (ignores `/bench/` fixtures and `/_astro/`).

### IndexNow

- Public key file: `public/10e9597eea9841d0ba00e598be768556.txt` → `https://www.analyticsvs.com/10e9597eea9841d0ba00e598be768556.txt` (public by design; do not add other secrets).
- Submit script: `scripts/indexnow.mjs`. npm scripts: `postbuild` (after `npm run build`) and `indexnow`.
- **Automatic:** Vercel **production** builds only (`VERCEL_ENV=production`). Preview deploys skip.
- **Manual:** `INDEXNOW_SUBMIT=true npm run indexnow` after a build that wrote `dist/sitemap*.xml`.
- Disable: `INDEXNOW_SUBMIT=false`. Failures log a warning and **do not** fail the Vercel build.
- Payload: `host` `www.analyticsvs.com`, `keyLocation` the public txt, `urlList` from the built sitemap. Endpoint: `https://api.indexnow.org/indexnow`.

## Suggested next article ideas

Already shipped (do not rewrite as “new”): cookieless analytics, script performance, events primers + per-tool setup, pageviews vs events, web vs product analytics, privacy-first tools, GA4 GDPR alternatives, SaaS startup chooser, website heatmaps, Hotjar alternatives, Stripe revenue attribution, best analytics for a blog, and the comparison pairs under `src/content/comparisons/`.

Ranked by likely value; none of these have a dedicated page yet.

1. **Self-hosted web analytics** — `self hosted analytics` (Matomo, Umami, PostHog, Fathom Lite).
2. **Open-source web analytics** — `open source web analytics`.
3. **Cookie consent vs cookieless tags** — `analytics cookie consent`.
4. **Ahrefs Web Analytics vs GA4** — `ahrefs web analytics`.
5. **What web analytics costs** — `web analytics pricing` (calculator landing).
6. **Umami vs Matomo** — `umami vs matomo` (missing comparison pair).
7. **Server-side tagging** — `server side tagging` (only if we can source claims without inventing GTM setup).
