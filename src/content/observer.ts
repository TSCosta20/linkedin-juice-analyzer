/**
 * MutationObserver wrapper for LinkedIn's infinite scroll.
 *
 * Watches document.body for new child nodes and fires the callback
 * (debounced) whenever new content is detected.
 */

type ProcessCallback = () => void;

let observer: MutationObserver | null = null;

/**
 * Starts watching the DOM for new posts.
 * Safe to call multiple times — only one observer is created.
 *
 * @param onNewContent - Called (debounced 400ms) when new nodes are added to the DOM.
 */
export function startObserving(onNewContent: ProcessCallback): void {
  if (observer) return;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  observer = new MutationObserver((mutations) => {
    const hasNewNodes = mutations.some((m) => m.addedNodes.length > 0);
    if (!hasNewNodes) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onNewContent();
      debounceTimer = null;
    }, 400);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

export function stopObserving(): void {
  observer?.disconnect();
  observer = null;
}
