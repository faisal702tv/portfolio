'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar, updateSidebarCounts } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { useLivePrices } from '@/hooks/use-live-prices';
import { notifySuccess, notifyWarning, notifyError, notifyInfo } from '@/hooks/use-notifications';
import { fetchAllPortfoliosSnapshots, persistPortfolioSnapshot, type SnapshotStock, type SellRecord, type PortfolioSnapshot } from '@/lib/export-utils';
import { calcTradeFees, getTaxDefaults } from '@/lib/tax-settings';
import { convertCurrency, fmtN } from '@/lib/helpers';
import { calcPurificationAmount, fetchPurificationMetrics, ZERO_PURIFICATION_METRICS } from '@/lib/purification';
import { SymbolLookup } from '@/components/forms/SymbolLookup';
import { Plus, RefreshCw, Search, Trash2, Edit2, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShariaBadgesPanel, ShariaInlineBadge } from '@/components/ui/sharia-badges';
import { StockEditDialog, StockMoveDialog, StockDeleteDialog } from './StockDialogs';

const EXCHANGE_CURRENCY_MAP: Record<string, string> = {
  TADAWUL: 'SAR', SAUDI: 'SAR', TASI: 'SAR',
  ADX: 'AED', DFM: 'AED',
  KSE: 'KWD', BOURSA: 'KWD',
  QSE: 'QAR', QATAR: 'QAR',
  BHB: 'BHD', BAHRAIN: 'BHD',
  EGX: 'EGP', EGYPT: 'EGP',
  MSM: 'OMR', OMAN: 'OMR',
  ASE: 'JOD', AMMAN: 'JOD',
  NYSE: 'USD', NASDAQ: 'USD', AMEX: 'USD', OTC: 'USD', CBOE: 'USD',
  LSE: 'GBP', LONDON: 'GBP',
  TSE: 'JPY', JPX: 'JPY',
};

function currencyFromExchange(exchange: string | undefined): string | undefined {
  if (!exchange) return undefined;
  const upper = exchange.toUpperCase().trim();
  for (const [key, currency] of Object.entries(EXCHANGE_CURRENCY_MAP)) {
    if (upper.includes(key)) return currency;
  }
  return undefined;
}

const CURRENCY_FLAGS: Record<string, string> = {
  SAR: '🇸🇦', AED: '🇦🇪', KWD: '🇰🇼', QAR: '🇶🇦', BHD: '🇧🇭',
  EGP: '🇪🇬', OMR: '🇴🇲', JOD: '🇯🇴', USD: '🇺🇸', GBP: '🇬🇧',
  EUR: '🇪🇺', JPY: '🇯🇵', CNY: '🇨🇳', INR: '🇮🇳', CAD: '🇨🇦',
};

const DISPLAY_CURRENCY_OPTIONS = [
  { code: 'SAR', label: 'ر.س' },
  { code: 'AED', label: 'د.إ' },
  { code: 'KWD', label: 'د.ك' },
  { code: 'QAR', label: 'ر.ق' },
  { code: 'BHD', label: 'د.ب' },
  { code: 'OMR', label: 'ر.ع' },
  { code: 'JOD', label: 'د.أ' },
  { code: 'EGP', label: 'ج.م' },
  { code: 'USD', label: '$' },
  { code: 'EUR', label: '€' },
  { code: 'GBP', label: '£' },
] as const;

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

type PriceEntry = {
  price: number;
  high52w?: number | null;
  low52w?: number | null;
  volume?: number;
  averageVolume?: number;
  averageVolume10Day?: number;
  shortRatio?: number;
  shortPercentOfFloat?: number;
  sharesShort?: number;
  sharesOutstanding?: number;
  floatShares?: number;
  shortDataSource?: string;
};

type PriceMap = Record<string, PriceEntry>;

type Stable52wRange = {
  high52w: number | null;
  low52w: number | null;
};

const EXCHANGE_SUFFIX_MAP: Record<string, string> = {
  TADAWUL: '.SR', SAUDI: '.SR', TASI: '.SR',
  ADX: '.AD', DFM: '.DU',
  KSE: '.KW', BOURSA: '.KW',
  QSE: '.QA', QATAR: '.QA',
  BHB: '.BH', BAHRAIN: '.BH',
  EGX: '.CA', EGYPT: '.CA',
  MSM: '.OM', OMAN: '.OM',
  LSE: '.L', LONDON: '.L',
};

const PRICE_PREFIXES = ['SAUDI_', 'ADX_', 'DFM_', 'KSE_', 'QSE_', 'BHX_', 'MSX_', 'EGX_', 'ASE_', 'FUND_', 'US_'];

function stockStableKey(symbol: string, exchange?: string): string {
  return `${(exchange || '').trim().toUpperCase()}::${normalizeSymbol(symbol)}`;
}

function buildPriceCandidates(symbol: string, exchange?: string): string[] {
  const normalized = normalizeSymbol(symbol);
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
  if (dotIndex > 0) {
    addCandidate(normalized.substring(0, dotIndex));
  }

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
    for (const base of baseCandidates) {
      addCandidate(`${prefix}${base}`);
    }
  }

  return Array.from(candidates);
}

function resolvePriceEntry(prices: PriceMap, symbol: string, exchange?: string): PriceEntry | null {
  const candidates = buildPriceCandidates(symbol, exchange);

  for (const candidate of candidates) {
    const entry = prices[candidate];
    if (entry?.price != null) return entry;
  }

  const lowerCandidates = new Set(candidates.map((c) => c.toLowerCase()));
  for (const [key, entry] of Object.entries(prices)) {
    if (lowerCandidates.has(key.toLowerCase()) && entry?.price != null) {
      return entry;
    }
  }

  return null;
}

function getPriceForSymbol(prices: PriceMap, symbol: string, exchange?: string) {
  return resolvePriceEntry(prices, symbol, exchange)?.price ?? null;
}

function formatSharesCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString();
}

const todayStr = () => new Date().toISOString().split('T')[0];

const precise = (num: number) => Number(num.toFixed(4));

const emptyForm = (currency?: string) => ({
  symbol: '', name: '', qty: '', buyPrice: '', exchange: '', currency: currency || 'SAR',
  sector: '', stockType: '', buyDate: todayStr(), customBrok: '', customVat: '',
  shariaStatus: '', shariaBilad: '', shariaRajhi: '', shariaMaqasid: '', shariaZero: '',
});

