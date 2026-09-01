import { summarizeFaqAnswerForSchema } from './aeo';
import { SITE } from './site';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ArticleSchemaInput {
  title: string;
  description: string;
  url: string;
  dateModified: string;
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
