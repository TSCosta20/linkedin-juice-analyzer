import { describe, it, expect } from 'vitest';
import { buildSummary } from '../../src/scoring/summary';

describe('buildSummary', () => {
  it('returns a non-empty string', () => {
    expect(buildSummary(80, 70, 20)).toBeTruthy();
  });

  it('is deterministic — same inputs always produce same output', () => {
    expect(buildSummary(80, 70, 20)).toBe(buildSummary(80, 70, 20));
    expect(buildSummary(10, 50, 90)).toBe(buildSummary(10, 50, 90));
  });

  it('ends with a period', () => {
    expect(buildSummary(50, 50, 50)).toMatch(/\.$/);
  });

  it('starts with a capital letter', () => {
    const s = buildSummary(0, 0, 0);
    expect(s[0]).toBe(s[0].toUpperCase());
  });

  it('produces different output for different score combinations', () => {
    const highAI = buildSummary(90, 90, 5);
    const lowAI = buildSummary(5, 5, 90);
    expect(highAI).not.toBe(lowAI);
  });

  it('handles boundary scores 0 and 100 without throwing', () => {
    expect(() => buildSummary(0, 0, 100)).not.toThrow();
    expect(() => buildSummary(100, 100, 0)).not.toThrow();
  });

  it('contains three comma-separated parts', () => {
    const s = buildSummary(60, 40, 20);
    // Remove trailing period and split on comma
    const parts = s.replace(/\.$/, '').split(', ');
    expect(parts).toHaveLength(3);
  });
});
