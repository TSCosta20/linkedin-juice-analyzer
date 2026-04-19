import type { PostScore, ActionSuggestion } from '../types';

// ─── Styles ──────────────────────────────────────────────────────────────────

const STYLES = `
.lja-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px 10px;
  padding: 6px 14px 6px 16px;
  margin: 6px 0 2px;
  border-top: 1px solid rgba(0,0,0,0.07);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11.5px;
  line-height: 1.4;
  color: #555;
  background: transparent;
  user-select: none;
  box-sizing: border-box;
}

.lja-metric {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.lja-label {
  font-weight: 600;
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #999;
}

.lja-score {
  display: inline-block;
  min-width: 26px;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 11px;
  text-align: center;
  letter-spacing: -0.02em;
}

/* AI score: high = bad (red), low = good (green) */
.lja-ai-low  { background: #dcf5e4; color: #1a6630; }
.lja-ai-mid  { background: #fff4cd; color: #7a5500; }
.lja-ai-high { background: #fde8e8; color: #9b1c1c; }

/* BS score: high = bad (red), low = good (green) */
.lja-bs-low  { background: #dcf5e4; color: #1a6630; }
.lja-bs-mid  { background: #fff4cd; color: #7a5500; }
.lja-bs-high { background: #fde8e8; color: #9b1c1c; }

/* Juice score: high = good (green), low = bad (red) — inverted */
.lja-juice-low  { background: #fde8e8; color: #9b1c1c; }
.lja-juice-mid  { background: #fff4cd; color: #7a5500; }
.lja-juice-high { background: #dcf5e4; color: #1a6630; }

.lja-sep {
  color: #ddd;
  font-size: 12px;
  font-weight: 300;
}

.lja-summary {
  width: 100%;
  color: #888;
  font-size: 10.5px;
  font-style: italic;
  margin-top: 0;
}

.lja-rate-msg {
  width: 100%;
  font-size: 10.5px;
  color: #92400e;
  margin-top: 0;
}

.lja-rate-msg a {
  color: #b45309;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 600;
}

.lja-score {
  cursor: pointer;
}

.lja-mode {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  vertical-align: middle;
}

.lja-mode-local {
  background: #f1f5f9;
  color: #94a3b8;
}

.lja-mode-llm {
  background: #ede9fe;
  color: #5b21b6;
}

.lja-mode-limit {
  background: #fff3e0;
  color: #b45309;
}

.lja-mode-loading {
  background: #f1f5f9;
  color: #94a3b8;
  position: relative;
  overflow: hidden;
}

.lja-mode-loading::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(99,102,241,0.25), transparent);
  animation: lja-shimmer 1.2s infinite;
}

@keyframes lja-shimmer {
  to { left: 100%; }
}

.lja-tooltip {
  position: fixed;
  z-index: 99999;
  max-width: 340px;
  max-height: 420px;
  overflow-y: auto;
  background: #1a1a1a;
  color: #f0f0f0;
  border-radius: 8px;
  padding: 10px 13px;
  font-size: 12px;
  line-height: 1.55;
  box-shadow: 0 4px 20px rgba(0,0,0,0.35);
  pointer-events: none;
}

.lja-tooltip-title {
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 5px;
  color: #ccc;
}

.lja-tooltip-level {
  font-weight: 600;
  margin-bottom: 4px;
}

.lja-tooltip-body {
  color: #bbb;
  font-size: 11.5px;
}

.lja-tooltip-reasons {
  margin-top: 7px;
  padding-top: 7px;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.lja-tooltip-reason {
  font-size: 11px;
  color: #d0d0d0;
  line-height: 1.4;
}

.lja-tooltip-reason::before {
  content: '→ ';
  color: #666;
}

.lja-brand {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  opacity: 0.55;
  text-decoration: none;
  transition: opacity 0.15s;
}

.lja-brand:hover {
  opacity: 1;
}

.lja-brand-label {
  font-size: 8.5px;
  font-weight: 400;
  color: #aaa;
  letter-spacing: 0.02em;
  text-transform: lowercase;
}

.lja-brand-badge {
  display: inline-block;
  background: #0d3d4f;
  color: #fff;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 1px 4px;
  border-radius: 3px;
  line-height: 1.5;
}

/* ─── Filter bar ─────────────────────────────────────────────────────────── */

.lja-filter-bar {
  position: fixed;
  top: 58px;
  left: 50%;
  transform: translateX(-50%);
  width: 554px;
  max-width: calc(100vw - 32px);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  color: #444;
  user-select: none;
  box-sizing: border-box;
}

.lja-filter-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #999;
  margin-right: 2px;
}

.lja-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 20px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  font-size: 11px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  line-height: 1.4;
}

.lja-filter-chip:hover {
  border-color: #0d3d4f;
  color: #0d3d4f;
}

.lja-filter-chip.active {
  background: #0d3d4f;
  border-color: #0d3d4f;
  color: #fff;
}

.lja-filter-chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
}

.lja-filter-spacer { flex: 1; }

/* ─── Action button & suggestion panel ──────────────────────────────────── */

.lja-act-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 7px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #555;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  line-height: 1.6;
}

.lja-act-btn:hover {
  background: #0d3d4f;
  border-color: #0d3d4f;
  color: #fff;
}

.lja-act-btn.loading {
  opacity: 0.6;
  pointer-events: none;
}

.lja-suggestion {
  position: fixed;
  z-index: 99999;
  width: 320px;
  background: #1a1a1a;
  color: #f0f0f0;
  border-radius: 10px;
  padding: 13px 15px;
  font-size: 12px;
  line-height: 1.55;
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  box-sizing: border-box;
}

.lja-suggestion-action {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.lja-suggestion-action.dm      { background: #7c3aed; color: #fff; }
.lja-suggestion-action.like    { background: #0284c7; color: #fff; }
.lja-suggestion-action.comment { background: #059669; color: #fff; }
.lja-suggestion-action.skip    { background: #6b7280; color: #fff; }

.lja-suggestion-reason {
  font-size: 11.5px;
  color: #ccc;
  margin-bottom: 8px;
}

.lja-suggestion-text {
  background: rgba(255,255,255,0.07);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 11.5px;
  color: #e8e8e8;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 8px;
}

.lja-suggestion-copy {
  display: block;
  width: 100%;
  padding: 5px;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.15);
  background: transparent;
  color: #aaa;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  text-align: center;
}

.lja-suggestion-copy:hover { background: rgba(255,255,255,0.1); color: #fff; }

.lja-suggestion-warn {
  font-size: 11px;
  color: #f59e0b;
  line-height: 1.5;
}

.lja-suggestion-warn a {
  color: #fbbf24;
  text-decoration: underline;
  cursor: pointer;
}
`;


// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let stylesInjected = false;

function injectStyles(): void {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.id = 'lja-styles';
  style.textContent = STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
  if (!tooltipListenersAttached) {
    setupTooltipListeners();
    tooltipListenersAttached = true;
  }
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

type MetricKind = 'ai' | 'bs' | 'juice';

const METRIC_INFO: Record<MetricKind, { title: string; levels: [string, string, string] }> = {
  ai: {
    title: 'AI Score — how AI-written this feels',
    levels: [
      'Low (0–29): Feels human. Varied sentence rhythm, specific details, no template structure.',
      'Medium (30–59): Mixed signals. Some polished phrasing or structural patterns typical of AI.',
      'High (60–100): Strong AI indicators — consultant-style tricolons, "grounded in data" language, smooth transitions, hook phrases, or engagement bait.',
    ],
  },
  bs: {
    title: 'BS Score — buzzword & fluff density',
    levels: [
      'Low (0–29): Concrete language. Little to no filler, buzzwords, or vague inspiration.',
      'Medium (30–59): Some buzzwords or corporate filler, but still grounded.',
      'High (60–100): Heavy use of buzzwords ("leverage", "impactful", "synergy"), vague intensifiers, or inspirational padding with no substance.',
    ],
  },
  juice: {
    title: 'Juice Score — informational payload',
    levels: [
      'Low (0–29): Little substance. No data, no evidence, high filler ratio.',
      'Medium (30–59): Some useful content — a few numbers, named concepts, or evidence markers.',
      'High (60–100): Information-dense. Numbers, percentages, technical terms, before/after comparisons, or named entities.',
    ],
  },
};

let activeTooltip: HTMLElement | null = null;

function getLevelIndex(score: number, metric: MetricKind): 0 | 1 | 2 {
  if (metric === 'juice') {
    if (score >= 60) return 2;
    if (score >= 30) return 1;
    return 0;
  }
  if (score >= 60) return 2;
  if (score >= 30) return 1;
  return 0;
}

function getLevelLabel(score: number, metric: MetricKind): string {
  if (metric === 'juice') {
    if (score >= 60) return 'High — information-dense';
    if (score >= 30) return 'Medium — some useful content';
    return 'Low — little substance';
  }
  if (score >= 60) return metric === 'ai' ? 'High — strong AI indicators' : 'High — heavy fluff';
  if (score >= 30) return 'Medium — mixed signals';
  return metric === 'ai' ? 'Low — feels human' : 'Low — clean language';
}

function showTooltip(anchor: HTMLElement, metric: MetricKind, score: number): void {
  removeTooltip();

  const info = METRIC_INFO[metric];
  const levelIdx = getLevelIndex(score, metric);
  const levelLabel = getLevelLabel(score, metric);
  const levelText = info.levels[levelIdx];

  // Parse stored reasons from the badge data attribute
  let reasonsHTML = '';
  try {
    const raw = anchor.dataset.ljaReasons;
    if (raw) {
      const reasons: string[] = JSON.parse(raw);
      if (reasons.length > 0) {
        const items = reasons
          .map((r) => `<div class="lja-tooltip-reason">${escapeHtml(r)}</div>`)
          .join('');
        reasonsHTML = `<div class="lja-tooltip-reasons">${items}</div>`;
      }
    }
  } catch { /* ignore parse errors */ }

  const tip = document.createElement('div');
  tip.className = 'lja-tooltip';
  tip.innerHTML = `
    <div class="lja-tooltip-title">${info.title}</div>
    <div class="lja-tooltip-level">${levelLabel}</div>
    <div class="lja-tooltip-body">${levelText}</div>
    ${reasonsHTML}
  `.trim();

  document.body.appendChild(tip);
  activeTooltip = tip;

  // Position below the anchor, clamped to viewport
  const rect = anchor.getBoundingClientRect();
  const tipWidth = 340;
  let left = rect.left;
  let top = rect.bottom + 6;

  if (left + tipWidth > window.innerWidth - 10) {
    left = window.innerWidth - tipWidth - 10;
  }
  if (top + 120 > window.innerHeight) {
    top = rect.top - 120 - 6;
  }

  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function removeTooltip(): void {
  activeTooltip?.remove();
  activeTooltip = null;
}

function setupTooltipListeners(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    // If click is on a score badge — show tooltip
    if (target.classList.contains('lja-score')) {
      const card = target.closest<HTMLElement>('.lja-card');
      if (!card) return;
      const metric = target.dataset.ljaMetric as MetricKind | undefined;
      const score = parseInt(target.dataset.ljaScore ?? '0', 10);
      if (!metric) return;
      // Toggle: if same badge already open, close it
      if (activeTooltip && target.dataset.ljaOpen === '1') {
        removeTooltip();
        target.dataset.ljaOpen = '0';
        return;
      }
      // Close any previously open badge
      document.querySelectorAll<HTMLElement>('[data-lja-open="1"]').forEach((el) => {
        el.dataset.ljaOpen = '0';
      });
      target.dataset.ljaOpen = '1';
      showTooltip(target, metric, score);
      e.stopPropagation();
      return;
    }
    // Click anywhere else — close tooltip
    removeTooltip();
    document.querySelectorAll<HTMLElement>('[data-lja-open="1"]').forEach((el) => {
      el.dataset.ljaOpen = '0';
    });
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      removeTooltip();
      document.querySelectorAll<HTMLElement>('[data-lja-open="1"]').forEach((el) => {
        el.dataset.ljaOpen = '0';
      });
    }
  });
}

