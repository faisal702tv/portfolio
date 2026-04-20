'use client';

import { useState, useEffect, useCallback } from 'react';

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
  marketCap?: number;
  source: string;
  lastUpdate: number;
}

interface PricesResponse {
  success: boolean;
  cached: boolean;
  timestamp: number;
  count: number;
  data: Record<string, LivePrice>;
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
  
  const fetchPrices = useCallback(async () => {
    try {
      let url = `/api/prices?category=${category}`;
      if (symbols && symbols.length > 0) {
        url += `&symbols=${symbols.join(',')}`;
      }
      
      const response = await fetch(url);
      const data: PricesResponse = await response.json();
      
      if (data.success) {
        setPrices(data.data);
        setLastUpdate(new Date(data.timestamp));
        setError(null);
      } else {
        setError('Failed to fetch prices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [category, symbols]);
  
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
export function formatPrice(price: number, symbol?: string): string {
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
