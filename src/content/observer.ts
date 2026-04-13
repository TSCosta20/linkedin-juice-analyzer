/**
 * MutationObserver for LinkedIn's infinite scroll.
 *
 * Observes [data-testid="mainFeed"] — already a tight scope, so no
 * content filtering is needed. The debounce + hash dedup in index.ts
 * ensures processVisiblePosts() is cheap to call multiple times.
 *
 * Falls back to document.body if mainFeed isn't in the DOM yet,
 * and re-anchors to mainFeed once it appears.
 */

type ProcessCallback = () => void;

let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleProcess(onNewContent: ProcessCallback): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    onNewContent();
    debounceTimer = null;
  }, 800);
}

/**
 * Starts (or re-anchors) the observer on the feed root.
 * Safe to call multiple times — disconnects the previous observer first.
 */
function observeRoot(root: Element, onNewContent: ProcessCallback): void {
  observer?.disconnect();
  observer = new MutationObserver(() => scheduleProcess(onNewContent));
  observer.observe(root, { childList: true, subtree: true });
}

export function startObserving(onNewContent: ProcessCallback): void {
  const feedRoot = document.querySelector('[data-testid="mainFeed"]');

  if (feedRoot) {
    // Feed already rendered — observe it directly
    observeRoot(feedRoot, onNewContent);
    return;
  }

  // Feed not rendered yet (SPA navigation). Watch body briefly just to
  // detect when mainFeed appears, then switch to observing it directly.
  const bootstrapObserver = new MutationObserver(() => {
    const root = document.querySelector('[data-testid="mainFeed"]');
    if (!root) return;
    bootstrapObserver.disconnect();
    observeRoot(root, onNewContent);
    // Process posts that loaded during the wait
    onNewContent();
  });

  bootstrapObserver.observe(document.body, { childList: true, subtree: true });
}

export function stopObserving(): void {
  observer?.disconnect();
  observer = null;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
