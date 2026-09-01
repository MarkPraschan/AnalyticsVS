import type { PricingInput, PricingResult } from './types';

export interface ToolProjectConfig {
  /** No per-site or per-plan project limits (e.g. GA4). */
  unlimited?: boolean;
  /** Sites/properties included on the default published plan. */
  includedProjects?: number;
  /** Charge per site by multiplying the volume-based estimate (e.g. Fathom). */
  perSiteMultiplier?: boolean;
  /** Named plans when you exceed included project count. */
  plans?: Array<{
    name: string;
    maxProjects: number;
  }>;
  /** Free usage only applies up to this many projects; more need billing (PostHog). */
  billingRequiredAbove?: number;
}

export const TOOL_PROJECT_CONFIGS: Record<string, ToolProjectConfig> = {
  'google-analytics-4': { unlimited: true },
  plausible: {
    includedProjects: 1,
    plans: [{ name: 'Growth', maxProjects: 3 }],
  },
  fathom: {
    includedProjects: 1,
    perSiteMultiplier: true,
  },
  hotjar: {
    includedProjects: 1,
    perSiteMultiplier: true,
  },
  posthog: {
    includedProjects: 1,
    billingRequiredAbove: 1,
    plans: [{ name: 'Billed', maxProjects: Number.POSITIVE_INFINITY }],
  },
  umami: {
    includedProjects: 1,
    plans: [{ name: 'Pro', maxProjects: 10 }, { name: 'Business', maxProjects: 100 }],
  },
  datafast: {
    includedProjects: 1,
    plans: [{ name: 'Growth', maxProjects: 30 }],
  },
  matomo: {
    includedProjects: 1,
    perSiteMultiplier: true,
  },
  ahrefs: {
    includedProjects: 1,
    perSiteMultiplier: true,
  },
};

export function projectCount(input: PricingInput): number {
  return Math.max(1, Math.floor(input.projects || 1));
}

export function resolveProjectPlan(
  config: ToolProjectConfig | undefined,
  projects: number,
): { name: string; maxProjects: number } | null {
  if (!config || config.unlimited) {
    return { name: 'Any', maxProjects: Number.POSITIVE_INFINITY };
  }

  const included = config.includedProjects ?? 1;
  if (projects <= included) {
    return { name: 'Default', maxProjects: included };
  }

  const plan = config.plans?.find((entry) => projects <= entry.maxProjects);
  if (plan) return plan;

  const highest = config.plans?.[config.plans.length - 1];
  if (highest && projects > highest.maxProjects) return null;

  return null;
}

export function applyProjectPricing(
  config: ToolProjectConfig | undefined,
  input: PricingInput,
  result: PricingResult,
): PricingResult {
  if (!config || config.unlimited) {
    return result;
  }

  const projects = projectCount(input);
  const plan = resolveProjectPlan(config, projects);

  if (!plan) {
    return {
      monthlyCost: null,
      label: `Exceeds published site limits (${projects.toLocaleString()} sites)`,
      note: result.note,
    };
  }

  let monthlyCost = result.monthlyCost;
  let label = result.label;

  if (config.perSiteMultiplier && projects > 1 && monthlyCost !== null) {
    monthlyCost *= projects;
    label = `${result.label} · ${projects} sites`;
  } else if (plan.name !== 'Default') {
    label = `${plan.name} · ${result.label}`;
  }

  if (
    config.billingRequiredAbove &&
    projects > config.billingRequiredAbove &&
    monthlyCost === 0
  ) {
    label = `${label} · billing required for ${projects} projects`;
  }

  if (projects > 1 && !config.perSiteMultiplier && plan.name !== 'Default') {
    if (Number.isFinite(plan.maxProjects)) {
      label = `${label} · up to ${plan.maxProjects} sites`;
    }
  }

  return { monthlyCost, label, note: result.note };
}
