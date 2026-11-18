import { classifyToolOutboundClick } from '../lib/toolOutbound';

declare global {
  interface Window {
    __avsToolOutboundClickInstalled?: boolean;
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>, options?: Record<string, unknown>) => void;
    };
  }
}

function readHostMap(): Record<string, string> {
  const el = document.getElementById('avs-tool-host-map');
  if (!el?.textContent) return {};
  try {
    const parsed = JSON.parse(el.textContent) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function shouldHandlePointerEvent(event: Event): boolean {
  if (event.type === 'auxclick') {
    return event instanceof MouseEvent && event.button === 1;
  }
  if (event.type === 'click') {
    return !(event instanceof MouseEvent) || event.button === 0;
  }
  return false;
}

export function installToolOutboundClickTracking(): void {
  if (window.__avsToolOutboundClickInstalled) return;
  window.__avsToolOutboundClickInstalled = true;

  const hostMap = readHostMap();

  const onActivate = (event: Event) => {
    if (!shouldHandlePointerEvent(event)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;

    const properties = classifyToolOutboundClick({
      href: link.getAttribute('href') || link.href,
      rel: link.getAttribute('rel'),
      dataTool: link.dataset.tool,
      dataPlacement: link.dataset.placement,
      pathname: window.location.pathname,
      currentHost: window.location.hostname,
      hostMap,
    });
    if (!properties) return;

    window.posthog?.capture('tool_outbound_click', properties, {
      transport: 'sendBeacon',
      send_instantly: true,
    });
  };

  document.addEventListener('click', onActivate, true);
  document.addEventListener('auxclick', onActivate, true);
}
