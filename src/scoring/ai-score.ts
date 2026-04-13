import { countMatches, getSentences, tokenize, wordCount } from '../utils/text-utils';

// ─── Signal pattern lists ────────────────────────────────────────────────────

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
  /this changed (everything|my life|how i think)/gi,
  /what (nobody|no one) tells you/gi,
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
  /\bwhen all is said and done\b/gi,
  /\bthe key (is|takeaway)\b/gi,
];

const ENGAGEMENT_BAIT = [
  /what do you think\??/gi,
  /drop a comment/gi,
  /let me know (your thoughts|below|in the comments)/gi,
  /follow (for more|me for)/gi,
  /like (and|&) (share|repost)/gi,
  /tag someone who/gi,
  /agree or disagree\??/gi,
  /save this (post|for later)/gi,
  /repost (if|to)/gi,
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
  /\blevel up\b/gi,
  /\bleverage\b/gi,
  /\bimpactful\b/gi,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Measures how uniform sentence lengths are.
 * AI tends to produce evenly-sized sentences; human writing has more variance.
 * Returns a score 0–1 where 1 = perfectly symmetric.
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
 * Detects numbered/bulleted list structure — a common AI formatting pattern.
 * Returns a score 0–1.
 */
function listStructureScore(text: string): number {
  const numberedItems = (text.match(/^\s*\d+[\.\)]/gm) || []).length;
  const bulletItems = (text.match(/^\s*[•\-\*]/gm) || []).length;
  return Math.min((numberedItems + bulletItems) / 5, 1);
}

// ─── Main scorer ─────────────────────────────────────────────────────────────

export function scoreAI(text: string): number {
  if (!text.trim()) return 0;

  let score = 0;

  // Hook phrase signals (0–20 pts)
  const hooks = countMatches(text, HOOK_PHRASES);
  score += Math.min(hooks * 10, 20);

  // Transition phrase overuse (0–15 pts)
  const transitions = countMatches(text, TRANSITION_PHRASES);
  score += Math.min(transitions * 5, 15);

  // Engagement bait (0–15 pts)
  const engagementBait = countMatches(text, ENGAGEMENT_BAIT);
  score += Math.min(engagementBait * 7, 15);

  // Cliché patterns (0–20 pts)
  const cliches = countMatches(text, CLICHE_PATTERNS);
  score += Math.min(cliches * 4, 20);

  // Sentence symmetry (0–15 pts)
  score += Math.round(symmetryScore(text) * 15);

  // List structure (0–15 pts)
  score += Math.round(listStructureScore(text) * 15);

  // Average sentence length in the AI sweet spot (12–28 words) (+5 pts)
  const sentences = getSentences(text).filter(Boolean);
  const tokens = tokenize(text);
  if (sentences.length > 0 && tokens.length > 10) {
    const avgSentenceLen = tokens.length / sentences.length;
    if (avgSentenceLen >= 12 && avgSentenceLen <= 28) {
      score += 5;
    }
  }

  return Math.min(Math.round(score), 100);
}
