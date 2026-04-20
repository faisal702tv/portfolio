/**
 * Server-side AI key resolver.
 * Reads encrypted keys from DB, falls back to request-provided key.
 */

import { db } from '@/lib/db';
import { decrypt } from '@/lib/security/encryption';

function extractDbValue(setting: { value: unknown }): string | null {
  const raw = typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value);
  try {
    const decrypted = decrypt(raw);
    if (decrypted && decrypted.trim().length >= 5) return decrypted;
  } catch {
    if (raw && raw.trim().length >= 5) return raw;
  }
  return null;
}

// Provider ID mapping (frontend IDs → DB storage keys without 'api_key_' prefix)
// DB stores keys as: api_key_anthropic_claude, api_key_google_gemini, api_key_xai_grok
const PROVIDER_KEY_MAP: Record<string, string> = {
  openai: 'openai',
  anthropic: 'anthropic_claude',
  anthropic_claude: 'anthropic_claude',
  google: 'google_gemini',
  googleAI: 'google_gemini',
  google_gemini: 'google_gemini',
  deepseek: 'deepseek',
  groq: 'groq',
  xai: 'xai_grok',
  xai_grok: 'xai_grok',
  cohere: 'cohere',
  mistral: 'mistral',
  openrouter: 'openrouter',
  openRouter: 'openrouter',
  zai: 'zai',
};

/**
 * Get API key for a provider.
 * Priority: DB (encrypted) > request body > env variable
 */
export async function getProviderApiKey(
  providerId: string,
  requestApiKey?: string,
  userId?: string
): Promise<string | null> {
  // 1. Check DB first (encrypted) — try multiple key variants
  try {
    const storageKey = PROVIDER_KEY_MAP[providerId] || providerId;
    const candidates = [...new Set([storageKey, providerId])];

    for (const candidate of candidates) {
      if (userId) {
        const scoped = await db.setting.findUnique({
          where: { key: `user:${userId}:api_key_${candidate}` },
        });
        if (scoped) {
          const val = extractDbValue(scoped);
          if (val) return val;
        }
      }

      // Try without user prefix, then with any user prefix
      const exact = await db.setting.findUnique({
        where: { key: `api_key_${candidate}` },
      });
      if (exact) {
        const val = extractDbValue(exact);
        if (val) return val;
      }

      // Try with user: prefix (legacy format)
      const prefixed = await db.setting.findFirst({
        where: { key: { endsWith: `:api_key_${candidate}` } },
      });
      if (prefixed) {
        const val = extractDbValue(prefixed);
        if (val) return val;
      }
    }
  } catch {
    // DB error, continue to fallbacks
  }

  // 2. Request-provided key
  if (requestApiKey?.trim()) {
    return requestApiKey.trim();
  }

  // 3. Environment variable
  const envMap: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    anthropic_claude: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_AI_API_KEY',
    googleAI: 'GOOGLE_AI_API_KEY',
    google_gemini: 'GOOGLE_AI_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    groq: 'GROQ_API_KEY',
    xai: 'XAI_API_KEY',
    xai_grok: 'XAI_API_KEY',
    cohere: 'COHERE_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
    openRouter: 'OPENROUTER_API_KEY',
    zai: 'ZAI_API_KEY',
  };

  const envVar = envMap[providerId];
  if (envVar) {
    return process.env[envVar] || null;
  }

  return null;
}

/**
 * Get default provider/model settings from DB
 */
export async function getAISettings(userId?: string): Promise<{ provider: string; model: string }> {
  try {
    const scopedProviderKey = userId ? `user:${userId}:default_provider` : null;
    const scopedModelKey = userId ? `user:${userId}:default_model` : null;

    const [providerSetting, modelSetting] = await Promise.all([
      (scopedProviderKey
        ? db.setting.findUnique({ where: { key: scopedProviderKey } })
        : Promise.resolve(null)
      ).then(r => r || db.setting.findUnique({ where: { key: 'default_provider' } }))
        .then(r => r || db.setting.findFirst({ where: { key: { endsWith: ':default_provider' } } })),
      (scopedModelKey
        ? db.setting.findUnique({ where: { key: scopedModelKey } })
        : Promise.resolve(null)
      ).then(r => r || db.setting.findUnique({ where: { key: 'default_model' } }))
        .then(r => r || db.setting.findFirst({ where: { key: { endsWith: ':default_model' } } })),
    ]);

    return {
      provider: (providerSetting?.value as string) || 'zai',
      model: (modelSetting?.value as string) || 'default',
    };
  } catch {
    return { provider: 'zai', model: 'default' };
  }
}
