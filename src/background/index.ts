import type { PostScore } from '../types';

// Inline settings helpers — keeps background.js self-contained (no chunk imports)
type Provider = 'openai' | 'anthropic' | 'deepseek';
interface LLMSettings { provider: Provider; apiKey: string; }

function getSettings(): Promise<LLMSettings | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['lja_provider', 'lja_apiKey'], (result) => {
      if (!result.lja_apiKey) {
        resolve(null);
      } else {
        resolve({ provider: (result.lja_provider as Provider) || 'openai', apiKey: result.lja_apiKey as string });
      }
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

// ─── Provider callers ─────────────────────────────────────────────────────────

async function callOpenAI(settings: LLMSettings, text: string): Promise<PostScore | null> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
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

async function callAnthropic(settings: LLMSettings, text: string): Promise<PostScore | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
    },
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

async function callDeepSeek(settings: LLMSettings, text: string): Promise<PostScore | null> {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
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

// ─── Message listener ─────────────────────────────────────────────────────────

interface AnalyzeRequest {
  type: 'LJA_ANALYZE';
  text: string;
}

chrome.runtime.onMessage.addListener(
  (message: AnalyzeRequest, _sender, sendResponse) => {
    if (message.type !== 'LJA_ANALYZE') return false;

    (async () => {
      try {
        const settings = await getSettings();
        if (!settings?.apiKey) {
          sendResponse(null);
          return;
        }
        let result: PostScore | null = null;
        if (settings.provider === 'openai')   result = await callOpenAI(settings, message.text);
        if (settings.provider === 'anthropic') result = await callAnthropic(settings, message.text);
        if (settings.provider === 'deepseek') result = await callDeepSeek(settings, message.text);
        sendResponse(result);
      } catch {
        sendResponse(null);
      }
    })();

    return true; // keep message port open for async response
  }
);
