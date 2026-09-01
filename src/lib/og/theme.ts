export const OG_SIZE = { width: 1200, height: 630 } as const;

export const OG_COLORS = {
  background: '#0f172a',
  title: '#f8fafc',
  description: '#00b8d4',
  indigo: '#5b21ff',
  indigoDark: '#4a18d9',
  cyan: '#00b8d4',
  mint: '#059669',
} as const;

export const OG_GRADIENTS = {
  primary: `linear-gradient(135deg, ${OG_COLORS.indigo} 0%, ${OG_COLORS.cyan} 100%)`,
  topBar: `linear-gradient(90deg, ${OG_COLORS.indigo} 0%, ${OG_COLORS.cyan} 100%)`,
  glow: `radial-gradient(circle, ${OG_COLORS.indigo}33 0%, transparent 70%)`,
} as const;
