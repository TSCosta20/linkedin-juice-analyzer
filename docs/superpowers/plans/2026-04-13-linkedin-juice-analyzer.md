# LinkedIn Juice Analyzer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome Extension (MV3) that injects deterministic AI/Bullshit/Juice score cards into LinkedIn feed posts using rule-based heuristics only — no LLM or API calls at runtime.

**Architecture:** A content script observes the LinkedIn feed via MutationObserver, extracts post text from the DOM, runs each post through three independent deterministic scoring engines (AI, Bullshit, Juice), maps scores to predefined phrase bands to generate a summary sentence, then injects a compact score card into the post DOM. A FNV-1a hash cache prevents reprocessing duplicate text.

**Tech Stack:** TypeScript 5, Vite 5, Chrome Extension Manifest V3, Vitest (unit tests)

---

## File Map

```
linkedin-juice-analyzer/
├── src/
│   ├── types.ts                        # PostScore, Band, ScoredPost interfaces
│   ├── content/
│   │   ├── index.ts                    # Content script entry — wires all modules
│   │   ├── linkedin-parser.ts          # Extracts post text + container elements
│   │   ├── ui-injector.ts              # Creates and injects score card DOM
│   │   └── observer.ts                 # MutationObserver for infinite scroll
│   ├── scoring/
│   │   ├── index.ts                    # analyzePost(text): PostScore — entry point
│   │   ├── ai-score.ts                 # scoreAI(text): 0–100
│   │   ├── bullshit-score.ts           # scoreBullshit(text): 0–100
│   │   ├── juice-score.ts              # scoreJuice(text): 0–100
│   │   ├── phrase-bands.ts             # Phrase arrays indexed by band 0–9
│   │   └── summary.ts                  # buildSummary(ai, bs, juice): string
│   └── utils/
│       ├── hash.ts                     # hashText(text): string (FNV-1a 32-bit hex)
│       └── text-utils.ts               # tokenize, sentences, countMatches, normalize
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── docs/
│   ├── PRD.md
│   ├── APP_FLOW.md
│   ├── ARCHITECTURE.md
│   ├── SCORING_SYSTEM.md
│   ├── PHRASE_BANDS.md
│   └── CURSOR_TASKS.md
├── tests/
│   ├── scoring/
│   │   ├── ai-score.test.ts
│   │   ├── bullshit-score.test.ts
│   │   ├── juice-score.test.ts
│   │   └── summary.test.ts
│   └── utils/
│       ├── hash.test.ts
│       └── text-utils.test.ts
├── scripts/
│   └── generate-icons.js               # Node script: generates placeholder PNGs
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `public/manifest.json`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "linkedin-juice-analyzer",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "vite": "^5.2.11",
    "vitest": "^1.6.0",
    "@types/chrome": "^0.0.268"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Create public/manifest.json**

```json
{
  "manifest_version": 3,
  "name": "LinkedIn Juice Analyzer",
  "version": "1.0.0",
  "description": "Scores LinkedIn posts on AI, Bullshit, and Juice — locally, with no AI APIs.",
  "permissions": [],
  "content_scripts": [
    {
      "matches": ["https://www.linkedin.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 6: Create src/ and tests/ directories**

```bash
mkdir -p src/content src/scoring src/utils tests/scoring tests/utils public/icons
```

- [ ] **Step 7: Verify build runs**

Run: `npm run build`
Expected: `dist/content.js` generated with no errors.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Chrome Extension MV3 project with Vite + TypeScript"
```

---

## Task 2: Shared Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write src/types.ts**

```typescript
/** Score band index: floor(score / 10), clamped to 0–9 */
export type Band = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Final analysis result for one post */
export interface PostScore {
  ai: number;       // 0–100: likelihood the post was AI-written
  bullshit: number; // 0–100: density of fluff/buzzwords
  juice: number;    // 0–100: informational payload relative to length
  summary: string;  // deterministic one-line sentence from phrase bands
}

/** A processed post tracked in the dedup cache */
export interface TrackedPost {
  hash: string;
  score: PostScore;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Text Utilities

**Files:**
- Create: `src/utils/text-utils.ts`
- Create: `tests/utils/text-utils.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/utils/text-utils.test.ts
import { describe, it, expect } from 'vitest';
import {
  normalize,
  tokenize,
  getSentences,
  wordCount,
  countMatches,
  countNumbers,
  uniqueBigrams,
} from '../../src/utils/text-utils';

describe('normalize', () => {
  it('lowercases and strips extra whitespace', () => {
    expect(normalize('  Hello   World  ')).toBe('hello world');
  });
});

describe('tokenize', () => {
  it('splits on whitespace and removes punctuation', () => {
    const tokens = tokenize('Hello, world! How are you?');
    expect(tokens).toEqual(['hello', 'world', 'how', 'are', 'you']);
  });
  it('returns empty array for empty string', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('getSentences', () => {
  it('splits on sentence-ending punctuation', () => {
    const s = getSentences('Hello world. How are you? Fine!');
    expect(s).toHaveLength(3);
  });
  it('returns single-item array when no punctuation', () => {
    expect(getSentences('no punctuation here')).toHaveLength(1);
  });
});

describe('wordCount', () => {
  it('counts space-separated tokens', () => {
    expect(wordCount('one two three')).toBe(3);
  });
  it('returns 0 for empty string', () => {
    expect(wordCount('')).toBe(0);
  });
});

describe('countMatches', () => {
  it('counts regex matches', () => {
    expect(countMatches('foo bar foo baz', [/foo/g])).toBe(2);
  });
  it('sums across multiple patterns', () => {
    expect(countMatches('foo bar baz', [/foo/g, /baz/g])).toBe(2);
  });
});

describe('countNumbers', () => {
  it('counts standalone number tokens', () => {
    expect(countNumbers('I have 3 items and 10 minutes')).toBe(2);
  });
  it('handles percentages and decimals', () => {
    expect(countNumbers('growth of 42% and 3.14x')).toBe(2);
  });
});

describe('uniqueBigrams', () => {
  it('returns count of unique adjacent word pairs', () => {
    expect(uniqueBigrams('the cat sat on the cat')).toBe(4); // the-cat, cat-sat, sat-on, on-the (the-cat repeated)
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

Run: `npx vitest run tests/utils/text-utils.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement src/utils/text-utils.ts**

```typescript
/** Lower-case and collapse whitespace */
export function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Split text into lowercase word tokens, stripping punctuation */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Split text into sentences by `.`, `!`, `?` */
export function getSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Count whitespace-separated tokens in raw text */
export function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

/** Sum the number of matches across an array of global regexes */
export function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((total, pattern) => {
    const matches = text.match(pattern);
    return total + (matches ? matches.length : 0);
  }, 0);
}

/** Count standalone numeric tokens (integers, decimals, percentages) */
export function countNumbers(text: string): number {
  const matches = text.match(/\b\d+(\.\d+)?(%|x)?\b/g);
  return matches ? matches.length : 0;
}

/**
 * Count unique adjacent word pairs (bigrams).
 * Used to detect repetition: lower ratio of unique bigrams to total bigrams = more repetitive.
 */
export function uniqueBigrams(text: string): number {
  const words = tokenize(text);
  const seen = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    seen.add(`${words[i]}_${words[i + 1]}`);
  }
  return seen.size;
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/utils/text-utils.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/text-utils.ts tests/utils/text-utils.test.ts
git commit -m "feat: add text utilities with tests"
```

---

## Task 4: Hash Utility

**Files:**
- Create: `src/utils/hash.ts`
- Create: `tests/utils/hash.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// tests/utils/hash.test.ts
import { describe, it, expect } from 'vitest';
import { hashText } from '../../src/utils/hash';

describe('hashText', () => {
  it('returns a non-empty hex string', () => {
    const h = hashText('hello world');
    expect(h).toMatch(/^[0-9a-f]+$/);
    expect(h.length).toBeGreaterThan(0);
  });
  it('is deterministic', () => {
    expect(hashText('test post')).toBe(hashText('test post'));
  });
  it('produces different hashes for different inputs', () => {
    expect(hashText('post A')).not.toBe(hashText('post B'));
  });
  it('handles empty string', () => {
    expect(() => hashText('')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

Run: `npx vitest run tests/utils/hash.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement src/utils/hash.ts (FNV-1a 32-bit)**

```typescript
/**
 * FNV-1a 32-bit hash.
 * Fast, deterministic, no dependencies.
 */
export function hashText(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    // Multiply by FNV prime (32-bit: 16777619), wrapped in 32-bit unsigned
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16);
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/utils/hash.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/hash.ts tests/utils/hash.test.ts
git commit -m "feat: add FNV-1a hash utility with tests"
```

---

## Task 5: Phrase Bands

**Files:**
- Create: `src/scoring/phrase-bands.ts`

No tests needed — this is pure data. Correctness is verified by the summary tests.

- [ ] **Step 1: Create src/scoring/phrase-bands.ts**

```typescript
/**
 * Deterministic phrase arrays for each metric, indexed by band 0–9.
 * Band = Math.min(Math.floor(score / 10), 9)
 *
 * Each array has exactly 10 entries (index = band).
 */

export const AI_PHRASES: readonly string[] = [
  'unmistakably human',          // 0–9
  'very human feel',             // 10–19
  'mostly human',                // 20–29
  'human with slight polish',    // 30–39
  'mixed signals',               // 40–49
  'noticeably AI-shaped',        // 50–59
  'likely AI-assisted',          // 60–69
  'strong AI fingerprints',      // 70–79
  'almost certainly AI-written', // 80–89
  'textbook AI output',          // 90–100
];

export const BULLSHIT_PHRASES: readonly string[] = [
  'zero fluff',              // 0–9
  'very low fluff',          // 10–19
  'mostly clean',            // 20–29
  'minor buzzword noise',    // 30–39
  'moderate bullshit',       // 40–49
  'noticeable bullshit',     // 50–59
  'heavy buzzword load',     // 60–69
  'very buzzwordy',          // 70–79
  'bullshit overdrive',      // 80–89
  'pure thought-leadership', // 90–100
];

export const JUICE_PHRASES: readonly string[] = [
  'nothing of substance',  // 0–9
  'almost no juice',       // 10–19
  'very low juice',        // 20–29
  'low juice',             // 30–39
  'some juice',            // 40–49
  'decent juice',          // 50–59
  'good juice',            // 60–69
  'solid juice',           // 70–79
  'high juice',            // 80–89
  'pure signal',           // 90–100
];

/**
 * Convert a 0–100 score to a band index 0–9.
 */
export function toBand(score: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 {
  return Math.min(Math.floor(score / 10), 9) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scoring/phrase-bands.ts
git commit -m "feat: add deterministic phrase bands for AI, Bullshit, Juice metrics"
```

---

## Task 6: AI Scoring Engine

**Files:**
- Create: `src/scoring/ai-score.ts`
- Create: `tests/scoring/ai-score.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/scoring/ai-score.test.ts
import { describe, it, expect } from 'vitest';
import { scoreAI } from '../../src/scoring/ai-score';

const HUMAN_POST = `
Just spent 3 hours debugging a race condition in our Redis pub/sub setup.
Turned out the subscriber was registering before the channel was ready.
Fixed by deferring subscription until after the connection 'ready' event fires.
Classic async trap. Lesson: never assume connection order.
`;

const AI_POST = `
I've been thinking a lot about leadership lately.

Here's what I've learned: the best leaders don't just manage teams — they inspire them.

Furthermore, great leadership requires three key qualities:
1. Empathy
2. Vision
3. Execution

Ultimately, what separates good leaders from great ones is their ability to embrace change.

What do you think? Drop a comment below and let me know your thoughts! 👇
`;

describe('scoreAI', () => {
  it('returns a number between 0 and 100', () => {
    const score = scoreAI(HUMAN_POST);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
  it('scores a human-written technical post lower than an AI-style post', () => {
    expect(scoreAI(HUMAN_POST)).toBeLessThan(scoreAI(AI_POST));
  });
  it('scores the AI-style post above 55', () => {
    expect(scoreAI(AI_POST)).toBeGreaterThan(55);
  });
  it('scores the human post below 40', () => {
    expect(scoreAI(HUMAN_POST)).toBeLessThan(40);
  });
  it('handles empty string without throwing', () => {
    expect(() => scoreAI('')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

Run: `npx vitest run tests/scoring/ai-score.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement src/scoring/ai-score.ts**

```typescript
import { countMatches, getSentences, tokenize, wordCount } from '../utils/text-utils';

// Signals that a post was written by (or heavily edited by) an AI

const HOOK_PHRASES = [
  /i'?ve been thinking (a lot )?about/gi,
  /here'?s what i'?ve learned/gi,
  /here'?s the thing/gi,
  /hot take:/gi,
  /unpopular opinion:/gi,
  /let me be (real|honest|clear)/gi,
  /nobody talks about/gi,
  /most people don'?t realize/gi,
  /\d+ (things?|lessons?|ways?|tips?|steps?|reasons?) (i|you|we)/gi,
  /i used to (think|believe)/gi,
  /story time/gi,
];

const TRANSITION_PHRASES = [
  /\bfurthermore\b/gi,
  /\bmoreover\b/gi,
  /\bin conclusion\b/gi,
  /\bultimately\b/gi,
  /\bin summary\b/gi,
  /\bthe reality is\b/gi,
  /\bthe truth is\b/gi,
  /\bat the end of the day\b/gi,
  /\bit'?s (not|never) about\b/gi,
  /\bwhat (separates|sets apart)\b/gi,
];

const ENGAGEMENT_BAIT = [
  /what do you think\??/gi,
  /drop a comment/gi,
  /let me know (your thoughts|below|in the comments)/gi,
  /follow (for more|me for)/gi,
  /like (and|&) (share|repost)/gi,
  /tag someone who/gi,
  /agree or disagree\??/gi,
  /👇+/g,
];

const CLICHE_PATTERNS = [
  /\bgame.?changer\b/gi,
  /\bparadigm shift\b/gi,
  /\bthought leader(ship)?\b/gi,
  /\bempower(ing|ment)?\b/gi,
  /\btransform(ation|ative|ing)?\b/gi,
  /\bjourney\b/gi,
  /\bauthentic(ity)?\b/gi,
  /\bhustle\b/gi,
  /\bgrind\b/gi,
  /\bgrowth mindset\b/gi,
  /\bnext level\b/gi,
  /\bleverage\b/gi,
];

/**
 * Measures how symmetric sentence lengths are.
 * AI tends to produce evenly-sized sentences; humans vary more.
 * Returns a normalized score 0–1 where 1 = very symmetric.
 */
function symmetryScore(text: string): number {
  const sentences = getSentences(text).filter((s) => s.split(/\s+/).length > 3);
  if (sentences.length < 3) return 0;
  const lengths = sentences.map((s) => wordCount(s));
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 1;
  // Low coefficient of variation = high symmetry
  return Math.max(0, 1 - cv);
}

/**
 * Detects numbered or bulleted list structure — a common AI pattern.
 * Returns a score 0–1.
 */
function listStructureScore(text: string): number {
  const numberedItems = (text.match(/^\s*\d+[\.\)]/gm) || []).length;
  const bulletItems = (text.match(/^\s*[•\-\*]/gm) || []).length;
  const totalItems = numberedItems + bulletItems;
  return Math.min(totalItems / 5, 1);
}

export function scoreAI(text: string): number {
  if (!text.trim()) return 0;

  let score = 0;

  // Hook phrase signals (0–20 pts)
  const hooks = countMatches(text, HOOK_PHRASES);
  score += Math.min(hooks * 10, 20);

  // Transition phrase overuse (0–15 pts)
  const transitions = countMatches(text, TRANSITION_PHRASES);
  score += Math.min(transitions * 5, 15);

  // Engagement bait at end (0–15 pts)
  const engagementBait = countMatches(text, ENGAGEMENT_BAIT);
  score += Math.min(engagementBait * 7, 15);

  // Cliché patterns (0–20 pts)
  const cliches = countMatches(text, CLICHE_PATTERNS);
  score += Math.min(cliches * 4, 20);

  // Sentence symmetry (0–15 pts)
  score += Math.round(symmetryScore(text) * 15);

  // List structure (0–15 pts)
  score += Math.round(listStructureScore(text) * 15);

  // Token count vs sentence count ratio — AI tends to write in complete,
  // well-formed sentences (low variance in tokens-per-sentence)
  const sentences = getSentences(text).filter(Boolean);
  const tokens = tokenize(text);
  if (sentences.length > 0 && tokens.length > 10) {
    const avgSentenceLen = tokens.length / sentences.length;
    // AI sentences average 15–25 words cleanly; human writing varies more
    if (avgSentenceLen >= 12 && avgSentenceLen <= 28) {
      score += 5;
    }
  }

  return Math.min(Math.round(score), 100);
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scoring/ai-score.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/scoring/ai-score.ts tests/scoring/ai-score.test.ts
git commit -m "feat: implement AI detection scoring engine with tests"
```

---

## Task 7: Bullshit Scoring Engine

**Files:**
- Create: `src/scoring/bullshit-score.ts`
- Create: `tests/scoring/bullshit-score.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/scoring/bullshit-score.test.ts
import { describe, it, expect } from 'vitest';
import { scoreBullshit } from '../../src/scoring/bullshit-score';

const LOW_BS = `
We reduced our API p99 latency from 420ms to 38ms by switching to connection pooling
and eliminating 3 redundant database round-trips per request.
The change took 2 days and affected 4 services.
`;

const HIGH_BS = `
In today's fast-paced, ever-evolving digital landscape, true leaders must leverage
synergistic paradigms to drive transformative outcomes. By embracing a growth mindset
and disrupting conventional wisdom, we can empower our teams to achieve authentic
excellence. The journey to success requires bandwidth, hustle, and a passion for
innovation. Let's scale our impact and move the needle on what truly matters.
`;

describe('scoreBullshit', () => {
  it('returns a number 0–100', () => {
    const s = scoreBullshit(LOW_BS);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
  it('scores concrete technical post low', () => {
    expect(scoreBullshit(LOW_BS)).toBeLessThan(30);
  });
  it('scores buzzword-heavy post high', () => {
    expect(scoreBullshit(HIGH_BS)).toBeGreaterThan(60);
  });
  it('handles empty string', () => {
    expect(() => scoreBullshit('')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

Run: `npx vitest run tests/scoring/bullshit-score.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement src/scoring/bullshit-score.ts**

```typescript
import { countMatches, countNumbers, tokenize, wordCount } from '../utils/text-utils';

const BUZZWORDS = [
  /\bleverage[sd]?\b/gi,
  /\bsynerg(y|ies|istic)\b/gi,
  /\bparadigm(s| shift)?\b/gi,
  /\bdisrupt(ive|ion|ing)?\b/gi,
  /\binnovati(ve|on|ng)\b/gi,
  /\bgame.?changer?\b/gi,
  /\bthought leader(ship)?\b/gi,
  /\bhustle\b/gi,
  /\bgrind\b/gi,
  /\bjourney\b/gi,
  /\bauthentic(ity)?\b/gi,
  /\btransform(ation|ative|ing|ed)?\b/gi,
  /\becosystem\b/gi,
  /\bbandwidth\b/gi,
  /\bpivot(ing|ed)?\b/gi,
  /\bscal(e|ing|able)\b/gi,
  /\bimpact(ful)?\b/gi,
  /\bempower(ing|ment|ed)?\b/gi,
  /\bstakeholder(s)?\b/gi,
  /\bdeliverable(s)?\b/gi,
  /\bmove the needle\b/gi,
  /\bvalue proposition\b/gi,
  /\bpain point(s)?\b/gi,
  /\blow.?hanging fruit\b/gi,
  /\bdeep dive\b/gi,
  /\bcircle back\b/gi,
  /\btake it offline\b/gi,
  /\bblue.?sky thinking\b/gi,
  /\bthink outside the box\b/gi,
  /\bnext level\b/gi,
  /\bgrowth mindset\b/gi,
  /\bworld.?class\b/gi,
  /\bbest.?in.?class\b/gi,
  /\bfast.?paced\b/gi,
  /\bever.?evolving\b/gi,
  /\bdigital (transformation|landscape)\b/gi,
  /\bpassion(ate)?\b/gi,
  /\bexcellence\b/gi,
];

const VAGUE_INTENSIFIERS = [
  /\bincredibly\b/gi,
  /\bmassively\b/gi,
  /\bhugely\b/gi,
  /\babsolutely\b/gi,
  /\bunbelievably\b/gi,
  /\bamazingly\b/gi,
  /\bpowerful\b/gi,
  /\bground.?breaking\b/gi,
  /\bsignificant(ly)?\b/gi,
  /\bdramatic(ally)?\b/gi,
];

const INSPIRATIONAL_PADDING = [
  /\bsuccess (is|requires|comes from)\b/gi,
  /\b(leaders?|leadership) (don'?t|must|should|need to)\b/gi,
  /\bthe (future|world) (of|is|needs)\b/gi,
  /\bdon'?t (just|only|wait)\b/gi,
  /\bbe the change\b/gi,
  /\bmake an impact\b/gi,
  /\bchase your dream\b/gi,
  /\bnever stop (learning|growing|hustling)\b/gi,
  /\bthe (real )?secret (to|of|is)\b/gi,
];

export function scoreBullshit(text: string): number {
  if (!text.trim()) return 0;

  const words = wordCount(text);
  if (words < 5) return 0;

  let score = 0;

  // Buzzword density (0–35 pts)
  const buzzCount = countMatches(text, BUZZWORDS);
  const buzzDensity = buzzCount / words;
  score += Math.min(Math.round(buzzDensity * 300), 35);

  // Vague intensifiers (0–20 pts)
  const intensifiers = countMatches(text, VAGUE_INTENSIFIERS);
  score += Math.min(intensifiers * 4, 20);

  // Inspirational padding (0–20 pts)
  const padding = countMatches(text, INSPIRATIONAL_PADDING);
  score += Math.min(padding * 7, 20);

  // Lack of concrete numbers — absence of numbers in a long post is suspicious (0–15 pts)
  const numbers = countNumbers(text);
  if (words > 40 && numbers === 0) {
    score += 15;
  } else if (words > 40 && numbers <= 1) {
    score += 7;
  }

  // Adjective/adverb inflation: words ending in -ly and -ive (0–10 pts)
  const tokens = tokenize(text);
  const inflatedWords = tokens.filter(
    (t) => t.endsWith('ly') || (t.endsWith('ive') && t.length > 5)
  ).length;
  const inflationRatio = inflatedWords / tokens.length;
  score += Math.min(Math.round(inflationRatio * 60), 10);

  return Math.min(Math.round(score), 100);
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scoring/bullshit-score.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/scoring/bullshit-score.ts tests/scoring/bullshit-score.test.ts
git commit -m "feat: implement Bullshit scoring engine with tests"
```

---

## Task 8: Juice Scoring Engine

**Files:**
- Create: `src/scoring/juice-score.ts`
- Create: `tests/scoring/juice-score.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/scoring/juice-score.test.ts
import { describe, it, expect } from 'vitest';
import { scoreJuice } from '../../src/scoring/juice-score';

const HIGH_JUICE = `
We migrated our Postgres 14 cluster (2TB, 180k RPS at peak) to Aurora PostgreSQL 15.
Migration took 6 hours with zero downtime using logical replication.
Key changes: removed 3 unused indexes, rewrote 2 slow queries (830ms → 12ms),
and dropped a legacy trigger that was firing 40k times per hour.
End result: 22% reduction in CPU usage and $3,400/month savings on RDS.
`;

const LOW_JUICE = `
I'm incredibly passionate about the power of innovation and leadership.
Success requires dedication, vision, and an unwavering commitment to excellence.
We must embrace change, empower our teams, and leverage every opportunity to grow.
The journey is what defines us. Stay authentic. Stay hungry. Stay humble.
`;

describe('scoreJuice', () => {
  it('returns a number 0–100', () => {
    const s = scoreJuice(HIGH_JUICE);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
  it('scores a data-dense technical post high', () => {
    expect(scoreJuice(HIGH_JUICE)).toBeGreaterThan(60);
  });
  it('scores a vague inspirational post low', () => {
    expect(scoreJuice(LOW_JUICE)).toBeLessThan(30);
  });
  it('handles empty string', () => {
    expect(() => scoreJuice('')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

Run: `npx vitest run tests/scoring/juice-score.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement src/scoring/juice-score.ts**

```typescript
import {
  countMatches,
  countNumbers,
  getSentences,
  tokenize,
  uniqueBigrams,
  wordCount,
} from '../utils/text-utils';

const EVIDENCE_MARKERS = [
  /\bfor example\b/gi,
  /\bfor instance\b/gi,
  /\bspecifically\b/gi,
  /\bsuch as\b/gi,
  /\baccording to\b/gi,
  /\bresearch (shows?|suggests?|finds?)\b/gi,
  /\bdata (shows?|suggests?|indicates?)\b/gi,
  /\bwe (found|discovered|measured|observed)\b/gi,
  /\bthe result(s)? (was|were|showed?)\b/gi,
  /\bthis (means?|resulted? in|caused?)\b/gi,
  /\bbecause\b/gi,
  /\btherefore\b/gi,
  /\bwhich (means?|resulted?|caused?)\b/gi,
];

const FILLER_PHRASES = [
  /\bin today'?s (world|landscape|market|era)\b/gi,
  /\bthe (power|importance|value) of\b/gi,
  /\bwe all know\b/gi,
  /\bit'?s no secret\b/gi,
  /\blet'?s be honest\b/gi,
  /\bremember:/gi,
  /\bfood for thought\b/gi,
  /\bfood for thought[.!]?\b/gi,
  /\btake a moment to\b/gi,
  /\bask yourself\b/gi,
  /\bat the end of the day\b/gi,
  /\bthe bottom line is\b/gi,
];

/**
 * Estimate repetition: ratio of unique bigrams to total possible bigrams.
 * Lower = more repetitive = less juice.
 */
function repetitionPenalty(text: string): number {
  const words = tokenize(text);
  if (words.length < 4) return 0;
  const totalBigrams = words.length - 1;
  const uniqueB = uniqueBigrams(text);
  const ratio = uniqueB / totalBigrams;
  // ratio close to 1 = very unique, close to 0 = very repetitive
  return Math.round((1 - ratio) * 20); // max 20 penalty points
}

/**
 * Verbosity penalty: ratio of words to unique information signals.
 * A very long post with few concrete facts is penalized.
 */
function verbosityPenalty(text: string, juiceSignals: number): number {
  const words = wordCount(text);
  if (words < 20) return 0;
  const density = juiceSignals / words;
  // Expect at least 1 juice signal per 20 words for full marks
  if (density >= 0.05) return 0;
  if (density >= 0.03) return 10;
  if (density >= 0.01) return 20;
  return 30;
}

export function scoreJuice(text: string): number {
  if (!text.trim()) return 0;

  const words = wordCount(text);
  if (words < 5) return 0;

  let score = 0;

  // Numbers and statistics (0–25 pts)
  const numbers = countNumbers(text);
  score += Math.min(numbers * 5, 25);

  // Evidence markers and causal language (0–25 pts)
  const evidence = countMatches(text, EVIDENCE_MARKERS);
  score += Math.min(evidence * 5, 25);

  // Technical/specific tokens: URLs, code-like tokens, version numbers, units (0–20 pts)
  const technicalTokens = (
    text.match(/\b(https?:\/\/\S+|v\d+\.\d+|\d+ms|\d+%|\d+x|\$[\d,]+|[A-Z]{2,}[a-z]*\d+)\b/g) ||
    []
  ).length;
  score += Math.min(technicalTokens * 4, 20);

  // Named entities: capitalized multi-word sequences likely to be names/products (0–10 pts)
  const namedEntities = (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || []).length;
  score += Math.min(namedEntities * 2, 10);

  // Unique sentence count bonus (rewards posts that make many distinct points) (0–10 pts)
  const sentences = getSentences(text).filter((s) => wordCount(s) > 4);
  score += Math.min(sentences.length * 2, 10);

  // Penalties
  const fillerCount = countMatches(text, FILLER_PHRASES);
  score -= Math.min(fillerCount * 5, 20);

  score -= repetitionPenalty(text);
  score -= verbosityPenalty(text, numbers + evidence + technicalTokens);

  return Math.max(0, Math.min(Math.round(score), 100));
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scoring/juice-score.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/scoring/juice-score.ts tests/scoring/juice-score.test.ts
git commit -m "feat: implement Juice scoring engine with tests"
```

---

## Task 9: Summary Generator

**Files:**
- Create: `src/scoring/summary.ts`
- Create: `tests/scoring/summary.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/scoring/summary.test.ts
import { describe, it, expect } from 'vitest';
import { buildSummary } from '../../src/scoring/summary';

describe('buildSummary', () => {
  it('returns a non-empty string', () => {
    expect(buildSummary(80, 70, 20)).toBeTruthy();
  });
  it('is deterministic — same inputs produce same output', () => {
    expect(buildSummary(80, 70, 20)).toBe(buildSummary(80, 70, 20));
  });
  it('reflects AI phrase for high AI score', () => {
    const s = buildSummary(85, 10, 60);
    expect(s.toLowerCase()).toMatch(/ai/i);
  });
  it('varies output across different score combinations', () => {
    const a = buildSummary(90, 90, 5);
    const b = buildSummary(5, 5, 90);
    expect(a).not.toBe(b);
  });
  it('handles boundary scores 0 and 100', () => {
    expect(() => buildSummary(0, 0, 100)).not.toThrow();
    expect(() => buildSummary(100, 100, 0)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to confirm failure**

Run: `npx vitest run tests/scoring/summary.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement src/scoring/summary.ts**

```typescript
import { AI_PHRASES, BULLSHIT_PHRASES, JUICE_PHRASES, toBand } from './phrase-bands';

/**
 * Builds a deterministic one-line summary sentence from the three scores.
 * Output format: "{AI phrase}, {bullshit phrase}, {juice phrase}."
 */
export function buildSummary(ai: number, bullshit: number, juice: number): string {
  const aiPhrase = AI_PHRASES[toBand(ai)];
  const bsPhrase = BULLSHIT_PHRASES[toBand(bullshit)];
  const juicePhrase = JUICE_PHRASES[toBand(juice)];

  // Capitalize first letter of the combined sentence
  const sentence = `${aiPhrase}, ${bsPhrase}, ${juicePhrase}.`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scoring/summary.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/scoring/summary.ts tests/scoring/summary.test.ts
git commit -m "feat: add deterministic summary sentence builder with tests"
```

---

## Task 10: Scoring Engine Entry Point

**Files:**
- Create: `src/scoring/index.ts`

- [ ] **Step 1: Create src/scoring/index.ts**

```typescript
import { scoreAI } from './ai-score';
import { scoreBullshit } from './bullshit-score';
import { scoreJuice } from './juice-score';
import { buildSummary } from './summary';
import type { PostScore } from '../types';

/**
 * Runs all three scoring engines and builds the summary.
 * Pure function — no side effects, no DOM access.
 */
export function analyzePost(text: string): PostScore {
  const ai = scoreAI(text);
  const bullshit = scoreBullshit(text);
  const juice = scoreJuice(text);
  const summary = buildSummary(ai, bullshit, juice);
  return { ai, bullshit, juice, summary };
}
```

- [ ] **Step 2: Run all tests to confirm nothing broke**

Run: `npm test`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/scoring/index.ts
git commit -m "feat: add scoring engine entry point"
```

---

## Task 11: LinkedIn DOM Parser

**Files:**
- Create: `src/content/linkedin-parser.ts`

No unit tests — this module touches the DOM directly. Tested manually in the browser.

- [ ] **Step 1: Create src/content/linkedin-parser.ts**

```typescript
/**
 * LinkedIn DOM Parser
 *
 * LinkedIn changes class names frequently. This module uses multiple resilient
 * selectors and falls back gracefully when structure changes.
 *
 * Target: post containers in the feed with their inner text content.
 */

export interface ParsedPost {
  container: HTMLElement;
  textContent: string;
}

/**
 * Ordered list of selectors for the post text content area.
 * Earlier selectors are preferred; later ones are fallbacks.
 */
const TEXT_SELECTORS = [
  '.feed-shared-update-v2__description .update-components-text',
  '.feed-shared-update-v2__description',
  '.update-components-text',
  '[data-test-id="main-feed-activity-card"] .feed-shared-text',
  '.feed-shared-text-view',
  '.feed-shared-inline-show-more-text',
] as const;

/**
 * Selectors for the post container element (the card wrapping a single post).
 */
const CONTAINER_SELECTORS = [
  '.feed-shared-update-v2',
  '[data-urn*="activity"]',
  '[data-id*="urn:li:activity"]',
] as const;

/**
 * Returns all visible post containers currently in the DOM.
 */
export function findPostContainers(): HTMLElement[] {
  for (const selector of CONTAINER_SELECTORS) {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (elements.length > 0) return elements;
  }
  return [];
}

/**
 * Extracts the visible text content from a post container.
 * Returns null if no text can be found.
 */
export function extractPostText(container: HTMLElement): string | null {
  for (const selector of TEXT_SELECTORS) {
    const el = container.querySelector<HTMLElement>(selector);
    if (el) {
      const text = el.innerText?.trim() || el.textContent?.trim() || '';
      if (text.length > 20) return text;
    }
  }
  // Fallback: grab all text from the container, minus UI chrome
  const cloned = container.cloneNode(true) as HTMLElement;
  // Remove known non-content elements
  cloned
    .querySelectorAll(
      '.feed-shared-actor, .feed-shared-footer, .social-actions, button, .artdeco-button'
    )
    .forEach((el) => el.remove());
  const text = cloned.innerText?.trim() || '';
  return text.length > 20 ? text : null;
}

/**
 * Parses all feed posts currently visible in the DOM.
 */
export function parseVisiblePosts(): ParsedPost[] {
  const containers = findPostContainers();
  const results: ParsedPost[] = [];
  for (const container of containers) {
    const textContent = extractPostText(container);
    if (textContent) {
      results.push({ container, textContent });
    }
  }
  return results;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/content/linkedin-parser.ts
git commit -m "feat: add LinkedIn DOM parser with resilient multi-selector strategy"
```

---

## Task 12: UI Injector + Styles

**Files:**
- Create: `src/content/ui-injector.ts`

- [ ] **Step 1: Create src/content/ui-injector.ts**

```typescript
import type { PostScore } from '../types';

const STYLES = `
.lja-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  padding: 6px 12px;
  margin: 4px 0 2px;
  border-top: 1px solid rgba(0,0,0,0.08);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11.5px;
  line-height: 1.4;
  color: #444;
  background: transparent;
  user-select: none;
}

.lja-metric {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.lja-label {
  font-weight: 600;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #888;
}

.lja-score {
  display: inline-block;
  min-width: 24px;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 700;
  font-size: 11px;
  text-align: center;
}

.lja-score-ai-low    { background: #d4edda; color: #1a5e2a; }
.lja-score-ai-mid    { background: #fff3cd; color: #7d5a00; }
.lja-score-ai-high   { background: #f8d7da; color: #721c24; }

.lja-score-bs-low    { background: #d4edda; color: #1a5e2a; }
.lja-score-bs-mid    { background: #fff3cd; color: #7d5a00; }
.lja-score-bs-high   { background: #f8d7da; color: #721c24; }

.lja-score-juice-low  { background: #f8d7da; color: #721c24; }
.lja-score-juice-mid  { background: #fff3cd; color: #7d5a00; }
.lja-score-juice-high { background: #d4edda; color: #1a5e2a; }

.lja-sep {
  color: #ccc;
  font-size: 13px;
}

.lja-summary {
  width: 100%;
  color: #666;
  font-size: 11px;
  font-style: italic;
  margin-top: 1px;
}
`;

let stylesInjected = false;

function injectStyles(): void {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}

function levelClass(score: number, metric: 'ai' | 'bs' | 'juice'): string {
  if (metric === 'juice') {
    if (score >= 60) return `lja-score-juice-high`;
    if (score >= 30) return `lja-score-juice-mid`;
    return `lja-score-juice-low`;
  }
  if (score >= 60) return `lja-score-${metric}-high`;
  if (score >= 30) return `lja-score-${metric}-mid`;
  return `lja-score-${metric}-low`;
}

function buildCard(score: PostScore, hash: string): HTMLElement {
  const card = document.createElement('div');
  card.className = 'lja-card';
  card.dataset.ljaHash = hash;

  card.innerHTML = `
    <span class="lja-metric">
      <span class="lja-label">AI</span>
      <span class="lja-score ${levelClass(score.ai, 'ai')}">${score.ai}</span>
    </span>
    <span class="lja-sep">·</span>
    <span class="lja-metric">
      <span class="lja-label">BS</span>
      <span class="lja-score ${levelClass(score.bullshit, 'bs')}">${score.bullshit}</span>
    </span>
    <span class="lja-sep">·</span>
    <span class="lja-metric">
      <span class="lja-label">Juice</span>
      <span class="lja-score ${levelClass(score.juice, 'juice')}">${score.juice}</span>
    </span>
    <span class="lja-summary">${score.summary}</span>
  `;

  return card;
}

/**
 * Finds the best injection point within a post container.
 * Prefers the social actions bar; falls back to appending to the container.
 */
function findInjectionPoint(container: HTMLElement): HTMLElement | null {
  const candidates = [
    container.querySelector<HTMLElement>('.feed-shared-social-action-bar'),
    container.querySelector<HTMLElement>('.social-actions'),
    container.querySelector<HTMLElement>('.feed-shared-footer'),
    container,
  ];
  for (const el of candidates) {
    if (el) return el;
  }
  return container;
}

/**
 * Injects the score card into a post container.
 * Returns false if the post already has a card (by hash) or injection point not found.
 */
export function injectScoreCard(
  container: HTMLElement,
  score: PostScore,
  hash: string
): boolean {
  injectStyles();

  // Idempotency: check if already injected
  if (container.querySelector(`[data-lja-hash="${hash}"]`)) return false;

  const injectionPoint = findInjectionPoint(container);
  if (!injectionPoint) return false;

  const card = buildCard(score, hash);
  injectionPoint.insertAdjacentElement('beforebegin', card);
  return true;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/content/ui-injector.ts
git commit -m "feat: add UI injector with color-coded score cards and injected CSS"
```

---

## Task 13: MutationObserver for Infinite Scroll

**Files:**
- Create: `src/content/observer.ts`

- [ ] **Step 1: Create src/content/observer.ts**

```typescript
/**
 * Observes DOM mutations to detect newly loaded posts from LinkedIn's infinite scroll.
 * Calls the provided callback when new candidate nodes are added.
 */

type ProcessCallback = () => void;

let observer: MutationObserver | null = null;

/**
 * Starts watching the feed container for new posts.
 * @param onNewContent - Called (debounced) when new content is detected.
 */
export function startObserving(onNewContent: ProcessCallback): void {
  if (observer) return; // already running

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  observer = new MutationObserver((mutations) => {
    const hasNewNodes = mutations.some((m) => m.addedNodes.length > 0);
    if (!hasNewNodes) return;

    // Debounce to batch rapid DOM updates from infinite scroll
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onNewContent();
      debounceTimer = null;
    }, 400);
  });

  // Observe the document body; LinkedIn renders feed posts deep in the DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

export function stopObserving(): void {
  observer?.disconnect();
  observer = null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/content/observer.ts
git commit -m "feat: add debounced MutationObserver for infinite scroll detection"
```

---

## Task 14: Content Script Entry Point

**Files:**
- Create: `src/content/index.ts`

- [ ] **Step 1: Create src/content/index.ts**

```typescript
import { hashText } from '../utils/hash';
import { analyzePost } from '../scoring';
import { parseVisiblePosts } from './linkedin-parser';
import { injectScoreCard } from './ui-injector';
import { startObserving } from './observer';
import type { TrackedPost } from '../types';

/** In-memory deduplication cache: hash → TrackedPost */
const processedPosts = new Map<string, TrackedPost>();

/**
 * Processes all currently visible posts that haven't been scored yet.
 */
function processVisiblePosts(): void {
  const posts = parseVisiblePosts();

  for (const { container, textContent } of posts) {
    const hash = hashText(textContent);

    // Skip already processed posts
    if (processedPosts.has(hash)) {
      // Still try to inject — the DOM may have re-rendered after a scroll
      const cached = processedPosts.get(hash)!;
      injectScoreCard(container, cached.score, hash);
      continue;
    }

    const score = analyzePost(textContent);
    processedPosts.set(hash, { hash, score });
    injectScoreCard(container, score, hash);
  }
}

/**
 * Entry point: process existing posts and watch for new ones.
 */
function init(): void {
  // Process posts already in the DOM at load time
  processVisiblePosts();

  // Watch for infinite scroll
  startObserving(processVisiblePosts);
}

// Run after the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

- [ ] **Step 2: Build the extension**

Run: `npm run build`
Expected: `dist/content.js` generated, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/index.ts
git commit -m "feat: add content script entry point with dedup cache and infinite scroll support"
```

---

## Task 15: Icon Generation Script

**Files:**
- Create: `scripts/generate-icons.js`

- [ ] **Step 1: Create scripts/generate-icons.js**

```javascript
#!/usr/bin/env node
/**
 * Generates simple placeholder PNG icons for the Chrome extension.
 * Uses only Node.js built-ins — no external dependencies.
 *
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 PNG (base64), resampled in the browser by Chrome.
// For a real icon, replace with actual artwork.
// This is a valid PNG: green (#22c55e) square.
const PNG_1x1_GREEN_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

for (const size of sizes) {
  const outPath = path.join(iconsDir, `icon${size}.png`);
  // Write the same tiny PNG; Chrome will scale it
  fs.writeFileSync(outPath, Buffer.from(PNG_1x1_GREEN_B64, 'base64'));
  console.log(`Written: ${outPath}`);
}

console.log('Icons generated. Replace with real artwork before publishing.');
```

- [ ] **Step 2: Run the script**

Run: `node scripts/generate-icons.js`
Expected: `public/icons/icon16.png`, `icon48.png`, `icon128.png` created.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-icons.js public/icons/
git commit -m "chore: add icon generation script and placeholder icons"
```

---

## Task 16: Documentation Files

**Files:**
- Create: `docs/PRD.md`
- Create: `docs/APP_FLOW.md`
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/SCORING_SYSTEM.md`
- Create: `docs/PHRASE_BANDS.md`
- Create: `docs/CURSOR_TASKS.md`

- [ ] **Step 1: Create docs/PRD.md**

```markdown
# Product Requirements Document — LinkedIn Juice Analyzer

## Problem
LinkedIn feeds are increasingly filled with AI-generated or low-information posts
that waste readers' time. There is no quick way to assess post quality at a glance.

## Solution
A Chrome extension that automatically scores every post in the LinkedIn feed on three
dimensions: AI-likeness, Bullshit density, and informational Juice. All processing is
local, deterministic, and runs without any API calls.

## Target User
Professionals who use LinkedIn and want to filter signal from noise.

## Core Features (MVP)
- Automatic scoring of all visible feed posts
- Score card injected below each post with AI / BS / Juice metrics (0–100)
- One-line deterministic summary sentence per post
- Deduplication so each post is scored once
- Handles LinkedIn's infinite scroll

## Out of Scope (MVP)
- Popup UI or settings page
- Score filtering or feed sorting
- Cloud sync or analytics
- Support for non-feed LinkedIn pages (profile, search, etc.)

## Success Criteria
- Extension loads without errors on linkedin.com/feed
- Score cards appear on all visible posts within 1 second of page load
- New posts loaded by infinite scroll are scored within 1 second
- No post is scored twice
- Build passes `npm run build` with zero TypeScript errors
- Unit tests pass with `npm test`
```

- [ ] **Step 2: Create docs/APP_FLOW.md**

```markdown
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
```

- [ ] **Step 3: Create docs/ARCHITECTURE.md**

```markdown
# Architecture — LinkedIn Juice Analyzer

## Layer Diagram

```
┌─────────────────────────────────────┐
│            Content Script           │
│         src/content/index.ts        │
│  (entry, dedup cache, orchestration)│
└────────────┬────────────────────────┘
             │
   ┌─────────┼──────────────┐
   ▼         ▼              ▼
LinkedIn   Scoring       MutationObserver
Parser     Engine        (observer.ts)
(parser)   (scoring/)
   │         │
   │    ┌────┼────────────┐
   │    ▼    ▼            ▼
   │  AI   Bullshit    Juice
   │  Score  Score     Score
   │         │
   │    Summary Builder
   │    (phrase-bands.ts)
   ▼
UI Injector
(ui-injector.ts)
```

## Module Responsibilities

| Module | Responsibility |
|---|---|
| `src/content/index.ts` | Entry point; orchestrates parse → score → inject loop; holds dedup cache |
| `src/content/linkedin-parser.ts` | DOM traversal; extracts post containers and text; no scoring logic |
| `src/content/ui-injector.ts` | DOM construction; CSS injection; idempotent card insertion |
| `src/content/observer.ts` | MutationObserver setup; debounce; calls back to content index |
| `src/scoring/index.ts` | Composes three scorers + summary into `PostScore` |
| `src/scoring/ai-score.ts` | AI detection heuristics; pure function; no DOM access |
| `src/scoring/bullshit-score.ts` | Bullshit heuristics; pure function |
| `src/scoring/juice-score.ts` | Juice/density heuristics; pure function |
| `src/scoring/phrase-bands.ts` | Static phrase data; `toBand()` converter |
| `src/scoring/summary.ts` | Builds deterministic sentence from band phrases |
| `src/utils/text-utils.ts` | Text processing primitives used by all scorers |
| `src/utils/hash.ts` | FNV-1a hash for deduplication |

## Key Design Decisions

1. **No external dependencies at runtime** — zero API calls, zero network requests
2. **IIFE bundle** — Vite outputs a single self-contained IIFE; no module loading overhead
3. **Dedup by hash not DOM node** — hash is stable across DOM re-renders; node identity is not
4. **Multi-selector DOM strategy** — LinkedIn changes class names; multiple fallback selectors
5. **Debounced observer** — prevents hammering the scoring engine on every micro-mutation
6. **Styles injected as string** — no separate CSS file needed; works with MV3 restrictions
```

- [ ] **Step 4: Create docs/SCORING_SYSTEM.md**

```markdown
# Scoring System — LinkedIn Juice Analyzer

All scores are integers 0–100. No LLMs, no external APIs. Fully deterministic.

---

## AI Score

Measures how much the post resembles AI-generated content.

**Signals and weights:**

| Signal | Max Points | Description |
|---|---|---|
| Hook phrases | 20 | "Here's what I've learned", "Hot take:", numbered learning lists |
| Transition phrases | 15 | "Furthermore", "Moreover", "Ultimately", "At the end of the day" |
| Engagement bait | 15 | "What do you think?", "Drop a comment", 👇 emojis |
| Cliché patterns | 20 | "game-changer", "thought leadership", "growth mindset", "journey" |
| Sentence symmetry | 15 | Low coefficient of variation in sentence lengths |
| List structure | 15 | Numbered/bulleted lists with 3+ items |
| Avg sentence length | 5 | Falls in the 12–28 word "AI sweet spot" |

---

## Bullshit Score

Measures the density of vague, buzzword-heavy, or content-free language.

| Signal | Max Points | Description |
|---|---|---|
| Buzzword density | 35 | Per-word density of ~35 known buzzwords |
| Vague intensifiers | 20 | "incredibly", "massively", "powerful", "ground-breaking" |
| Inspirational padding | 20 | "Success requires...", "The future of...", "Never stop..." |
| No numbers (long post) | 15 | Posts >40 words with zero concrete numbers |
| Adjective/adverb inflation | 10 | High ratio of -ly and -ive words |

---

## Juice Score

Measures informational density relative to total length.

**Positive signals:**

| Signal | Max Points | Description |
|---|---|---|
| Numbers & statistics | 25 | Integers, decimals, percentages, multipliers |
| Evidence markers | 25 | "because", "therefore", "research shows", "we found" |
| Technical tokens | 20 | URLs, version numbers, units (ms, %, $), code-like tokens |
| Named entities | 10 | Capitalized multi-word proper names |
| Sentence count | 10 | More distinct sentences = more distinct claims |

**Penalties:**

| Penalty | Max Points Deducted | Description |
|---|---|---|
| Filler phrases | 20 | "In today's world", "The power of", "At the end of the day" |
| Repetition | 20 | Low unique-bigram ratio (repeated phrases) |
| Verbosity | 30 | Low juice-signal density per word count |

---

## Scoring Pipeline

```
text → scoreAI(text)        → ai: 0–100
     → scoreBullshit(text)  → bullshit: 0–100
     → scoreJuice(text)     → juice: 0–100
     → buildSummary(ai, bs, juice) → summary: string
```
```

- [ ] **Step 5: Create docs/PHRASE_BANDS.md**

```markdown
# Phrase Bands Reference

Scores are mapped to one of 10 bands:
- Band 0: score 0–9
- Band 1: score 10–19
- ...
- Band 9: score 90–100

## AI Phrases (by band)

| Band | Score Range | Phrase |
|---|---|---|
| 0 | 0–9 | unmistakably human |
| 1 | 10–19 | very human feel |
| 2 | 20–29 | mostly human |
| 3 | 30–39 | human with slight polish |
| 4 | 40–49 | mixed signals |
| 5 | 50–59 | noticeably AI-shaped |
| 6 | 60–69 | likely AI-assisted |
| 7 | 70–79 | strong AI fingerprints |
| 8 | 80–89 | almost certainly AI-written |
| 9 | 90–100 | textbook AI output |

## Bullshit Phrases (by band)

| Band | Score Range | Phrase |
|---|---|---|
| 0 | 0–9 | zero fluff |
| 1 | 10–19 | very low fluff |
| 2 | 20–29 | mostly clean |
| 3 | 30–39 | minor buzzword noise |
| 4 | 40–49 | moderate bullshit |
| 5 | 50–59 | noticeable bullshit |
| 6 | 60–69 | heavy buzzword load |
| 7 | 70–79 | very buzzwordy |
| 8 | 80–89 | bullshit overdrive |
| 9 | 90–100 | pure thought-leadership |

## Juice Phrases (by band)

| Band | Score Range | Phrase |
|---|---|---|
| 0 | 0–9 | nothing of substance |
| 1 | 10–19 | almost no juice |
| 2 | 20–29 | very low juice |
| 3 | 30–39 | low juice |
| 4 | 40–49 | some juice |
| 5 | 50–59 | decent juice |
| 6 | 60–69 | good juice |
| 7 | 70–79 | solid juice |
| 8 | 80–89 | high juice |
| 9 | 90–100 | pure signal |

## Summary Template

```
{AI phrase}, {Bullshit phrase}, {Juice phrase}.
```

Example outputs:
- `Textbook AI output, bullshit overdrive, nothing of substance.`
- `Mostly human, zero fluff, solid juice.`
- `Mixed signals, moderate bullshit, some juice.`
```

- [ ] **Step 6: Create docs/CURSOR_TASKS.md**

```markdown
# Cursor Tasks — LinkedIn Juice Analyzer

Quick reference for common modifications you might want to make.

---

## Add a new AI signal

1. Open `src/scoring/ai-score.ts`
2. Add a new RegExp array constant near the top (e.g., `const NEW_SIGNALS = [/pattern/gi]`)
3. In `scoreAI()`, add a line: `score += Math.min(countMatches(text, NEW_SIGNALS) * N, MAX_PTS)`
4. Add a test case to `tests/scoring/ai-score.test.ts`
5. Run `npm test`

## Add a new buzzword

1. Open `src/scoring/bullshit-score.ts`
2. Add a new regex to the `BUZZWORDS` array
3. Run `npm test` to confirm nothing breaks

## Adjust score weights

Each scoring function has inline comments showing which variable to change:
- AI: `HOOK_PHRASES`, `TRANSITION_PHRASES`, `ENGAGEMENT_BAIT`, etc. — adjust the multiplier
- Bullshit: adjust the multiplier in `score += Math.min(buzzCount * X, MAX)`
- Juice: adjust the per-signal point values

## Change a phrase band

1. Open `src/scoring/phrase-bands.ts`
2. Edit the string at the desired band index in `AI_PHRASES`, `BULLSHIT_PHRASES`, or `JUICE_PHRASES`
3. Keep the array exactly 10 elements long

## Change the score card visual style

1. Open `src/content/ui-injector.ts`
2. Edit the `STYLES` template literal at the top
3. Color thresholds are controlled by `levelClass()` — adjust the 30/60 breakpoints as needed

## Add a new LinkedIn selector

LinkedIn updates its DOM structure periodically. To add fallback selectors:
1. Open `src/content/linkedin-parser.ts`
2. Add the new selector to `TEXT_SELECTORS` or `CONTAINER_SELECTORS`
3. Earlier entries in the array are preferred — put more specific selectors first

## Build and reload

```bash
npm run build
# Then reload the extension at chrome://extensions (click the reload icon)
```

## Run tests

```bash
npm test              # single run
npm run test:watch    # watch mode
```
```

- [ ] **Step 7: Commit all docs**

```bash
git add docs/
git commit -m "docs: add PRD, APP_FLOW, ARCHITECTURE, SCORING_SYSTEM, PHRASE_BANDS, CURSOR_TASKS"
```

---

## Task 17: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
# LinkedIn Juice Analyzer

A Chrome Extension that scores every LinkedIn feed post on three dimensions — locally,
instantly, with no AI APIs.

| Metric | What it measures |
|---|---|
| **AI** | How much the post reads like AI-generated content |
| **BS** | Density of buzzwords, fluff, and vague thought-leadership language |
| **Juice** | Informational payload relative to text length |

All scoring is deterministic and rule-based. No network requests. No data collection.

---

## Installation (Local Development)

### Prerequisites

- Node.js 18+
- Chrome or Chromium

### Steps

1. **Clone and install**

```bash
git clone <repo-url>
cd linkedin-juice-analyzer
npm install
```

2. **Generate placeholder icons**

```bash
node scripts/generate-icons.js
```

> For real icons, replace the files in `public/icons/` with your own 16×16, 48×48,
> and 128×128 PNGs before publishing.

3. **Build the extension**

```bash
npm run build
```

This outputs to `dist/`.

4. **Load in Chrome**

   - Open `chrome://extensions`
   - Enable **Developer mode** (toggle top-right)
   - Click **Load unpacked**
   - Select the `dist/` folder

5. **Go to LinkedIn**

   - Navigate to `https://www.linkedin.com/feed/`
   - Score cards should appear below each post automatically

---

## Development

### Watch mode (auto-rebuild on save)

```bash
npm run dev
```

After each rebuild, click the reload icon on `chrome://extensions` and refresh LinkedIn.

### Run tests

```bash
npm test
```

---

## Project Structure

```
src/
  content/        # Chrome content script (DOM interaction)
  scoring/        # Deterministic scoring engines (pure functions)
  utils/          # Text processing and hash utilities
  types.ts        # Shared TypeScript interfaces
public/
  manifest.json   # Chrome Extension Manifest V3
  icons/          # Extension icons
docs/             # Design docs and reference
tests/            # Vitest unit tests
```

---

## Customization

See `docs/CURSOR_TASKS.md` for a quick reference on:
- Adding scoring signals
- Changing phrase bands
- Adjusting visual styles
- Adding LinkedIn DOM selectors

---

## Scoring System

See `docs/SCORING_SYSTEM.md` for full documentation of all heuristics and weights.

---

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with installation and development instructions"
```

---

## Self-Review: Spec Coverage Check

| Spec Requirement | Covered By |
|---|---|
| Manifest V3 | Task 1 — `public/manifest.json` |
| TypeScript | Task 1 — `tsconfig.json`, all `.ts` files |
| Vite bundler | Task 1 — `vite.config.ts` |
| AI scoring with heuristics | Task 6 — `ai-score.ts` |
| Bullshit scoring with heuristics | Task 7 — `bullshit-score.ts` |
| Juice scoring with heuristics | Task 8 — `juice-score.ts` |
| 10 phrase bands per metric | Task 5 — `phrase-bands.ts` |
| Deterministic summary sentence | Task 9 — `summary.ts` |
| LinkedIn DOM parsing | Task 11 — `linkedin-parser.ts` |
| Score card injection | Task 12 — `ui-injector.ts` |
| Infinite scroll support | Task 13 — `observer.ts` |
| Deduplication/cache | Task 14 — `content/index.ts` |
| Hash-based dedup | Task 4 — `hash.ts` |
| No LLM at runtime | All scoring uses regex/math only |
| No backend | Content script only; no background worker |
| PRD.md | Task 16 |
| APP_FLOW.md | Task 16 |
| ARCHITECTURE.md | Task 16 |
| SCORING_SYSTEM.md | Task 16 |
| PHRASE_BANDS.md | Task 16 |
| CURSOR_TASKS.md | Task 16 |
| README with install instructions | Task 17 |
| Unit tests | Tasks 3, 4, 6, 7, 8, 9 |
| Score card: AI / BS / Juice + summary | Task 12 — `ui-injector.ts` |
| Color-coded scores | Task 12 — `levelClass()` |
| Compact, clean UI | Task 12 — `STYLES` template |
