'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Star, TrendingUp, TrendingDown, Plus, Trash2, Search, Bell, Edit2,
  List, FolderPlus, Folder, MoreVertical, CheckCircle, RefreshCw, ArrowUp, ArrowDown, ArrowRightLeft,
} from 'lucide-react';
import { markets } from '@/data/markets';
import { useToast } from '@/hooks/use-toast';
import { notifySuccess, notifyWarning, notifyInfo } from '@/hooks/use-notifications';
import { SymbolLookup } from '@/components/forms/SymbolLookup';
import { ShariaBadgesPanel } from '@/components/ui/sharia-badges';
import { updateSidebarCounts } from '@/components/layout/Sidebar';
import {
  DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, horizontalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string | null;
  market: string | null;
  marketFlag: string | null;
  marketCap?: number | null;
  price: number | null;
  change: number | null;
  changePct: number | null;
  targetPrice: number | null;
  alertAbove: number | null;
  alertBelow: number | null;
  notes: string | null;
  order: number;
  high52w?: number | null;
  low52w?: number | null;
  volume?: number | null;
  averageVolume?: number | null;
  averageVolume10Day?: number | null;
  shortRatio?: number | null;
  shortPercentOfFloat?: number | null;
  shariaStatus?: string;
  shariaBilad?: string;
  shariaRajhi?: string;
  shariaMaqasid?: string;
  shariaZero?: string;
}

interface Watchlist {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isDefault: boolean;
  items: WatchlistItem[];
  itemCount: number;
}

