'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { resolveAssetMarket } from '@/lib/asset-market';
import { parseActualInvestedCapitalSar } from '@/lib/profile-finance';

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
interface LiveMarketPrice {
  price: number;
  change?: number;
  changePct?: number;
  volume?: number;
  marketCap?: number;
  high52w?: number | null;
  low52w?: number | null;
  shortRatio?: number | null;
  shortPercentOfFloat?: number | null;
  sharesShort?: number | null;
  sharesOutstanding?: number | null;
  floatShares?: number | null;
  shortDataSource?: string | null;
}
interface ForexPair {
  symbol: string; name: string; price: number; change: number; changePct: number;
  baseCurrency: string; quoteCurrency: string; category: string;
}
interface LiveFundItem { symbol?: string; name: string; price?: number; change?: number; changePct?: number; type?: string; }
interface MarketHubQuote {
  symbol: string;
  name?: string;
  price: number;
  change?: number | null;
  changePct?: number | null;
  source?: string | null;
  lastUpdate?: number;
  volume?: number | null;
  marketCap?: number | null;
  high52w?: number | null;
  low52w?: number | null;
  shortRatio?: number | null;
  shortPercentOfFloat?: number | null;
  sharesShort?: number | null;
  sharesOutstanding?: number | null;
  floatShares?: number | null;
  shortDataSource?: string | null;
}
interface MarketHubResponse {
  success?: boolean;
  data?: Record<string, MarketHubQuote>;
}
type RawStock = {
  id?: string;
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  sector?: string;
  industry?: string;
  qty?: number;
  buyPrice?: number;
  currentPrice?: number;
  change?: number;
  changePct?: number;
  totalCost?: number | null;
  currentValue?: number | null;
  profitLoss?: number | null;
  profitLossPct?: number | null;
  buyCurrency?: string | null;
};
type RawBond = {
  id?: string;
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  type?: string;
  faceValue?: number;
  couponRate?: number;
  maturityDate?: string;
  qty?: number;
  buyPrice?: number;
  currentPrice?: number;
};
type RawFund = {
  id?: string;
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  fundType?: string;
  units?: number;
  buyPrice?: number;
  currentPrice?: number;
  ytdReturn?: number;
};
type RawPortfolio = {
  id?: string;
  name?: string;
  description?: string;
  type?: string;
  currency?: string;
  isActive?: boolean;
  stocks?: RawStock[];
  funds?: RawFund[];
  bonds?: RawBond[];
  [key: string]: unknown;
};

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
  computedPortfolioCost: number;
  totalProfitLoss: number;
  totalProfitLossPct: number;
  manualInvestedCapitalSar: number | null;
  capitalDifferenceSar: number | null;
  isManualCapitalApplied: boolean;
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
  totalPortfolioValue: 0,
  totalPortfolioCost: 0,
  computedPortfolioCost: 0,
  totalProfitLoss: 0,
  totalProfitLossPct: 0,
  manualInvestedCapitalSar: null,
  capitalDifferenceSar: null,
  isManualCapitalApplied: false,
  totalStocks: 0, totalBonds: 0, totalFunds: 0, isAuthenticated: false,
  assetCategories: [], stockTotalSAR: 0, bondTotalSAR: 0, fundTotalSAR: 0,
  cryptoTotalSAR: 0, forexTotalSAR: 0, commodityTotalSAR: 0,
};