let tooltipListenersAttached = false;

function levelClass(score: number, metric: MetricKind): string {
  if (metric === 'juice') {
    if (score >= 60) return 'lja-juice-high';
    if (score >= 30) return 'lja-juice-mid';
    return 'lja-juice-low';
  }
  if (score >= 60) return `lja-${metric}-high`;
  if (score >= 30) return `lja-${metric}-mid`;
  return `lja-${metric}-low`;
}

function buildCard(score: PostScore, hash: string, isLLM = false): HTMLElement {
  const card = document.createElement('div');
  card.className = 'lja-card';
  card.dataset.ljaHash = hash;

  const modeLabel = isLLM
    ? '<span class="lja-mode lja-mode-llm" title="Scored by AI model">LLM</span>'
    : '<span class="lja-mode lja-mode-local" title="Scored by local rules (add API key in extension options)">LOCAL</span>';

  card.innerHTML = `
    <span class="lja-metric">
      <span class="lja-label">AI</span>
      <span class="lja-score ${levelClass(score.ai, 'ai')}" data-lja-metric="ai" data-lja-score="${score.ai}" title="Click for details">${score.ai}</span>
    </span>
    <span class="lja-sep">·</span>
    <span class="lja-metric">
      <span class="lja-label">BS</span>
      <span class="lja-score ${levelClass(score.bullshit, 'bs')}" data-lja-metric="bs" data-lja-score="${score.bullshit}" title="Click for details">${score.bullshit}</span>
    </span>
    <span class="lja-sep">·</span>
    <span class="lja-metric">
      <span class="lja-label">Juice</span>
      <span class="lja-score ${levelClass(score.juice, 'juice')}" data-lja-metric="juice" data-lja-score="${score.juice}" title="Click for details">${score.juice}</span>
    </span>
    ${modeLabel}
    <a class="lja-brand" href="https://waldyn.eu" target="_blank" rel="noopener noreferrer" title="Powered by Waldyn">
      <span class="lja-brand-label">by</span>
      <span class="lja-brand-badge">Waldyn</span>
    </a>
    <span class="lja-summary">${score.summary}</span>
  `.trim();

  // Attach explanation data to each badge so tooltips can display it
  if (score.aiReasons) {
    const aiBadge = card.querySelector<HTMLElement>('[data-lja-metric="ai"]');
    if (aiBadge) aiBadge.dataset.ljaReasons = JSON.stringify(score.aiReasons);
  }
  if (score.bsReasons) {
    const bsBadge = card.querySelector<HTMLElement>('[data-lja-metric="bs"]');
    if (bsBadge) bsBadge.dataset.ljaReasons = JSON.stringify(score.bsReasons);
  }
  if (score.juiceBreakdown) {
    const juiceBadge = card.querySelector<HTMLElement>('[data-lja-metric="juice"]');
    if (juiceBadge) juiceBadge.dataset.ljaReasons = JSON.stringify(score.juiceBreakdown);
  }

  return card;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Injects the score card into a post, positioned right after the post text.
 * Returns false if the card is already present (idempotent by hash).
 * Pass llmScore to render LLM scores directly (e.g. on re-injection after scroll).
 */
export function injectScoreCard(
  container: HTMLElement,
  score: PostScore,
  hash: string,
  textElement?: HTMLElement,
  llmScore?: PostScore
): boolean {
  injectStyles();

  // Global dedup: if a card with this exact hash exists anywhere, skip.
  if (document.querySelector(`[data-lja-hash="${hash}"]`)) return false;

  // If the container already has a card with a DIFFERENT hash (e.g. the user
  // clicked "see more" and the text expanded → new hash), remove the stale card
  // so we don't end up with two cards in the same post.
  const staleCard = container.querySelector<HTMLElement>('.lja-card');
  if (staleCard) staleCard.remove();

  const displayScore = llmScore ?? score;
  const card = buildCard(displayScore, hash, !!llmScore);

  // Best injection point: right after the paragraph containing the text box.
  // Falls back to appending to the container.
  const textParagraph = textElement?.closest('p') ?? textElement?.parentElement ?? null;

  if (textParagraph) {
    textParagraph.insertAdjacentElement('afterend', card);
  } else {
    container.appendChild(card);
  }

  return true;
}

/**
 * Sets/clears the loading shimmer on a card's mode badge.
 * Called immediately when an LLM request starts, reverted if it fails.
 */
export function setCardLoading(hash: string, loading: boolean): void {
  const card = document.querySelector<HTMLElement>(`[data-lja-hash="${hash}"]`);
  if (!card) return;
  const badge = card.querySelector<HTMLElement>('.lja-mode');
  if (!badge) return;
  if (loading) {
    badge.className = 'lja-mode lja-mode-loading';
    badge.textContent = 'LLM';
    badge.title = 'Evaluating with AI model…';
  } else {
    badge.className = 'lja-mode lja-mode-local';
    badge.textContent = 'LOCAL';
    badge.title = 'Scored by local rules (add API key in extension options)';
  }
}

/**
 * Updates an already-injected card with LLM scores in place.
 * Never overwrites a card that is already LLM-scored.
 * Finds the card by hash across the entire document.
 */
export function updateCardWithLLM(hash: string, llmScore: PostScore): void {
  const card = document.querySelector<HTMLElement>(`[data-lja-hash="${hash}"]`);
  if (!card) return;

  // Never overwrite an already LLM-scored card
  if (card.querySelector('.lja-mode-llm')) return;

  // Update each score badge
  const badges: Array<{ metric: MetricKind; value: number }> = [
    { metric: 'ai',    value: llmScore.ai },
    { metric: 'bs',    value: llmScore.bullshit },
    { metric: 'juice', value: llmScore.juice },
  ];

  for (const { metric, value } of badges) {
    const badge = card.querySelector<HTMLElement>(`[data-lja-metric="${metric}"]`);
    if (!badge) continue;
    badge.textContent = String(value);
    badge.className = `lja-score ${levelClass(value, metric)}`;
    badge.dataset.ljaScore = String(value);
  }

  // Update summary
  const summary = card.querySelector('.lja-summary');
  if (summary) summary.textContent = llmScore.summary;

  // Switch mode badge from LOCAL → LLM
  const modeBadge = card.querySelector<HTMLElement>('.lja-mode');
  if (modeBadge) {
    modeBadge.textContent = 'LLM';
    modeBadge.className = 'lja-mode lja-mode-llm';
    modeBadge.title = 'Scored by AI model';
  }
}

// ─── Action suggestion panel ──────────────────────────────────────────────────

let activeSuggestion: HTMLElement | null = null;

function removeSuggestion(): void {
  activeSuggestion?.remove();
  activeSuggestion = null;
}

export function showSuggestionLoading(hash: string): void {
  const btn = document.querySelector<HTMLElement>(`[data-lja-act="${hash}"]`);
  if (btn) { btn.textContent = '…'; btn.classList.add('loading'); }
}

export function showSuggestionError(hash: string, message: string, onSettingsClick?: () => void): void {
  const btn = document.querySelector<HTMLElement>(`[data-lja-act="${hash}"]`);
  if (btn) { btn.textContent = '✦ Act'; btn.classList.remove('loading'); }

  removeSuggestion();
  const panel = document.createElement('div');
  panel.className = 'lja-suggestion';
  panel.innerHTML = `<div class="lja-suggestion-warn">${escapeHtml(message)}${
    onSettingsClick ? ' <a class="lja-suggestion-settings-link">Open settings →</a>' : ''
  }</div>`;

  if (onSettingsClick) {
    panel.querySelector('.lja-suggestion-settings-link')?.addEventListener('click', (e) => {
      e.stopPropagation();
      onSettingsClick();
      removeSuggestion();
    });
  }

  positionPanel(panel, hash);
}

export function showSuggestionResult(hash: string, suggestion: ActionSuggestion): void {
  const btn = document.querySelector<HTMLElement>(`[data-lja-act="${hash}"]`);
  if (btn) { btn.textContent = '✦ Act'; btn.classList.remove('loading'); }

  removeSuggestion();
  const panel = document.createElement('div');
  panel.className = 'lja-suggestion';

  const hasText = suggestion.text?.trim().length > 0;
  panel.innerHTML = `
    <span class="lja-suggestion-action ${suggestion.action}">${suggestion.action.toUpperCase()}</span>
    <div class="lja-suggestion-reason">${escapeHtml(suggestion.reason)}</div>
    ${hasText ? `
      <div class="lja-suggestion-text">${escapeHtml(suggestion.text)}</div>
      <button class="lja-suggestion-copy">Copy text</button>
    ` : ''}
  `.trim();

  if (hasText) {
    panel.querySelector('.lja-suggestion-copy')?.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(suggestion.text).then(() => {
        const btn = panel.querySelector<HTMLElement>('.lja-suggestion-copy');
        if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy text'; }, 1500); }
      });
    });
  }

  positionPanel(panel, hash);
}

