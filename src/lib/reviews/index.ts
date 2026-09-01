import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { getEntryUpdatedDate } from '../contentDates';
import type { ToolReview } from './types';

export type ToolReviewEntry = CollectionEntry<'toolReviews'>;

function toToolReview(entry: ToolReviewEntry, slug: string): ToolReview {
  return {
    slug,
    reviewScope: entry.data.reviewScope,
    reviewStatus: entry.data.reviewStatus,
    reviewedOn: getEntryUpdatedDate(entry),
    quickAnswer: entry.data.quickAnswer,
    bestFor: entry.data.bestFor,
    notFor: entry.data.notFor,
    sections: entry.data.sections,
    setupNotes: entry.data.setupNotes,
    pricingNotes: entry.data.pricingNotes,
    limitations: entry.data.limitations,
    faq: entry.data.faq,
    sources: entry.data.sources,
  };
}

export async function getToolReviewEntry(toolId: string): Promise<ToolReviewEntry | undefined> {
  const reviews = await getCollection('toolReviews');
  return reviews.find((item) => item.id === toolId || item.data.tool === toolId);
}

export async function getToolReview(toolId: string, slug: string): Promise<ToolReview | undefined> {
  const entry = await getToolReviewEntry(toolId);
  if (!entry) return undefined;
  return toToolReview(entry, slug);
}

export async function getAllToolReviews(): Promise<ToolReviewEntry[]> {
  return getCollection('toolReviews');
}

export type { ToolReview, ToolReviewFaq, ToolReviewSection, ToolReviewSource } from './types';
export {
  DIMENSION_LABELS,
  DIMENSION_ORDER,
  REVIEW_DIMENSIONS,
  getDimensionLabel,
  type ReviewDimension,
} from './dimensions';
