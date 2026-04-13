import { describe, it, expect } from 'vitest';
import { scoreAI } from '../../src/scoring/ai-score';

const HUMAN_POST = `
Just spent 3 hours debugging a race condition in our Redis pub/sub setup.
Turned out the subscriber was registering before the channel was ready.
Fixed by deferring subscription until after the connection 'ready' event fires.
Classic async trap. Lesson: never assume connection order in async code.
`;

const AI_POST = `
I've been thinking a lot about leadership lately.

Here's what I've learned: the best leaders don't just manage teams — they inspire them.

Furthermore, great leadership requires three key qualities:
1. Empathy
2. Vision
3. Execution

Ultimately, what separates good leaders from great ones is their ability to embrace change.

What do you think? Drop a comment below and let me know your thoughts! 👇
`;

describe('scoreAI', () => {
  it('returns a number between 0 and 100', () => {
    const score = scoreAI(HUMAN_POST);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('scores a human-written technical post lower than an AI-style post', () => {
    expect(scoreAI(HUMAN_POST)).toBeLessThan(scoreAI(AI_POST));
  });

  it('scores the AI-style post above 55', () => {
    expect(scoreAI(AI_POST)).toBeGreaterThan(55);
  });

  it('scores the human technical post below 40', () => {
    expect(scoreAI(HUMAN_POST)).toBeLessThan(40);
  });

  it('handles empty string without throwing', () => {
    expect(() => scoreAI('')).not.toThrow();
    expect(scoreAI('')).toBe(0);
  });

  it('detects engagement bait patterns', () => {
    const baitPost = 'Great insight. What do you think? Drop a comment! 👇👇';
    expect(scoreAI(baitPost)).toBeGreaterThan(10);
  });

  it('detects hook phrases', () => {
    const hookPost = "Here's what I've learned after 10 years in the industry.";
    expect(scoreAI(hookPost)).toBeGreaterThan(scoreAI('I fixed a bug today.'));
  });
});
