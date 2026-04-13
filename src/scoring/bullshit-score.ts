import { countMatches, countNumbers, tokenize, wordCount } from '../utils/text-utils';

// ─── Signal pattern lists ────────────────────────────────────────────────────

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
  /\bsynergy\b/gi,
  /\brobust\b/gi,
  /\bseamless(ly)?\b/gi,
  /\bholistic(ally)?\b/gi,
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
  /\btremendous(ly)?\b/gi,
  /\bphenomenal(ly)?\b/gi,
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
  /\bstay (hungry|humble|authentic|focused)\b/gi,
  /\bthe (power|importance|value) of\b/gi,
];

// ─── Main scorer ─────────────────────────────────────────────────────────────

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

  // Absence of concrete numbers in a long post signals vagueness (0–15 pts)
  const numbers = countNumbers(text);
  if (words > 40 && numbers === 0) {
    score += 15;
  } else if (words > 40 && numbers <= 1) {
    score += 7;
  }

  // Adjective/adverb inflation: words ending in -ly or -ive (0–10 pts)
  const tokens = tokenize(text);
  const inflatedWords = tokens.filter(
    (t) => t.endsWith('ly') || (t.endsWith('ive') && t.length > 5)
  ).length;
  const inflationRatio = tokens.length > 0 ? inflatedWords / tokens.length : 0;
  score += Math.min(Math.round(inflationRatio * 60), 10);

  return Math.min(Math.round(score), 100);
}
