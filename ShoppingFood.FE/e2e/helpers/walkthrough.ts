import { type Page } from '@playwright/test';
import { waitForPageReady } from './wait-for-page';

/** Pause between steps so viewers can follow the UI (ms). Override: WALKTHROUGH_PAUSE_MS=2000 */
export const WALKTHROUGH_PAUSE_MS = Number(process.env.WALKTHROUGH_PAUSE_MS ?? 1200);

/**
 * Show a floating banner on the page labeling the current walkthrough step.
 */
export async function showStepLabel(
  page: Page,
  title: string,
  subtitle?: string
): Promise<void> {
  await page.evaluate(
    ({ title, subtitle }) => {
      let el = document.getElementById('e2e-walkthrough-banner');
      if (!el) {
        el = document.createElement('div');
        el.id = 'e2e-walkthrough-banner';
        el.style.cssText =
          'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:99999;' +
          'background:linear-gradient(135deg,#1e40af,#7c3aed);color:#fff;padding:12px 28px;' +
          'border-radius:10px;font-family:system-ui,sans-serif;font-size:15px;' +
          'box-shadow:0 6px 20px rgba(0,0,0,.35);max-width:92%;text-align:center;pointer-events:none;';
        document.body.appendChild(el);
      }
      el.innerHTML = `<strong>${title}</strong>${
        subtitle
          ? `<br/><span style="opacity:.92;font-size:13px;font-weight:400">${subtitle}</span>`
          : ''
      }`;
    },
    { title, subtitle }
  );
}

export async function pauseForViewer(page: Page): Promise<void> {
  if (WALKTHROUGH_PAUSE_MS > 0) {
    await page.waitForTimeout(WALKTHROUGH_PAUSE_MS);
  }
}

/**
 * Navigate to a route, show step label, wait for page to settle.
 */
export async function visitStep(
  page: Page,
  route: string,
  title: string,
  subtitle?: string
): Promise<void> {
  await showStepLabel(page, title, subtitle);
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page, { hideBanner: false, settleMs: WALKTHROUGH_PAUSE_MS });
}
