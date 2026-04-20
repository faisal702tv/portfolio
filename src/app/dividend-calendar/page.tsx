'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { fetchAllPortfoliosSnapshots, type PortfolioSnapshot } from '@/lib/export-utils';
import { cn } from '@/lib/utils';
import {
  CalendarDays,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Calendar,
  Building2,
  CircleDollarSign,
  AlertTriangle,
} from 'lucide-react';

const SAUDI_EX_URL = 'https://www.saudiexchange.sa/wps/portal/saudiexchange/newsandreports/issuer-financial-calendars/dividends/!ut/p/z1/lZDJDoJAEES_hS_o1oEBj0QjiyLLAMJcDJgJEgWMMSb49aIXo7j2rTuvUl0FHBLgdXYqi-xYNnW26_aU05WiUxyaGrqaaaroT2eWZgU2okdg-QQ4BkV_ofvuUFXQiBH4X3pkntIBnkPmGKCB9Dc9vhn9q3_a6dU74Dr-GCnKQUTjyQBtAgw48LxlbZU3O0hlQuj1UmWHrTiG7V6MN2K9hdTpXuEf3ea0B_TbegRe1HEDPuRlooZ9FUXJORT5yCq9QpIuyJhg_g!!/dz/d5/L0lHSkovd0RNQU5rQUVnQSEhLzROVkUvYXI!/';

type AssetType = 'stock' | 'fund' | 'bond' | 'sukuk' | 'forex' | 'crypto' | 'commodity' | 'unknown';
type EventStatus = 'upcoming' | 'announced' | 'beat' | 'miss' | 'inline' | 'suspended' | 'delisted';

interface AssetPayload {
  symbol: string;
  name: string;
  assetType: AssetType;
  market?: string | null;
  source?: string;
}

interface WatchlistAssetPayload extends AssetPayload {
  watchlistId: string;
  watchlistName: string;
}

interface WatchlistLoadResult {
  assets: WatchlistAssetPayload[];
  lists: Array<{ id: string; name: string }>;
}

interface UnifiedEvent {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  eventType: string;
  titleAr: string;
  subtitleAr: string;
  date: string;
  status: EventStatus;
  statusAr: string;
  source: string;
  currency: string;
  currencySymbol: string;
  url?: string;
  sourceLinks?: Array<{ label: string; url: string }>;
  details?: Record<string, unknown>;
}

interface EventsHubResponse {
  success: true;
  updatedAt: string;
  assets: AssetPayload[];
  events: UnifiedEvent[];
  warnings: string[];
}

type DividendViewEvent = UnifiedEvent & {
  dividendAmount: number | null;
  upcoming: boolean;
};

const LOCAL_WATCHLIST_KEY = 'watchlist_data';
const LOCAL_DIVIDENDS_KEY = 'portfolio_dividends';

interface LocalDividendRecord {
  id?: string;
  symbol?: string;
  name?: string;
  assetType?: string;
  currency?: string;
  dividendPerUnit?: number;
  totalDividend?: number;
  exDate?: string;
  payDate?: string;
  status?: string;
}

function normalizeSymbol(value: string): string {
  return String(value || '').trim().toUpperCase();
}

function inferAssetTypeBySymbol(symbol: string, market?: string | null): AssetType {
  const m = String(market || '').toUpperCase();
  if (m.includes('FOREX') || symbol.endsWith('=X')) return 'forex';
  if (m.includes('CRYPTO') || symbol.endsWith('-USD')) return 'crypto';
  if (m.includes('COMMOD') || symbol.endsWith('=F')) return 'commodity';
  if (m.includes('BOND')) return 'bond';
  if (m.includes('SUKUK')) return 'sukuk';
  if (m.includes('FUND') || m.includes('ETF') || m.includes('REIT')) return 'fund';
  return 'stock';
}

function inferStockAssetType(symbol: string, exchange?: string, sector?: string): AssetType {
  const upperExchange = String(exchange || '').toUpperCase();
  const upperSector = String(sector || '').toUpperCase();
  if (upperExchange.includes('FOREX') || symbol.endsWith('=X')) return 'forex';
  if (upperExchange.includes('CRYPTO') || upperSector.includes('CRYPTO') || upperSector.includes('CURRENCY')) return 'crypto';
  if (symbol.endsWith('-USD')) return 'crypto';
  return 'stock';
}

