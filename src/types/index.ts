// Portfolio Manager Types

// ═══════════════════════════════════════════════════════════════
// Market Types
// ═══════════════════════════════════════════════════════════════

export interface Market {
  code: string;
  name: string;
  nameEn: string;
  country: string;
  countryAr: string;
  currency: string;
  currencySymbol: string;
  currencyName: string;
  timezone: string;
  openTime: string;
  closeTime: string;
  tradingDays: string;
  mainIndex: string;
  mainIndexName: string;
  flag: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  market: string;
  price: number;
  change: number;
  changePct: number;
  currency: string;
  currencySymbol: string;
}

export interface MarketStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  sector?: string;
}

export interface Currency {
  symbol: string;
  name: string;
  nameEn: string;
  decimals: number;
}

// ═══════════════════════════════════════════════════════════════
// Stock Types
// ═══════════════════════════════════════════════════════════════

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
  maturityDate?: Date;
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
  stocks: Stock[];
  bonds: Bond[];
  funds: Fund[];
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
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPct: number;
  stocksCount: number;
  bestPerformer: Stock | null;
  worstPerformer: Stock | null;
}

export interface ChartData {
  name: string;
  value: number;
  change?: number;
  color?: string;
}

export interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  count: number;
}
