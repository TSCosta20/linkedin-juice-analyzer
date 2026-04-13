import { describe, it, expect } from 'vitest';
import { hashText } from '../../src/utils/hash';

describe('hashText', () => {
  it('returns a non-empty hex string', () => {
    const h = hashText('hello world');
    expect(h).toMatch(/^[0-9a-f]+$/);
    expect(h.length).toBeGreaterThan(0);
  });
  it('is deterministic', () => {
    expect(hashText('test post')).toBe(hashText('test post'));
  });
  it('produces different hashes for different inputs', () => {
    expect(hashText('post A')).not.toBe(hashText('post B'));
  });
  it('handles empty string without throwing', () => {
    expect(() => hashText('')).not.toThrow();
  });
  it('handles unicode input', () => {
    expect(() => hashText('héllo wörld 🚀')).not.toThrow();
  });
});
