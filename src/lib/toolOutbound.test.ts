import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildToolHostMap,
  classifyToolOutboundClick,
  isAffiliateClick,
  pageTypeFromPath,
} from './toolOutbound.ts';

const hostMap = buildToolHostMap([
  {
    id: 'fathom',
    slug: 'fathom',
    website: 'https://usefathom.com',
    affiliateUrl: 'https://usefathom.com/ref/U4V5UE',
  },
  {
    id: 'datafast',
    slug: 'datafast',
    website: 'https://datafa.st',
    affiliateUrl: 'https://datafa.st/?via=analyticsvs',
  },
  {
    id: 'hotjar',
    slug: 'hotjar',
    website: 'https://www.hotjar.com',
    affiliateUrl: 'https://invite.contentsquare.com/analyticsvs',
  },
  {
    id: 'posthog',
    slug: 'posthog',
    website: 'https://posthog.com',
  },
  {
    id: 'google-analytics-4',
    slug: 'google-analytics-4',
    website: 'https://analytics.google.com',
  },
]);

describe('pageTypeFromPath', () => {
  it('maps known site sections from the path', () => {
    assert.equal(pageTypeFromPath('/tools/fathom/'), 'tool');
    assert.equal(pageTypeFromPath('/compare/posthog-vs-hotjar'), 'compare');
    assert.equal(pageTypeFromPath('/learn/cookieless-analytics/'), 'learn');
    assert.equal(pageTypeFromPath('/guides/analytics-for-a-saas-startup/'), 'guide');
    assert.equal(pageTypeFromPath('/calculators/pricing/'), 'calculator');
    assert.equal(pageTypeFromPath('/methodology/'), 'other');
  });
});

describe('isAffiliateClick', () => {
  it('treats rel=sponsored and known affiliate URL patterns as affiliate', () => {
    assert.equal(isAffiliateClick('https://usefathom.com/ref/U4V5UE', 'noopener noreferrer'), true);
    assert.equal(isAffiliateClick('https://datafa.st/?via=analyticsvs'), true);
    assert.equal(isAffiliateClick('https://invite.contentsquare.com/analyticsvs'), true);
    assert.equal(
      isAffiliateClick('https://usefathom.com/pricing', 'noopener noreferrer sponsored'),
      true,
    );
    assert.equal(isAffiliateClick('https://posthog.com/pricing', 'noopener noreferrer'), false);
  });
});

describe('buildToolHostMap', () => {
  it('maps vendor and affiliate hosts to tool slugs', () => {
    assert.equal(hostMap['usefathom.com'], 'fathom');
    assert.equal(hostMap['datafa.st'], 'datafast');
    assert.equal(hostMap['hotjar.com'], 'hotjar');
    assert.equal(hostMap['invite.contentsquare.com'], 'hotjar');
    assert.equal(hostMap['contentsquare.com'], 'hotjar');
    assert.equal(hostMap['posthog.com'], 'posthog');
    assert.equal(hostMap['analytics.google.com'], 'google-analytics-4');
    assert.equal(hostMap['google.com'], undefined);
  });
});

describe('classifyToolOutboundClick', () => {
  const base = {
    pathname: '/learn/cookieless-analytics/',
    currentHost: 'www.analyticsvs.com',
    hostMap,
  };

  it('classifies affiliate visit CTAs from data attributes', () => {
    const event = classifyToolOutboundClick({
      ...base,
      href: 'https://usefathom.com/ref/U4V5UE',
      rel: 'noopener noreferrer sponsored',
      dataTool: 'fathom',
      dataPlacement: 'tool_page_cta',
      pathname: '/tools/fathom/',
    });
    assert.deepEqual(event, {
      tool: 'fathom',
      affiliate: true,
      destination_url: 'https://usefathom.com/ref/U4V5UE',
      destination_host: 'usefathom.com',
      placement: 'tool_page_cta',
      page_type: 'tool',
    });
  });

  it('derives the tool from hostname when data-tool is missing', () => {
    const event = classifyToolOutboundClick({
      ...base,
      href: 'https://posthog.com/pricing',
      rel: 'noopener noreferrer',
    });
    assert.equal(event?.tool, 'posthog');
    assert.equal(event?.affiliate, false);
    assert.equal(event?.placement, 'inline');
    assert.equal(event?.page_type, 'learn');
  });

  it('ignores internal, mailto, and non-tool external links', () => {
    assert.equal(
      classifyToolOutboundClick({ ...base, href: '/tools/fathom/' }),
      null,
    );
    assert.equal(
      classifyToolOutboundClick({ ...base, href: 'https://www.analyticsvs.com/tools/fathom/' }),
      null,
    );
    assert.equal(classifyToolOutboundClick({ ...base, href: 'mailto:hi@example.com' }), null);
    assert.equal(
      classifyToolOutboundClick({ ...base, href: 'https://github.com/analyticsvs' }),
      null,
    );
    assert.equal(
      classifyToolOutboundClick({ ...base, href: 'https://www.betterlaunch.co/product/analyticsvs' }),
      null,
    );
  });
});
