import { describe, it } from 'vitest';

const TARYN = `How fast is your category growing on Amazon? Flywheel Retail Insights has just released enhanced category-level forecasts for Amazon, using proprietary data. Looking at compound annual growth between 2015 and 2030, here is what we are seeing. Edible Grocery 16.5%. Pet Care 14.8%. The three fastest-growing categories share common traits. They are consumables, purchased frequently, and benefit from same-day delivery. This aligns with where Amazon is investing, consolidating grocery infrastructure, integrating Whole Foods, and prioritizing rapid fulfillment. Key questions for brands include whether they are matching that growth velocity, how their category growth varies across key markets, and what the third-party risk or opportunity looks like. If you want to understand what this means for your category and where to play to win, our team can help you break down the opportunity and build a strategy grounded in real data.`;

const patterns: [string, RegExp][] = [
  ['tricolon whether/how/what', /\bwhether\b.{5,60}\bhow\b.{5,60}\band what\b/gi],
  ['this aligns with', /\bthis (aligns with|underscores|highlights|reflects|reinforces|demonstrates)\b/gi],
  ['if you want to understand', /\bif you (want|need) to understand\b/gi],
  ['our team can help', /\bour team can help\b/gi],
  ['grounded in real data', /\bgrounded in (real |the )?(data|research|evidence)\b/gi],
  ['where to play', /\bwhere to play\b/gi],
  ['build a strategy', /\bbuild a strategy\b/gi],
  ['key questions for/include', /\bkey (questions?|takeaways?|considerations?|insights?) (for|include|are)\b/gi],
  ['share common traits', /\bshare common traits\b/gi],
  ['here is what we are seeing', /\bhere.?s what (the data|this means|we(.re| are) seeing)\b/gi],
  ['consolidating+integrating', /\bconsolidat(e|ing)\b.{0,40}\bintegrat(e|ing)\b/gi],
];

describe('signal debug', () => {
  it('prints which signals fire', () => {
    for (const [name, re] of patterns) {
      const m = TARYN.match(re);
      if (m) console.log(`HIT  [${name}]: "${m[0]}"`);
      else   console.log(`miss [${name}]`);
    }
  });
});
