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
  // Wikipedia: sentence-opener "Additionally," — flagged as top AI word 2023-2025
  /^additionally[,\.]/gim,
  /^in addition[,\.]/gim,
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
  /\bhave you (ever |also )?(experienced|seen|tried|faced|dealt with)\b/gi,
  /\bI'?d love to (hear|know|see)\b/gi,
  /\bshare (your|a) (thoughts?|experience|story|take)\b/gi,
];

/**
 * Classic LinkedIn clichés + the Wikipedia "high-density AI vocabulary" list.
 * Sources: internal patterns + https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
 *
 * Wikipedia top AI words by era:
 *   2023–mid-2024: delve, tapestry, testament, pivotal, meticulous, garner,
 *                  intricate/intricacies, vibrant, bolstered, underscore, landscape
 *   mid-2024–2025: fostering, showcasing, highlighting, emphasizing, pivotal,
 *                  bolstered, enduring, align with, vibrant, crucial, enhance
 */
const CLICHE_PATTERNS = [
  // ── Classic LinkedIn bro clichés ──────────────────────────────────────────
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

  // ── Wikipedia AI vocabulary (2023–2025) ───────────────────────────────────
  /\bdelve\b/gi,                          // THE most flagged AI word
  /\btapestry\b/gi,                       // iconic AI metaphor word
  /\btestament\b/gi,                      // "a testament to..."
  /\bpivotal\b/gi,
  /\bmeticulous(ly)?\b/gi,
  /\bgarner(ed|ing|s)?\b/gi,
  /\bvibrant\b/gi,
  /\bbolster(ed|ing|s)?\b/gi,
  /\bintricate\b/gi,
  /\bintricac(y|ies)\b/gi,
  /\bcrucial\b/gi,
  /\benduring\b/gi,
  /\bfoster(ing|ed|s)?\b/gi,
  /\bencompass(ing|es|ed)?\b/gi,
  /\binterplay\b/gi,
  /\brenowned\b/gi,
  /\bshowcas(e|ing|ed)\b/gi,
  /\benhance[sd]?\b/gi,
  /\bunderscor(e|es|ed|ing)\b/gi,
  /\blandscape\b/gi,                      // "evolving landscape", "digital landscape"
  /\bdiverse (array|range|set)\b/gi,
  /\bvital role\b/gi,
];

// Consultant / polished-AI writing patterns
const CONSULTANT_AI_PATTERNS = [
  // Formal parallel tricolon: "whether X, how Y, and what Z"
  /\bwhether\b.{5,60}\bhow\b.{5,60}\band what\b/gi,
  // "This aligns with / underscores / highlights / reflects"
  /\bthis (aligns with|underscores|highlights|reflects|reinforces|demonstrates)\b/gi,
  // Consultant CTAs
  /\bif you (want|need) to understand\b/gi,
  /\bour team can help\b/gi,
  /\blet'?s (chat|connect|talk|discuss)\b/gi,
  /\breach out (to learn|if you|to discuss)\b/gi,
  /\bbook (a call|time|a meeting)\b/gi,
  // Consultant-speak phrases
  /\bgrounded in (real |the )?(data|research|evidence)\b/gi,
  /\bwhere to play\b/gi,
  /\bplay to win\b/gi,
  /\bbreak down the opportunity\b/gi,
  /\bbuild a strategy\b/gi,
  /\bkey (questions?|takeaways?|considerations?|insights?) (for|include|are)\b/gi,
  /\bshare common traits\b/gi,
  /\bthis (matters|is why it matters)\b/gi,
  /\bhere'?s what (the data|this means|we('re| are) seeing)\b/gi,
  /\bprioritiz(e|ing)\b.{0,40}\bconsolidat(e|ing)\b/gi,
  /\bconsolidat(e|ing)\b.{0,40}\bintegrat(e|ing)\b/gi,
];

