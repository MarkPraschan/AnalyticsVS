import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const affiliateSchema = z.object({
  enabled: z.boolean(),
  url: z.string().url().optional(),
  commission: z.string().optional(),
});

const pricingTierSchema = z.object({
  limit: z.number(),
  price: z.number(),
  label: z.string().optional(),
});

const pricingSchema = z.object({
  model: z.enum([
    'free',
    'monthly_pageviews',
    'monthly_events',
    'tiered_sessions',
    'custom',
  ]),
  currency: z.string().default('USD'),
  tiers: z.array(pricingTierSchema).optional(),
  basePrice: z.number().optional(),
  freeLimit: z.number().optional(),
  hasFreeTrial: z.boolean().optional(),
  notes: z.string().optional(),
  projectLimits: z
    .object({
      included: z.number().optional(),
      unlimited: z.boolean().optional(),
      plans: z
        .array(
          z.object({
            name: z.string(),
            maxProjects: z.number(),
            notes: z.string().optional(),
          }),
        )
        .optional(),
      billingModel: z.enum(['per_site', 'tiered']).optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

const featuresSchema = z.object({
  cookieless: z.boolean().optional(),
  gdpr_compliant: z.boolean().optional(),
  real_time: z.boolean().optional(),
  custom_events: z.boolean().optional(),
  funnels: z.boolean().optional(),
  heatmaps: z.boolean().optional(),
  session_recordings: z.boolean().optional(),
  ab_testing: z.boolean().optional(),
  product_analytics: z.boolean().optional(),
  self_hosted: z.boolean().optional(),
  open_source: z.boolean().optional(),
  revenue_tracking: z.boolean().optional(),
});

const toolVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  deployment: z.enum(['cloud', 'self-hosted']),
  website: z.string().url(),
  summary: z.string(),
  features: featuresSchema.partial().optional(),
});

const tools = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/tools' }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    category: z.string(),
    tagline: z.string(),
    website: z.string().url(),
    brandColor: z.string(),
    logo: z.string().optional(),
    affiliate: affiliateSchema,
    pricing: pricingSchema,
    features: featuresSchema,
    variants: z.array(toolVariantSchema).default([]),
  }),
});

const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const editorialNoteSchema = z.object({
  title: z.string(),
  content: z.string(),
});

const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/comparisons' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tools: z.array(z.string()).length(2),
    category: z.string(),
    winner: z.string().nullable().optional(),
    verdict: z.string(),
    quickAnswer: z.string(),
    bottomLine: z.string(),
    faq: z.array(faqSchema).default([]),
    editorialNotes: z.array(editorialNoteSchema).default([]),
  }),
});

const benchmarkMetricsSchema = z.object({
  transferSizeBytes: z.number().nullable().optional(),
  decodedBodySizeBytes: z.number().nullable().optional(),
  mainThreadBlockingMs: z.number().nullable().optional(),
  lighthouseScoreImpact: z.number().nullable().optional(),
});

const benchmarks = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/benchmarks' }),
  schema: z.object({
    tool: z.string(),
    testDate: z.string(),
    slug: z.string(),
    title: z.string(),
    status: z.enum(['pending', 'recorded']),
    environment: z.object({
      connection: z.string(),
      device: z.string(),
    }),
    metrics: benchmarkMetricsSchema,
    methodology: z.string(),
    rawResultsUrl: z.string().url().nullable().optional(),
  }),
});

const reviewDimensionSchema = z.enum([
  'privacy-compliance',
  'analytics-scope',
  'product-capabilities',
  'revenue-attribution',
  'integrations',
  'deployment',
  'ux-reliability',
  'other',
]);

const toolReviewSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  dimension: reviewDimensionSchema,
  content: z.string(),
});

const toolReviewSourceSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  checkedOn: z.string(),
});

const toolReviews = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/tool-reviews' }),
  schema: z.object({
    tool: z.string(),
    reviewScope: z.string().optional(),
    reviewStatus: z.enum(['draft', 'reviewed', 'verified']),
    quickAnswer: z.string(),
    bestFor: z.array(z.string()),
    notFor: z.array(z.string()),
    sections: z.array(toolReviewSectionSchema),
    setupNotes: z.string(),
    pricingNotes: z.string(),
    limitations: z.array(z.string()),
    faq: z.array(faqSchema),
    sources: z.array(toolReviewSourceSchema),
  }),
});

export const collections = { tools, comparisons, benchmarks, toolReviews };
