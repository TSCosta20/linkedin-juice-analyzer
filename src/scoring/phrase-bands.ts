/**
 * Deterministic phrase arrays for each metric, indexed by band 0–9.
 * Band = Math.min(Math.floor(score / 10), 9)
 *
 * Each array has exactly 10 entries (index = band).
 * Edit these strings freely — scoring logic never reads them.
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
  'nothing of substance', // 0–9
  'almost no juice',      // 10–19
  'very low juice',       // 20–29
  'low juice',            // 30–39
  'some juice',           // 40–49
  'decent juice',         // 50–59
  'good juice',           // 60–69
  'solid juice',          // 70–79
  'high juice',           // 80–89
  'pure signal',          // 90–100
];

/** Convert a 0–100 score to a band index 0–9 */
export function toBand(score: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 {
  return Math.min(Math.floor(score / 10), 9) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}