// LinkedIn ghostwriter / spotlight template patterns
const GHOSTWRITER_PATTERNS = [
  /\b(monday|tuesday|wednesday|thursday|friday|week(ly)?|founder|mentor|partner|employee|team|member)\s+(spotlight|feature|of the (day|week|month))\b/gi,
  /\bat the intersection of\b/gi,
  /\bis a great example of\b/gi,
  /\bthis is exactly why\b/gi,
  /\bwhat (she|he|they|we|I|it) (sees?|does?|thinks?|believes?|recommends?)\b/gi,
  /\b(her|his|their|our|my|the) approach is (different|simple|clear|straightforward)\b/gi,
  /\b(really |one (idea|thing|quote) (from \w+ that )?)stands out\b/gi,
  /\blucky to (work with|have|partner with|welcome)\b/gi,
  /\bstarted the way (many|most)\b/gi,
  /what'?s (one|your|the biggest) .{5,60}\?$/gim,
  /^→/gm,
  /\b(operate|sit|live|work)\s+at the intersection\b/gi,
  /\b(her|his|their) journey into\b/gi,
  /\b(here'?s what (we('re| are)|she|he|they) see(ing|s)?|here'?s how (she|he|they))\b/gi,
];

/**
 * Wikipedia Signs of AI Writing — language & content patterns.
 * Source: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
 *
 * Covers:
 *   - Copulative avoidance ("serves as", "stands as" instead of "is/are")
 *   - Negative parallelism ("not just X, but also Y")
 *   - Didactic disclaimers ("it's important to note that")
 *   - Significance/legacy inflation ("is a testament to", "plays a pivotal role")
 *   - Superficial -ing analysis ("highlighting the importance of", "fostering a culture of")
 *   - Vague authority attribution ("experts argue", "industry leaders suggest")
 *   - Promotional filler ("commitment to excellence", "nestled in", "boasts a vibrant")
 *   - Rule of three / elegant variation artifacts
 *   - Outline-like future/challenge sections
 */
