import { explainAI, scoreAI } from './ai-score';
import { explainBullshit, scoreBullshit } from './bullshit-score';
import { explainJuice, scoreJuice } from './juice-score';
import { buildSummary } from './summary';
import type { PostScore } from '../types';

/**
 * Runs all three scoring engines on the given post text and returns a PostScore.
 * Pure function — no side effects, no DOM access, no network calls.
 */
export function analyzePost(text: string): PostScore {
  const ai = scoreAI(text);
  const bullshit = scoreBullshit(text);
  const juice = scoreJuice(text);
  const summary = buildSummary(ai, bullshit, juice);
  return {
    ai,
    bullshit,
    juice,
    summary,
    aiReasons: explainAI(text),
    bsReasons: explainBullshit(text),
    juiceBreakdown: explainJuice(text),
  };
}
