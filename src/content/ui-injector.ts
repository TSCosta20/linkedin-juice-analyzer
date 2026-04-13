import type { PostScore } from '../types';

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
  max-width: 260px;
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
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

  const tip = document.createElement('div');
  tip.className = 'lja-tooltip';
  tip.innerHTML = `
    <div class="lja-tooltip-title">${info.title}</div>
    <div class="lja-tooltip-level">${levelLabel}</div>
    <div class="lja-tooltip-body">${levelText}</div>
  `.trim();

  document.body.appendChild(tip);
  activeTooltip = tip;

  // Position below the anchor, clamped to viewport
  const rect = anchor.getBoundingClientRect();
  const tipWidth = 260;
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
    <span class="lja-summary">${score.summary}</span>
  `.trim();

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

  // Global dedup: if a card with this hash exists anywhere in the document,
  // don't inject another (handles same promoted post in multiple containers).
  // If the card was removed by a DOM re-render it won't be found here, so
  // re-injection after scroll still works correctly.
  if (document.querySelector(`[data-lja-hash="${hash}"]`)) return false;

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
