'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { resolveAssetMarket } from '@/lib/asset-market';

const EXCHANGE_RATES: Record<string, number> = {
  SAR: 1,
  USD: 3.75,
  EUR: 4.05,
  GBP: 4.75,
  JPY: 0.025,
  CHF: 4.2,
  CAD: 2.75,
  AUD: 2.45,
  CNY: 0.52,
  AED: 1.021,
  KWD: 12.18,
  QAR: 1.03,
  EGP: 0.075,
  BHD: 9.95,
  OMR: 9.74,
  JOD: 5.29,
};

function toSAR(amount: number, currency?: string | null): number {
  const rate = EXCHANGE_RATES[(currency || 'SAR').toUpperCase()] || 1;
  return amount * rate;
}

interface DashboardStock {
  id: string;
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  sector?: string;
  industry?: string;
  qty: number;
  buyPrice: number;
  currentPrice?: number;
  change?: number;
  changePct?: number;
  totalCost?: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPct?: number;
  buyCurrency?: string;
  portfolioCurrency?: string;
  valueSAR: number;
  costSAR: number;
  plSAR: number;
  livePrice?: number;
  liveChangePct?: number;
}

interface DashboardBond {
  id: string;
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  type: string;
  faceValue: number;
  couponRate?: number;
  maturityDate?: string;
  qty: number;
  buyPrice: number;
  currentPrice?: number;
  portfolioCurrency?: string;
  valueSAR: number;
  costSAR: number;
  plSAR: number;
}

interface DashboardFund {
  id: string;
  symbol?: string;
  name: string;
  exchange?: string;
  currency?: string;
  fundType?: string;
  units: number;
  buyPrice: number;
  currentPrice?: number;
  ytdReturn?: number;
  portfolioCurrency?: string;
  valueSAR: number;
  costSAR: number;
  plSAR: number;
  livePrice?: number;
}

interface DashboardPortfolio {
  id: string;
  name: string;
  description?: string;
  type: string;
  currency: string;
  isActive: boolean;
  totalValue: number;
  totalValueSAR: number;
  stockCount: number;
  bondCount: number;
  fundCount: number;
  stocks: DashboardStock[];
  bonds: DashboardBond[];
  funds: DashboardFund[];
}

interface TickerQuote { price: number; change: number; changePct: number; }
interface LiveCryptoItem { price: number; change: number; changePct: number; source: string; lastUpdate: number; }
interface ForexPair {
  symbol: string; name: string; price: number; change: number; changePct: number;
  baseCurrency: string; quoteCurrency: string; category: string;
}
interface LiveFundItem { symbol?: string; name: string; price?: number; change?: number; changePct?: number; type?: string; }

interface AssetCategory {
  label: string;
  valueSAR: number;
  costSAR: number;
  plSAR: number;
  count: number;
}

interface DashboardData {
  portfolios: DashboardPortfolio[];
  stocks: DashboardStock[];
  bonds: DashboardBond[];
  funds: DashboardFund[];
  ticker: Record<string, TickerQuote>;
  crypto: Record<string, LiveCryptoItem>;
  forex: ForexPair[];
  liveFunds: LiveFundItem[];
  totalPortfolioValue: number;
  totalPortfolioCost: number;
  totalProfitLoss: number;
  totalProfitLossPct: number;
  totalStocks: number;
  totalBonds: number;
  totalFunds: number;
  isAuthenticated: boolean;
  assetCategories: AssetCategory[];
  stockTotalSAR: number;
  bondTotalSAR: number;
  fundTotalSAR: number;
  cryptoTotalSAR: number;
  forexTotalSAR: number;
  commodityTotalSAR: number;
}

const EMPTY_DATA: DashboardData = {
  portfolios: [], stocks: [], bonds: [], funds: [],
  ticker: {}, crypto: {}, forex: [], liveFunds: [],
  totalPortfolioValue: 0, totalPortfolioCost: 0, totalProfitLoss: 0, totalProfitLossPct: 0,
  totalStocks: 0, totalBonds: 0, totalFunds: 0, isAuthenticated: false,
  assetCategories: [], stockTotalSAR: 0, bondTotalSAR: 0, fundTotalSAR: 0,
  cryptoTotalSAR: 0, forexTotalSAR: 0, commodityTotalSAR: 0,
};

