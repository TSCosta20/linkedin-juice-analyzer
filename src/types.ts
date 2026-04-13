/** Score band index: Math.min(Math.floor(score / 10), 9) */
export type Band = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Final analysis result for one post */
export interface PostScore {
  ai: number;       // 0–100: likelihood the post was AI-written
  bullshit: number; // 0–100: density of fluff/buzzwords
  juice: number;    // 0–100: informational payload relative to length
  summary: string;  // deterministic one-line sentence from phrase bands
}

/** A processed post tracked in the dedup cache */
export interface TrackedPost {
  hash: string;
  score: PostScore;
  llmScore?: PostScore; // upgraded score from LLM, if available
}
