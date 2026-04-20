// Portfolio Manager Mobile - API Service

import axios from 'axios';
import { Stock, Bond, Fund, Portfolio, Alert, MarketData, User } from '@/types';

// Configure base URL - change this to your production URL
const BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  // Get token from secure storage
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      logout();
    }
    return Promise.reject(error);
  }
);

// Auth functions
let storedToken: string | null = null;

async function getStoredToken(): Promise<string | null> {
  return storedToken;
}

export function setToken(token: string) {
  storedToken = token;
}

export function clearToken() {
  storedToken = null;
}

export async function logout() {
  clearToken();
  // Navigate to login screen
}

// ============ API Endpoints ============

// Auth
export const authAPI = {
  login: async (username: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  },

  register: async (data: { email: string; username: string; password: string }): Promise<User> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    clearToken();
  },
};

// Stocks
export const stocksAPI = {
  getAll: async (): Promise<Stock[]> => {
    const response = await api.get('/stocks');
    return response.data;
  },

  getById: async (id: string): Promise<Stock> => {
    const response = await api.get(`/stocks/${id}`);
    return response.data;
  },

  create: async (data: Partial<Stock>): Promise<Stock> => {
    const response = await api.post('/stocks', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Stock>): Promise<Stock> => {
    const response = await api.put(`/stocks/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/stocks/${id}`);
  },
};

// Bonds
export const bondsAPI = {
  getAll: async (): Promise<Bond[]> => {
    const response = await api.get('/bonds');
    return response.data;
  },

  create: async (data: Partial<Bond>): Promise<Bond> => {
    const response = await api.post('/bonds', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/bonds/${id}`);
  },
};

// Funds
export const fundsAPI = {
  getAll: async (): Promise<Fund[]> => {
    const response = await api.get('/funds');
    return response.data;
  },

  create: async (data: Partial<Fund>): Promise<Fund> => {
    const response = await api.post('/funds', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/funds/${id}`);
  },
};

// Portfolios
export const portfoliosAPI = {
  getAll: async (): Promise<Portfolio[]> => {
    const response = await api.get('/portfolios');
    return response.data;
  },

  getWithAssets: async (id: string): Promise<Portfolio & { stocks: Stock[]; bonds: Bond[]; funds: Fund[] }> => {
    const response = await api.get(`/portfolios/${id}`);
    return response.data;
  },

  create: async (data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await api.post('/portfolios', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Portfolio>): Promise<Portfolio> => {
    const response = await api.put(`/portfolios/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/portfolios/${id}`);
  },
};

// Alerts
export const alertsAPI = {
  getAll: async (): Promise<Alert[]> => {
    const response = await api.get('/alerts');
    return response.data;
  },

  create: async (data: Partial<Alert>): Promise<Alert> => {
    const response = await api.post('/alerts', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Alert>): Promise<Alert> => {
    const response = await api.put(`/alerts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/alerts/${id}`);
  },
};

// Market Data
export const marketAPI = {
  getIndices: async (): Promise<MarketData[]> => {
    const response = await api.get('/market/indices');
    return response.data;
  },

  getPrice: async (symbol: string): Promise<{ price: number; change: number; changePct: number }> => {
    const response = await api.get(`/market/price/${symbol}`);
    return response.data;
  },

  search: async (query: string): Promise<MarketData[]> => {
    const response = await api.get(`/market/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// AI
export const aiAPI = {
  chat: async (message: string, context?: string): Promise<{ response: string }> => {
    const response = await api.post('/ai/chat', { message, context });
    return response.data;
  },

  analyzePortfolio: async (portfolioId: string): Promise<{ analysis: string }> => {
    const response = await api.post('/ai/analyze', { portfolioId });
    return response.data;
  },
};

export default api;
