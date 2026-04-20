import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPct: number;
  stockCount: number;
  bondCount: number;
  fundCount: number;
}

interface PortfolioState {
  // Active portfolio
  activePortfolioId: string | null;
  setActivePortfolio: (id: string | null) => void;

  // Data
  portfolios: any[];
  setPortfolios: (portfolios: any[]) => void;

  // UI State
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  sortBy: 'name' | 'value' | 'change' | 'date';
  setSortBy: (sort: 'name' | 'value' | 'change' | 'date') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;

  // Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string | null;
  setFilterType: (type: string | null) => void;
  filterCurrency: string | null;
  setFilterCurrency: (currency: string | null) => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      activePortfolioId: null,
      setActivePortfolio: (id) => set({ activePortfolioId: id }),

      portfolios: [],
      setPortfolios: (portfolios) => set({ portfolios }),

      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),
      sortBy: 'date',
      setSortBy: (sort) => set({ sortBy: sort }),
      sortOrder: 'desc',
      setSortOrder: (order) => set({ sortOrder: order }),

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      filterType: null,
      setFilterType: (type) => set({ filterType: type }),
      filterCurrency: null,
      setFilterCurrency: (currency) => set({ filterCurrency: currency }),
    }),
    {
      name: 'portfolio-store',
      partialize: (state) => ({
        activePortfolioId: state.activePortfolioId,
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);