function positionPanel(panel: HTMLElement, hash: string): void {
  document.body.appendChild(panel);
  activeSuggestion = panel;

  const btn = document.querySelector<HTMLElement>(`[data-lja-act="${hash}"]`);
  if (!btn) return;

  const rect = btn.getBoundingClientRect();
  let left = rect.left;
  let top = rect.bottom + 6;

  if (left + 320 > window.innerWidth - 10) left = window.innerWidth - 320 - 10;
  if (top + 200 > window.innerHeight) top = rect.top - 200 - 6;

  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;

  // Close on outside click
  const close = (e: MouseEvent) => {
    if (!panel.contains(e.target as Node)) {
      removeSuggestion();
      document.removeEventListener('click', close, true);
    }
  };
  setTimeout(() => document.addEventListener('click', close, true), 0);
}

/**
 * Injects a sticky filter bar at the top of the LinkedIn feed.
 * Returns a cleanup function that removes the bar.
 * @param initialFilterPromoted - whether the "hide promoted" filter starts active
 * @param onChange - called with the new value whenever the user toggles a filter
 */
export function injectFilterBar(
  initialFilterPromoted: boolean,
  onChange: (filterPromoted: boolean) => void
): () => void {
  injectStyles();

  // Remove any existing bar first
  document.getElementById('lja-filter-bar')?.remove();

  const bar = document.createElement('div');
  bar.className = 'lja-filter-bar';
  bar.id = 'lja-filter-bar';

  let filterPromoted = initialFilterPromoted;

  const promotedChip = document.createElement('button');
  promotedChip.className = `lja-filter-chip${filterPromoted ? ' active' : ''}`;
  promotedChip.innerHTML = '<span class="lja-filter-chip-dot"></span> Hide promoted';
  promotedChip.title = 'Toggle visibility of sponsored/promoted posts';
  promotedChip.addEventListener('click', () => {
    filterPromoted = !filterPromoted;
    promotedChip.className = `lja-filter-chip${filterPromoted ? ' active' : ''}`;
    chrome.storage.sync.set({ lja_filterPromoted: filterPromoted });
    onChange(filterPromoted);
  });

  const filterLabel = document.createElement('span');
  filterLabel.className = 'lja-filter-label';
  filterLabel.textContent = 'Filters';

  const spacer = document.createElement('span');
  spacer.className = 'lja-filter-spacer';

  const brand = document.createElement('a');
  brand.className = 'lja-brand';
  brand.href = 'https://waldyn.eu';
  brand.target = '_blank';
  brand.rel = 'noopener noreferrer';
  brand.title = 'Powered by Waldyn';
  brand.innerHTML = '<span class="lja-brand-label">by</span><span class="lja-brand-badge">Waldyn</span>';

  bar.appendChild(filterLabel);
  bar.appendChild(promotedChip);
  bar.appendChild(spacer);
  bar.appendChild(brand);

  // Attach to body so LinkedIn's feed re-renders can't remove it
  document.body.appendChild(bar);

  return () => bar.remove();
}

/**
 * Shows the rate-limit prompt on a card.
 * Replaces the summary line with a message directing the user to add their own key.
 */
export function setCardRateLimited(hash: string): void {
  const card = document.querySelector<HTMLElement>(`[data-lja-hash="${hash}"]`);
  if (!card) return;

  // Update mode badge
  const modeBadge = card.querySelector<HTMLElement>('.lja-mode');
  if (modeBadge) {
    modeBadge.className = 'lja-mode lja-mode-limit';
    modeBadge.textContent = 'LIMIT';
    modeBadge.title = 'Daily free AI limit reached';
  }

  // Replace summary with the prompt message
  const summary = card.querySelector('.lja-summary');
  if (summary) {
    summary.remove();
    const msg = document.createElement('span');
    msg.className = 'lja-rate-msg';
    msg.innerHTML =
      'Daily free AI limit reached. ' +
      '<a class="lja-add-key">Add your own API key</a> for unlimited scoring, ' +
      'or keep using local rules.';
    card.appendChild(msg);

    // Open options page when user clicks the link
    msg.querySelector('.lja-add-key')?.addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ type: 'LJA_OPEN_OPTIONS' });
    });
  }
}
