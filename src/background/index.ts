import type { PostScore } from '../types';

// ─── Proxy config ─────────────────────────────────────────────────────────────
// The DeepSeek key lives on the server. The extension only holds a shared secret
// that can be rotated without changing the real key.

const PROXY_URL    = import.meta.env.VITE_PROXY_URL as string ?? '';
const PROXY_SECRET = import.meta.env.VITE_PROXY_SECRET as string ?? '';
const DAILY_LIMIT  = 7; // free proxy requests per installation per day

// ─── Rate limiter ─────────────────────────────────────────────────────────────

interface RateLimitState {
  date:  string; // "YYYY-MM-DD"
  count: number;
}

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

// ─── Prompt ──────────────────────────────────────────────────────────────────

function buildPrompt(text: string): string {
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

// ─── Provider callers (user's own key) ───────────────────────────────────────

async function callOpenAI(apiKey: string, text: string): Promise<PostScore | null> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: buildPrompt(text) }],
      response_format: { type: 'json_object' },
      temperature: 0,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content) as PostScore;
}

async function callAnthropic(apiKey: string, text: string): Promise<PostScore | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: buildPrompt(text) }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw: string = data.content[0].text;
  const match = raw.match(/\{[\s\S]*\}/);
  return match ? (JSON.parse(match[0]) as PostScore) : null;
}

async function callDeepSeek(apiKey: string, text: string): Promise<PostScore | null> {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: buildPrompt(text) }],
      response_format: { type: 'json_object' },
      temperature: 0,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content) as PostScore;
}

// ─── Proxy caller (fallback, rate-limited) ────────────────────────────────────

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
  (message: { type: string; text?: string }, _sender, sendResponse) => {
    if (message.type === 'LJA_OPEN_OPTIONS') {
      chrome.runtime.openOptionsPage();
      return false;
    }

    if (message.type !== 'LJA_ANALYZE') return false;

    (async () => {
      try {
        const text = message.text ?? '';

        // 1. User's own key → direct call, no rate limit
        const userSettings = await getSettings();
        if (userSettings?.apiKey) {
          let result: PostScore | null = null;
          if (userSettings.provider === 'openai')    result = await callOpenAI(userSettings.apiKey, text);
          if (userSettings.provider === 'anthropic') result = await callAnthropic(userSettings.apiKey, text);
          if (userSettings.provider === 'deepseek')  result = await callDeepSeek(userSettings.apiKey, text);
          sendResponse(result);
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
