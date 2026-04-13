import { describe, it, expect } from 'vitest';
import { scoreBullshit } from '../../src/scoring/bullshit-score';

const LOW_BS = `
We reduced our API p99 latency from 420ms to 38ms by switching to connection pooling
and eliminating 3 redundant database round-trips per request.
The change took 2 days and affected 4 services.
Before: 420ms. After: 38ms. 91% improvement with zero downtime.
`;

const HIGH_BS = `
In today's fast-paced, ever-evolving digital landscape, true leaders must leverage
synergistic paradigms to drive transformative outcomes. By embracing a growth mindset
and disrupting conventional wisdom, we can empower our teams to achieve authentic
excellence. The journey to success requires bandwidth, hustle, and a passion for
innovation. Let's scale our impact and move the needle on what truly matters.
`;

describe('scoreBullshit', () => {
  it('returns a number 0–100', () => {
    const s = scoreBullshit(LOW_BS);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  it('scores a concrete technical post low', () => {
    expect(scoreBullshit(LOW_BS)).toBeLessThan(30);
  });

  it('scores a buzzword-heavy inspirational post high', () => {
    expect(scoreBullshit(HIGH_BS)).toBeGreaterThan(60);
  });

  it('handles empty string without throwing', () => {
    expect(() => scoreBullshit('')).not.toThrow();
    expect(scoreBullshit('')).toBe(0);
  });

  it('penalizes long posts with no numbers', () => {
    const vague = 'Success is a journey. Leadership requires vision and passion. Stay authentic and never stop growing. The future belongs to those who dare to dream.';
    expect(scoreBullshit(vague)).toBeGreaterThan(20);
  });

  it('scores higher for more buzzwords', () => {
    const low = 'We shipped a new feature.';
    const high = 'We leveraged synergistic paradigms to disrupt the ecosystem and empower stakeholders.';
    expect(scoreBullshit(high)).toBeGreaterThan(scoreBullshit(low));
  });
});
