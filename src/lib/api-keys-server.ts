/**
 * Client-side API key management.
 * Keys are stored server-side (encrypted in DB).
 * This module provides a client interface to the /api/settings endpoint.
 */


const CACHE_KEY = 'api_keys_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedKeys {
  keys: Record<string, string>;
  lastFetched: number;
}

/** Get API key from server (cached) */
export async function getApiKeyFromServer(providerId: string, token: string): Promise<string | null> {
  try {
    const cached = _getCache();
    if (cached.keys[providerId]) {
      return cached.keys[providerId];
    }

    const response = await fetch('/api/settings', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    _setCache({ keys: data.keys || {}, lastFetched: Date.now() });

    return data.keys?.[providerId] || null;
  } catch {
    return null;
  }
}

/** Save API key to server (encrypted) */
export async function saveApiKeyToServer(
  providerId: string,
  apiKey: string,
  token: string
): Promise<boolean> {
  try {
    const cached = _getCache();
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ keys: { [providerId]: apiKey } }),
    });

    if (response.ok) {
      cached.keys[providerId] = apiKey;
      cached.lastFetched = Date.now();
      _setCache(cached);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Delete API key from server */
export async function deleteApiKeyFromServer(providerId: string, token: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/settings?provider=${providerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (response.ok) {
      const cached = _getCache();
      delete cached.keys[providerId];
      _setCache(cached);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Cache helpers ────────────────────────────────────────────

function _getCache(): CachedKeys {
  if (typeof window === 'undefined') return { keys: {}, lastFetched: 0 };
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { keys: {}, lastFetched: 0 };
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.lastFetched > CACHE_TTL) return { keys: {}, lastFetched: 0 };
    return parsed;
  } catch {
    return { keys: {}, lastFetched: 0 };
  }
}

function _setCache(cache: CachedKeys) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}