function fetchWithTimeout(url: string, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

function getCurrencyForAsset(
  asset: { symbol?: string; name?: string; exchange?: string; currency?: string; buyCurrency?: string },
  portfolioCurrency: string,
  assetClass: 'stock' | 'fund' | 'bond' | 'crypto' | 'forex' | 'commodity'
): { currency: string; exchange?: string } {
  const market = resolveAssetMarket({
    symbol: asset.symbol || asset.name,
    exchange: asset.exchange,
    currency: asset.currency || asset.buyCurrency,
    assetClass,
  });

  const resolvedCurrency = (market.currency || '').toUpperCase();
  const currency = resolvedCurrency && EXCHANGE_RATES[resolvedCurrency]
    ? resolvedCurrency
    : (portfolioCurrency || 'SAR').toUpperCase();

  return { currency, exchange: market.exchange };
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      const [portfoliosRes, tickerRes, cryptoRes, forexRes, fundsRes] = await Promise.allSettled([
        fetchWithTimeout('/api/portfolios', 10000).catch(() => null),
        fetchWithTimeout('/api/ticker', 8000).catch(() => null),
        fetchWithTimeout('/api/real-prices?type=crypto', 8000).catch(() => null),
        fetchWithTimeout('/api/forex', 8000).catch(() => null),
        fetchWithTimeout('/api/funds?type=all', 8000).catch(() => null),
      ]);

      let rawPortfolios: any[] = [];
      let ticker: Record<string, TickerQuote> = {};
      let crypto: Record<string, LiveCryptoItem> = {};
      let forex: ForexPair[] = [];
      let liveFunds: LiveFundItem[] = [];

      if (portfoliosRes.status === 'fulfilled' && portfoliosRes.value && portfoliosRes.value.ok) {
        try { const json = await portfoliosRes.value.json(); rawPortfolios = json.portfolios || []; } catch {}
      }
      if (tickerRes.status === 'fulfilled' && tickerRes.value && tickerRes.value.ok) {
        try { const json = await tickerRes.value.json(); if (json.success && json.data) ticker = json.data; } catch {}
      }
      if (cryptoRes.status === 'fulfilled' && cryptoRes.value && cryptoRes.value.ok) {
        try { const json = await cryptoRes.value.json(); if (json.success && json.data) crypto = json.data; } catch {}
      }
      if (forexRes.status === 'fulfilled' && forexRes.value && forexRes.value.ok) {
        try {
          const json = await forexRes.value.json();
          if (json.categories) {
            const cats = json.categories;
            forex = [
              ...(cats.major?.pairs || []), ...(cats.minor?.pairs || []),
              ...(cats.emerging?.pairs || []), ...(cats.arab?.pairs || []),
            ];
          }
        } catch {}
      }
      if (fundsRes.status === 'fulfilled' && fundsRes.value && fundsRes.value.ok) {
        try {
          const json = await fundsRes.value.json();
          const items: LiveFundItem[] = [];
          if (json.reits) items.push(...json.reits.map((r: any) => ({ symbol: r.symbol, name: r.name, price: r.price, change: r.change, changePct: r.changePct, type: 'reit' })));
          if (json.funds?.saudi) items.push(...json.funds.saudi.map((f: any) => ({ symbol: f.symbol, name: f.name, price: f.price, change: f.change, changePct: f.changePct, type: 'fund' })));
          if (json.sukuk?.government) items.push(...json.sukuk.government.map((s: any) => ({ symbol: s.symbol, name: s.name, price: s.price, change: s.change, changePct: s.changePct, type: 'sukuk' })));
          if (json.sukuk?.corporate) items.push(...json.sukuk.corporate.map((s: any) => ({ symbol: s.symbol, name: s.name, price: s.price, change: s.change, changePct: s.changePct, type: 'sukuk' })));
          liveFunds = items;
        } catch {}
      }

      const allStocks: DashboardStock[] = [];
      const allBonds: DashboardBond[] = [];
      const allFunds: DashboardFund[] = [];
      const portfolios: DashboardPortfolio[] = [];

      let stockTotalSAR = 0, bondTotalSAR = 0, fundTotalSAR = 0;
      let cryptoTotalSAR = 0, forexTotalSAR = 0, commodityTotalSAR = 0;
      let stockCostSAR = 0, bondCostSAR = 0, fundCostSAR = 0;
      let cryptoCostSAR = 0, forexCostSAR = 0, commodityCostSAR = 0;

      for (const p of rawPortfolios) {
        const pCurrency = p.currency || 'SAR';
        const pStocks: DashboardStock[] = [];
        const pBonds: DashboardBond[] = [];
        const pFunds: DashboardFund[] = [];

        for (const s of (p.stocks || [])) {
          const sector = s.sector || 'أخرى';
          const exchange = String(s.exchange || '').toUpperCase();
          const isCrypto = sector === 'Cryptocurrency' || exchange === 'CRYPTO';
          const isForex = sector === 'Forex' || exchange === 'FOREX';
          const normalizedSector = isCrypto ? 'Cryptocurrency' : isForex ? 'Forex' : sector;
          const stockClass = isCrypto ? 'crypto' : isForex ? 'forex' : 'stock';
          const market = getCurrencyForAsset(s, pCurrency, stockClass);
          const currency = market.currency;

          let livePrice = s.currentPrice ?? s.buyPrice;
          let liveChangePct = s.changePct ?? 0;

          if (isCrypto) {
            const cryptoKey = Object.keys(crypto).find(k => k.startsWith(s.symbol.replace('-USD', '').replace('-USDT', '')));
            if (cryptoKey && crypto[cryptoKey]) {
              livePrice = crypto[cryptoKey].price;
              liveChangePct = crypto[cryptoKey].changePct;
            }
          }

          if (isForex) {
            const forexPair = forex.find(f =>
              `${f.baseCurrency}/${f.quoteCurrency}` === s.name ||
              f.symbol === s.symbol ||
              `${f.baseCurrency}${f.quoteCurrency}` === s.symbol.replace('=X', '').replace('/','')
            );
            if (forexPair) {
              livePrice = forexPair.price;
              liveChangePct = forexPair.changePct;
            }
          }

          const value = s.qty * livePrice;
          const cost = s.qty * s.buyPrice;
          const pl = value - cost;
          const plPct = cost > 0 ? (pl / cost) * 100 : 0;

          const valueSAR = toSAR(value, currency);
          const costSAR = toSAR(cost, currency);

          const stock: DashboardStock = {
            ...s,
            exchange: market.exchange || s.exchange,
            currency,
            sector: normalizedSector,
            portfolioCurrency: pCurrency,
            buyCurrency: currency,
            currentPrice: livePrice,
            currentValue: value,
            profitLoss: pl,
            profitLossPct: plPct,
            livePrice,
            liveChangePct,
            valueSAR,
            costSAR,
            plSAR: valueSAR - costSAR,
          };

          pStocks.push(stock);
          allStocks.push(stock);

          if (isCrypto) {
            cryptoTotalSAR += valueSAR;
            cryptoCostSAR += costSAR;
          } else if (isForex) {
            forexTotalSAR += valueSAR;
            forexCostSAR += costSAR;
          } else {
            stockTotalSAR += valueSAR;
            stockCostSAR += costSAR;
          }
        }

        for (const b of (p.bonds || [])) {
          const market = getCurrencyForAsset(b, pCurrency, 'bond');
          const currency = market.currency;
          const value = b.qty * b.faceValue * ((b.currentPrice ?? b.buyPrice) / 100);
          const cost = b.qty * b.faceValue * (b.buyPrice / 100);
          const valueSAR = toSAR(value, currency);
          const costSAR = toSAR(cost, currency);

          const bond: DashboardBond = {
            ...b,
            exchange: market.exchange || b.exchange,
            currency,
            portfolioCurrency: pCurrency,
            valueSAR, costSAR, plSAR: valueSAR - costSAR,
          };
          pBonds.push(bond);
          allBonds.push(bond);
          bondTotalSAR += valueSAR;
          bondCostSAR += costSAR;
        }

        for (const f of (p.funds || [])) {
          const fundType = f.fundType || '';
          const fundClass = fundType === 'commodities' ? 'commodity' : 'fund';
          const market = getCurrencyForAsset(f, pCurrency, fundClass);
          const currency = market.currency;
          let livePrice: number | undefined;

          if (f.symbol && ticker[f.symbol]) {
            livePrice = ticker[f.symbol].price;
          }

          const price = livePrice ?? f.currentPrice ?? f.buyPrice;
          const value = f.units * price;
          const cost = f.units * f.buyPrice;
          const valueSAR = toSAR(value, currency);
          const costSAR = toSAR(cost, currency);

          const fund: DashboardFund = {
            ...f,
            exchange: market.exchange || f.exchange,
            currency,
            portfolioCurrency: pCurrency,
            currentPrice: price,
            livePrice,
            valueSAR, costSAR, plSAR: valueSAR - costSAR,
          };
          pFunds.push(fund);
          allFunds.push(fund);

          if (fundType === 'commodities') {
            commodityTotalSAR += valueSAR;
            commodityCostSAR += costSAR;
          } else {
            fundTotalSAR += valueSAR;
            fundCostSAR += costSAR;
          }
        }

        const totalValueSAR = pStocks.reduce((s, st) => s + st.valueSAR, 0)
          + pBonds.reduce((s, b) => s + b.valueSAR, 0)
          + pFunds.reduce((s, f) => s + f.valueSAR, 0);

        portfolios.push({
          ...p,
          totalValueSAR,
          stocks: pStocks,
          bonds: pBonds,
          funds: pFunds,
          totalValue: totalValueSAR,
          stockCount: pStocks.length,
          bondCount: pBonds.length,
          fundCount: pFunds.length,
        });
      }

      const totalPortfolioValue = stockTotalSAR + bondTotalSAR + fundTotalSAR + cryptoTotalSAR + forexTotalSAR + commodityTotalSAR;
      const totalPortfolioCost =
        stockCostSAR + bondCostSAR + fundCostSAR + cryptoCostSAR + forexCostSAR + commodityCostSAR;
      const totalProfitLoss = totalPortfolioValue - totalPortfolioCost;
      const totalProfitLossPct = totalPortfolioCost > 0 ? (totalProfitLoss / totalPortfolioCost) * 100 : 0;

      const assetCategories: AssetCategory[] = [
        { label: 'الأسهم', valueSAR: stockTotalSAR, costSAR: stockCostSAR, plSAR: stockTotalSAR - stockCostSAR, count: allStocks.filter(s => s.sector !== 'Cryptocurrency' && s.sector !== 'Forex').length },
        { label: 'العملات المشفرة', valueSAR: cryptoTotalSAR, costSAR: cryptoCostSAR, plSAR: cryptoTotalSAR - cryptoCostSAR, count: allStocks.filter(s => s.sector === 'Cryptocurrency').length },
        { label: 'الفوركس', valueSAR: forexTotalSAR, costSAR: forexCostSAR, plSAR: forexTotalSAR - forexCostSAR, count: allStocks.filter(s => s.sector === 'Forex').length },
        { label: 'الصكوك والسندات', valueSAR: bondTotalSAR, costSAR: bondCostSAR, plSAR: bondTotalSAR - bondCostSAR, count: allBonds.length },
        { label: 'الصناديق الاستثمارية', valueSAR: fundTotalSAR, costSAR: fundCostSAR, plSAR: fundTotalSAR - fundCostSAR, count: allFunds.filter(f => f.fundType !== 'commodities').length },
        { label: 'السلع والمعادن', valueSAR: commodityTotalSAR, costSAR: commodityCostSAR, plSAR: commodityTotalSAR - commodityCostSAR, count: allFunds.filter(f => f.fundType === 'commodities').length },
      ].filter(c => c.valueSAR > 0 || c.count > 0);

      if (!mountedRef.current) return;

      setData({
        portfolios, stocks: allStocks, bonds: allBonds, funds: allFunds,
        ticker, crypto, forex, liveFunds,
        totalPortfolioValue, totalPortfolioCost, totalProfitLoss, totalProfitLossPct,
        totalStocks: allStocks.length, totalBonds: allBonds.length, totalFunds: allFunds.length,
        isAuthenticated: true,
        assetCategories,
        stockTotalSAR, bondTotalSAR, fundTotalSAR,
        cryptoTotalSAR, forexTotalSAR, commodityTotalSAR,
      });
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'فشل في تحميل البيانات');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [fetchAll]);

  return { data, loading, error, refresh: fetchAll };
}
