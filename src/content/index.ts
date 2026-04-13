import { hashText } from '../utils/hash';
import { analyzePost } from '../scoring';
import { parseVisiblePosts } from './linkedin-parser';
import { injectScoreCard, updateCardWithLLM } from './ui-injector';
import { startObserving } from './observer';
import type { PostScore, TrackedPost } from '../types';

/** In-memory deduplication cache: hash → TrackedPost */
const processedPosts = new Map<string, TrackedPost>();

/** Send post text to background for LLM scoring, update card if successful */
function requestLLMScore(text: string, hash: string): void {
  chrome.runtime.sendMessage(
    { type: 'LJA_ANALYZE', text },
    (llmScore: PostScore | null) => {
      if (chrome.runtime.lastError) return; // no background worker or key
      if (!llmScore) return;

      const tracked = processedPosts.get(hash);
      if (tracked) tracked.llmScore = llmScore;

      updateCardWithLLM(hash, llmScore);
    }
  );
}

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
      injectScoreCard(container, cached.score, hash, textElement, cached.llmScore);
      continue;
    }

    const score = analyzePost(textContent);
    processedPosts.set(hash, { hash, score });
    injectScoreCard(container, score, hash, textElement);
    requestLLMScore(textContent, hash);
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
