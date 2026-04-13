import {
  countMatches,
  countNumbers,
  findExamples,
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

// ─── Explainer ────────────────────────────────────────────────────────────────

const TECHNICAL_TOKEN_RE =
  /\b(https?:\/\/\S+|v\d+\.\d+[\w.]*|\d+ms|\d+s\b|\d+%|\d+x\b|\$[\d,]+|[A-Z]{2,}[a-z]*\d+|[A-Z]{3,}\b)\b/g;

export function explainJuice(text: string): string[] {
  if (!text.trim()) return [];
  const lines: string[] = [];

  const words = wordCount(text);
  const numbers = countNumbers(text);
  const evidence = countMatches(text, EVIDENCE_MARKERS);
  const techTokens = (text.match(TECHNICAL_TOKEN_RE) || []).length;
  const namedEntities = (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || []).length;
  const sentences = getSentences(text).filter((s) => wordCount(s) > 4);
  const fillerCount = countMatches(text, FILLER_PHRASES);

  const pts1 = Math.min(numbers * 5, 25);
  const pts2 = Math.min(evidence * 5, 25);
  const pts3 = Math.min(techTokens * 4, 20);
  const pts4 = Math.min(namedEntities * 2, 10);
  const pts5 = Math.min(sentences.length * 2, 10);
  const pen1 = Math.min(fillerCount * 5, 20);
  const pen2 = repetitionPenalty(text);
  const pen3 = verbosityPenalty(text, numbers + evidence + techTokens);

  lines.push(`${words} words analyzed`);

  if (numbers > 0) {
    const numExamples = (text.match(/\$[\d,]+|\d[\d,\.]*%|\d+x\b|\d+ms\b|\d[\d,\.]+/g) || []).slice(0, 6);
    lines.push(`Numbers: ${numbers} (+${pts1} pts) — ${numExamples.join(', ')}`);
  } else {
    lines.push('Numbers: none found (+0 pts)');
  }

  if (evidence > 0) {
    const evidenceExamples = findExamples(text, EVIDENCE_MARKERS, 5);
    lines.push(`Evidence markers: ${evidence} (+${pts2} pts) — "${evidenceExamples.join('", "')}"`);
  } else {
    lines.push('Evidence markers: none (+0 pts)');
  }

  if (techTokens > 0) {
    const techExamples = (text.match(TECHNICAL_TOKEN_RE) || []).slice(0, 5);
    lines.push(`Technical tokens: ${techTokens} (+${pts3} pts) — ${techExamples.join(', ')}`);
  } else {
    lines.push('Technical tokens: none (+0 pts)');
  }

  if (namedEntities > 0) {
    const entityExamples = (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || []).slice(0, 4);
    lines.push(`Named entities: ${namedEntities} (+${pts4} pts) — ${entityExamples.join(', ')}`);
  } else {
    lines.push('Named entities: none (+0 pts)');
  }

  lines.push(`Sentences: ${sentences.length} (+${pts5} pts)`);

  const totalPenalty = pen1 + pen2 + pen3;
  if (totalPenalty > 0) {
    const penParts: string[] = [];
    if (pen1 > 0) penParts.push(`filler −${pen1}`);
    if (pen2 > 0) penParts.push(`repetition −${pen2}`);
    if (pen3 > 0) penParts.push(`verbosity −${pen3}`);
    lines.push(`Penalties: ${penParts.join(', ')}`);
  } else {
    lines.push('Penalties: none');
  }

  return lines;
}
