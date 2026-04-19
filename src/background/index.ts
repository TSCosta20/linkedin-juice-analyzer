import type { PostScore, ActionSuggestion, UserProfile } from '../types';

// ─── Proxy config ─────────────────────────────────────────────────────────────

const PROXY_URL    = import.meta.env.VITE_PROXY_URL as string ?? '';
const PROXY_SECRET = import.meta.env.VITE_PROXY_SECRET as string ?? '';
const DAILY_LIMIT  = 7;

// ─── Rate limiter ─────────────────────────────────────────────────────────────

interface RateLimitState { date: string; count: number; }

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function checkAndIncrement(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get('lja_rate', (result) => {
      const today = todayUTC();
      const state = result.lja_rate as RateLimitState | undefined;
      const count = state?.date === today ? state.count : 0;
      if (count >= DAILY_LIMIT) { resolve(false); return; }
      chrome.storage.local.set({ lja_rate: { date: today, count: count + 1 } });
      resolve(true);
    });
  });
}

// ─── Daily juice badge ────────────────────────────────────────────────────────

interface DailyScores { date: string; scores: number[]; }

function recordJuiceScore(juice: number): void {
  chrome.storage.local.get('lja_daily', (result) => {
    const today = todayUTC();
    const existing = result.lja_daily as DailyScores | undefined;
    const scores = existing?.date === today ? [...existing.scores, juice] : [juice];
    chrome.storage.local.set({ lja_daily: { date: today, scores } });
    updateBadge(scores);
  });
}

function updateBadge(scores: number[]): void {
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const color = avg >= 60 ? '#22c55e' : avg >= 30 ? '#f59e0b' : '#ef4444';
  chrome.action.setBadgeText({ text: String(avg) });
  chrome.action.setBadgeBackgroundColor({ color });
}

// Restore badge on service worker wake-up
chrome.storage.local.get('lja_daily', (result) => {
  const today = todayUTC();
  const existing = result.lja_daily as DailyScores | undefined;
  if (existing?.date === today && existing.scores.length > 0) {
    updateBadge(existing.scores);
  }
});

// ─── User settings ────────────────────────────────────────────────────────────

type Provider = 'openai' | 'anthropic' | 'deepseek';
interface LLMSettings { provider: Provider; apiKey: string; }

function getSettings(): Promise<LLMSettings | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['lja_provider', 'lja_apiKey'], (result) => {
      if (!result.lja_apiKey) resolve(null);
      else resolve({ provider: (result.lja_provider as Provider) || 'openai', apiKey: result.lja_apiKey as string });
    });
  });
}

function getUserProfile(): Promise<UserProfile | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['lja_role', 'lja_goals'], (result) => {
      if (!result.lja_role && !result.lja_goals) resolve(null);
      else resolve({ role: result.lja_role as string ?? '', goals: result.lja_goals as string ?? '' });
    });
  });
}

// ─── Scoring prompt ───────────────────────────────────────────────────────────

function buildScoringPrompt(text: string): string {
  return `Score this LinkedIn post on three metrics. Return ONLY valid JSON — no explanation, no markdown.

Fields:
- "ai": 0-100. How AI-generated does this feel? (0=unmistakably human, 100=clearly AI-written)
- "bullshit": 0-100. Buzzword and fluff density. (0=concrete/specific, 100=pure corporate speak)
- "juice": 0-100. Informational value. (0=no substance, 100=highly informative with data/evidence)
- "summary": One sentence max 12 words describing the post's character.

Post:
"""
${text.slice(0, 2000)}
"""`;
}

// ─── Action suggestion prompt ─────────────────────────────────────────────────

function buildSuggestionPrompt(
  postText: string,
  authorName: string,
  authorHeadline: string,
  userRole: string,
  userGoals: string
): string {
  return `You are advising a LinkedIn user on what to do with a post they just saw.

About the user:
- Who they are: ${userRole}
- Their goals: ${userGoals}

Post author: ${authorName}${authorHeadline ? ` — ${authorHeadline}` : ''}

Post content:
"""
${postText.slice(0, 1500)}
"""

Based on the user's goals and the post/author, suggest ONE specific action. Return ONLY valid JSON:
{
  "action": "dm" | "like" | "comment" | "skip",
  "reason": "One sentence: why this action makes sense given their goals",
  "text": "The exact message to send or post (for dm/comment). Empty string for like or skip."
}

For dm/comment, write the full ready-to-send text, personalised and specific. Keep it concise and natural.`;
}

// ─── Provider callers ─────────────────────────────────────────────────────────

async function callOpenAI(apiKey: string, prompt: string): Promise<string | null> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 400,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function callAnthropic(apiKey: string, prompt: string): Promise<string | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw: string = data.content[0].text;
  const match = raw.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

async function callDeepSeek(apiKey: string, prompt: string): Promise<string | null> {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 400,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function callWithUserKey(apiKey: string, provider: Provider, prompt: string): Promise<string | null> {
  if (provider === 'openai')    return callOpenAI(apiKey, prompt);
  if (provider === 'anthropic') return callAnthropic(apiKey, prompt);
  if (provider === 'deepseek')  return callDeepSeek(apiKey, prompt);
  return null;
}

async function callProxy(text: string): Promise<PostScore | null> {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PROXY_SECRET}` },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return null;
  return res.json() as Promise<PostScore>;
}

// ─── Message listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: {
    type: string;
    text?: string;
    juice?: number;
    authorName?: string;
    authorHeadline?: string;
  }, _sender, sendResponse) => {

    if (message.type === 'LJA_OPEN_OPTIONS') {
      chrome.runtime.openOptionsPage();
      return false;
    }

    // Record a juice score for the badge (fire-and-forget)
    if (message.type === 'LJA_RECORD_SCORE') {
      if (typeof message.juice === 'number') recordJuiceScore(message.juice);
      return false;
    }

    // Action suggestion — requires user's own API key
    if (message.type === 'LJA_SUGGEST') {
      (async () => {
        try {
          const settings = await getSettings();
          if (!settings?.apiKey) {
            sendResponse({ _noKey: true });
            return;
          }
          const profile = await getUserProfile();
          if (!profile?.role && !profile?.goals) {
            sendResponse({ _noProfile: true });
            return;
          }
          const prompt = buildSuggestionPrompt(
            message.text ?? '',
            message.authorName ?? 'Unknown',
            message.authorHeadline ?? '',
            profile?.role ?? '',
            profile?.goals ?? ''
          );
          const raw = await callWithUserKey(settings.apiKey, settings.provider, prompt);
          if (!raw) { sendResponse(null); return; }
          sendResponse(JSON.parse(raw) as ActionSuggestion);
        } catch {
          sendResponse(null);
        }
      })();
      return true;
    }

    if (message.type !== 'LJA_ANALYZE') return false;

    (async () => {
      try {
        const text = message.text ?? '';

        // 1. User's own key → direct call, no rate limit
        const userSettings = await getSettings();
        if (userSettings?.apiKey) {
          const raw = await callWithUserKey(userSettings.apiKey, userSettings.provider, buildScoringPrompt(text));
          sendResponse(raw ? JSON.parse(raw) as PostScore : null);
          return;
        }

        // 2. Proxy fallback → enforce daily limit
        if (!PROXY_URL || !PROXY_SECRET) { sendResponse(null); return; }
        const allowed = await checkAndIncrement();
        if (!allowed) { sendResponse({ _rateLimited: true }); return; }
        sendResponse(await callProxy(text));
      } catch {
        sendResponse(null);
      }
    })();

    return true;
  }
);
