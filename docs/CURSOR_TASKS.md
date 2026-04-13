# Cursor Tasks — LinkedIn Juice Analyzer

Quick reference for common modifications.

---

## Add a new AI detection signal

1. Open `src/scoring/ai-score.ts`
2. Add a new RegExp array constant near the top (e.g., `const NEW_SIGNALS = [/pattern/gi]`)
3. In `scoreAI()`, add: `score += Math.min(countMatches(text, NEW_SIGNALS) * N, MAX_PTS)`
4. Add a test case to `tests/scoring/ai-score.test.ts`
5. Run `npm test`

## Add a new buzzword to the Bullshit scorer

1. Open `src/scoring/bullshit-score.ts`
2. Add a new regex to the `BUZZWORDS` array
3. Run `npm test` to confirm nothing breaks

## Adjust score weights

Each scoring function uses inline `Math.min(value * multiplier, cap)` expressions.
- Increase the **multiplier** to make a signal more sensitive
- Increase the **cap** to allow a signal to contribute more to the total
- Both are in-source constants — just edit the number

## Change a phrase band label

1. Open `src/scoring/phrase-bands.ts`
2. Edit the string at the desired band index in `AI_PHRASES`, `BULLSHIT_PHRASES`, or `JUICE_PHRASES`
3. Arrays must stay exactly 10 elements long (indices 0–9)

## Change score card colors

1. Open `src/content/ui-injector.ts`
2. Edit the color values in the `STYLES` template literal (`.lja-score-*` classes)
3. Adjust the low/mid/high thresholds in `levelClass()` (currently 30 and 60)

## Update LinkedIn DOM selectors

LinkedIn updates its DOM structure periodically. When score cards stop appearing:

1. Open `src/content/linkedin-parser.ts`
2. Inspect the LinkedIn feed in DevTools to find the current class names
3. Add the new selectors to `TEXT_SELECTORS` or `CONTAINER_SELECTORS`
4. Put more specific/reliable selectors earlier in the array (first match wins)

## Build and reload in Chrome

```bash
npm run build
# Then go to chrome://extensions and click the reload (↺) icon for the extension
# Then refresh your LinkedIn tab
```

## Run tests

```bash
npm test              # single run
npm run test:watch    # watch mode
```

## Watch mode (rebuild on save)

```bash
npm run dev
# Rebuilds dist/ on every file save; then reload in chrome://extensions
```
