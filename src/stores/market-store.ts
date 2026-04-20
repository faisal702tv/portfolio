import { create } from 'zustand';

// ─── Market Data Store ────────────────────────────────────────

interface MarketState {
  // Live prices cache
  prices: Record<string, { price: number; change: number; changePct: number; lastUpdated: number }>;
  setPrice: (symbol: string, data: { price: number; change: number; changePct: number }) => void;
  clearPrices: () => void;

  // Connection status
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;

  // Last update timestamp
  lastFetchTime: number | null;
  setLastFetchTime: (time: number) => void;

  // Selected market
  selectedMarket: string;
  setSelectedMarket: (market: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useMarketStore = create<MarketState>()((set) => ({
  prices: {},
  setPrice: (symbol, data) =>
    set((state) => ({
      prices: { ...state.prices, [symbol]: { ...data, lastUpdated: Date.now() } },
    })),
  clearPrices: () => set({ prices: {} }),

  isConnected: false,
  setIsConnected: (connected) => set({ isConnected: connected }),

  lastFetchTime: null,
  setLastFetchTime: (time) => set({ lastFetchTime: time }),

  selectedMarket: 'TADAWUL',
  setSelectedMarket: (market) => set({ selectedMarket: market }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
