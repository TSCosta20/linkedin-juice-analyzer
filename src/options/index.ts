import { getSettings, saveSettings, clearSettings } from './settings';
import type { Provider } from './settings';

const providerSelect = document.getElementById('provider') as HTMLSelectElement;
const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const status = document.getElementById('status') as HTMLElement;

function showStatus(msg: string, ok: boolean): void {
  status.textContent = msg;
  status.style.color = ok ? '#22c55e' : '#ef4444';
  setTimeout(() => { status.textContent = ''; }, 3000);
}

// Load existing settings on open
getSettings().then((s) => {
  if (s) {
    providerSelect.value = s.provider;
    apiKeyInput.value = s.apiKey;
  }
});

saveBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showStatus('Enter an API key first.', false);
    return;
  }
  await saveSettings({ provider: providerSelect.value as Provider, apiKey: key });
  showStatus('Saved! Reload LinkedIn to activate.', true);
});

clearBtn.addEventListener('click', async () => {
  await clearSettings();
  apiKeyInput.value = '';
  showStatus('Key removed. Using local scoring only.', true);
});
