import { PRICING_CALCULATORS } from '../lib/pricing';

interface PricingToolRow {
  id: string;
  name: string;
  slug: string;
  visitUrl: string;
  isAffiliate: boolean;
  logoUrl: string | null;
  initial: string;
}

function formatInteger(value: number): string {
  return value.toLocaleString('en-US');
}

function parseInteger(value: string): number {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number(digits);
}

function formatCurrency(amount: number | null): string {
  if (amount === 0) return 'Free';
  if (amount === null) return 'Contact sales';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function renderToolMark(tool: PricingToolRow): string {
  if (tool.logoUrl) {
    return `<span class="tool-mark-stack tool-mark-stack--logo tool-mark-stack--sm shrink-0">
      <span class="tool-mark tool-mark--sm tool-mark--initials tool-mark-stack__fallback" aria-hidden="true">${tool.initial}</span>
      <img src="${tool.logoUrl}" alt="" width="32" height="32" class="tool-mark-stack__logo" loading="lazy" decoding="async" onerror="this.remove(); this.parentElement?.querySelector('.tool-mark-stack__fallback')?.classList.add('is-visible')" />
    </span>`;
  }

  return `<span class="tool-mark-stack tool-mark-stack--logo tool-mark-stack--sm shrink-0">
    <span class="tool-mark tool-mark--sm tool-mark--initials" aria-hidden="true">${tool.initial}</span>
  </span>`;
}

function updateSliderFill(slider: HTMLInputElement) {
  const min = Number(slider.min);
  const max = Number(slider.max);
  const value = Number(slider.value);
  const progress = ((value - min) / (max - min)) * 100;
  slider.style.setProperty('--slider-progress', `${progress}%`);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function bindMetric(
  textInput: HTMLInputElement,
  slider: HTMLInputElement,
  options: { min: number; max: number; onChange: () => void },
) {
  let isFocused = false;

  const displayValue = (value: number) => formatInteger(value);

  const applyValue = (value: number, format = true) => {
    const clamped = clamp(value, options.min, options.max);
    slider.value = String(clamped);
    slider.setAttribute('aria-valuenow', String(clamped));
    updateSliderFill(slider);

    if (format && !isFocused) {
      textInput.value = displayValue(clamped);
    }

    options.onChange();
  };

  const syncFromSlider = () => {
    applyValue(Number(slider.value));
  };

  const syncFromText = (format: boolean) => {
    const parsed = parseInteger(textInput.value);
    const clamped = clamp(parsed || options.min, options.min, options.max);

    if (format && !isFocused) {
      textInput.value = displayValue(clamped);
    } else if (!format) {
      textInput.value = clamped === 0 && textInput.value.replace(/[^\d]/g, '') === ''
        ? ''
        : String(clamped);
    }

    slider.value = String(clamped);
    slider.setAttribute('aria-valuenow', String(clamped));
    updateSliderFill(slider);
    options.onChange();
  };

  textInput.addEventListener('focus', () => {
    isFocused = true;
    const current = clamp(parseInteger(textInput.value) || options.min, options.min, options.max);
    textInput.value = current === 0 && options.min === 0 ? '' : String(current);
  });

  textInput.addEventListener('blur', () => {
    isFocused = false;
    syncFromText(true);
  });

  textInput.addEventListener('input', () => {
    const digits = textInput.value.replace(/[^\d]/g, '');

    if (!digits) {
      slider.value = String(options.min);
      slider.setAttribute('aria-valuenow', String(options.min));
      updateSliderFill(slider);
      options.onChange();
      return;
    }

    let value = Number(digits);
    if (value > options.max) value = options.max;

    textInput.value = String(value);
    slider.value = String(value);
    slider.setAttribute('aria-valuenow', String(value));
    updateSliderFill(slider);
    options.onChange();
  });

  slider.addEventListener('input', syncFromSlider);

  applyValue(parseInteger(textInput.value) || options.min);
}

export function initPricingCalculator(root: HTMLElement) {
  const pricingData = JSON.parse(root.dataset.pricing ?? '[]') as PricingToolRow[];

  const pageviewsInput = root.querySelector<HTMLInputElement>('#pageviews')!;
  const pageviewsSlider = root.querySelector<HTMLInputElement>('#pageviews-slider')!;
  const eventsInput = root.querySelector<HTMLInputElement>('#events')!;
  const eventsSlider = root.querySelector<HTMLInputElement>('#events-slider')!;
  const projectsInput = root.querySelector<HTMLInputElement>('#projects')!;
  const projectsSlider = root.querySelector<HTMLInputElement>('#projects-slider')!;
  const tbody = root.querySelector<HTMLTableSectionElement>('#pricing-results-body')!;

  const readMetric = (input: HTMLInputElement) => parseInteger(input.value);

  const capturePricingCalculatorUpdated = () => {
    window.posthog?.capture('pricing_calculator_updated', {
      monthly_pageviews: readMetric(pageviewsInput),
      monthly_custom_events: readMetric(eventsInput),
      project_count: Math.max(1, readMetric(projectsInput) || 1),
    });
  };

  const updateResults = () => {
    const input = {
      pageviews: readMetric(pageviewsInput),
      events: readMetric(eventsInput),
      projects: Math.max(1, readMetric(projectsInput) || 1),
    };

    const results = pricingData
      .map((tool) => {
        const calc = PRICING_CALCULATORS[tool.id];
        const result = calc ? calc(input) : { monthlyCost: null, label: 'N/A', note: '' };
        return { ...tool, ...result };
      })
      .sort((a, b) => {
        if (a.monthlyCost === null) return 1;
        if (b.monthlyCost === null) return -1;
        return a.monthlyCost - b.monthlyCost;
      });

    tbody.innerHTML = results
      .map(
        (r) => `
        <tr>
          <td>
            <a href="/tools/${r.slug}/" class="pricing-table__tool">
              ${renderToolMark(r)}
              <span>${r.name}</span>
            </a>
          </td>
          <td class="pricing-table__estimate">
            <div class="pricing-table__cost">${formatCurrency(r.monthlyCost)}</div>
            <div class="pricing-table__plan">${r.label}</div>
          </td>
          <td>
            <a href="${r.visitUrl}" target="_blank" rel="${r.isAffiliate ? 'noopener noreferrer sponsored' : 'noopener noreferrer'}" class="pricing-table__action" data-posthog-pricing-vendor="${r.id}" data-posthog-affiliate="${r.isAffiliate}">Visit site →</a>
          </td>
        </tr>
      `,
      )
      .join('');
  };

  const onChange = () => updateResults();

  bindMetric(pageviewsInput, pageviewsSlider, { min: 1000, max: 5_000_000, onChange });
  bindMetric(eventsInput, eventsSlider, { min: 0, max: 1_000_000, onChange });
  bindMetric(projectsInput, projectsSlider, { min: 1, max: 30, onChange });

  pageviewsSlider.addEventListener('change', capturePricingCalculatorUpdated);
  eventsSlider.addEventListener('change', capturePricingCalculatorUpdated);
  projectsSlider.addEventListener('change', capturePricingCalculatorUpdated);
  pageviewsInput.addEventListener('change', capturePricingCalculatorUpdated);
  eventsInput.addEventListener('change', capturePricingCalculatorUpdated);
  projectsInput.addEventListener('change', capturePricingCalculatorUpdated);

  tbody.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('[data-posthog-pricing-vendor]');
    if (!link || !(link instanceof HTMLAnchorElement)) return;

    window.posthog?.capture('pricing_calculator_vendor_visited', {
      vendor_id: link.dataset.posthogPricingVendor,
      is_affiliate: link.dataset.posthogAffiliate === 'true',
    });
  });

  updateResults();
}
