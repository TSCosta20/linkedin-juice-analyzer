import { hashText } from '../utils/hash';
import { analyzePost } from '../scoring';
import { parseVisiblePosts } from './linkedin-parser';
import {
  injectScoreCard,
  updateCardWithLLM,
  setCardLoading,
  setCardRateLimited,
  injectFilterBar,
  showSuggestionLoading,
  showSuggestionResult,
  showSuggestionError,
} from './ui-injector';
import { startObserving } from './observer';
import type { PostScore, TrackedPost, ActionSuggestion } from '../types';

/** In-memory deduplication cache: hash → TrackedPost */
const processedPosts = new Map<string, TrackedPost>();

/** Filter preference — loaded once at init, defaults to true */
let filterPromoted = true;

function loadFilterPreference(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.get('lja_filterPromoted', (result) => {
      filterPromoted = result.lja_filterPromoted !== false;
      resolve();
    });
  });
}

/** Send post text to background for LLM scoring, update card if successful */
function requestLLMScore(text: string, hash: string): void {
  const tracked = processedPosts.get(hash);
  if (tracked?.llmScore) return;

  setCardLoading(hash, true);

  try {
    chrome.runtime.sendMessage(
      { type: 'LJA_ANALYZE', text },
      (response: PostScore | { _rateLimited: true } | null) => {
        if (chrome.runtime.lastError) { setCardLoading(hash, false); return; }
        if (!response) { setCardLoading(hash, false); return; }
        if ('_rateLimited' in response) { setCardRateLimited(hash); return; }

        const t = processedPosts.get(hash);
        if (t) t.llmScore = response;
        updateCardWithLLM(hash, response);

        // Update badge with the LLM juice score (more accurate)
        try { chrome.runtime.sendMessage({ type: 'LJA_RECORD_SCORE', juice: response.juice }); } catch { /* ignore */ }
      }
    );
  } catch {
    setCardLoading(hash, false);
  }
}

/** Handle the Act button click for a post */
function requestActionSuggestion(hash: string): void {
  const tracked = processedPosts.get(hash);
  if (!tracked) return;

  showSuggestionLoading(hash);

  try {
    chrome.runtime.sendMessage(
      {
        type: 'LJA_SUGGEST',
        text: tracked.postText,
        authorName: tracked.authorName,
        authorHeadline: tracked.authorHeadline,
      },
      (response: ActionSuggestion | { _noKey: true } | { _noProfile: true } | null) => {
        if (chrome.runtime.lastError || !response) {
          showSuggestionError(hash, 'Could not get suggestion. Try again.');
          return;
        }
        if ('_noKey' in response) {
          showSuggestionError(hash, 'Add an API key in settings to use action suggestions.', () => {
            chrome.runtime.sendMessage({ type: 'LJA_OPEN_OPTIONS' });
          });
          return;
        }
        if ('_noProfile' in response) {
          showSuggestionError(hash, 'Set your role and goals in settings first.', () => {
            chrome.runtime.sendMessage({ type: 'LJA_OPEN_OPTIONS' });
          });
          return;
        }
        showSuggestionResult(hash, response);
      }
    );
  } catch {
    showSuggestionError(hash, 'Extension context lost. Reload the page.');
  }
}

function processVisiblePosts(): void {
  const posts = parseVisiblePosts(filterPromoted);

  for (const { container, textContent, textElement, author } of posts) {
    const hash = hashText(textContent);

    if (processedPosts.has(hash)) {
      const cached = processedPosts.get(hash)!;
      injectScoreCard(container, cached.score, hash, textElement, cached.llmScore);
      continue;
    }

    const score = analyzePost(textContent);
    processedPosts.set(hash, {
      hash,
      score,
      postText: textContent,
      authorName: author.name,
      authorHeadline: author.headline,
    });

    injectScoreCard(container, score, hash, textElement);
    requestLLMScore(textContent, hash);

    // Record local juice score for badge immediately
    try { chrome.runtime.sendMessage({ type: 'LJA_RECORD_SCORE', juice: score.juice }); } catch { /* ignore */ }
  }
}

// Delegate Act button clicks via event delegation on document
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-lja-act]');
  if (!btn) return;
  const hash = btn.dataset.ljaAct;
  if (hash) { e.stopPropagation(); requestActionSuggestion(hash); }
}, true);

async function init(): Promise<void> {
  await loadFilterPreference();

  injectFilterBar(filterPromoted, (newValue) => {
    filterPromoted = newValue;
    document.querySelectorAll('.lja-card').forEach((el) => el.remove());
    processedPosts.clear();
    processVisiblePosts();
  });

  processVisiblePosts();
  startObserving(processVisiblePosts);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
