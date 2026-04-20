// Portfolio Manager Mobile - Zustand Store

import { create } from 'zustand';
import { Stock, Bond, Fund, Portfolio, Alert, User } from '@/types';
import { stocksAPI, bondsAPI, fundsAPI, portfoliosAPI, alertsAPI } from '@/services/api';

interface PortfolioState {
  // User
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  // Portfolio
  activePortfolio: Portfolio | null;
  portfolios: Portfolio[];
  setActivePortfolio: (portfolio: Portfolio) => void;
  fetchPortfolios: () => Promise<void>;

  // Stocks
  stocks: Stock[];
  setStocks: (stocks: Stock[]) => void;
  fetchStocks: () => Promise<void>;
  addStock: (stock: Partial<Stock>) => Promise<void>;
  removeStock: (id: string) => Promise<void>;

  // Bonds
  bonds: Bond[];
  setBonds: (bonds: Bond[]) => void;
  fetchBonds: () => Promise<void>;
  addBond: (bond: Partial<Bond>) => Promise<void>;
  removeBond: (id: string) => Promise<void>;

  // Funds
  funds: Fund[];
  setFunds: (funds: Fund[]) => void;
  fetchFunds: () => Promise<void>;
  addFund: (fund: Partial<Fund>) => Promise<void>;
  removeFund: (id: string) => Promise<void>;

  // Alerts
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  fetchAlerts: () => Promise<void>;
  addAlert: (alert: Partial<Alert>) => Promise<void>;
  removeAlert: (id: string) => Promise<void>;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Calculated
  getTotalValue: () => number;
  getTotalProfitLoss: () => number;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  // User
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false, stocks: [], bonds: [], funds: [], portfolios: [] }),

  // Portfolio
  activePortfolio: null,
  portfolios: [],
  setActivePortfolio: (portfolio) => set({ activePortfolio: portfolio }),
  fetchPortfolios: async () => {
    try {
      const portfolios = await portfoliosAPI.getAll();
      set({ portfolios });
      if (portfolios.length > 0 && !get().activePortfolio) {
        set({ activePortfolio: portfolios.find((p) => p.isActive) || portfolios[0] });
      }
    } catch (error) {
      console.error('Failed to fetch portfolios:', error);
    }
  },

  // Stocks
  stocks: [],
  setStocks: (stocks) => set({ stocks }),
  fetchStocks: async () => {
    set({ isLoading: true });
    try {
      const stocks = await stocksAPI.getAll();
      set({ stocks, isLoading: false });
    } catch (error) {
      set({ error: 'فشل في جلب الأسهم', isLoading: false });
    }
  },
  addStock: async (stock) => {
    try {
      const newStock = await stocksAPI.create(stock);
      set((state) => ({ stocks: [...state.stocks, newStock] }));
    } catch (error) {
      set({ error: 'فشل في إضافة السهم' });
    }
  },
  removeStock: async (id) => {
    try {
      await stocksAPI.delete(id);
      set((state) => ({ stocks: state.stocks.filter((s) => s.id !== id) }));
    } catch (error) {
      set({ error: 'فشل في حذف السهم' });
    }
  },

  // Bonds
  bonds: [],
  setBonds: (bonds) => set({ bonds }),
  fetchBonds: async () => {
    try {
      const bonds = await bondsAPI.getAll();
      set({ bonds });
    } catch (error) {
      console.error('Failed to fetch bonds:', error);
    }
  },
  addBond: async (bond) => {
    try {
      const newBond = await bondsAPI.create(bond);
      set((state) => ({ bonds: [...state.bonds, newBond] }));
    } catch (error) {
      set({ error: 'فشل في إضافة السند' });
    }
  },
  removeBond: async (id) => {
    try {
      await bondsAPI.delete(id);
      set((state) => ({ bonds: state.bonds.filter((b) => b.id !== id) }));
    } catch (error) {
      set({ error: 'فشل في حذف السند' });
    }
  },

  // Funds
  funds: [],
  setFunds: (funds) => set({ funds }),
  fetchFunds: async () => {
    try {
      const funds = await fundsAPI.getAll();
      set({ funds });
    } catch (error) {
      console.error('Failed to fetch funds:', error);
    }
  },
  addFund: async (fund) => {
    try {
      const newFund = await fundsAPI.create(fund);
      set((state) => ({ funds: [...state.funds, newFund] }));
    } catch (error) {
      set({ error: 'فشل في إضافة الصندوق' });
    }
  },
  removeFund: async (id) => {
    try {
      await fundsAPI.delete(id);
      set((state) => ({ funds: state.funds.filter((f) => f.id !== id) }));
    } catch (error) {
      set({ error: 'فشل في حذف الصندوق' });
    }
  },

  // Alerts
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  fetchAlerts: async () => {
    try {
      const alerts = await alertsAPI.getAll();
      set({ alerts });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  },
  addAlert: async (alert) => {
    try {
      const newAlert = await alertsAPI.create(alert);
      set((state) => ({ alerts: [...state.alerts, newAlert] }));
    } catch (error) {
      set({ error: 'فشل في إضافة التنبيه' });
    }
  },
  removeAlert: async (id) => {
    try {
      await alertsAPI.delete(id);
      set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) }));
    } catch (error) {
      set({ error: 'فشل في حذف التنبيه' });
    }
  },

  // UI State
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error }),

  // Calculated
  getTotalValue: () => {
    const { stocks, bonds, funds } = get();
    const stocksValue = stocks.reduce((sum, s) => sum + s.currentValue, 0);
    const bondsValue = bonds.reduce((sum, b) => sum + (b.currentPrice || b.buyPrice) * b.faceValue * b.qty / 100, 0);
    const fundsValue = funds.reduce((sum, f) => sum + (f.currentPrice || f.buyPrice) * f.units, 0);
    return stocksValue + bondsValue + fundsValue;
  },
  getTotalProfitLoss: () => {
    const { stocks } = get();
    return stocks.reduce((sum, s) => sum + s.profitLoss, 0);
  },
}));