interface MarketSearchResult {
  symbol: string;
  name?: string;
  exchange?: string;
  shariaStatus?: string;
  shariaBilad?: string;
  shariaRajhi?: string;
  shariaMaqasid?: string;
  shariaZero?: string;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const WATCHLIST_ORDER_KEY = 'watchlist_order_ids';
const WATCHLIST_DATA_KEY = 'watchlist_data';

function readWatchlistOrder(): string[] {
  if (typeof window === 'undefined') return [];
  try { const r = localStorage.getItem(WATCHLIST_ORDER_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function persistWatchlistOrder(ids: string[]) {
  if (typeof window !== 'undefined') localStorage.setItem(WATCHLIST_ORDER_KEY, JSON.stringify(ids));
}
function loadWatchlistData(): Watchlist[] | null {
  if (typeof window === 'undefined') return null;
  try { const r = localStorage.getItem(WATCHLIST_DATA_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveWatchlistData(lists: Watchlist[]) {
  if (typeof window !== 'undefined') localStorage.setItem(WATCHLIST_DATA_KEY, JSON.stringify(lists));
}
function applyOrder<T extends { id: string }>(items: T[], orderIds: string[]): T[] {
  if (!orderIds.length) return items;
  const map = new Map(items.map(i => [i.id, i]));
  const ordered = orderIds.map(id => map.get(id)).filter(Boolean) as T[];
  const rest = items.filter(i => !orderIds.includes(i.id));
  return [...ordered, ...rest];
}

const EXCHANGE_FLAGS: Record<string, string> = {
  TADAWUL: '🇸🇦', SAUDI: '🇸🇦', TASI: '🇸🇦',
  ADX: '🇦🇪', DFM: '🇦🇪',
  KSE: '🇰🇼', BOURSA: '🇰🇼',
  QSE: '🇶🇦', QATAR: '🇶🇦',
  BHB: '🇧🇭', BAHRAIN: '🇧🇭',
  EGX: '🇪🇬', EGYPT: '🇪🇬',
  MSM: '🇴🇲', OMAN: '🇴🇲',
  ASE: '🇯🇴', AMMAN: '🇯🇴',
  NYSE: '🇺🇸', NASDAQ: '🇺🇸', AMEX: '🇺🇸', US: '🇺🇸', OTC: '🇺🇸',
  LSE: '🇬🇧', LONDON: '🇬🇧',
  TSE: '🇯🇵', JPX: '🇯🇵',
  XETRA: '🇩🇪', FRANKFURT: '🇩🇪', HAMBURG: '🇩🇪', MUNICH: '🇩🇪', GERMANY: '🇩🇪',
  PARIS: '🇫🇷', FRANCE: '🇫🇷', EURONEXT: '🇪🇺',
  SIX: '🇨🇭', SWISS: '🇨🇭', SWITZERLAND: '🇨🇭',
  CRYPTO: '₿', FOREX: '💱', COMMODITY: '🥇', COMMODITIES: '🥇'
};

function inferFlagFromExchange(exchange: string | null | undefined, symbol?: string): string | null {
  if (exchange) {
    const normalized = exchange.toUpperCase();
    for (const [key, flag] of Object.entries(EXCHANGE_FLAGS)) {
      if (normalized.includes(key) || key.includes(normalized)) return flag;
    }
  }
  if (symbol) {
    const sym = symbol.toUpperCase();
    if (sym.endsWith('.SR') || sym.endsWith('.SAU')) return '🇸🇦';
    if (sym.endsWith('.DU') || sym.endsWith('.AD')) return '🇦🇪';
    if (sym.endsWith('.KW')) return '🇰🇼';
    if (sym.endsWith('.QA')) return '🇶🇦';
    if (sym.endsWith('.BH')) return '🇧🇭';
    if (sym.endsWith('.OM')) return '🇴🇲';
    if (sym.endsWith('.CA') || sym.endsWith('.EGX')) return '🇪🇬';
    if (sym.endsWith('.L')) return '🇬🇧';
    if (sym.endsWith('.HM') || sym.endsWith('.DE') || sym.endsWith('.F') || sym.endsWith('.MU') || sym.endsWith('.XC')) return '🇩🇪';
    if (sym.endsWith('.PA')) return '🇫🇷';
    if (sym.endsWith('.SW')) return '🇨🇭';
    if (sym.includes('-USD') || sym.includes('USDT') || sym === 'BTC' || sym === 'ETH') return '₿';
    if (sym.endsWith('=F') || sym.endsWith('=X')) return '🌐';
  }
  return null;
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function needsShariaBackfill(item: WatchlistItem) {
  return Boolean(
    item.symbol && (
      !item.shariaStatus ||
      !item.shariaBilad ||
      !item.shariaRajhi ||
      !item.shariaMaqasid ||
      !item.shariaZero
    )
  );
}

function findSearchMatch(symbol: string, results: MarketSearchResult[]): MarketSearchResult | null {
  const normalized = normalizeSymbol(symbol);
  const exact = results.find((result) => normalizeSymbol(result.symbol) === normalized);
  if (exact) return exact;
  const startsWith = results.find((result) => normalizeSymbol(result.symbol).startsWith(normalized));
  return startsWith || null;
}

async function fetchShariaSnapshot(symbol: string): Promise<Partial<WatchlistItem> | null> {
  const lookupTypes: Array<'stock' | 'fund'> = ['stock', 'fund'];

  for (const type of lookupTypes) {
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(symbol)}&type=${type}`, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json();
      const results: MarketSearchResult[] = Array.isArray(data?.results) ? data.results : [];
      const matched = findSearchMatch(symbol, results);
      if (!matched) continue;

      const patch: Partial<WatchlistItem> = {};
      if (matched.name) patch.name = matched.name;
      if (matched.exchange) {
        patch.market = matched.exchange;
        patch.marketFlag = inferFlagFromExchange(matched.exchange, symbol);
      }
      if (matched.shariaStatus) patch.shariaStatus = matched.shariaStatus;
      if (matched.shariaBilad) patch.shariaBilad = matched.shariaBilad;
      if (matched.shariaRajhi) patch.shariaRajhi = matched.shariaRajhi;
      if (matched.shariaMaqasid) patch.shariaMaqasid = matched.shariaMaqasid;
      if (matched.shariaZero) patch.shariaZero = matched.shariaZero;

      if (Object.keys(patch).length > 0) return patch;
    } catch {
      continue;
    }
  }

  return null;
}

function parseMarketCapRaw(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;

  const suffix = raw.slice(-1).toUpperCase();
  const hasSuffix = ['T', 'B', 'M', 'K'].includes(suffix);
  const baseText = hasSuffix ? raw.slice(0, -1) : raw;
  const cleaned = baseText.replace(/[,\s]/g, '');
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  if (suffix === 'T') return parsed * 1e12;
  if (suffix === 'B') return parsed * 1e9;
  if (suffix === 'M') return parsed * 1e6;
  if (suffix === 'K') return parsed * 1e3;

  // In our purification dataset many values are stored in "billions" units (e.g. 17.172).
  if (parsed > 0 && parsed < 1_000_000) return parsed * 1e9;
  return parsed;
}

async function fetchPurificationMarketCap(symbol: string, exchange?: string | null): Promise<number | null> {
  try {
    const params = new URLSearchParams({
      symbol,
      assetType: 'stock',
    });
    if (exchange) params.set('exchange', exchange);

    const res = await fetch(`/api/purification?${params.toString()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.success || !json?.found) return null;
    return parseMarketCapRaw(json.marketCap);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Backend Live price fetching
// ---------------------------------------------------------------------------

async function fetchLiveQuotes(symbols: string[]) {
  if (symbols.length === 0) return {};
  try {
    const res = await fetch(`/api/prices?symbols=${encodeURIComponent(symbols.join(','))}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return {};
    const json = await res.json();
    return json.success && json.data ? json.data : {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const demoWatchlists: Watchlist[] = [
  {
    id: 'demo-1', name: 'قائمة المتابعة الرئيسية', description: 'القائمة الافتراضية', color: '#F59E0B', isDefault: true, itemCount: 5,
    items: [
      { id: '1', symbol: '2222.SR', name: 'أرامكو السعودية', market: 'TADAWUL', marketFlag: '🇸🇦', price: null, change: null, changePct: null, targetPrice: 32, alertAbove: 30, alertBelow: null, notes: null, order: 1 },
      { id: '2', symbol: '1120.SR', name: 'مصرف الراجحي', market: 'TADAWUL', marketFlag: '🇸🇦', price: null, change: null, changePct: null, targetPrice: 115, alertBelow: 100, alertAbove: null, notes: null, order: 2 },
      { id: '3', symbol: '7010.SR', name: 'الاتصالات السعودية', market: 'TADAWUL', marketFlag: '🇸🇦', price: null, change: null, changePct: null, targetPrice: 145, alertAbove: null, alertBelow: null, notes: null, order: 3 },
      { id: '4', symbol: 'AAPL', name: 'Apple Inc.', market: 'US', marketFlag: '🇺🇸', price: null, change: null, changePct: null, targetPrice: 200, alertBelow: 170, alertAbove: null, notes: null, order: 4 },
      { id: '5', symbol: 'MSFT', name: 'Microsoft Corp.', market: 'US', marketFlag: '🇺🇸', price: null, change: null, changePct: null, targetPrice: 400, alertAbove: null, alertBelow: null, notes: null, order: 5 },
    ],
  },
  {
    id: 'demo-2', name: 'الأسهم الأمريكية', description: 'قائمة خاصة بالأسهم الأمريكية', color: '#3B82F6', isDefault: false, itemCount: 3,
    items: [
      { id: '6', symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'US', marketFlag: '🇺🇸', price: null, change: null, changePct: null, targetPrice: 550, alertAbove: null, alertBelow: null, notes: null, order: 1 },
      { id: '7', symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'US', marketFlag: '🇺🇸', price: null, change: null, changePct: null, targetPrice: null, alertAbove: null, alertBelow: null, notes: null, order: 2 },
      { id: '8', symbol: 'TSLA', name: 'Tesla Inc.', market: 'US', marketFlag: '🇺🇸', price: null, change: null, changePct: null, targetPrice: null, alertAbove: null, alertBelow: null, notes: null, order: 3 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Sortable Tab
// ---------------------------------------------------------------------------

function SortableTab({ list, selected, onSelect, onEdit, onDelete }: {
  list: Watchlist; selected: boolean; onSelect: (id: string) => void; onEdit: (l: Watchlist) => void; onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: list.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="inline-flex items-center">
      <Button variant={selected ? 'default' : 'outline'} className="gap-2 relative rounded-xl" onClick={() => onSelect(list.id)}>
        <span className="cursor-grab active:cursor-grabbing text-muted-foreground" {...attributes} {...listeners}>⋮⋮</span>
        <Folder className="h-4 w-4" style={{ color: list.color || '#F59E0B' }} />
        {list.name}
        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{list.itemCount}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span className="mr-1 hover:bg-accent rounded p-0.5 cursor-pointer inline-flex items-center justify-center">
              <MoreVertical className="h-3 w-3" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onEdit(list)}><Edit2 className="h-4 w-4 ml-2" />تعديل القائمة</DropdownMenuItem>
            {!list.isDefault && (
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(list.id)}><Trash2 className="h-4 w-4 ml-2" />حذف القائمة</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function WatchlistPage() {
  const { toast } = useToast();
  const [watchlists, setWatchlistsRaw] = useState<Watchlist[]>(() => {
    const saved = loadWatchlistData();
    return saved && saved.length > 0 ? applyOrder(saved, readWatchlistOrder()) : applyOrder(demoWatchlists, readWatchlistOrder());
  });

  const setWatchlists = useCallback((update: Watchlist[] | ((prev: Watchlist[]) => Watchlist[])) => {
    setWatchlistsRaw(prev => {
      const next = typeof update === 'function' ? update(prev) : update;
      saveWatchlistData(next);
      return next;
    });
  }, []);

  const [selectedListId, setSelectedListId] = useState<string>(() => {
    const saved = loadWatchlistData();
    return (saved && saved.length > 0 ? saved[0]?.id : demoWatchlists[0]?.id) || '';
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddListDialog, setShowAddListDialog] = useState(false);
  const [showEditListDialog, setShowEditListDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
  const [editingList, setEditingList] = useState<Watchlist | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveItem, setMoveItem] = useState<WatchlistItem | null>(null);
  const [moveTargetListId, setMoveTargetListId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pricesLoading, setPricesLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shariaAttemptedSymbolsRef = useRef<Set<string>>(new Set());
  const marketCapAttemptedSymbolsRef = useRef<Set<string>>(new Set());

  const [newStock, setNewStock] = useState({
    symbol: '', name: '', market: '', marketFlag: '', exchange: '', targetPrice: '', alertAbove: '', alertBelow: '', notes: '',
    shariaStatus: '', shariaBilad: '', shariaRajhi: '', shariaMaqasid: '', shariaZero: '',
  });
  const [newList, setNewList] = useState({ name: '', description: '', color: '#F59E0B' });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const selectedList = watchlists.find(w => w.id === selectedListId);
  const filteredItems = selectedList?.items.filter(item => {
    const q = searchQuery.toLowerCase();
    return !q || item.symbol.toLowerCase().includes(q) || (item.name?.toLowerCase() || '').includes(q);
  }) || [];

  // ----- Live price fetching -----
  const fetchAllPrices = useCallback(async () => {
    const allSymbols = [...new Set(watchlists.flatMap(w => w.items.map(i => i.symbol)))];
    if (allSymbols.length === 0) return;

    setPricesLoading(true);
    try {
      const quotes = await fetchLiveQuotes(allSymbols);
      if (Object.keys(quotes).length === 0) return;

      // Check for price alerts before updating state
      const alertsTriggered: string[] = [];
      for (const w of watchlists) {
        for (const item of w.items) {
          const q = quotes[item.symbol];
          if (!q || !q.price) continue;
          // Alert above
          if (item.alertAbove && q.price >= item.alertAbove && (!item.price || item.price < item.alertAbove)) {
            notifyWarning(
              `${item.symbol} وصل للحد الأعلى`,
              `السعر ${q.price.toFixed(2)} تجاوز مستوى التنبيه ${item.alertAbove}`,
              { source: 'قائمة المتابعة', href: '/watchlist' }
            );
            alertsTriggered.push(item.symbol);
          }
          // Alert below
          if (item.alertBelow && q.price <= item.alertBelow && (!item.price || item.price > item.alertBelow)) {
            notifyWarning(
              `${item.symbol} وصل للحد الأدنى`,
              `السعر ${q.price.toFixed(2)} نزل عن مستوى التنبيه ${item.alertBelow}`,
              { source: 'قائمة المتابعة', href: '/watchlist' }
            );
            alertsTriggered.push(item.symbol);
          }
          // Target price reached
          if (item.targetPrice && q.price >= item.targetPrice && (!item.price || item.price < item.targetPrice)) {
            notifySuccess(
              `${item.symbol} وصل للهدف!`,
              `السعر ${q.price.toFixed(2)} حقق المستهدف ${item.targetPrice}`,
              { source: 'قائمة المتابعة', href: '/watchlist' }
            );
            alertsTriggered.push(item.symbol);
          }
          // Volume spike alert (>2x average)
          if (q.volume && q.averageVolume && q.volume > q.averageVolume * 2 && item.volume && item.volume <= q.averageVolume! * 2) {
            notifyInfo(
              `ارتفاع حجم تداول ${item.symbol}`,
              `حجم التداول ${(q.volume / 1e6).toFixed(1)}M أعلى من المتوسط بـ ${(q.volume / q.averageVolume).toFixed(1)}x`,
              { source: 'قائمة المتابعة', href: '/watchlist' }
            );
          }
        }
      }

      setWatchlists(prev => prev.map(w => ({
        ...w,
        items: w.items.map(item => {
          const q = quotes[item.symbol];
          if (!q) return item;
          return {
            ...item,
            price: q.price,
            change: q.change,
            changePct: q.changePct,
            marketCap:
              q.marketCap ??
              ((typeof q.sharesOutstanding === 'number' && typeof q.price === 'number' && q.sharesOutstanding > 0 && q.price > 0)
                ? q.sharesOutstanding * q.price
                : item.marketCap ?? null),
            high52w: q.high52w ?? item.high52w,
            low52w: q.low52w ?? item.low52w,
            volume: q.volume ?? item.volume,
            averageVolume: q.averageVolume ?? item.averageVolume,
            averageVolume10Day: q.averageVolume10Day ?? item.averageVolume10Day,
            shortRatio: q.shortRatio ?? item.shortRatio,
            shortPercentOfFloat: q.shortPercentOfFloat ?? item.shortPercentOfFloat,
          };
        }),
      })));
      setLastRefresh(new Date());
    } catch { /* silent */ } finally {
      setPricesLoading(false);
    }
  }, [watchlists, setWatchlists]);

  // Fetch on mount + auto-refresh every 2 minutes
  useEffect(() => {
    void fetchAllPrices();
    refreshTimerRef.current = setInterval(() => { void fetchAllPrices(); }, 120_000);
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sidebar count
  useEffect(() => {
    updateSidebarCounts({ watchlist: watchlists.reduce((s, w) => s + w.itemCount, 0) });
  }, [watchlists]);

  useEffect(() => {
    persistWatchlistOrder(watchlists.map(w => w.id));
  }, [watchlists]);

  // Fill missing market cap from purification dataset as a fallback
  useEffect(() => {
    const pending = Array.from(new Set(
      watchlists
        .flatMap((list) => list.items)
        .filter((item) => !item.marketCap || item.marketCap <= 0)
        .map((item) => normalizeSymbol(item.symbol))
        .filter((symbol) => symbol.length > 0 && !marketCapAttemptedSymbolsRef.current.has(symbol))
    ));

    if (pending.length === 0) return;
    pending.forEach((symbol) => marketCapAttemptedSymbolsRef.current.add(symbol));

    let canceled = false;

    const hydrateMarketCaps = async () => {
      const exchangeBySymbol = new Map<string, string | null>();
      for (const list of watchlists) {
        for (const item of list.items) {
          const key = normalizeSymbol(item.symbol);
          if (!exchangeBySymbol.has(key)) exchangeBySymbol.set(key, item.market || null);
        }
      }

      const lookups = await Promise.all(
        pending.map(async (symbol) => {
          const marketCap = await fetchPurificationMarketCap(symbol, exchangeBySymbol.get(symbol));
          return { symbol, marketCap };
        })
      );
      if (canceled) return;

      const patchBySymbol = new Map<string, number>();
      for (const entry of lookups) {
        if (entry.marketCap && entry.marketCap > 0) patchBySymbol.set(entry.symbol, entry.marketCap);
      }
      if (patchBySymbol.size === 0) return;

      setWatchlists((prev) => prev.map((list) => ({
        ...list,
        items: list.items.map((item) => {
          if (item.marketCap && item.marketCap > 0) return item;
          const cap = patchBySymbol.get(normalizeSymbol(item.symbol));
          return cap ? { ...item, marketCap: cap } : item;
        }),
      })));
    };

    void hydrateMarketCaps();
    return () => { canceled = true; };
  }, [watchlists, setWatchlists]);

  // Fill missing sharia criteria for current watchlist items (existing local data migration).
  useEffect(() => {
    const pendingSymbols = Array.from(new Set(
      watchlists
        .flatMap((list) => list.items)
        .filter(needsShariaBackfill)
        .map((item) => normalizeSymbol(item.symbol))
        .filter((symbol) => symbol.length > 0 && !shariaAttemptedSymbolsRef.current.has(symbol))
    ));

    if (pendingSymbols.length === 0) return;

    pendingSymbols.forEach((symbol) => shariaAttemptedSymbolsRef.current.add(symbol));

    let canceled = false;

    const hydrate = async () => {
      const lookups = await Promise.all(
        pendingSymbols.map(async (symbol) => ({ symbol, patch: await fetchShariaSnapshot(symbol) }))
      );
      if (canceled) return;

      const patchBySymbol = new Map<string, Partial<WatchlistItem>>();
      for (const lookup of lookups) {
        if (lookup.patch) patchBySymbol.set(lookup.symbol, lookup.patch);
      }
      if (patchBySymbol.size === 0) return;

      let updatedCount = 0;
      setWatchlists((prev) => prev.map((list) => ({
        ...list,
        items: list.items.map((item) => {
          const patch = patchBySymbol.get(normalizeSymbol(item.symbol));
          if (!patch) return item;

          const nextItem: WatchlistItem = {
            ...item,
            name: item.name || patch.name || null,
            market: item.market || patch.market || null,
            marketFlag: item.marketFlag || patch.marketFlag || null,
            shariaStatus: item.shariaStatus || patch.shariaStatus,
            shariaBilad: item.shariaBilad || patch.shariaBilad,
            shariaRajhi: item.shariaRajhi || patch.shariaRajhi,
            shariaMaqasid: item.shariaMaqasid || patch.shariaMaqasid,
            shariaZero: item.shariaZero || patch.shariaZero,
          };

          const changed =
            nextItem.name !== item.name ||
            nextItem.market !== item.market ||
            nextItem.marketFlag !== item.marketFlag ||
            nextItem.shariaStatus !== item.shariaStatus ||
            nextItem.shariaBilad !== item.shariaBilad ||
            nextItem.shariaRajhi !== item.shariaRajhi ||
            nextItem.shariaMaqasid !== item.shariaMaqasid ||
            nextItem.shariaZero !== item.shariaZero;

          if (changed) updatedCount += 1;
          return changed ? nextItem : item;
        }),
      })));

      if (updatedCount > 0) {
        toast({
          title: 'تم تحديث بيانات المعايير الشرعية',
          description: `تمت مزامنة ${updatedCount} عنصر في قوائم المتابعة`,
        });
      }
    };

    void hydrate();

    return () => {
      canceled = true;
    };
  }, [watchlists, setWatchlists, toast]);

  // Stats
  const totalItems = watchlists.reduce((s, w) => s + w.itemCount, 0);
  const gainers = watchlists.flatMap(w => w.items).filter(s => (s.changePct || 0) > 0).length;
  const losers = watchlists.flatMap(w => w.items).filter(s => (s.changePct || 0) < 0).length;

  // ----- CRUD -----
  const handleAddStock = () => {
    if (!newStock.symbol || !selectedList) return;

    // Check for duplicates across ALL watchlists
    for (const w of watchlists) {
      if (w.items.some(i => i.symbol === newStock.symbol)) {
        toast({
          title: 'السهم موجود مسبقاً',
          description: `هذا السهم مضاف بالفعل في قائمة "${w.name}"`,
          variant: 'destructive'
        });
        return;
      }
    }

    const finalFlag = newStock.marketFlag || inferFlagFromExchange(newStock.exchange || newStock.market, newStock.symbol) || null;
    const newItem: WatchlistItem = {
      id: crypto.randomUUID(), symbol: newStock.symbol, name: newStock.name || newStock.symbol,
      market: newStock.exchange || null, marketFlag: finalFlag,
      price: null, change: null, changePct: null,
      targetPrice: newStock.targetPrice ? parseFloat(newStock.targetPrice) : null,
      alertAbove: newStock.alertAbove ? parseFloat(newStock.alertAbove) : null,
      alertBelow: newStock.alertBelow ? parseFloat(newStock.alertBelow) : null,
      notes: newStock.notes || null, order: selectedList.items.length + 1,
      shariaStatus: newStock.shariaStatus || undefined, shariaBilad: newStock.shariaBilad || undefined,
      shariaRajhi: newStock.shariaRajhi || undefined, shariaMaqasid: newStock.shariaMaqasid || undefined,
      shariaZero: newStock.shariaZero || undefined,
    };
    setWatchlists(prev => prev.map(w => w.id === selectedListId ? { ...w, items: [...w.items, newItem], itemCount: w.itemCount + 1 } : w));
    setShowAddDialog(false);
    setNewStock({ symbol: '', name: '', market: '', marketFlag: '', exchange: '', targetPrice: '', alertAbove: '', alertBelow: '', notes: '', shariaStatus: '', shariaBilad: '', shariaRajhi: '', shariaMaqasid: '', shariaZero: '' });
    toast({ title: 'تمت الإضافة', description: `تم إضافة ${newStock.symbol}` });
    notifySuccess('إضافة للمتابعة', `تم إضافة ${newStock.symbol} لقائمة المتابعة`, { source: 'قائمة المتابعة', href: '/watchlist' });
    // fetch price for new symbol after a short delay
    setTimeout(() => { void fetchAllPrices(); }, 500);
  };

  const handleRemoveStock = (itemId: string) => {
    const item = selectedList?.items.find(i => i.id === itemId);
    if (!window.confirm(`هل أنت متأكد من حذف ${item?.symbol || 'هذا السهم'} من هذه القائمة؟`)) return;
    setWatchlists(prev => prev.map(w => w.id === selectedListId ? { ...w, items: w.items.filter(i => i.id !== itemId), itemCount: Math.max(0, w.itemCount - 1) } : w));
    toast({ title: 'تم الحذف', description: `تم حذف ${item?.symbol || ''}` });
  };

  const handleEditStock = () => {
    if (!editingItem) return;
    setWatchlists(prev => prev.map(w => w.id === selectedListId ? { ...w, items: w.items.map(i => i.id === editingItem.id ? editingItem : i) } : w));
    setShowEditDialog(false);
    toast({ title: 'تم التعديل', description: `تم تحديث ${editingItem.symbol}` });
    setEditingItem(null);
  };

  const handleMoveStock = () => {
    if (!moveItem || !moveTargetListId || moveTargetListId === selectedListId) return;

    const targetList = watchlists.find(w => w.id === moveTargetListId);
    if (targetList?.items.some(i => i.symbol === moveItem.symbol)) {
      toast({ title: 'السهم موجود مسبقاً', description: `هذا السهم مضاف بالفعل في قائمة "${targetList.name}"`, variant: 'destructive' });
      return;
    }

    setWatchlists(prev => prev.map(w => {
      if (w.id === selectedListId) return { ...w, items: w.items.filter(i => i.id !== moveItem.id), itemCount: Math.max(0, w.itemCount - 1) };
      if (w.id === moveTargetListId) return { ...w, items: [...w.items, { ...moveItem, order: w.items.length + 1 }], itemCount: w.itemCount + 1 };
      return w;
    }));

    setShowMoveDialog(false);
    setMoveItem(null);
    setMoveTargetListId('');
    toast({ title: 'تم النقل', description: `تم نقل ${moveItem.symbol} بنجاح.` });
  };

  const handleAddList = () => {
    if (!newList.name.trim()) return;
    const nl: Watchlist = { id: crypto.randomUUID(), name: newList.name.trim(), description: newList.description.trim() || null, color: newList.color, isDefault: false, items: [], itemCount: 0 };
    setWatchlists(prev => [...prev, nl]);
    setSelectedListId(nl.id);
    setShowAddListDialog(false);
    setNewList({ name: '', description: '', color: '#F59E0B' });
    toast({ title: 'تم الإنشاء', description: `تم إنشاء "${nl.name}"` });
  };

  const handleDeleteList = (listId: string) => {
    const list = watchlists.find(w => w.id === listId);
    if (list?.isDefault) return;
    if (!window.confirm(`هل أنت متأكد من مسح قائمة المتابعة بأكملها "${list?.name}" بشكل نهائي؟`)) return;
    setWatchlists(prev => prev.filter(w => w.id !== listId));
    if (selectedListId === listId) setSelectedListId(watchlists.find(w => w.id !== listId)?.id || '');
    toast({ title: 'تم الحذف', description: `تم حذف القائمة` });
  };

  const handleEditList = () => {
    if (!editingList?.name.trim()) return;
    setWatchlists(prev => prev.map(w => w.id === editingList.id ? { ...w, name: editingList.name.trim(), description: editingList.description, color: editingList.color } : w));
    setShowEditListDialog(false);
    setEditingList(null);
    toast({ title: 'تم التعديل' });
  };

  const handleReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWatchlists(prev => {
      const oi = prev.findIndex(i => i.id === active.id);
      const ni = prev.findIndex(i => i.id === over.id);
      return oi < 0 || ni < 0 ? prev : arrayMove(prev, oi, ni);
    });
  };

  const stockMarkets = markets.filter(m => m.type === 'stock');

  const formatMarketCapCompact = (value?: number | null) => {
    if (value == null || !Number.isFinite(value) || value <= 0) return null;
    const abs = Math.abs(value);
    if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toFixed(0);
  };

  // 52w position bar
  const pos52w = (price: number | null, high: number | null | undefined, low: number | null | undefined) => {
    if (!price || !high || !low || high <= low) return null;
    return Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100));
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="قائمة المتابعة" />
        <main className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                قوائم المتابعة
              </h1>
              <p className="text-muted-foreground mt-1">تابع الأسهم المفضلة مع بيانات حية وأسعار 52 أسبوع</p>
            </div>
            <div className="flex gap-2 items-center">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { void fetchAllPrices(); }} disabled={pricesLoading}>
                <RefreshCw className={`h-4 w-4 ${pricesLoading ? 'animate-spin' : ''}`} />
                تحديث الأسعار
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setShowAddListDialog(true)}>
                <FolderPlus className="h-4 w-4" />
                قائمة جديدة
              </Button>
              <Button className="gap-2" onClick={() => setShowAddDialog(true)} disabled={!selectedList}>
                <Plus className="h-4 w-4" />
                إضافة سهم
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-blue-200 dark:border-blue-800/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-2.5"><List className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-xs text-muted-foreground">قوائم المتابعة</p><p className="text-2xl font-bold">{watchlists.length}</p></div>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl bg-amber-100 dark:bg-amber-900/30 p-2.5"><Star className="h-5 w-5 text-amber-600 fill-amber-600" /></div>
                <div><p className="text-xs text-muted-foreground">أسهم متابعة</p><p className="text-2xl font-bold">{totalItems}</p></div>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl bg-green-100 dark:bg-green-900/30 p-2.5"><TrendingUp className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-xs text-muted-foreground">صاعدة</p><p className="text-2xl font-bold text-green-600">{gainers}</p></div>
              </CardContent>
            </Card>
            <Card className="border-red-200 dark:border-red-800/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-xl bg-red-100 dark:bg-red-900/30 p-2.5"><TrendingDown className="h-5 w-5 text-red-600" /></div>
                <div><p className="text-xs text-muted-foreground">هابطة</p><p className="text-2xl font-bold text-red-600">{losers}</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs + Search */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorder}>
                <SortableContext items={watchlists.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                  <div className="flex flex-wrap gap-2">
                    {watchlists.map(list => (
                      <SortableTab key={list.id} list={list} selected={selectedListId === list.id} onSelect={setSelectedListId}
                        onEdit={l => { setEditingList(l); setShowEditListDialog(true); }} onDelete={handleDeleteList} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="بحث برمز أو اسم السهم..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
                </div>
                {lastRefresh && (
                  <p className="text-xs text-muted-foreground self-center whitespace-nowrap">آخر تحديث: {lastRefresh.toLocaleTimeString('ar-SA-u-ca-gregory')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          {selectedList && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Folder className="h-4 w-4" style={{ color: selectedList.color || '#F59E0B' }} />
              <span>{selectedList.name}</span>
              <span>•</span>
              <span>{filteredItems.length} سهم</span>
            </div>
          )}

          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground mb-4">لا توجد أسهم في هذه القائمة</p>
                  <Button variant="outline" className="gap-2" onClick={() => setShowAddDialog(true)}><Plus className="h-4 w-4" /> أضف سهم</Button>
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((item) => {
                const pctPos = pos52w(item.price, item.high52w, item.low52w);
                const isUp = (item.changePct || 0) >= 0;
                const atTarget = item.targetPrice && item.price && item.price >= item.targetPrice;
                const marketCapLabel = formatMarketCapCompact(item.marketCap);
                const hasShariaData = Boolean(
                  item.shariaStatus || item.shariaBilad || item.shariaRajhi || item.shariaMaqasid || item.shariaZero
                );

                return (
                  <Card key={item.id} className="hover:shadow-md transition-all group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Symbol block */}
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <span className="text-xl">{item.marketFlag || inferFlagFromExchange(item.market, item.symbol) || '📈'}</span>
                          <div>
                            <p className="font-bold text-base flex items-center gap-2 whitespace-nowrap">
                              <span>{item.symbol}</span>
                              <span className="text-muted-foreground">|</span>
                              <span className="text-xs font-semibold text-primary/90">
                                القيمة السوقية: {marketCapLabel ?? 'غير متاح'}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{item.name}</p>
                          </div>
                        </div>

                        {/* Price & change */}
                        <div className="min-w-[120px]">
                          <p className="font-bold text-lg tabular-nums">{item.price?.toFixed(2) ?? '—'}</p>
                          <p className={`text-sm flex items-center gap-1 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                            {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {item.change !== null ? `${isUp ? '+' : ''}${item.change.toFixed(2)}` : '—'}
                            {item.changePct !== null && <span className="text-xs">({isUp ? '+' : ''}{item.changePct.toFixed(2)}%)</span>}
                          </p>
                        </div>

                        {/* 52w Range — visual bar (forced LTR so gradient + dot match labels) */}
                        <div className="hidden md:block min-w-[240px] flex-1" dir="ltr">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                            <span className="text-red-500 font-medium">أدنى 52w: {item.low52w?.toFixed(2) ?? '—'}</span>
                            {item.price != null && pctPos !== null && (
                              <span className="font-bold text-foreground text-xs">{item.price.toFixed(2)}</span>
                            )}
                            <span className="text-green-500 font-medium">أعلى 52w: {item.high52w?.toFixed(2) ?? '—'}</span>
                          </div>
                          <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-amber-400 to-green-500 opacity-40 w-full" />
                            {pctPos !== null && (
                              <div className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-primary border-2 border-background shadow-lg transition-all"
                                style={{ left: `calc(${pctPos}% - 8px)` }} />
                            )}
                          </div>
                          {pctPos !== null && (
                            <p className="text-[10px] text-center text-muted-foreground mt-0.5">
                              {pctPos > 70 ? 'قريب من الأعلى' : pctPos < 30 ? 'قريب من الأدنى' : 'في المنتصف'}
                            </p>
                          )}
                        </div>

                        {/* Target */}
                        <div className="hidden lg:block min-w-[90px] text-center">
                          <p className="text-[10px] text-muted-foreground">المستهدف</p>
                          <p className="font-medium text-sm">{item.targetPrice?.toFixed(2) || '—'}</p>
                          {atTarget ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 text-[10px]"><CheckCircle className="h-2.5 w-2.5 ml-0.5" />وصل</Badge>
                          ) : item.targetPrice && item.price ? (
                            <p className="text-[10px] text-amber-600">{((item.targetPrice - item.price) / item.price * 100).toFixed(1)}%</p>
                          ) : null}
                        </div>

                        {/* Alerts */}
                        <div className="hidden lg:flex gap-1 min-w-[80px]">
                          {item.alertAbove && <Badge variant="outline" className="text-green-600 text-[10px]">↑{item.alertAbove}</Badge>}
                          {item.alertBelow && <Badge variant="outline" className="text-red-600 text-[10px]">↓{item.alertBelow}</Badge>}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          {watchlists.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="نقل إلى قائمة أخرى" onClick={() => { setMoveItem(item); setMoveTargetListId(''); setShowMoveDialog(true); }}>
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingItem(item); setShowEditDialog(true); }}><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleRemoveStock(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>

                      {/* Mobile 52w row (forced LTR) */}
                      <div className="md:hidden mt-3" dir="ltr">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-1">
                          {item.low52w != null && <span className="text-red-600">أدنى 52w: {item.low52w.toFixed(2)}</span>}
                          {item.high52w != null && <span className="text-green-600">أعلى 52w: {item.high52w.toFixed(2)}</span>}
                          {item.targetPrice != null && <span>المستهدف: {item.targetPrice.toFixed(2)}</span>}
                        </div>
                        {pctPos !== null && (
                          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-amber-400 to-green-500 opacity-40 w-full" />
                            <div className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background shadow-md"
                              style={{ left: `calc(${pctPos}% - 7px)` }} />
                          </div>
                        )}
                      </div>

                      {/* Volume & Short Interest */}
                      {(item.volume != null || item.shortPercentOfFloat != null) && (
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px]" dir="rtl">
                          {item.volume != null && (
                            <div className="flex items-center gap-2 min-w-[200px] flex-1">
                              <span className="text-muted-foreground whitespace-nowrap">حجم التداول:</span>
                              <span className="font-bold tabular-nums">{item.volume >= 1e6 ? `${(item.volume / 1e6).toFixed(1)}M` : item.volume >= 1e3 ? `${(item.volume / 1e3).toFixed(0)}K` : item.volume.toLocaleString()}</span>
                              {item.averageVolume != null && item.averageVolume > 0 && (() => {
                                const volRatio = item.volume! / item.averageVolume!;
                                const barPct = Math.min(100, volRatio * 50);
                                const isHigh = volRatio > 1.5;
                                const isLow = volRatio < 0.5;
                                return (
                                  <div className="flex items-center gap-1.5 flex-1">
                                    <div className="relative h-2 flex-1 max-w-[140px] rounded-full bg-muted overflow-hidden">
                                      <div className={`absolute inset-y-0 right-0 rounded-full transition-all ${isHigh ? 'bg-green-500' : isLow ? 'bg-red-400' : 'bg-blue-400'}`} style={{ width: `${barPct}%` }} />
                                      <div className="absolute inset-y-0 right-1/2 w-px bg-muted-foreground/30" />
                                    </div>
                                    <span className={`text-[10px] font-medium ${isHigh ? 'text-green-600' : isLow ? 'text-red-500' : 'text-muted-foreground'}`}>
                                      {volRatio.toFixed(1)}x {isHigh ? '↑' : isLow ? '↓' : ''}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">(متوسط: {item.averageVolume >= 1e6 ? `${(item.averageVolume / 1e6).toFixed(1)}M` : `${(item.averageVolume / 1e3).toFixed(0)}K`})</span>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                          {item.shortPercentOfFloat != null && item.shortPercentOfFloat > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">بيع مكشوف:</span>
                              <Badge variant="outline" className={`text-[10px] ${item.shortPercentOfFloat >= 20 ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30' : item.shortPercentOfFloat >= 10 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30' : 'border-muted'}`}>
                                {item.shortPercentOfFloat.toFixed(1)}%
                              </Badge>
                              {item.shortRatio != null && <span className="text-[10px] text-muted-foreground">(نسبة: {item.shortRatio.toFixed(1)})</span>}
                            </div>
                          )}
                        </div>
                      )}

                      {hasShariaData && (
                        <div className="mt-3">
                          <ShariaBadgesPanel
                            shariaStatus={item.shariaStatus}
                            shariaBilad={item.shariaBilad}
                            shariaRajhi={item.shariaRajhi}
                            shariaMaqasid={item.shariaMaqasid}
                            shariaZero={item.shariaZero}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* ---- Add Stock Dialog ---- */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>إضافة سهم للمتابعة</DialogTitle><DialogDescription>إضافة إلى: {selectedList?.name}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>بحث الرمز</Label>
              <SymbolLookup type="stock" value={newStock.symbol} onChange={v => setNewStock(p => ({ ...p, symbol: v }))}
                onPick={item => {
                  const flag = inferFlagFromExchange(item.exchange, item.symbol);
                  setNewStock(p => ({ ...p, symbol: item.symbol, name: item.name || p.name, exchange: item.exchange || p.exchange, market: item.exchange || p.market, marketFlag: flag || p.marketFlag, shariaStatus: item.shariaStatus || '', shariaBilad: item.shariaBilad || '', shariaRajhi: item.shariaRajhi || '', shariaMaqasid: item.shariaMaqasid || '', shariaZero: item.shariaZero || '' }));
                }} />
            </div>
            {newStock.name && (
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-lg">{newStock.marketFlag || inferFlagFromExchange(newStock.exchange || newStock.market, newStock.symbol) || '📈'}</span><span className="font-bold">{newStock.symbol}</span><span className="text-muted-foreground">-</span><span>{newStock.name}</span>
              </div>
            )}
            <ShariaBadgesPanel shariaStatus={newStock.shariaStatus} shariaBilad={newStock.shariaBilad} shariaRajhi={newStock.shariaRajhi} shariaMaqasid={newStock.shariaMaqasid} shariaZero={newStock.shariaZero} />
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label className="text-xs">السعر المستهدف</Label><Input type="number" placeholder="0.00" value={newStock.targetPrice} onChange={e => setNewStock({ ...newStock, targetPrice: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">تنبيه أعلى من</Label><Input type="number" placeholder="0.00" value={newStock.alertAbove} onChange={e => setNewStock({ ...newStock, alertAbove: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">تنبيه أقل من</Label><Input type="number" placeholder="0.00" value={newStock.alertBelow} onChange={e => setNewStock({ ...newStock, alertBelow: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">ملاحظات</Label><Input placeholder="ملاحظة..." value={newStock.notes} onChange={e => setNewStock({ ...newStock, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
            <Button onClick={handleAddStock} disabled={!newStock.symbol}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Edit Stock Dialog ---- */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>تعديل {editingItem?.symbol}</DialogTitle><DialogDescription>عدّل البيانات ثم اضغط حفظ</DialogDescription></DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                <span className="text-lg">{editingItem.marketFlag}</span><span className="font-bold">{editingItem.symbol}</span><span className="text-muted-foreground">-</span><span className="text-sm">{editingItem.name}</span>
              </div>
              {editingItem.high52w != null && editingItem.low52w != null && (
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-semibold mb-2">نطاق 52 أسبوع (بيانات حية)</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">أدنى: {editingItem.low52w.toFixed(2)}</span>
                    <span className="font-bold">السعر: {editingItem.price?.toFixed(2)}</span>
                    <span className="text-green-600">أعلى: {editingItem.high52w.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <ShariaBadgesPanel
                shariaStatus={editingItem.shariaStatus}
                shariaBilad={editingItem.shariaBilad}
                shariaRajhi={editingItem.shariaRajhi}
                shariaMaqasid={editingItem.shariaMaqasid}
                shariaZero={editingItem.shariaZero}
              />
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1"><Label className="text-xs">المستهدف</Label><Input type="number" placeholder="0.00" value={editingItem.targetPrice || ''} onChange={e => setEditingItem({ ...editingItem, targetPrice: e.target.value ? parseFloat(e.target.value) : null })} /></div>
                <div className="space-y-1"><Label className="text-xs">تنبيه أعلى</Label><Input type="number" placeholder="0.00" value={editingItem.alertAbove || ''} onChange={e => setEditingItem({ ...editingItem, alertAbove: e.target.value ? parseFloat(e.target.value) : null })} /></div>
                <div className="space-y-1"><Label className="text-xs">تنبيه أقل</Label><Input type="number" placeholder="0.00" value={editingItem.alertBelow || ''} onChange={e => setEditingItem({ ...editingItem, alertBelow: e.target.value ? parseFloat(e.target.value) : null })} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">ملاحظات</Label><Input placeholder="ملاحظة..." value={editingItem.notes || ''} onChange={e => setEditingItem({ ...editingItem, notes: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>إلغاء</Button>
            <Button onClick={handleEditStock}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Move Stock Dialog ---- */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>نقل {moveItem?.symbol}</DialogTitle>
            <DialogDescription>اختر القائمة التي تود نقل السهم إليها.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>القائمة المستهدفة</Label>
              <Select value={moveTargetListId} onValueChange={setMoveTargetListId}>
                <SelectTrigger><SelectValue placeholder="اختر القائمة" /></SelectTrigger>
                <SelectContent>
                  {watchlists.filter(w => w.id !== selectedListId).map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      <div className="flex items-center gap-2"><Folder className="h-4 w-4" style={{ color: w.color || '#F59E0B' }} />{w.name}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>إلغاء</Button>
            <Button onClick={handleMoveStock} disabled={!moveTargetListId}>نقل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Add List Dialog ---- */}
      <Dialog open={showAddListDialog} onOpenChange={setShowAddListDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>إنشاء قائمة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>اسم القائمة *</Label><Input placeholder="مثال: أسهم النمو" value={newList.name} onChange={e => setNewList({ ...newList, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>الوصف</Label><Input placeholder="وصف القائمة..." value={newList.description} onChange={e => setNewList({ ...newList, description: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>اللون</Label>
              <div className="flex gap-2">
                {['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'].map(c => (
                  <button key={c} className={`w-8 h-8 rounded-full border-2 transition-all ${newList.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setNewList({ ...newList, color: c })} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddListDialog(false)}>إلغاء</Button>
            <Button onClick={handleAddList} disabled={!newList.name.trim()}>إنشاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Edit List Dialog ---- */}
      <Dialog open={showEditListDialog} onOpenChange={setShowEditListDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>تعديل القائمة</DialogTitle></DialogHeader>
          {editingList && (
            <div className="space-y-4">
              <div className="space-y-2"><Label>اسم القائمة *</Label><Input value={editingList.name} onChange={e => setEditingList({ ...editingList, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>الوصف</Label><Input value={editingList.description || ''} onChange={e => setEditingList({ ...editingList, description: e.target.value || null })} /></div>
              <div className="space-y-2">
                <Label>اللون</Label>
                <div className="flex gap-2">
                  {['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'].map(c => (
                    <button key={c} type="button" className={`w-8 h-8 rounded-full border-2 transition-all ${editingList.color === c ? 'border-foreground scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setEditingList({ ...editingList, color: c })} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditListDialog(false)}>إلغاء</Button>
            <Button onClick={handleEditList} disabled={!editingList?.name.trim()}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
