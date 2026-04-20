'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AI_PROVIDERS } from '@/lib/ai-providers';
import { getAISettings as getLocalAISettings } from '@/lib/api-keys';

type SettingsSource = 'server' | 'local';

interface StoredAISettings {
  keys: Record<string, string>;
  defaultProvider: string;
  defaultModel: string;
  source: SettingsSource;
}

export interface ResolvedAIRequest {
  requestedProvider: string;
  provider: string;
  model: string;
  usedFallback: boolean;
}

interface ApiSettingsResponse {
  keys?: Record<string, string>;
  defaultProvider?: string | null;
  defaultModel?: string | null;
}

interface UseAISettingsResult {
  isLoading: boolean;
  source: SettingsSource;
  selectedProvider: string;
  defaultProvider: string;
  defaultModel: string;
  configuredProviders: string[];
  hasProviderKey: (providerId: string) => boolean;
  setSelectedProvider: (providerId: string) => void;
  resolveRequestProvider: (requestedProvider?: string) => ResolvedAIRequest;
  refreshSettings: () => Promise<void>;
}

function normalizeProviderId(providerId?: string | null): string {
  const raw = (providerId || '').trim();
  if (!raw) return 'zai';

  const lowered = raw.toLowerCase();
  if (lowered === 'openrouter') return 'openrouter';
  if (lowered === 'googleai') return 'google';
  const matched = AI_PROVIDERS.find((provider) => provider.id.toLowerCase() === lowered);
  if (matched) return matched.id;
  return raw;
}

function providerAliases(providerId: string): string[] {
  const normalized = normalizeProviderId(providerId);
  if (normalized === 'openrouter') return ['openrouter', 'openRouter'];
  if (normalized === 'google') return ['google', 'googleAI'];
  return [normalized];
}

function isValidApiKey(key?: string | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.length < 10) return false;
  return !trimmed.toLowerCase().includes('dummy');
}

function normalizeKeys(raw: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [provider, value] of Object.entries(raw || {})) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;

    const id = normalizeProviderId(provider);
    const existing = normalized[id];
    if (!existing || (!isValidApiKey(existing) && isValidApiKey(trimmed))) {
      normalized[id] = trimmed;
    }
  }

  return normalized;
}

function readProviderKey(keys: Record<string, string>, providerId: string): string {
  for (const alias of providerAliases(providerId)) {
    const key = keys[alias];
    if (typeof key === 'string' && key.trim()) return key.trim();
  }
  return '';
}

function getProviderModel(providerId: string): string {
  const provider = AI_PROVIDERS.find((item) => item.id === providerId);
  return provider?.defaultModel || 'default';
}

function firstConfiguredProvider(keys: Record<string, string>): string | null {
  for (const provider of AI_PROVIDERS) {
    if (isValidApiKey(readProviderKey(keys, provider.id))) {
      return provider.id;
    }
  }
  return null;
}

function resolveInitialProvider(settings: StoredAISettings): string {
  const preferred = normalizeProviderId(settings.defaultProvider);
  if (isValidApiKey(readProviderKey(settings.keys, preferred))) {
    return preferred;
  }
  return firstConfiguredProvider(settings.keys) || preferred || 'zai';
}

function buildSettingsFromServer(data: ApiSettingsResponse): StoredAISettings {
  return {
    keys: normalizeKeys(data.keys || {}),
    defaultProvider: normalizeProviderId(data.defaultProvider || 'zai'),
    defaultModel: (data.defaultModel || 'default').toString(),
    source: 'server',
  };
}

function buildSettingsFromLocal(): StoredAISettings {
  const local = getLocalAISettings();
  return {
    keys: normalizeKeys(local.apiKeys || {}),
    defaultProvider: normalizeProviderId(local.defaultProvider || 'zai'),
    defaultModel: local.defaultModel || 'default',
    source: 'local',
  };
}

export function getProviderDisplayName(providerId: string): string {
  const normalized = normalizeProviderId(providerId);
  const provider = AI_PROVIDERS.find((item) => item.id === normalized);
  return provider?.nameAr || provider?.name || normalized;
}

export function useAISettings(): UseAISettingsResult {
  const [settings, setSettings] = useState<StoredAISettings>(() => buildSettingsFromLocal());
  const [selectedProvider, setSelectedProviderState] = useState<string>('zai');
  const [isLoading, setIsLoading] = useState(true);

  const hasProviderKey = useCallback((providerId: string) => {
    const normalized = normalizeProviderId(providerId);
    return isValidApiKey(readProviderKey(settings.keys, normalized));
  }, [settings.keys]);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error('settings_fetch_failed');
      }

      const data = await response.json() as ApiSettingsResponse;
      const next = buildSettingsFromServer(data);
      setSettings(next);

      // Keep legacy cache for older components until migration is complete.
      localStorage.setItem('api_keys', JSON.stringify(next.keys));
      localStorage.setItem('ai_api_keys', JSON.stringify(next.keys));
      localStorage.setItem('default_provider', next.defaultProvider);
      localStorage.setItem('default_model', next.defaultModel);
    } catch {
      setSettings(buildSettingsFromLocal());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (isLoading) return;

    setSelectedProviderState((current) => {
      const normalizedCurrent = normalizeProviderId(current);
      if (normalizedCurrent === 'zai') {
        return resolveInitialProvider(settings);
      }
      if (hasProviderKey(normalizedCurrent)) {
        return normalizedCurrent;
      }
      return resolveInitialProvider(settings);
    });
  }, [hasProviderKey, isLoading, settings]);

  const configuredProviders = useMemo(() => {
    const list: string[] = [];
    for (const provider of AI_PROVIDERS) {
      if (hasProviderKey(provider.id)) list.push(provider.id);
    }
    return list;
  }, [hasProviderKey]);

  const setSelectedProvider = useCallback((providerId: string) => {
    setSelectedProviderState(normalizeProviderId(providerId));
  }, []);

  const resolveRequestProvider = useCallback((requestedProvider?: string): ResolvedAIRequest => {
    const requested = normalizeProviderId(requestedProvider || selectedProvider || settings.defaultProvider || 'zai');
    const defaultProvider = normalizeProviderId(settings.defaultProvider || 'zai');

    if (hasProviderKey(requested)) {
      const model = requested === defaultProvider ? settings.defaultModel : getProviderModel(requested);
      return {
        requestedProvider: requested,
        provider: requested,
        model,
        usedFallback: false,
      };
    }

    if (defaultProvider !== requested && hasProviderKey(defaultProvider)) {
      return {
        requestedProvider: requested,
        provider: defaultProvider,
        model: settings.defaultModel || getProviderModel(defaultProvider),
        usedFallback: true,
      };
    }

    const fallbackProvider = firstConfiguredProvider(settings.keys) || requested || 'zai';
    return {
      requestedProvider: requested,
      provider: fallbackProvider,
      model: fallbackProvider === defaultProvider ? settings.defaultModel : getProviderModel(fallbackProvider),
      usedFallback: true,
    };
  }, [hasProviderKey, selectedProvider, settings.defaultModel, settings.defaultProvider, settings.keys]);

  return {
    isLoading,
    source: settings.source,
    selectedProvider,
    defaultProvider: settings.defaultProvider,
    defaultModel: settings.defaultModel,
    configuredProviders,
    hasProviderKey,
    setSelectedProvider,
    resolveRequestProvider,
    refreshSettings: loadSettings,
  };
}
