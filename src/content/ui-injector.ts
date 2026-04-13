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
}

type MetricKind = 'ai' | 'bs' | 'juice';

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

function buildCard(score: PostScore, hash: string): HTMLElement {
  const card = document.createElement('div');
  card.className = 'lja-card';
  card.dataset.ljaHash = hash;

  card.innerHTML = `
    <span class="lja-metric">
      <span class="lja-label">AI</span>
      <span class="lja-score ${levelClass(score.ai, 'ai')}">${score.ai}</span>
    </span>
    <span class="lja-sep">·</span>
    <span class="lja-metric">
      <span class="lja-label">BS</span>
      <span class="lja-score ${levelClass(score.bullshit, 'bs')}">${score.bullshit}</span>
    </span>
    <span class="lja-sep">·</span>
    <span class="lja-metric">
      <span class="lja-label">Juice</span>
      <span class="lja-score ${levelClass(score.juice, 'juice')}">${score.juice}</span>
    </span>
    <span class="lja-summary">${score.summary}</span>
  `.trim();

  return card;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Injects the score card into a post, positioned right after the post text.
 * Returns false if the card is already present (idempotent by hash).
 */
export function injectScoreCard(
  container: HTMLElement,
  score: PostScore,
  hash: string,
  textElement?: HTMLElement
): boolean {
  injectStyles();

  if (container.querySelector(`[data-lja-hash="${hash}"]`)) return false;

  const card = buildCard(score, hash);

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
