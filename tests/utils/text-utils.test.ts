import { describe, it, expect } from 'vitest';
import {
  normalize,
  tokenize,
  getSentences,
  wordCount,
  countMatches,
  countNumbers,
  uniqueBigrams,
} from '../../src/utils/text-utils';

describe('normalize', () => {
  it('lowercases and strips extra whitespace', () => {
    expect(normalize('  Hello   World  ')).toBe('hello world');
  });
  it('handles already-clean input', () => {
    expect(normalize('hello world')).toBe('hello world');
  });
});

describe('tokenize', () => {
  it('splits on whitespace and removes punctuation', () => {
    expect(tokenize('Hello, world! How are you?')).toEqual([
      'hello', 'world', 'how', 'are', 'you',
    ]);
  });
  it('returns empty array for empty string', () => {
    expect(tokenize('')).toEqual([]);
  });
  it('handles numbers in text', () => {
    expect(tokenize('3 items')).toContain('3');
  });
});

describe('getSentences', () => {
  it('splits on sentence-ending punctuation', () => {
    const s = getSentences('Hello world. How are you? Fine!');
    expect(s).toHaveLength(3);
  });
  it('returns single-item array when no sentence punctuation', () => {
    expect(getSentences('no punctuation here')).toHaveLength(1);
  });
  it('filters blank results', () => {
    const s = getSentences('one. two. three.');
    expect(s.every((x) => x.length > 0)).toBe(true);
  });
});

describe('wordCount', () => {
  it('counts space-separated tokens', () => {
    expect(wordCount('one two three')).toBe(3);
  });
  it('returns 0 for empty string', () => {
    expect(wordCount('')).toBe(0);
  });
  it('returns 0 for whitespace-only string', () => {
    expect(wordCount('   ')).toBe(0);
  });
});

describe('countMatches', () => {
  it('counts regex matches', () => {
    expect(countMatches('foo bar foo baz', [/foo/g])).toBe(2);
  });
  it('sums across multiple patterns', () => {
    expect(countMatches('foo bar baz', [/foo/g, /baz/g])).toBe(2);
  });
  it('returns 0 when no matches', () => {
    expect(countMatches('hello world', [/xyz/g])).toBe(0);
  });
});

describe('countNumbers', () => {
  it('counts standalone number tokens', () => {
    expect(countNumbers('I have 3 items and 10 minutes')).toBe(2);
  });
  it('handles percentages', () => {
    expect(countNumbers('growth of 42%')).toBe(1);
  });
  it('handles multipliers', () => {
    expect(countNumbers('3.14x faster')).toBe(1);
  });
  it('returns 0 when no numbers', () => {
    expect(countNumbers('no numbers here')).toBe(0);
  });
});

describe('uniqueBigrams', () => {
  it('returns count of unique adjacent word pairs', () => {
    // "the cat sat on the cat" → bigrams: the-cat, cat-sat, sat-on, on-the, the-cat (dup)
    // unique: the-cat, cat-sat, sat-on, on-the = 4
    expect(uniqueBigrams('the cat sat on the cat')).toBe(4);
  });
  it('returns 0 for single word', () => {
    expect(uniqueBigrams('word')).toBe(0);
  });
  it('all unique when no repetition', () => {
    expect(uniqueBigrams('a b c d')).toBe(3);
  });
});
