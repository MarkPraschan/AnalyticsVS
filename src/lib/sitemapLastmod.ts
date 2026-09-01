import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getContentUpdatedDate, getLatestContentUpdatedDate } from './contentDates';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

interface JsonFile<T> {
  id: string;
  filePath: string;
  data: T;
}

interface ToolJson {
  id: string;
  slug: string;
}

interface ComparisonJson {
  tools: string[];
}

interface BenchmarkJson {
  slug: string;
}

interface ToolReviewJson {
  tool: string;
}

interface GuideJson {
  slug: string;
}

function pagePath(relativePath: string): string {
  return path.join(projectRoot, relativePath);
}

function readJsonFiles<T>(relativeDir: string): JsonFile<T>[] {
  const directory = path.join(projectRoot, relativeDir);
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => {
      const filePath = path.join(directory, fileName);
      return {
        id: fileName.replace(/\.json$/, ''),
        filePath,
        data: JSON.parse(fs.readFileSync(filePath, 'utf8')) as T,
      };
    });
}

function setLastmod(map: Map<string, string>, key: string, date: string) {
  const existing = map.get(key);
  if (!existing || date > existing) {
    map.set(key, date);
  }
}

export function pathnameToSitemapKey(pathname: string): string {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  return trimmed.length === 0 ? 'index' : trimmed;
}

export async function buildSitemapLastmodMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  const tools = readJsonFiles<ToolJson>('src/content/tools');
  const comparisons = readJsonFiles<ComparisonJson>('src/content/comparisons');
  const benchmarks = readJsonFiles<BenchmarkJson>('src/content/benchmarks');
  const reviews = readJsonFiles<ToolReviewJson>('src/content/tool-reviews');
  const guides = readJsonFiles<GuideJson>('src/content/guides');

  const toolsById = new Map(tools.map((tool) => [tool.data.id, tool]));
  const reviewsByTool = new Map(reviews.map((review) => [review.data.tool, review]));

  for (const tool of tools) {
    const review = reviewsByTool.get(tool.data.id);
    setLastmod(
      map,
      `tools/${tool.data.slug}`,
      getLatestContentUpdatedDate([tool.filePath, review?.filePath]),
    );
  }

  setLastmod(
    map,
    'tools',
    getLatestContentUpdatedDate([
      pagePath('src/pages/tools/index.astro'),
      ...tools.map((tool) => tool.filePath),
      ...reviews.map((review) => review.filePath),
    ]),
  );

  for (const comparison of comparisons) {
    const toolPaths = comparison.data.tools.flatMap((toolId) => {
      const tool = toolsById.get(toolId);
      return tool ? [tool.filePath] : [];
    });
    const reviewPaths = comparison.data.tools.flatMap((toolId) => {
      const review = reviewsByTool.get(toolId);
      return review ? [review.filePath] : [];
    });

    setLastmod(
      map,
      `compare/${comparison.id}`,
      getLatestContentUpdatedDate([comparison.filePath, ...toolPaths, ...reviewPaths]),
    );
  }

  setLastmod(
    map,
    'compare',
    getLatestContentUpdatedDate([
      pagePath('src/pages/compare/index.astro'),
      ...comparisons.map((comparison) => comparison.filePath),
      ...comparisons.flatMap((comparison) =>
        comparison.data.tools.map((toolId) => toolsById.get(toolId)?.filePath),
      ),
      ...comparisons.flatMap((comparison) =>
        comparison.data.tools.map((toolId) => reviewsByTool.get(toolId)?.filePath),
      ),
    ]),
  );

  for (const benchmark of benchmarks) {
    setLastmod(map, `benchmarks/${benchmark.data.slug}`, getContentUpdatedDate(benchmark.filePath));
  }

  setLastmod(
    map,
    'benchmarks',
    getLatestContentUpdatedDate([
      pagePath('src/pages/benchmarks/index.astro'),
      ...benchmarks.map((benchmark) => benchmark.filePath),
    ]),
  );

  setLastmod(
    map,
    'methodology',
    getContentUpdatedDate(pagePath('src/pages/methodology/index.astro')),
  );
  setLastmod(map, 'disclosure', getContentUpdatedDate(pagePath('src/pages/disclosure/index.astro')));

  setLastmod(
    map,
    'calculators/pricing',
    getLatestContentUpdatedDate([
      pagePath('src/pages/calculators/pricing.astro'),
      ...tools.map((tool) => tool.filePath),
    ]),
  );

  setLastmod(
    map,
    'index',
    getLatestContentUpdatedDate([
      pagePath('src/pages/index.astro'),
      ...tools.map((tool) => tool.filePath),
      ...comparisons.map((comparison) => comparison.filePath),
    ]),
  );

  setLastmod(
    map,
    'guides',
    getLatestContentUpdatedDate([
      pagePath('src/pages/guides/index.astro'),
      ...guides.map((guide) => guide.filePath),
    ]),
  );

  for (const guide of guides) {
    setLastmod(map, `guides/${guide.data.slug}`, getContentUpdatedDate(guide.filePath));
  }

  return map;
}
