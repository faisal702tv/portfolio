'use client';

import { useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Download,
  GitCompare,
  Loader2,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { fetchAllPortfoliosSnapshots, type PortfolioSnapshot } from '@/lib/export-utils';

interface SearchAsset {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  type?: string;
  source?: string;
  sector?: string;
  shariaStatus?: string;
  shariaBilad?: string;
  shariaRajhi?: string;
  shariaMaqasid?: string;
  shariaZero?: string;
}

interface PriceQuote {
  price: number;
  change: number;
  changePct: number;
  high52w?: number | null;
  low52w?: number | null;
  volume?: number;
  averageVolume?: number;
  marketCap?: number;
  source?: string;
  currency?: string;
}

interface HistoryPoint {
  ts: number;
  close: number;
}

interface FundamentalData {
  pe: number | null;
  dividend: number | null;
  marketCap: number | null;
  sector: string | null;
  shariaStatus: string | null;
  shariaBilad: string | null;
  shariaRajhi: string | null;
  shariaMaqasid: string | null;
  shariaZero: string | null;
}

interface CompareSnapshot {
  symbol: string;
  chartKey: string;
  name: string;
  exchange: string;
  sector: string;
  currency: string;
  source: string;
  price: number | null;
  changePct: number | null;
  high52w: number | null;
  low52w: number | null;
  volume: number | null;
  averageVolume: number | null;
  volumeRatio: number | null;
  marketCap: number | null;
  pe: number | null;
  dividend: number | null;
  periodReturn: number | null;
  volatility: number | null;
  maxDrawdown: number | null;
  shariaStatus: string | null;
  shariaBilad: string | null;
  shariaRajhi: string | null;
  shariaMaqasid: string | null;
  shariaZero: string | null;
}

type CompareTab = 'overview' | 'valuation' | 'sharia';
type ChartMode = 'normalized' | 'price';
type RangeKey = '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y';

const SYMBOL_STORAGE_KEY = 'compare_symbols_v4';
const MAX_COMPARE = 6;
const MIN_COMPARE = 2;

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: '1mo', label: 'شهر' },
  { value: '3mo', label: '3 أشهر' },
  { value: '6mo', label: '6 أشهر' },
  { value: '1y', label: 'سنة' },
  { value: '2y', label: 'سنتان' },
  { value: '5y', label: '5 سنوات' },
];

const INTERVAL_BY_RANGE: Record<RangeKey, string> = {
  '1mo': '1d',
  '3mo': '1d',
  '6mo': '1d',
  '1y': '1wk',
  '2y': '1wk',
  '5y': '1mo',
};

