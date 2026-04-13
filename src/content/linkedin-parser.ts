/**
 * LinkedIn DOM Parser
 *
 * LinkedIn changes class names frequently. This module uses multiple resilient
 * selector strategies and falls back gracefully when structure changes.
 */

export interface ParsedPost {
  container: HTMLElement;
  textContent: string;
}

/**
 * Ordered list of selectors for the post text area.
 * Earlier selectors are preferred; later ones are fallbacks.
 */
const TEXT_SELECTORS = [
  '.feed-shared-update-v2__description .update-components-text',
  '.update-components-text',
  '.feed-shared-update-v2__description',
  '.feed-shared-text-view',
  '.feed-shared-inline-show-more-text',
  '[data-test-id="main-feed-activity-card"] .feed-shared-text',
] as const;

/**
 * Ordered list of selectors for the post container element.
 * Earlier selectors are preferred.
 */
const CONTAINER_SELECTORS = [
  '.feed-shared-update-v2',
  '[data-urn*="activity"]',
  '[data-id*="urn:li:activity"]',
] as const;

/** Elements inside a post container that are NOT post text (UI chrome) */
const NON_CONTENT_SELECTORS = [
  '.feed-shared-actor',
  '.feed-shared-footer',
  '.social-actions',
  '.feed-shared-social-action-bar',
  'button',
  '.artdeco-button',
  '.lja-card', // exclude our own injected cards
].join(', ');

/**
 * Returns all post container elements currently in the DOM.
 */
export function findPostContainers(): HTMLElement[] {
  for (const selector of CONTAINER_SELECTORS) {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (elements.length > 0) return elements;
  }
  return [];
}

/**
 * Extracts the visible text content from a post container.
 * Returns null if no usable text is found (too short or empty).
 */
export function extractPostText(container: HTMLElement): string | null {
  // Try each specific text selector first
  for (const selector of TEXT_SELECTORS) {
    const el = container.querySelector<HTMLElement>(selector);
    if (el) {
      const text = (el.innerText ?? el.textContent ?? '').trim();
      if (text.length > 20) return text;
    }
  }

  // Fallback: clone the container, strip UI chrome, grab all remaining text
  const cloned = container.cloneNode(true) as HTMLElement;
  cloned.querySelectorAll(NON_CONTENT_SELECTORS).forEach((el) => el.remove());
  const text = (cloned.innerText ?? cloned.textContent ?? '').trim();
  return text.length > 20 ? text : null;
}

/**
 * Parses all feed posts currently visible in the DOM.
 */
export function parseVisiblePosts(): ParsedPost[] {
  const containers = findPostContainers();
  const results: ParsedPost[] = [];

  for (const container of containers) {
    const textContent = extractPostText(container);
    if (textContent) {
      results.push({ container, textContent });
    }
  }

  return results;
}
