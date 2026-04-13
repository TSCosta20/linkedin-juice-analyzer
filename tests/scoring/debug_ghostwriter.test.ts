import { describe, it } from 'vitest';

const POST = `Monday's Mentor Spotlight: Laura Cole, Esq.
At Hypernest, we're lucky to work with mentors who operate at the intersection of Web3, law, and real-world execution, and Laura is a great example of that.
From tax law to environmental law to Web3, her journey into crypto started the way many great ones do: by being in the room, learning from builders, and contributing early.
One idea from her that really stands out: "Build thoughtfully."
What she sees every day:
Her approach is different:
You don't need to solve 100% of legal on day one
But you need to pace it and stay aligned as you grow
Talk early with the right people (legal, finance, investors)
This is exactly why we value having Laura as part of the Hypernest mentor network
What's one legal mistake you've seen founders make early?`;

const patterns: [string, RegExp][] = [
  ['spotlight headline',         /\b(monday|tuesday|wednesday|thursday|friday|week(ly)?|founder|mentor|partner|employee|team|member)\s+(spotlight|feature|of the (day|week|month))\b/gi],
  ['at the intersection of',     /\bat the intersection of\b/gi],
  ['is a great example of',      /\bis a great example of\b/gi],
  ['this is exactly why',        /\bthis is exactly why\b/gi],
  ['what she/he sees',           /\bwhat (she|he|they|we|I|it) (sees?|does?|thinks?|believes?|recommends?)\b/gi],
  ['her approach is different',  /\b(her|his|their|our|my|the) approach is (different|simple|clear|straightforward)\b/gi],
  ['stands out',                 /\b(really |one (idea|thing|quote) (from \w+ that )?)stands out\b/gi],
  ['lucky to work with',         /\blucky to (work with|have|partner with|welcome)\b/gi],
  ['started the way many',       /\bstarted the way (many|most)\b/gi],
  ['closing question',           /what'?s (one|your|the biggest) .{5,60}\?$/gim],
  ['her journey into',           /\b(her|his|their) journey into\b/gi],
];

describe('ghostwriter debug', () => {
  it('shows which patterns fire', () => {
    let total = 0;
    for (const [name, re] of patterns) {
      const m = POST.match(re);
      const count = m ? m.length : 0;
      total += count;
      console.log(`${count > 0 ? 'HIT ' : 'miss'} [${name}] (${count}x)`);
    }
    console.log(`Total signals: ${total}`);
  });
});