const COLORS = ['#b8860b', '#4f46e5', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#0ea5e9', '#16a34a'];

function normalizeSymbol(value: string): string {
  return value.trim().toUpperCase();
}

function chartKeyForSymbol(symbol: string): string {
  return `s_${normalizeSymbol(symbol).replace(/[^A-Z0-9]/g, '_')}`;
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseMarketCap(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;

  const raw = value.trim().toUpperCase().replace(/,/g, '');
  if (!raw) return null;

  const withSuffix = raw.match(/^(-?\d+(?:\.\d+)?)([TMBK])$/);
  if (withSuffix) {
    const amount = Number(withSuffix[1]);
    const suffix = withSuffix[2];
    const factor = suffix === 'T' ? 1e12 : suffix === 'B' ? 1e9 : suffix === 'M' ? 1e6 : 1e3;
    return Number.isFinite(amount) ? amount * factor : null;
  }

  const plain = Number(raw);
  return Number.isFinite(plain) ? plain : null;
}

function formatDecimal(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value > 0 ? '+' : ''}${formatDecimal(value, digits)}%`;
}

function formatCompactNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return formatDecimal(value, 2);
}

function computeVolatility(closes: number[]): number | null {
  if (closes.length < 3) return null;
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i += 1) {
    const prev = closes[i - 1];
    const curr = closes[i];
    if (prev > 0 && Number.isFinite(curr)) {
      returns.push((curr - prev) / prev);
    }
  }
  if (returns.length < 2) return null;
  const mean = returns.reduce((s, x) => s + x, 0) / returns.length;
  const variance = returns.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * 100;
}

function computeMaxDrawdown(closes: number[]): number | null {
  if (closes.length < 2) return null;
  let peak = closes[0];
  let maxDd = 0;

  for (const close of closes) {
    if (close > peak) peak = close;
    if (peak > 0) {
      const dd = ((close - peak) / peak) * 100;
      if (dd < maxDd) maxDd = dd;
    }
  }

  return maxDd;
}

function compute52wPosition(price: number | null, low: number | null, high: number | null): number | null {
  if (price == null || low == null || high == null || high <= low) return null;
  return Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100));
}

function shariaLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const v = value.toLowerCase();
  if (v === '✅' || v.includes('compliant') || v.includes('حلال') || v.includes('نقي')) return '✅ متوافق';
  if (v === '❌' || v.includes('non_compliant') || v.includes('غير')) return '❌ غير متوافق';
  return value;
}

function firstNonEmpty<T>(...values: Array<T | null | undefined>): T | null {
  for (const value of values) {
    if (value != null && value !== '' as T) {
      return value;
    }
  }
  return null;
}

function sanitizeCsvCell(value: string): string {
  const safe = value.replace(/"/g, '""');
  return `"${safe}"`;
}

function quoteFromPricesPayload(symbol: string, data: Record<string, any>): PriceQuote | null {
  const upper = normalizeSymbol(symbol);
  const direct = data[upper] || data[symbol];

  const fallbackEntry = Object.entries(data).find(([key]) => {
    const k = key.toUpperCase();
    return k === upper || k.endsWith(`_${upper}`);
  });

  const raw = direct || fallbackEntry?.[1];
  if (!raw) return null;

  const price = toNumber(raw.price);
  if (price == null || price <= 0) return null;

  return {
    price,
    change: toNumber(raw.change) || 0,
    changePct: toNumber(raw.changePct) || 0,
    high52w: toNumber(raw.high52w),
    low52w: toNumber(raw.low52w),
    volume: toNumber(raw.volume) || undefined,
    averageVolume: toNumber(raw.averageVolume) || undefined,
    marketCap: toNumber(raw.marketCap) || undefined,
    source: typeof raw.source === 'string' ? raw.source : undefined,
  };
}

function formatChartDate(ts: number, range: RangeKey): string {
  const date = new Date(ts);
  if (range === '1mo' || range === '3mo') {
    return date.toLocaleDateString('ar-SA-u-ca-gregory', { month: 'short', day: 'numeric' });
  }
  if (range === '5y') {
    return date.toLocaleDateString('ar-SA-u-ca-gregory', { year: '2-digit', month: 'short' });
  }
  return date.toLocaleDateString('ar-SA-u-ca-gregory', { month: 'short', day: 'numeric' });
}

export default function ComparePage() {
  const { toast } = useToast();
  const { portfolios } = usePortfolioSnapshot();

  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['AAPL', 'MSFT'];
    try {
      const raw = localStorage.getItem(SYMBOL_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s) => normalizeSymbol(String(s))).filter(Boolean).slice(0, MAX_COMPARE);
      }
    } catch {
      // ignore invalid local storage
    }
    return ['AAPL', 'MSFT'];
  });

  const [range, setRange] = useState<RangeKey>('6mo');
  const [chartMode, setChartMode] = useState<ChartMode>('normalized');
  const [activeTab, setActiveTab] = useState<CompareTab>('overview');

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchAsset[]>([]);

  const [metaBySymbol, setMetaBySymbol] = useState<Record<string, SearchAsset>>({});
  const [portfolioPicks, setPortfolioPicks] = useState<SearchAsset[]>([]);

  const [quotesBySymbol, setQuotesBySymbol] = useState<Record<string, PriceQuote>>({});
  const [historyBySymbol, setHistoryBySymbol] = useState<Record<string, HistoryPoint[]>>({});
  const [fundamentalBySymbol, setFundamentalBySymbol] = useState<Record<string, FundamentalData>>({});

  const [loadingComparison, setLoadingComparison] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const symbolChartKeys = useMemo(() => {
    const map: Record<string, string> = {};
    for (const symbol of selectedSymbols) {
      map[symbol] = chartKeyForSymbol(symbol);
    }
    return map;
  }, [selectedSymbols]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SYMBOL_STORAGE_KEY, JSON.stringify(selectedSymbols));
  }, [selectedSymbols]);

  useEffect(() => {
    let active = true;
    if (portfolios.length === 0) {
      setPortfolioPicks([]);
      return () => {
        active = false;
      };
    }

    fetchAllPortfoliosSnapshots(portfolios)
      .then((snaps: PortfolioSnapshot[]) => {
        if (!active) return;
        const bySymbol = new Map<string, { score: number; meta: SearchAsset }>();

        for (const snap of snaps) {
          for (const stock of snap.stocks || []) {
            const symbol = normalizeSymbol(stock.symbol || '');
            if (!symbol) continue;
            const qty = Number(stock.qty || 0);
            const current = Number(stock.currentPrice ?? stock.buyPrice ?? 0);
            const score = Math.max(0, qty * current);
            const prev = bySymbol.get(symbol);
            if (!prev || score > prev.score) {
              bySymbol.set(symbol, {
                score,
                meta: {
                  symbol,
                  name: stock.name || symbol,
                  exchange: stock.exchange || '',
                  currency: stock.currency || '',
                  sector: stock.sector || '',
                  shariaStatus: stock.shariaStatus || undefined,
                  shariaBilad: stock.shariaBilad || undefined,
                  shariaRajhi: stock.shariaRajhi || undefined,
                  shariaMaqasid: stock.shariaMaqasid || undefined,
                  shariaZero: stock.shariaZero || undefined,
                  source: snap.portfolioName || 'المحفظة',
                },
              });
            }
          }
        }

        const top = [...bySymbol.values()]
          .sort((a, b) => b.score - a.score)
          .slice(0, 12)
          .map((item) => item.meta);

        setPortfolioPicks(top);
        if (top.length > 0) {
          setMetaBySymbol((prev) => {
            const next = { ...prev };
            for (const item of top) {
              if (!next[item.symbol]) next[item.symbol] = item;
            }
            return next;
          });
        }
      })
      .catch(() => {
        if (active) setPortfolioPicks([]);
      });

    return () => {
      active = false;
    };
  }, [portfolios]);

  useEffect(() => {
    const q = deferredSearchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}&type=stock`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`search failed: ${res.status}`);

        const payload = await res.json();
        const rows = Array.isArray(payload?.results) ? payload.results : [];
        const mapped: SearchAsset[] = rows
          .map((row: any) => ({
            symbol: normalizeSymbol(String(row?.symbol || '')),
            name: String(row?.name || row?.symbol || ''),
            exchange: typeof row?.exchange === 'string' ? row.exchange : '',
            currency: typeof row?.currency === 'string' ? row.currency : '',
            type: typeof row?.type === 'string' ? row.type : '',
            source: typeof row?.source === 'string' ? row.source : '',
            sector: typeof row?.sector === 'string' ? row.sector : '',
            shariaStatus: typeof row?.shariaStatus === 'string' ? row.shariaStatus : undefined,
            shariaBilad: typeof row?.shariaBilad === 'string' ? row.shariaBilad : undefined,
            shariaRajhi: typeof row?.shariaRajhi === 'string' ? row.shariaRajhi : undefined,
            shariaMaqasid: typeof row?.shariaMaqasid === 'string' ? row.shariaMaqasid : undefined,
            shariaZero: typeof row?.shariaZero === 'string' ? row.shariaZero : undefined,
          }))
          .filter((item: SearchAsset) => item.symbol);

        if (!cancelled) {
          const deduped = [...new Map(mapped.map((item) => [item.symbol, item])).values()];
          setSearchResults(deduped.slice(0, 12));
          if (deduped.length > 0) {
            setMetaBySymbol((prev) => {
              const next = { ...prev };
              for (const item of deduped) {
                if (!next[item.symbol]) next[item.symbol] = item;
              }
              return next;
            });
          }
        }
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [deferredSearchQuery]);

  useEffect(() => {
    const missing = selectedSymbols.filter((symbol) => !metaBySymbol[symbol]);
    if (missing.length === 0) return;

    let cancelled = false;

    (async () => {
      const patches: Record<string, SearchAsset> = {};
      await Promise.all(
        missing.map(async (symbol) => {
          try {
            const res = await fetch(`/api/market/search?q=${encodeURIComponent(symbol)}&type=stock`, {
              cache: 'no-store',
            });
            if (!res.ok) return;
            const payload = await res.json();
            const rows = Array.isArray(payload?.results) ? payload.results : [];
            const match = rows.find((row: any) => normalizeSymbol(String(row?.symbol || '')) === symbol);
            if (!match) return;
            patches[symbol] = {
              symbol,
              name: String(match?.name || symbol),
              exchange: typeof match?.exchange === 'string' ? match.exchange : '',
              currency: typeof match?.currency === 'string' ? match.currency : '',
              type: typeof match?.type === 'string' ? match.type : '',
              source: typeof match?.source === 'string' ? match.source : '',
              sector: typeof match?.sector === 'string' ? match.sector : '',
              shariaStatus: typeof match?.shariaStatus === 'string' ? match.shariaStatus : undefined,
              shariaBilad: typeof match?.shariaBilad === 'string' ? match.shariaBilad : undefined,
              shariaRajhi: typeof match?.shariaRajhi === 'string' ? match.shariaRajhi : undefined,
              shariaMaqasid: typeof match?.shariaMaqasid === 'string' ? match.shariaMaqasid : undefined,
              shariaZero: typeof match?.shariaZero === 'string' ? match.shariaZero : undefined,
            };
          } catch {
            // ignore metadata fetch failures
          }
        }),
      );

      if (!cancelled && Object.keys(patches).length > 0) {
        setMetaBySymbol((prev) => ({ ...prev, ...patches }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSymbols, metaBySymbol]);

  const addSymbol = useCallback((asset: SearchAsset) => {
    const symbol = normalizeSymbol(asset.symbol);
    if (!symbol) return;

    if (selectedSymbols.includes(symbol)) {
      toast({ title: 'موجود بالفعل', description: `${symbol} مضاف في المقارنة` });
      return;
    }

    if (selectedSymbols.length >= MAX_COMPARE) {
      toast({
        title: 'الحد الأقصى',
        description: `يمكن مقارنة ${MAX_COMPARE} أسهم كحد أقصى`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedSymbols((prev) => [...prev, symbol]);
    setMetaBySymbol((prev) => ({
      ...prev,
      [symbol]: {
        ...asset,
        symbol,
      },
    }));
    setSearchQuery('');
  }, [selectedSymbols, toast]);

  const removeSymbol = useCallback((symbol: string) => {
    setSelectedSymbols((prev) => prev.filter((item) => item !== symbol));
  }, []);

  const loadComparisonData = useCallback(async () => {
    if (selectedSymbols.length === 0) return;

    setLoadingComparison(true);
    setErrorMessage(null);

    const symbols = selectedSymbols.map((sym) => normalizeSymbol(sym));
    const nextQuotes: Record<string, PriceQuote> = {};
    const nextHistory: Record<string, HistoryPoint[]> = {};
    const nextFundamentals: Record<string, FundamentalData> = {};

    try {
      const pricesRes = await fetch(`/api/prices?symbols=${encodeURIComponent(symbols.join(','))}`, {
        cache: 'no-store',
      });

      if (pricesRes.ok) {
        const payload = await pricesRes.json();
        const data = payload?.data && typeof payload.data === 'object' ? payload.data : {};

        for (const symbol of symbols) {
          const quote = quoteFromPricesPayload(symbol, data);
          if (quote) {
            nextQuotes[symbol] = quote;
          }
        }
      }

      const missingQuoteSymbols = symbols.filter((symbol) => !nextQuotes[symbol]);
      if (missingQuoteSymbols.length > 0) {
        const quoteFallbacks = await Promise.all(
          missingQuoteSymbols.map(async (symbol) => {
            try {
              const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`, {
                cache: 'no-store',
              });
              if (!res.ok) return null;
              const payload = await res.json();
              const q = payload?.quote;
              if (!q || !Number.isFinite(Number(q.price))) return null;

              return {
                symbol,
                quote: {
                  price: Number(q.price),
                  change: Number(q.change ?? 0),
                  changePct: Number(q.changePct ?? 0),
                  source: typeof q.source === 'string' ? q.source : 'Market Quote',
                  currency: typeof q.currency === 'string' ? q.currency : undefined,
                } as PriceQuote,
              };
            } catch {
              return null;
            }
          }),
        );

        for (const item of quoteFallbacks) {
          if (item) nextQuotes[item.symbol] = item.quote;
        }
      }

      const interval = INTERVAL_BY_RANGE[range];
      const [historyResults, fundamentalsResults] = await Promise.all([
        Promise.all(
          symbols.map(async (symbol) => {
            try {
              const res = await fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`, {
                cache: 'no-store',
              });
              if (!res.ok) return { symbol, points: [] as HistoryPoint[] };

              const payload = await res.json();
              const rows = Array.isArray(payload?.data) ? payload.data : [];
              const points: HistoryPoint[] = rows
                .map((row: any) => ({
                  ts: Number(row?.timestamp) * 1000,
                  close: Number(row?.close),
                }))
                .filter((point: HistoryPoint) => Number.isFinite(point.ts) && Number.isFinite(point.close))
                .sort((a, b) => a.ts - b.ts);

              return { symbol, points };
            } catch {
              return { symbol, points: [] as HistoryPoint[] };
            }
          }),
        ),
        Promise.all(
          symbols.map(async (symbol) => {
            try {
              const res = await fetch(`/api/stocks?symbol=${encodeURIComponent(symbol)}`, {
                cache: 'no-store',
              });
              if (!res.ok) {
                return {
                  symbol,
                  data: {
                    pe: null,
                    dividend: null,
                    marketCap: null,
                    sector: null,
                    shariaStatus: null,
                    shariaBilad: null,
                    shariaRajhi: null,
                    shariaMaqasid: null,
                    shariaZero: null,
                  } as FundamentalData,
                };
              }

              const payload = await res.json();
              const stock = payload?.stock && typeof payload.stock === 'object' ? payload.stock : {};
              const sharia = stock?.sharia && typeof stock.sharia === 'object' ? stock.sharia : {};
              const details = stock?.shariaDetails && typeof stock.shariaDetails === 'object' ? stock.shariaDetails : {};

              return {
                symbol,
                data: {
                  pe: toNumber(stock.pe ?? stock.pe_ratio),
                  dividend: toNumber(stock.dividend ?? stock.dividend_pct),
                  marketCap: parseMarketCap(stock.marketCap ?? stock.market_cap),
                  sector: typeof stock.sector === 'string' ? stock.sector : null,
                  shariaStatus: typeof sharia.status === 'string' ? sharia.status : null,
                  shariaBilad: typeof details?.alBilad?.status === 'string' ? details.alBilad.status : null,
                  shariaRajhi: typeof details?.alRajhi?.status === 'string' ? details.alRajhi.status : null,
                  shariaMaqasid: typeof details?.maqased?.status === 'string' ? details.maqased.status : null,
                  shariaZero: typeof details?.zeroDebt?.status === 'string' ? details.zeroDebt.status : null,
                } as FundamentalData,
              };
            } catch {
              return {
                symbol,
                data: {
                  pe: null,
                  dividend: null,
                  marketCap: null,
                  sector: null,
                  shariaStatus: null,
                  shariaBilad: null,
                  shariaRajhi: null,
                  shariaMaqasid: null,
                  shariaZero: null,
                } as FundamentalData,
              };
            }
          }),
        ),
      ]);

      for (const item of historyResults) {
        nextHistory[item.symbol] = item.points;
      }
      for (const item of fundamentalsResults) {
        nextFundamentals[item.symbol] = item.data;
      }

      setQuotesBySymbol(nextQuotes);
      setHistoryBySymbol(nextHistory);
      setFundamentalBySymbol(nextFundamentals);
      setLastUpdated(Date.now());

      if (Object.keys(nextQuotes).length === 0 && Object.values(nextHistory).every((points) => points.length === 0)) {
        setErrorMessage('تعذر جلب البيانات من المزودات الحالية. حاول تغيير الرموز أو إعادة التحديث.');
      }
    } catch {
      setErrorMessage('حدث خطأ أثناء تحميل بيانات المقارنة.');
    } finally {
      setLoadingComparison(false);
      setRefreshing(false);
    }
  }, [range, selectedSymbols]);

  useEffect(() => {
    void loadComparisonData();
  }, [loadComparisonData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadComparisonData();
  }, [loadComparisonData]);

  const snapshots = useMemo<CompareSnapshot[]>(() => {
    return selectedSymbols.map((symbol) => {
      const meta = metaBySymbol[symbol];
      const quote = quotesBySymbol[symbol] || null;
      const history = historyBySymbol[symbol] || [];
      const fundamental = fundamentalBySymbol[symbol] || null;

      const closes = history.map((point) => point.close).filter((close) => Number.isFinite(close));
      const firstClose = closes.length > 0 ? closes[0] : null;
      const lastClose = closes.length > 0 ? closes[closes.length - 1] : null;

      const fallbackPrice = firstNonEmpty<number>(quote?.price ?? null, lastClose ?? null);
      const periodReturn = firstClose != null && lastClose != null && firstClose > 0
        ? ((lastClose - firstClose) / firstClose) * 100
        : null;

      const volatility = computeVolatility(closes);
      const maxDrawdown = computeMaxDrawdown(closes);
      const volume = quote?.volume ?? null;
      const averageVolume = quote?.averageVolume ?? null;
      const volumeRatio = volume != null && averageVolume != null && averageVolume > 0
        ? volume / averageVolume
        : null;

      const marketCap = firstNonEmpty<number>(quote?.marketCap ?? null, fundamental?.marketCap ?? null);
      const pe = fundamental?.pe ?? null;
      const dividend = fundamental?.dividend ?? null;

      const high52w = quote?.high52w ?? null;
      const low52w = quote?.low52w ?? null;

      const shariaStatus = firstNonEmpty<string>(meta?.shariaStatus, fundamental?.shariaStatus);
      const shariaBilad = firstNonEmpty<string>(meta?.shariaBilad, fundamental?.shariaBilad);
      const shariaRajhi = firstNonEmpty<string>(meta?.shariaRajhi, fundamental?.shariaRajhi);
      const shariaMaqasid = firstNonEmpty<string>(meta?.shariaMaqasid, fundamental?.shariaMaqasid);
      const shariaZero = firstNonEmpty<string>(meta?.shariaZero, fundamental?.shariaZero);

      return {
        symbol,
        chartKey: symbolChartKeys[symbol],
        name: meta?.name || symbol,
        exchange: meta?.exchange || '—',
        sector: firstNonEmpty<string>(meta?.sector, fundamental?.sector) || '—',
        currency: firstNonEmpty<string>(meta?.currency, quote?.currency) || 'USD',
        source: firstNonEmpty<string>(meta?.source, quote?.source) || '—',
        price: fallbackPrice,
        changePct: quote?.changePct ?? null,
        high52w,
        low52w,
        volume,
        averageVolume,
        volumeRatio,
        marketCap,
        pe,
        dividend,
        periodReturn,
        volatility,
        maxDrawdown,
        shariaStatus: shariaStatus || null,
        shariaBilad: shariaBilad || null,
        shariaRajhi: shariaRajhi || null,
        shariaMaqasid: shariaMaqasid || null,
        shariaZero: shariaZero || null,
      };
    });
  }, [selectedSymbols, metaBySymbol, quotesBySymbol, historyBySymbol, fundamentalBySymbol, symbolChartKeys]);

  const chartConfig = useMemo<ChartConfig>(() => {
    return snapshots.reduce((acc, snap, index) => {
      acc[snap.chartKey] = {
        label: snap.name,
        color: COLORS[index % COLORS.length],
      };
      return acc;
    }, {} as ChartConfig);
  }, [snapshots]);

  const chartData = useMemo(() => {
    const timestampSet = new Set<number>();
    const priceMaps: Record<string, Map<number, number>> = {};
    const baseBySymbol: Record<string, number> = {};

    for (const snap of snapshots) {
      const points = historyBySymbol[snap.symbol] || [];
      const map = new Map<number, number>();
      for (const point of points) {
        timestampSet.add(point.ts);
        map.set(point.ts, point.close);
      }
      priceMaps[snap.symbol] = map;
      if (points.length > 0 && points[0].close > 0) {
        baseBySymbol[snap.symbol] = points[0].close;
      }
    }

    const timestamps = [...timestampSet].sort((a, b) => a - b);
    return timestamps.map((ts) => {
      const row: Record<string, number | string | null> = {
        label: formatChartDate(ts, range),
        ts,
      };

      for (const snap of snapshots) {
        const raw = priceMaps[snap.symbol]?.get(ts);
        if (raw == null || !Number.isFinite(raw)) {
          row[snap.chartKey] = null;
          continue;
        }
        if (chartMode === 'normalized') {
          const base = baseBySymbol[snap.symbol];
          row[snap.chartKey] = base && base > 0 ? (raw / base) * 100 : null;
        } else {
          row[snap.chartKey] = raw;
        }
      }

      return row;
    });
  }, [chartMode, historyBySymbol, range, snapshots]);

  const performanceData = useMemo(() => {
    return snapshots.map((snap) => ({
      symbol: snap.symbol,
      name: snap.name,
      returnPct: snap.periodReturn ?? 0,
      volatility: snap.volatility ?? 0,
      drawdown: Math.abs(snap.maxDrawdown ?? 0),
    }));
  }, [snapshots]);

  const insights = useMemo(() => {
    const withReturn = snapshots.filter((snap) => snap.periodReturn != null);
    const withRisk = snapshots.filter((snap) => snap.volatility != null);
    const withPe = snapshots.filter((snap) => snap.pe != null && (snap.pe || 0) > 0);
    const withDividend = snapshots.filter((snap) => snap.dividend != null);

    const bestReturn = withReturn.length > 0
      ? [...withReturn].sort((a, b) => (b.periodReturn || 0) - (a.periodReturn || 0))[0]
      : null;

    const lowestRisk = withRisk.length > 0
      ? [...withRisk].sort((a, b) => (a.volatility || 0) - (b.volatility || 0))[0]
      : null;

    const bestValue = withPe.length > 0
      ? [...withPe].sort((a, b) => (a.pe || 0) - (b.pe || 0))[0]
      : null;

    const bestIncome = withDividend.length > 0
      ? [...withDividend].sort((a, b) => (b.dividend || 0) - (a.dividend || 0))[0]
      : null;

    return { bestReturn, lowestRisk, bestValue, bestIncome };
  }, [snapshots]);

  const tableRowsByTab = useMemo(() => {
    const highLowPos = (snap: CompareSnapshot) => {
      const position = compute52wPosition(snap.price, snap.low52w, snap.high52w);
      if (position == null) return '—';
      if (position >= 70) return `${formatDecimal(position, 1)}% (قريب من الأعلى)`;
      if (position <= 30) return `${formatDecimal(position, 1)}% (قريب من الأدنى)`;
      return `${formatDecimal(position, 1)}% (وسط النطاق)`;
    };

    const overview = [
      {
        label: 'السعر الحالي',
        render: (snap: CompareSnapshot) => snap.price != null ? `${formatDecimal(snap.price, 2)} ${snap.currency}` : '—',
      },
      {
        label: 'التغير اليومي',
        render: (snap: CompareSnapshot) => formatPercent(snap.changePct),
      },
      {
        label: `عائد الفترة (${RANGE_OPTIONS.find((option) => option.value === range)?.label || range})`,
        render: (snap: CompareSnapshot) => formatPercent(snap.periodReturn),
      },
      {
        label: 'التذبذب التاريخي',
        render: (snap: CompareSnapshot) => formatPercent(snap.volatility, 2),
      },
      {
        label: 'أقصى تراجع',
        render: (snap: CompareSnapshot) => formatPercent(snap.maxDrawdown, 2),
      },
      {
        label: 'حجم التداول',
        render: (snap: CompareSnapshot) => formatCompactNumber(snap.volume),
      },
      {
        label: 'نسبة الحجم/المتوسط',
        render: (snap: CompareSnapshot) => snap.volumeRatio != null ? `${formatDecimal(snap.volumeRatio, 2)}x` : '—',
      },
      {
        label: 'القيمة السوقية',
        render: (snap: CompareSnapshot) => formatCompactNumber(snap.marketCap),
      },
    ];

    const valuation = [
      {
        label: 'P/E',
        render: (snap: CompareSnapshot) => formatDecimal(snap.pe, 2),
      },
      {
        label: 'عائد التوزيعات',
        render: (snap: CompareSnapshot) => formatPercent(snap.dividend, 2),
      },
      {
        label: 'أعلى 52 أسبوع',
        render: (snap: CompareSnapshot) => formatDecimal(snap.high52w, 2),
      },
      {
        label: 'أدنى 52 أسبوع',
        render: (snap: CompareSnapshot) => formatDecimal(snap.low52w, 2),
      },
      {
        label: 'موقع السعر ضمن 52 أسبوع',
        render: (snap: CompareSnapshot) => highLowPos(snap),
      },
      {
        label: 'القطاع',
        render: (snap: CompareSnapshot) => snap.sector,
      },
      {
        label: 'البورصة',
        render: (snap: CompareSnapshot) => snap.exchange,
      },
      {
        label: 'مصدر الرمز',
        render: (snap: CompareSnapshot) => snap.source,
      },
    ];

    const sharia = [
      {
        label: 'الحكم العام',
        render: (snap: CompareSnapshot) => shariaLabel(snap.shariaStatus),
      },
      {
        label: 'معيار البلاد',
        render: (snap: CompareSnapshot) => shariaLabel(snap.shariaBilad),
      },
      {
        label: 'معيار الراجحي',
        render: (snap: CompareSnapshot) => shariaLabel(snap.shariaRajhi),
      },
      {
        label: 'معيار المقاصد',
        render: (snap: CompareSnapshot) => shariaLabel(snap.shariaMaqasid),
      },
      {
        label: 'معيار صفر ديون',
        render: (snap: CompareSnapshot) => shariaLabel(snap.shariaZero),
      },
    ];

    return { overview, valuation, sharia };
  }, [range]);

  const exportCsv = useCallback(() => {
    if (snapshots.length === 0) {
      toast({ title: 'لا توجد بيانات', description: 'أضف أسهمًا للمقارنة أولًا', variant: 'destructive' });
      return;
    }

    const headers = [
      'الرمز',
      'الاسم',
      'البورصة',
      'القطاع',
      'العملة',
      'السعر الحالي',
      'التغير اليومي %',
      `عائد ${range}`,
      'التذبذب %',
      'أقصى تراجع %',
      'P/E',
      'عائد التوزيعات %',
      'القيمة السوقية',
      'الحجم',
      'متوسط الحجم',
      'حكم شرعي',
    ];

    const rows = snapshots.map((snap) => [
      snap.symbol,
      snap.name,
      snap.exchange,
      snap.sector,
      snap.currency,
      snap.price != null ? String(snap.price) : '',
      snap.changePct != null ? String(snap.changePct) : '',
      snap.periodReturn != null ? String(snap.periodReturn) : '',
      snap.volatility != null ? String(snap.volatility) : '',
      snap.maxDrawdown != null ? String(snap.maxDrawdown) : '',
      snap.pe != null ? String(snap.pe) : '',
      snap.dividend != null ? String(snap.dividend) : '',
      snap.marketCap != null ? String(snap.marketCap) : '',
      snap.volume != null ? String(snap.volume) : '',
      snap.averageVolume != null ? String(snap.averageVolume) : '',
      shariaLabel(snap.shariaStatus),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => sanitizeCsvCell(String(cell ?? ''))).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stocks-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast({ title: 'تم التصدير', description: 'تم تنزيل ملف CSV للمقارنة' });
  }, [range, snapshots, toast]);

  const hasEnoughSymbols = selectedSymbols.length >= MIN_COMPARE;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="📊 مقارنة الأسهم المتقدمة" onRefresh={handleRefresh} isRefreshing={refreshing || loadingComparison} />

        <main className="p-6 space-y-6">
          <Card className="border-slate-300/70 bg-gradient-to-l from-background via-slate-50 to-amber-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-primary" />
                منصة مقارنة أسهم متصلة ببيانات المشروع
              </CardTitle>
              <CardDescription>
                بحث مباشر من قاعدة الرموز، أسعار حية، رسوم تاريخية، تحليل مخاطر، ومقارنة شرعية متقدمة.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">Live APIs</Badge>
              <Badge variant="outline">/api/market/search</Badge>
              <Badge variant="outline">/api/prices</Badge>
              <Badge variant="outline">/api/chart</Badge>
              <Badge variant="outline">/api/stocks</Badge>
              {lastUpdated && <Badge variant="outline">آخر تحديث: {new Date(lastUpdated).toLocaleTimeString('ar-SA-u-ca-gregory')}</Badge>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">اختيار الأسهم للمقارنة (حتى {MAX_COMPARE})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedSymbols.map((symbol) => {
                  const meta = metaBySymbol[symbol];
                  return (
                    <Badge key={symbol} variant="secondary" className="px-3 py-1.5 text-sm gap-2">
                      <span className="font-bold">{symbol}</span>
                      <span className="text-muted-foreground max-w-[180px] truncate">{meta?.name || symbol}</span>
                      <button
                        onClick={() => removeSymbol(symbol)}
                        className="h-4 w-4 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 flex items-center justify-center"
                        aria-label={`حذف ${symbol}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث بالرمز أو اسم الشركة..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pr-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={range} onValueChange={(value) => setRange(value as RangeKey)}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="المدة" /></SelectTrigger>
                    <SelectContent>
                      {RANGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={chartMode} onValueChange={(value) => setChartMode(value as ChartMode)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="نوع الرسم" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normalized">أداء تراكمي (Base 100)</SelectItem>
                      <SelectItem value="price">أسعار مباشرة</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="gap-2" onClick={exportCsv}>
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                </div>
              </div>

              {searchLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري البحث...
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {searchResults.map((item) => {
                    const disabled = selectedSymbols.includes(item.symbol) || selectedSymbols.length >= MAX_COMPARE;
                    return (
                      <button
                        key={item.symbol}
                        onClick={() => addSymbol(item)}
                        disabled={disabled}
                        className={cn(
                          'rounded-lg border p-3 text-right transition-all',
                          disabled ? 'opacity-50 cursor-not-allowed bg-muted/30' : 'hover:bg-muted/40 cursor-pointer',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{item.symbol}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{item.exchange || '—'} • {item.source || '—'}</p>
                          </div>
                          {disabled ? <Minus className="h-4 w-4 text-muted-foreground" /> : <Plus className="h-4 w-4 text-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {portfolioPicks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">إضافة سريعة من أسهم محافظك</p>
                  <div className="flex flex-wrap gap-2">
                    {portfolioPicks.slice(0, 10).map((item) => {
                      const disabled = selectedSymbols.includes(item.symbol) || selectedSymbols.length >= MAX_COMPARE;
                      return (
                        <Button
                          key={`pick-${item.symbol}`}
                          variant="outline"
                          size="sm"
                          disabled={disabled}
                          onClick={() => addSymbol(item)}
                          className="h-7 text-[11px]"
                        >
                          + {item.symbol}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {errorMessage && (
            <Card className="border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
              <CardContent className="p-4 text-sm text-red-700 dark:text-red-300">{errorMessage}</CardContent>
            </Card>
          )}

          {!hasEnoughSymbols ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                أضف سهمين على الأقل لبدء المقارنة المتقدمة.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الرسم المقارن {chartMode === 'normalized' ? '(أداء تراكمي)' : '(أسعار مباشرة)'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingComparison ? (
                    <div className="h-[360px] flex items-center justify-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin ml-2" />
                      جاري تحميل البيانات...
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="h-[360px] flex items-center justify-center text-muted-foreground">لا توجد بيانات تاريخية كافية للعرض</div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[360px] w-full">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" minTickGap={20} />
                        <YAxis
                          tickFormatter={(value: number) => chartMode === 'normalized' ? `${value.toFixed(0)}` : `${value.toFixed(0)}`}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        {snapshots.map((snap, index) => (
                          <Line
                            key={snap.symbol}
                            type="monotone"
                            dataKey={snap.chartKey}
                            name={`${snap.name} (${snap.symbol})`}
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2.2}
                            dot={false}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs text-muted-foreground mb-2">أفضل أداء للفترة</p>
                    <p className="font-bold text-sm line-clamp-1">{insights.bestReturn?.name || '—'}</p>
                    <p className="text-xl font-black text-green-600">{formatPercent(insights.bestReturn?.periodReturn)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs text-muted-foreground mb-2">أقل تذبذب</p>
                    <p className="font-bold text-sm line-clamp-1">{insights.lowestRisk?.name || '—'}</p>
                    <p className="text-xl font-black text-blue-600">{formatPercent(insights.lowestRisk?.volatility)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs text-muted-foreground mb-2">أفضل قيمة (أقل P/E)</p>
                    <p className="font-bold text-sm line-clamp-1">{insights.bestValue?.name || '—'}</p>
                    <p className="text-xl font-black text-amber-600">{formatDecimal(insights.bestValue?.pe, 2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs text-muted-foreground mb-2">أفضل توزيعات</p>
                    <p className="font-bold text-sm line-clamp-1">{insights.bestIncome?.name || '—'}</p>
                    <p className="text-xl font-black text-emerald-600">{formatPercent(insights.bestIncome?.dividend)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      عائد الفترة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={snapshots.reduce((acc, snap, index) => {
                        acc[snap.symbol] = { label: snap.symbol, color: COLORS[index % COLORS.length] };
                        return acc;
                      }, {} as ChartConfig)}
                      className="h-[250px]"
                    >
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="symbol" />
                        <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="returnPct" radius={[6, 6, 0, 0]}>
                          {performanceData.map((row, idx) => (
                            <Cell key={`ret-${row.symbol}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      مقارنة المخاطر
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="symbol" />
                        <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
                        <ChartTooltip />
                        <Legend />
                        <Bar dataKey="volatility" fill="#2563eb" name="التذبذب %" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="drawdown" fill="#dc2626" name="أقصى تراجع %" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">المقارنة التفصيلية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CompareTab)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview" className="gap-2">نظرة عامة</TabsTrigger>
                      <TabsTrigger value="valuation" className="gap-2">تقييم مالي</TabsTrigger>
                      <TabsTrigger value="sharia" className="gap-2">شرعية</TabsTrigger>
                    </TabsList>

                    {(['overview', 'valuation', 'sharia'] as const).map((tab) => (
                      <TabsContent key={tab} value={tab} className="mt-4">
                        <div className="overflow-x-auto rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="min-w-[180px]">المؤشر</TableHead>
                                {snapshots.map((snap) => (
                                  <TableHead key={`head-${tab}-${snap.symbol}`} className="text-center min-w-[180px]">
                                    <div className="space-y-1">
                                      <p className="font-bold">{snap.symbol}</p>
                                      <p className="text-[11px] text-muted-foreground line-clamp-1">{snap.name}</p>
                                    </div>
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableRowsByTab[tab].map((row) => (
                                <TableRow key={`${tab}-${row.label}`}>
                                  <TableCell className="font-semibold">{row.label}</TableCell>
                                  {snapshots.map((snap) => {
                                    const value = row.render(snap);
                                    const numeric =
                                      row.label.includes('عائد') ||
                                      row.label.includes('التغير') ||
                                      row.label.includes('التذبذب') ||
                                      row.label.includes('تراجع');

                                    return (
                                      <TableCell
                                        key={`${tab}-${row.label}-${snap.symbol}`}
                                        className={cn(
                                          'text-center',
                                          numeric && typeof value === 'string' && value.startsWith('+') && 'text-green-600 font-semibold',
                                          numeric && typeof value === 'string' && value.startsWith('-') && 'text-red-600 font-semibold',
                                        )}
                                      >
                                        {value}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="border-slate-300/70 bg-gradient-to-l from-background via-slate-50 to-emerald-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
                <CardContent className="p-5 flex flex-wrap items-start gap-4">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">تشخيص متقدم للمقارنة</p>
                    <p className="text-muted-foreground">
                      أفضل سهم نموًا: <span className="font-medium text-foreground">{insights.bestReturn?.symbol || '—'}</span>
                      {' '}• أقل مخاطرة: <span className="font-medium text-foreground">{insights.lowestRisk?.symbol || '—'}</span>
                      {' '}• أفضل قيمة: <span className="font-medium text-foreground">{insights.bestValue?.symbol || '—'}</span>
                      {' '}• أفضل دخل توزيعات: <span className="font-medium text-foreground">{insights.bestIncome?.symbol || '—'}</span>
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline" className="gap-1">
                        <ArrowUp className="h-3 w-3 text-green-600" />
                        العائد الأعلى
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <TrendingDown className="h-3 w-3 text-blue-600" />
                        المخاطر الأقل
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        مقارنة شرعية مدمجة
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <ArrowDown className="h-3 w-3 text-amber-600" />
                        تقييم نسبي
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