const ASSET_METRIC_BADGE_CLASS = 'inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300/90 bg-background px-2.5 py-1.5 text-[13px] font-extrabold text-foreground shadow-sm dark:border-slate-700';
const ASSET_METRIC_LABEL_CLASS = 'text-[11px] font-bold text-muted-foreground';
const ACTION_BUTTON_BASE_CLASS = 'h-9 rounded-lg border-2 px-3 text-xs font-bold shadow-sm transition-colors';
const ACTION_MOVE_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300`;
const ACTION_EDIT_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300`;
const ACTION_SELL_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300`;

export default function StocksPage() {
  const { toast } = useToast();
  const {
    snapshot, portfolios, selectedPortfolioId, setSelectedPortfolioId,
    loading, saving, save, reload,
  } = usePortfolioSnapshot();

  const [portfolioFilter, setPortfolioFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('default');
  const [allSnapshots, setAllSnapshots] = useState<PortfolioSnapshot[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAllSnapshots() {
      if (portfolios.length === 0) {
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
    }

    void loadAllSnapshots();
    return () => { cancelled = true; };
  }, [portfolios, snapshot]);

  const activeSnapshots = useMemo(() => {
    if (portfolioFilter === 'all') {
      return allSnapshots.length > 0 ? allSnapshots : (snapshot ? [snapshot] : []);
    }
    const match = allSnapshots.find(s => s.portfolioId === portfolioFilter);
    return match ? [match] : (snapshot ? [snapshot] : []);
  }, [portfolioFilter, snapshot, allSnapshots]);

  const pos52w = (price: number | null, high: number | null | undefined, low: number | null | undefined) => {
    if (price == null || high == null || low == null || high <= low) return null;
    return Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100));
  };

  const isReadOnly = portfolioFilter === 'all';

  const allStocks = useMemo(() => activeSnapshots.flatMap((s) => s.stocks), [activeSnapshots]);
  const allBonds = useMemo(() => activeSnapshots.flatMap((s) => s.bonds || []), [activeSnapshots]);
  const allFunds = useMemo(() => activeSnapshots.flatMap((s) => s.funds || []), [activeSnapshots]);
  const [activeTab, setActiveTab] = useState<'stocks' | 'bonds' | 'funds'>('stocks');
  const assetPortfolioMap = useMemo(() => {
    const map = new Map<string, string>();
    activeSnapshots.forEach(s => { s.stocks.forEach(st => map.set(st.id, s.portfolioName || '')); });
    return map;
  }, [activeSnapshots]);
  const assetPortfolioIdMap = useMemo(() => {
    const map = new Map<string, string>();
    activeSnapshots.forEach(s => { s.stocks.forEach(st => map.set(st.id, s.portfolioId || '')); });
    return map;
  }, [activeSnapshots]);
  const symbolsToFetch = useMemo(() => Array.from(new Set(allStocks.map(s => s.symbol).filter(Boolean))), [allStocks]);
  const { prices, refresh } = useLivePrices({ refreshInterval: 60000, symbols: symbolsToFetch });
  const typedPrices = prices as PriceMap;
  const [stable52wMap, setStable52wMap] = useState<Record<string, Stable52wRange>>({});

  useEffect(() => {
    if (allStocks.length === 0) return;

    setStable52wMap((prev) => {
      let hasChanges = false;
      const next = { ...prev };

      for (const stock of allStocks) {
        const key = stockStableKey(stock.symbol, stock.exchange);
        const liveEntry = resolvePriceEntry(typedPrices, stock.symbol, stock.exchange);
        const previous = next[key];
        const nextHigh52w = liveEntry?.high52w ?? previous?.high52w ?? stock.high52w ?? null;
        const nextLow52w = liveEntry?.low52w ?? previous?.low52w ?? stock.low52w ?? null;

        if (!previous || previous.high52w !== nextHigh52w || previous.low52w !== nextLow52w) {
          next[key] = { high52w: nextHigh52w, low52w: nextLow52w };
          hasChanges = true;
        }
      }

      return hasChanges ? next : prev;
    });
  }, [allStocks, typedPrices]);

  const activePortfolio = portfolios.find((p) => p.id === (selectedPortfolioId ?? snapshot?.portfolioId));
  const defaultDisplayCurrency = useMemo(() => {
    if (portfolioFilter !== 'all') {
      return activeSnapshots[0]?.currency || activePortfolio?.currency || snapshot?.currency || 'SAR';
    }
    return 'SAR';
  }, [portfolioFilter, activeSnapshots, activePortfolio?.currency, snapshot?.currency]);
  const [displayCurrency, setDisplayCurrency] = useState<string>(defaultDisplayCurrency);

  useEffect(() => {
    setDisplayCurrency(defaultDisplayCurrency);
  }, [defaultDisplayCurrency]);

  const portfolioCurrencyMap = useMemo(() => {
    const map = new Map<string, string>();
    allSnapshots.forEach(s => { if (s.portfolioId && s.currency) map.set(s.portfolioId, s.currency); });
    return map;
  }, [allSnapshots]);

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm(activePortfolio?.currency));
  const [addTargetPortfolioId, setAddTargetPortfolioId] = useState<string>(selectedPortfolioId || portfolios[0]?.id || '');

  // Move dialog
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<SnapshotStock | null>(null);
  const [moveTargetPortfolioId, setMoveTargetPortfolioId] = useState<string>('');

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editStock, setEditStock] = useState<SnapshotStock | null>(null);

  // Sell dialog
  const [sellOpen, setSellOpen] = useState(false);
  const [sellStock, setSellStock] = useState<SnapshotStock | null>(null);
  const [sellForm, setSellForm] = useState({ qty: '', sellPrice: '', sellDate: todayStr(), customBrok: '', customVat: '', customPurification: '' });
  const [sellPurification, setSellPurification] = useState(ZERO_PURIFICATION_METRICS);
  const [sellPurificationLoading, setSellPurificationLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const currentIds = new Set(portfolios.map((p) => p.id));
    if (addTargetPortfolioId && currentIds.has(addTargetPortfolioId)) return;
    const fallback = selectedPortfolioId || portfolios[0]?.id || '';
    if (fallback !== addTargetPortfolioId) {
      setAddTargetPortfolioId(fallback);
    }
  }, [addTargetPortfolioId, portfolios, selectedPortfolioId]);

  useEffect(() => {
    if (portfolioFilter === 'all') return;
    if (portfolioFilter && portfolioFilter !== addTargetPortfolioId) {
      setAddTargetPortfolioId(portfolioFilter);
    }
  }, [portfolioFilter, addTargetPortfolioId]);

  const { marketKey, brokeragePct, vatPct } = getTaxDefaults({
    currency: form.currency || (activePortfolio?.currency ?? snapshot?.currency),
    symbol: form.symbol,
    exchange: form.exchange,
  });
  const qtyNum = Number(form.qty || 0);
  const buyPriceNum = Number(form.buyPrice || 0);
  const grossBuy = qtyNum * buyPriceNum;
  const feeCalc = calcTradeFees({
    grossAmount: grossBuy, brokeragePct, vatPct,
    customBrokerageAmount: form.customBrok !== '' ? Number(form.customBrok || 0) : undefined,
    customVatAmount: form.customVat !== '' ? Number(form.customVat || 0) : undefined,
  });
  const brokFee = feeCalc.brokerage;
  const vatFee = feeCalc.vat;
  const totalCostWithFees = feeCalc.total;

  const filtered = useMemo(() => {
    let result = allStocks.filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
    });

    if (statusFilter !== 'all') {
      result = result.filter((s) => {
        const live = getPriceForSymbol(typedPrices, s.symbol, s.exchange) ?? s.currentPrice ?? s.buyPrice;
        const pl = (live - s.buyPrice) * s.qty;
        if (statusFilter === 'profit') return pl >= 0;
        if (statusFilter === 'loss') return pl < 0;
        return true;
      });
    }

    if (sortFilter !== 'default') {
      result = [...result].sort((a, b) => {
        const liveA = getPriceForSymbol(typedPrices, a.symbol, a.exchange) ?? a.currentPrice ?? a.buyPrice;
        const liveB = getPriceForSymbol(typedPrices, b.symbol, b.exchange) ?? b.currentPrice ?? b.buyPrice;

        const valA = a.qty * liveA;
        const valB = b.qty * liveB;
        const plA = valA - (a.qty * a.buyPrice);
        const plB = valB - (b.qty * b.buyPrice);

        const currA = a.currency || currencyFromExchange(a.exchange) || (assetPortfolioIdMap.get(a.id) ? portfolioCurrencyMap.get(assetPortfolioIdMap.get(a.id)!) : undefined) || 'SAR';
        const currB = b.currency || currencyFromExchange(b.exchange) || (assetPortfolioIdMap.get(b.id) ? portfolioCurrencyMap.get(assetPortfolioIdMap.get(b.id)!) : undefined) || 'SAR';

        const valA_conv = convertCurrency(valA, currA, displayCurrency);
        const valB_conv = convertCurrency(valB, currB, displayCurrency);
        const plA_conv = convertCurrency(plA, currA, displayCurrency);
        const plB_conv = convertCurrency(plB, currB, displayCurrency);

        switch (sortFilter) {
          case 'value-desc': return valB_conv - valA_conv;
          case 'value-asc': return valA_conv - valB_conv;
          case 'pl-desc': return plB_conv - plA_conv;
          case 'pl-asc': return plA_conv - plB_conv;
          default: return 0;
        }
      });
    }

    return result;
  }, [allStocks, search, statusFilter, sortFilter, typedPrices, assetPortfolioIdMap, portfolioCurrencyMap, displayCurrency]);

  // Update sidebar counts
  useEffect(() => {
    updateSidebarCounts({ stocks: filtered.length });
  }, [filtered.length]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, stock) => {
        const cp = getPriceForSymbol(typedPrices, stock.symbol, stock.exchange) ?? stock.currentPrice ?? stock.buyPrice;
        // Determine the stock's actual currency: explicit > exchange-based > portfolio-based > SAR
        const itemPortfolioId = assetPortfolioIdMap.get(stock.id);
        const itemPortfolioCurrency = itemPortfolioId ? portfolioCurrencyMap.get(itemPortfolioId) : undefined;
        const stockCurrency = stock.currency || currencyFromExchange(stock.exchange) || itemPortfolioCurrency || 'SAR';

        const convertedCost = convertCurrency(stock.qty * stock.buyPrice, stockCurrency, displayCurrency);
        const convertedValue = convertCurrency(stock.qty * cp, stockCurrency, displayCurrency);

        acc.cost += convertedCost;
        acc.value += convertedValue;
        return acc;
      },
      { cost: 0, value: 0 }
    );
  }, [filtered, typedPrices, displayCurrency, assetPortfolioIdMap, portfolioCurrencyMap]);

  const addStock = async () => {
    if (!form.symbol || !form.qty || !form.buyPrice) {
      toast({ title: 'الحقول مطلوبة', description: 'أكمل البيانات الأساسية.', variant: 'destructive' });
      return;
    }
    const symbol = normalizeSymbol(form.symbol);
    const qty = Number(form.qty);
    const buyPrice = Number(form.buyPrice);
    const name = String(form.name || '').trim() || symbol;
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(buyPrice) || buyPrice <= 0) {
      toast({ title: 'قيم غير صالحة', description: 'الكمية وسعر الشراء يجب أن يكونا أكبر من صفر.', variant: 'destructive' });
      return;
    }
    const livePrice = getPriceForSymbol(typedPrices, symbol, form.exchange) ?? buyPrice;
    const effectiveBuyPrice = precise(qty > 0 ? totalCostWithFees / qty : buyPrice);

    const nextStock: SnapshotStock = {
      id: crypto.randomUUID(), symbol, name,
      exchange: form.exchange || undefined, currency: form.currency || undefined,
      qty, buyPrice: effectiveBuyPrice, currentPrice: livePrice,
      buyDate: form.buyDate || todayStr(),
      sector: form.sector || undefined, type: form.stockType || undefined,
      shariaStatus: form.shariaStatus || undefined,
      shariaBilad: form.shariaBilad || undefined,
      shariaRajhi: form.shariaRajhi || undefined,
      shariaMaqasid: form.shariaMaqasid || undefined,
      shariaZero: form.shariaZero || undefined,
    };

    const resolvedTargetId =
      (portfolioFilter !== 'all' ? portfolioFilter : '') ||
      addTargetPortfolioId ||
      selectedPortfolioId ||
      portfolios[0]?.id ||
      snapshot?.portfolioId ||
      allSnapshots[0]?.portfolioId ||
      '';

    if (!resolvedTargetId) {
      toast({ title: 'تعذر الإضافة', description: 'لا توجد محفظة هدف متاحة حاليًا.', variant: 'destructive' });
      return;
    }

    const selectedSnapshot =
      (snapshot && snapshot.portfolioId === resolvedTargetId ? snapshot : null) ||
      allSnapshots.find((s) => s.portfolioId === resolvedTargetId) ||
      null;

    if (!selectedSnapshot) {
      toast({ title: 'تعذر الإضافة', description: 'تعذر العثور على بيانات المحفظة الهدف. حدّث الصفحة وحاول مجددًا.', variant: 'destructive' });
      return;
    }

    const updated = {
      ...selectedSnapshot,
      stocks: [nextStock, ...selectedSnapshot.stocks],
      exportedAt: new Date().toISOString(),
    };

    let persistedOk = true;
    if (resolvedTargetId === selectedPortfolioId) {
      persistedOk = await save(updated);
    } else {
      const result = await persistPortfolioSnapshot(updated, resolvedTargetId);
      persistedOk = result.ok;
    }

    setAllSnapshots((prev) => {
      const hasTarget = prev.some((s) => s.portfolioId === resolvedTargetId);
      if (hasTarget) {
        return prev.map((s) => (s.portfolioId === resolvedTargetId ? updated : s));
      }
      return [updated, ...prev];
    });

    if (!persistedOk) {
      toast({
        title: 'تمت الإضافة محليًا',
        description: 'تمت إضافة السهم محليًا لكن لم يتم تأكيد الحفظ في قاعدة البيانات. تحقق من تسجيل الدخول.',
        variant: 'destructive',
      });
      notifyWarning('إضافة سهم محليًا', `تمت إضافة ${symbol} محليًا بدون مزامنة كاملة`, { source: 'الأسهم', href: '/stocks' });
      setOpen(false);
      setForm(emptyForm(activePortfolio?.currency));
      return;
    }

    setOpen(false);
    setForm(emptyForm(activePortfolio?.currency));
    const targetName = portfolios.find((p) => p.id === resolvedTargetId)?.name || '';
    toast({ title: 'تمت الإضافة', description: `تمت إضافة ${symbol} بنجاح${resolvedTargetId !== selectedPortfolioId ? ` في ${targetName}` : ''}.` });
    notifySuccess('إضافة سهم', `تمت إضافة ${symbol} بنجاح`, { source: 'الأسهم', href: '/stocks' });
  };

  const saveEdit = async () => {
    if (!editStock) return;
    const itemPortfolioId = assetPortfolioIdMap.get(editStock.id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const updated = { ...targetSnap, stocks: targetSnap.stocks.map((s) => s.id === editStock.id ? editStock : s), exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) {
      await save(updated);
    } else {
      await persistPortfolioSnapshot(updated, itemPortfolioId!);
    }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    setEditOpen(false);
    setEditStock(null);
    toast({ title: 'تم التعديل', description: 'تم تحديث بيانات السهم.' });
  };

  const executeSell = async () => {
    if (!snapshot || !sellStock) return;
    const sellQty = Number(sellForm.qty);
    const sellPrice = Number(sellForm.sellPrice);
    if (!sellQty || !sellPrice || sellQty > sellStock.qty) {
      toast({ title: 'خطأ', description: 'تأكد من الكمية والسعر.', variant: 'destructive' });
      return;
    }
    const grossSell = precise(sellQty * sellPrice);
    const sellTaxDefs = getTaxDefaults({ currency: sellStock.currency, symbol: sellStock.symbol, exchange: sellStock.exchange });
    const sellFees = calcTradeFees({
      grossAmount: grossSell, brokeragePct: sellTaxDefs.brokeragePct, vatPct: sellTaxDefs.vatPct,
      customBrokerageAmount: sellForm.customBrok !== '' ? Number(sellForm.customBrok || 0) : undefined,
      customVatAmount: sellForm.customVat !== '' ? Number(sellForm.customVat || 0) : undefined,
    });
    const netSellProceeds = precise(grossSell - sellFees.brokerage - sellFees.vat);
    const costBasis = precise(sellQty * sellStock.buyPrice);
    const profitBeforePurification = precise(netSellProceeds - costBasis);
    const profitBaseForPurification = Math.max(0, profitBeforePurification);
    const purificationMetrics = await fetchPurificationMetrics({
      symbol: sellStock.symbol,
      exchange: sellStock.exchange,
      assetType: 'stock',
    });
    const purificationPct = purificationMetrics.purificationPct || 0;
    const purificationAmountAuto = calcPurificationAmount(profitBaseForPurification, purificationPct);
    const manualPurificationRaw = sellForm.customPurification !== '' ? Number(sellForm.customPurification) : NaN;
    const hasManualPurification = sellForm.customPurification !== '' && Number.isFinite(manualPurificationRaw);
    const purificationAmount = Math.min(
      profitBaseForPurification,
      Math.max(0, hasManualPurification ? manualPurificationRaw : purificationAmountAuto),
    );
    const netSellAfterPurification = precise(netSellProceeds - purificationAmount);
    const profitLoss = precise(netSellAfterPurification - costBasis);
    const profitLossPct = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

    const sellRecord: SellRecord = {
      id: crypto.randomUUID(), symbol: sellStock.symbol, name: sellStock.name,
      assetType: 'stock', qty: sellQty, buyPrice: sellStock.buyPrice, sellPrice,
      buyDate: sellStock.buyDate, sellDate: sellForm.sellDate || todayStr(),
      profitLoss, profitLossPct, fees: sellFees.brokerage + sellFees.vat,
      purificationPct, purificationAmount,
      interestIncomeToRevenuePct: purificationMetrics.interestIncomeToRevenuePct || 0,
      debtToMarketCapPct: purificationMetrics.debtToMarketCapPct || 0,
      currency: sellStock.currency, exchange: sellStock.exchange,
      high52w: sellStock.high52w, low52w: sellStock.low52w,
    };

    const itemPortfolioId = assetPortfolioIdMap.get(sellStock.id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const remainingQty = sellStock.qty - sellQty;
    const nextStocks = remainingQty > 0
      ? targetSnap.stocks.map((s) => s.id === sellStock.id ? { ...s, qty: remainingQty } : s)
      : targetSnap.stocks.filter((s) => s.id !== sellStock.id);

    const prevHistory = targetSnap.sellHistory ?? [];
    const updated = { ...targetSnap, stocks: nextStocks, sellHistory: [sellRecord, ...prevHistory], exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) {
      await save(updated);
    } else {
      await persistPortfolioSnapshot(updated, itemPortfolioId!);
    }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    setSellOpen(false);
    setSellStock(null);
    setSellForm({ qty: '', sellPrice: '', sellDate: todayStr(), customBrok: '', customVat: '', customPurification: '' });
    toast({
      title: profitLoss >= 0 ? 'تم البيع بربح' : 'تم البيع بخسارة',
      description: `${sellStock.symbol} × ${sellQty} بسعر ${sellPrice} = ${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}`,
    });
    if (profitLoss >= 0) {
      notifySuccess('عملية بيع ناجحة', `${sellStock.symbol} — ربح ${profitLoss.toFixed(2)}`, { source: 'الأسهم', href: '/sell-history' });
    } else {
      notifyWarning('عملية بيع بخسارة', `${sellStock.symbol} — خسارة ${Math.abs(profitLoss).toFixed(2)}`, { source: 'الأسهم', href: '/sell-history' });
    }
  };

  const removeStock = async (id: string) => {
    const itemPortfolioId = assetPortfolioIdMap.get(id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const updated = { ...targetSnap, stocks: targetSnap.stocks.filter((s) => s.id !== id), exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) {
      await save(updated);
    } else {
      await persistPortfolioSnapshot(updated, itemPortfolioId!);
    }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    const deletedSymbol = targetSnap.stocks.find(s => s.id === id)?.symbol || '';
    toast({ title: 'تم الحذف', description: 'تم حذف السهم من المحفظة.' });
    notifyInfo('حذف سهم', `تم حذف ${deletedSymbol} من المحفظة`, { source: 'الأسهم' });
  };

  const moveToPortfolio = async () => {
    if (!moveItem || !moveTargetPortfolioId) return;
    const sourcePortfolioId = assetPortfolioIdMap.get(moveItem.id) || selectedPortfolioId;
    if (!sourcePortfolioId || sourcePortfolioId === moveTargetPortfolioId) return;
    const sourceSnap = (sourcePortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === sourcePortfolioId);
    if (!sourceSnap) return;
    const targetSnap = allSnapshots.find(s => s.portfolioId === moveTargetPortfolioId);
    if (!targetSnap) return;
    const updatedSource = { ...sourceSnap, stocks: sourceSnap.stocks.filter(s => s.id !== moveItem.id), exportedAt: new Date().toISOString() };
    const updatedTarget = { ...targetSnap, stocks: [moveItem, ...targetSnap.stocks], exportedAt: new Date().toISOString() };
    await persistPortfolioSnapshot(updatedSource, sourcePortfolioId);
    await persistPortfolioSnapshot(updatedTarget, moveTargetPortfolioId);
    if (sourcePortfolioId === selectedPortfolioId) await save(updatedSource);
    if (moveTargetPortfolioId === selectedPortfolioId) await save(updatedTarget);
    setAllSnapshots(prev => prev.map(s => {
      if (s.portfolioId === sourcePortfolioId) return updatedSource;
      if (s.portfolioId === moveTargetPortfolioId) return updatedTarget;
      return s;
    }));
    setMoveOpen(false);
    setMoveItem(null);
    const targetName = portfolios.find(p => p.id === moveTargetPortfolioId)?.name || '';
    toast({ title: 'تم النقل', description: `تم نقل ${moveItem.symbol} إلى ${targetName}.` });
  };

  const autofillLivePrice = () => {
    const symbol = normalizeSymbol(form.symbol);
    const live = getPriceForSymbol(typedPrices, symbol, form.exchange);
    if (!live) {
      toast({ title: 'لا يوجد سعر مباشر', description: 'تأكد من الرمز أو حدّث الأسعار.', variant: 'destructive' });
      return;
    }
    setForm((prev) => ({ ...prev, buyPrice: live.toFixed(4) }));
    toast({ title: 'تم جلب السعر', description: `آخر سعر ${symbol}: ${live.toFixed(4)}` });
  };

  // Sell fee calculations
  const sellTaxDefaults = sellStock ? getTaxDefaults({ currency: sellStock.currency, symbol: sellStock.symbol, exchange: sellStock.exchange }) : { brokeragePct, vatPct, marketKey };
  const sellQtyNum = Number(sellForm.qty || 0);
  const sellPriceNum = Number(sellForm.sellPrice || 0);
  const grossSellCalc = sellQtyNum * sellPriceNum;
  const sellFeeCalc = calcTradeFees({
    grossAmount: grossSellCalc, brokeragePct: sellTaxDefaults.brokeragePct, vatPct: sellTaxDefaults.vatPct,
    customBrokerageAmount: sellForm.customBrok !== '' ? Number(sellForm.customBrok || 0) : undefined,
    customVatAmount: sellForm.customVat !== '' ? Number(sellForm.customVat || 0) : undefined,
  });
  const sellNetBeforePurification = grossSellCalc - sellFeeCalc.brokerage - sellFeeCalc.vat;
  const sellCostBasisCalc = sellQtyNum * (sellStock?.buyPrice || 0);
  const sellProfitBeforePurificationCalc = Math.max(0, sellNetBeforePurification - sellCostBasisCalc);
  const sellPurificationAmountAutoCalc = calcPurificationAmount(sellProfitBeforePurificationCalc, sellPurification.purificationPct || 0);
  const sellManualPurificationRaw = sellForm.customPurification !== '' ? Number(sellForm.customPurification) : NaN;
  const sellHasManualPurification = sellForm.customPurification !== '' && Number.isFinite(sellManualPurificationRaw);
  const sellPurificationAmountCalc = Math.min(
    sellProfitBeforePurificationCalc,
    Math.max(0, sellHasManualPurification ? sellManualPurificationRaw : sellPurificationAmountAutoCalc),
  );
  const sellNetAfterPurification = sellNetBeforePurification - sellPurificationAmountCalc;

  useEffect(() => {
    let cancelled = false;
    if (!sellOpen || !sellStock?.symbol) {
      setSellPurification(ZERO_PURIFICATION_METRICS);
      setSellPurificationLoading(false);
      return;
    }

    setSellPurificationLoading(true);
    fetchPurificationMetrics({
      symbol: sellStock.symbol,
      exchange: sellStock.exchange,
      assetType: 'stock',
    })
      .then((metrics) => {
        if (cancelled) return;
        setSellPurification(metrics);
      })
      .finally(() => {
        if (cancelled) return;
        setSellPurificationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sellOpen, sellStock?.symbol, sellStock?.exchange]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 transition-all duration-300 lg:mr-64">
        <TopBar title="📊 الأسهم (بيانات حقيقية)" />

        <main className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-5">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">عدد الأسهم</p><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">إجمالي التكلفة</p><p className="text-2xl font-bold">{fmtN(totals.cost)} <span className="text-sm font-normal text-muted-foreground">{displayCurrency}</span></p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">القيمة الحالية</p><p className="text-2xl font-bold">{fmtN(totals.value)} <span className="text-sm font-normal text-muted-foreground">{displayCurrency}</span></p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">السندات/الصكوك</p><p className="text-2xl font-bold">{allBonds.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">الصناديق/السلع</p><p className="text-2xl font-bold">{allFunds.length}</p></CardContent></Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b pb-2">
            <Button variant={activeTab === 'stocks' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('stocks')}>📊 الأسهم ({filtered.length})</Button>
            {allBonds.length > 0 && <Button variant={activeTab === 'bonds' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('bonds')}>📜 السندات/الصكوك ({allBonds.length})</Button>}
            {allFunds.length > 0 && <Button variant={activeTab === 'funds' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('funds')}>🏦 الصناديق/السلع ({allFunds.length})</Button>}
          </div>

          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-40 flex items-center gap-2">
                <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
                  <SelectTrigger><SelectValue placeholder="نطاق العرض" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المحافظ</SelectItem>
                    {portfolios.map((p) => (<SelectItem key={p.id} value={p.id}>📁 {p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالرمز أو الاسم..." className="pr-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="حالة الربح" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="profit">الرابحة</SelectItem>
                  <SelectItem value="loss">الخاسرة</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortFilter} onValueChange={setSortFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="الترتيب" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">الافتراضي</SelectItem>
                  <SelectItem value="value-desc">الأعلى قيمة</SelectItem>
                  <SelectItem value="value-asc">الأقل قيمة</SelectItem>
                  <SelectItem value="pl-desc">الأعلى ربحاً</SelectItem>
                  <SelectItem value="pl-asc">الأكثر خسارة</SelectItem>
                </SelectContent>
              </Select>
              <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="عملة العرض" /></SelectTrigger>
                <SelectContent>
                  {DISPLAY_CURRENCY_OPTIONS.map((currencyOption) => (
                    <SelectItem key={currencyOption.code} value={currencyOption.code}>
                      {currencyOption.label} ({currencyOption.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2" onClick={() => { void refresh(); void reload(); }}>
                <RefreshCw className="h-4 w-4" /> تحديث الأسعار
              </Button>

              {/* Add Stock Dialog */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> إضافة سهم</Button>
                </DialogTrigger>
                <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>إضافة سهم</DialogTitle>
                    <DialogDescription>تم تحسين الإضافة بأسلوب v4 مع جلب سعر حي مباشر.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3">
                    {portfolios.length > 1 && (
                      <div>
                        <Label>إضافة إلى محفظة</Label>
                        <Select value={addTargetPortfolioId} onValueChange={setAddTargetPortfolioId}>
                          <SelectTrigger><SelectValue placeholder="اختر المحفظة" /></SelectTrigger>
                          <SelectContent>
                            {portfolios.map((p) => (<SelectItem key={p.id} value={p.id}>📁 {p.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label>بحث الرمز</Label>
                      <SymbolLookup
                        type="stock" value={form.symbol}
                        onChange={(next) => setForm((p) => ({ ...p, symbol: next }))}
                        onPick={(item) => {
                          const detectedCurrency = item.currency || currencyFromExchange(item.exchange) || undefined;
                          setForm((prev) => ({
                            ...prev, symbol: item.symbol, name: item.name || prev.name,
                            buyPrice: item.quote?.price ? item.quote.price.toFixed(4) : prev.buyPrice,
                            exchange: item.exchange || prev.exchange,
                            currency: detectedCurrency || prev.currency,
                            sector: item.sector || prev.sector || '',
                            stockType: item.type || prev.stockType,
                            shariaStatus: item.shariaStatus || '', shariaBilad: item.shariaBilad || '',
                            shariaRajhi: item.shariaRajhi || '', shariaMaqasid: item.shariaMaqasid || '',
                            shariaZero: item.shariaZero || '',
                          }));
                          toast({
                            title: 'تمت التعبئة التلقائية',
                            description: item.quote
                              ? `${item.symbol} • ${item.quote.price.toFixed(4)} (${item.quote.changePct.toFixed(2)}%) • ${item.quote.source}`
                              : `${item.symbol} • ${item.name}`,
                          });
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>الرمز</Label><Input value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))} /></div>
                      <div><Label>الاسم</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label>الكمية</Label><Input type="number" value={form.qty} onChange={(e) => setForm((p) => ({ ...p, qty: e.target.value }))} /></div>
                      <div><Label>سعر الشراء</Label><Input type="number" value={form.buyPrice} onChange={(e) => setForm((p) => ({ ...p, buyPrice: e.target.value }))} /></div>
                      <div><Label>تاريخ الشراء</Label><Input type="date" value={form.buyDate} onChange={(e) => setForm((p) => ({ ...p, buyDate: e.target.value }))} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label>اسم البورصة</Label><Input value={form.exchange} onChange={(e) => setForm((p) => ({ ...p, exchange: e.target.value }))} placeholder="TADAWUL / NYSE..." /></div>
                      <div><Label>القطاع</Label><Input value={form.sector} onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))} /></div>
                      <div><Label>النوع</Label><Input value={form.stockType} onChange={(e) => setForm((p) => ({ ...p, stockType: e.target.value }))} placeholder="Common Stock / REIT..." /></div>
                    </div>
                    {form.currency && (
                      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                        <span className="text-lg">{CURRENCY_FLAGS[form.currency] ?? '💱'}</span>
                        <span className="font-medium">العملة:</span>
                        <span className="font-bold">{form.currency}</span>
                        <span className="text-xs text-muted-foreground">(تلقائي من البورصة)</span>
                      </div>
                    )}
                    <ShariaBadgesPanel shariaStatus={form.shariaStatus} shariaBilad={form.shariaBilad} shariaRajhi={form.shariaRajhi} shariaMaqasid={form.shariaMaqasid} shariaZero={form.shariaZero} />
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold text-primary">مبالغ العمولة والضريبة</p>
                      <p className="mb-3 text-xs text-muted-foreground">إعدادات السوق: {marketKey.toUpperCase()} • عمولة {brokeragePct}% • ضريبة عمولة {vatPct}%</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>عمولة السمسرة ({form.currency || 'SAR'})</Label><Input type="number" value={form.customBrok} placeholder={grossBuy > 0 ? `تلقائي ${(grossBuy * (brokeragePct / 100)).toFixed(2)}` : 'مبلغ...'} onChange={(e) => setForm((p) => ({ ...p, customBrok: e.target.value }))} /></div>
                        <div><Label>ضريبة القيمة المضافة ({form.currency || 'SAR'})</Label><Input type="number" value={form.customVat} placeholder={brokFee > 0 ? `تلقائي ${(brokFee * (vatPct / 100)).toFixed(2)}` : 'مبلغ...'} onChange={(e) => setForm((p) => ({ ...p, customVat: e.target.value }))} /></div>
                      </div>
                      <div className="mt-3 rounded-md border bg-background p-2 text-sm">
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي الشراء</span><span>{fmtN(grossBuy)}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">العمولة</span><span>{fmtN(brokFee)}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">الضريبة</span><span>{fmtN(vatFee)}</span></div>
                        <div className="mt-1 flex items-center justify-between font-bold"><span>التكلفة الفعلية</span><span>{fmtN(totalCostWithFees)} {form.currency || 'SAR'}</span></div>
                      </div>
                    </div>
                    <Button variant="outline" onClick={autofillLivePrice}>جلب السعر الحي للرمز</Button>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                    <Button onClick={addStock} disabled={saving}>حفظ</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Stock List */}
          {activeTab === 'stocks' && (
          <Card>
            <CardHeader><CardTitle>قائمة الأسهم</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground">جاري التحميل...</p> : null}
              {!loading && filtered.length === 0 ? <p className="text-muted-foreground">لا توجد أسهم.</p> : null}
              <div className="space-y-2">
                {filtered.map((stock) => {
                  const liveData = resolvePriceEntry(typedPrices, stock.symbol, stock.exchange);
                  const liveRaw = liveData?.price ?? null;
                  const live = liveRaw ?? stock.currentPrice ?? stock.buyPrice;
                  const persisted52w = stable52wMap[stockStableKey(stock.symbol, stock.exchange)];
                  const live52h = liveData?.high52w ?? persisted52w?.high52w ?? stock.high52w ?? null;
                  const live52l = liveData?.low52w ?? persisted52w?.low52w ?? stock.low52w ?? null;
                  const vol = liveData?.volume;
                  const avgVol = liveData?.averageVolume;
                  const shortRatio = liveData?.shortRatio;
                  const shortPctFloat = liveData?.shortPercentOfFloat;
                  const shortDataSource = liveData?.shortDataSource || null;
                  const sharesShortRaw = liveData?.sharesShort ?? null;
                  const floatShares = liveData?.floatShares ?? null;
                  const sharesOutstanding = liveData?.sharesOutstanding ?? null;
                  const sharesShort = sharesShortRaw && sharesShortRaw > 0
                    ? sharesShortRaw
                    : (shortPctFloat != null && shortPctFloat > 0 && floatShares != null && floatShares > 0
                      ? (shortPctFloat / 100) * floatShares
                      : null);
                  const sharesBuyToCover = sharesShort;
                  const cost = stock.qty * stock.buyPrice;
                  const value = stock.qty * live;
                  const pl = value - cost;
                  const pctPos = pos52w(live, live52h, live52l);
                  const itemPortfolioId = assetPortfolioIdMap.get(stock.id);
                  const stockCurrency = stock.currency || currencyFromExchange(stock.exchange) || (itemPortfolioId ? portfolioCurrencyMap.get(itemPortfolioId) : undefined) || 'SAR';
                  const isDiff = stockCurrency !== displayCurrency;
                  const convLive = convertCurrency(live, stockCurrency, displayCurrency);
                  const convPl = convertCurrency(pl, stockCurrency, displayCurrency);

                  return (
                    <div key={stock.id} className="space-y-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-colors hover:border-primary/35">
                      <div className="flex flex-wrap items-start gap-3">
                        {portfolioFilter === 'all' && assetPortfolioMap.get(stock.id) && (
                          <Badge variant="secondary" className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">💼 {assetPortfolioMap.get(stock.id)}</Badge>
                        )}
                        <div className="min-w-28 font-bold">{stock.symbol}</div>
                        <div className="flex-1 min-w-40">
                          <p className="font-medium">{stock.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[stock.exchange, stock.sector, stock.type].filter(Boolean).join(' • ') || '—'}
                          </p>
                        </div>
                        <ShariaBadgesPanel
                          shariaStatus={stock.shariaStatus}
                          shariaBilad={stock.shariaBilad}
                          shariaRajhi={stock.shariaRajhi}
                          shariaMaqasid={stock.shariaMaqasid}
                          shariaZero={stock.shariaZero}
                        />
                        <Badge variant="outline" className={ASSET_METRIC_BADGE_CLASS}>
                          <span className={ASSET_METRIC_LABEL_CLASS}>الكمية:</span>
                          <span>{stock.qty}</span>
                        </Badge>
                        <Badge variant="outline" className={`${ASSET_METRIC_BADGE_CLASS} bg-blue-50/80 dark:bg-blue-950/30`}>
                          <span className={ASSET_METRIC_LABEL_CLASS}>سعر الشراء:</span>
                          <span>{fmtN(stock.buyPrice, 4)}</span>
                          <span className="text-[10px] opacity-80">{stockCurrency}</span>
                        </Badge>
                        <Badge variant="outline" className={ASSET_METRIC_BADGE_CLASS}>
                          <span className={ASSET_METRIC_LABEL_CLASS}>الحالي:</span>
                          <span>{fmtN(live, 4)}</span>
                          <span className="text-[10px] opacity-80">{stockCurrency}</span>
                          {isDiff && <span className="text-[10px] text-muted-foreground">({fmtN(convLive, 4)} {displayCurrency})</span>}
                        </Badge>
                        <Badge className={`rounded-lg border-2 px-3 py-1.5 text-[13px] font-extrabold shadow-sm ${pl >= 0 ? 'border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300' : 'border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'}`}>
                          <span className="text-[11px] font-bold opacity-80">الربح/الخسارة:</span>
                          <span>{pl >= 0 ? '+' : ''}{fmtN(pl)}</span>
                          <span className="text-[10px] opacity-80">{stockCurrency}</span>
                          {isDiff && <span className="opacity-80 text-[10px]">({pl >= 0 ? '+' : ''}{fmtN(convPl)} {displayCurrency})</span>}
                        </Badge>
                        {stock.buyDate && (
                          <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/30">📅 {stock.buyDate}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/15 px-3 py-2">
                        <div className="flex min-w-[280px] flex-1 flex-wrap items-center gap-3">
                          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold" dir="ltr">
                            <span className="text-red-600">أدنى 52 أسبوع: {live52l?.toFixed(2) ?? '—'}</span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-green-600">أعلى 52 أسبوع: {live52h?.toFixed(2) ?? '—'}</span>
                          </div>
                          {(live52h != null || live52l != null) && (
                            <div className="min-w-[180px] flex-1" dir="ltr">
                              <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                                <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-red-500 via-amber-400 to-green-500 opacity-40" />
                                {pctPos !== null && (
                                  <div
                                    className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow-lg transition-[left] duration-500"
                                    style={{ left: `calc(${pctPos}% - 8px)` }}
                                  />
                                )}
                              </div>
                              {pctPos !== null && (
                                <div className="relative mt-1 h-4">
                                  <span
                                    className="absolute -translate-x-1/2 text-[10px] font-bold text-primary tabular-nums"
                                    style={{ left: `${pctPos}%` }}
                                  >
                                    {live.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {pctPos !== null && (
                                <p className="mt-1 text-center text-[10px] text-muted-foreground" dir="rtl">
                                  {pctPos > 70 ? 'قريب من الأعلى' : pctPos < 30 ? 'قريب من الأدنى' : 'في المنتصف'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2" dir="rtl">
                          <Badge variant="secondary" className="text-[10px] bg-muted/70">
                            إجراءات السهم
                          </Badge>
                          {portfolios.length > 1 && (
                            <Button variant="outline" size="sm" className={ACTION_MOVE_BUTTON_CLASS} title="نقل لمحفظة أخرى" onClick={() => { setMoveItem(stock); setMoveTargetPortfolioId(''); setMoveOpen(true); }}>
                              <ArrowRightLeft className="h-4 w-4" />
                              <span>نقل</span>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className={ACTION_EDIT_BUTTON_CLASS} title="تعديل" onClick={() => { setEditStock({ ...stock }); setEditOpen(true); }}>
                            <Edit2 className="h-4 w-4" />
                            <span>تعديل</span>
                          </Button>
                          <Button variant="outline" size="sm" className={ACTION_SELL_BUTTON_CLASS} title="بيع" onClick={() => { setSellStock(stock); setSellForm({ qty: String(stock.qty), sellPrice: live.toFixed(4), sellDate: todayStr(), customBrok: '', customVat: '', customPurification: '' }); setSellOpen(true); }}>
                            <ArrowDownRight className="h-4 w-4" />
                            <span>بيع</span>
                          </Button>
                          {!isReadOnly && (
                            <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleteConfirmId(stock.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Volume & Short Interest Bar */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px]" dir="rtl">
                        {vol != null && (
                          <div className="flex items-center gap-2 min-w-[200px] flex-1">
                            <span className="text-muted-foreground whitespace-nowrap">حجم التداول:</span>
                            <span className="font-bold tabular-nums">{vol >= 1e6 ? `${(vol / 1e6).toFixed(1)}M` : vol >= 1e3 ? `${(vol / 1e3).toFixed(0)}K` : vol.toLocaleString()}</span>
                            {avgVol != null && avgVol > 0 && (() => {
                              const volRatio = vol / avgVol;
                              const barPct = Math.min(100, volRatio * 50);
                              const isHigh = volRatio > 1.5;
                              const isLow = volRatio < 0.5;
                              return (
                                <div className="flex items-center gap-1.5 flex-1">
                                  <div className="relative h-2 flex-1 max-w-[160px] rounded-full bg-muted overflow-hidden">
                                    <div className={`absolute inset-y-0 right-0 rounded-full transition-all ${isHigh ? 'bg-green-500' : isLow ? 'bg-red-400' : 'bg-blue-400'}`} style={{ width: `${barPct}%` }} />
                                    <div className="absolute inset-y-0 right-1/2 w-px bg-muted-foreground/30" />
                                  </div>
                                  <span className={`text-[10px] font-medium ${isHigh ? 'text-green-600' : isLow ? 'text-red-500' : 'text-muted-foreground'}`}>
                                    {volRatio.toFixed(1)}x {isHigh ? '↑' : isLow ? '↓' : ''}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">(متوسط: {avgVol >= 1e6 ? `${(avgVol / 1e6).toFixed(1)}M` : `${(avgVol / 1e3).toFixed(0)}K`})</span>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-muted-foreground">البيع على المكشوف (من المصدر):</span>
                          {shortPctFloat != null ? (
                            <Badge variant="outline" className={`text-[10px] ${shortPctFloat >= 20 ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30' : shortPctFloat >= 10 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30' : 'border-muted'}`}>
                              {shortPctFloat.toFixed(2)}%
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">غير متاح</span>
                          )}
                          <span className="text-muted-foreground">|</span>
                          <span className="text-muted-foreground">Days to Cover:</span>
                          <span className="font-extrabold tabular-nums">{shortRatio != null ? shortRatio.toFixed(2) : '—'}</span>
                          <span className="text-muted-foreground">|</span>
                          <span className="text-muted-foreground">عدد أسهم البيع على المكشوف:</span>
                          <span className="font-extrabold tabular-nums">{sharesShort != null ? formatSharesCount(sharesShort) : 'غير متاح'}</span>
                          <span className="text-muted-foreground">|</span>
                          <span className="text-muted-foreground">عدد أسهم الشراء لتغطية المراكز:</span>
                          <span className="font-extrabold tabular-nums">{sharesBuyToCover != null ? formatSharesCount(sharesBuyToCover) : 'غير متاح'}</span>
                          {sharesOutstanding != null && sharesOutstanding > 0 && (
                            <>
                              <span className="text-muted-foreground">|</span>
                              <span className="text-muted-foreground">إجمالي الأسهم القائمة:</span>
                              <span className="font-extrabold tabular-nums">{formatSharesCount(sharesOutstanding)}</span>
                            </>
                          )}
                          <span className="text-muted-foreground">|</span>
                          <span className="text-muted-foreground">المصدر:</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {shortDataSource || 'غير متاح'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Bonds/Sukuk Tab */}
          {activeTab === 'bonds' && allBonds.length > 0 && (
          <Card>
            <CardHeader><CardTitle>📜 السندات والصكوك</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allBonds.map((bond) => {
                  const live = bond.currentPrice ?? bond.buyPrice;
                  const pl = (live - bond.buyPrice) * bond.qty;
                  const plPct = bond.buyPrice ? ((live - bond.buyPrice) / bond.buyPrice) * 100 : 0;
                  return (
                    <div key={bond.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{bond.symbol}</span>
                          <span className="text-xs text-muted-foreground truncate">{bond.name}</span>
                          {bond.type && <Badge variant="outline" className="text-[10px]">{bond.type === 'sukuk' ? 'صكوك' : bond.type}</Badge>}
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>الكمية: {bond.qty}</span>
                          <span>القيمة الاسمية: {bond.faceValue}</span>
                          {bond.couponRate != null && <span>العائد: {bond.couponRate}%</span>}
                          {bond.maturityDate && <span>الاستحقاق: {bond.maturityDate?.split('T')[0]}</span>}
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="font-bold text-sm">{live.toFixed(2)}</p>
                        <p className={cn('text-xs font-semibold', pl >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {pl >= 0 ? '+' : ''}{pl.toFixed(2)} ({plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Funds/Commodities Tab */}
          {activeTab === 'funds' && allFunds.length > 0 && (
          <Card>
            <CardHeader><CardTitle>🏦 الصناديق والسلع</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allFunds.map((fund) => {
                  const live = fund.currentPrice ?? fund.buyPrice;
                  const pl = (live - fund.buyPrice) * fund.units;
                  const plPct = fund.buyPrice ? ((live - fund.buyPrice) / fund.buyPrice) * 100 : 0;
                  return (
                    <div key={fund.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{fund.symbol}</span>
                          <span className="text-xs text-muted-foreground truncate">{fund.name}</span>
                          {fund.fundType && <Badge variant="outline" className="text-[10px]">{fund.fundType === 'commodities' ? 'سلع' : fund.fundType}</Badge>}
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>الوحدات: {fund.units}</span>
                          <span>سعر الشراء: {fund.buyPrice}</span>
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="font-bold text-sm">{live.toFixed(2)}</p>
                        <p className={cn('text-xs font-semibold', pl >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {pl >= 0 ? '+' : ''}{pl.toFixed(2)} ({plPct >= 0 ? '+' : ''}{plPct.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          )}
        </main>
      </div>

      {/* Edit Dialog */}
      <StockEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        stock={editStock}
        onChange={setEditStock as (s: SnapshotStock) => void}
        onSave={saveEdit}
        saving={saving}
        defaultCurrency={activePortfolio?.currency || displayCurrency || 'SAR'}
      />

      {/* Move Dialog */}
      <StockMoveDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        itemName={moveItem?.symbol}
        targetPortfolioId={moveTargetPortfolioId}
        onTargetChange={setMoveTargetPortfolioId}
        portfolios={portfolios}
        sourcePortfolioId={assetPortfolioIdMap.get(moveItem?.id || '') || selectedPortfolioId || ''}
        onMove={moveToPortfolio}
        saving={saving}
      />

      {/* Sell Dialog */}
      <Dialog open={sellOpen} onOpenChange={setSellOpen}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>بيع {sellStock?.symbol}</DialogTitle>
            <DialogDescription>بيع كمية من {sellStock?.name} (الكمية المتاحة: {sellStock?.qty})</DialogDescription>
          </DialogHeader>
          {sellStock && (
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>كمية البيع</Label><Input type="number" max={sellStock.qty} value={sellForm.qty} onChange={(e) => setSellForm((p) => ({ ...p, qty: e.target.value }))} /></div>
                <div><Label>سعر البيع</Label><Input type="number" value={sellForm.sellPrice} onChange={(e) => setSellForm((p) => ({ ...p, sellPrice: e.target.value }))} /></div>
                <div><Label>تاريخ البيع</Label><Input type="date" value={sellForm.sellDate} onChange={(e) => setSellForm((p) => ({ ...p, sellDate: e.target.value }))} /></div>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold text-primary">مبالغ العمولة والضريبة</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div><Label>عمولة السمسرة ({sellStock.currency || activePortfolio?.currency || 'SAR'})</Label><Input type="number" value={sellForm.customBrok} placeholder={grossSellCalc > 0 ? `تلقائي ${(grossSellCalc * (sellTaxDefaults.brokeragePct / 100)).toFixed(2)}` : 'مبلغ...'} onChange={(e) => setSellForm((p) => ({ ...p, customBrok: e.target.value }))} /></div>
                  <div><Label>ضريبة القيمة المضافة ({sellStock.currency || activePortfolio?.currency || 'SAR'})</Label><Input type="number" value={sellForm.customVat} placeholder={sellFeeCalc.brokerage > 0 ? `تلقائي ${(sellFeeCalc.brokerage * (sellTaxDefaults.vatPct / 100)).toFixed(2)}` : 'مبلغ...'} onChange={(e) => setSellForm((p) => ({ ...p, customVat: e.target.value }))} /></div>
                  <div><Label>مبلغ التطهير ({sellStock.currency || activePortfolio?.currency || 'SAR'})</Label><Input type="number" min="0" value={sellForm.customPurification} placeholder={sellProfitBeforePurificationCalc > 0 ? `تلقائي ${fmtN(sellPurificationAmountAutoCalc)}` : '0.00'} onChange={(e) => setSellForm((p) => ({ ...p, customPurification: e.target.value }))} /></div>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">التطهير يُخصم من الربح فقط. الحد الأقصى المسموح: {fmtN(sellProfitBeforePurificationCalc)}.</p>
                <div className="mt-3 rounded-md border bg-background p-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي مبلغ البيع</span><span>{fmtN(grossSellCalc)}</span></div>
                  <div className="flex items-center justify-between text-red-500/80"><span className="text-xs">- العمولة</span><span>{fmtN(sellFeeCalc.brokerage)}</span></div>
                  <div className="flex items-center justify-between text-red-500/80"><span className="text-xs">- الضريبة</span><span>{fmtN(sellFeeCalc.vat)}</span></div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>نسبة التطهير</span>
                    <span>
                      ({fmtN(sellPurification.interestIncomeToRevenuePct, 4)}% + {fmtN(sellPurification.debtToMarketCapPct, 4)}%)
                      {' = '}
                      <span className="font-semibold text-foreground">{fmtN(sellPurification.purificationPct, 4)}%</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground"><span>الربح قبل التطهير</span><span>{fmtN(sellProfitBeforePurificationCalc)}</span></div>
                  <div className="flex items-center justify-between text-red-500/80"><span className="text-xs">- مبلغ التطهير (من الربح فقط)</span><span>{fmtN(sellPurificationAmountCalc)}{sellHasManualPurification ? ' (يدوي)' : ''}</span></div>
                  <div className="my-1 border-t pt-1 flex items-center justify-between font-medium"><span className="text-muted-foreground">صافي عائد البيع (بعد التطهير)</span><span>{fmtN(sellNetAfterPurification)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي تكلفة الشراء</span><span>{fmtN(sellCostBasisCalc)} ({fmtN(sellStock.buyPrice, 4)} للسهم)</span></div>
                  <div className={`mt-1 border-t pt-1 flex items-center justify-between font-bold ${(sellNetAfterPurification - sellCostBasisCalc) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span>الربح/الخسارة الصافي</span>
                    <span>{(sellNetAfterPurification - sellCostBasisCalc) >= 0 ? '+' : ''}{fmtN(sellNetAfterPurification - sellCostBasisCalc)} {sellStock.currency || activePortfolio?.currency || 'SAR'}</span>
                  </div>
                  {sellPurificationLoading && (
                    <p className="mt-1 text-[10px] text-muted-foreground">جاري تحميل بيانات التطهير...</p>
                  )}
                  {!sellPurificationLoading && !sellPurification.found && (
                    <p className="mt-1 text-[10px] text-muted-foreground">لا تتوفر بيانات تطهير مباشرة لهذا الرمز، تم اعتماد قيمة 0%.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSellOpen(false)}>إلغاء</Button>
            <Button onClick={executeSell} disabled={saving} className="bg-amber-600 hover:bg-amber-700">تنفيذ البيع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <StockDeleteDialog
        id={deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
        onConfirm={() => { if (deleteConfirmId) { void removeStock(deleteConfirmId); setDeleteConfirmId(null); } }}
      />
    </div>
  );
}
