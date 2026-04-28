'use client';

import { Fragment, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import {
  fetchAllPortfoliosSnapshots,
  persistPortfolioSnapshot,
  type PortfolioSnapshot,
  type SellRecord,
} from '@/lib/export-utils';
import { convertCurrency, formatCurrency, formatCurrencyByCode, formatNumber, formatPercent } from '@/lib/helpers';
import { resolveAssetMarket } from '@/lib/asset-market';
import { parseActualInvestedCapitalSar } from '@/lib/profile-finance';
import { useToast } from '@/hooks/use-toast';
import { calcTradeFees, getTaxDefaults } from '@/lib/tax-settings';
import { calcPurificationAmount, fetchPurificationMetrics, ZERO_PURIFICATION_METRICS } from '@/lib/purification';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line,
} from 'recharts';
import {
  Search, Layers, TrendingUp, TrendingDown, Wallet, Filter,
  PieChart as PieChartIcon, RefreshCw,
  BarChart3, Banknote, Activity, ArrowRightLeft, Edit2, ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AggregatedAsset {
  id: string;
  portfolioId: string;
  portfolioName: string;
  symbol: string;
  name: string;
  assetType: string;
  qty: number;
  totalCost: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  totalCostSAR: number;
  totalValueSAR: number;
  profitLoss: number;
  profitLossSAR: number;
  profitLossPct: number;
  high52w: number | null;
  low52w: number | null;
  marketCap?: number | null;
  priceSource?: string | null;
  volume?: number | null;
  averageVolume?: number | null;
  shortPercentOfFloat?: number | null;
  shortRatio?: number | null;
  sharesShort?: number | null;
  sharesOutstanding?: number | null;
  floatShares?: number | null;
  shortDataSource?: string | null;
  currency: string;
  shariaStatus: string | null;
  shariaBilad: string | null;
  shariaRajhi: string | null;
  shariaMaqasid: string | null;
  shariaZero: string | null;
  positions: number;
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: 'أسهم', fund: 'صناديق', commodity: 'سلع ومعادن',
  bond: 'سندات', sukuk: 'صكوك', crypto: 'عملات مشفرة', forex: 'فوركس',
};

const ASSET_TYPE_COLORS: Record<string, string> = {
  stock: 'bg-blue-100 text-blue-700', fund: 'bg-green-100 text-green-700',
  commodity: 'bg-amber-100 text-amber-700', bond: 'bg-purple-100 text-purple-700',
  sukuk: 'bg-purple-100 text-purple-700', crypto: 'bg-orange-100 text-orange-700',
  forex: 'bg-teal-100 text-teal-700',
};

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#f97316', '#14b8a6', '#ef4444', '#6366f1'];

const CURRENCY_ORDER = ['SAR', 'AED', 'KWD', 'QAR', 'BHD', 'OMR', 'JOD', 'EGP', 'USD', 'EUR', 'GBP'] as const;
const CURRENCY_META: Record<string, { symbol: string; name: string; decimals: number }> = {
  SAR: { symbol: 'ر.س', name: 'ريال سعودي', decimals: 2 },
  AED: { symbol: 'د.إ', name: 'درهم إماراتي', decimals: 2 },
  KWD: { symbol: 'د.ك', name: 'دينار كويتي', decimals: 3 },
  QAR: { symbol: 'ر.ق', name: 'ريال قطري', decimals: 2 },
  BHD: { symbol: 'د.ب', name: 'دينار بحريني', decimals: 3 },
  OMR: { symbol: 'ر.ع', name: 'ريال عماني', decimals: 3 },
  JOD: { symbol: 'د.أ', name: 'دينار أردني', decimals: 3 },
  EGP: { symbol: 'ج.م', name: 'جنيه مصري', decimals: 2 },
  USD: { symbol: '$', name: 'دولار أمريكي', decimals: 2 },
  EUR: { symbol: '€', name: 'يورو', decimals: 2 },
  GBP: { symbol: '£', name: 'جنيه إسترليني', decimals: 2 },
};

function normalizeCurrencyCode(value?: string | null): string {
  const code = String(value || '').trim().toUpperCase();
  return code || 'SAR';
}

function currencySymbol(code?: string | null): string {
  const normalized = normalizeCurrencyCode(code);
  return CURRENCY_META[normalized]?.symbol ?? normalized;
}

function currencyName(code?: string | null): string {
  const normalized = normalizeCurrencyCode(code);
  return CURRENCY_META[normalized]?.name ?? normalized;
}

function orderCurrencies(codes: Iterable<string>): string[] {
  return Array.from(new Set(Array.from(codes).map((code) => normalizeCurrencyCode(code))))
    .filter(Boolean)
    .sort((a, b) => {
      const ai = CURRENCY_ORDER.indexOf(a as (typeof CURRENCY_ORDER)[number]);
      const bi = CURRENCY_ORDER.indexOf(b as (typeof CURRENCY_ORDER)[number]);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
}

const EXCHANGE_RATES: Record<string, number> = {
  SAR: 1, USD: 3.75, EUR: 4.05, GBP: 4.75, AED: 1.021, KWD: 12.18, QAR: 1.03, BHD: 9.95, EGP: 0.075, OMR: 9.74, JOD: 5.29,
};

function toSAR(amount: number, currency: string): number {
  return amount * (EXCHANGE_RATES[currency] || 1);
}

function resolveCurrency(
  symbol: string, exchange?: string, storedCurrency?: string,
  assetClass: 'stock' | 'fund' | 'bond' | 'crypto' | 'forex' | 'commodity' = 'stock'
): string {
  const market = resolveAssetMarket({
    symbol,
    exchange,
    currency: storedCurrency,
    assetClass,
  });
  return (market.currency || 'SAR').toUpperCase();
}

const USD_SYMBOLS = new Set([
  'PLUG', 'NVTS', 'BZAI', 'BTC', 'ETH', 'BNB', 'SOL', 'XRP',
  'DOGE', 'ADA', 'DOT', 'MATIC', 'AVAX', 'LINK', 'UNI',
  'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X',
  'GC=F', 'SI=F', 'CL=F', 'HG=F', 'PL=F', 'PA=F',
  'SPY', 'QQQ', 'QQQX', 'IWM', 'DIA', 'VTI', 'VOO',
]);

// ── Same API the watchlist uses ───────────────────────────

interface ApiQuote {
  price: number;
  change?: number;
  changePct?: number;
  high52w?: number | null;
  low52w?: number | null;
  marketCap?: number | null;
  source?: string;
  volume?: number | null;
  averageVolume?: number | null;
  shortPercentOfFloat?: number | null;
  shortRatio?: number | null;
  sharesShort?: number | null;
  sharesOutstanding?: number | null;
  floatShares?: number | null;
  shortDataSource?: string | null;
  high?: number;
  low?: number;
}

const PRICE_PREFIXES = ['SAUDI_', 'ADX_', 'DFM_', 'KSE_', 'QSE_', 'BHX_', 'MSX_', 'EGX_', 'ASE_', 'FUND_', 'US_'];

function buildQuoteCandidates(symbol: string): string[] {
  const normalized = String(symbol || '').trim().toUpperCase();
  if (!normalized) return [];

  const candidates = new Set<string>();
  const add = (value?: string | null) => {
    if (!value) return;
    const cleaned = String(value).trim().toUpperCase();
    if (!cleaned) return;
    candidates.add(cleaned);
    candidates.add(cleaned.replace(/\./g, '_'));
  };

  add(normalized);
  add(normalized.replace(/\.SAU$/, '.SR'));

  const base = normalized
    .replace(/\.SAU$/, '')
    .replace(/\.SR$/, '');

  if (base) add(base);

  if (/^\d{3,6}$/.test(base)) {
    add(`${base}.SR`);
  }

  if (/^\d{3,6}\.SR$/.test(normalized)) {
    add(normalized.replace(/\.SR$/, ''));
  }

  const baseCandidates = Array.from(candidates);
  for (const prefix of PRICE_PREFIXES) {
    for (const key of baseCandidates) add(`${prefix}${key}`);
  }

  return Array.from(candidates);
}

function resolveLiveQuote(quotes: Record<string, ApiQuote>, symbol: string): ApiQuote | null {
  const candidates = buildQuoteCandidates(symbol);
  for (const candidate of candidates) {
    const quote = quotes[candidate];
    if (quote?.price != null) return quote;
  }

  const loweredCandidates = new Set(candidates.map((candidate) => candidate.toLowerCase()));
  for (const [key, quote] of Object.entries(quotes)) {
    if (loweredCandidates.has(key.toLowerCase()) && quote?.price != null) return quote;
  }
  return null;
}

const ACTION_BUTTON_BASE_CLASS = 'h-8 shrink-0 whitespace-nowrap rounded-lg border-2 px-2.5 text-[11px] font-bold shadow-sm transition-colors';
const ACTION_MOVE_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300`;
const ACTION_EDIT_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300`;
const ACTION_SELL_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300`;

type RankingFilter = 'default' | 'highest-value' | 'lowest-value' | 'highest-profit' | 'largest-loss';
type PositionSource = 'stocks' | 'funds' | 'bonds';
type LocalDividendRecord = {
  status?: string;
  totalDividend?: number;
  currency?: string;
};

type AssetPositionRef = {
  portfolioId: string;
  portfolioName: string;
  source: PositionSource;
  entryId: string;
  qty: number;
  buyPrice: number;
};

async function fetchLiveQuotes(symbols: string[]): Promise<Record<string, ApiQuote>> {
  if (symbols.length === 0) return {};
  try {
    const res = await fetch(
      `/api/prices?symbols=${encodeURIComponent(symbols.join(','))}`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return {};
    const json = await res.json();
    return json.success && json.data ? json.data : {};
  } catch {
    return {};
  }
}

interface ShariaSearchResult {
  symbol: string;
  shariaStatus?: string;
  shariaBilad?: string;
  shariaRajhi?: string;
  shariaMaqasid?: string;
  shariaZero?: string;
}

async function fetchShariaFromSearch(symbol: string): Promise<Partial<ShariaSearchResult> | null> {
  const clean = symbol.trim().toUpperCase();
  for (const type of ['stock', 'fund'] as const) {
    try {
      const res = await fetch(
        `/api/market/search?q=${encodeURIComponent(clean)}&type=${type}`,
        { cache: 'no-store' }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const results: ShariaSearchResult[] = Array.isArray(data?.results) ? data.results : [];
      const match = results.find(r => r.symbol.toUpperCase() === clean)
        || results.find(r => r.symbol.toUpperCase().startsWith(clean));
      if (match && (match.shariaStatus || match.shariaBilad)) {
        return match;
      }
    } catch {
      continue;
    }
  }
  return null;
}

const todayStr = () => new Date().toISOString().split('T')[0];

function buildAssetKey(portfolioId: string, symbol: string, type: string, currency: string): string {
  return `${portfolioId || 'no-portfolio'}::${symbol}::${type}::${currency}`;
}

const LOCAL_DIVIDENDS_KEY = 'portfolio_dividends';

// ── Component ─────────────────────────────────────────────

export default function ConsolidatedPortfolioPage() {
  const { toast } = useToast();
  const { snapshot, portfolios } = usePortfolioSnapshot();
  const [summaryCurrency, setSummaryCurrency] = useState('SAR');
  const [manualInvestedCapitalSar, setManualInvestedCapitalSar] = useState<number | null>(null);
  const [allSnapshots, setAllSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [search, setSearch] = useState('');
  const [assetFilter, setAssetFilter] = useState('all');
  const [portfolioFilter, setPortfolioFilter] = useState('all');
  const [rankingFilter, setRankingFilter] = useState<RankingFilter>('highest-profit');
  const [liveQuotes, setLiveQuotes] = useState<Record<string, ApiQuote>>({});
  const [shariaMap, setShariaMap] = useState<Record<string, Partial<ShariaSearchResult>>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [actionSaving, setActionSaving] = useState(false);
  const [paidDividendsByCurrency, setPaidDividendsByCurrency] = useState<Record<string, number>>({});
  const pricesFetched = useRef(false);
  const shariaFetched = useRef(false);

  const [sellOpen, setSellOpen] = useState(false);
  const [sellAsset, setSellAsset] = useState<AggregatedAsset | null>(null);
  const [sellForm, setSellForm] = useState({
    qty: '',
    sellPrice: '',
    sellDate: todayStr(),
    customBrok: '',
    customVat: '',
    customOtherFees: '',
    customPurification: '',
  });
  const [sellPurification, setSellPurification] = useState(ZERO_PURIFICATION_METRICS);
  const [sellPurificationLoading, setSellPurificationLoading] = useState(false);

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveAsset, setMoveAsset] = useState<AggregatedAsset | null>(null);
  const [moveSourcePortfolioId, setMoveSourcePortfolioId] = useState('');
  const [moveTargetPortfolioId, setMoveTargetPortfolioId] = useState('');
  const [moveQty, setMoveQty] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<AggregatedAsset | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    currentPrice: '',
    high52w: '',
    low52w: '',
    customBrok: '',
    customVat: '',
    customOtherFees: '',
  });

  useEffect(() => {
    let active = true;
    if (portfolios.length === 0) {
      setAllSnapshots(snapshot ? [snapshot] : []);
      return () => { active = false; };
    }
    fetchAllPortfoliosSnapshots(portfolios).then((snaps) => {
      if (active) setAllSnapshots(snaps);
    });
    return () => { active = false; };
  }, [portfolios, snapshot]);

  useEffect(() => {
    if (snapshot?.currency) {
      setSummaryCurrency((prev) => (prev === 'SAR' ? normalizeCurrencyCode(snapshot.currency) : prev));
    }
  }, [snapshot?.currency]);

  useEffect(() => {
    let active = true;
    const loadManualCapital = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const response = await fetch('/api/profile', {
          cache: 'no-store',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) {
          if (active) setManualInvestedCapitalSar(null);
          return;
        }
        const payload = await response.json().catch(() => null);
        if (!active) return;
        setManualInvestedCapitalSar(parseActualInvestedCapitalSar(payload?.profile?.preferences));
      } catch {
        if (active) setManualInvestedCapitalSar(null);
      }
    };

    void loadManualCapital();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadPaidDividends = () => {
      try {
        const raw = localStorage.getItem(LOCAL_DIVIDENDS_KEY);
        const parsed = raw ? (JSON.parse(raw) as LocalDividendRecord[]) : [];
        const map: Record<string, number> = {};

        for (const record of Array.isArray(parsed) ? parsed : []) {
          if (String(record?.status || '').toLowerCase() !== 'paid') continue;
          const amount = Number(record?.totalDividend || 0);
          if (!Number.isFinite(amount) || amount <= 0) continue;
          const code = normalizeCurrencyCode(record?.currency);
          map[code] = (map[code] || 0) + amount;
        }

        setPaidDividendsByCurrency(map);
      } catch {
        setPaidDividendsByCurrency({});
      }
    };

    loadPaidDividends();
    window.addEventListener('storage', loadPaidDividends);
    return () => window.removeEventListener('storage', loadPaidDividends);
  }, []);

  const getStockCurrency = useCallback((s: any): string => {
    const sector = s.sector || '';
    const exchange = String(s.exchange || '').toUpperCase();
    const isCrypto = sector === 'Cryptocurrency' || exchange === 'CRYPTO';
    const isForex = sector === 'Forex' || exchange === 'FOREX';
    const assetClass = isCrypto ? 'crypto' : isForex ? 'forex' : 'stock';
    if (USD_SYMBOLS.has(s.symbol?.toUpperCase())) return 'USD';
    return resolveCurrency(s.symbol, s.exchange, s.currency, assetClass);
  }, []);

  const getFundCurrency = useCallback((f: any): string => {
    const isCommodity = f.fundType === 'commodities';
    const assetClass = isCommodity ? 'commodity' : 'fund';
    if (isCommodity) return 'USD';
    if (USD_SYMBOLS.has((f.symbol || '').toUpperCase())) return 'USD';
    const notes = f.notes && typeof f.notes === 'object' ? f.notes : {};
    if (notes.currency) return String(notes.currency).toUpperCase();
    return resolveCurrency(f.symbol || f.name, f.exchange, f.currency, assetClass);
  }, []);

  const stockAssetType = useCallback((stock: any): AggregatedAsset['assetType'] => {
    const sector = stock.sector || '';
    const exchange = String(stock.exchange || '').toUpperCase();
    if (sector === 'Cryptocurrency' || exchange === 'CRYPTO') return 'crypto';
    if (sector === 'Forex' || exchange === 'FOREX') return 'forex';
    return 'stock';
  }, []);

  const stockAssetKey = useCallback((stock: any, portfolioId: string = '') => {
    const type = stockAssetType(stock);
    return buildAssetKey(portfolioId, stock.symbol, type, getStockCurrency(stock));
  }, [getStockCurrency, stockAssetType]);

  const fundAssetType = useCallback((fund: any): AggregatedAsset['assetType'] => {
    return fund.fundType === 'commodities' ? 'commodity' : 'fund';
  }, []);

  const fundAssetKey = useCallback((fund: any, portfolioId: string = '') => {
    const type = fundAssetType(fund);
    return buildAssetKey(portfolioId, fund.symbol || fund.name, type, getFundCurrency(fund));
  }, [fundAssetType, getFundCurrency]);

  const bondAssetType = useCallback((bond: any): AggregatedAsset['assetType'] => {
    return bond.type === 'sukuk' ? 'sukuk' : 'bond';
  }, []);

  const bondAssetKey = useCallback((bond: any, portfolioId: string = '') => {
    const type = bondAssetType(bond);
    const currency = resolveCurrency(bond.symbol, bond.exchange, bond.currency, 'bond');
    return buildAssetKey(portfolioId, bond.symbol, type, currency);
  }, [bondAssetType]);

  const aggregatedAssets = useMemo(() => {
    const map = new Map<string, AggregatedAsset>();

    const processAsset = (
      portfolioId: string,
      portfolioName: string,
      symbol: string, name: string, type: string,
      qty: number, buyPrice: number, currentPrice: number,
      high52w: number | null, low52w: number | null, currency: string,
      shariaStatus: string | null, shariaBilad: string | null, shariaRajhi: string | null,
      shariaMaqasid: string | null, shariaZero: string | null,
      faceValue: number = 1
    ) => {
      const safeCurrency = currency || 'SAR';
      const key = buildAssetKey(portfolioId, symbol, type, safeCurrency);
      const isBond = type === 'bond' || type === 'sukuk';
      const cost = isBond ? qty * faceValue * (buyPrice / 100) : qty * buyPrice;
      const value = isBond ? qty * faceValue * (currentPrice / 100) : qty * currentPrice;
      const costSAR = toSAR(cost, safeCurrency);
      const valueSAR = toSAR(value, safeCurrency);

      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.qty += qty;
        existing.totalCost += cost;
        existing.totalValue += value;
        existing.totalCostSAR += costSAR;
        existing.totalValueSAR += valueSAR;
        existing.positions += 1;

        if (isBond) {
          existing.averageBuyPrice = existing.qty > 0 ? (existing.totalCost / (existing.qty * faceValue)) * 100 : 0;
        } else {
          existing.averageBuyPrice = existing.qty > 0 ? existing.totalCost / existing.qty : 0;
        }

        if (currentPrice > 0) existing.currentPrice = currentPrice;
        existing.profitLoss = existing.totalValue - existing.totalCost;
        existing.profitLossSAR = existing.totalValueSAR - existing.totalCostSAR;
        existing.profitLossPct = existing.totalCost > 0 ? (existing.profitLoss / existing.totalCost) * 100 : 0;

        if (high52w != null) existing.high52w = Math.max(existing.high52w ?? 0, high52w);
        if (low52w != null) existing.low52w = existing.low52w != null ? Math.min(existing.low52w, low52w) : low52w;

        if (shariaStatus && !existing.shariaStatus) existing.shariaStatus = shariaStatus;
        if (shariaBilad && !existing.shariaBilad) existing.shariaBilad = shariaBilad;
        if (shariaRajhi && !existing.shariaRajhi) existing.shariaRajhi = shariaRajhi;
        if (shariaMaqasid && !existing.shariaMaqasid) existing.shariaMaqasid = shariaMaqasid;
        if (shariaZero && !existing.shariaZero) existing.shariaZero = shariaZero;
      } else {
        map.set(key, {
          id: key, portfolioId, portfolioName, symbol, name, assetType: type,
          qty, totalCost: cost, averageBuyPrice: buyPrice,
          currentPrice: currentPrice, totalValue: value,
          totalCostSAR: costSAR, totalValueSAR: valueSAR,
          profitLoss: value - cost,
          profitLossSAR: valueSAR - costSAR,
          profitLossPct: cost > 0 ? ((value - cost) / cost) * 100 : 0,
          high52w, low52w, currency: safeCurrency,
          shariaStatus, shariaBilad, shariaRajhi, shariaMaqasid, shariaZero,
          positions: 1,
        });
      }
    };

    allSnapshots.forEach(snap => {
      const portfolioId = snap.portfolioId || '';
      const portfolioName = snap.portfolioName || 'محفظة';
      snap.stocks?.forEach(s => {
        let type = 'stock';
        const sector = s.sector || '';
        const exchange = String(s.exchange || '').toUpperCase();
        if (sector === 'Cryptocurrency' || exchange === 'CRYPTO') type = 'crypto';
        if (sector === 'Forex' || exchange === 'FOREX') type = 'forex';
        const curPrice = s.currentPrice ?? s.buyPrice ?? 0;
        const cur = getStockCurrency(s);
        processAsset(
          portfolioId, portfolioName,
          s.symbol, s.name || s.symbol, type,
          s.qty ?? 0, s.buyPrice ?? 0, curPrice,
          s.high52w ?? null, s.low52w ?? null, cur,
          s.shariaStatus ?? null, s.shariaBilad ?? null, s.shariaRajhi ?? null,
          s.shariaMaqasid ?? null, s.shariaZero ?? null
        );
      });

      snap.funds?.forEach(f => {
        const type = f.fundType === 'commodities' ? 'commodity' : 'fund';
        const curPrice = f.currentPrice ?? f.buyPrice ?? 0;
        const cur = getFundCurrency(f);
        processAsset(
          portfolioId, portfolioName,
          f.symbol || f.name, f.name, type,
          f.units ?? 0, f.buyPrice ?? 0, curPrice,
          f.high52w ?? null, f.low52w ?? null, cur,
          f.shariaStatus ?? null, f.shariaBilad ?? null, f.shariaRajhi ?? null,
          f.shariaMaqasid ?? null, f.shariaZero ?? null
        );
      });

      snap.bonds?.forEach(b => {
        const type = b.type === 'sukuk' ? 'sukuk' : 'bond';
        const curPrice = b.currentPrice ?? b.buyPrice ?? 0;
        const faceVal = b.faceValue || 1000;
        const cur = resolveCurrency(b.symbol, b.exchange, b.currency, 'bond');
        const shariaStatus = type === 'sukuk' ? 'Compliant' : (b.shariaStatus ?? null);
        processAsset(
          portfolioId, portfolioName,
          b.symbol, b.name || b.symbol, type,
          b.qty ?? 0, b.buyPrice ?? 0, curPrice,
          b.high52w ?? null, b.low52w ?? null, cur,
          shariaStatus, b.shariaBilad ?? null, b.shariaRajhi ?? null,
          b.shariaMaqasid ?? null, b.shariaZero ?? null,
          faceVal
        );
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalValueSAR - a.totalValueSAR);
  }, [allSnapshots, getStockCurrency, getFundCurrency]);

  // ── Fetch live prices (same as watchlist) ─────────────────

  const fetchAllLiveData = useCallback(async () => {
    if (aggregatedAssets.length === 0) return;
    setLoadingPrices(true);

    const symbols = aggregatedAssets.map(a => a.symbol).filter(Boolean);

    const quotes = await fetchLiveQuotes(symbols);
    if (Object.keys(quotes).length > 0) {
      setLiveQuotes(quotes);
    }

    setLoadingPrices(false);
  }, [aggregatedAssets]);

  // ── Fetch sharia from /api/market/search (same as watchlist) ──

  const fetchAllSharia = useCallback(async () => {
    if (aggregatedAssets.length === 0) return;

    const needsSharia = aggregatedAssets.filter(a =>
      !a.shariaBilad && !a.shariaRajhi && !a.shariaMaqasid && !a.shariaZero
    );
    if (needsSharia.length === 0) return;

    const results: Record<string, Partial<ShariaSearchResult>> = {};

    await Promise.all(
      needsSharia.map(async (asset) => {
        const data = await fetchShariaFromSearch(asset.symbol);
        if (data) {
          results[asset.symbol] = data;
        }
      })
    );

    if (Object.keys(results).length > 0) {
      setShariaMap(prev => ({ ...prev, ...results }));
    }
  }, [aggregatedAssets]);

  useEffect(() => {
    if (aggregatedAssets.length > 0 && !pricesFetched.current) {
      pricesFetched.current = true;
      fetchAllLiveData();
    }
  }, [aggregatedAssets, fetchAllLiveData]);

  useEffect(() => {
    if (aggregatedAssets.length > 0 && !shariaFetched.current) {
      shariaFetched.current = true;
      fetchAllSharia();
    }
  }, [aggregatedAssets, fetchAllSharia]);

  // ── Enrich assets with live quotes + sharia ──────────────

  const enrichedAssets = useMemo(() => {
    return aggregatedAssets.map(asset => {
      const q = resolveLiveQuote(liveQuotes, asset.symbol);
      const sh = shariaMap[asset.symbol] || shariaMap[asset.symbol.toUpperCase()];

      let currentPrice = asset.currentPrice;
      let high52w = asset.high52w;
      let low52w = asset.low52w;

      if (q) {
        if (q.price) currentPrice = q.price;
        if (q.high52w != null) high52w = q.high52w;
        if (q.low52w != null) low52w = q.low52w;
      }

      const isBond = asset.assetType === 'bond' || asset.assetType === 'sukuk';
      const faceValue = 1000;
      const totalValue = isBond ? asset.qty * faceValue * (currentPrice / 100) : asset.qty * currentPrice;
      const totalValueSAR = toSAR(totalValue, asset.currency);
      const profitLoss = totalValue - asset.totalCost;
      const profitLossSAR = totalValueSAR - asset.totalCostSAR;
      const profitLossPct = asset.totalCost > 0 ? (profitLoss / asset.totalCost) * 100 : 0;

      return {
        ...asset,
        currentPrice,
        totalValue,
        totalValueSAR,
        profitLoss,
        profitLossSAR,
        profitLossPct,
        high52w,
        low52w,
        marketCap: q?.marketCap ?? (q?.sharesOutstanding && currentPrice > 0 ? q.sharesOutstanding * currentPrice : asset.marketCap ?? null),
        priceSource: q?.source ?? asset.priceSource ?? null,
        volume: q?.volume ?? null,
        averageVolume: q?.averageVolume ?? null,
        shortPercentOfFloat: q?.shortPercentOfFloat ?? null,
        shortRatio: q?.shortRatio ?? null,
        sharesShort: q?.sharesShort ?? null,
        sharesOutstanding: q?.sharesOutstanding ?? null,
        floatShares: q?.floatShares ?? null,
        shortDataSource: q?.shortDataSource ?? null,
        shariaStatus: sh?.shariaStatus || asset.shariaStatus,
        shariaBilad: sh?.shariaBilad || asset.shariaBilad,
        shariaRajhi: sh?.shariaRajhi || asset.shariaRajhi,
        shariaMaqasid: sh?.shariaMaqasid || asset.shariaMaqasid,
        shariaZero: sh?.shariaZero || asset.shariaZero,
      };
    });
  }, [aggregatedAssets, liveQuotes, shariaMap]);

  const assetPositionsMap = useMemo(() => {
    const map = new Map<string, AssetPositionRef[]>();
    const addRef = (key: string, ref: AssetPositionRef) => {
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ref);
    };

    for (const snap of allSnapshots) {
      const portfolioId = snap.portfolioId || '';
      const portfolioName = snap.portfolioName;

      for (const stock of snap.stocks || []) {
        addRef(stockAssetKey(stock, portfolioId), {
          portfolioId,
          portfolioName,
          source: 'stocks',
          entryId: stock.id,
          qty: Number(stock.qty || 0),
          buyPrice: Number(stock.buyPrice || 0),
        });
      }

      for (const fund of snap.funds || []) {
        addRef(fundAssetKey(fund, portfolioId), {
          portfolioId,
          portfolioName,
          source: 'funds',
          entryId: fund.id,
          qty: Number(fund.units || 0),
          buyPrice: Number(fund.buyPrice || 0),
        });
      }

      for (const bond of snap.bonds || []) {
        addRef(bondAssetKey(bond, portfolioId), {
          portfolioId,
          portfolioName,
          source: 'bonds',
          entryId: bond.id,
          qty: Number(bond.qty || 0),
          buyPrice: Number(bond.buyPrice || 0),
        });
      }
    }

    return map;
  }, [allSnapshots, stockAssetKey, fundAssetKey, bondAssetKey]);

  const portfolioFilterOptions = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    for (const asset of enrichedAssets) {
      const value = asset.portfolioId || `name:${asset.portfolioName || 'محفظة'}`;
      const label = asset.portfolioName || 'محفظة';
      const existing = map.get(value) || { label, count: 0 };
      existing.count += 1;
      map.set(value, existing);
    }
    return Array.from(map.entries())
      .map(([value, payload]) => ({ value, label: payload.label, count: payload.count }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ar'));
  }, [enrichedAssets]);

  const selectedPortfolioFilterLabel = useMemo(() => {
    if (portfolioFilter === 'all') return 'كل المحافظ';
    return portfolioFilterOptions.find((option) => option.value === portfolioFilter)?.label || 'محفظة';
  }, [portfolioFilter, portfolioFilterOptions]);

  useEffect(() => {
    if (portfolioFilter === 'all') return;
    if (!portfolioFilterOptions.some((option) => option.value === portfolioFilter)) {
      setPortfolioFilter('all');
    }
  }, [portfolioFilter, portfolioFilterOptions]);

  const filteredAssets = useMemo(() => {
    let res = enrichedAssets;
    if (assetFilter !== 'all') res = res.filter(a => a.assetType === assetFilter);
    if (portfolioFilter !== 'all') {
      res = res.filter((a) => (a.portfolioId || `name:${a.portfolioName || 'محفظة'}`) === portfolioFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(a => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
    }
    const sorted = [...res];
    switch (rankingFilter) {
      case 'highest-value':
        sorted.sort((a, b) => b.totalValueSAR - a.totalValueSAR);
        break;
      case 'lowest-value':
        sorted.sort((a, b) => a.totalValueSAR - b.totalValueSAR);
        break;
      case 'highest-profit':
        sorted.sort((a, b) => b.profitLossSAR - a.profitLossSAR);
        break;
      case 'largest-loss':
        sorted.sort((a, b) => a.profitLossSAR - b.profitLossSAR);
        break;
      default:
        sorted.sort((a, b) => b.totalValueSAR - a.totalValueSAR);
        break;
    }
    return sorted;
  }, [enrichedAssets, assetFilter, portfolioFilter, search, rankingFilter]);

  const computedTotalCostSAR = filteredAssets.reduce((acc, a) => acc + a.totalCostSAR, 0);
  const totalValueSAR = filteredAssets.reduce((acc, a) => acc + a.totalValueSAR, 0);
  const hasManualCapital = typeof manualInvestedCapitalSar === 'number'
    && Number.isFinite(manualInvestedCapitalSar)
    && manualInvestedCapitalSar > 0;
  const isFullScopeView = assetFilter === 'all' && portfolioFilter === 'all' && !search.trim();
  const isManualCapitalApplied = hasManualCapital && isFullScopeView;
  const totalCostSAR = isManualCapitalApplied ? manualInvestedCapitalSar! : computedTotalCostSAR;
  const totalProfitSAR = totalValueSAR - totalCostSAR;
  const totalProfitPct = totalCostSAR > 0 ? (totalProfitSAR / totalCostSAR) * 100 : 0;
  const capitalDifferenceSAR = isManualCapitalApplied ? (manualInvestedCapitalSar! - computedTotalCostSAR) : null;

  const allocationChartData = useMemo(() => {
    const grouped = new Map<string, { value: number; cost: number; pl: number; count: number }>();
    enrichedAssets.forEach(a => {
      const label = ASSET_TYPE_LABELS[a.assetType] || a.assetType;
      const existing = grouped.get(label) || { value: 0, cost: 0, pl: 0, count: 0 };
      existing.value += a.totalValueSAR;
      existing.cost += a.totalCostSAR;
      existing.pl += a.profitLossSAR;
      existing.count += a.positions;
      grouped.set(label, existing);
    });
    return Array.from(grouped.entries())
      .map(([name, data]) => ({ name, ...data }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [enrichedAssets]);

  const topHoldingsData = useMemo(() => {
    return enrichedAssets.slice(0, 10).map(a => ({
      name: a.symbol.length > 8 ? a.symbol.slice(0, 8) : a.symbol,
      fullName: a.name,
      value: Math.round(a.totalValueSAR),
      cost: Math.round(a.totalCostSAR),
      pl: Math.round(a.profitLossSAR),
      plPct: a.profitLossPct,
    }));
  }, [enrichedAssets]);

  const plDistributionData = useMemo(() => {
    return enrichedAssets
      .filter(a => Math.abs(a.profitLossSAR) > 0)
      .sort((a, b) => b.profitLossSAR - a.profitLossSAR)
      .slice(0, 15)
      .map(a => ({
        name: a.symbol.length > 10 ? a.symbol.slice(0, 10) : a.symbol,
        pl: Math.round(a.profitLossSAR),
        plPct: a.profitLossPct,
        isPositive: a.profitLossSAR >= 0,
      }));
  }, [enrichedAssets]);

  const currencyBreakdown = useMemo(() => {
    const map = new Map<string, { value: number; count: number }>();
    enrichedAssets.forEach(a => {
      const existing = map.get(a.currency) || { value: 0, count: 0 };
      existing.value += a.totalValueSAR;
      existing.count += 1;
      map.set(a.currency, existing);
    });
    return Array.from(map.entries())
      .map(([currency, data]) => ({ currency, ...data }))
      .sort((a, b) => b.value - a.value);
  }, [enrichedAssets]);

  const summaryCurrencyOptions = useMemo(() => {
    const options = new Set<string>(CURRENCY_ORDER);
    options.add(normalizeCurrencyCode(snapshot?.currency || 'SAR'));
    currencyBreakdown.forEach((entry) => options.add(normalizeCurrencyCode(entry.currency)));
    return orderCurrencies(options);
  }, [snapshot?.currency, currencyBreakdown]);

  const toSummaryAmount = useCallback(
    (amountSar: number) => convertCurrency(Number.isFinite(amountSar) ? amountSar : 0, 'SAR', summaryCurrency),
    [summaryCurrency]
  );

  const formatSummaryAmount = useCallback(
    (amountSar: number) => formatCurrencyByCode(toSummaryAmount(amountSar), summaryCurrency),
    [summaryCurrency, toSummaryAmount]
  );

  const totalPaidDividendsUnified = useMemo(() => {
    return Object.entries(paidDividendsByCurrency).reduce((sum, [currency, amount]) => {
      const safe = Number.isFinite(amount) ? amount : 0;
      return sum + convertCurrency(safe, normalizeCurrencyCode(currency), summaryCurrency);
    }, 0);
  }, [paidDividendsByCurrency, summaryCurrency]);

  const paidDividendsCurrencyCount = useMemo(
    () => Object.keys(paidDividendsByCurrency).length,
    [paidDividendsByCurrency]
  );

  const allocationChartDataDisplay = useMemo(
    () => allocationChartData.map((item) => ({
      ...item,
      value: toSummaryAmount(item.value),
      cost: toSummaryAmount(item.cost),
      pl: toSummaryAmount(item.pl),
    })),
    [allocationChartData, toSummaryAmount]
  );

  const topHoldingsDataDisplay = useMemo(
    () => topHoldingsData.map((item) => ({
      ...item,
      value: Math.round(toSummaryAmount(item.value)),
      cost: Math.round(toSummaryAmount(item.cost)),
      pl: Math.round(toSummaryAmount(item.pl)),
    })),
    [topHoldingsData, toSummaryAmount]
  );

  const plDistributionDataDisplay = useMemo(
    () => plDistributionData.map((item) => ({
      ...item,
      pl: Math.round(toSummaryAmount(item.pl)),
    })),
    [plDistributionData, toSummaryAmount]
  );

  const curLabel = (currency: string) => currencySymbol(currency);
  const formatVolume = (value: number) => value >= 1e6 ? `${(value / 1e6).toFixed(1)}M` : value >= 1e3 ? `${(value / 1e3).toFixed(0)}K` : value.toLocaleString();
  const formatSharesCount = (value: number) => value >= 1e9 ? `${(value / 1e9).toFixed(2)}B` : value >= 1e6 ? `${(value / 1e6).toFixed(2)}M` : value >= 1e3 ? `${(value / 1e3).toFixed(2)}K` : value.toLocaleString();

  const pos52w = (price: number | null, high: number | null | undefined, low: number | null | undefined) => {
    if (!price || !high || !low || high <= low) return null;
    return Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100));
  };

  const roundQty = (value: number) => Number(value.toFixed(8));

  const cloneSnapshots = useCallback(() => {
    return allSnapshots.map((snap) => JSON.parse(JSON.stringify(snap)) as PortfolioSnapshot);
  }, [allSnapshots]);

  const persistTouchedSnapshots = useCallback(async (nextSnapshots: PortfolioSnapshot[], touchedPortfolioIds: string[]) => {
    const uniqueIds = [...new Set(touchedPortfolioIds.filter(Boolean))];
    if (uniqueIds.length === 0) return false;

    setActionSaving(true);
    let allOk = true;
    try {
      for (const portfolioId of uniqueIds) {
        const target = nextSnapshots.find((snap) => snap.portfolioId === portfolioId);
        if (!target) continue;
        const result = await persistPortfolioSnapshot(target, portfolioId);
        if (!result.ok) allOk = false;
      }

      const refreshed = await fetchAllPortfoliosSnapshots(portfolios);
      setAllSnapshots(refreshed.length > 0 ? refreshed : nextSnapshots);
      pricesFetched.current = false;
      shariaFetched.current = false;
      return allOk;
    } finally {
      setActionSaving(false);
    }
  }, [portfolios]);

  const openSellDialog = useCallback((asset: AggregatedAsset) => {
    setSellAsset(asset);
    setSellForm({
      qty: asset.qty.toFixed(4),
      sellPrice: asset.currentPrice.toFixed(4),
      sellDate: todayStr(),
      customBrok: '',
      customVat: '',
      customOtherFees: '',
      customPurification: '',
    });
    setSellPurification(ZERO_PURIFICATION_METRICS);
    setSellPurificationLoading(false);
    setSellOpen(true);
  }, []);

  const openMoveDialog = useCallback((asset: AggregatedAsset) => {
    setMoveAsset(asset);
    setMoveSourcePortfolioId(asset.portfolioId || '');
    setMoveTargetPortfolioId('');
    setMoveQty(asset.qty.toFixed(4));
    setMoveOpen(true);
  }, []);

  const openEditDialog = useCallback((asset: AggregatedAsset) => {
    setEditAsset(asset);
    setEditForm({
      name: asset.name,
      currentPrice: asset.currentPrice.toFixed(4),
      high52w: asset.high52w != null ? asset.high52w.toFixed(4) : '',
      low52w: asset.low52w != null ? asset.low52w.toFixed(4) : '',
      customBrok: '',
      customVat: '',
      customOtherFees: '',
    });
    setEditOpen(true);
  }, []);

  const sellAssetPurificationType = useMemo<'stock' | 'fund' | null>(() => {
    if (!sellAsset) return null;
    if (sellAsset.assetType === 'stock') return 'stock';
    if (sellAsset.assetType === 'fund') return 'fund';
    return null;
  }, [sellAsset]);

  const sellTaxDefaults = useMemo(() => {
    if (!sellAsset) {
      return { marketKey: 'saudi', brokeragePct: 0.15, vatPct: 15 };
    }
    return getTaxDefaults({ currency: sellAsset.currency, symbol: sellAsset.symbol });
  }, [sellAsset]);

  const sellQtyNum = Number(sellForm.qty || 0);
  const sellPriceNum = Number(sellForm.sellPrice || 0);
  const sellGrossAmount = sellQtyNum * sellPriceNum;
  const sellFeeCalc = calcTradeFees({
    grossAmount: sellGrossAmount,
    brokeragePct: sellTaxDefaults.brokeragePct,
    vatPct: sellTaxDefaults.vatPct,
    customBrokerageAmount: sellForm.customBrok !== '' ? Number(sellForm.customBrok || 0) : undefined,
    customVatAmount: sellForm.customVat !== '' ? Number(sellForm.customVat || 0) : undefined,
  });
  const sellOtherFees = Math.max(0, Number(sellForm.customOtherFees || 0));
  const sellAvgCostPerUnit = sellAsset ? (sellAsset.qty > 0 ? sellAsset.totalCost / sellAsset.qty : sellAsset.averageBuyPrice) : 0;
  const sellCostBasisCalc = sellQtyNum * sellAvgCostPerUnit;
  const sellNetBeforePurification = sellGrossAmount - sellFeeCalc.brokerage - sellFeeCalc.vat - sellOtherFees;
  const sellProfitBeforePurificationCalc = Math.max(0, sellNetBeforePurification - sellCostBasisCalc);
  const sellPurificationAmountAutoCalc = calcPurificationAmount(sellProfitBeforePurificationCalc, sellPurification.purificationPct || 0);
  const sellManualPurificationRaw = sellForm.customPurification !== '' ? Number(sellForm.customPurification) : NaN;
  const sellHasManualPurification = sellForm.customPurification !== '' && Number.isFinite(sellManualPurificationRaw);
  const sellPurificationAmountCalc = Math.min(
    sellProfitBeforePurificationCalc,
    Math.max(0, sellHasManualPurification ? sellManualPurificationRaw : sellPurificationAmountAutoCalc),
  );
  const sellNetAfterPurification = sellNetBeforePurification - sellPurificationAmountCalc;
  const sellProfitAfterPurification = sellNetAfterPurification - sellCostBasisCalc;
  const sellProfitAfterPurificationPct = sellCostBasisCalc > 0 ? (sellProfitAfterPurification / sellCostBasisCalc) * 100 : 0;

  useEffect(() => {
    if (!sellOpen || !sellAsset || !sellAssetPurificationType) {
      setSellPurification(ZERO_PURIFICATION_METRICS);
      setSellPurificationLoading(false);
      return;
    }
    let active = true;
    setSellPurificationLoading(true);
    fetchPurificationMetrics({
      symbol: sellAsset.symbol,
      assetType: sellAssetPurificationType,
    })
      .then((metrics) => {
        if (active) setSellPurification(metrics);
      })
      .catch(() => {
        if (active) setSellPurification(ZERO_PURIFICATION_METRICS);
      })
      .finally(() => {
        if (active) setSellPurificationLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sellOpen, sellAsset, sellAssetPurificationType]);

  const editTaxDefaults = useMemo(() => {
    if (!editAsset) {
      return { marketKey: 'saudi', brokeragePct: 0.15, vatPct: 15 };
    }
    return getTaxDefaults({ currency: editAsset.currency, symbol: editAsset.symbol });
  }, [editAsset]);

  const editAvgCostPerUnit = editAsset ? (editAsset.qty > 0 ? editAsset.totalCost / editAsset.qty : editAsset.averageBuyPrice) : 0;
  const editGrossAmount = (editAsset?.qty || 0) * editAvgCostPerUnit;
  const editFeeCalc = calcTradeFees({
    grossAmount: editGrossAmount,
    brokeragePct: editTaxDefaults.brokeragePct,
    vatPct: editTaxDefaults.vatPct,
    customBrokerageAmount: editForm.customBrok !== '' ? Number(editForm.customBrok || 0) : undefined,
    customVatAmount: editForm.customVat !== '' ? Number(editForm.customVat || 0) : undefined,
  });
  const editOtherFees = Math.max(0, Number(editForm.customOtherFees || 0));
  const editTotalWithFees = editFeeCalc.total + editOtherFees;

  const moveSourceOptions = useMemo(() => {
    if (!moveAsset) return [];
    const refs = assetPositionsMap.get(moveAsset.id) || [];
    const grouped = new Map<string, { portfolioName: string; qty: number }>();
    for (const ref of refs) {
      const existing = grouped.get(ref.portfolioId) || { portfolioName: ref.portfolioName, qty: 0 };
      existing.qty += ref.qty;
      grouped.set(ref.portfolioId, existing);
    }
    return Array.from(grouped.entries())
      .map(([portfolioId, value]) => ({ portfolioId, ...value }))
      .sort((a, b) => b.qty - a.qty);
  }, [moveAsset, assetPositionsMap]);

  const moveSourceAvailableQty = useMemo(() => {
    const selected = moveSourceOptions.find((item) => item.portfolioId === moveSourcePortfolioId);
    return selected?.qty || 0;
  }, [moveSourceOptions, moveSourcePortfolioId]);

  useEffect(() => {
    if (!moveOpen || moveSourceOptions.length === 0) return;
    if (!moveSourcePortfolioId || !moveSourceOptions.some((option) => option.portfolioId === moveSourcePortfolioId)) {
      setMoveSourcePortfolioId(moveSourceOptions[0].portfolioId);
      setMoveQty(moveSourceOptions[0].qty.toFixed(4));
    }
  }, [moveOpen, moveSourceOptions, moveSourcePortfolioId]);

  useEffect(() => {
    if (!moveOpen || !moveSourcePortfolioId) return;
    if (moveTargetPortfolioId && moveTargetPortfolioId !== moveSourcePortfolioId) return;
    const fallback = portfolios.find((p) => p.id !== moveSourcePortfolioId);
    setMoveTargetPortfolioId(fallback?.id || '');
  }, [moveOpen, moveSourcePortfolioId, moveTargetPortfolioId, portfolios]);

  const executeSell = useCallback(async () => {
    if (!sellAsset) return;
    const qty = sellQtyNum;
    const price = sellPriceNum;
    const sellDateIso = new Date(sellForm.sellDate || todayStr()).toISOString();
    const feesTotal = sellFeeCalc.brokerage + sellFeeCalc.vat + sellOtherFees;
    const purificationTotal = sellPurificationAmountCalc;

    if (!Number.isFinite(qty) || qty <= 0) {
      toast({ title: 'كمية غير صالحة', description: 'أدخل كمية بيع صحيحة', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast({ title: 'سعر غير صالح', description: 'أدخل سعر بيع صحيح', variant: 'destructive' });
      return;
    }

    const refs = assetPositionsMap.get(sellAsset.id) || [];
    const totalAvailable = refs.reduce((sum, ref) => sum + ref.qty, 0);
    if (qty > totalAvailable + 1e-8) {
      toast({ title: 'كمية أعلى من المتاح', description: `المتاح للبيع: ${formatNumber(totalAvailable, 4)}`, variant: 'destructive' });
      return;
    }
    if (feesTotal < 0 || purificationTotal < 0) {
      toast({ title: 'رسوم غير صالحة', description: 'تأكد من أن العمولة والضريبة والرسوم قيم موجبة', variant: 'destructive' });
      return;
    }

    const updated = cloneSnapshots();
    const saleEntries: Array<{ portfolioId: string; source: PositionSource; entryId: string; qty: number }> = [];

    for (const snap of updated) {
      const portfolioId = snap.portfolioId || '';
      for (const stock of snap.stocks || []) {
        if (stockAssetKey(stock, portfolioId) === sellAsset.id) {
          saleEntries.push({ portfolioId, source: 'stocks', entryId: stock.id, qty: Number(stock.qty || 0) });
        }
      }
      for (const fund of snap.funds || []) {
        if (fundAssetKey(fund, portfolioId) === sellAsset.id) {
          saleEntries.push({ portfolioId, source: 'funds', entryId: fund.id, qty: Number(fund.units || 0) });
        }
      }
      for (const bond of snap.bonds || []) {
        if (bondAssetKey(bond, portfolioId) === sellAsset.id) {
          saleEntries.push({ portfolioId, source: 'bonds', entryId: bond.id, qty: Number(bond.qty || 0) });
        }
      }
    }

    if (saleEntries.length === 0) {
      toast({ title: 'تعذر التنفيذ', description: 'لم يتم العثور على مراكز قابلة للبيع', variant: 'destructive' });
      return;
    }

    const totalQty = saleEntries.reduce((sum, entry) => sum + entry.qty, 0);
    let remaining = qty;
    const soldByEntry = new Map<string, number>();
    const soldByPortfolio = new Map<string, number>();

    saleEntries.forEach((entry, index) => {
      const key = `${entry.portfolioId}|${entry.source}|${entry.entryId}`;
      const proportional = index === saleEntries.length - 1
        ? remaining
        : roundQty((qty * entry.qty) / totalQty);
      const sold = Math.min(entry.qty, Math.max(0, proportional));
      remaining = roundQty(remaining - sold);
      soldByEntry.set(key, sold);
      soldByPortfolio.set(entry.portfolioId, (soldByPortfolio.get(entry.portfolioId) || 0) + sold);
    });

    if (remaining > 1e-8) {
      const last = saleEntries[saleEntries.length - 1];
      const key = `${last.portfolioId}|${last.source}|${last.entryId}`;
      soldByEntry.set(key, roundQty((soldByEntry.get(key) || 0) + remaining));
      soldByPortfolio.set(last.portfolioId, roundQty((soldByPortfolio.get(last.portfolioId) || 0) + remaining));
    }

    const touched = new Set<string>();
    for (const snap of updated) {
      const portfolioId = snap.portfolioId || '';

      snap.stocks = (snap.stocks || [])
        .map((stock) => {
          const key = `${portfolioId}|stocks|${stock.id}`;
          const sold = soldByEntry.get(key) || 0;
          if (sold <= 0) return stock;
          touched.add(portfolioId);
          return { ...stock, qty: roundQty(Number(stock.qty || 0) - sold) };
        })
        .filter((stock) => Number(stock.qty || 0) > 1e-8);

      snap.funds = (snap.funds || [])
        .map((fund) => {
          const key = `${portfolioId}|funds|${fund.id}`;
          const sold = soldByEntry.get(key) || 0;
          if (sold <= 0) return fund;
          touched.add(portfolioId);
          return { ...fund, units: roundQty(Number(fund.units || 0) - sold) };
        })
        .filter((fund) => Number(fund.units || 0) > 1e-8);

      snap.bonds = (snap.bonds || [])
        .map((bond) => {
          const key = `${portfolioId}|bonds|${bond.id}`;
          const sold = soldByEntry.get(key) || 0;
          if (sold <= 0) return bond;
          touched.add(portfolioId);
          return { ...bond, qty: roundQty(Number(bond.qty || 0) - sold) };
        })
        .filter((bond) => Number(bond.qty || 0) > 1e-8);

      const soldQtyInPortfolio = soldByPortfolio.get(portfolioId) || 0;
      if (soldQtyInPortfolio > 0) {
        const ratio = qty > 0 ? soldQtyInPortfolio / qty : 0;
        const totalSellGross = soldQtyInPortfolio * price;
        const totalFees = feesTotal * ratio;
        const totalPurification = purificationTotal * ratio;
        const totalCost = soldQtyInPortfolio * sellAvgCostPerUnit;
        const totalSellNet = totalSellGross - totalFees - totalPurification;
        const profitLoss = totalSellNet - totalCost;
        const record: SellRecord = {
          id: `sell-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          symbol: sellAsset.symbol,
          name: sellAsset.name,
          assetType: sellAsset.assetType as SellRecord['assetType'],
          qty: soldQtyInPortfolio,
          buyPrice: sellAvgCostPerUnit,
          sellPrice: price,
          sellDate: sellDateIso,
          profitLoss,
          profitLossPct: totalCost > 0 ? (profitLoss / totalCost) * 100 : 0,
          fees: totalFees,
          purificationPct: sellPurification.purificationPct,
          purificationAmount: totalPurification,
          interestIncomeToRevenuePct: sellPurification.interestIncomeToRevenuePct,
          debtToMarketCapPct: sellPurification.debtToMarketCapPct,
          currency: sellAsset.currency,
        };
        snap.sellHistory = [...(snap.sellHistory || []), record];
      }
    }

    const ok = await persistTouchedSnapshots(updated, Array.from(touched));
    if (ok) {
      toast({
        title: 'تم تنفيذ البيع',
        description: `تم بيع ${formatNumber(qty, 4)} من ${sellAsset.symbol} بصافي ${formatNumber(sellNetAfterPurification, 2)} ${sellAsset.currency}`,
      });
    } else {
      toast({
        title: 'تم التنفيذ محليًا',
        description: 'حدثت مشكلة أثناء مزامنة بعض المحافظ مع الخادم',
        variant: 'destructive',
      });
    }
    setSellOpen(false);
    setSellPurification(ZERO_PURIFICATION_METRICS);
  }, [
    sellAsset,
    sellQtyNum,
    sellPriceNum,
    sellForm.sellDate,
    sellFeeCalc.brokerage,
    sellFeeCalc.vat,
    sellOtherFees,
    sellPurificationAmountCalc,
    sellPurification,
    sellAvgCostPerUnit,
    sellNetAfterPurification,
    assetPositionsMap,
    cloneSnapshots,
    stockAssetKey,
    fundAssetKey,
    bondAssetKey,
    persistTouchedSnapshots,
    toast,
  ]);

  const executeMove = useCallback(async () => {
    if (!moveAsset) return;
    const qty = Number(moveQty);
    if (!moveSourcePortfolioId || !moveTargetPortfolioId || moveSourcePortfolioId === moveTargetPortfolioId) {
      toast({ title: 'بيانات نقل غير مكتملة', description: 'حدد محفظة المصدر والهدف بشكل صحيح', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      toast({ title: 'كمية غير صالحة', description: 'أدخل كمية نقل صحيحة', variant: 'destructive' });
      return;
    }
    if (qty > moveSourceAvailableQty + 1e-8) {
      toast({ title: 'كمية أعلى من المتاح', description: `المتاح في المحفظة المصدر: ${formatNumber(moveSourceAvailableQty, 4)}`, variant: 'destructive' });
      return;
    }

    const updated = cloneSnapshots();
    const sourceSnap = updated.find((snap) => snap.portfolioId === moveSourcePortfolioId);
    const targetSnap = updated.find((snap) => snap.portfolioId === moveTargetPortfolioId);
    if (!sourceSnap || !targetSnap) {
      toast({ title: 'تعذر النقل', description: 'لم يتم العثور على المحافظ المحددة', variant: 'destructive' });
      return;
    }

    const sourceEntries: Array<{ source: PositionSource; entryId: string; qty: number; buyPrice: number }> = [];
    for (const stock of sourceSnap.stocks || []) {
      if (stockAssetKey(stock, moveSourcePortfolioId) === moveAsset.id) sourceEntries.push({ source: 'stocks', entryId: stock.id, qty: Number(stock.qty || 0), buyPrice: Number(stock.buyPrice || 0) });
    }
    for (const fund of sourceSnap.funds || []) {
      if (fundAssetKey(fund, moveSourcePortfolioId) === moveAsset.id) sourceEntries.push({ source: 'funds', entryId: fund.id, qty: Number(fund.units || 0), buyPrice: Number(fund.buyPrice || 0) });
    }
    for (const bond of sourceSnap.bonds || []) {
      if (bondAssetKey(bond, moveSourcePortfolioId) === moveAsset.id) sourceEntries.push({ source: 'bonds', entryId: bond.id, qty: Number(bond.qty || 0), buyPrice: Number(bond.buyPrice || 0) });
    }
    if (sourceEntries.length === 0) {
      toast({ title: 'تعذر النقل', description: 'الأصل غير موجود في محفظة المصدر', variant: 'destructive' });
      return;
    }

    const stockTemplate = (sourceSnap.stocks || []).find((stock) => stockAssetKey(stock, moveSourcePortfolioId) === moveAsset.id) || null;
    const fundTemplate = (sourceSnap.funds || []).find((fund) => fundAssetKey(fund, moveSourcePortfolioId) === moveAsset.id) || null;
    const bondTemplate = (sourceSnap.bonds || []).find((bond) => bondAssetKey(bond, moveSourcePortfolioId) === moveAsset.id) || null;

    if ((moveAsset.assetType === 'stock' || moveAsset.assetType === 'crypto' || moveAsset.assetType === 'forex') && !stockTemplate) {
      toast({ title: 'تعذر النقل', description: 'بيانات الأصل غير مكتملة في محفظة المصدر', variant: 'destructive' });
      return;
    }
    if ((moveAsset.assetType === 'fund' || moveAsset.assetType === 'commodity') && !fundTemplate) {
      toast({ title: 'تعذر النقل', description: 'بيانات الأصل غير مكتملة في محفظة المصدر', variant: 'destructive' });
      return;
    }
    if ((moveAsset.assetType === 'bond' || moveAsset.assetType === 'sukuk') && !bondTemplate) {
      toast({ title: 'تعذر النقل', description: 'بيانات الأصل غير مكتملة في محفظة المصدر', variant: 'destructive' });
      return;
    }

    const sourceTotalQty = sourceEntries.reduce((sum, entry) => sum + entry.qty, 0);
    if (sourceTotalQty <= 0) {
      toast({ title: 'كمية غير متاحة', description: 'لا توجد كمية قابلة للنقل في محفظة المصدر', variant: 'destructive' });
      return;
    }
    let remaining = qty;
    const movedByEntry = new Map<string, number>();
    sourceEntries.forEach((entry, index) => {
      const key = `${entry.source}|${entry.entryId}`;
      const proportional = index === sourceEntries.length - 1 ? remaining : roundQty((qty * entry.qty) / sourceTotalQty);
      const moved = Math.min(entry.qty, Math.max(0, proportional));
      remaining = roundQty(remaining - moved);
      movedByEntry.set(key, moved);
    });
    if (remaining > 1e-8) {
      const last = sourceEntries[sourceEntries.length - 1];
      const key = `${last.source}|${last.entryId}`;
      movedByEntry.set(key, roundQty((movedByEntry.get(key) || 0) + remaining));
    }

    sourceSnap.stocks = (sourceSnap.stocks || [])
      .map((stock) => {
        const moved = movedByEntry.get(`stocks|${stock.id}`) || 0;
        if (moved <= 0) return stock;
        return { ...stock, qty: roundQty(Number(stock.qty || 0) - moved) };
      })
      .filter((stock) => Number(stock.qty || 0) > 1e-8);

    sourceSnap.funds = (sourceSnap.funds || [])
      .map((fund) => {
        const moved = movedByEntry.get(`funds|${fund.id}`) || 0;
        if (moved <= 0) return fund;
        return { ...fund, units: roundQty(Number(fund.units || 0) - moved) };
      })
      .filter((fund) => Number(fund.units || 0) > 1e-8);

    sourceSnap.bonds = (sourceSnap.bonds || [])
      .map((bond) => {
        const moved = movedByEntry.get(`bonds|${bond.id}`) || 0;
        if (moved <= 0) return bond;
        return { ...bond, qty: roundQty(Number(bond.qty || 0) - moved) };
      })
      .filter((bond) => Number(bond.qty || 0) > 1e-8);

    const weightedBuyPrice = sourceTotalQty > 0
      ? sourceEntries.reduce((sum, entry) => sum + (entry.buyPrice * entry.qty), 0) / sourceTotalQty
      : moveAsset.averageBuyPrice;
    const moveId = `mv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (moveAsset.assetType === 'stock' || moveAsset.assetType === 'crypto' || moveAsset.assetType === 'forex') {
      if (stockTemplate) {
        targetSnap.stocks = [
          ...(targetSnap.stocks || []),
          {
            ...stockTemplate,
            id: moveId,
            symbol: moveAsset.symbol,
            name: moveAsset.name,
            qty,
            buyPrice: weightedBuyPrice,
            currentPrice: moveAsset.currentPrice,
            currency: moveAsset.currency,
          },
        ];
      }
    } else if (moveAsset.assetType === 'fund' || moveAsset.assetType === 'commodity') {
      if (fundTemplate) {
        targetSnap.funds = [
          ...(targetSnap.funds || []),
          {
            ...fundTemplate,
            id: moveId,
            symbol: moveAsset.symbol,
            name: moveAsset.name,
            units: qty,
            buyPrice: weightedBuyPrice,
            currentPrice: moveAsset.currentPrice,
            currency: moveAsset.currency,
          },
        ];
      }
    } else {
      if (bondTemplate) {
        targetSnap.bonds = [
          ...(targetSnap.bonds || []),
          {
            ...bondTemplate,
            id: moveId,
            symbol: moveAsset.symbol,
            name: moveAsset.name,
            qty,
            buyPrice: weightedBuyPrice,
            currentPrice: moveAsset.currentPrice,
            currency: moveAsset.currency,
          },
        ];
      }
    }

    const ok = await persistTouchedSnapshots(updated, [moveSourcePortfolioId, moveTargetPortfolioId]);
    if (ok) {
      toast({
        title: 'تم النقل بنجاح',
        description: `تم نقل ${formatNumber(qty, 4)} من ${moveAsset.symbol} إلى المحفظة المحددة`,
      });
    } else {
      toast({
        title: 'تم النقل محليًا',
        description: 'حدثت مشكلة أثناء مزامنة عملية النقل مع الخادم',
        variant: 'destructive',
      });
    }
    setMoveOpen(false);
  }, [moveAsset, moveQty, moveSourcePortfolioId, moveTargetPortfolioId, moveSourceAvailableQty, cloneSnapshots, stockAssetKey, fundAssetKey, bondAssetKey, persistTouchedSnapshots, toast]);

  const executeEdit = useCallback(async () => {
    if (!editAsset) return;
    const normalizedName = editForm.name.trim();
    const nextCurrent = editForm.currentPrice.trim() === '' ? null : Number(editForm.currentPrice);
    const nextHigh = editForm.high52w.trim() === '' ? null : Number(editForm.high52w);
    const nextLow = editForm.low52w.trim() === '' ? null : Number(editForm.low52w);
    const nextCustomBrok = editForm.customBrok.trim() === '' ? null : Number(editForm.customBrok);
    const nextCustomVat = editForm.customVat.trim() === '' ? null : Number(editForm.customVat);
    const nextCustomOtherFees = editForm.customOtherFees.trim() === '' ? null : Number(editForm.customOtherFees);

    if (!normalizedName) {
      toast({ title: 'الاسم مطلوب', description: 'أدخل اسم الأصل', variant: 'destructive' });
      return;
    }
    if (nextCurrent != null && (!Number.isFinite(nextCurrent) || nextCurrent <= 0)) {
      toast({ title: 'سعر حالي غير صالح', description: 'أدخل سعرًا صحيحًا', variant: 'destructive' });
      return;
    }
    if (nextHigh != null && (!Number.isFinite(nextHigh) || nextHigh <= 0)) {
      toast({ title: 'أعلى 52 غير صالح', description: 'أدخل قيمة صحيحة', variant: 'destructive' });
      return;
    }
    if (nextLow != null && (!Number.isFinite(nextLow) || nextLow <= 0)) {
      toast({ title: 'أدنى 52 غير صالح', description: 'أدخل قيمة صحيحة', variant: 'destructive' });
      return;
    }
    if (nextHigh != null && nextLow != null && nextLow > nextHigh) {
      toast({ title: 'نطاق 52 غير منطقي', description: 'يجب أن يكون الأدنى أقل من الأعلى', variant: 'destructive' });
      return;
    }
    if (nextCustomBrok != null && (!Number.isFinite(nextCustomBrok) || nextCustomBrok < 0)) {
      toast({ title: 'عمولة غير صالحة', description: 'أدخل مبلغ عمولة صحيحًا', variant: 'destructive' });
      return;
    }
    if (nextCustomVat != null && (!Number.isFinite(nextCustomVat) || nextCustomVat < 0)) {
      toast({ title: 'ضريبة غير صالحة', description: 'أدخل مبلغ ضريبة صحيحًا', variant: 'destructive' });
      return;
    }
    if (nextCustomOtherFees != null && (!Number.isFinite(nextCustomOtherFees) || nextCustomOtherFees < 0)) {
      toast({ title: 'رسوم إضافية غير صالحة', description: 'أدخل مبلغ رسوم إضافية صحيحًا', variant: 'destructive' });
      return;
    }

    const updated = cloneSnapshots();
    const touched = new Set<string>();

    for (const snap of updated) {
      const portfolioId = snap.portfolioId || '';
      let changed = false;

      snap.stocks = (snap.stocks || []).map((stock) => {
        if (stockAssetKey(stock, portfolioId) !== editAsset.id) return stock;
        changed = true;
        return {
          ...stock,
          name: normalizedName,
          currentPrice: nextCurrent ?? stock.currentPrice,
          high52w: nextHigh ?? stock.high52w,
          low52w: nextLow ?? stock.low52w,
          customBrok: nextCustomBrok ?? stock.customBrok,
          customVat: nextCustomVat ?? stock.customVat,
          customOtherFees: nextCustomOtherFees ?? stock.customOtherFees,
        };
      });

      snap.funds = (snap.funds || []).map((fund) => {
        if (fundAssetKey(fund, portfolioId) !== editAsset.id) return fund;
        changed = true;
        return {
          ...fund,
          name: normalizedName,
          currentPrice: nextCurrent ?? fund.currentPrice,
          high52w: nextHigh ?? fund.high52w,
          low52w: nextLow ?? fund.low52w,
          customBrok: nextCustomBrok ?? fund.customBrok,
          customVat: nextCustomVat ?? fund.customVat,
          customOtherFees: nextCustomOtherFees ?? fund.customOtherFees,
        };
      });

      snap.bonds = (snap.bonds || []).map((bond) => {
        if (bondAssetKey(bond, portfolioId) !== editAsset.id) return bond;
        changed = true;
        return {
          ...bond,
          name: normalizedName,
          currentPrice: nextCurrent ?? bond.currentPrice,
          high52w: nextHigh ?? bond.high52w,
          low52w: nextLow ?? bond.low52w,
          customBrok: nextCustomBrok ?? bond.customBrok,
          customVat: nextCustomVat ?? bond.customVat,
          customOtherFees: nextCustomOtherFees ?? bond.customOtherFees,
        };
      });

      if (changed) touched.add(portfolioId);
    }

    if (touched.size === 0) {
      toast({ title: 'لا يوجد تعديل', description: 'تعذر إيجاد المراكز المرتبطة بهذا الأصل', variant: 'destructive' });
      return;
    }

    const ok = await persistTouchedSnapshots(updated, Array.from(touched));
    if (ok) {
      toast({
        title: 'تم التعديل بنجاح',
        description: `تم تحديث ${editAsset.symbol} داخل المحفظة ${editAsset.portfolioName}`,
      });
    } else {
      toast({
        title: 'تم التعديل محليًا',
        description: 'حدثت مشكلة أثناء مزامنة التعديلات مع الخادم',
        variant: 'destructive',
      });
    }
    setEditOpen(false);
  }, [editAsset, editForm, cloneSnapshots, stockAssetKey, fundAssetKey, bondAssetKey, persistTouchedSnapshots, toast]);

  const deskMetrics = useMemo(() => {
    let winners = 0;
    let losers = 0;
    let nearHigh = 0;
    let nearLow = 0;
    let dailyPnLSAR = 0;
    let liquidityNotionalSAR = 0;
    let totalVolRatio = 0;
    let volRatioCount = 0;
    let best: { symbol: string; pct: number } | null = null;
    let worst: { symbol: string; pct: number } | null = null;

    for (const asset of filteredAssets) {
      if (asset.profitLossSAR > 0) winners += 1;
      if (asset.profitLossSAR < 0) losers += 1;

      if (!best || asset.profitLossPct > best.pct) {
        best = { symbol: asset.symbol, pct: asset.profitLossPct };
      }
      if (!worst || asset.profitLossPct < worst.pct) {
        worst = { symbol: asset.symbol, pct: asset.profitLossPct };
      }

      const rangePos = pos52w(asset.currentPrice, asset.high52w, asset.low52w);
      if (rangePos != null) {
        if (rangePos >= 70) nearHigh += 1;
        if (rangePos <= 30) nearLow += 1;
      }

      const quote = liveQuotes[asset.symbol] || liveQuotes[asset.symbol.toUpperCase()];
      if (quote?.change != null) {
        dailyPnLSAR += toSAR(quote.change * asset.qty, asset.currency);
      }

      if (asset.volume != null && asset.currentPrice > 0) {
        liquidityNotionalSAR += toSAR(asset.volume * asset.currentPrice, asset.currency);
      }

      if (asset.volume != null && asset.averageVolume != null && asset.averageVolume > 0) {
        totalVolRatio += asset.volume / asset.averageVolume;
        volRatioCount += 1;
      }
    }

    const topValues = filteredAssets
      .map((asset) => asset.totalValueSAR)
      .sort((a, b) => b - a);
    const top5Sum = topValues.slice(0, 5).reduce((sum, value) => sum + value, 0);
    const concentrationTop5 = totalValueSAR > 0 ? (top5Sum / totalValueSAR) * 100 : 0;
    const avgVolumeRatio = volRatioCount > 0 ? totalVolRatio / volRatioCount : null;
    const breadth = winners + losers > 0 ? (winners / (winners + losers)) * 100 : 0;

    return {
      winners,
      losers,
      nearHigh,
      nearLow,
      dailyPnLSAR,
      liquidityNotionalSAR,
      concentrationTop5,
      avgVolumeRatio,
      breadth,
      best,
      worst,
    };
  }, [filteredAssets, liveQuotes, totalValueSAR]);

  const normalizedSummaryCurrency = normalizeCurrencyCode(summaryCurrency);
  const summaryCurrencyAssets = enrichedAssets.filter((asset) => normalizeCurrencyCode(asset.currency) === normalizedSummaryCurrency);
  const summaryCurrencyAssetsTotalSAR = summaryCurrencyAssets.reduce((sum, asset) => sum + asset.totalValueSAR, 0);
  const summaryCurrencyAssetsCount = summaryCurrencyAssets.length;
  const otherCurrencyAssetsTotalSAR = Math.max(0, totalValueSAR - summaryCurrencyAssetsTotalSAR);
  const otherCurrencyAssetsCount = Math.max(0, enrichedAssets.length - summaryCurrencyAssetsCount);
  const otherCurrenciesBreakdown = currencyBreakdown
    .filter((entry) => normalizeCurrencyCode(entry.currency) !== normalizedSummaryCurrency)
    .sort((a, b) => b.value - a.value);
  const topOtherCurrencies = otherCurrenciesBreakdown.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20" dir="rtl">
      <Sidebar />
      <div className="mr-16 transition-all duration-300 lg:mr-64">
        <TopBar title="تجميع المحافظ الاستثمارية" />
        <main className="w-full space-y-5 p-4 md:p-6">
          {/* Header */}
          <Card className="border-slate-300/70 bg-gradient-to-br from-background to-muted/30 shadow-sm">
            <CardContent className="p-4 md:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">تجميع المحافظ</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      تجميع المراكز يتم داخل نفس المحفظة فقط من أصل {portfolios.length} محفظة — بدون دمج بين محافظ مختلفة • الملخص بعملة {summaryCurrency}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <Select value={summaryCurrency} onValueChange={(value) => setSummaryCurrency(normalizeCurrencyCode(value))}>
                    <SelectTrigger className="w-full bg-background/90 shadow-sm sm:w-[250px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {summaryCurrencyOptions.map((code) => (
                        <SelectItem key={`summary-currency-${code}`} value={code}>
                          {currencySymbol(code)} ({code}) - {currencyName(code)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shadow-sm"
                    onClick={() => { pricesFetched.current = false; shariaFetched.current = false; fetchAllLiveData(); fetchAllSharia(); }}
                    disabled={loadingPrices}
                  >
                    <RefreshCw className={`ml-1 h-4 w-4 ${loadingPrices ? 'animate-spin' : ''}`} />
                    تحديث الأسعار
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Institutional Capital Console */}
          <Card className="overflow-hidden border-slate-300/80 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-slate-100 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.65)] dark:border-slate-700">
            <CardContent className="p-5 md:p-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-5 space-y-3">
                  <Badge variant="secondary" className="bg-white/10 text-slate-100 border-white/20 text-[11px]">
                    Capital Console
                  </Badge>
                  <h2 className="text-xl md:text-2xl font-extrabold leading-tight">
                    لوحة إدارة رأس المال المجمعة
                  </h2>
                  <p className="text-xs md:text-sm text-slate-200/85 leading-relaxed">
                    واجهة مؤسسية لعرض الأداء، السيولة، والتمركز القطاعي بنفس فلسفة منصات الاستثمار الاحترافية.
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full border border-white/25 px-2.5 py-1 bg-white/5">محافظ: {portfolios.length}</span>
                    <span className="rounded-full border border-white/25 px-2.5 py-1 bg-white/5">أصول: {filteredAssets.length}</span>
                    <span className="rounded-full border border-white/25 px-2.5 py-1 bg-white/5">تعرض أعلى 5: {formatPercent(deskMetrics.concentrationTop5)}</span>
                  </div>
                </div>
                <div className="xl:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                    <p className="text-[10px] text-slate-300">صافي الأصول</p>
                    <p className="text-sm md:text-base font-bold">{formatSummaryAmount(totalValueSAR)}</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                    <p className="text-[10px] text-slate-300">التغير اليومي التقريبي</p>
                    <p className={`text-sm md:text-base font-bold ${deskMetrics.dailyPnLSAR >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {deskMetrics.dailyPnLSAR >= 0 ? '+' : ''}{formatSummaryAmount(deskMetrics.dailyPnLSAR)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                    <p className="text-[10px] text-slate-300">سيولة السوق التقديرية</p>
                    <p className="text-sm md:text-base font-bold">{formatSummaryAmount(deskMetrics.liquidityNotionalSAR)}</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                    <p className="text-[10px] text-slate-300">اتساع الرابحين</p>
                    <p className="text-sm md:text-base font-bold">{formatPercent(deskMetrics.breadth)}</p>
                    <p className="text-[10px] text-slate-300">{deskMetrics.winners} رابح / {deskMetrics.losers} خاسر</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                    <p className="text-[10px] text-slate-300">متوسط الزخم الحجمي</p>
                    <p className="text-sm md:text-base font-bold">{deskMetrics.avgVolumeRatio != null ? `${deskMetrics.avgVolumeRatio.toFixed(1)}x` : '—'}</p>
                  </div>
                  <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                    <p className="text-[10px] text-slate-300">أفضل / أضعف أصل</p>
                    <p className="text-[11px] font-semibold truncate">
                      {deskMetrics.best ? `${deskMetrics.best.symbol} (${formatPercent(deskMetrics.best.pct)})` : '—'}
                    </p>
                    <p className="text-[11px] font-semibold truncate text-slate-300">
                      {deskMetrics.worst ? `${deskMetrics.worst.symbol} (${formatPercent(deskMetrics.worst.pct)})` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <Card className="border-slate-300/70 bg-gradient-to-b from-background to-slate-50/60 dark:to-slate-900/20">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">رأس المال المستثمر الفعلي</p>
                </div>
                <p className="text-lg font-bold">
                  {hasManualCapital ? formatSummaryAmount(manualInvestedCapitalSar!) : 'غير محدد'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {hasManualCapital ? `${currencyName(summaryCurrency)} · من الملف الشخصي` : 'أضفه من الملف الشخصي والإعدادات'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-300/70 bg-gradient-to-b from-background to-slate-50/60 dark:to-slate-900/20">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground">إجمالي التكلفة الحالية</p>
                </div>
                <p className="text-lg font-bold">{formatSummaryAmount(computedTotalCostSAR)}</p>
                <p className="text-[10px] text-muted-foreground">{currencyName(summaryCurrency)}</p>
              </CardContent>
            </Card>
            <Card className="border-slate-300/70 bg-gradient-to-b from-background to-slate-50/60 dark:to-slate-900/20">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  <p className="text-xs text-muted-foreground">القيمة الحالية</p>
                </div>
                <p className="text-lg font-bold">{formatSummaryAmount(totalValueSAR)}</p>
                <p className="text-[10px] text-muted-foreground">{currencyName(summaryCurrency)}</p>
              </CardContent>
            </Card>
            <Card className={totalProfitSAR >= 0 ? 'border-green-300/70 bg-gradient-to-b from-background to-green-50/40 dark:to-green-950/10' : 'border-red-300/70 bg-gradient-to-b from-background to-red-50/40 dark:to-red-950/10'}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {totalProfitSAR >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                  <p className="text-xs text-muted-foreground">صافي الربح/الخسارة</p>
                </div>
                <p className={`text-lg font-bold ${totalProfitSAR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfitSAR >= 0 ? '+' : ''}{formatSummaryAmount(totalProfitSAR)}
                </p>
                <p className="text-[10px] text-muted-foreground">{currencyName(summaryCurrency)}</p>
              </CardContent>
            </Card>
            <Card className={totalProfitPct >= 0 ? 'border-green-300/70 bg-gradient-to-b from-background to-green-50/40 dark:to-green-950/10' : 'border-red-300/70 bg-gradient-to-b from-background to-red-50/40 dark:to-red-950/10'}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">العائد المجمع</p>
                </div>
                <p className={`text-lg font-bold ${totalProfitPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfitPct >= 0 ? '+' : ''}{formatPercent(totalProfitPct)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {enrichedAssets.length} أصل · {enrichedAssets.reduce((s, a) => s + a.positions, 0)} صفقة
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-300/70 bg-gradient-to-b from-background to-slate-50/60 dark:to-slate-900/20">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs text-muted-foreground">إجمالي التوزيعات المستلمة (موحّد)</p>
                </div>
                <p className="text-lg font-bold">{formatCurrencyByCode(totalPaidDividendsUnified, summaryCurrency)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {paidDividendsCurrencyCount > 0
                    ? `من ${paidDividendsCurrencyCount} عملة`
                    : 'لا توجد توزيعات مستلمة'}
                </p>
              </CardContent>
            </Card>
          </div>

          {hasManualCapital && (
            <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
              <CardContent className="p-3 text-xs space-y-1">
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                  رأس المال المستثمر الفعلي مربوط من ملف المستخدم.
                </p>
                {isManualCapitalApplied ? (
                  <p className="text-muted-foreground">
                    التكلفة المحسوبة من المراكز: {formatSummaryAmount(computedTotalCostSAR)}
                    {typeof capitalDifferenceSAR === 'number' && (
                      <> · الفرق: {capitalDifferenceSAR >= 0 ? '+' : ''}{formatSummaryAmount(capitalDifferenceSAR)}</>
                    )}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    يتم تطبيق رأس المال الفعلي عند عرض كل الأصول بدون فلاتر بحث أو تصنيف.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Currency Summary Mini Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <div className="min-w-9 px-1.5 py-2 bg-blue-500 rounded-lg text-white text-[11px] font-extrabold text-center leading-none">
                  {currencySymbol(summaryCurrency)}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">أصول بعملة الملخص</p>
                  <p className="text-sm font-bold">{formatSummaryAmount(summaryCurrencyAssetsTotalSAR)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {summaryCurrencyAssetsCount} أصل · العملة: {currencyName(summaryCurrency)} ({summaryCurrency})
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <div className="min-w-9 px-1.5 py-2 bg-green-500 rounded-lg text-white text-[11px] font-extrabold text-center leading-none">≠</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">أصول بعملات مختلفة (محوّلة إلى {currencyName(summaryCurrency)} {summaryCurrency})</p>
                  <p className="text-sm font-bold">{formatSummaryAmount(otherCurrencyAssetsTotalSAR)}</p>
                  <p className="text-[10px] text-muted-foreground">{otherCurrencyAssetsCount} أصل بغير عملة {summaryCurrency}</p>
                  {topOtherCurrencies.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {topOtherCurrencies.map((entry) => {
                        const sourceCode = normalizeCurrencyCode(entry.currency);
                        return (
                          <div key={`other-currency-mini-${entry.currency}`} className="rounded border border-green-200 bg-white/80 px-2 py-1 text-[10px]">
                            <p className="font-semibold text-green-900">
                              {currencyName(sourceCode)} ({sourceCode}) → {currencyName(summaryCurrency)} ({summaryCurrency})
                            </p>
                            <p className="text-green-800">
                              القيمة الموحّدة: {formatSummaryAmount(entry.value)} · عدد الأصول: {entry.count}
                            </p>
                          </div>
                        );
                      })}
                      {otherCurrenciesBreakdown.length > topOtherCurrencies.length && (
                        <p className="text-[10px] text-muted-foreground">
                          +{otherCurrenciesBreakdown.length - topOtherCurrencies.length} عملات إضافية
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg text-white"><Layers className="h-4 w-4" /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground">عدد المحافظ</p>
                  <p className="text-sm font-bold">{portfolios.length}</p>
                  <p className="text-[10px] text-muted-foreground">محفظة مدمجة</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg text-white"><BarChart3 className="h-4 w-4" /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground">أنواع الأصول</p>
                  <p className="text-sm font-bold">{allocationChartData.length}</p>
                  <p className="text-[10px] text-muted-foreground">تصنيف مختلف</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1: Allocation Pie + Top Holdings */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-primary" />
                  توزيع الأصول حسب النوع
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allocationChartDataDisplay.length > 0 ? (
                  <div className="h-[320px] w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationChartDataDisplay}
                          cx="50%" cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                          outerRadius={110}
                          innerRadius={50}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {allocationChartDataDisplay.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => formatSummaryAmount(value)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  أعلى 10 أصول — التكلفة مقابل القيمة ({summaryCurrency})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topHoldingsDataDisplay.length > 0 ? (
                  <div className="h-[320px] w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={topHoldingsDataDisplay} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatNumber(v / 1000, 0) + 'K'} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
                        <RechartsTooltip
                          formatter={(value: number, name: string) => [
                            formatSummaryAmount(value),
                            name === 'cost' ? 'التكلفة' : name === 'value' ? 'القيمة' : 'الربح/الخسارة',
                          ]}
                          contentStyle={{ borderRadius: 8, fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="cost" fill="#93c5fd" name="التكلفة" radius={[0, 4, 4, 0]} barSize={12} />
                        <Bar dataKey="value" fill="#3b82f6" name="القيمة" radius={[0, 4, 4, 0]} barSize={12} />
                        <Line dataKey="pl" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="الربح/الخسارة" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2: P&L Distribution + Category Breakdown */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  توزيع الربح والخسارة ({summaryCurrency})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {plDistributionDataDisplay.length > 0 ? (
                  <div className="h-[300px] w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={plDistributionDataDisplay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" height={55} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatNumber(v / 1000, 0) + 'K'} />
                        <RechartsTooltip formatter={(value: number) => [formatSummaryAmount(value), 'الربح/الخسارة']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                        <Bar dataKey="pl" radius={[6, 6, 0, 0]} barSize={24}>
                          {plDistributionDataDisplay.map((entry, index) => (
                            <Cell key={`pl-${index}`} fill={entry.isPositive ? '#22c55e' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  مقارنة الفئات — التكلفة والقيمة والربح ({summaryCurrency})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allocationChartDataDisplay.length > 0 ? (
                  <div className="h-[300px] w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={allocationChartDataDisplay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatNumber(v / 1000, 0) + 'K'} />
                        <RechartsTooltip
                          formatter={(value: number, name: string) => [
                            formatSummaryAmount(value),
                            name === 'cost' ? 'التكلفة' : name === 'value' ? 'القيمة' : 'الربح/الخسارة',
                          ]}
                          contentStyle={{ borderRadius: 8, fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="cost" fill="#93c5fd" name="التكلفة" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="value" fill="#3b82f6" name="القيمة" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="pl" radius={[6, 6, 0, 0]} name="الربح/الخسارة">
                          {allocationChartDataDisplay.map((entry, index) => (
                            <Cell key={`cat-pl-${index}`} fill={entry.pl >= 0 ? '#22c55e' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">لا توجد بيانات</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Currency Breakdown */}
          {currencyBreakdown.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-primary" />
                  توزيع العملات (المبالغ بعملة {summaryCurrency})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {currencyBreakdown.map(({ currency, value, count }) => (
                    <div key={currency} className="rounded-lg border p-3 text-center">
                      <Badge variant="outline" className="mb-2 text-xs">{currency}</Badge>
                      <p className="text-sm font-bold">{formatSummaryAmount(value)}</p>
                      <p className="text-[10px] text-muted-foreground">{count} أصل · {curLabel(currency)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search & Filter */}
          <Card className="sticky top-2 z-20 border-slate-300/80 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
            <CardContent className="pb-4 pt-4">
              <div className="grid grid-cols-1 items-center gap-3 lg:grid-cols-12">
                <div className="relative min-w-0 lg:col-span-4">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث برمز أو اسم الأصل..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
                </div>
                <Select value={assetFilter} onValueChange={setAssetFilter}>
                  <SelectTrigger className="w-full lg:col-span-2">
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue placeholder="تصفية حسب النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأصول ({enrichedAssets.length})</SelectItem>
                    {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => {
                      const count = enrichedAssets.filter(a => a.assetType === key).length;
                      return count > 0 ? <SelectItem key={key} value={key}>{label} ({count})</SelectItem> : null;
                    })}
                  </SelectContent>
                </Select>
                <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
                  <SelectTrigger className="w-full lg:col-span-3">
                    <Wallet className="h-4 w-4 ml-2" />
                    <SelectValue placeholder="تصفية حسب المحفظة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المحافظ ({enrichedAssets.length})</SelectItem>
                    {portfolioFilterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} ({option.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={rankingFilter} onValueChange={(value) => setRankingFilter(value as RankingFilter)}>
                  <SelectTrigger className="w-full lg:col-span-3">
                    <TrendingUp className="h-4 w-4 ml-2" />
                    <SelectValue placeholder="ترتيب المراكز" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="highest-profit">الافتراضي (الأعلى ربحًا)</SelectItem>
                    <SelectItem value="highest-value">الأعلى قيمة</SelectItem>
                    <SelectItem value="lowest-value">الأقل قيمة</SelectItem>
                    <SelectItem value="largest-loss">الأكثر خسارة</SelectItem>
                    <SelectItem value="default">الترتيب القديم (الأعلى قيمة)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full border border-border/70 bg-muted/30 px-2 py-0.5">المعروض: {filteredAssets.length}</span>
                <span className="rounded-full border border-border/70 bg-muted/30 px-2 py-0.5">الإجمالي: {enrichedAssets.length}</span>
                <span className="rounded-full border border-border/70 bg-muted/30 px-2 py-0.5">المحفظة: {selectedPortfolioFilterLabel}</span>
                <span className="rounded-full border border-border/70 bg-muted/30 px-2 py-0.5">عملة العرض: {summaryCurrency}</span>
              </div>
            </CardContent>
          </Card>

          {/* Assets Table */}
          <Card className="overflow-hidden border-slate-300/80 shadow-md">
            <CardHeader className="border-b bg-gradient-to-r from-muted/30 via-muted/20 to-muted/10 py-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>الأصول المدمجة ({filteredAssets.length})</span>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>إجمالي: {formatSummaryAmount(totalValueSAR)}</span>
                  <span>•</span>
                  <span>قريب من القمم: {deskMetrics.nearHigh}</span>
                  <span>•</span>
                  <span>قريب من القيعان: {deskMetrics.nearLow}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[74vh] overflow-auto rounded-b-md [&_[data-slot=table-container]]:overflow-visible">
                <Table className="w-full min-w-[1820px] table-fixed text-[12px] leading-relaxed [&_td]:px-2 [&_td]:py-2.5 [&_th]:px-2 [&_th]:py-2.5">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-20 border-b border-border bg-gradient-to-b from-muted/95 to-muted/80 shadow-sm backdrop-blur">
                      <TableHead className="w-[92px] whitespace-nowrap text-right text-[11px] font-bold text-muted-foreground">الرمز</TableHead>
                      <TableHead className="w-[240px] whitespace-nowrap text-right text-[11px] font-bold text-muted-foreground">الاسم / النوع</TableHead>
                      <TableHead className="w-[150px] whitespace-nowrap text-right text-[11px] font-bold text-muted-foreground">القيمة السوقية</TableHead>
                      <TableHead className="w-[90px] whitespace-nowrap text-center text-[11px] font-bold text-muted-foreground">العملة</TableHead>
                      <TableHead className="w-[150px] whitespace-nowrap text-right text-[11px] font-bold text-muted-foreground">الأسهم الحرة</TableHead>
                      <TableHead className="w-[300px] whitespace-nowrap text-right text-[11px] font-bold text-muted-foreground">حجم التداول</TableHead>
                      <TableHead className="w-[115px] whitespace-nowrap text-center text-[11px] font-bold text-muted-foreground">الكمية</TableHead>
                      <TableHead className="w-[130px] whitespace-nowrap text-right text-[11px] font-bold text-muted-foreground">متوسط الشراء</TableHead>
                      <TableHead className="w-[130px] whitespace-nowrap text-right text-[11px] font-bold text-muted-foreground">السعر الحالي</TableHead>
                      <TableHead className="hidden w-[175px] whitespace-nowrap text-right text-[11px] font-bold text-muted-foreground xl:table-cell">التكلفة الكلية</TableHead>
                      <TableHead className="hidden w-[175px] whitespace-nowrap text-right text-[11px] font-bold text-muted-foreground xl:table-cell">القيمة الحالية</TableHead>
                      <TableHead className="w-[180px] whitespace-nowrap text-right text-[11px] font-bold text-muted-foreground">الربح/الخسارة</TableHead>
                      <TableHead className="w-[260px] whitespace-nowrap text-center text-[11px] font-bold text-muted-foreground">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-10 text-muted-foreground">لا توجد أصول مجمعة</TableCell>
                      </TableRow>
                    ) : (
                      filteredAssets.map((asset) => {
                        const isPositive = asset.profitLoss >= 0;
                        const pct = pos52w(asset.currentPrice, asset.high52w, asset.low52w);
                        const vol = asset.volume ?? null;
                        const avgVol = asset.averageVolume ?? null;
                        const shortPctFloat = asset.shortPercentOfFloat ?? null;
                        const shortRatio = asset.shortRatio ?? null;
                        const floatShares = asset.floatShares ?? null;
                        const sharesOutstanding = asset.sharesOutstanding ?? null;
                        const shortDataSource = asset.shortDataSource ?? null;
                        const marketCap = asset.marketCap != null && asset.marketCap > 0
                          ? asset.marketCap
                          : (sharesOutstanding != null && sharesOutstanding > 0 && asset.currentPrice > 0 ? sharesOutstanding * asset.currentPrice : null);
                        const estimatedSharesOutstanding = (sharesOutstanding != null && sharesOutstanding > 0)
                          ? sharesOutstanding
                          : (marketCap != null && marketCap > 0 && asset.currentPrice > 0 ? marketCap / asset.currentPrice : null);
                        const inferredFloatShares = (asset.sharesShort != null && asset.sharesShort > 0 && shortPctFloat != null && shortPctFloat > 0)
                          ? (asset.sharesShort * 100) / shortPctFloat
                          : null;
                        const freeFloatShares = (floatShares != null && floatShares > 0)
                          ? floatShares
                          : (inferredFloatShares != null && inferredFloatShares > 0
                            ? inferredFloatShares
                            : (estimatedSharesOutstanding != null && estimatedSharesOutstanding > 0 ? estimatedSharesOutstanding : null));
                        const freeFloatKind: 'feed' | 'derived' | 'estimated' | null = (floatShares != null && floatShares > 0)
                          ? 'feed'
                          : (inferredFloatShares != null && inferredFloatShares > 0
                            ? 'derived'
                            : (freeFloatShares != null ? 'estimated' : null));
                        const sharesShort = (asset.sharesShort != null && asset.sharesShort > 0)
                          ? asset.sharesShort
                          : (shortPctFloat != null && shortPctFloat > 0 && freeFloatShares != null && freeFloatShares > 0
                            ? (shortPctFloat / 100) * freeFloatShares
                            : null);
                        const sharesBuyToCover = sharesShort;
                        const volRatio = vol != null && avgVol != null && avgVol > 0 ? vol / avgVol : null;
                        const shortPositionLabel = pct == null
                          ? 'غير متاح'
                          : (pct > 70 ? 'قريب من الأعلى' : pct < 30 ? 'قريب من الأدنى' : 'في المنتصف');
                        const volumeBarPct = volRatio != null ? Math.min(100, volRatio * 50) : 0;
                        const volRatioLabel = volRatio != null ? `${volRatio.toFixed(1)}x` : '—';
                        const volRatioToneClass = volRatio == null
                          ? 'text-muted-foreground'
                          : (volRatio > 1.5 ? 'text-green-600' : volRatio < 0.5 ? 'text-red-500' : 'text-muted-foreground');
                        const volRatioBarClass = volRatio == null
                          ? 'bg-muted-foreground/40'
                          : (volRatio > 1.5 ? 'bg-green-500' : volRatio < 0.5 ? 'bg-red-400' : 'bg-blue-400');
                        const shortPctLabel = shortPctFloat != null ? `${shortPctFloat.toFixed(2)}%` : 'غير متاح';
                        const shortRatioLabel = shortRatio != null ? shortRatio.toFixed(2) : '—';
                        const sharesShortLabel = sharesShort != null ? formatSharesCount(sharesShort) : 'غير متاح';
                        const sharesBuyToCoverLabel = sharesBuyToCover != null ? formatSharesCount(sharesBuyToCover) : 'غير متاح';
                        const sharesOutstandingLabel = estimatedSharesOutstanding != null && estimatedSharesOutstanding > 0 ? formatSharesCount(estimatedSharesOutstanding) : 'غير متاح';
                        const freeFloatLabel = freeFloatShares != null ? formatSharesCount(freeFloatShares) : 'غير متاح';
                        const marketCapLabel = marketCap != null ? formatSharesCount(marketCap) : '—';
                        const sourceLabel = shortDataSource || asset.priceSource || 'غير متاح';
                        return (
                          <Fragment key={asset.id}>
                          <TableRow className="border-b-0 border-t-2 border-border/70 odd:bg-background even:bg-slate-50/35 hover:bg-primary/5 dark:even:bg-slate-900/15">
                            <TableCell className="whitespace-nowrap align-middle font-extrabold text-primary">{asset.symbol}</TableCell>
                            <TableCell className="align-top">
                              <p className="max-w-[170px] truncate text-sm font-medium" title={asset.name}>{asset.name}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Badge variant="outline" className={`text-[9px] px-1 ${ASSET_TYPE_COLORS[asset.assetType] || ''}`}>
                                  {ASSET_TYPE_LABELS[asset.assetType] || asset.assetType}
                                </Badge>
                                {asset.positions > 1 && (
                                  <span className="text-[9px] text-muted-foreground">×{asset.positions}</span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[10px] text-muted-foreground truncate" title={asset.portfolioName}>
                                {asset.portfolioName}
                              </p>
                            </TableCell>
                            <TableCell className="whitespace-nowrap align-middle text-right">
                              <span className="font-semibold tabular-nums">{marketCapLabel}</span>
                              {marketCap != null && (
                                <span className="mr-1 text-[10px] text-muted-foreground">{asset.currency}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center align-middle">
                              <Badge variant="secondary" className={`text-[10px] px-1.5 ${asset.currency === 'USD' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {asset.currency}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap align-middle">
                              <div className="flex flex-col leading-tight">
                                <span className="font-semibold tabular-nums">{freeFloatLabel}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {freeFloatKind === 'feed' ? 'مباشر' : freeFloatKind === 'derived' ? 'مستنتج' : freeFloatKind === 'estimated' ? 'تقريبي' : 'غير متاح'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="flex min-w-0 flex-col gap-1 text-[10px]" dir="rtl">
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  <span className="text-muted-foreground">حجم:</span>
                                  <span className="font-semibold tabular-nums">{vol != null ? formatVolume(vol) : '—'}</span>
                                  <span className="text-muted-foreground">|</span>
                                  <span className="text-muted-foreground">متوسط:</span>
                                  <span className="font-semibold tabular-nums">{avgVol != null ? formatVolume(avgVol) : '—'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="relative h-1.5 w-[130px] overflow-hidden rounded-full bg-muted">
                                    <div className={`absolute inset-y-0 right-0 rounded-full transition-all ${volRatioBarClass}`} style={{ width: `${volumeBarPct}%` }} />
                                    <div className="absolute inset-y-0 right-1/2 w-px bg-muted-foreground/30" />
                                  </div>
                                  <span className={`text-[10px] font-bold tabular-nums ${volRatioToneClass}`}>{volRatioLabel}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-center align-middle font-semibold tabular-nums">{formatNumber(asset.qty, 2)}</TableCell>
                            <TableCell className="whitespace-nowrap align-middle text-right">
                              <span className="font-medium tabular-nums">{formatNumber(asset.averageBuyPrice, 2)}</span>
                              <span className="text-[10px] text-muted-foreground mr-1">{curLabel(asset.currency)}</span>
                            </TableCell>
                            <TableCell className="font-bold whitespace-nowrap align-middle text-right">
                              <span className="tabular-nums">{formatNumber(asset.currentPrice, 2)}</span>
                              <span className="text-[10px] text-muted-foreground mr-1">{curLabel(asset.currency)}</span>
                            </TableCell>
                            <TableCell className="hidden whitespace-nowrap xl:table-cell">
                              <div className="flex flex-col">
                                <span className="font-medium">{formatNumber(asset.totalCost, 2)} <span className="text-[10px] text-muted-foreground">{curLabel(asset.currency)}</span></span>
                                {asset.currency !== 'SAR' && <span className="text-[10px] text-muted-foreground">≈ {formatCurrency(asset.totalCostSAR)}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="hidden font-semibold whitespace-nowrap xl:table-cell">
                              <div className="flex flex-col">
                                <span>{formatNumber(asset.totalValue, 2)} <span className="text-[10px] text-muted-foreground">{curLabel(asset.currency)}</span></span>
                                {asset.currency !== 'SAR' && <span className="text-[10px] text-muted-foreground">≈ {formatCurrency(asset.totalValueSAR)}</span>}
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap align-middle">
                              <div className={`rounded-md border px-2 py-1.5 ${isPositive ? 'border-green-200 bg-green-50/60 text-green-700 dark:border-green-900 dark:bg-green-950/25' : 'border-red-200 bg-red-50/60 text-red-700 dark:border-red-900 dark:bg-red-950/25'}`}>
                                <span className="font-extrabold text-sm tabular-nums">{isPositive ? '+' : ''}{formatNumber(asset.profitLoss, 2)}</span>
                                <span className="mr-0.5 text-[10px]">{curLabel(asset.currency)}</span>
                                <span className="block text-xs font-bold tabular-nums">({isPositive ? '+' : ''}{formatPercent(asset.profitLossPct)})</span>
                                {asset.currency !== 'SAR' && (
                                  <span className="block text-[10px] text-muted-foreground">≈ {isPositive ? '+' : ''}{formatCurrency(asset.profitLossSAR)}</span>
                                )}
                              </div>
                              <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground xl:hidden">
                                <p>التكلفة: {formatNumber(asset.totalCost, 2)} {curLabel(asset.currency)}</p>
                                <p>القيمة: {formatNumber(asset.totalValue, 2)} {curLabel(asset.currency)}</p>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[250px] whitespace-nowrap align-middle">
                              <div className="flex flex-nowrap items-center justify-end gap-1.5 whitespace-nowrap" dir="rtl">
                                <Button variant="outline" size="sm" className={ACTION_MOVE_BUTTON_CLASS} onClick={() => openMoveDialog(asset)} disabled={actionSaving}>
                                  <ArrowRightLeft className="h-3.5 w-3.5" />
                                  <span>نقل</span>
                                </Button>
                                <Button variant="outline" size="sm" className={ACTION_EDIT_BUTTON_CLASS} onClick={() => openEditDialog(asset)} disabled={actionSaving}>
                                  <Edit2 className="h-3.5 w-3.5" />
                                  <span>تعديل</span>
                                </Button>
                                <Button variant="outline" size="sm" className={ACTION_SELL_BUTTON_CLASS} onClick={() => openSellDialog(asset)} disabled={actionSaving}>
                                  <ArrowDownRight className="h-3.5 w-3.5" />
                                  <span>بيع</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          <TableRow className="border-b-2 border-border/80 bg-muted/10">
                            <TableCell colSpan={13} className="pt-0 pb-3">
                              <div dir="rtl" className="rounded-md border-2 border-border/70 bg-background/90 px-2.5 py-1.5 text-[10px]">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  {(asset.high52w != null || asset.low52w != null) ? (
                                    <>
                                      <div className="flex items-center gap-2" dir="ltr">
                                        <span className="whitespace-nowrap text-red-600">أدنى 52: <span className="font-semibold tabular-nums">{asset.low52w != null ? formatNumber(asset.low52w, 2) : 'غير متاح'}</span></span>
                                        <div className="relative min-w-[210px] w-[230px]">
                                          <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                                            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500 opacity-45" />
                                            {pct !== null && (
                                              <div
                                                className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow-sm transition-[left] duration-500"
                                                style={{ left: `calc(${pct}% - 7px)` }}
                                              />
                                            )}
                                          </div>
                                          {pct !== null && (
                                            <span
                                              className="absolute top-[12px] -translate-x-1/2 whitespace-nowrap text-[10px] font-bold tabular-nums text-primary"
                                              style={{ left: `${pct}%` }}
                                            >
                                              {formatNumber(asset.currentPrice, 2)}
                                            </span>
                                          )}
                                        </div>
                                        <span className="whitespace-nowrap text-green-600">أعلى 52: <span className="font-semibold tabular-nums">{asset.high52w != null ? formatNumber(asset.high52w, 2) : 'غير متاح'}</span></span>
                                      </div>
                                      <span className="text-muted-foreground">{shortPositionLabel}{pct != null ? ` ${Math.round(pct)}%` : ''}</span>
                                      <span className="text-muted-foreground">|</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-muted-foreground">نطاق 52 أسبوع: غير متاح</span>
                                      <span className="text-muted-foreground">|</span>
                                    </>
                                  )}
                                  <span className="text-muted-foreground">البيع على المكشوف:</span>
                                  <span className="font-semibold tabular-nums">{shortPctLabel}</span>
                                  <span className="text-muted-foreground">|</span>
                                  <span className="text-muted-foreground">DTC:</span>
                                  <span className="font-semibold tabular-nums">{shortRatioLabel}</span>
                                  <span className="text-muted-foreground">|</span>
                                  <span className="text-muted-foreground">أسهم الشورت:</span>
                                  <span className="font-semibold tabular-nums">{sharesShortLabel}</span>
                                  <span className="text-muted-foreground">|</span>
                                  <span className="text-muted-foreground">الشراء للتغطية:</span>
                                  <span className="font-semibold tabular-nums">{sharesBuyToCoverLabel}</span>
                                  <span className="text-muted-foreground">|</span>
                                  <span className="text-muted-foreground">الأسهم القائمة:</span>
                                  <span className="font-semibold tabular-nums">{sharesOutstandingLabel}</span>
                                  <span className="text-muted-foreground">|</span>
                                  <span className="text-muted-foreground">المصدر:</span>
                                  <span className="font-medium">{sourceLabel}</span>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                          </Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Sell Dialog */}
          <Dialog open={sellOpen} onOpenChange={setSellOpen}>
            <DialogContent dir="rtl" className="max-w-xl">
              <DialogHeader>
                <DialogTitle>تنفيذ بيع مؤسسي</DialogTitle>
                <DialogDescription>
                  بيع {sellAsset?.symbol} على أساس متوسط التكلفة المجمّع داخل نفس المحفظة.
                </DialogDescription>
              </DialogHeader>
              {sellAsset && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>الكمية المتاحة</Label>
                      <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-semibold">{formatNumber(sellAsset.qty, 4)}</div>
                    </div>
                    <div className="space-y-1">
                      <Label>متوسط التكلفة/وحدة</Label>
                      <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-semibold">
                        {formatNumber(sellAsset.qty > 0 ? (sellAsset.totalCost / sellAsset.qty) : sellAsset.averageBuyPrice, 4)} {sellAsset.currency}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>كمية البيع</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={sellForm.qty}
                        onChange={(e) => setSellForm((prev) => ({ ...prev, qty: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>سعر البيع</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={sellForm.sellPrice}
                        onChange={(e) => setSellForm((prev) => ({ ...prev, sellPrice: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>تاريخ البيع</Label>
                      <Input
                        type="date"
                        value={sellForm.sellDate}
                        onChange={(e) => setSellForm((prev) => ({ ...prev, sellDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/15 p-3 text-sm space-y-2">
                    <p className="text-xs font-semibold text-primary">مبالغ العمولة والضريبة والرسوم</p>
                    <p className="text-[11px] text-muted-foreground">
                      إعدادات السوق: {sellTaxDefaults.marketKey.toUpperCase()} • عمولة {sellTaxDefaults.brokeragePct}% • ضريبة عمولة {sellTaxDefaults.vatPct}%
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label>عمولة السمسرة ({sellAsset.currency})</Label>
                        <Input
                          type="number"
                          min="0"
                          value={sellForm.customBrok}
                          placeholder={sellGrossAmount > 0 ? `تلقائي ${(sellGrossAmount * (sellTaxDefaults.brokeragePct / 100)).toFixed(2)}` : 'مبلغ...'}
                          onChange={(e) => setSellForm((prev) => ({ ...prev, customBrok: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>ضريبة العمولة ({sellAsset.currency})</Label>
                        <Input
                          type="number"
                          min="0"
                          value={sellForm.customVat}
                          placeholder={sellFeeCalc.brokerage > 0 ? `تلقائي ${(sellFeeCalc.brokerage * (sellTaxDefaults.vatPct / 100)).toFixed(2)}` : 'مبلغ...'}
                          onChange={(e) => setSellForm((prev) => ({ ...prev, customVat: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>رسوم إضافية ({sellAsset.currency})</Label>
                        <Input
                          type="number"
                          min="0"
                          value={sellForm.customOtherFees}
                          placeholder="0.00"
                          onChange={(e) => setSellForm((prev) => ({ ...prev, customOtherFees: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/15 p-3 text-sm space-y-2">
                    <p className="text-xs font-semibold text-primary">التطهير (اختياري)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>مبلغ التطهير ({sellAsset.currency})</Label>
                        <Input
                          type="number"
                          min="0"
                          value={sellForm.customPurification}
                          placeholder={sellProfitBeforePurificationCalc > 0 ? `تلقائي ${formatNumber(sellPurificationAmountAutoCalc, 2)}` : '0.00'}
                          onChange={(e) => setSellForm((prev) => ({ ...prev, customPurification: e.target.value }))}
                        />
                      </div>
                      <div className="rounded-md border bg-background px-3 py-2 text-[11px] space-y-1">
                        <p className="text-muted-foreground">نسبة التطهير الحالية</p>
                        <p className="font-semibold">
                          {sellPurificationLoading ? 'جاري التحميل...' : `${formatNumber(sellPurification.purificationPct, 4)}%`}
                        </p>
                        <p className="text-muted-foreground">
                          ({formatNumber(sellPurification.interestIncomeToRevenuePct, 4)}% + {formatNumber(sellPurification.debtToMarketCapPct, 4)}%)
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      التطهير يُخصم من الربح فقط. الحد الأقصى المسموح: {formatNumber(sellProfitBeforePurificationCalc, 2)} {sellAsset.currency}
                    </p>
                    {!sellPurificationLoading && !sellPurification.found && sellAssetPurificationType && (
                      <p className="text-[10px] text-amber-600">لم تتوفر بيانات تطهير تلقائية لهذا الأصل، يمكنك إدخال المبلغ يدويًا.</p>
                    )}
                  </div>
                  <div className="rounded-lg border bg-muted/15 p-3 text-sm space-y-1.5">
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي مبلغ البيع</span><span>{formatNumber(sellGrossAmount, 2)} {sellAsset.currency}</span></div>
                    <div className="flex items-center justify-between text-red-500/80"><span>- العمولة</span><span>{formatNumber(sellFeeCalc.brokerage, 2)}</span></div>
                    <div className="flex items-center justify-between text-red-500/80"><span>- الضريبة</span><span>{formatNumber(sellFeeCalc.vat, 2)}</span></div>
                    <div className="flex items-center justify-between text-red-500/80"><span>- الرسوم الإضافية</span><span>{formatNumber(sellOtherFees, 2)}</span></div>
                    <div className="flex items-center justify-between text-red-500/80"><span>- مبلغ التطهير</span><span>{formatNumber(sellPurificationAmountCalc, 2)}{sellHasManualPurification ? ' (يدوي)' : ''}</span></div>
                    <div className="border-t pt-1.5 flex items-center justify-between font-medium"><span className="text-muted-foreground">صافي عائد البيع</span><span>{formatNumber(sellNetAfterPurification, 2)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">تكلفة الكمية المباعة</span><span>{formatNumber(sellCostBasisCalc, 2)} ({formatNumber(sellAvgCostPerUnit, 4)} للوحدة)</span></div>
                    <div className={`mt-1 border-t pt-1.5 flex items-center justify-between font-bold ${sellProfitAfterPurification >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <span>ربح/خسارة الصفقة</span>
                      <span>{sellProfitAfterPurification >= 0 ? '+' : ''}{formatNumber(sellProfitAfterPurification, 2)} ({sellProfitAfterPurification >= 0 ? '+' : ''}{formatPercent(sellProfitAfterPurificationPct)})</span>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSellOpen(false)} disabled={actionSaving}>إلغاء</Button>
                <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => void executeSell()} disabled={actionSaving}>
                  {actionSaving ? 'جاري التنفيذ...' : 'تنفيذ البيع'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Move Dialog */}
          <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
            <DialogContent dir="rtl" className="max-w-xl">
              <DialogHeader>
                <DialogTitle>نقل مركز بين المحافظ</DialogTitle>
                <DialogDescription>
                  نقل {moveAsset?.symbol} من محفظة إلى أخرى بنفس متوسط التكلفة.
                </DialogDescription>
              </DialogHeader>
              {moveAsset && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>محفظة المصدر</Label>
                      <Select value={moveSourcePortfolioId} onValueChange={setMoveSourcePortfolioId}>
                        <SelectTrigger><SelectValue placeholder="اختر المصدر" /></SelectTrigger>
                        <SelectContent>
                          {moveSourceOptions.map((option) => (
                            <SelectItem key={option.portfolioId} value={option.portfolioId}>
                              {option.portfolioName} ({formatNumber(option.qty, 4)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>محفظة الهدف</Label>
                      <Select value={moveTargetPortfolioId} onValueChange={setMoveTargetPortfolioId}>
                        <SelectTrigger><SelectValue placeholder="اختر الهدف" /></SelectTrigger>
                        <SelectContent>
                          {portfolios
                            .filter((portfolio) => portfolio.id !== moveSourcePortfolioId)
                            .map((portfolio) => (
                              <SelectItem key={portfolio.id} value={portfolio.id}>{portfolio.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>كمية النقل</Label>
                      <Input type="number" min="0" step="0.0001" value={moveQty} onChange={(e) => setMoveQty(e.target.value)} />
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/15 p-3 text-sm">
                    <p className="text-muted-foreground">المتاح في المصدر: <span className="font-semibold text-foreground">{formatNumber(moveSourceAvailableQty, 4)}</span></p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setMoveOpen(false)} disabled={actionSaving}>إلغاء</Button>
                <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => void executeMove()} disabled={actionSaving}>
                  {actionSaving ? 'جاري النقل...' : 'تنفيذ النقل'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent dir="rtl" className="max-w-xl">
              <DialogHeader>
                <DialogTitle>تعديل أصل مجمّع</DialogTitle>
                <DialogDescription>
                  سيتم تطبيق التعديل على كل المراكز المرتبطة بنفس الرمز داخل نفس المحفظة.
                </DialogDescription>
              </DialogHeader>
              {editAsset && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>الاسم</Label>
                      <Input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>السعر الحالي</Label>
                      <Input type="number" min="0" step="0.0001" value={editForm.currentPrice} onChange={(e) => setEditForm((prev) => ({ ...prev, currentPrice: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>أعلى 52 أسبوع</Label>
                      <Input type="number" min="0" step="0.0001" value={editForm.high52w} onChange={(e) => setEditForm((prev) => ({ ...prev, high52w: e.target.value }))} />
                    </div>
                    <div className="space-y-1">
                      <Label>أدنى 52 أسبوع</Label>
                      <Input type="number" min="0" step="0.0001" value={editForm.low52w} onChange={(e) => setEditForm((prev) => ({ ...prev, low52w: e.target.value }))} />
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/15 p-3 text-sm space-y-2">
                    <p className="text-xs font-semibold text-primary">مبالغ العمولة والضريبة والرسوم (التعديل)</p>
                    <p className="text-[11px] text-muted-foreground">
                      إعدادات السوق: {editTaxDefaults.marketKey.toUpperCase()} • عمولة {editTaxDefaults.brokeragePct}% • ضريبة عمولة {editTaxDefaults.vatPct}%
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label>عمولة السمسرة ({editAsset.currency})</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editForm.customBrok}
                          placeholder={editGrossAmount > 0 ? `تلقائي ${(editGrossAmount * (editTaxDefaults.brokeragePct / 100)).toFixed(2)}` : 'مبلغ...'}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, customBrok: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>ضريبة العمولة ({editAsset.currency})</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editForm.customVat}
                          placeholder={editFeeCalc.brokerage > 0 ? `تلقائي ${(editFeeCalc.brokerage * (editTaxDefaults.vatPct / 100)).toFixed(2)}` : 'مبلغ...'}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, customVat: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>رسوم إضافية ({editAsset.currency})</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editForm.customOtherFees}
                          placeholder="0.00"
                          onChange={(e) => setEditForm((prev) => ({ ...prev, customOtherFees: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="rounded-md border bg-background px-3 py-2 space-y-1 text-[12px]">
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي التكلفة المرجعية</span><span>{formatNumber(editGrossAmount, 2)} {editAsset.currency}</span></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">العمولة</span><span>{formatNumber(editFeeCalc.brokerage, 2)}</span></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">الضريبة</span><span>{formatNumber(editFeeCalc.vat, 2)}</span></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">الرسوم الإضافية</span><span>{formatNumber(editOtherFees, 2)}</span></div>
                      <div className="border-t pt-1 flex items-center justify-between font-semibold"><span>التكلفة بعد الرسوم</span><span>{formatNumber(editTotalWithFees, 2)} {editAsset.currency}</span></div>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)} disabled={actionSaving}>إلغاء</Button>
                <Button className="bg-sky-600 hover:bg-sky-700" onClick={() => void executeEdit()} disabled={actionSaving}>
                  {actionSaving ? 'جاري التعديل...' : 'حفظ التعديل'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
