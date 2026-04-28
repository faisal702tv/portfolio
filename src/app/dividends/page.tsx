'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { fetchPortfolioSnapshot } from '@/lib/export-utils';
import type { PortfolioSnapshot } from '@/lib/export-utils';
import { resolveAssetMarket } from '@/lib/asset-market';
import { convertCurrency } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';
import { notifySuccess, notifyWarning, notifyInfo, notifyError } from '@/hooks/use-notifications';
import { DIVIDEND_DATABASE, type DividendEntry } from '@/data/dividends-database';
import { LOCAL_SYMBOL_DB } from '@/data/symbols-database';
import {
  Plus,
  Search,
  TrendingUp,
  Trash2,
  Edit2,
  Calendar,
  Building2,
  Database,
  RefreshCw,
  Filter,
  Globe,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DividendRecord {
  id: string;
  symbol: string;
  name: string;
  assetType: 'stock' | 'fund' | 'bond' | 'sukuk';
  sector?: string;
  currency?: string;
  dividendPerUnit: number;
  totalDividend: number;
  yieldPct: number;
  exDate: string;
  payDate: string;
  status: 'paid' | 'upcoming' | 'none';
  notes?: string;
}

interface HoldingOption {
  /** Unique key: `${portfolioId}_${symbol}` when from all-portfolios merge */
  key: string;
  symbol: string;
  name: string;
  assetType: 'stock' | 'fund' | 'bond' | 'sukuk';
  sector?: string;
  currency?: string;
  qty: number;
  currentPrice?: number;
  portfolioName?: string;
}

type CurrencyTotals = Record<string, number>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'portfolio_dividends';

const statusArabic: Record<DividendRecord['status'], string> = {
  paid: 'تم الصرف',
  upcoming: 'قادم',
  none: 'لا يوجد',
};

const statusFromArabic: Record<string, DividendRecord['status']> = {
  'تم الصرف': 'paid',
  'قادم': 'upcoming',
  'لا يوجد': 'none',
};

const assetTypeArabic: Record<DividendRecord['assetType'], string> = {
  stock: 'سهم',
  fund: 'صندوق',
  bond: 'سند',
  sukuk: 'صكوك',
};

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

function currencyLabel(c?: string): string {
  const code = normalizeCurrencyCode(c);
  return CURRENCY_META[code]?.symbol ?? code;
}

function currencyName(c?: string): string {
  const code = normalizeCurrencyCode(c);
  return CURRENCY_META[code]?.name ?? code;
}

function currencyDecimals(c?: string): number {
  const code = normalizeCurrencyCode(c);
  return CURRENCY_META[code]?.decimals ?? 2;
}

function orderCurrencies(codes: Iterable<string>): string[] {
  return Array.from(new Set(Array.from(codes).map((c) => normalizeCurrencyCode(c))))
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

function detectCurrencyFromSymbol(symbol: string, exchange?: string, explicitCurrency?: string): string {
  const resolved = resolveAssetMarket({
    symbol,
    exchange,
    currency: explicitCurrency,
  });
  return normalizeCurrencyCode(resolved.currency || explicitCurrency || 'SAR');
}

function convertAmount(amount: number, fromCurrency?: string, toCurrency?: string): number {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);
  return convertCurrency(safeAmount, from, to);
}

function loadDividends(): DividendRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DividendRecord[]) : [];
  } catch {
    return [];
  }
}

