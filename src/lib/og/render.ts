import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { loadOgFonts } from './fonts';
import { OG_COLORS, OG_GRADIENTS, OG_SIZE } from './theme';
import type { OgImageEntry, OgToolMark } from './types';

type OgElement = {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: OgElement | OgElement[] | string | number;
  };
};

function h(
  type: string,
  props: OgElement['props'],
  ...children: Array<OgElement | string | number>
): OgElement {
  const normalizedChildren =
    children.length === 0
      ? undefined
      : children.length === 1
        ? children[0]
        : children;

  return {
    type,
    props: {
      ...props,
      children: normalizedChildren,
    },
  };
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function renderToolMarks(tools: OgToolMark[]) {
  return h(
    'div',
    {
      style: {
        position: 'absolute',
        bottom: 64,
        right: 64,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 12,
      },
    },
    tools.map((tool) =>
      h(
        'div',
        {
          style: {
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor: tool.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: 22,
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
          },
        },
        tool.initial,
      ),
    ),
  );
}

function renderBrandDots() {
  const dots = [
    { size: 14, color: OG_COLORS.cyan },
    { size: 20, color: OG_COLORS.indigo },
    { size: 12, color: OG_COLORS.indigoDark },
  ];

  return h(
    'div',
    {
      style: {
        position: 'absolute',
        bottom: 72,
        right: 64,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
      },
    },
    dots.map((dot) =>
      h('div', {
        style: {
          width: dot.size,
          height: dot.size,
          borderRadius: 999,
          backgroundColor: dot.color,
        },
      }),
    ),
  );
}

function buildOgTree(entry: OgImageEntry): OgElement {
  const title = truncate(entry.title, 64);
  const description = truncate(entry.description, 110);
  const cornerMarks =
    entry.tools && entry.tools.length > 0
      ? renderToolMarks(entry.tools.slice(0, 2))
      : renderBrandDots();

  return h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: OG_COLORS.background,
        position: 'relative',
        overflow: 'hidden',
      },
    },
    h('div', {
      style: {
        width: '100%',
        height: 4,
        backgroundImage: OG_GRADIENTS.topBar,
      },
    }),
    h(
      'div',
      {
        style: {
          flex: 1,
          position: 'relative',
          display: 'flex',
        },
      },
      h('div', {
        style: {
          position: 'absolute',
          top: -120,
          right: 120,
          width: 420,
          height: 420,
          borderRadius: 999,
          backgroundImage: OG_GRADIENTS.glow,
        },
      }),
      h('div', {
        style: {
          position: 'absolute',
          bottom: -80,
          left: -40,
          width: 280,
          height: 280,
          borderRadius: 999,
          backgroundColor: `${OG_COLORS.indigo}22`,
        },
      }),
      h(
        'div',
        {
          style: {
            position: 'absolute',
            top: 48,
            right: 64,
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            backgroundImage: OG_GRADIENTS.primary,
            color: '#ffffff',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 0.5,
          },
        },
        'VS',
      ),
      h(
        'div',
        {
          style: {
            position: 'absolute',
            bottom: 64,
            left: 64,
            right: 280,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          },
        },
        h(
          'div',
          {
            style: {
              fontFamily: 'Plus Jakarta Sans',
              fontSize: 56,
              fontWeight: 700,
              color: OG_COLORS.title,
              lineHeight: 1.08,
              letterSpacing: -1.5,
            },
          },
          title,
        ),
        h(
          'div',
          {
            style: {
              fontFamily: 'Inter',
              fontSize: 28,
              fontWeight: 500,
              color: OG_COLORS.description,
              lineHeight: 1.35,
            },
          },
          description,
        ),
      ),
      cornerMarks,
    ),
  );
}

export async function createOgImage(entry: OgImageEntry) {
  const fonts = await loadOgFonts();
  const svg = await satori(buildOgTree(entry) as never, {
    ...OG_SIZE,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: OG_SIZE.width,
    },
  });

  const png = resvg.render().asPng();

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
