// Portfolio Manager Mobile - Types

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string;
  qty: number;
  buyPrice: number;
  currentPrice?: number;
  change?: number;
  changePct?: number;
  totalCost: number;
  currentValue: number;
  profitLoss: number;
  profitLossPct: number;
  isShariaCompliant?: boolean;
}

export interface Bond {
  id: string;
  symbol: string;
  name: string;
  type: 'bond' | 'sukuk';
  faceValue: number;
  couponRate?: number;
  maturityDate?: string;
  qty: number;
  buyPrice: number;
  currentPrice?: number;
  isShariaCompliant?: boolean;
}

export interface Fund {
  id: string;
  symbol?: string;
  name: string;
  fundType?: string;
  units: number;
  buyPrice: number;
  currentPrice?: number;
  ytdReturn?: number;
  isShariaCompliant?: boolean;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  type: 'stocks' | 'bonds' | 'funds' | 'mixed';
  currency: string;
  isActive: boolean;
}

export interface Alert {
  id: string;
  symbol: string;
  name?: string;
  type: 'price_up' | 'price_down' | 'pct_up' | 'pct_down';
  targetValue: number;
  isActive: boolean;
  isTriggered: boolean;
}

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  role: 'admin' | 'user';
}