function snapshotToAssets(snapshot: PortfolioSnapshot | null): AssetPayload[] {
  if (!snapshot) return [];
  const portfolioId = String(snapshot.portfolioId || snapshot.portfolioName || 'portfolio');
  const source = `portfolio:${portfolioId}`;
  const assets: AssetPayload[] = [];

  for (const stock of snapshot.stocks || []) {
    const symbol = normalizeSymbol(stock.symbol);
    if (!symbol) continue;
    assets.push({
      symbol,
      name: stock.name || symbol,
      assetType: inferStockAssetType(symbol, stock.exchange, stock.sector),
      market: stock.exchange || null,
      source,
    });
  }

  for (const bond of snapshot.bonds || []) {
    const symbol = normalizeSymbol(bond.symbol);
    if (!symbol) continue;
    assets.push({
      symbol,
      name: bond.name || symbol,
      assetType: String(bond.type || '').toLowerCase() === 'sukuk' ? 'sukuk' : 'bond',
      market: bond.type || null,
      source,
    });
  }

  for (const fund of snapshot.funds || []) {
    const symbol = normalizeSymbol(fund.symbol || fund.name || '');
    if (!symbol) continue;
    const fundType = String(fund.fundType || '').toLowerCase();
    assets.push({
      symbol,
      name: fund.name || symbol,
      assetType: fundType === 'commodities' || fundType === 'commodity' ? 'commodity' : inferAssetTypeBySymbol(symbol, fundType || null),
      market: fundType || null,
      source,
    });
  }

  return assets;
}

