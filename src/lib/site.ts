export const SITE = {
  name: 'AnalyticsVS',
  title: 'AnalyticsVS — Independent Analytics Tool Comparisons',
  description:
    'Independent benchmark directory and comparison engine for web, product, and revenue analytics tools.',
  url: 'https://www.analyticsvs.com',
  author: 'AnalyticsVS',
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  'web-analytics': 'Web Analytics',
  'privacy-analytics': 'Privacy Analytics',
  'behavior-analytics': 'Behavior Analytics',
  'product-analytics': 'Product Analytics',
  'revenue-analytics': 'Revenue Analytics',
};

export type CategoryBadgeStyle = {
  label: string;
  dotClassName: string;
  bgClassName: string;
  borderBClassName: string;
};

export const CATEGORY_BADGE: Record<string, CategoryBadgeStyle> = {
  'web-analytics': {
    label: CATEGORY_LABELS['web-analytics']!,
    dotClassName: 'fill-cyan-500',
    bgClassName: 'bg-gradient-to-br from-white to-cyan-50',
    borderBClassName: 'border-b-cyan-500',
  },
  'privacy-analytics': {
    label: CATEGORY_LABELS['privacy-analytics']!,
    dotClassName: 'fill-amber-500',
    bgClassName: 'bg-gradient-to-br from-white to-amber-50',
    borderBClassName: 'border-b-amber-500',
  },
  'behavior-analytics': {
    label: CATEGORY_LABELS['behavior-analytics']!,
    dotClassName: 'fill-violet-500',
    bgClassName: 'bg-gradient-to-br from-white to-violet-50',
    borderBClassName: 'border-b-violet-500',
  },
  'product-analytics': {
    label: CATEGORY_LABELS['product-analytics']!,
    dotClassName: 'fill-indigo-500',
    bgClassName: 'bg-gradient-to-br from-white to-indigo-50',
    borderBClassName: 'border-b-indigo-500',
  },
  'revenue-analytics': {
    label: CATEGORY_LABELS['revenue-analytics']!,
    dotClassName: 'fill-green-500',
    bgClassName: 'bg-gradient-to-br from-white to-green-50',
    borderBClassName: 'border-b-green-500',
  },
};

export function getCategoryBadge(category: string): CategoryBadgeStyle {
  return (
    CATEGORY_BADGE[category] ?? {
      label: formatCategory(category),
      dotClassName: 'fill-slate-500',
      bgClassName: 'bg-gradient-to-br from-white to-slate-50',
      borderBClassName: 'border-b-slate-500',
    }
  );
}

export function formatCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function formatCountWord(n: number, capitalize = false): string {
  const words = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
  ] as const;
  const word = n >= 0 && n <= 9 ? words[n]! : String(n);
  if (!capitalize) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function formatDate(date: Date | string): string {
  const d =
    typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(`${date}T12:00:00`)
      : typeof date === 'string'
        ? new Date(date)
        : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}
