import type { ToolEntry } from '../tools';
import type { ToolReview, ToolReviewSection } from '../reviews/types';
import {
  DIMENSION_ORDER,
  getDimensionLabel,
  type ReviewDimension,
} from '../reviews/dimensions';

export interface DimensionEntry {
  tool: ToolEntry;
  review: ToolReview;
  section: ToolReviewSection;
}

export interface AlignedDimension {
  dimension: ReviewDimension;
  title: string;
  slug: string;
  entries: DimensionEntry[];
  uniqueToOneTool: boolean;
}

function dimensionSlug(dimension: ReviewDimension): string {
  return dimension;
}

export function alignReviewSections(
  pairs: Array<{ tool: ToolEntry; review: ToolReview }>,
): AlignedDimension[] {
  const byDimension = new Map<ReviewDimension, DimensionEntry[]>();

  for (const { tool, review } of pairs) {
    for (const section of review.sections) {
      const dimension = section.dimension;
      const list = byDimension.get(dimension) ?? [];
      list.push({ tool, review, section });
      byDimension.set(dimension, list);
    }
  }

  return DIMENSION_ORDER.filter((dimension) => byDimension.has(dimension)).map((dimension) => {
    const entries = byDimension.get(dimension) ?? [];
    const toolIds = new Set(entries.map((entry) => entry.tool.data.id));
    return {
      dimension,
      title: getDimensionLabel(dimension),
      slug: dimensionSlug(dimension),
      entries,
      uniqueToOneTool: toolIds.size === 1 && pairs.length > 1,
    };
  });
}

export function getUniqueDimensionSections(
  pairs: Array<{ tool: ToolEntry; review: ToolReview }>,
): AlignedDimension[] {
  return alignReviewSections(pairs).filter((item) => item.uniqueToOneTool);
}

export function getSharedDimensionSections(
  pairs: Array<{ tool: ToolEntry; review: ToolReview }>,
): AlignedDimension[] {
  return alignReviewSections(pairs).filter((item) => !item.uniqueToOneTool);
}
