import { getCollection } from 'astro:content';
import { SITE } from '../site';
import { getAllTools, getToolsByIds, getToolInitial } from '../tools';
import type { OgImageEntry } from './types';

export async function getOgEntries(): Promise<OgImageEntry[]> {
  const entries: OgImageEntry[] = [
    {
      path: 'index',
      title: 'Independent Analytics Tool Comparisons',
      description: SITE.description,
    },
    {
      path: 'tools',
      title: 'Analytics Tools — Profiles, Pricing & Features',
      description:
        'Browse analytics tools with pricing data, feature breakdowns, and benchmark results.',
    },
    {
      path: 'compare',
      title: 'Analytics Tool Comparisons',
      description: 'Side-by-side comparisons of web, product, and behavior analytics tools.',
    },
    {
      path: 'calculators/pricing',
      title: 'Analytics Pricing Calculator',
      description:
        'Compare estimated monthly costs for analytics platforms at your traffic level.',
    },
    {
      path: 'benchmarks',
      title: 'Script Performance Benchmarks',
      description:
        'Recorded analytics script performance benchmarks measured under controlled conditions.',
    },
    {
      path: 'methodology',
      title: 'Methodology',
      description:
        'How AnalyticsVS sources pricing data, writes comparisons, and records script performance benchmarks.',
    },
    {
      path: 'disclosure',
      title: 'Affiliate Disclosure',
      description: 'AnalyticsVS affiliate relationships and editorial independence policy.',
    },
    {
      path: 'guides',
      title: 'Analytics Evaluation Guides',
      description:
        'Framework-first guides for choosing analytics tools, with links to detailed comparisons.',
    },
  ];

  const tools = await getAllTools();
  for (const tool of tools) {
    entries.push({
      path: `tools/${tool.data.slug}`,
      title: tool.data.name,
      description: tool.data.tagline,
      tools: [{ initial: getToolInitial(tool.data.name), color: tool.data.brandColor }],
    });
  }

  const comparisons = await getCollection('comparisons');
  for (const comparison of comparisons) {
    const comparisonTools = await getToolsByIds(comparison.data.tools);
    entries.push({
      path: `compare/${comparison.id}`,
      title: comparison.data.title,
      description: comparison.data.description,
      tools: comparisonTools.map((tool) => ({
        initial: getToolInitial(tool.data.name),
        color: tool.data.brandColor,
      })),
    });
  }

  const benchmarks = (await getCollection('benchmarks')).filter(
    (benchmark) => benchmark.data.status === 'recorded',
  );
  for (const benchmark of benchmarks) {
    const tool = tools.find((entry) => entry.data.id === benchmark.data.tool);
    entries.push({
      path: `benchmarks/${benchmark.data.slug}`,
      title: benchmark.data.title,
      description: `Script performance benchmark for ${tool?.data.name ?? benchmark.data.tool}.`,
      tools: tool
        ? [{ initial: getToolInitial(tool.data.name), color: tool.data.brandColor }]
        : undefined,
    });
  }

  const guides = await getCollection('guides');
  for (const guide of guides) {
    entries.push({
      path: `guides/${guide.data.slug}`,
      title: guide.data.title,
      description: guide.data.description,
    });
  }

  return entries;
}
