'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MarketDomain, MarketQuote } from '@/lib/market-hub';

interface LivePrice {
  price: number;
  change: number;
  changePct: number;
  high?: number;
  low?: number;
  high52w?: number | null;
  low52w?: number | null;
  volume?: number;
  averageVolume?: number;
  averageVolume10Day?: number;
  shortRatio?: number;
  shortPercentOfFloat?: number;
  sharesShort?: number;
  sharesOutstanding?: number;
  floatShares?: number;
  shortDataSource?: string;
  shortDataChecked?: boolean;
  marketCap?: number;
  source: string;
  lastUpdate: number;
}

interface PricesResponse {
  success: boolean;
  timestamp?: number;
  count?: number;
  data?: Record<string, MarketQuote>;
  error?: string;
}

interface UseLivePricesOptions {
  category?: 'crypto' | 'forex' | 'metals' | 'indices' | 'energy' | 'saudi' | 'all';
  refreshInterval?: number; // in milliseconds
  symbols?: string[];
}

interface UseLivePricesReturn {
  prices: Record<string, LivePrice>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdate: Date | null;
}

export function useLivePrices(options: UseLivePricesOptions = {}): UseLivePricesReturn {
  const { 
    category = 'all', 
    refreshInterval = 60000, // 1 minute default
    symbols 
  } = options;
  
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const resolveDomain = useCallback((value: UseLivePricesOptions['category']): MarketDomain => {
    switch (value) {
      case 'crypto':
        return 'crypto';
      case 'forex':
        return 'forex';
      case 'metals':
        return 'metals';
      case 'indices':
        return 'indices';
      case 'energy':
        return 'energy';
      case 'saudi':
        return 'saudi';
      case 'all':
      default:
        // نطاق stocks موصول الآن بـ /api/prices ويعيد تغطية واسعة للأسهم/العملات/السلع/الصناديق.
        return 'stocks';
    }
  }, []);

  const toLivePriceMap = useCallback((input: Record<string, MarketQuote> | undefined, fallbackTs: number): Record<string, LivePrice> => {
    if (!input) return {};
    const out: Record<string, LivePrice> = {};
    for (const [symbol, quote] of Object.entries(input)) {
      if (!quote || typeof quote.price !== 'number' || !Number.isFinite(quote.price)) continue;
      out[symbol] = {
        price: quote.price,
        change: Number.isFinite(Number(quote.change)) ? Number(quote.change) : 0,
        changePct: Number.isFinite(Number(quote.changePct)) ? Number(quote.changePct) : 0,
        high: quote.high ?? undefined,
        low: quote.low ?? undefined,
        high52w: quote.high52w ?? null,
        low52w: quote.low52w ?? null,
        volume: quote.volume ?? undefined,
        averageVolume: quote.averageVolume ?? undefined,
        averageVolume10Day: quote.averageVolume10Day ?? undefined,
        shortRatio: quote.shortRatio ?? undefined,
        shortPercentOfFloat: quote.shortPercentOfFloat ?? undefined,
        sharesShort: quote.sharesShort ?? undefined,
        sharesOutstanding: quote.sharesOutstanding ?? undefined,
        floatShares: quote.floatShares ?? undefined,
        shortDataSource: quote.shortDataSource ?? undefined,
        marketCap: quote.marketCap ?? undefined,
        source: quote.source || 'market-hub',
        lastUpdate: quote.lastUpdate || fallbackTs,
      };
    }
    return out;
  }, []);
  
  const fetchPrices = useCallback(async () => {
    try {
      const domain = resolveDomain(category);
      const params = new URLSearchParams({ domain });
      if (symbols && symbols.length > 0) {
        params.set('symbols', symbols.map((s) => s.trim().toUpperCase()).filter(Boolean).join(','));
      }

      const response = await fetch(`/api/market-hub?${params.toString()}`, { cache: 'no-store' });
      const data: PricesResponse = await response.json();
      
      if (data.success && data.data) {
        const ts = data.timestamp || Date.now();
        setPrices(toLivePriceMap(data.data, ts));
        setLastUpdate(new Date(ts));
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch prices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [category, symbols, resolveDomain, toLivePriceMap]);
  
  useEffect(() => {
    fetchPrices();
    
    // Set up auto-refresh
    if (refreshInterval > 0) {
      const interval = setInterval(fetchPrices, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPrices, refreshInterval]);
  
  return {
    prices,
    loading,
    error,
    refresh: fetchPrices,
    lastUpdate
  };
}

// Hook for single price
export function useLivePrice(symbol: string): {
  price: LivePrice | null;
  loading: boolean;
  error: string | null;
} {
  const { prices, loading, error } = useLivePrices({ 
    refreshInterval: 30000 
  });
  
  return {
    price: prices[symbol.toUpperCase()] || null,
    loading,
    error
  };
}

// Format price for display
export function formatPrice(price: number, _symbol?: string): string {
  if (price >= 1000000000) {
    return `${(price / 1000000000).toFixed(2)}B`;
  }
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(2)}M`;
  }
  if (price >= 1000) {
    return price.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
  if (price >= 1) {
    return price.toFixed(2);
  }
  if (price >= 0.01) {
    return price.toFixed(4);
  }
  return price.toFixed(6);
}

// Format change percentage
export function formatChange(changePct: number): string {
  const sign = changePct >= 0 ? '+' : '';
  return `${sign}${changePct.toFixed(2)}%`;
}
