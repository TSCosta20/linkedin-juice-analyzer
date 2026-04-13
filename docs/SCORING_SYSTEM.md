# Scoring System

LinkedIn Juice Analyzer scores every post on three independent metrics, each 0–100. Scores are computed locally using deterministic rule-based signals — no AI, no network calls (unless you connect an LLM key in settings).

---

## AI Score — How AI-written does this feel?

**0 = unmistakably human · 100 = clearly AI-generated**

| Range | Label | Badge |
|-------|-------|-------|
| 0–29  | Human feel | Green |
| 30–59 | Mixed signals | Yellow |
| 60–100 | Strong AI indicators | Red |

### What raises the score

**LinkedIn bro hooks** (up to 20 pts)
> "I've been thinking a lot about…", "hot take:", "unpopular opinion:", "most people don't realize", "here's what I've learned", "this changed everything", "story time"

**Overused transition phrases** (up to 15 pts)
> "furthermore", "moreover", "in conclusion", "ultimately", "the key takeaway", "at the end of the day", "what separates…", "the reality is", "the truth is"

**Engagement bait** (up to 15 pts)
> "what do you think?", "drop a comment", "tag someone who", "agree or disagree?", "I'd love to hear", "share your thoughts", "save this post", "repost if…"

**Clichés** (up to 20 pts)
> game-changer, thought leader, empower, transformation, journey, leverage, impactful, growth mindset, level up, next level, paradigm shift, authentic

**Consultant / polished-AI writing** (up to 35 pts)
These patterns appear in professionally ghostwritten or LLM-produced posts that avoid bro-style language but still follow AI templates:
> "at the intersection of X, Y, and Z"  
> "grounded in real data / research"  
> "where to play to win", "build a strategy"  
> "this aligns with / underscores / reflects"  
> "key questions for brands include whether… how… and what…" (formal tricolon)  
> "if you want to understand… our team can help" (consultant CTA)  
> "share common traits", "here's what we're seeing"

**LinkedIn ghostwriter / spotlight template** (up to 40 pts)
These are the hallmarks of AI-written feature posts and person spotlights:
> Spotlight headlines — "Monday's Mentor Spotlight", "Founder of the Week", "Partner Feature"  
> Section headers — "What she sees every day:", "Her approach is different:", "What he recommends:"  
> "is a great example of that", "this is exactly why"  
> "lucky to work with", "started the way many great ones do", "her journey into"  
> Arrow-bullet lists (`→ item`) — a strong AI formatting signal  
> Closing audience question — "What's one X you've seen Y do?"

**Structural signals** (up to 30 pts)
> Uniform sentence length — AI tends to write evenly-sized sentences; human writing has more variance  
> Numbered or bulleted lists (`1.`, `•`, `-`, `→`)  
> Average sentence length in the 12–28 word range (the AI "sweet spot")

### What keeps the score low
- Short, direct sentences with varying lengths
- Raw personal reactions or specific anecdotes
- No structural headers, bullet templates, or closing CTA
- Irregular rhythm, incomplete thoughts, informal phrasing

---

## BS Score — Buzzword & fluff density

**0 = concrete and specific · 100 = pure corporate speak**

| Range | Label | Badge |
|-------|-------|-------|
| 0–29  | Clean language | Green |
| 30–59 | Some buzzwords | Yellow |
| 60–100 | Heavy fluff | Red |

### What raises the score

**Buzzwords** (up to 35 pts, weighted by density per word)
> leverage, synergy, paradigm shift, disruptive, innovative, game-changer, thought leader, hustle, grind, journey, authentic, transformation, ecosystem, bandwidth, pivot, scale, impactful, empower, stakeholder, deliverable, move the needle, value proposition, pain points, low-hanging fruit, deep dive, circle back, blue-sky thinking, think outside the box, next level, growth mindset, world-class, best-in-class, seamless, holistic, robust, digital transformation, passionate, excellence

**Vague intensifiers** (up to 20 pts)
> incredibly, massively, hugely, absolutely, unbelievably, amazingly, powerful, ground-breaking, significant, dramatic, tremendous, phenomenal

**Inspirational padding** (up to 20 pts)
> "success is/requires…", "leaders must…", "the future of…", "be the change", "make an impact", "never stop learning", "the real secret to…", "stay humble", "the power of…", "the importance of…"

**No numbers in a long post** (up to 15 pts)
> A post over 40 words with zero concrete numbers signals vagueness

**Adjective/adverb inflation** (up to 10 pts)
> High ratio of words ending in `-ly` or `-ive` — empty amplification without content

### What keeps the score low
- Concrete nouns and verbs over adjectives and adverbs
- Specific numbers, names, and measurable outcomes
- Technical vocabulary that carries real meaning
- No motivational filler or corporate jargon

---

## Juice Score — Informational payload

**0 = nothing of substance · 100 = highly informative**

| Range | Label | Badge |
|-------|-------|-------|
| 0–29  | Low substance | Red |
| 30–59 | Some useful content | Yellow |
| 60–100 | Information-dense | Green |

*Juice is inverted — high is good (green), low is bad (red).*

### What raises the score

**Numbers and statistics** (up to 25 pts)
> Any integers, decimals, percentages, or multipliers — `16.5%`, `3x`, `$4M`, `420ms`, `2,500 users`

**Evidence and causal language** (up to 25 pts)
> "because", "therefore", "for example", "according to", "research shows", "we found", "the result was", "this led to", "which means", "proved", "showed"  
> Before/after comparisons: "reduced by 40%", "from 420ms to 38ms", "increased from X to Y"  
> Result framing: "end result:", "outcome:", "key findings:"

**Technical tokens** (up to 20 pts)
> URLs, version numbers (`v2.3.1`), time measurements (`48ms`), currency (`$1,200`), acronyms, code-like tokens — signals specificity

**Named entities** (up to 10 pts)
> Proper nouns — company names, product names, people's names — signals real-world grounding over generic claims

**Sentence count** (up to 10 pts)
> More distinct sentences = more separate factual claims

### What lowers the score (penalties)

**Filler phrases** (up to −20 pts)
> "in today's world", "we all know", "it's no secret", "ask yourself", "food for thought", "at the end of the day", "the bottom line is", "truth be told", "when all is said and done"

**Repetition** (up to −20 pts)
> Low ratio of unique word pairs (bigrams) — the same ideas recycled in different phrasings

**Verbosity without substance** (up to −30 pts)
> Long posts with few numbers, evidence markers, or technical tokens — lots of words, little signal density

### What keeps the score high
- Hard numbers and percentages
- Named companies, tools, people, or products
- Causal reasoning ("because X, therefore Y")
- Before/after comparisons with real measurements
- Technical specificity (versions, units, benchmarks, timeframes)

---

## Summary sentence

The italic line below the scores combines one phrase from each of three 10-band scales:

| Metric | Low end | High end |
|--------|---------|----------|
| AI | "Unmistakably human" | "Textbook AI output" |
| BS | "Zero fluff" | "Pure corporate speak" |
| Juice | "Nothing of substance" | "Extremely high signal" |

Example output: *"Textbook AI output, heavy buzzwords, solid data."*

---

## Scoring modes

| Badge | What it means |
|-------|---------------|
| Grey **LOCAL** | Scored by the local rule-based engine — instant, no network, no cost |
| Purple **LLM** | Local scores were upgraded by your connected LLM (OpenAI / Anthropic / DeepSeek) |

Configure your API key via the extension options page (right-click the extension icon → Options).
