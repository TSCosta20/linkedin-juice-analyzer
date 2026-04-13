import { describe, it, expect } from 'vitest';
import { scoreJuice } from '../../src/scoring/juice-score';

const HIGH_JUICE = `
We migrated our Postgres 14 cluster (2TB, 180k RPS at peak) to Aurora PostgreSQL 15.
Migration took 6 hours with zero downtime using logical replication.
Key changes: removed 3 unused indexes, rewrote 2 slow queries (830ms to 12ms),
and dropped a legacy trigger that was firing 40k times per hour.
End result: 22% reduction in CPU usage and $3,400 per month savings on RDS costs.
`;

const LOW_JUICE = `
I'm incredibly passionate about the power of innovation and leadership.
Success requires dedication, vision, and an unwavering commitment to excellence.
We must embrace change, empower our teams, and leverage every opportunity to grow.
The journey is what defines us. Stay authentic. Stay hungry. Stay humble.
`;

describe('scoreJuice', () => {
  it('returns a number 0–100', () => {
    const s = scoreJuice(HIGH_JUICE);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });

  it('scores a data-dense technical post high', () => {
    expect(scoreJuice(HIGH_JUICE)).toBeGreaterThan(60);
  });

  it('scores a vague inspirational post low', () => {
    expect(scoreJuice(LOW_JUICE)).toBeLessThan(30);
  });

  it('handles empty string without throwing', () => {
    expect(() => scoreJuice('')).not.toThrow();
    expect(scoreJuice('')).toBe(0);
  });

  it('scores higher when numbers are present', () => {
    const withNumbers = 'We increased revenue by 42% and reduced costs by $12,000 in Q3.';
    const withoutNumbers = 'We increased revenue significantly and reduced costs dramatically.';
    expect(scoreJuice(withNumbers)).toBeGreaterThan(scoreJuice(withoutNumbers));
  });

  it('scores higher when evidence markers are present', () => {
    const withEvidence = 'Because we added caching, response time dropped. This means users wait less.';
    const withoutEvidence = 'We added caching. Response time improved. Users are happy.';
    expect(scoreJuice(withEvidence)).toBeGreaterThanOrEqual(scoreJuice(withoutEvidence));
  });
});
