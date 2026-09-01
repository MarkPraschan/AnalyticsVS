import type { CollectionEntry } from 'astro:content';
import { getToolById, getBenchmarksForTool, type ToolEntry } from '../tools';
import { getEntryUpdatedDate } from '../contentDates';
import { getToolReview, getToolReviewEntry, type ToolReview } from '../reviews';
import { alignReviewSections } from './alignSections';
import { mergeComparisonFaqs } from './mergeFaqs';
import { validateComparisonSelfHostingClaims, validateToolReviewAccuracy } from '../reviews/validate';
import type { ToolReviewFaq, ToolReviewSource } from '../reviews/types';
import type { AlignedDimension } from './alignSections';

export interface ComparisonToolContext {
  tool: ToolEntry;
  review: ToolReview;
}

export interface ComparisonPageContext {
  tools: ComparisonToolContext[];
  dimensions: AlignedDimension[];
  mergedFaq: ToolReviewFaq[];
  sources: Array<ToolReviewSource & { toolName: string }>;
  latestReviewedOn: string;
}

export async function buildComparisonContext(
  comparison: CollectionEntry<'comparisons'>,
): Promise<ComparisonPageContext> {
  const toolEntries = await Promise.all(comparison.data.tools.map((id) => getToolById(id)));
  const tools = toolEntries.filter((tool): tool is ToolEntry => tool != null);

  if (tools.length !== comparison.data.tools.length) {
    const missing = comparison.data.tools.filter((id) => !tools.some((tool) => tool.data.id === id));
    throw new Error(
      `Comparison "${comparison.id}" references missing tools: ${missing.join(', ')}`,
    );
  }

  const reviews = await Promise.all(
    tools.map(async (tool) => ({
      tool,
      review: await getToolReview(tool.data.id, tool.data.slug),
    })),
  );

  const missingReviews = reviews.filter(({ review }) => !review);
  if (missingReviews.length > 0) {
    const names = missingReviews.map(({ tool }) => tool.data.id).join(', ');
    throw new Error(
      `Comparison "${comparison.id}" requires reviews for all tools. Missing: ${names}`,
    );
  }

  const pairs = reviews.map(({ tool, review }) => ({
    tool,
    review: review!,
  }));

  for (const { tool, review } of pairs) {
    validateToolReviewAccuracy(tool, review);
  }

  validateComparisonSelfHostingClaims(comparison.id, comparison.data.faq, tools);

  const dimensions = alignReviewSections(pairs);
  const mergedFaq = mergeComparisonFaqs(
    comparison.data.faq,
    tools.map((tool) => tool.data.name),
    pairs.map(({ review }) => review.faq),
  );

  const sources = pairs.flatMap(({ tool, review }) =>
    review.sources.map((source) => ({
      ...source,
      toolName: tool.data.name,
    })),
  );

  const reviewEntries = await Promise.all(
    tools.map((tool) => getToolReviewEntry(tool.data.id)),
  );

  const latestReviewedOn = reviewEntries
    .filter((entry): entry is NonNullable<typeof entry> => entry != null)
    .map((entry) => getEntryUpdatedDate(entry))
    .sort()
    .at(-1)!;

  return {
    tools: pairs,
    dimensions,
    mergedFaq,
    sources,
    latestReviewedOn,
  };
}

export async function getBenchmarksForComparison(toolIds: string[]) {
  const benchmarkLists = await Promise.all(toolIds.map((id) => getBenchmarksForTool(id)));
  return benchmarkLists.flat();
}

export type { AlignedDimension, DimensionEntry } from './alignSections';
