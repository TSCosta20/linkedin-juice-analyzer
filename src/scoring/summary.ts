import { AI_PHRASES, BULLSHIT_PHRASES, JUICE_PHRASES, toBand } from './phrase-bands';

/**
 * Builds a deterministic one-line summary sentence from the three metric scores.
 * Output format: "{AI phrase}, {bullshit phrase}, {juice phrase}."
 *
 * Never generates text freely — output is composed entirely from predefined phrases.
 */
export function buildSummary(ai: number, bullshit: number, juice: number): string {
  const aiPhrase = AI_PHRASES[toBand(ai)];
  const bsPhrase = BULLSHIT_PHRASES[toBand(bullshit)];
  const juicePhrase = JUICE_PHRASES[toBand(juice)];

  const sentence = `${aiPhrase}, ${bsPhrase}, ${juicePhrase}.`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