const WIKIPEDIA_AI_PATTERNS = [
  // ── Copulative avoidance (substitutes "is/are" with heavier verbs) ─────────
  // "The company serves as a leading example" vs "The company is a leading example"
  /\b(serves?|stands?|acts?|functions?|operates?|exists?) as (a |an |the )?\w/gi,

  // ── Negative parallelism (Wikipedia signals #10, #11) ────────────────────
  // "not just X, but also Y" / "not only X but Y" / "it's not X, it's Y"
  /\bnot (just|only|merely)\b.{3,60}\bbut (also |rather )?\b/gi,
  /\bit'?s not .{3,40}[,—].{3,40}it'?s\b/gi,
  /\bthis isn'?t .{3,40}\brather\b/gi,

  // ── Didactic disclaimers (Wikipedia signal #52) ───────────────────────────
  // "It's important to note that..." — flagged as early AI tell
  /\bit'?s (important|worth|essential|critical|necessary) to (note|mention|highlight|emphasize|recognize|understand)\b/gi,
  /\bit'?s (important|worth|essential|critical) (noting|mentioning|highlighting|recognizing)\b/gi,
  /\bone (must|should|needs? to) (note|recognize|consider|acknowledge)\b/gi,

  // ── Significance inflation (Wikipedia signal #1) ──────────────────────────
  // "is a testament to", "plays a pivotal/crucial role", "setting the stage for"
  /\bis a testament to\b/gi,
  /\bplays? a (pivotal|crucial|vital|key|central|significant) role\b/gi,
  /\bsetting the stage (for|to)\b/gi,
  /\bkey turning point\b/gi,
  /\breflects? (broader|wider|deeper) (trends?|patterns?|shifts?|changes?)\b/gi,
  /\bmarks? (a|an) (significant|important|key|major|pivotal) (moment|milestone|shift|step|turning point)\b/gi,
  /\bdeeply rooted in\b/gi,
  /\bindel?ible (mark|impact|impression)\b/gi,

  // ── Superficial -ing analysis phrases (Wikipedia signal #3) ──────────────
  // Attaches "-ing" clauses claiming significance without evidence
  /\bhighlighting (the importance|the need|the significance|how)\b/gi,
  /\bunderscoring (the importance|the need|the significance|the fact)\b/gi,
  /\bcultivating (a culture|a sense|an environment|relationships)\b/gi,
  /\bfostering (a culture|a sense|an environment|innovation|growth|collaboration)\b/gi,
  /\bcontributing to (the|a|their|our) (ongoing|broader|wider|overall)\b/gi,
  /\bshaping (the future|how|the way|the landscape)\b/gi,
  /\bpaving the way (for|to)\b/gi,

  // ── Vague authority attribution (Wikipedia signal #5) ─────────────────────
  // "Experts argue", "Industry leaders say", "Studies show" — without source
  /\b(experts?|industry (experts?|leaders?|analysts?)|researchers?|studies|reports?|data) (argue|suggest|show|indicate|reveal|confirm|say|claim|note|point out)\b/gi,
  /\baccording to (experts?|industry leaders?|analysts?|researchers?|many)\b/gi,
  /\b(many|most|some) (experts?|leaders?|professionals?|practitioners?) (agree|believe|argue|say|think)\b/gi,

  // ── Promotional / advertisement language (Wikipedia signal #4) ────────────
  // Travel-guide and press-release tone
  /\bboasts? (a |an )?(vibrant|thriving|rich|diverse|robust|growing|world.?class)\b/gi,
  /\bnestled (in|within|among|at)\b/gi,
  /\bin the heart of\b/gi,
  /\bcommitment to (excellence|innovation|quality|sustainability|growth|our (clients?|customers?|community))\b/gi,
  /\bprofound (impact|effect|influence|change|transformation)\b/gi,

  // ── Outline-like challenge/future sections (Wikipedia signal #6) ──────────
  // Rigid formula: positives → "Despite..." → vague optimism
  /\bdespite (these|its|the) (challenges?|limitations?|obstacles?|hurdles?)\b/gi,
  /^(future (outlook|prospects?)|looking ahead|the road ahead)/gim,

  // ── Elegant variation artifacts (Wikipedia signal #13) ─────────────────────
  // Avoids repeating a subject's name: "the visionary", "the entrepreneur", "the platform"
  /\bthe (visionary|entrepreneur|executive|leader|platform|solution|offering|initiative)\b(?![\s\w]*['"])/gi,
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
  return Math.max(0, 1 - cv);
}

/**
 * Detects numbered/bulleted/arrow list structure — a common AI formatting pattern.
 * Returns a score 0–1.
 */
function listStructureScore(text: string): number {
  const numberedItems = (text.match(/^\s*\d+[\.\)]/gm) || []).length;
  const bulletItems   = (text.match(/^\s*[•\-\*]/gm) || []).length;
  const arrowItems    = (text.match(/^\s*→/gm) || []).length;
  return Math.min((numberedItems + bulletItems + arrowItems) / 5, 1);
}

/**
 * Em dash overuse — Wikipedia signal #18.
 * AI heavily substitutes commas and parentheses with em dashes (—).
 * Returns bonus points for 2+ em dashes.
 */
function emDashScore(text: string): number {
  const count = (text.match(/—/g) || []).length;
  if (count < 2) return 0;
  return Math.min(count * 3, 10);
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

  // Cliché patterns — LinkedIn bro + Wikipedia AI vocabulary (0–25 pts)
  const cliches = countMatches(text, CLICHE_PATTERNS);
  score += Math.min(cliches * 4, 25);

  // Consultant / polished-AI patterns (0–35 pts)
  const consultantSignals = countMatches(text, CONSULTANT_AI_PATTERNS);
  score += Math.min(consultantSignals * 9, 35);

  // LinkedIn ghostwriter / spotlight template patterns (0–40 pts)
  const ghostwriterSignals = countMatches(text, GHOSTWRITER_PATTERNS);
  score += Math.min(ghostwriterSignals * 7, 40);

  // Wikipedia Signs of AI Writing — language & content patterns (0–30 pts)
  const wikipediaSignals = countMatches(text, WIKIPEDIA_AI_PATTERNS);
  score += Math.min(wikipediaSignals * 5, 30);

  // Sentence symmetry (0–15 pts)
  score += Math.round(symmetryScore(text) * 15);

  // List structure (0–15 pts)
  score += Math.round(listStructureScore(text) * 15);

  // Em dash overuse — Wikipedia signal #18 (0–10 pts)
  score += emDashScore(text);

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
