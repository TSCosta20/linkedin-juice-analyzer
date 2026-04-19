/** Score band index: Math.min(Math.floor(score / 10), 9) */
export type Band = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Final analysis result for one post */
export interface PostScore {
  ai: number;       // 0–100: likelihood the post was AI-written
  bullshit: number; // 0–100: density of fluff/buzzwords
  juice: number;    // 0–100: informational payload relative to length
  summary: string;  // deterministic one-line sentence from phrase bands
  // Optional explanation fields — present for locally-scored posts, absent for LLM scores
  aiReasons?: string[];
  bsReasons?: string[];
  juiceBreakdown?: string[];
}

/** A processed post tracked in the dedup cache */
export interface TrackedPost {
  hash: string;
  score: PostScore;
  llmScore?: PostScore;
  postText: string;
  authorName: string;
  authorHeadline: string;
}

/** Author info parsed from the post DOM */
export interface PostAuthor {
  name: string;
  headline: string;
}

/** User profile stored in options */
export interface UserProfile {
  role: string;   // e.g. "Software engineer looking for a new job"
  goals: string;  // e.g. "Connect with CTOs and engineering leaders"
}

/** Action suggestion returned by LLM */
export interface ActionSuggestion {
  action: 'dm' | 'like' | 'comment' | 'skip';
  reason: string;  // one sentence explaining why
  text: string;    // exact DM or comment text (empty for like/skip)
}
