// Shared API key management — single source of truth
// Settings page saves here, all AI pages read from here

const STORAGE_KEY = 'api_keys';
const PROVIDER_KEY = 'default_provider';
const MODEL_KEY = 'default_model';

export interface SavedAISettings {
  apiKeys: Record<string, string>;
  defaultProvider: string;
  defaultModel: string;
}

/** Read all saved API keys from localStorage */
export function getApiKeys(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Get API key for a specific provider */
export function getApiKey(providerId: string): string {
  const keys = getApiKeys();
  // Map between settings page IDs and ai-providers IDs
  const aliasMap: Record<string, string[]> = {
    openRouter: ['openrouter', 'openRouter'],
    openrouter: ['openRouter', 'openrouter'],
    google: ['googleAI', 'google', 'google_gemini'],
    googleAI: ['google', 'googleAI', 'google_gemini'],
    google_gemini: ['google', 'googleAI', 'google_gemini'],
    anthropic: ['anthropic', 'anthropic_claude'],
    anthropic_claude: ['anthropic', 'anthropic_claude'],
    xai: ['xai', 'xai_grok'],
    xai_grok: ['xai', 'xai_grok'],
    massive: ['massive'],
  };
  if (keys[providerId]) return keys[providerId];
  const aliases = aliasMap[providerId];
  if (aliases) {
    for (const alias of aliases) {
      if (keys[alias]) return keys[alias];
    }
  }
  return '';
}

/** Save all API keys */
export function saveApiKeys(keys: Record<string, string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

/** Get default provider */
export function getDefaultProvider(): string {
  if (typeof window === 'undefined') return 'zai';
  return localStorage.getItem(PROVIDER_KEY) || 'zai';
}

/** Get default model */
export function getDefaultModel(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(MODEL_KEY) || '';
}

/** Save default provider and model */
export function saveDefaults(provider: string, model: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROVIDER_KEY, provider);
  localStorage.setItem(MODEL_KEY, model);
}

/** Get all saved settings */
export function getAISettings(): SavedAISettings {
  return {
    apiKeys: getApiKeys(),
    defaultProvider: getDefaultProvider(),
    defaultModel: getDefaultModel(),
  };
}

/** Get list of configured provider IDs (ones that have a key + free providers) */
export function getConfiguredProviders(): string[] {
  const keys = getApiKeys();
  const configured = Object.entries(keys)
    .filter(([, v]) => v?.trim())
    .map(([k]) => k);
  // Always include free providers (Z.AI)
  if (!configured.includes('zai')) configured.unshift('zai');
  return configured;
}

/**
 * Resolve the best provider and key to use.
 * If the selected provider has a valid key, use it.
 * If it's 'zai' or has no key, find the first provider with a valid key.
 * Returns { provider, apiKey, model } ready to send to /api/ai.
 */
export function resolveProvider(selectedProvider?: string): { provider: string; apiKey: string; model: string } {
  const settings = getAISettings();
  const provider = selectedProvider || settings.defaultProvider || 'zai';
  const keys = settings.apiKeys;

  // If provider has a valid key, use it
  const key = keys[provider] || '';
  if (key && !key.includes('dummy') && key.trim().length >= 10) {
    return { provider, apiKey: key, model: settings.defaultModel || '' };
  }

  // Provider has no key — find first provider with a valid key
  // Priority: zai → groq (free) → openrouter → openai → deepseek → anthropic → google → xai → mistral → cohere
  const priority = ['zai', 'groq', 'openrouter', 'openai', 'deepseek', 'anthropic', 'anthropic_claude', 'google', 'google_gemini', 'xai', 'xai_grok', 'mistral', 'cohere'];
  for (const id of priority) {
    const k = keys[id] || getApiKey(id) || '';
    if (k && !k.includes('dummy') && k.trim().length >= 10) {
      const mappedId = id === 'anthropic_claude' ? 'anthropic'
        : id === 'google_gemini' ? 'google'
        : id === 'xai_grok' ? 'xai'
        : id;
      return { provider: mappedId, apiKey: k, model: '' };
    }
  }

  // No keys found at all — send as 'zai' and let server try its own fallbacks
  return { provider: 'zai', apiKey: '', model: 'default' };
}