function fetchWithTimeout(url: string, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function toNumber(value: unknown): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeMarketHubMap(payload: unknown): Record<string, MarketHubQuote> {
  const root = toRecord(payload) as MarketHubResponse;
  if (!root.success || !root.data || typeof root.data !== 'object') return {};
  return root.data;
}

function toTickerMap(quotes: Record<string, MarketHubQuote>): Record<string, TickerQuote> {
  const out: Record<string, TickerQuote> = {};
  for (const [symbol, quote] of Object.entries(quotes)) {
    const price = Number(quote.price);
    if (!Number.isFinite(price)) continue;
    out[symbol] = {
      price,
      change: Number.isFinite(Number(quote.change)) ? Number(quote.change) : 0,
      changePct: Number.isFinite(Number(quote.changePct)) ? Number(quote.changePct) : 0,
    };
  }
  return out;
}

function toForexPairs(quotes: Record<string, MarketHubQuote>): ForexPair[] {
  const out = new Map<string, ForexPair>();
  const major = new Set(['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD']);
  const arab = new Set(['USDSAR', 'USDAED', 'USDKWD', 'USDEGP', 'USDQAR', 'USDBHD', 'USDOMR', 'USDJOD']);
  const emerging = new Set(['USDTRY', 'USDCNY', 'USDINR', 'USDMXN', 'USDZAR']);

  const normalize = (symbol: string): string => {
    const upper = symbol.toUpperCase().replace(/[^A-Z=]/g, '');
    if (upper.endsWith('=X')) return upper.slice(0, -2);
    if (upper.length === 3 && !upper.startsWith('USD')) return `USD${upper}`;
    return upper;
  };

  for (const [rawSymbol, quote] of Object.entries(quotes)) {
    const normalized = normalize(rawSymbol);
    if (!normalized || normalized.length < 6) continue;
    const baseCurrency = normalized.slice(0, 3);
    const quoteCurrency = normalized.slice(3, 6);
    const canonical = `${baseCurrency}${quoteCurrency}`;
    const price = Number(quote.price);
    if (!Number.isFinite(price) || price <= 0) continue;
    if (out.has(canonical)) continue;

    let category = 'minor';
    if (major.has(canonical)) category = 'major';
    else if (arab.has(canonical)) category = 'arab';
    else if (emerging.has(canonical)) category = 'emerging';

    out.set(canonical, {
      symbol: canonical,
      name: `${baseCurrency}/${quoteCurrency}`,
      price,
      change: Number.isFinite(Number(quote.change)) ? Number(quote.change) : 0,
      changePct: Number.isFinite(Number(quote.changePct)) ? Number(quote.changePct) : 0,
      baseCurrency,
      quoteCurrency,
      category,
    });
  }

  return Array.from(out.values());
}

function toLiveFunds(quotes: Record<string, MarketHubQuote>): LiveFundItem[] {
  const out: LiveFundItem[] = [];
  for (const [symbol, quote] of Object.entries(quotes)) {
    const price = Number(quote.price);
    if (!Number.isFinite(price) || price <= 0) continue;
    const upper = symbol.toUpperCase();
    const type =
      upper.includes('SUKUK') ? 'sukuk'
        : upper.includes('REIT') || /^[0-9]{4}\.SR$/.test(upper) ? 'reit'
          : 'fund';

    out.push({
      symbol,
      name: quote.name || symbol,
      price,
      change: Number.isFinite(Number(quote.change)) ? Number(quote.change) : 0,
      changePct: Number.isFinite(Number(quote.changePct)) ? Number(quote.changePct) : 0,
      type,
    });
  }
  return out;
}

function toLivePriceMap(quotes: Record<string, MarketHubQuote>): Record<string, LiveMarketPrice> {
  const out: Record<string, LiveMarketPrice> = {};
  for (const [symbol, quote] of Object.entries(quotes)) {
    const price = Number(quote.price);
    if (!Number.isFinite(price)) continue;
    out[symbol] = {
      price,
      change: Number.isFinite(Number(quote.change)) ? Number(quote.change) : 0,
      changePct: Number.isFinite(Number(quote.changePct)) ? Number(quote.changePct) : 0,
      volume: toNumber(quote.volume),
      marketCap: toNumber(quote.marketCap),
      high52w: quote.high52w ?? null,
      low52w: quote.low52w ?? null,
      shortRatio: quote.shortRatio ?? null,
      shortPercentOfFloat: quote.shortPercentOfFloat ?? null,
      sharesShort: quote.sharesShort ?? null,
      sharesOutstanding: quote.sharesOutstanding ?? null,
      floatShares: quote.floatShares ?? null,
      shortDataSource: quote.shortDataSource ?? null,
    };
  }
  return out;
}

const EXCHANGE_SUFFIX_MAP: Record<string, string> = {
  TADAWUL: '.SR', SAUDI: '.SR', TASI: '.SR',
  ADX: '.AD', DFM: '.DU',
  KSE: '.KW', BOURSA: '.KW',
  QSE: '.QA', QATAR: '.QA',
  BHB: '.BH', BAHRAIN: '.BH',
  EGX: '.CA', EGYPT: '.CA',
  MSM: '.OM', MSX: '.OM', OMAN: '.OM',
  ASE: '.JO', AMMAN: '.JO',
  LSE: '.L', LONDON: '.L',
};

const PRICE_PREFIXES = ['SAUDI_', 'ADX_', 'DFM_', 'KSE_', 'QSE_', 'BHX_', 'MSX_', 'EGX_', 'ASE_', 'FUND_', 'US_'];

function buildPriceCandidates(symbol: string, exchange?: string): string[] {
  const normalized = String(symbol || '').trim().toUpperCase();
  if (!normalized) return [];
  const candidates = new Set<string>();
  const addCandidate = (candidate?: string | null) => {
    if (!candidate) return;
    const cleaned = candidate.trim().toUpperCase();
    if (!cleaned) return;
    candidates.add(cleaned);
    candidates.add(cleaned.replace(/\./g, '_'));
  };

  addCandidate(normalized);
  const dotIndex = normalized.indexOf('.');
  if (dotIndex > 0) addCandidate(normalized.substring(0, dotIndex));

  if (!normalized.includes('.') && exchange) {
    const upperExch = exchange.toUpperCase().trim();
    for (const [key, suffix] of Object.entries(EXCHANGE_SUFFIX_MAP)) {
      if (upperExch.includes(key)) {
        addCandidate(`${normalized}${suffix}`);
        break;
      }
    }
  }

  const baseCandidates = Array.from(candidates);
  for (const prefix of PRICE_PREFIXES) {
    for (const base of baseCandidates) addCandidate(`${prefix}${base}`);
  }

  return Array.from(candidates);
}

function resolvePriceEntry(prices: Record<string, LiveMarketPrice>, symbol: string, exchange?: string): LiveMarketPrice | null {
  const candidates = buildPriceCandidates(symbol, exchange);
  for (const candidate of candidates) {
    const entry = prices[candidate];
    if (entry?.price != null) return entry;
  }

  const lowerCandidates = new Set(candidates.map((item) => item.toLowerCase()));
  for (const [key, entry] of Object.entries(prices)) {
    if (lowerCandidates.has(key.toLowerCase()) && entry?.price != null) return entry;
  }
  return null;
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
      const [portfoliosRes, stocksHubRes, cryptoHubRes, forexHubRes, fundsHubRes, profileRes] = await Promise.allSettled([
        fetchWithTimeout('/api/portfolios', 10000).catch(() => null),
        fetchWithTimeout('/api/market-hub?domain=stocks', 10000).catch(() => null),
        fetchWithTimeout('/api/market-hub?domain=crypto', 8000).catch(() => null),
        fetchWithTimeout('/api/market-hub?domain=forex', 8000).catch(() => null),
        fetchWithTimeout('/api/market-hub?domain=funds', 8000).catch(() => null),
        fetchWithTimeout('/api/profile', 10000).catch(() => null),
      ]);

      let rawPortfolios: RawPortfolio[] = [];
      let ticker: Record<string, TickerQuote> = {};
      const crypto: Record<string, LiveCryptoItem> = {};
      let forex: ForexPair[] = [];
      let liveFunds: LiveFundItem[] = [];
      let livePrices: Record<string, LiveMarketPrice> = {};
      let manualInvestedCapitalSar: number | null = null;

      if (portfoliosRes.status === 'fulfilled' && portfoliosRes.value && portfoliosRes.value.ok) {
        try { const json = await portfoliosRes.value.json(); rawPortfolios = json.portfolios || []; } catch {}
      }

      if (profileRes.status === 'fulfilled' && profileRes.value && profileRes.value.ok) {
        try {
          const profileJson = await profileRes.value.json();
          manualInvestedCapitalSar = parseActualInvestedCapitalSar(profileJson?.profile?.preferences);
        } catch {
          manualInvestedCapitalSar = null;
        }
      }

      if (stocksHubRes.status === 'fulfilled' && stocksHubRes.value && stocksHubRes.value.ok) {
        try {
          const json = await stocksHubRes.value.json();
          const quotes = normalizeMarketHubMap(json);
          ticker = toTickerMap(quotes);
          livePrices = { ...livePrices, ...toLivePriceMap(quotes) };
        } catch {}
      }

      if (cryptoHubRes.status === 'fulfilled' && cryptoHubRes.value && cryptoHubRes.value.ok) {
        try {
          const json = await cryptoHubRes.value.json();
          const quotes = normalizeMarketHubMap(json);
          for (const [key, quote] of Object.entries(quotes)) {
            const price = Number(quote.price);
            if (!Number.isFinite(price) || price <= 0) continue;
            const item: LiveCryptoItem = {
              price,
              change: Number.isFinite(Number(quote.change)) ? Number(quote.change) : 0,
              changePct: Number.isFinite(Number(quote.changePct)) ? Number(quote.changePct) : 0,
              source: quote.source || 'market-hub',
              lastUpdate: quote.lastUpdate || Date.now(),
            };
            crypto[key] = item;

            const base = key.replace(/-USD$/i, '').replace(/-USDT$/i, '');
            if (base && !crypto[base]) crypto[base] = item;
          }

          ticker = { ...ticker, ...toTickerMap(quotes) };
          livePrices = { ...livePrices, ...toLivePriceMap(quotes) };
        } catch {}
      }

      if (forexHubRes.status === 'fulfilled' && forexHubRes.value && forexHubRes.value.ok) {
        try {
          const json = await forexHubRes.value.json();
          const quotes = normalizeMarketHubMap(json);
          forex = toForexPairs(quotes);
          ticker = { ...ticker, ...toTickerMap(quotes) };
          livePrices = { ...livePrices, ...toLivePriceMap(quotes) };
        } catch {}
      }

      if (fundsHubRes.status === 'fulfilled' && fundsHubRes.value && fundsHubRes.value.ok) {
        try {
          const json = await fundsHubRes.value.json();
          const quotes = normalizeMarketHubMap(json);
          liveFunds = toLiveFunds(quotes);
          ticker = { ...ticker, ...toTickerMap(quotes) };
          livePrices = { ...livePrices, ...toLivePriceMap(quotes) };
        } catch {}
      }

      const symbolsToFetch = Array.from(new Set(
        rawPortfolios.flatMap((portfolio) => [
          ...(portfolio?.stocks || []).map((stock) => String(stock?.symbol || '').trim().toUpperCase()),
          ...(portfolio?.funds || []).map((fund) => String(fund?.symbol || '').trim().toUpperCase()),
          ...(portfolio?.bonds || []).map((bond) => String(bond?.symbol || '').trim().toUpperCase()),
        ]).filter(Boolean)
      ));

      if (symbolsToFetch.length > 0) {
        try {
          const pricesRes = await fetchWithTimeout(
            `/api/market-hub?domain=stocks&symbols=${encodeURIComponent(symbolsToFetch.join(','))}`,
            12000
          ).catch(() => null);
          if (pricesRes && pricesRes.ok) {
            const pricesJson = await pricesRes.json();
            const symbolQuotes = normalizeMarketHubMap(pricesJson);
            if (Object.keys(symbolQuotes).length > 0) {
              livePrices = { ...livePrices, ...toLivePriceMap(symbolQuotes) };
              ticker = { ...ticker, ...toTickerMap(symbolQuotes) };
            }
          }
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
        const pCurrency = String(p.currency || 'SAR');
        const pStocks: DashboardStock[] = [];
        const pBonds: DashboardBond[] = [];
        const pFunds: DashboardFund[] = [];

        for (const s of (p.stocks || [])) {
          const symbol = String(s.symbol || '').trim().toUpperCase();
          if (!symbol) continue;
          const name = String(s.name || symbol);
          const qty = Number(s.qty || 0);
          const buyPrice = Number(s.buyPrice || 0);
          const sector = s.sector || 'أخرى';
          const exchange = String(s.exchange || '').toUpperCase();
          const isCrypto = sector === 'Cryptocurrency' || exchange === 'CRYPTO';
          const isForex = sector === 'Forex' || exchange === 'FOREX';
          const normalizedSector = isCrypto ? 'Cryptocurrency' : isForex ? 'Forex' : sector;
          const stockClass = isCrypto ? 'crypto' : isForex ? 'forex' : 'stock';
          const market = getCurrencyForAsset({
            symbol,
            name,
            exchange: s.exchange,
            currency: s.currency,
            buyCurrency: s.buyCurrency || undefined,
          }, pCurrency, stockClass);
          const currency = market.currency;
          const buyCurrency = String(s.buyCurrency || currency || pCurrency).toUpperCase();
          const fallbackPrice = s.currentPrice ?? buyPrice;
          const marketPriceEntry = resolvePriceEntry(livePrices, symbol, s.exchange);
          const hasStoredCost = Number.isFinite(Number(s.totalCost));
          const hasStoredValue = Number.isFinite(Number(s.currentValue));

          let livePrice = marketPriceEntry?.price ?? fallbackPrice;
          let liveChangePct = Number(s.changePct || 0);

          if (isCrypto) {
            const cryptoKey = Object.keys(crypto).find(k => k.startsWith(symbol.replace('-USD', '').replace('-USDT', '')));
            if (marketPriceEntry?.price == null && cryptoKey && crypto[cryptoKey]) {
              livePrice = crypto[cryptoKey].price;
              liveChangePct = crypto[cryptoKey].changePct;
            } else if (marketPriceEntry?.price != null) {
              livePrice = marketPriceEntry.price;
              liveChangePct = marketPriceEntry.changePct ?? liveChangePct;
            }
          }

          if (isForex) {
            const forexPair = forex.find(f =>
              `${f.baseCurrency}/${f.quoteCurrency}` === name ||
              f.symbol === symbol ||
              `${f.baseCurrency}${f.quoteCurrency}` === symbol.replace('=X', '').replace('/','')
            );
            if (marketPriceEntry?.price == null && forexPair) {
              livePrice = forexPair.price;
              liveChangePct = forexPair.changePct;
            } else if (marketPriceEntry?.price != null) {
              livePrice = marketPriceEntry.price;
              liveChangePct = marketPriceEntry.changePct ?? liveChangePct;
            }
          }

          const value = (marketPriceEntry?.price != null || Number.isFinite(Number(s.currentPrice)))
            ? qty * livePrice
            : (hasStoredValue ? Number(s.currentValue) : qty * buyPrice);
          const cost = hasStoredCost ? Number(s.totalCost) : qty * buyPrice;
          const pl = value - cost;
          const plPct = cost > 0 ? (pl / cost) * 100 : 0;

          const valueSAR = toSAR(value, currency);
          const costSAR = toSAR(cost, buyCurrency);

          const stock: DashboardStock = {
            id: String(s.id || `${p.id || 'portfolio'}-${symbol}`),
            symbol,
            name,
            industry: s.industry,
            qty,
            buyPrice,
            exchange: market.exchange || s.exchange,
            currency,
            sector: normalizedSector,
            portfolioCurrency: pCurrency,
            buyCurrency,
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
          const symbol = String(b.symbol || '').trim().toUpperCase();
          if (!symbol) continue;
          const name = String(b.name || symbol);
          const qty = Number(b.qty || 0);
          const buyPrice = Number(b.buyPrice || 0);
          const faceValue = Number(b.faceValue || 0);
          const market = getCurrencyForAsset({
            symbol,
            name,
            exchange: b.exchange,
            currency: b.currency,
          }, pCurrency, 'bond');
          const currency = market.currency;
          const marketPrice = resolvePriceEntry(livePrices, symbol, b.exchange)?.price;
          const currentPrice = marketPrice ?? b.currentPrice ?? buyPrice;
          const value = qty * faceValue * (currentPrice / 100);
          const cost = qty * faceValue * (buyPrice / 100);
          const valueSAR = toSAR(value, currency);
          const costSAR = toSAR(cost, currency);

          const bond: DashboardBond = {
            id: String(b.id || `${p.id || 'portfolio'}-${symbol}`),
            symbol,
            name,
            type: String(b.type || 'bond'),
            faceValue,
            couponRate: b.couponRate,
            maturityDate: b.maturityDate,
            qty,
            buyPrice,
            exchange: market.exchange || b.exchange,
            currency,
            portfolioCurrency: pCurrency,
            currentPrice,
            valueSAR, costSAR, plSAR: valueSAR - costSAR,
          };
          pBonds.push(bond);
          allBonds.push(bond);
          bondTotalSAR += valueSAR;
          bondCostSAR += costSAR;
        }

        for (const f of (p.funds || [])) {
          const symbol = String(f.symbol || '').trim().toUpperCase();
          const name = String(f.name || symbol || 'Fund');
          const units = Number(f.units || 0);
          const buyPrice = Number(f.buyPrice || 0);
          const fundType = String(f.fundType || '');
          const fundClass = fundType === 'commodities' ? 'commodity' : 'fund';
          const market = getCurrencyForAsset({
            symbol,
            name,
            exchange: f.exchange,
            currency: f.currency,
          }, pCurrency, fundClass);
          const currency = market.currency;
          let livePrice: number | undefined;
          const marketPrice = symbol ? resolvePriceEntry(livePrices, symbol, f.exchange)?.price : undefined;

          if (marketPrice != null) {
            livePrice = marketPrice;
          } else if (symbol && ticker[symbol]) {
            livePrice = ticker[symbol].price;
          }

          const price = livePrice ?? f.currentPrice ?? buyPrice;
          const value = units * price;
          const cost = units * buyPrice;
          const valueSAR = toSAR(value, currency);
          const costSAR = toSAR(cost, currency);

          const fund: DashboardFund = {
            id: String(f.id || `${p.id || 'portfolio'}-${symbol || name}`),
            symbol: symbol || undefined,
            name,
            fundType,
            units,
            buyPrice,
            ytdReturn: f.ytdReturn,
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
          id: String(p.id || `portfolio-${String(p.name || 'default')}`),
          name: String(p.name || 'محفظة'),
          description: typeof p.description === 'string' ? p.description : undefined,
          type: String(p.type || 'mixed'),
          currency: pCurrency,
          isActive: Boolean(p.isActive),
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
      const computedPortfolioCost =
        stockCostSAR + bondCostSAR + fundCostSAR + cryptoCostSAR + forexCostSAR + commodityCostSAR;
      const hasManualCapital = typeof manualInvestedCapitalSar === 'number' && Number.isFinite(manualInvestedCapitalSar) && manualInvestedCapitalSar > 0;
      const totalPortfolioCost = hasManualCapital ? manualInvestedCapitalSar! : computedPortfolioCost;
      const totalProfitLoss = totalPortfolioValue - totalPortfolioCost;
      const totalProfitLossPct = totalPortfolioCost > 0 ? (totalProfitLoss / totalPortfolioCost) * 100 : 0;
      const capitalDifferenceSar = hasManualCapital ? (manualInvestedCapitalSar! - computedPortfolioCost) : null;

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
        totalPortfolioValue,
        totalPortfolioCost,
        computedPortfolioCost,
        totalProfitLoss,
        totalProfitLossPct,
        manualInvestedCapitalSar,
        capitalDifferenceSar,
        isManualCapitalApplied: hasManualCapital,
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
