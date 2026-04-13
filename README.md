# LinkedIn Juice Analyzer

A Chrome Extension that scores every LinkedIn feed post on three dimensions —
locally, instantly, with no AI APIs and no network calls.

| Metric | What it measures |
|---|---|
| **AI** | How much the post reads like AI-generated content (0 = human, 100 = textbook AI) |
| **BS** | Density of buzzwords, fluff, and vague thought-leadership language (0 = clean, 100 = pure consultant-speak) |
| **Juice** | Informational payload relative to text length (0 = empty, 100 = pure signal) |

Each post gets a compact score card injected directly into the feed:

```
AI 72 · BS 85 · Juice 12
Strong AI fingerprints, bullshit overdrive, almost no juice.
```

All scoring is deterministic and rule-based. No LLM. No API. No data collection.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Generate placeholder icons

```bash
node scripts/generate-icons.js
```

> For real icons, replace `public/icons/icon16.png`, `icon48.png`, `icon128.png`
> with your own artwork (16×16, 48×48, 128×128 pixels).

### 3. Build the extension

```bash
npm run build
```

Output goes to `dist/`.

### 4. Load in Chrome

1. Open **`chrome://extensions`**
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the **`dist/`** folder

### 5. Open LinkedIn

Navigate to **`https://www.linkedin.com/feed/`** — score cards appear automatically
below each post within a second or two.

---

## Development

### Auto-rebuild on save

```bash
npm run dev
```

After each rebuild, go to `chrome://extensions` and click the **reload** (↺) icon
for the extension, then refresh your LinkedIn tab.

### Run unit tests

```bash
npm test
```

### Watch tests

```bash
npm run test:watch
```

---

## Project Structure

```
src/
  content/
    index.ts              # Content script entry — orchestrates everything
    linkedin-parser.ts    # Extracts post text from the LinkedIn DOM
    ui-injector.ts        # Builds and injects score cards
    observer.ts           # MutationObserver for infinite scroll
  scoring/
    index.ts              # analyzePost(text) — main scoring entry point
    ai-score.ts           # AI detection heuristics
    bullshit-score.ts     # Bullshit/buzzword heuristics
    juice-score.ts        # Informational density heuristics
    phrase-bands.ts       # Deterministic phrase arrays (10 bands per metric)
    summary.ts            # Builds summary sentence from phrase bands
  utils/
    hash.ts               # FNV-1a hash for deduplication
    text-utils.ts         # Tokenization, sentence splitting, helpers
  types.ts                # Shared TypeScript interfaces

public/
  manifest.json           # Chrome Extension Manifest V3
  icons/                  # Extension icons (16, 48, 128px)

tests/                    # Vitest unit tests (scoring + utilities)
docs/                     # Design documentation
  PRD.md                  # Product Requirements
  APP_FLOW.md             # End-to-end application flow
  ARCHITECTURE.md         # Module architecture diagram
  SCORING_SYSTEM.md       # Full scoring system documentation
  PHRASE_BANDS.md         # All phrase band labels
  CURSOR_TASKS.md         # Quick guide for common modifications
```

---

## Customization

See [`docs/CURSOR_TASKS.md`](docs/CURSOR_TASKS.md) for a quick-reference guide on:

- Adding new AI detection signals
- Adding buzzwords to the BS scorer
- Adjusting score weights
- Changing phrase band labels
- Updating LinkedIn DOM selectors (LinkedIn changes these periodically)
- Changing score card colors and thresholds

---

## How Scoring Works

### AI Score (0–100)

Detects signals associated with AI-generated writing:
- Hook phrase patterns ("Here's what I've learned", "Hot take:", etc.)
- Transition phrase overuse ("Furthermore", "Ultimately", etc.)
- Engagement bait endings ("What do you think? 👇")
- Cliché patterns ("game-changer", "growth mindset", "journey")
- Symmetrical sentence lengths (AI writes evenly; humans don't)
- Numbered list structure

### Bullshit Score (0–100)

Measures vague, content-free, or buzzword-heavy language:
- Buzzword density (~40 known terms: "leverage", "synergy", "disruptive", etc.)
- Vague intensifiers ("incredibly", "massively", "phenomenal")
- Inspirational padding ("Success requires...", "Never stop growing")
- Absence of concrete numbers in a long post
- Adjective/adverb inflation

### Juice Score (0–100)

Measures informational payload relative to text length:
- Concrete numbers and statistics
- Evidence markers ("because", "therefore", "research shows", "we found")
- Technical tokens (URLs, version numbers, units, code-like strings)
- Named entities (proper names, companies, products)
- Distinct sentence count
- Penalties for filler phrases, repetition, and verbosity

---

## Troubleshooting

**Score cards are not appearing:**
LinkedIn periodically changes its DOM structure. Open DevTools on the LinkedIn feed,
find the current class names for post containers and text areas, and update
`src/content/linkedin-parser.ts` — add the new selectors to `TEXT_SELECTORS` or
`CONTAINER_SELECTORS`. Then rebuild and reload.

**Build errors:**
Make sure you're on Node.js 18+ and ran `npm install` first.

---

## License

MIT
