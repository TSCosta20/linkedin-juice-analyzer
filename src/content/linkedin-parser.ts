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
  textElement: HTMLElement;
  author: { name: string; headline: string };
}

/**
 * Parses the post author's name and headline from the post container.
 */
function parsePostAuthor(container: HTMLElement): { name: string; headline: string } {
  let name = '';
  let headline = '';

  // LinkedIn profile links contain /in/ — the first one is the post author
  const profileLink = container.querySelector<HTMLAnchorElement>('a[href*="/in/"]');
  if (profileLink) {
    // aria-label on the link is the most reliable source of the name
    const aria = profileLink.getAttribute('aria-label');
    if (aria) {
      name = aria.replace(/'s profile.*$/i, '').replace(/ profile$/i, '').trim();
    } else {
      name = (profileLink.innerText ?? profileLink.textContent ?? '').trim().split('\n')[0];
    }

    // Headline: look for a sibling/nearby element with substantial text
    const actor = profileLink.closest('[class*="actor"]') ?? profileLink.parentElement;
    if (actor) {
      const candidates = Array.from(actor.querySelectorAll<HTMLElement>('span, div'))
        .map((el) => (el.childElementCount === 0 ? el.textContent?.trim() : ''))
        .filter((t): t is string => !!t && t.length > 8 && t !== name && t !== 'Promoted' && t !== 'Following');
      headline = candidates[0] ?? '';
    }
  }

  return { name: name.slice(0, 100), headline: headline.slice(0, 200) };
}

/**
 * Detects whether a post container is a LinkedIn promoted/sponsored post.
 */
export function isPromotedPost(container: HTMLElement): boolean {
  // 1. Check aria-label attributes (most reliable)
  const ariaEls = container.querySelectorAll<HTMLElement>('[aria-label]');
  for (const el of ariaEls) {
    const label = el.getAttribute('aria-label')?.toLowerCase() ?? '';
    if (label === 'promoted' || label === 'sponsored') return true;
  }

  // 2. Walk all text nodes — look for "Promoted" or "Sponsored" outside the post body
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const val = node.nodeValue?.trim() ?? '';
    if (val === 'Promoted' || val === 'Sponsored') {
      const inBody = (node.parentElement)?.closest('[data-testid="expandable-text-box"]');
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

    // Hide or show promoted posts based on filter setting
    if (isPromotedPost(container)) {
      container.style.display = filterPromoted ? 'none' : '';
      continue;
    }

    // Use innerText to get clean visible text (strips hidden spans, aria labels, etc.)
    const text = (textEl.innerText ?? textEl.textContent ?? '').trim();
    if (text.length > 20) {
      results.push({ container, textContent: text, textElement: textEl, author: parsePostAuthor(container) });
    }
  }

  return results;
}
