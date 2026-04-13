import { hashText } from '../utils/hash';
import { analyzePost } from '../scoring';
import { parseVisiblePosts } from './linkedin-parser';
import { injectScoreCard } from './ui-injector';
import { startObserving } from './observer';
import type { TrackedPost } from '../types';

/** In-memory deduplication cache: hash → TrackedPost */
const processedPosts = new Map<string, TrackedPost>();

/**
 * Scores all currently visible posts that haven't been processed yet.
 * Already-cached posts still attempt re-injection (handles DOM re-renders after scroll).
 */
function processVisiblePosts(): void {
  const posts = parseVisiblePosts();

  for (const { container, textContent, textElement } of posts) {
    const hash = hashText(textContent);

    if (processedPosts.has(hash)) {
      const cached = processedPosts.get(hash)!;
      injectScoreCard(container, cached.score, hash, textElement);
      continue;
    }

    const score = analyzePost(textContent);
    processedPosts.set(hash, { hash, score });
    injectScoreCard(container, score, hash, textElement);
  }
}

function init(): void {
  processVisiblePosts();
  startObserving(processVisiblePosts);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
