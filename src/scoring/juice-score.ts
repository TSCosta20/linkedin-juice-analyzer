import {
  countMatches,
  countNumbers,
  getSentences,
  tokenize,
  uniqueBigrams,
  wordCount,
} from '../utils/text-utils';

// ─── Signal pattern lists ────────────────────────────────────────────────────

const EVIDENCE_MARKERS = [
  /\bfor example\b/gi,
  /\bfor instance\b/gi,
  /\bspecifically\b/gi,
  /\bsuch as\b/gi,
  /\baccording to\b/gi,
  /\bresearch (shows?|suggests?|finds?)\b/gi,
  /\bdata (shows?|suggests?|indicates?)\b/gi,
  /\bwe (found|discovered|measured|observed|tested)\b/gi,
  /\bthe result(s)? (was|were|showed?|is)\b/gi,
  /\bthis (means?|resulted? in|caused?|led to)\b/gi,
  /\bbecause\b/gi,
  /\btherefore\b/gi,
  /\bwhich (means?|resulted?|caused?|led)\b/gi,
  /\bproved?\b/gi,
  /\bshowed?\b/gi,
  // Before/after comparisons and result language common in technical posts
  /\bend result[s]?:/gi,
  /\boutcome[s]?:/gi,
  /\bkey (changes?|findings?|takeaways?):/gi,
  /\breduced? (by|from) \d/gi,
  /\bincreased? (by|from) \d/gi,
  /\bdropped? (from|by|to) \d/gi,
  /\bimproved? (by|from) \d/gi,
  /\bfrom \d+\S* to \d/gi,   // "from 420ms to 38ms" pattern
];

const FILLER_PHRASES = [
  /\bin today'?s (world|landscape|market|era|environment)\b/gi,
  /\bthe (power|importance|value|beauty) of\b/gi,
  /\bwe all know\b/gi,
  /\bit'?s no secret\b/gi,
  /\blet'?s be honest\b/gi,
  /\bremember:/gi,
  /\bfood for thought\b/gi,
  /\btake a moment to\b/gi,
  /\bask yourself\b/gi,
  /\bat the end of the day\b/gi,
  /\bthe bottom line is\b/gi,
  /\btruth be told\b/gi,
  /\bwhen all is said and done\b/gi,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Repetition penalty based on bigram uniqueness.
 * Low unique-bigram ratio = many repeated phrases = less juice.
 * Returns penalty points 0–20.
 */
function repetitionPenalty(text: string): number {
  const words = tokenize(text);
  if (words.length < 4) return 0;
  const totalBigrams = words.length - 1;
  const uniqueB = uniqueBigrams(text);
  const ratio = uniqueB / totalBigrams;
  return Math.round((1 - ratio) * 20);
}

/**
 * Verbosity penalty: long posts with few concrete signals are penalized.
 * Returns penalty points 0–30.
 */
function verbosityPenalty(text: string, juiceSignals: number): number {
  const words = wordCount(text);
  if (words < 20) return 0;
  const density = juiceSignals / words;
  if (density >= 0.05) return 0;
  if (density >= 0.03) return 10;
  if (density >= 0.01) return 20;
  return 30;
}

// ─── Main scorer ─────────────────────────────────────────────────────────────

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

  // Technical/specific tokens: URLs, version numbers, units, code-like tokens (0–20 pts)
  const technicalTokens = (
    text.match(
      /\b(https?:\/\/\S+|v\d+\.\d+[\w.]*|\d+ms|\d+s\b|\d+%|\d+x\b|\$[\d,]+|[A-Z]{2,}[a-z]*\d+|[A-Z]{3,}\b)\b/g
    ) || []
  ).length;
  score += Math.min(technicalTokens * 4, 20);

  // Named entities: capitalized multi-word sequences (companies, people, products) (0–10 pts)
  const namedEntities = (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || []).length;
  score += Math.min(namedEntities * 2, 10);

  // Distinct sentences — more sentences = more separate claims (0–10 pts)
  const sentences = getSentences(text).filter((s) => wordCount(s) > 4);
  score += Math.min(sentences.length * 2, 10);

  // ── Penalties ──
  const fillerCount = countMatches(text, FILLER_PHRASES);
  score -= Math.min(fillerCount * 5, 20);

  score -= repetitionPenalty(text);
  score -= verbosityPenalty(text, numbers + evidence + technicalTokens);

  return Math.max(0, Math.min(Math.round(score), 100));
}
