/**
 * MutationObserver for LinkedIn's infinite scroll.
 *
 * Only fires the callback when added nodes actually contain new post content
 * (elements with role="listitem" or data-testid="expandable-text-box").
 * This prevents thrashing on the constant micro-mutations LinkedIn produces
 * (reaction counts, typing indicators, ad updates, etc.)
 */

type ProcessCallback = () => void;

let observer: MutationObserver | null = null;

/** Returns true if a node or any of its descendants looks like a new post */
function containsPostContent(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const el = node as Element;
  return (
    el.matches('[role="listitem"]') ||
    el.matches('[data-testid="expandable-text-box"]') ||
    el.querySelector('[role="listitem"]') !== null ||
    el.querySelector('[data-testid="expandable-text-box"]') !== null
  );
}

/**
 * Starts watching for new posts.
 * Observes the feed container if available, otherwise the body.
 * Safe to call multiple times — only one observer is ever active.
 *
 * @param onNewContent - Called (debounced 800ms) only when new post nodes appear.
 */
export function startObserving(onNewContent: ProcessCallback): void {
  if (observer) return;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  observer = new MutationObserver((mutations) => {
    // Only proceed if at least one added node looks like post content
    const hasNewPosts = mutations.some((m) =>
      Array.from(m.addedNodes).some(containsPostContent)
    );
    if (!hasNewPosts) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onNewContent();
      debounceTimer = null;
    }, 800);
  });

  // Prefer observing just the feed container — much tighter scope than body
  const feedRoot =
    document.querySelector('[data-testid="mainFeed"]') ?? document.body;

  observer.observe(feedRoot, {
    childList: true,
    subtree: true,
  });
}

export function stopObserving(): void {
  observer?.disconnect();
  observer = null;
}
