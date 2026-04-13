export type Provider = 'openai' | 'anthropic' | 'deepseek';

export interface LLMSettings {
  provider: Provider;
  apiKey: string;
}

export function getSettings(): Promise<LLMSettings | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['lja_provider', 'lja_apiKey'], (result) => {
      if (!result.lja_apiKey) {
        resolve(null);
      } else {
        resolve({
          provider: (result.lja_provider as Provider) || 'openai',
          apiKey: result.lja_apiKey as string,
        });
      }
    });
  });
}

export function saveSettings(settings: LLMSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set(
      { lja_provider: settings.provider, lja_apiKey: settings.apiKey },
      resolve
    );
  });
}

export function clearSettings(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(['lja_provider', 'lja_apiKey'], resolve);
  });
}
