# AnalyticsVS script benchmarks

Controlled, repeatable measurements of **analytics script load cost** on a minimal static fixture.

## What you need to do (one-time)

### 1. DNS

Add a subdomain for the benchmark host (keeps lab traffic out of your main site analytics):

| Type | Name | Value |
|------|------|--------|
| **CNAME** | `bench` | Your Vercel DNS target (e.g. `cname.vercel-dns.com`) |

In **Vercel → Project → Settings → Domains**, add:

```
bench.analyticsvs.com
```

Point it at the same `analyticsvs` project as production. Fixtures are static files under `/bench/minimal-v1/` in `public/`.

Verify after deploy:

```
https://bench.analyticsvs.com/bench/minimal-v1/plausible/
```

(404 is fine until snippets are configured and fixtures rebuilt.)

### 2. Snippets (your accounts)

**File to edit:** `benchmarks/config/snippets.json` (gitignored)

1. Copy the template:
   ```bash
   cp benchmarks/config/snippets.example.json benchmarks/config/snippets.json
   ```
2. Create a **free or trial account** for each tool you want to benchmark.
3. Register the site **`bench.analyticsvs.com`** in each vendor dashboard.
4. Paste each vendor's **default eager `<script>` install** into `tools.{id}.headHtml`.
5. Do **not** use Google Tag Manager — snippet only, in `<head>`.

Snippet keys are visible in the browser anyway; we gitignore the file so you do not commit half-filled configs by accident.

### 3. Build fixture pages

```bash
npm run benchmark:fixtures
```

Writes HTML to `public/bench/minimal-v1/{tool}/index.html` (deployed with the site).

### 4. Run benchmarks

```bash
# Local (after npm run dev)
npm run benchmark:run

# Production fixture host
BENCHMARK_BASE_URL=https://bench.analyticsvs.com npm run benchmark:run

# Single tool
npm run benchmark:run -- --tool plausible
```

Requires Chromium (`npm run benchmark:install`).

Results land in `benchmarks/results/{tool}-{date}.json`.

### 5. Publish to the site

```bash
npm run benchmark:import -- benchmarks/results/plausible-2026-09-01.json
```

Updates `src/content/benchmarks/*.json` and sets `status: "recorded"`.

---

## Methodology (minimal-v1)

| Setting | Value |
|---------|--------|
| Fixture | Static HTML, no fonts, images, frameworks, GTM, or CMP |
| Install | Vendor default snippet in `<head>`, eager load |
| Network | Fast 4G (150ms RTT, 1.6 Mbps down) via CDP |
| Browser | Chromium (Playwright) |
| Runs | 7 cold navigations per tool |
| Published value | **Arithmetic mean** per metric |
| Scope | Initial page load only (first 5s after `load`) |

### Metrics

| Metric | Definition |
|--------|------------|
| **Transfer size** | Sum of `encodedDataLength` for `.js` responses matching vendor host patterns |
| **Decoded body size** | Sum of `decodedBodyLength` for those scripts |
| **Main-thread blocking** | Sum of `(duration − 50ms)` for long tasks >50ms in the first 5s after load |

`lighthouseScoreImpact` is left null in v1.

---

## Repo layout

```
benchmarks/
  config/
    manifest.json
    snippets.example.json
    snippets.json          # gitignored — your snippets
  results/
scripts/benchmarks/
  build-fixtures.mjs
  run.mjs
  import.mjs
public/bench/minimal-v1/   # generated fixture HTML
```
