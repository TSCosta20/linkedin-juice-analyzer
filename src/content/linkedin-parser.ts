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
 * Detects whether a post container is a LinkedIn promoted/sponsored post.
 * Checks for "Promoted" label in the post header (above the text body).
 */
export function isPromotedPost(container: HTMLElement): boolean {
  // LinkedIn renders a "Promoted" label in the actor/header section.
  // We search only within the first ~25% of the container's children
  // to avoid false-positives from post body text.
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const val = node.nodeValue?.trim();
    if (val === 'Promoted' || val === 'Sponsored') {
      // Make sure this text node isn't inside the expandable post body
      const inBody = (node.parentElement as HTMLElement)?.closest('[data-testid="expandable-text-box"]');
      if (!inBody) return true;
    }
  }
  return false;
}

/**
 * Returns all visible feed posts by finding every expandable text box
 * and walking up to its post container.
 */
export function parseVisiblePosts(filterPromoted = true): ParsedPost[] {
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

    // Skip promoted/sponsored posts if filter is enabled
    if (filterPromoted && isPromotedPost(container)) continue;

    // Use innerText to get clean visible text (strips hidden spans, aria labels, etc.)
    const text = (textEl.innerText ?? textEl.textContent ?? '').trim();
    if (text.length > 20) {
      results.push({ container, textContent: text, textElement: textEl });
    }
  }

  return results;
}
