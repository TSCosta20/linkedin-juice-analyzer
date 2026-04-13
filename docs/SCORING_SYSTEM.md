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

## Tuning Tips

- **All weights are in-source constants** — no config file needed, just edit the multipliers
- Each `score +=` line in the scoring functions has a `Math.min(..., MAX)` cap — adjust the cap to change the influence of each signal
- Phrase bands in `src/scoring/phrase-bands.ts` are independent data — change them without touching scoring logic