function mergeAssets(items: AssetPayload[]): AssetPayload[] {
  const merged = new Map<string, AssetPayload>();
  for (const item of items) {
    const symbol = normalizeSymbol(item.symbol);
    if (!symbol) continue;
    const current = merged.get(symbol);
    if (!current) {
      merged.set(symbol, {
        symbol,
        name: item.name || symbol,
        assetType: item.assetType || 'unknown',
        market: item.market || null,
        source: item.source || 'unknown',
      });
      continue;
    }

    const betterType = current.assetType === 'unknown' && item.assetType !== 'unknown' ? item.assetType : current.assetType;
    const betterName = current.name === current.symbol && item.name ? item.name : current.name;
    merged.set(symbol, {
      symbol,
      name: betterName || symbol,
      assetType: betterType,
      market: current.market || item.market || null,
      source: current.source || item.source || 'unknown',
    });
  }
  return [...merged.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
}

function readLocalWatchlistsDetailed(): WatchlistLoadResult {
  if (typeof window === 'undefined') return { assets: [], lists: [] };
  try {
    const raw = localStorage.getItem(LOCAL_WATCHLIST_KEY);
    if (!raw) return { assets: [], lists: [] };
    const parsed = JSON.parse(raw) as Array<{ id?: string; name?: string; items?: Array<{ symbol?: string; name?: string; market?: string }> }>;
    const assets: WatchlistAssetPayload[] = [];
    const lists: Array<{ id: string; name: string }> = [];

    for (let i = 0; i < (parsed || []).length; i += 1) {
      const list = parsed[i];
      const id = String(list?.id || `local-${i + 1}`);
      const name = String(list?.name || `قائمة متابعة ${i + 1}`);
      lists.push({ id, name });
      for (const item of list?.items || []) {
        const symbol = normalizeSymbol(String(item?.symbol || ''));
        if (!symbol) continue;
        assets.push({
          symbol,
          name: String(item?.name || symbol),
          assetType: inferAssetTypeBySymbol(symbol, item?.market),
          market: item?.market || null,
          source: `watchlist:${id}`,
          watchlistId: id,
          watchlistName: name,
        });
      }
    }

    return { assets, lists };
  } catch {
    return { assets: [], lists: [] };
  }
}

async function readApiWatchlistsDetailed(): Promise<WatchlistLoadResult> {
  try {
    const headers: HeadersInit = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch('/api/watchlists', { cache: 'no-store', headers });
    if (!res.ok) return { assets: [], lists: [] };
    const data = await res.json();
    const watchlists = Array.isArray(data?.watchlists) ? data.watchlists : [];
    const assets: WatchlistAssetPayload[] = [];
    const lists: Array<{ id: string; name: string }> = [];

    for (const list of watchlists) {
      const id = String(list?.id || '').trim();
      const name = String(list?.name || id || 'قائمة متابعة').trim() || 'قائمة متابعة';
      if (id) lists.push({ id, name });
      const items = Array.isArray(list?.items) ? list.items : [];

      for (const item of items) {
        const symbol = normalizeSymbol(String(item?.symbol || ''));
        if (!symbol) continue;
        assets.push({
          symbol,
          name: String(item?.name || symbol),
          assetType: inferAssetTypeBySymbol(symbol, item?.market),
          market: item?.market || null,
          source: `watchlist:${id || 'api'}`,
          watchlistId: id || 'api',
          watchlistName: name,
        });
      }
    }

    return { assets, lists };
  } catch {
    return { assets: [], lists: [] };
  }
}

function formatDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ar-SA-u-ca-gregory', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function assetTypeLabel(assetType: AssetType): string {
  switch (assetType) {
    case 'stock':
      return 'سهم';
    case 'fund':
      return 'صندوق';
    case 'bond':
      return 'سند';
    case 'sukuk':
      return 'صك';
    case 'forex':
      return 'فوركس';
    case 'crypto':
      return 'عملة مشفرة';
    case 'commodity':
      return 'سلعة';
    default:
      return 'أصل';
  }
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function extractDividendAmount(event: UnifiedEvent): number | null {
  const details = event.details || {};
  const fromDetails = parseNumber(details.amount) ?? parseNumber(details.dividendAmount);
  if (fromDetails != null) return fromDetails;

  const match = String(event.subtitleAr || '').match(/([0-9]+(?:[.,][0-9]+)?)/);
  if (!match) return null;
  const parsed = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function pickSourceUrl(event: UnifiedEvent): string | null {
  const links = Array.isArray(event.sourceLinks) ? event.sourceLinks : [];
  for (const link of links) {
    const url = String(link?.url || '').trim();
    if (/^https?:\/\//i.test(url)) return url;
  }
  if (event.url && /^https?:\/\//i.test(event.url)) return event.url;
  return null;
}

function isUpcoming(event: UnifiedEvent): boolean {
  if (event.status === 'upcoming') return true;
  if (!event.date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return event.date >= today;
}

function toIsoDate(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function toAssetType(rawType: unknown, symbol?: string): AssetType {
  const value = String(rawType || '').trim().toLowerCase();
  if (value === 'stock' || value === 'fund' || value === 'bond' || value === 'sukuk' || value === 'forex' || value === 'crypto' || value === 'commodity') {
    return value;
  }
  return inferAssetTypeBySymbol(normalizeSymbol(symbol || ''));
}

function readLocalDividendRecords(): LocalDividendRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_DIVIDENDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalDividendRecord[]) : [];
  } catch {
    return [];
  }
}

export default function DividendCalendarPage() {
  const { snapshot, portfolios } = usePortfolioSnapshot();
  const [allSnapshots, setAllSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [watchlistAssets, setWatchlistAssets] = useState<AssetPayload[]>([]);
  const [watchlistListsCount, setWatchlistListsCount] = useState(0);
  const [localDividendRecords, setLocalDividendRecords] = useState<LocalDividendRecord[]>([]);
  const [hub, setHub] = useState<EventsHubResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const allPortfolioSnapshots = useMemo(() => {
    if (allSnapshots.length > 0) return allSnapshots;
    return snapshot ? [snapshot] : [];
  }, [allSnapshots, snapshot]);

  const portfolioAssets = useMemo(
    () => allPortfolioSnapshots.flatMap((portfolioSnapshot) => snapshotToAssets(portfolioSnapshot)),
    [allPortfolioSnapshots]
  );

  const assetsPayload = useMemo(
    () => mergeAssets([...portfolioAssets, ...watchlistAssets]),
    [portfolioAssets, watchlistAssets]
  );

  const payloadFingerprint = useMemo(
    () => assetsPayload.map((asset) => `${asset.symbol}:${asset.assetType}`).join('|'),
    [assetsPayload]
  );

  useEffect(() => {
    let cancelled = false;
    const loadAllSnapshots = async () => {
      if (!portfolios.length) {
        setAllSnapshots(snapshot ? [snapshot] : []);
        return;
      }
      try {
        const snapshots = await fetchAllPortfoliosSnapshots(portfolios);
        if (cancelled) return;
        setAllSnapshots(snapshots.length > 0 ? snapshots : (snapshot ? [snapshot] : []));
      } catch {
        if (cancelled) return;
        setAllSnapshots(snapshot ? [snapshot] : []);
      }
    };

    void loadAllSnapshots();
    return () => { cancelled = true; };
  }, [portfolios, snapshot]);

  const loadWatchlistAssets = useCallback(async () => {
    const localResult = readLocalWatchlistsDetailed();
    const apiResult = await readApiWatchlistsDetailed();

    const mergedAssets = mergeAssets([...apiResult.assets, ...localResult.assets]);
    const mergedLists = [...new Map(
      [...apiResult.lists, ...localResult.lists]
        .filter((list) => list.id)
        .map((list) => [list.id, list])
    ).values()];

    setWatchlistAssets(mergedAssets);
    setWatchlistListsCount(mergedLists.length);
  }, []);

  useEffect(() => {
    void loadWatchlistAssets();
  }, [loadWatchlistAssets]);

  const loadLocalDividends = useCallback(() => {
    setLocalDividendRecords(readLocalDividendRecords());
  }, []);

  useEffect(() => {
    loadLocalDividends();
  }, [loadLocalDividends]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onFocus = () => {
      void loadWatchlistAssets();
      loadLocalDividends();
    };
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === LOCAL_WATCHLIST_KEY || event.key === LOCAL_DIVIDENDS_KEY) {
        void loadWatchlistAssets();
        loadLocalDividends();
      }
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
    };
  }, [loadLocalDividends, loadWatchlistAssets]);

  const loadCalendar = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch('/api/market/events-hub', {
        method: 'POST',
        headers,
        cache: 'no-store',
        body: JSON.stringify({ assets: assetsPayload }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as EventsHubResponse;
      if (!data?.success) throw new Error('فشل تحميل تقويم التوزيعات');
      setHub(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل تقويم التوزيعات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assetsPayload]);

  useEffect(() => {
    void loadCalendar(false);
  }, [loadCalendar, payloadFingerprint]);

  const dividendEvents = useMemo(() => {
    const marketEvents = (hub?.events || []).filter((event) => event.eventType === 'dividend');
    const mappedMarket: DividendViewEvent[] = marketEvents.map((event) => ({
      ...event,
      dividendAmount: extractDividendAmount(event),
      upcoming: isUpcoming(event),
    }));

    const today = new Date().toISOString().slice(0, 10);
    const mappedLocal = localDividendRecords
      .map<DividendViewEvent | null>((row, index) => {
        const symbol = normalizeSymbol(String(row.symbol || ''));
        if (!symbol) return null;

        const date = toIsoDate(row.payDate) || toIsoDate(row.exDate) || today;
        const amount =
          parseNumber(row.totalDividend) ??
          parseNumber(row.dividendPerUnit);
        const currency = String(row.currency || 'SAR').toUpperCase();
        const status = String(row.status || '').trim().toLowerCase();
        const upcoming = status === 'upcoming' || date >= today;
        const assetType = toAssetType(row.assetType, symbol);

        return {
          id: `local_dividend_${row.id || `${symbol}_${date}_${index}`}`,
          symbol,
          name: String(row.name || symbol),
          assetType,
          eventType: 'dividend',
          titleAr: upcoming ? 'توزيع قادم (سجل التوزيعات)' : 'توزيع (سجل التوزيعات)',
          subtitleAr: amount != null ? `قيمة التوزيع ${amount.toLocaleString('en-US')} ${currency}.` : 'توزيع مسجل في صفحتك.',
          date,
          status: upcoming ? ('upcoming' as EventStatus) : ('announced' as EventStatus),
          statusAr: upcoming ? 'قادم' : 'معلن',
          source: 'سجل التوزيعات الشخصي',
          currency,
          currencySymbol: currency,
          details: { amount, currency } as Record<string, unknown>,
          dividendAmount: amount,
          upcoming,
          sourceLinks: [] as Array<{ label: string; url: string }>,
        };
      })
      .filter((item): item is DividendViewEvent => item !== null);

    const deduped = [...new Map(
      [...mappedMarket, ...mappedLocal].map((event) => {
        const key = `${event.symbol}|${event.date}|${event.dividendAmount ?? ''}|${event.source}`;
        return [key, event];
      })
    ).values()];

    deduped.sort((a, b) => {
      if (a.upcoming !== b.upcoming) return a.upcoming ? -1 : 1;
      if (a.upcoming && b.upcoming) return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date);
    });

    return deduped;
  }, [hub?.events, localDividendRecords]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dividendEvents.filter((event) => {
      if (assetFilter !== 'all' && event.assetType !== assetFilter) return false;
      if (statusFilter === 'upcoming' && !event.upcoming) return false;
      if (statusFilter === 'past' && event.upcoming) return false;

      if (q) {
        const haystack = [
          event.symbol,
          event.name,
          event.titleAr,
          event.subtitleAr,
          event.currency,
          event.source,
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [assetFilter, dividendEvents, search, statusFilter]);

  const stats = useMemo(() => {
    const upcoming = dividendEvents.filter((event) => event.upcoming).length;
    const uniqueSymbols = new Set(dividendEvents.map((event) => event.symbol)).size;
    return {
      total: dividendEvents.length,
      upcoming,
      assets: uniqueSymbols,
      lastUpdate: hub?.updatedAt ? formatDate(hub.updatedAt) : '—',
    };
  }, [dividendEvents, hub?.updatedAt]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="تقويم توزيع الأرباح" />

        <main className="p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-primary" />
                تقويم توزيع الأرباح
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                التقويم الآن مرتبط بالمحافظ وقوائم المتابعة داخل المشروع ويعرض توزيعات الأرباح القادمة في نفس الصفحة.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => void loadCalendar(true)} disabled={refreshing}>
                {refreshing ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <RefreshCw className="h-4 w-4 ml-2" />}
                تحديث
              </Button>
              <a href={SAUDI_EX_URL} target="_blank" rel="noreferrer">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 ml-2" />
                  مرجع تداول
                </Button>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي الأحداث</p>
                  <p className="text-lg font-bold">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-2">
                  <CircleDollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">توزيعات قادمة</p>
                  <p className="text-lg font-bold">{stats.upcoming}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
                  <Building2 className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الأصول المرتبطة (محافظ + متابعة)</p>
                  <p className="text-lg font-bold">{stats.assets}</p>
                  <p className="text-[11px] text-muted-foreground">قوائم متابعة: {watchlistListsCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="rounded-full bg-violet-100 dark:bg-violet-900/30 p-2">
                  <RefreshCw className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">آخر تحديث</p>
                  <p className="text-sm font-bold">{stats.lastUpdate}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالرمز أو الاسم أو المصدر..."
                  className="pr-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={assetFilter} onValueChange={setAssetFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع الأصل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأصول</SelectItem>
                    <SelectItem value="stock">الأسهم</SelectItem>
                    <SelectItem value="fund">الصناديق</SelectItem>
                    <SelectItem value="bond">السندات</SelectItem>
                    <SelectItem value="sukuk">الصكوك</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="upcoming">قادمة</SelectItem>
                    <SelectItem value="past">سابقة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </CardContent>
            </Card>
          )}

          {Array.isArray(hub?.warnings) && hub.warnings.length > 0 && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="p-4 text-sm text-amber-800 dark:text-amber-200">
                {hub.warnings[0]}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">التوزيعات داخل المشروع</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-16 flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري تحميل تقويم التوزيعات...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-sm px-4">
                  لا توجد توزيعات مطابقة حالياً. يمكنك التحديث أو تعديل الفلاتر.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الرمز</TableHead>
                        <TableHead className="text-right">الأصل</TableHead>
                        <TableHead className="text-right">النوع</TableHead>
                        <TableHead className="text-right">قيمة التوزيع</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">المصدر</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => {
                        const amount = event.dividendAmount;
                        const sourceUrl = pickSourceUrl(event);
                        return (
                          <TableRow key={event.id}>
                            <TableCell className="font-semibold">{event.symbol}</TableCell>
                            <TableCell>
                              <div className="font-medium">{event.name}</div>
                              <div className="text-xs text-muted-foreground">{event.subtitleAr || event.titleAr}</div>
                            </TableCell>
                            <TableCell>{assetTypeLabel(event.assetType)}</TableCell>
                            <TableCell>
                              {amount != null
                                ? `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${event.currency || event.currencySymbol}`
                                : `— ${event.currency || ''}`}
                            </TableCell>
                            <TableCell>{formatDate(event.date)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  event.upcoming
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                    : 'border-muted bg-muted text-foreground'
                                )}
                              >
                                {event.upcoming ? 'قادم' : 'سابق'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {sourceUrl ? (
                                <a href={sourceUrl} target="_blank" rel="noreferrer">
                                  <Button size="sm" variant="outline">
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                    مصدر
                                  </Button>
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground">بدون رابط</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
