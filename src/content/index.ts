import { hashText } from '../utils/hash';
import { analyzePost } from '../scoring';
import { parseVisiblePosts } from './linkedin-parser';
import { injectScoreCard, updateCardWithLLM, setCardLoading } from './ui-injector';
import { startObserving } from './observer';
import type { PostScore, TrackedPost } from '../types';

/** In-memory deduplication cache: hash → TrackedPost */
const processedPosts = new Map<string, TrackedPost>();

/** Send post text to background for LLM scoring, update card if successful */
function requestLLMScore(text: string, hash: string): void {
  // Never re-request if LLM already scored this post
  const tracked = processedPosts.get(hash);
  if (tracked?.llmScore) return;

  // Show loading state immediately on the card
  setCardLoading(hash, true);

  chrome.runtime.sendMessage(
    { type: 'LJA_ANALYZE', text },
    (llmScore: PostScore | null) => {
      if (chrome.runtime.lastError) {
        setCardLoading(hash, false); // no background worker — revert to LOCAL
        return;
      }
      if (!llmScore) {
        setCardLoading(hash, false); // no key configured — revert to LOCAL
        return;
      }

      const t = processedPosts.get(hash);
      if (t) t.llmScore = llmScore;

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
