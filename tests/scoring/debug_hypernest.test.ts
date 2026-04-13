import { describe, it } from 'vitest';

const POST = `Monday's Mentor Spotlight: Laura Cole, Esq.

At Hypernest, we're lucky to work with mentors who operate at the intersection of Web3, law, and real-world execution, and Laura is a great example of that.

From tax law to environmental law to Web3, her journey into crypto started the way many great ones do: by being in the room, learning from builders, and contributing early.

One idea from her that really stands out: "Build thoughtfully."

What she sees every day:
founders launching tokens before understanding the risks
builders asking legal questions after shipping
teams underestimating how fast things can go wrong

Her approach is different:
You don't need to solve 100% of legal on day one
But you need to pace it and stay aligned as you grow
Talk early with the right people (legal, finance, investors)

This is exactly why we value having Laura as part of the Hypernest mentor network

What's one legal mistake you've seen founders make early?`;

const patterns: [string, RegExp][] = [
  // existing
  ['hook phrases',        /i'?ve been thinking|here'?s what i'?ve learned|hot take|unpopular opinion|most people don'?t realize/gi],
  ['transitions',         /furthermore|moreover|in conclusion|ultimately|the reality is|the key (is|takeaway)/gi],
  ['engagement bait',     /what do you think|drop a comment|let me know (your thoughts|below)|follow (for more|me for)|agree or disagree/gi],
  ['clichés',             /game.?changer|thought leader|empower|transform|journey|leverage|impactful/gi],
  ['consultant signals',  /whether\b.{5,60}\bhow\b.{5,60}\band what|this aligns with|if you (want|need) to understand|our team can help|grounded in (real |the )?(data|research)|where to play|key questions? (for|include)/gi],
  // missing?
  ['at the intersection', /\bat the intersection of\b/gi],
  ['is a great example',  /\bis a great example of\b/gi],
  ['this is exactly why', /\bthis is exactly why\b/gi],
  ['her approach is different', /\b\w+ approach is different\b/gi],
  ['what \w+ sees',       /\bwhat \w+ sees\b/gi],
  ['arrow list (→)',      /^→/gm],
  ['bullet structure',    /^[•\-\*]/gm],
  ['spotlight headline',  /\b(mentor|week|founder|employee|partner|team)\s+spotlight\b/gi],
  ['closing question',    /what'?s one .{5,50}\?$/gim],
  ['started the way',     /started the way (many|most)/gi],
  ['really stands out',   /really stands out/gi],
  ['lucky to (work|have)',/\blucky to (work|have|partner)\b/gi],
];

describe('debug', () => {
  it('signal audit', () => {
    for (const [name, re] of patterns) {
      const m = POST.match(re);
      if (m) console.log(`HIT  [${name}]: "${m[0].slice(0,60)}"`);
      else   console.log(`miss [${name}]`);
    }
  });
});
