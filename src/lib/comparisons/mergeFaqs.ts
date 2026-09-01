import type { CollectionEntry } from 'astro:content';
import type { ToolReviewFaq } from '../reviews/types';

export function mergeComparisonFaqs(
  comparisonFaqs: ToolReviewFaq[],
  toolNames: string[],
  reviewFaqs: ToolReviewFaq[][],
): ToolReviewFaq[] {
  const merged: ToolReviewFaq[] = [...comparisonFaqs];
  const seen = new Set(comparisonFaqs.map((item) => normalizeQuestion(item.question)));

  const otherNames = toolNames.map((name) => name.toLowerCase());

  for (const faqs of reviewFaqs) {
    for (const item of faqs) {
      const normalized = normalizeQuestion(item.question);
      if (seen.has(normalized)) continue;

      const question = item.question.toLowerCase();
      const mentionsPair =
        otherNames.filter((name) => question.includes(name)).length >= 2 ||
        question.includes(' vs ') ||
        question.includes(' versus ');

      if (mentionsPair) {
        merged.push(item);
        seen.add(normalized);
      }
    }
  }

  return merged;
}

function normalizeQuestion(question: string): string {
  return question.trim().toLowerCase().replace(/\s+/g, ' ');
}

export type ComparisonEntry = CollectionEntry<'comparisons'>;
