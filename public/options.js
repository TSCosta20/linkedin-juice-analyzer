const providerEl = document.getElementById('provider');
const apiKeyEl   = document.getElementById('apiKey');
const saveBtn    = document.getElementById('saveBtn');
const clearBtn   = document.getElementById('clearBtn');
const statusEl   = document.getElementById('status');

function showStatus(msg, ok) {
  statusEl.textContent = msg;
  statusEl.style.color = ok ? '#22c55e' : '#ef4444';
  setTimeout(() => { statusEl.textContent = ''; }, 3000);
}

// Load existing settings on open
chrome.storage.sync.get(['lja_provider', 'lja_apiKey'], (result) => {
  if (result.lja_apiKey) {
    providerEl.value = result.lja_provider || 'openai';
    apiKeyEl.value   = result.lja_apiKey;
  }
});

saveBtn.addEventListener('click', () => {
  const key = apiKeyEl.value.trim();
  if (!key) { showStatus('Enter an API key first.', false); return; }
  chrome.storage.sync.set({ lja_provider: providerEl.value, lja_apiKey: key }, () => {
    showStatus('Saved! Reload LinkedIn to activate.', true);
  });
});

clearBtn.addEventListener('click', () => {
  chrome.storage.sync.remove(['lja_provider', 'lja_apiKey'], () => {
    apiKeyEl.value = '';
    showStatus('Key removed. Using local scoring only.', true);
  });
});