function saveDividends(records: DividendRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

const todayStr = () => new Date().toISOString().split('T')[0];

const emptyForm = (currency = 'SAR'): Omit<DividendRecord, 'id'> => ({
  symbol: '',
  name: '',
  assetType: 'stock',
  sector: '',
  currency: normalizeCurrencyCode(currency),
  dividendPerUnit: 0,
  totalDividend: 0,
  yieldPct: 0,
  exDate: todayStr(),
  payDate: todayStr(),
  status: 'paid',
  notes: '',
});

function fmtNum(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrencyAmount(amount: number, currency?: string): string {
  const code = normalizeCurrencyCode(currency);
  return `${fmtNum(amount, currencyDecimals(code))} ${currencyLabel(code)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DividendsPage() {
  const { toast } = useToast();
  const { snapshot, portfolios, loading: snapshotLoading } = usePortfolioSnapshot();

  // All-portfolios snapshots
  const [allSnapshots, setAllSnapshots] = useState<{ portfolioName: string; snapshot: PortfolioSnapshot }[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);

  const loading = snapshotLoading || loadingAll;

  const [dividends, setDividends] = useState<DividendRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DividendRecord['status']>('all');
  const [summaryCurrency, setSummaryCurrency] = useState<string>('SAR');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadDividends();
    const normalized = loaded.map((record) => {
      const normalizedStatus: DividendRecord['status'] =
        record.status === 'paid' || record.status === 'upcoming' || record.status === 'none'
          ? record.status
          : 'none';

      return {
        ...record,
        symbol: String(record.symbol || '').trim(),
        name: String(record.name || '').trim(),
        currency: detectCurrencyFromSymbol(record.symbol, undefined, record.currency),
        dividendPerUnit: Number(record.dividendPerUnit) || 0,
        totalDividend: Number(record.totalDividend) || 0,
        yieldPct: Number(record.yieldPct) || 0,
        exDate: record.exDate || todayStr(),
        payDate: record.payDate || todayStr(),
        status: normalizedStatus,
      };
    });

    setDividends(normalized);
    if (JSON.stringify(loaded) !== JSON.stringify(normalized)) {
      saveDividends(normalized);
    }
  }, []);

  useEffect(() => {
    if (snapshot?.currency) {
      setSummaryCurrency((prev) => (prev === 'SAR' ? normalizeCurrencyCode(snapshot.currency) : prev));
    }
  }, [snapshot?.currency]);

  // Fetch ALL portfolios' snapshots once portfolio list is available
  useEffect(() => {
    if (!portfolios.length) {
      setLoadingAll(false);
      return;
    }

    let cancelled = false;

    async function fetchAll() {
      setLoadingAll(true);
      try {
        const results = await Promise.all(
          portfolios.map(async (p) => {
            try {
              const data = await fetchPortfolioSnapshot(p.id);
              return { portfolioName: p.name, snapshot: data.snapshot };
            } catch {
              return null;
            }
          })
        );
        if (!cancelled) {
          setAllSnapshots(
            results.filter((r): r is { portfolioName: string; snapshot: PortfolioSnapshot } => r !== null)
          );
        }
      } catch {
        // fallback: use single snapshot if available
        if (!cancelled && snapshot) {
          setAllSnapshots([{ portfolioName: snapshot.portfolioName, snapshot }]);
        }
      } finally {
        if (!cancelled) setLoadingAll(false);
      }
    }

    void fetchAll();
    return () => { cancelled = true; };
  }, [portfolios, snapshot]);

  // Persist whenever dividends change
  const persist = useCallback((next: DividendRecord[]) => {
    setDividends(next);
    saveDividends(next);
  }, []);

  // Build holdings list from ALL portfolio snapshots
  const holdings = useMemo<HoldingOption[]>(() => {
    if (allSnapshots.length === 0) return [];
    const list: HoldingOption[] = [];

    for (const { portfolioName, snapshot: snap } of allSnapshots) {
      const pid = snap.portfolioId ?? portfolioName;

      for (const s of snap.stocks) {
        list.push({
          key: `${pid}_${s.symbol}`,
          symbol: s.symbol,
          name: s.name,
          assetType: 'stock',
          sector: s.sector,
          currency: detectCurrencyFromSymbol(s.symbol, s.exchange, s.currency),
          qty: s.qty,
          currentPrice: s.currentPrice ?? undefined,
          portfolioName,
        });
      }

      for (const f of snap.funds) {
        const sym = f.symbol ?? f.name;
        list.push({
          key: `${pid}_${sym}`,
          symbol: sym,
          name: f.name,
          assetType: 'fund',
          sector: f.sector,
          currency: detectCurrencyFromSymbol(f.symbol ?? '', f.exchange, f.currency),
          qty: f.units,
          currentPrice: f.currentPrice ?? undefined,
          portfolioName,
        });
      }

      for (const b of snap.bonds) {
        list.push({
          key: `${pid}_${b.symbol}`,
          symbol: b.symbol,
          name: b.name,
          assetType: b.type === 'bond' ? 'bond' : 'sukuk',
          sector: undefined,
          currency: detectCurrencyFromSymbol(b.symbol, b.exchange, b.currency),
          qty: b.qty,
          currentPrice: b.currentPrice ?? undefined,
          portfolioName,
        });
      }
    }

    return list;
  }, [allSnapshots]);

  const holdingOptions = useMemo(
    () => holdings.map((h, index) => ({ ...h, optionId: `${h.key}__${index}` })),
    [holdings]
  );

  const selectedHoldingValue = useMemo(() => {
    if (!form.symbol) return '';
    const byName = holdingOptions.find((h) => h.symbol === form.symbol && h.name === form.name);
    if (byName) return byName.optionId;
    const bySymbol = holdingOptions.find((h) => h.symbol === form.symbol);
    return bySymbol?.optionId ?? '';
  }, [holdingOptions, form.symbol, form.name]);

  const symbolCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of holdingOptions) {
      map.set(h.symbol, (map.get(h.symbol) ?? 0) + 1);
    }
    return map;
  }, [holdingOptions]);

  // When user selects a symbol, auto-fill fields
  const handleSymbolChange = (selectedValue: string) => {
    const holding =
      holdingOptions.find((h) => h.optionId === selectedValue) ||
      holdingOptions.find((h) => h.key === selectedValue) ||
      holdingOptions.find((h) => h.symbol === selectedValue);
    if (holding) {
      const perUnit = form.dividendPerUnit || 0;
      const total = perUnit * holding.qty;
      const yieldPct =
        holding.currentPrice && holding.currentPrice > 0
          ? (perUnit / holding.currentPrice) * 100
          : 0;
      setForm((prev) => ({
        ...prev,
        symbol: holding.symbol,
        name: holding.name,
        assetType: holding.assetType,
        sector: holding.sector ?? '',
        currency: normalizeCurrencyCode(holding.currency),
        totalDividend: total,
        yieldPct: +yieldPct.toFixed(4),
      }));
    } else {
      setForm((prev) => ({ ...prev, symbol: selectedValue }));
    }
  };

  // Recalculate total and yield when dividendPerUnit changes
  const handlePerUnitChange = (value: number) => {
    const holding = holdings.find((h) => h.symbol === form.symbol);
    const qty = holding?.qty ?? 0;
    const total = value * qty;
    const yieldPct =
      holding?.currentPrice && holding.currentPrice > 0
        ? (value / holding.currentPrice) * 100
        : 0;
    setForm((prev) => ({
      ...prev,
      dividendPerUnit: value,
      totalDividend: +total.toFixed(4),
      yieldPct: +yieldPct.toFixed(4),
    }));
  };

  // Open add dialog
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm(normalizeCurrencyCode(snapshot?.currency || 'SAR')));
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEdit = (record: DividendRecord) => {
    setEditingId(record.id);
    setForm({
      symbol: record.symbol,
      name: record.name,
      assetType: record.assetType,
      sector: record.sector ?? '',
      currency: normalizeCurrencyCode(record.currency),
      dividendPerUnit: record.dividendPerUnit,
      totalDividend: record.totalDividend,
      yieldPct: record.yieldPct,
      exDate: record.exDate,
      payDate: record.payDate,
      status: record.status,
      notes: record.notes ?? '',
    });
    setDialogOpen(true);
  };

  // Save (add or edit)
  const handleSave = () => {
    if (!form.symbol || !form.name) {
      toast({ title: 'خطأ', description: 'الرمز والاسم مطلوبان.', variant: 'destructive' });
      return;
    }
    if (form.dividendPerUnit <= 0) {
      toast({ title: 'خطأ', description: 'أدخل مبلغ التوزيع لكل وحدة.', variant: 'destructive' });
      return;
    }

    const normalizedPayload: Omit<DividendRecord, 'id'> = {
      ...form,
      symbol: String(form.symbol || '').trim().toUpperCase(),
      name: String(form.name || '').trim(),
      currency: normalizeCurrencyCode(form.currency),
      dividendPerUnit: Number(form.dividendPerUnit) || 0,
      totalDividend: Number(form.totalDividend) || 0,
      yieldPct: Number(form.yieldPct) || 0,
      exDate: form.exDate || todayStr(),
      payDate: form.payDate || todayStr(),
      status: form.status,
      notes: String(form.notes || '').trim(),
    };

    if (editingId) {
      const next = dividends.map((d) =>
        d.id === editingId
          ? { ...normalizedPayload, id: editingId }
          : d
      );
      persist(next);
      toast({ title: 'تم التعديل', description: `تم تعديل توزيع ${normalizedPayload.name} بنجاح.` });
    } else {
      const newRecord: DividendRecord = {
        ...normalizedPayload,
        id: crypto.randomUUID(),
      };
      persist([newRecord, ...dividends]);
      toast({ title: 'تمت الإضافة', description: `تم إضافة توزيع ${normalizedPayload.name} بنجاح.` });
      notifySuccess('تمت إضافة توزيع', `تم إضافة توزيع ${normalizedPayload.name} بنجاح`, { source: 'dividends' });
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm(normalizeCurrencyCode(snapshot?.currency || 'SAR')));
  };

  // Delete
  const handleDelete = (id: string) => {
    const record = dividends.find((d) => d.id === id);
    const next = dividends.filter((d) => d.id !== id);
    persist(next);
    toast({ title: 'تم الحذف', description: `تم حذف توزيع ${record?.name ?? ''}.` });
    notifyWarning('تم حذف توزيع', `تم حذف توزيع ${record?.name ?? ''}`, { source: 'dividends' });
  };

  // Filtering
  const filtered = useMemo(() => {
    let list = dividends;
    if (statusFilter !== 'all') {
      list = list.filter((d) => d.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.symbol.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [dividends, statusFilter, search]);

  // Summary calculations (multi-currency + converted base)
  const totalsByCurrency = useMemo(() => {
    const paid: CurrencyTotals = {};
    const upcoming: CurrencyTotals = {};

    for (const d of dividends) {
      const amount = Number(d.totalDividend) || 0;
      if (amount <= 0) continue;
      const code = normalizeCurrencyCode(d.currency);
      if (d.status === 'paid') paid[code] = (paid[code] ?? 0) + amount;
      if (d.status === 'upcoming') upcoming[code] = (upcoming[code] ?? 0) + amount;
    }

    return { paid, upcoming };
  }, [dividends]);

  const paidByCurrencyRows = useMemo(
    () =>
      orderCurrencies(Object.keys(totalsByCurrency.paid)).map((currency) => ({
        currency,
        amount: totalsByCurrency.paid[currency] ?? 0,
      })),
    [totalsByCurrency]
  );

  const upcomingByCurrencyRows = useMemo(
    () =>
      orderCurrencies(Object.keys(totalsByCurrency.upcoming)).map((currency) => ({
        currency,
        amount: totalsByCurrency.upcoming[currency] ?? 0,
      })),
    [totalsByCurrency]
  );

  const totalPaidConverted = useMemo(
    () => paidByCurrencyRows.reduce((sum, row) => sum + convertAmount(row.amount, row.currency, summaryCurrency), 0),
    [paidByCurrencyRows, summaryCurrency]
  );

  const totalExpectedConverted = useMemo(
    () => upcomingByCurrencyRows.reduce((sum, row) => sum + convertAmount(row.amount, row.currency, summaryCurrency), 0),
    [upcomingByCurrencyRows, summaryCurrency]
  );

  const summaryCurrencyOptions = useMemo(() => {
    const options = new Set<string>(CURRENCY_ORDER);
    options.add(normalizeCurrencyCode(snapshot?.currency || 'SAR'));
    for (const row of paidByCurrencyRows) options.add(row.currency);
    for (const row of upcomingByCurrencyRows) options.add(row.currency);
    return orderCurrencies(options);
  }, [snapshot?.currency, paidByCurrencyRows, upcomingByCurrencyRows]);

  const activeCurrenciesCount = useMemo(
    () => orderCurrencies([...paidByCurrencyRows.map((r) => r.currency), ...upcomingByCurrencyRows.map((r) => r.currency)]).length,
    [paidByCurrencyRows, upcomingByCurrencyRows]
  );

  const moneyInputStep = currencyDecimals(form.currency) >= 3 ? '0.001' : '0.01';

  // ─── Local Dividend Database State ───
  const [dbTab, setDbTab] = useState<'upcoming' | 'saudi' | 'usa' | 'funds' | 'portfolios' | 'watchlist'>('upcoming');
  const [dbSearch, setDbSearch] = useState('');
  const [dbLiveLoading, setDbLiveLoading] = useState(false);
  const [dbLiveData, setDbLiveData] = useState<DividendEntry[]>([]);
  const [portfolioDivData, setPortfolioDivData] = useState<DividendEntry[]>([]);
  const [watchlistDivData, setWatchlistDivData] = useState<DividendEntry[]>([]);
  const [portfolioDivLoading, setPortfolioDivLoading] = useState(false);
  const [watchlistDivLoading, setWatchlistDivLoading] = useState(false);

  const todayISO = new Date().toISOString().split('T')[0];

  const KNOWN_ETF_SYMBOLS = useMemo(() => {
    const etfSet = new Set<string>();
    const sectors = ['صندوق', 'صندوق تقني', 'صندوق مالي', 'صندوق صحي', 'صندوق طاقة', 'صندوق صناعي', 'صندوق مرافق', 'صندوق استهلاكي', 'صندوق اتصالات', 'صندوق مواد', 'صندوق عقاري', 'صندوق معادن', 'بتكوين', 'رافعة', 'سلع', 'سندات'];
    try {
      for (const [sym, info] of Object.entries(LOCAL_SYMBOL_DB)) {
        const sec = (info as Record<string, unknown>).s as string;
        if (sec && sectors.includes(sec)) {
          etfSet.add(sym);
        }
      }
    } catch {}
    return etfSet;
  }, []);

  const watchlistItems = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('watchlist_data');
      if (!raw) return [];
      const lists = JSON.parse(raw) as Array<{ items: Array<{ symbol: string; name: string | null; market: string | null; price: number | null }> }>;
      return lists.flatMap((l) => l.items || []);
    } catch { return []; }
  }, []);

  const portfolioSymbols = useMemo(() => {
    const syms: Array<{ symbol: string; name: string; currency: string; qty: number; type: string }> = [];
    for (const { snapshot: snap } of allSnapshots) {
      for (const s of snap.stocks) {
        syms.push({ symbol: s.symbol, name: s.name, currency: s.currency || 'SAR', qty: s.qty, type: 'stock' });
      }
      for (const f of snap.funds) {
        syms.push({ symbol: f.symbol ?? f.name, name: f.name, currency: f.currency || 'USD', qty: f.units, type: 'fund' });
      }
      for (const b of snap.bonds) {
        syms.push({ symbol: b.symbol, name: b.name, currency: b.currency || 'SAR', qty: b.qty, type: 'bond' });
      }
    }
    return syms;
  }, [allSnapshots]);

  const dbFilteredEntries = useMemo(() => {
    const allEntries = Object.values(DIVIDEND_DATABASE);

    let base: DividendEntry[] = [];
    if (dbTab === 'upcoming') {
      base = allEntries.filter((e) => e.nextExDate && e.nextExDate >= todayISO);
    } else if (dbTab === 'saudi') {
      base = allEntries.filter((e) => e.symbol.endsWith('.SR'));
    } else if (dbTab === 'usa') {
      base = allEntries.filter((e) => !e.symbol.includes('.') && !KNOWN_ETF_SYMBOLS.has(e.symbol));
    } else if (dbTab === 'funds') {
      base = allEntries.filter((e) => KNOWN_ETF_SYMBOLS.has(e.symbol) && e.annualDiv > 0);
    } else if (dbTab === 'portfolios') {
      base = portfolioDivData;
    } else if (dbTab === 'watchlist') {
      base = watchlistDivData;
    }

    if (dbSearch.trim()) {
      const q = dbSearch.toLowerCase();
      base = base.filter(
        (e) => e.symbol.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
      );
    }

    return base;
  }, [dbTab, dbSearch, todayISO, KNOWN_ETF_SYMBOLS, portfolioDivData, watchlistDivData]);

  const dbLiveFiltered = useMemo(() => {
    if (dbSearch.trim()) {
      const q = dbSearch.toLowerCase();
      return dbLiveData.filter(
        (e) => e.symbol.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
      );
    }
    return dbLiveData;
  }, [dbLiveData, dbSearch]);

  const handleDbRefresh = async () => {
    setDbLiveLoading(true);
    try {
      const symbols = dbFilteredEntries.map((e) => e.symbol).slice(0, 20).join(',');
      const res = await fetch(`/api/dividends?mode=live&symbols=${encodeURIComponent(symbols)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDbLiveData(data.data);
        toast({ title: 'تم التحديث', description: `تم جلب بيانات ${data.data.length} رمز مباشرة` });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل جلب البيانات المباشرة', variant: 'destructive' });
    } finally {
      setDbLiveLoading(false);
    }
  };

  const fetchPortfolioDividends = useCallback(async () => {
    if (portfolioSymbols.length === 0) return;
    setPortfolioDivLoading(true);
    try {
      const syms = [...new Set(portfolioSymbols.map((p) => p.symbol))];
      const allResults: DividendEntry[] = [];
      for (let i = 0; i < syms.length; i += 30) {
        const batch = syms.slice(i, i + 30);
        const res = await fetch(`/api/dividends?mode=live&symbols=${encodeURIComponent(batch.join(','))}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) allResults.push(...data.data);
      }
      const fetched = new Map(allResults.map((d: DividendEntry) => [d.symbol, d]));
      const merged: DividendEntry[] = [];
      for (const p of portfolioSymbols) {
        const live = fetched.get(p.symbol);
        if (live) {
          merged.push(live);
        } else {
          const local = DIVIDEND_DATABASE[p.symbol] || DIVIDEND_DATABASE[p.symbol.replace('.SR', '') as string];
          if (local) {
            merged.push(local);
          } else {
            merged.push({
              symbol: p.symbol, name: p.name, currency: p.currency, annualDiv: 0, yieldPct: 0,
              frequency: 'none', lastExDate: '', nextExDate: '', lastDivPerShare: 0,
              recentDividends: [], source: 'المحفظة',
            });
          }
        }
      }
      const unique = new Map<string, DividendEntry>();
      for (const e of merged) unique.set(e.symbol, e);
      setPortfolioDivData(Array.from(unique.values()));
    } catch {} finally {
      setPortfolioDivLoading(false);
    }
  }, [portfolioSymbols]);

  const fetchWatchlistDividends = useCallback(async () => {
    if (watchlistItems.length === 0) return;
    setWatchlistDivLoading(true);
    try {
      const syms = [...new Set(watchlistItems.map((w) => w.symbol))];
      const allResults: DividendEntry[] = [];
      for (let i = 0; i < syms.length; i += 30) {
        const batch = syms.slice(i, i + 30);
        const res = await fetch(`/api/dividends?mode=live&symbols=${encodeURIComponent(batch.join(','))}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) allResults.push(...data.data);
      }
      const fetched = new Map(allResults.map((d: DividendEntry) => [d.symbol, d]));
      const merged: DividendEntry[] = [];
      for (const w of watchlistItems) {
        const live = fetched.get(w.symbol);
        if (live) {
          merged.push(live);
        } else {
          const local = DIVIDEND_DATABASE[w.symbol];
          if (local) {
            merged.push(local);
          } else {
            merged.push({
              symbol: w.symbol, name: w.name || w.symbol, currency: 'USD', annualDiv: 0, yieldPct: 0,
              frequency: 'none', lastExDate: '', nextExDate: '', lastDivPerShare: 0,
              recentDividends: [], source: 'قائمة المتابعة',
            });
          }
        }
      }
      const unique = new Map<string, DividendEntry>();
      for (const e of merged) unique.set(e.symbol, e);
      setWatchlistDivData(Array.from(unique.values()));
    } catch {} finally {
      setWatchlistDivLoading(false);
    }
  }, [watchlistItems]);

  useEffect(() => {
    if (dbTab === 'portfolios' && portfolioDivData.length === 0 && portfolioSymbols.length > 0) {
      void fetchPortfolioDividends();
    }
  }, [dbTab, portfolioDivData.length, portfolioSymbols.length, fetchPortfolioDividends]);

  useEffect(() => {
    if (dbTab === 'watchlist' && watchlistDivData.length === 0 && watchlistItems.length > 0) {
      void fetchWatchlistDividends();
    }
  }, [dbTab, watchlistDivData.length, watchlistItems.length, fetchWatchlistDividends]);

  const dbTabLabel: Record<string, string> = {
    upcoming: `التوزيعات القادمة (${Object.values(DIVIDEND_DATABASE).filter((e) => e.nextExDate && e.nextExDate >= new Date().toISOString().split('T')[0]).length})`,
    saudi: `🇸🇦 السوق السعودي (${Object.values(DIVIDEND_DATABASE).filter((e) => e.symbol.endsWith('.SR')).length})`,
    usa: `🇺🇸 السوق الأمريكي (${Object.values(DIVIDEND_DATABASE).filter((e) => !e.symbol.includes('.')).length})`,
    funds: `🏦 الصناديق الموزعة`,
    portfolios: `💼 المحافظ (${portfolioSymbols.length})`,
    watchlist: `📋 قائمة المتابعة (${watchlistItems.length})`,
  };

  const freqArabic: Record<string, string> = {
    quarterly: 'ربع سنوي',
    'semi-annual': 'نصف سنوي',
    annual: 'سنوي',
    monthly: 'شهري',
    none: 'لا يوزع',
  };

  const getDivPerPeriod = (entry: DividendEntry): number => {
    if (entry.annualDiv <= 0) return 0;
    switch (entry.frequency) {
      case 'monthly': return entry.annualDiv / 12;
      case 'quarterly': return entry.annualDiv / 4;
      case 'semi-annual': return entry.annualDiv / 2;
      case 'annual': return entry.annualDiv;
      default: return entry.lastDivPerShare;
    }
  };

  const addDividendFromDb = (entry: DividendEntry) => {
    const existing = dividends.find((d) => d.symbol === entry.symbol);
    if (existing) {
      toast({ title: 'موجود مسبقاً', description: `${entry.symbol} موجود في التوزيعات` });
      return;
    }
    const newRecord: DividendRecord = {
      id: crypto.randomUUID(),
      symbol: entry.symbol,
      name: entry.name,
      assetType: entry.symbol.endsWith('.SR') ? 'stock' : entry.frequency === 'monthly' ? 'fund' : 'stock',
      currency: entry.currency,
      dividendPerUnit: entry.lastDivPerShare,
      totalDividend: 0,
      yieldPct: entry.yieldPct,
      exDate: entry.nextExDate || entry.lastExDate,
      payDate: entry.nextExDate || entry.lastExDate,
      status: 'upcoming',
      notes: `توزيع ${freqArabic[entry.frequency] || entry.frequency} - تلقائي من قاعدة البيانات`,
    };
    persist([newRecord, ...dividends]);
    toast({ title: 'تمت الإضافة', description: `تم إضافة ${entry.symbol}` });
  };

  const avgYield = useMemo(() => {
    const yielding = dividends.filter((d) => d.yieldPct > 0);
    if (yielding.length === 0) return 0;
    return yielding.reduce((s, d) => s + d.yieldPct, 0) / yielding.length;
  }, [dividends]);
  const distributingCount = useMemo(
    () => new Set(dividends.filter((d) => d.status !== 'none').map((d) => d.symbol)).size,
    [dividends]
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="التوزيعات" />
        <main className="p-6 space-y-6">
          {/* ---- Summary Cards ---- */}
          <Card className="border-dashed">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div>
                <p className="text-sm font-medium">عملة الملخص الموحد</p>
                <p className="text-xs text-muted-foreground">يتم تحويل كل توزيعات العملات تلقائيًا للعملة المختارة.</p>
                <p className="text-xs text-muted-foreground">أسعار التحويل استرشادية حسب إعدادات النظام.</p>
              </div>
              <div className="w-full sm:w-[260px]">
                <Select value={summaryCurrency} onValueChange={(v) => setSummaryCurrency(normalizeCurrencyCode(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر عملة العرض" />
                  </SelectTrigger>
                  <SelectContent>
                    {summaryCurrencyOptions.map((code) => (
                      <SelectItem key={`summary-currency-${code}`} value={code}>
                        {currencyLabel(code)} ({code}) - {currencyName(code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-2 text-[11px] font-extrabold text-green-600 min-w-11 text-center leading-none">
                  {currencyLabel(summaryCurrency)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي التوزيعات المستلمة (موحّد)</p>
                  <p className="text-2xl font-bold">
                    {fmtCurrencyAmount(totalPaidConverted, summaryCurrency)}
                  </p>
                  <p className="text-xs text-muted-foreground">من {paidByCurrencyRows.length} عملة</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي التوزيعات المتوقعة (موحّد)</p>
                  <p className="text-2xl font-bold">
                    {fmtCurrencyAmount(totalExpectedConverted, summaryCurrency)}
                  </p>
                  <p className="text-xs text-muted-foreground">من {upcomingByCurrencyRows.length} عملة</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">متوسط العائد النقدي</p>
                  <p className="text-2xl font-bold">{fmtNum(avgYield)}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عدد الشركات الموزعة</p>
                  <p className="text-2xl font-bold">{distributingCount} شركة</p>
                  <p className="text-xs text-muted-foreground">
                    العملات النشطة: {activeCurrenciesCount}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ---- Local Dividend Database ---- */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-5 w-5 text-blue-500" />
                  قاعدة بيانات التوزيعات ({Object.keys(DIVIDEND_DATABASE).length} رمز)
                  <Badge variant="secondary" className="text-[10px]">محلي</Badge>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (dbTab === 'portfolios') void fetchPortfolioDividends();
                    else if (dbTab === 'watchlist') void fetchWatchlistDividends();
                    else void handleDbRefresh();
                  }}
                  disabled={dbLiveLoading || portfolioDivLoading || watchlistDivLoading}
                  className="gap-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${dbLiveLoading || portfolioDivLoading || watchlistDivLoading ? 'animate-spin' : ''}`} />
                  تحديث مباشر
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* DB Tabs */}
              <div className="flex flex-wrap gap-2">
                {(['upcoming', 'saudi', 'usa', 'funds', 'portfolios', 'watchlist'] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={dbTab === tab ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDbTab(tab)}
                    className="text-xs"
                  >
                    {dbTabLabel[tab]}
                  </Button>
                ))}
              </div>

              {/* DB Search */}
              <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث في قاعدة البيانات..."
                  value={dbSearch}
                  onChange={(e) => setDbSearch(e.target.value)}
                  className="pr-9"
                />
              </div>

              {/* DB Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الرمز</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead className="text-left">النوع</TableHead>
                      <TableHead className="text-left">العملة</TableHead>
                      <TableHead className="text-left">قيمة/فترة</TableHead>
                      <TableHead className="text-left">التوزيع السنوي</TableHead>
                      <TableHead className="text-left">العائد %</TableHead>
                      <TableHead className="text-left">التكرار</TableHead>
                      <TableHead className="text-left">آخر توزيع</TableHead>
                      <TableHead className="text-left">القادم</TableHead>
                      <TableHead className="text-left">إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dbFilteredEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-muted-foreground py-6">
                          {dbTab === 'portfolios' ? 'لا توجد محافظ - أضف أسهماً في صفحة الأسهم أو الصناديق' : dbTab === 'watchlist' ? 'لا توجد عناصر - أضف أسهماً في صفحة قائمة المتابعة' : 'لا توجد بيانات'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      dbFilteredEntries.slice(0, 300).map((entry) => {
                        const periodAmount = getDivPerPeriod(entry);
                        return (
                          <TableRow key={entry.symbol}>
                            <TableCell className="font-medium">{entry.symbol}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{entry.name}</TableCell>
                            <TableCell className="text-left">
                              <Badge variant={KNOWN_ETF_SYMBOLS.has(entry.symbol) ? 'secondary' : 'outline'} className="text-[9px]">
                                {KNOWN_ETF_SYMBOLS.has(entry.symbol) ? 'صندوق' : 'سهم'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-left">{entry.currency}</TableCell>
                            <TableCell className="text-left">
                              {periodAmount > 0 ? (
                                <span className="font-semibold text-green-600 dark:text-green-400">{periodAmount.toFixed(4)}</span>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-left">{entry.annualDiv > 0 ? entry.annualDiv : '-'}</TableCell>
                            <TableCell className="text-left">
                              {entry.yieldPct > 0 ? (
                                <Badge variant={entry.yieldPct >= 5 ? 'default' : entry.yieldPct >= 2 ? 'secondary' : 'outline'} className="text-[10px]">
                                  {fmtNum(entry.yieldPct)}%
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-left text-xs">{freqArabic[entry.frequency] || '-'}</TableCell>
                            <TableCell className="text-left text-xs">{entry.lastExDate || '-'}</TableCell>
                            <TableCell className="text-left text-xs">
                              {entry.nextExDate ? (
                                <Badge variant={entry.nextExDate >= todayISO ? 'secondary' : 'outline'} className="text-[10px]">
                                  {entry.nextExDate}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-left">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addDividendFromDb(entry)}
                                className="text-xs gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                إضافة
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Live Data Section */}
              {dbLiveData.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-medium">بيانات مباشرة ({dbLiveData.length} رمز)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الرمز</TableHead>
                          <TableHead>الاسم</TableHead>
                          <TableHead className="text-left">العملة</TableHead>
                          <TableHead className="text-left">التوزيع السنوي</TableHead>
                          <TableHead className="text-left">العائد %</TableHead>
                          <TableHead className="text-left">التكرار</TableHead>
                          <TableHead className="text-left">القادم</TableHead>
                          <TableHead className="text-left">إجراء</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dbLiveFiltered.map((entry) => (
                          <TableRow key={`live-${entry.symbol}`}>
                            <TableCell className="font-medium">{entry.symbol}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{entry.name}</TableCell>
                            <TableCell className="text-left">{entry.currency}</TableCell>
                            <TableCell className="text-left">{entry.annualDiv > 0 ? entry.annualDiv : '-'}</TableCell>
                            <TableCell className="text-left">
                              {entry.yieldPct > 0 ? `${fmtNum(entry.yieldPct)}%` : '-'}
                            </TableCell>
                            <TableCell className="text-left text-xs">{freqArabic[entry.frequency] || '-'}</TableCell>
                            <TableCell className="text-left text-xs">{entry.nextExDate || '-'}</TableCell>
                            <TableCell className="text-left">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addDividendFromDb(entry)}
                                className="text-xs gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                إضافة
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ملخص التوزيعات حسب العملة الأصلية</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">تم الصرف</p>
                {paidByCurrencyRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد توزيعات مصروفة حاليًا.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {paidByCurrencyRows.map((row) => (
                      <Badge key={`paid-${row.currency}`} variant="secondary" className="text-xs font-medium">
                        {row.currency}: {fmtCurrencyAmount(row.amount, row.currency)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">قادم</p>
                {upcomingByCurrencyRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد توزيعات قادمة حاليًا.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {upcomingByCurrencyRows.map((row) => (
                      <Badge key={`upcoming-${row.currency}`} variant="outline" className="text-xs font-medium">
                        {row.currency}: {fmtCurrencyAmount(row.amount, row.currency)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ---- Toolbar: Search + Filter + Add ---- */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالرمز أو الاسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="paid">تم الصرف</SelectItem>
                <SelectItem value="upcoming">قادم</SelectItem>
                <SelectItem value="none">لا يوجد</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={openAdd} className="gap-1">
              <Plus className="h-4 w-4" />
              إضافة توزيع
            </Button>
          </div>

          {/* ---- Dividends Table ---- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                جدول التوزيعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">جارٍ التحميل...</p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد توزيعات. اضغط &quot;إضافة توزيع&quot; لإدخال توزيع جديد.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الرمز</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>نوع الأصل</TableHead>
                        <TableHead>القطاع</TableHead>
                        <TableHead className="text-left">التوزيع/وحدة</TableHead>
                        <TableHead className="text-left">إجمالي التوزيع</TableHead>
                        <TableHead className="text-left">العائد %</TableHead>
                        <TableHead className="text-left">تاريخ الاستحقاق</TableHead>
                        <TableHead className="text-left">تاريخ الصرف</TableHead>
                        <TableHead className="text-left">الحالة</TableHead>
                        <TableHead className="text-left">العملة</TableHead>
                        <TableHead className="text-left">ملاحظات</TableHead>
                        <TableHead className="text-left">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.symbol}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{assetTypeArabic[item.assetType]}</TableCell>
                          <TableCell>{item.sector || '-'}</TableCell>
                          <TableCell className="text-left">
                            {item.dividendPerUnit > 0
                              ? fmtCurrencyAmount(item.dividendPerUnit, item.currency)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-left">
                            {item.totalDividend > 0
                              ? fmtCurrencyAmount(item.totalDividend, item.currency)
                              : '-'}
                          </TableCell>
                          <TableCell className="text-left">
                            {item.yieldPct > 0 ? `${fmtNum(item.yieldPct)}%` : '-'}
                          </TableCell>
                          <TableCell className="text-left">{item.exDate || '-'}</TableCell>
                          <TableCell className="text-left">{item.payDate || '-'}</TableCell>
                          <TableCell className="text-left">
                            <Badge
                              variant={
                                item.status === 'paid'
                                  ? 'default'
                                  : item.status === 'upcoming'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {statusArabic[item.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-left">
                            {currencyLabel(item.currency)} ({normalizeCurrencyCode(item.currency)})
                          </TableCell>
                          <TableCell className="text-left max-w-[120px] truncate">
                            {item.notes || '-'}
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(item)}
                                title="تعديل"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                                title="حذف"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---- Add / Edit Dialog ---- */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingId ? 'تعديل التوزيع' : 'إضافة توزيع جديد'}</DialogTitle>
                <DialogDescription>
                  {editingId
                    ? 'عدّل بيانات التوزيع ثم اضغط حفظ.'
                    : 'اختر السهم أو الصندوق وأدخل بيانات التوزيع.'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-2">
                {/* Symbol */}
                <div className="grid gap-2">
                  <Label>الرمز</Label>
                  {holdings.length > 0 ? (
                    <Select
                      value={selectedHoldingValue || undefined}
                      onValueChange={handleSymbolChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر من المحفظة..." />
                      </SelectTrigger>
                      <SelectContent>
                        {holdingOptions.map((h) => (
                          <SelectItem key={h.optionId} value={h.optionId}>
                            {h.symbol} - {h.name}
                            {(symbolCounts.get(h.symbol) ?? 0) > 1 && h.portfolioName ? ` (${h.portfolioName})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="أدخل الرمز"
                      value={form.symbol}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, symbol: e.target.value }))
                      }
                    />
                  )}
                </div>

                {/* Name */}
                <div className="grid gap-2">
                  <Label>الاسم</Label>
                  <Input
                    placeholder="اسم الشركة / الصندوق"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                {/* Asset type + Sector row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>نوع الأصل</Label>
                    <Select
                      value={form.assetType}
                      onValueChange={(v) =>
                        setForm((prev) => ({
                          ...prev,
                          assetType: v as DividendRecord['assetType'],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock">سهم</SelectItem>
                        <SelectItem value="fund">صندوق</SelectItem>
                        <SelectItem value="bond">سند</SelectItem>
                        <SelectItem value="sukuk">صكوك</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>القطاع</Label>
                    <Input
                      placeholder="القطاع"
                      value={form.sector ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, sector: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Dividend per unit */}
                <div className="grid gap-2">
                  <Label>مبلغ التوزيع لكل وحدة / سهم</Label>
                  <Input
                    type="number"
                    min={0}
                    step={moneyInputStep}
                    placeholder="0.00"
                    value={form.dividendPerUnit || ''}
                    onChange={(e) => handlePerUnitChange(Number(e.target.value))}
                  />
                </div>

                {/* Total dividend (auto-calculated, editable) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>إجمالي التوزيع</Label>
                    <Input
                      type="number"
                      min={0}
                      step={moneyInputStep}
                      placeholder="0.00"
                      value={form.totalDividend || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          totalDividend: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>العائد %</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      value={form.yieldPct || ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          yieldPct: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>تاريخ الاستحقاق</Label>
                    <Input
                      type="date"
                      value={form.exDate}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, exDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>تاريخ الصرف</Label>
                    <Input
                      type="date"
                      value={form.payDate}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, payDate: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Status + Currency */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>الحالة</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) =>
                        setForm((prev) => ({
                          ...prev,
                          status: v as DividendRecord['status'],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">تم الصرف</SelectItem>
                        <SelectItem value="upcoming">قادم</SelectItem>
                        <SelectItem value="none">لا يوجد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>العملة</Label>
                    <Select
                      value={normalizeCurrencyCode(form.currency)}
                      onValueChange={(v) =>
                        setForm((prev) => ({ ...prev, currency: normalizeCurrencyCode(v) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {summaryCurrencyOptions.map((code) => (
                          <SelectItem key={`form-currency-${code}`} value={code}>
                            {currencyLabel(code)} ({code}) - {currencyName(code)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                  <Label>ملاحظات</Label>
                  <Input
                    placeholder="ملاحظات اختيارية..."
                    value={form.notes ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSave}>
                  {editingId ? 'حفظ التعديلات' : 'إضافة'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
