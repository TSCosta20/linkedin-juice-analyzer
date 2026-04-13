/**
 * LinkedIn DOM Parser
 *
 * Uses stable data-testid and role attributes instead of class names,
 * which LinkedIn rotates frequently.
 *
 * Current selectors (verified April 2026):
 *   - Text:      span[data-testid="expandable-text-box"]
 *   - Container: closest ancestor with role="listitem"
 */

export interface ParsedPost {
  container: HTMLElement;
  textContent: string;
  textElement: HTMLElement; // the actual text node, used for injection positioning
}

/**
 * Returns all visible feed posts by finding every expandable text box
 * and walking up to its post container.
 */
export function parseVisiblePosts(): ParsedPost[] {
  const textEls = document.querySelectorAll<HTMLElement>(
    '[data-testid="expandable-text-box"]'
  );

  const results: ParsedPost[] = [];
  const seenContainers = new Set<HTMLElement>();

  for (const textEl of textEls) {
    const container = textEl.closest<HTMLElement>('[role="listitem"]');
    if (!container) continue;

    // Skip if we already processed this container (e.g. reshared post with two text boxes)
    if (seenContainers.has(container)) continue;
    seenContainers.add(container);

    // Use innerText to get clean visible text (strips hidden spans, aria labels, etc.)
    const text = (textEl.innerText ?? textEl.textContent ?? '').trim();
    if (text.length > 20) {
      results.push({ container, textContent: text, textElement: textEl });
    }
  }

  return results;
}
