import { describe, it, expect } from 'vitest';
import { scoreAI } from '../../src/scoring/ai-score';

const HYPERNEST = `Monday's Mentor Spotlight: Laura Cole, Esq.

At Hypernest, we're lucky to work with mentors who operate at the intersection of Web3, law, and real-world execution, and Laura is a great example of that.

From tax law → environmental law → Web3, her journey into crypto started the way many great ones do:
👉 by being in the room, learning from builders, and contributing early.

One idea from her that really stands out: "Build thoughtfully."

What she sees every day:
→ founders launching tokens before understanding the risks
→ builders asking legal questions after shipping
→ teams underestimating how fast things can go wrong

Her approach is different:
• You don't need to solve 100% of legal on day one
• But you need to pace it and stay aligned as you grow
• Talk early with the right people (legal, finance, investors)

This is exactly why we value having Laura as part of the Hypernest mentor network

What's one legal mistake you've seen founders make early?`;

const HUMAN = `Had an awful commute today. Train was 40 mins late, standing room only, and my coffee spilled. At least I got to finish my book. Sometimes Monday just starts on hard mode.`;

describe('ghostwriter AI detection', () => {
  it('scores HyperNest spotlight post above 60', () => {
    const s = scoreAI(HYPERNEST);
    console.log('HyperNest AI score:', s);
    expect(s).toBeGreaterThanOrEqual(60);
  });
  it('human commute post stays below 20', () => {
    const s = scoreAI(HUMAN);
    console.log('Human AI score:', s);
    expect(s).toBeLessThan(20);
  });
});
