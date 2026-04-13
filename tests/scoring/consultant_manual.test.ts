import { describe, it, expect } from 'vitest';
import { scoreAI } from '../../src/scoring/ai-score';

const TARYN = `How fast is your category growing on Amazon? Flywheel Retail Insights has just released enhanced category-level forecasts for Amazon, using proprietary data. Looking at compound annual growth between 2015 and 2030, here is what we are seeing. Edible Grocery 16.5%. Pet Care 14.8%. The three fastest-growing categories share common traits. They are consumables, purchased frequently, and benefit from same-day delivery. This aligns with where Amazon is investing, consolidating grocery infrastructure, integrating Whole Foods, and prioritizing rapid fulfillment. Key questions for brands include whether they are matching that growth velocity, how their category growth varies across key markets, and what the third-party risk or opportunity looks like. If you want to understand what this means for your category and where to play to win, our team can help you break down the opportunity and build a strategy grounded in real data.`;

const HUMAN = `Had an awful commute today. Train was 40 mins late, standing room only, and my coffee spilled. At least I got to finish my book. Sometimes Monday just starts on hard mode.`;

describe('consultant AI detection', () => {
  it('scores Taryn consultant post above 40', () => {
    const s = scoreAI(TARYN);
    console.log('Taryn AI score:', s);
    expect(s).toBeGreaterThan(40);
  });
  it('scores human commute post below 20', () => {
    const s = scoreAI(HUMAN);
    console.log('Human AI score:', s);
    expect(s).toBeLessThan(20);
  });
});
