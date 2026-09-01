import type { CollectionEntry } from 'astro:content';
import type { ToolReview } from './types';

type ToolEntry = CollectionEntry<'tools'>;

const ABSOLUTE_SELF_HOST_DENIALS = [
  /\bcloud-only\b/i,
  /\bno self-host(?:ed|ing)?\b/i,
  /\bdoes not offer self-host(?:ing)?\b/i,
  /\bwithout self-host(?:ing)?\b/i,
];

function collectReviewText(review: ToolReview): string {
  return [
    review.reviewScope ?? '',
    review.quickAnswer,
    ...review.bestFor,
    ...review.notFor,
    ...review.sections.map((section) => section.content),
    review.setupNotes,
    review.pricingNotes,
    ...review.limitations,
    ...review.faq.flatMap((item) => [item.question, item.answer]),
  ].join('\n');
}

function mentionsAnyVariant(text: string, variantNames: string[]): boolean {
  return variantNames.some((name) => text.toLowerCase().includes(name.toLowerCase()));
}

export function validateToolReviewAccuracy(tool: ToolEntry, review: ToolReview): void {
  const errors: string[] = [];
  const variants = tool.data.variants ?? [];
  const variantNames = variants.map((variant) => variant.name);
  const selfHostedVariants = variants.filter(
    (variant) => variant.deployment === 'self-hosted' || variant.features?.self_hosted,
  );
  const reviewText = collectReviewText(review);

  if (variants.length > 0 && !review.reviewScope?.trim()) {
    errors.push(`${tool.data.id}: reviewScope is required when the tool has product variants.`);
  }

  if (selfHostedVariants.length > 0) {
    const qualifiesHostedProduct =
      /\bhosted\b/i.test(reviewText) ||
      /\bprimary product\b/i.test(reviewText) ||
      mentionsAnyVariant(reviewText, variantNames);

    for (const pattern of ABSOLUTE_SELF_HOST_DENIALS) {
      if (pattern.test(reviewText) && !qualifiesHostedProduct && !mentionsAnyVariant(reviewText, variantNames)) {
        errors.push(
          `${tool.data.id}: review denies self-hosting outright, but variants include self-hosted option(s): ${selfHostedVariants.map((variant) => variant.name).join(', ')}.`,
        );
        break;
      }
    }

    for (const variant of selfHostedVariants) {
      const sourceMatchesVariant = review.sources.some(
        (source) =>
          source.url.includes(variant.id.replace(/-/g, '')) ||
          source.label.toLowerCase().includes(variant.name.toLowerCase()) ||
          source.url === variant.website,
      );
      if (!sourceMatchesVariant) {
        errors.push(
          `${tool.data.id}: missing source for self-hosted variant "${variant.name}" (${variant.website}).`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Review accuracy check failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }
}

export function validateComparisonSelfHostingClaims(
  comparisonId: string,
  faq: Array<{ question: string; answer: string }>,
  tools: ToolEntry[],
): void {
  const selfHostAnswers = faq.filter((item) => /self-host/i.test(item.question));
  if (selfHostAnswers.length === 0) return;

  for (const item of selfHostAnswers) {
    for (const tool of tools) {
      const variants = tool.data.variants ?? [];
      const selfHostedVariants = variants.filter(
        (variant) => variant.deployment === 'self-hosted' || variant.features?.self_hosted,
      );
      if (selfHostedVariants.length === 0) continue;

      const mentionsTool = item.answer.toLowerCase().includes(tool.data.name.toLowerCase());
      const deniesSelfHost = /\bcloud-only\b/i.test(item.answer) || /\bdoes not offer self-host/i.test(item.answer);
      const mentionsVariant = mentionsAnyVariant(
        item.answer,
        selfHostedVariants.map((variant) => variant.name),
      );

      if (mentionsTool && deniesSelfHost && !mentionsVariant) {
        throw new Error(
          `Comparison "${comparisonId}" FAQ "${item.question}" incorrectly denies self-hosting for ${tool.data.name}. Mention variant(s): ${selfHostedVariants.map((variant) => variant.name).join(', ')}.`,
        );
      }
    }
  }
}
