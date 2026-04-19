// Inline storage helpers — keeps options.js self-contained (no chunk imports)
type Provider = 'openai' | 'anthropic' | 'deepseek';

function loadSettings(): Promise<{ provider: Provider; apiKey: string } | null> {
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

function persistSettings(provider: Provider, apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ lja_provider: provider, lja_apiKey: apiKey }, resolve);
  });
}

function removeSettings(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(['lja_provider', 'lja_apiKey'], resolve);
  });
}

// ─── UI ──────────────────────────────────────────────────────────────────────

const providerSelect       = document.getElementById('provider')       as HTMLSelectElement;
const apiKeyInput          = document.getElementById('apiKey')         as HTMLInputElement;
const saveBtn              = document.getElementById('saveBtn')        as HTMLButtonElement;
const clearBtn             = document.getElementById('clearBtn')       as HTMLButtonElement;
const status               = document.getElementById('status')         as HTMLElement;
const filterPromotedToggle = document.getElementById('filterPromoted') as HTMLInputElement;
const userRoleInput        = document.getElementById('userRole')       as HTMLInputElement;
const userGoalsInput       = document.getElementById('userGoals')      as HTMLInputElement;
const saveProfileBtn       = document.getElementById('saveProfileBtn') as HTMLButtonElement;
const profileStatus        = document.getElementById('profileStatus')  as HTMLElement;

function showStatus(msg: string, ok: boolean): void {
  status.textContent = msg;
  status.style.color = ok ? '#22c55e' : '#ef4444';
  setTimeout(() => { status.textContent = ''; }, 3000);
}

// Load profile
chrome.storage.sync.get(['lja_role', 'lja_goals'], (result) => {
  if (result.lja_role)  userRoleInput.value  = result.lja_role as string;
  if (result.lja_goals) userGoalsInput.value = result.lja_goals as string;
});

saveProfileBtn.addEventListener('click', () => {
  const role  = userRoleInput.value.trim();
  const goals = userGoalsInput.value.trim();
  chrome.storage.sync.set({ lja_role: role, lja_goals: goals }, () => {
    profileStatus.textContent = 'Profile saved!';
    profileStatus.style.color = '#22c55e';
    setTimeout(() => { profileStatus.textContent = ''; }, 3000);
  });
});

// Load all settings on open
loadSettings().then((s) => {
  if (s) {
    providerSelect.value = s.provider;
    apiKeyInput.value    = s.apiKey;
  }
});

chrome.storage.sync.get('lja_filterPromoted', (result) => {
  filterPromotedToggle.checked = result.lja_filterPromoted !== false; // default ON
});

filterPromotedToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ lja_filterPromoted: filterPromotedToggle.checked });
});

saveBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) { showStatus('Enter an API key first.', false); return; }
  await persistSettings(providerSelect.value as Provider, key);
  showStatus('Saved! Reload LinkedIn to activate.', true);
});

clearBtn.addEventListener('click', async () => {
  await removeSettings();
  apiKeyInput.value = '';
  showStatus('Key removed. Using local scoring only.', true);
});
