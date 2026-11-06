import type { CollectionEntry } from 'astro:content';
import { summarizeFaqAnswerForSchema } from './aeo';
import { formatCategory, SITE } from './site';

type ToolEntry = CollectionEntry<'tools'>;

const SCHEMA_IN_STOCK = 'https://schema.org/InStock';

function toolOfferUrl(tool: ToolEntry['data']): string {
  if (tool.affiliate.enabled && tool.affiliate.url) {
    return tool.affiliate.url;
  }
  return tool.website;
}

/** Numeric tier prices only — null (contact-only) bands are ignored. */
function numericTierPrices(tool: ToolEntry['data']): number[] {
  return (tool.pricing.tiers ?? [])
    .map((tier) => tier.price)
    .filter((price): price is number => typeof price === 'number');
}

function buildSoftwareApplicationOffers(
  tool: ToolEntry['data'],
): Record<string, unknown> | undefined {
  const currency = tool.pricing.currency || 'USD';
  const offerUrl = toolOfferUrl(tool);
  const prices = numericTierPrices(tool);
  const cheapest = prices.length > 0 ? Math.min(...prices) : null;

  if (tool.pricing.model === 'free' || cheapest === 0) {
    return {
      '@type': 'Offer',
      price: '0',
      priceCurrency: currency,
      url: offerUrl,
      availability: SCHEMA_IN_STOCK,
    };
  }

  if (prices.length >= 2) {
    return {
      '@type': 'AggregateOffer',
      lowPrice: String(Math.min(...prices)),
      highPrice: String(Math.max(...prices)),
      priceCurrency: currency,
      offerCount: prices.length,
      url: offerUrl,
      availability: SCHEMA_IN_STOCK,
    };
  }

  if (prices.length === 1) {
    return {
      '@type': 'Offer',
      price: String(prices[0]),
      priceCurrency: currency,
      url: offerUrl,
      availability: SCHEMA_IN_STOCK,
    };
  }

  // Custom / sales-led / no published numeric tiers — never invent a price.
  if (tool.pricing.model === 'custom' || prices.length === 0) {
    return {
      '@type': 'Offer',
      description: tool.pricing.notes?.trim() || 'Custom pricing',
      url: tool.website,
      availability: SCHEMA_IN_STOCK,
    };
  }

  return undefined;
}

/**
 * SoftwareApplication JSON-LD for /tools/[slug]/ pages.
 * Prefer this over Product schema for analytics SaaS profiles.
 */
export function buildSoftwareApplicationSchema(tool: ToolEntry): Record<string, unknown> {
  const pageUrl = new URL(`/tools/${tool.data.slug}/`, SITE.url).href;
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.data.name,
    description: tool.data.tagline,
    url: pageUrl,
    applicationCategory: formatCategory(tool.data.category),
    operatingSystem: 'Web',
  };

  const offers = buildSoftwareApplicationOffers(tool.data);
  if (offers) {
    schema.offers = offers;
  }

  return schema;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ArticleSchemaInput {
  title: string;
  description: string;
  url: string;
  dateModified: string;
  datePublished?: string;
  image?: string;
  breadcrumbs: BreadcrumbItem[];
  speakableCssSelector?: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSchemaOptions {
  pageUrl: string;
  sectionLabel?: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildArticleSchema(input: ArticleSchemaInput): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: input.url,
    dateModified: input.dateModified,
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.image ? { image: [input.image] } : {}),
    author: {
      '@type': 'Organization',
      name: SITE.author,
      url: SITE.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
  };

  if (input.speakableCssSelector) {
    schema.speakable = {
      '@type': 'SpeakableSpecification',
      cssSelector: [input.speakableCssSelector],
    };
  }

  return schema;
}

export function buildFaqSchema(
  faq: FaqItem[],
  options?: FaqSchemaOptions,
): Record<string, unknown> | null {
  if (faq.length === 0) return null;

  const sectionLabel = options?.sectionLabel ?? 'full answer';

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: options
          ? summarizeFaqAnswerForSchema(item.answer, options.pageUrl, sectionLabel)
          : item.answer,
      },
    })),
  };
}

export function buildWebSiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
  };
}

interface ItemListEntry {
  name: string;
  url: string;
}

interface ItemListSchemaInput {
  name: string;
  description: string;
  url: string;
  items: ItemListEntry[];
}

export function buildItemListSchema(input: ItemListSchemaInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: input.name,
    description: input.description,
    url: input.url,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
