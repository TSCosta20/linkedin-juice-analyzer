# Application Flow — LinkedIn Juice Analyzer

## Initialization

1. Chrome loads `content.js` on `https://www.linkedin.com/*` at `document_idle`
2. Content script calls `init()`
3. `init()` calls `processVisiblePosts()` for posts already in the DOM
4. `init()` calls `startObserving()` to watch for new posts

## Per-Post Processing

1. `parseVisiblePosts()` finds all post containers using resilient CSS selectors
2. For each container, `extractPostText()` extracts visible text
3. `hashText(text)` computes a FNV-1a 32-bit hash
4. Hash is checked against the in-memory `processedPosts` Map
5. If NOT cached:
   - `analyzePost(text)` runs all three scoring engines
   - Result is stored in the cache
   - `injectScoreCard()` builds and inserts the card DOM
6. If cached:
   - `injectScoreCard()` is called again (idempotent) to re-inject if the DOM re-rendered

## Infinite Scroll

1. `MutationObserver` watches `document.body` with `subtree: true`
2. On any `childList` mutation, a 400ms debounce timer is started
3. On timer expiry, `processVisiblePosts()` is called again
4. Only new (uncached) posts get scored; already-cached posts skip scoring

## Score Card Lifecycle

- Card is injected `beforebegin` relative to the post's social action bar
- `data-lja-hash` attribute on the card ensures idempotency
- Cards are never removed (they persist as long as the post is in the DOM)
