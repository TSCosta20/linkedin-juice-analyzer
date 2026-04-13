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
   │   AI  Bullshit    Juice
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
