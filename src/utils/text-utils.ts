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

/** Count standalone numeric tokens (integers, decimals, percentages, multipliers) */
export function countNumbers(text: string): number {
  const matches = text.match(/\b\d+(\.\d+)?(%|x)?\b/g);
  return matches ? matches.length : 0;
}

/**
 * Finds all matching snippets across all patterns, returning up to `max` unique examples.
 * Collects every occurrence (not just one per pattern) to maximise coverage.
 * Creates a fresh copy of each regex to avoid lastIndex state issues.
 */
export function findExamples(text: string, patterns: RegExp[], max = 6): string[] {
  const results: string[] = [];
  for (const pattern of patterns) {
    if (results.length >= max) break;
    const re = new RegExp(pattern.source, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (results.length >= max) break;
      const example = m[0].trim().replace(/\s+/g, ' ').slice(0, 45);
      if (!results.some((r) => r.toLowerCase() === example.toLowerCase())) {
        results.push(example);
      }
    }
  }
  return results;
}

/**
 * Count unique adjacent word pairs (bigrams).
 * Used to detect repetition: fewer unique bigrams relative to total = more repetitive.
 */
export function uniqueBigrams(text: string): number {
  const words = tokenize(text);
  const seen = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    seen.add(`${words[i]}_${words[i + 1]}`);
  }
  return seen.size;
}
