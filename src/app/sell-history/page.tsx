'use client';

import { useMemo, useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  History,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  BarChart3,
  Pencil,
  Save,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import {
  fetchAllPortfoliosSnapshots,
  persistPortfolioSnapshot,
  type SellRecord,
  type PortfolioSnapshot,
} from '@/lib/export-utils';
import { resolveAssetMarket } from '@/lib/asset-market';
import { convertCurrency } from '@/lib/helpers';

interface BuyRecord {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  qty: number;
  price: number;
  total: number;
  date: string;
  exchange?: string;
  currency: string;
  editReason?: string;
  high52w?: number;
  low52w?: number;
  isSold?: boolean;
}

interface SellUiRecord extends SellRecord {
  portfolioId: string | null;
  portfolioName: string;
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: 'سهم',
  fund: 'صندوق',
  bond: 'سند',
  sukuk: 'صكوك',
  crypto: 'عملة مشفرة',
  forex: 'فوركس',
  commodity: 'سلعة',
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

function currencyLabel(code?: string | null): string {
  const normalized = normalizeCurrencyCode(code);
  return CURRENCY_META[normalized]?.symbol ?? normalized;
}

function currencyName(code?: string | null): string {
  const normalized = normalizeCurrencyCode(code);
  return CURRENCY_META[normalized]?.name ?? normalized;
}

function currencyDecimals(code?: string | null): number {
  const normalized = normalizeCurrencyCode(code);
  return CURRENCY_META[normalized]?.decimals ?? 2;
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

function mapAssetTypeToClass(assetType?: string): 'stock' | 'fund' | 'bond' | 'crypto' | 'forex' | 'commodity' {
  const type = String(assetType || '').toLowerCase();
  if (type === 'fund') return 'fund';
  if (type === 'bond' || type === 'sukuk') return 'bond';
  if (type === 'crypto') return 'crypto';
  if (type === 'forex') return 'forex';
  if (type === 'commodity') return 'commodity';
  return 'stock';
}

function detectAssetCurrency(args: {
  symbol?: string;
  exchange?: string;
  currency?: string;
  assetType?: string;
  fallback?: string;
}): string {
  const market = resolveAssetMarket({
    symbol: args.symbol,
    exchange: args.exchange,
    currency: args.currency,
    assetClass: mapAssetTypeToClass(args.assetType),
  });
  return normalizeCurrencyCode(market.currency || args.currency || args.fallback || 'SAR');
}

function convertAmount(amount: number, fromCurrency?: string, toCurrency?: string): number {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);
  return convertCurrency(safeAmount, from, to);
}

function fmtCurrencyAmount(amount: number, currency?: string): string {
  const code = normalizeCurrencyCode(currency);
  const decimals = currencyDecimals(code);
  const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${formatted} ${currencyLabel(code)}`;
}

export default function SellHistoryPage() {
  const { toast } = useToast();
  const { snapshot, portfolios } = usePortfolioSnapshot();
  const [summaryCurrency, setSummaryCurrency] = useState('SAR');
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [assetFilter, setAssetFilter] = useState('all');
  const [portfolioFilter, setPortfolioFilter] = useState('all');
  const [plFilter, setPlFilter] = useState('all'); // 'all', 'profit', 'loss'
  const [exchangeFilter, setExchangeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [allSnapshots, setAllSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingSell, setEditingSell] = useState<SellUiRecord | null>(null);
  const [editForm, setEditForm] = useState({
    sellPrice: '',
    sellDate: '',
    fees: '',
    purificationAmount: '',
    editReason: '',
  });

  useEffect(() => {
    let active = true;
    if (portfolios.length === 0) {
      setAllSnapshots(snapshot ? [snapshot] : []);
      return () => { active = false; };
    }
    fetchAllPortfoliosSnapshots(portfolios).then((snaps) => {
      if (!active) return;
      if (!snapshot) {
        setAllSnapshots(snaps);
        return;
      }
      const merged = snaps.filter((s) => s.portfolioId !== snapshot.portfolioId);
      setAllSnapshots([snapshot, ...merged]);
    });
    return () => { active = false; };
  }, [portfolios, snapshot]);

  useEffect(() => {
    if (snapshot?.currency) {
      setSummaryCurrency((prev) => (prev === 'SAR' ? normalizeCurrencyCode(snapshot.currency) : prev));
    }
  }, [snapshot?.currency]);

  const activeSnapshots = useMemo(() => {
    if (portfolioFilter === 'all') {
      return allSnapshots.length > 0 ? allSnapshots : (snapshot ? [snapshot] : []);
    }
    const match = allSnapshots.find(s => s.portfolioId === portfolioFilter);
    return match ? [match] : (snapshot ? [snapshot] : []);
  }, [portfolioFilter, snapshot, allSnapshots]);

  const filterByPeriod = <T extends { date?: string; sellDate?: string; buyDate?: string }>(items: T[]) => {
    if (period === 'all') return items;
    const now = new Date();
    const cutoff = new Date();
    switch (period) {
      case '1m': cutoff.setMonth(now.getMonth() - 1); break;
      case '3m': cutoff.setMonth(now.getMonth() - 3); break;
      case '6m': cutoff.setMonth(now.getMonth() - 6); break;
      case '1y': cutoff.setFullYear(now.getFullYear() - 1); break;
      case 'ytd': cutoff.setMonth(0, 1); break;
      default: return items;
    }
    return items.filter((t) => {
      const d = t.sellDate || t.buyDate || t.date;
      return d ? new Date(d) >= cutoff : true;
    });
  };

  // Collect unique exchanges from data for filter dropdown
  const availableExchanges = useMemo(() => {
    const exSet = new Set<string>();
    for (const snap of activeSnapshots) {
      for (const s of snap.stocks) if (s.exchange) exSet.add(s.exchange);
      for (const f of snap.funds) if (f.exchange) exSet.add(f.exchange);
      for (const b of snap.bonds) if (b.exchange) exSet.add(b.exchange);
      for (const sr of (snap.sellHistory ?? [])) if (sr.exchange) exSet.add(sr.exchange);
    }
    return Array.from(exSet).sort();
  }, [activeSnapshots]);

  // Build sell records from active snapshots
  const sells = useMemo(() => {
    let result = activeSnapshots.flatMap((snap) =>
      (snap.sellHistory ?? []).map((record) => ({
        ...record,
        portfolioId: snap.portfolioId ?? null,
        portfolioName: snap.portfolioName,
        currency: detectAssetCurrency({
          symbol: record.symbol,
          exchange: record.exchange,
          currency: record.currency,
          assetType: record.assetType,
          fallback: snap.currency,
        }),
      }))
    ) as SellUiRecord[];

    if (assetFilter !== 'all') {
      result = result.filter((r) => r.assetType === assetFilter);
    }

    if (exchangeFilter !== 'all') {
      result = result.filter((r) => r.exchange === exchangeFilter);
    }

    if (plFilter !== 'all') {
      result = result.filter((r) => {
        if (plFilter === 'profit') return (r.profitLoss || 0) >= 0;
        if (plFilter === 'loss') return (r.profitLoss || 0) < 0;
        return true;
      });
    }

    result = filterByPeriod(result.map((r) => ({ ...r, date: r.sellDate }))) as SellUiRecord[];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        r.symbol.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.sellDate).getTime() - new Date(a.sellDate).getTime();
      if (sortBy === 'pl') {
        return convertAmount((b.profitLoss || 0), b.currency, summaryCurrency)
          - convertAmount((a.profitLoss || 0), a.currency, summaryCurrency);
      }
      if (sortBy === 'total') {
        const bTotal = convertAmount((b.qty * b.sellPrice) + (b.fees || 0), b.currency, summaryCurrency);
        const aTotal = convertAmount((a.qty * a.sellPrice) + (a.fees || 0), a.currency, summaryCurrency);
        return bTotal - aTotal;
      }
      return 0;
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSnapshots, search, period, sortBy, assetFilter, exchangeFilter, plFilter, summaryCurrency]);

  const openEditDialog = (record: SellUiRecord) => {
    const sellDate = record.sellDate ? new Date(record.sellDate) : new Date();
    const sellDateValue = Number.isNaN(sellDate.getTime())
      ? ''
      : sellDate.toISOString().split('T')[0];

    setEditingSell(record);
    setEditForm({
      sellPrice: String(record.sellPrice || ''),
      sellDate: sellDateValue,
      fees: String(record.fees || 0),
      purificationAmount: String(record.purificationAmount || 0),
      editReason: record.editReason || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveSellEdit = async () => {
    if (!editingSell) return;

    const sellPrice = Number(editForm.sellPrice);
    const fees = Number(editForm.fees || 0);
    const purificationAmount = Number(editForm.purificationAmount || 0);
    const sellDate = editForm.sellDate ? new Date(editForm.sellDate) : null;

    if (!Number.isFinite(sellPrice) || sellPrice <= 0) {
      toast({ title: 'قيمة غير صالحة', description: 'سعر البيع يجب أن يكون أكبر من صفر', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(fees) || fees < 0) {
      toast({ title: 'قيمة غير صالحة', description: 'الرسوم يجب أن تكون صفر أو أكثر', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(purificationAmount) || purificationAmount < 0) {
      toast({ title: 'قيمة غير صالحة', description: 'مبلغ التطهير يجب أن يكون صفر أو أكثر', variant: 'destructive' });
      return;
    }
    if (sellDate && Number.isNaN(sellDate.getTime())) {
      toast({ title: 'تاريخ غير صالح', description: 'تحقق من تاريخ البيع', variant: 'destructive' });
      return;
    }

    const targetSnapshot = allSnapshots.find((snap) => snap.portfolioId === editingSell.portfolioId);
    if (!targetSnapshot) {
      toast({ title: 'تعذر التعديل', description: 'لم يتم العثور على المحفظة المرتبطة بهذه العملية', variant: 'destructive' });
      return;
    }

    const grossSell = editingSell.qty * sellPrice;
    const costBasis = editingSell.qty * editingSell.buyPrice;
    const netAfterFeesAndPurification = grossSell - fees - purificationAmount;
    const profitLoss = netAfterFeesAndPurification - costBasis;
    const profitLossPct = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

    const nextHistory = (targetSnapshot.sellHistory ?? []).map((record) => {
      if (record.id !== editingSell.id) return record;
      return {
        ...record,
        sellPrice,
        sellDate: sellDate ? sellDate.toISOString() : record.sellDate,
        fees,
        purificationAmount,
        profitLoss,
        profitLossPct,
        editReason: editForm.editReason.trim() || record.editReason || 'تعديل من سجل الشراء والبيع',
      };
    });

    const nextSnapshot: PortfolioSnapshot = {
      ...targetSnapshot,
      sellHistory: nextHistory,
      exportedAt: new Date().toISOString(),
    };

    setSavingEdit(true);
    try {
      const saved = await persistPortfolioSnapshot(nextSnapshot, targetSnapshot.portfolioId ?? undefined);
      if (!saved.ok) {
        toast({ title: 'فشل الحفظ', description: 'تعذر حفظ التعديل في قاعدة البيانات', variant: 'destructive' });
        return;
      }

      const serverSnapshot = saved.snapshot ?? nextSnapshot;
      setAllSnapshots((prev) =>
        prev.map((snap) => (snap.portfolioId === targetSnapshot.portfolioId ? serverSnapshot : snap))
      );

      setEditDialogOpen(false);
      setEditingSell(null);
      toast({ title: 'تم التحديث', description: 'تم تعديل عملية البيع وحفظها بنجاح' });
    } catch (error) {
      console.error('Failed to update sell record:', error);
      toast({ title: 'فشل التعديل', description: 'حدث خطأ أثناء حفظ عملية البيع', variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  // Build buy records from all current holdings + sold items
  const buys = useMemo(() => {
    if (!activeSnapshots.length) return [];
    const records: BuyRecord[] = [];

    for (const snap of activeSnapshots) {
      // Stocks
      for (const s of snap.stocks) {
        let assetType = 'stock';
        if (s.exchange === 'CRYPTO') assetType = 'crypto';
        else if (s.exchange === 'FOREX') assetType = 'forex';
        const currency = detectAssetCurrency({
          symbol: s.symbol,
          exchange: s.exchange,
          currency: s.currency,
          assetType,
          fallback: snap.currency,
        });
        records.push({
          id: s.id, symbol: s.symbol, name: s.name, assetType,
          qty: s.qty, price: s.buyPrice, total: s.qty * s.buyPrice, date: s.buyDate || '',
          currency,
          exchange: s.exchange, editReason: s.editReason, high52w: s.high52w, low52w: s.low52w, isSold: false,
        });
      }
      // Funds
      for (const f of snap.funds) {
        const assetType = f.fundType === 'commodities' ? 'commodity' : 'fund';
        const currency = detectAssetCurrency({
          symbol: f.symbol ?? f.name,
          exchange: f.exchange,
          currency: f.currency,
          assetType,
          fallback: snap.currency,
        });
        records.push({
          id: f.id, symbol: f.symbol ?? '', name: f.name, assetType,
          qty: f.units, price: f.buyPrice, total: f.units * f.buyPrice, date: f.buyDate || '',
          currency,
          exchange: f.exchange, editReason: f.editReason, high52w: f.high52w, low52w: f.low52w, isSold: false,
        });
      }
      // Bonds
      for (const b of snap.bonds) {
        const assetType = b.type === 'sukuk' ? 'sukuk' : 'bond';
        const currency = detectAssetCurrency({
          symbol: b.symbol,
          exchange: b.exchange,
          currency: b.currency,
          assetType,
          fallback: snap.currency,
        });
        records.push({
          id: b.id, symbol: b.symbol, name: b.name, assetType,
          qty: b.qty, price: b.buyPrice, total: b.qty * (b.faceValue ?? 1000) * (b.buyPrice / 100),
          currency,
          date: b.buyDate || '', exchange: b.exchange, editReason: b.editReason, isSold: false,
        });
      }
      // Sold items
      for (const sr of (snap.sellHistory ?? [])) {
        const currency = detectAssetCurrency({
          symbol: sr.symbol,
          exchange: sr.exchange,
          currency: sr.currency,
          assetType: sr.assetType,
          fallback: snap.currency,
        });
        records.push({
          id: `buy-${sr.id}`, symbol: sr.symbol, name: sr.name, assetType: sr.assetType,
          qty: sr.qty, price: sr.buyPrice, total: sr.qty * sr.buyPrice, date: sr.buyDate || '',
          currency,
          exchange: sr.exchange, editReason: sr.editReason, high52w: sr.high52w, low52w: sr.low52w, isSold: true,
        });
      }
    }

    // Filter by asset type & status
    let result = records;
    if (assetFilter !== 'all') result = result.filter((r) => r.assetType === assetFilter);
    if (statusFilter !== 'all') {
      const wantSold = statusFilter === 'sold';
      result = result.filter((r) => !!r.isSold === wantSold);
    }

    if (exchangeFilter !== 'all') {
      result = result.filter((r) => r.exchange === exchangeFilter);
    }

    // Filter by period
    result = filterByPeriod(result.map((r) => ({ ...r, buyDate: r.date }))) as BuyRecord[];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        r.symbol.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da;
      }
      if (sortBy === 'total') {
        return convertAmount(b.total, b.currency, summaryCurrency) - convertAmount(a.total, a.currency, summaryCurrency);
      }
      return 0;
    });

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSnapshots, search, period, sortBy, assetFilter, statusFilter, exchangeFilter, summaryCurrency]);

  const summaryCurrencyOptions = useMemo(() => {
    const options = new Set<string>(CURRENCY_ORDER);
    if (snapshot?.currency) options.add(normalizeCurrencyCode(snapshot.currency));
    sells.forEach((record) => options.add(normalizeCurrencyCode(record.currency)));
    buys.forEach((record) => options.add(normalizeCurrencyCode(record.currency)));
    return orderCurrencies(options);
  }, [snapshot?.currency, sells, buys]);

  // Stats (converted to summary currency)
  const totalSellProceeds = sells.reduce((sum, t) => {
    const grossWithFees = (t.qty * t.sellPrice) + (t.fees || 0);
    return sum + convertAmount(grossWithFees, t.currency, summaryCurrency);
  }, 0);
  const totalSellPL = sells.reduce((sum, t) => sum + convertAmount((t.profitLoss || 0), t.currency, summaryCurrency), 0);
  const winCount = sells.filter((t) => (t.profitLoss || 0) > 0).length;
  const winRate = sells.length > 0 ? (winCount / sells.length) * 100 : 0;
  const totalBuysCost = buys.reduce((sum, t) => sum + convertAmount(t.total, t.currency, summaryCurrency), 0);
  const totalSellFees = sells.reduce((sum, t) => sum + convertAmount((t.fees || 0), t.currency, summaryCurrency), 0);
  const totalSellPurification = sells.reduce((sum, t) => sum + convertAmount((t.purificationAmount || 0), t.currency, summaryCurrency), 0);

  const editCurrencyCode = normalizeCurrencyCode(editingSell?.currency || summaryCurrency);
  const editMoneyInputStep = currencyDecimals(editCurrencyCode) >= 3 ? '0.001' : '0.01';

  const portfolioName = snapshot?.portfolioName ?? '';

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 transition-all duration-300 lg:mr-64">
        <TopBar title="سجل الشراء والبيع" />
        <div className="p-6 space-y-6 text-right">

          {/* Portfolio Name Header */}
          {portfolioName && (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{portfolioName}</h2>
              <Badge variant="outline" className="text-xs">
                {snapshot?.currency ?? ''}
              </Badge>
            </div>
          )}

          <Card className="border-dashed">
            <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div>
                <p className="text-sm font-medium">عملة الملخص الموحد</p>
                <p className="text-xs text-muted-foreground">يتم تحويل كل عمليات الشراء والبيع للعملة المختارة.</p>
              </div>
              <div className="w-full sm:w-[280px]">
                <Select value={summaryCurrency} onValueChange={(value) => setSummaryCurrency(normalizeCurrencyCode(value))}>
                  <SelectTrigger>
                    <SelectValue />
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 text-blue-600 px-2.5 py-2 text-xs font-extrabold min-w-10 text-center">
                    {currencyLabel(summaryCurrency)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">إجمالي المبيعات (شامل الرسوم)</p>
                    <p className="text-lg font-bold">{fmtCurrencyAmount(totalSellProceeds, summaryCurrency)}</p>
                    {totalSellFees > 0 && <p className="text-[10px] text-amber-600">العمولة + الضريبة: {fmtCurrencyAmount(totalSellFees, summaryCurrency)}</p>}
                    {totalSellPurification > 0 && <p className="text-[10px] text-rose-600">مبلغ التطهير: {fmtCurrencyAmount(totalSellPurification, summaryCurrency)}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${totalSellPL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {totalSellPL >= 0
                      ? <TrendingUp className="h-5 w-5 text-green-500" />
                      : <TrendingDown className="h-5 w-5 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">أرباح/خسائر البيع</p>
                    <p className={`text-lg font-bold ${totalSellPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalSellPL >= 0 ? '+' : ''}{fmtCurrencyAmount(totalSellPL, summaryCurrency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <BarChart3 className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">نسبة الربح</p>
                    <p className="text-lg font-bold">{winRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">{winCount} من {sells.length} صفقة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-500/10 text-purple-600 px-2.5 py-2 text-xs font-extrabold min-w-10 text-center">
                    {currencyLabel(summaryCurrency)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">إجمالي المشتريات</p>
                    <p className="text-lg font-bold">{fmtCurrencyAmount(totalBuysCost, summaryCurrency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-rose-500/10 text-rose-600 px-2.5 py-2 text-xs font-extrabold min-w-10 text-center">
                    {currencyLabel(summaryCurrency)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">إجمالي مبلغ التطهير</p>
                    <p className="text-lg font-bold text-rose-600">{fmtCurrencyAmount(totalSellPurification, summaryCurrency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالرمز أو الاسم..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المحافظ</SelectItem>
                    {portfolios.map((p) => (
                      <SelectItem key={p.id} value={p.id}>📁 {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={assetFilter} onValueChange={setAssetFilter}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="h-4 w-4 ml-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأصول</SelectItem>
                    <SelectItem value="stock">الأسهم</SelectItem>
                    <SelectItem value="fund">الصناديق</SelectItem>
                    <SelectItem value="bond">السندات</SelectItem>
                    <SelectItem value="sukuk">الصكوك</SelectItem>
                    <SelectItem value="crypto">العملات المشفرة</SelectItem>
                    <SelectItem value="forex">الفوركس</SelectItem>
                    <SelectItem value="commodity">السلع والمعادن</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="retained">محتفظ</SelectItem>
                    <SelectItem value="sold">مباع</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={plFilter} onValueChange={setPlFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="profit">الرابحة ✅</SelectItem>
                    <SelectItem value="loss">الخاسرة ❌</SelectItem>
                  </SelectContent>
                </Select>
                {availableExchanges.length > 0 && (
                  <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأسواق</SelectItem>
                      {availableExchanges.map((ex) => (
                        <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[120px]">
                    <Calendar className="h-4 w-4 ml-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="1m">شهر</SelectItem>
                    <SelectItem value="3m">3 أشهر</SelectItem>
                    <SelectItem value="6m">6 أشهر</SelectItem>
                    <SelectItem value="ytd">هذا العام</SelectItem>
                    <SelectItem value="1y">سنة</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">التاريخ</SelectItem>
                    <SelectItem value="pl">الربح/الخسارة</SelectItem>
                    <SelectItem value="total">المبلغ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="sells" className="space-y-4" dir="rtl">
            <TabsList className="justify-start">
              <TabsTrigger value="sells" className="gap-2">
                <ArrowUpRight className="h-4 w-4" />
                المبيعات ({sells.length})
              </TabsTrigger>
              <TabsTrigger value="buys" className="gap-2">
                <ArrowDownRight className="h-4 w-4" />
                المشتريات ({buys.length})
              </TabsTrigger>
            </TabsList>

            {/* ===== SELLS TAB ===== */}
            <TabsContent value="sells">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto [&_th]:text-right [&_td]:text-right">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المحفظة</TableHead>
                          <TableHead>الرمز</TableHead>
                          <TableHead>الاسم</TableHead>
                          <TableHead>النوع</TableHead>
                          <TableHead>العملة</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>الشراء</TableHead>
                          <TableHead>البيع</TableHead>
                          <TableHead>أدنى 52</TableHead>
                          <TableHead>أعلى 52</TableHead>
                          <TableHead>المبلغ الإجمالي</TableHead>
                          <TableHead>العمولة + الضريبة</TableHead>
                          <TableHead>مبلغ التطهير</TableHead>
                          <TableHead>الربح/الخسارة</TableHead>
                          <TableHead>سبب التعديل</TableHead>
                          <TableHead>تاريخ الشراء</TableHead>
                          <TableHead>تاريخ البيع</TableHead>
                          <TableHead className="w-[120px]">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sells.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={18} className="text-center py-12 text-muted-foreground">
                              <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
                              <p>لا توجد عمليات بيع</p>
                              <p className="text-xs mt-1">ستظهر هنا عمليات البيع من جميع الأصول</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          sells.map((t) => {
                            const grossSell = t.qty * t.sellPrice;
                            const fees = t.fees || 0;
                            const totalWithFees = grossSell + fees;
                            return (
                              <TableRow key={t.id}>
                                <TableCell>
                                  <Badge variant="secondary" className="text-xs">{t.portfolioName}</Badge>
                                </TableCell>
                                <TableCell className="font-mono font-medium">{t.symbol}</TableCell>
                                <TableCell>{t.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {ASSET_TYPE_LABELS[t.assetType] ?? t.assetType}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="text-xs">
                                    {currencyLabel(t.currency)} ({normalizeCurrencyCode(t.currency)})
                                  </Badge>
                                </TableCell>
                                <TableCell>{t.qty.toLocaleString('en-US')}</TableCell>
                                <TableCell>{fmtCurrencyAmount(t.buyPrice, t.currency)}</TableCell>
                                <TableCell>{fmtCurrencyAmount(t.sellPrice, t.currency)}</TableCell>
                                <TableCell className="text-muted-foreground">{t.low52w != null ? fmtCurrencyAmount(t.low52w, t.currency) : '—'}</TableCell>
                                <TableCell className="text-muted-foreground">{t.high52w != null ? fmtCurrencyAmount(t.high52w, t.currency) : '—'}</TableCell>
                                <TableCell className="font-medium">{fmtCurrencyAmount(totalWithFees, t.currency)}</TableCell>
                                <TableCell className="text-amber-600 text-xs">
                                  {fees > 0 ? fmtCurrencyAmount(fees, t.currency) : '—'}
                                </TableCell>
                                <TableCell className="text-rose-600 text-xs">
                                  {(t.purificationAmount || 0) > 0 ? fmtCurrencyAmount(t.purificationAmount || 0, t.currency) : '—'}
                                </TableCell>
                                <TableCell>
                                  <span className={t.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {t.profitLoss >= 0 ? '+' : ''}{fmtCurrencyAmount(t.profitLoss, t.currency)}
                                  </span>
                                  <Badge
                                    variant={t.profitLossPct >= 0 ? 'default' : 'destructive'}
                                    className="mr-2 text-xs"
                                  >
                                    {t.profitLossPct >= 0 ? '+' : ''}{t.profitLossPct.toFixed(1)}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{t.editReason || '—'}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                  {t.buyDate ? new Date(t.buyDate).toLocaleDateString('ar-SA-u-ca-gregory') : '—'}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                  {t.sellDate ? new Date(t.sellDate).toLocaleDateString('ar-SA-u-ca-gregory') : '—'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => openEditDialog(t)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                    تعديل
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== BUYS TAB ===== */}
            <TabsContent value="buys">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto [&_th]:text-right [&_td]:text-right">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الرمز</TableHead>
                          <TableHead>الاسم</TableHead>
                          <TableHead>النوع</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>العملة</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>السعر</TableHead>
                          <TableHead>المبلغ</TableHead>
                          <TableHead>أدنى 52 أسبوع</TableHead>
                          <TableHead>أعلى 52 أسبوع</TableHead>
                          <TableHead>سبب التعديل</TableHead>
                          <TableHead>تاريخ الشراء</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buys.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                              <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
                              <p>لا توجد عمليات شراء</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          buys.map((t) => (
                            <TableRow key={t.id} className={t.isSold ? 'opacity-60' : ''}>
                              <TableCell className="font-mono font-medium">{t.symbol}</TableCell>
                              <TableCell>{t.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {ASSET_TYPE_LABELS[t.assetType] ?? t.assetType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {t.isSold ? (
                                  <Badge variant="secondary" className="text-xs">مباع</Badge>
                                ) : (
                                  <Badge variant="default" className="text-xs bg-green-600">محتفظ</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {currencyLabel(t.currency)} ({normalizeCurrencyCode(t.currency)})
                                </Badge>
                              </TableCell>
                              <TableCell>{t.qty.toLocaleString('en-US')}</TableCell>
                              <TableCell>{fmtCurrencyAmount(t.price, t.currency)}</TableCell>
                              <TableCell>{fmtCurrencyAmount(t.total, t.currency)}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {t.low52w != null ? fmtCurrencyAmount(t.low52w, t.currency) : '—'}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {t.high52w != null ? fmtCurrencyAmount(t.high52w, t.currency) : '—'}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{t.editReason || '—'}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {t.date ? new Date(t.date).toLocaleDateString('ar-SA-u-ca-gregory') : '—'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[560px]" dir="rtl">
              <DialogHeader>
                <DialogTitle>تعديل عملية البيع</DialogTitle>
              </DialogHeader>
              {editingSell && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg border bg-muted/30 text-sm">
                    <span className="font-semibold">{editingSell.symbol}</span>
                    <span className="text-muted-foreground"> • {editingSell.name}</span>
                    <span className="text-muted-foreground"> • كمية البيع: {editingSell.qty.toLocaleString('en-US')}</span>
                    <span className="text-muted-foreground"> • العملة: {currencyLabel(editingSell.currency)} ({normalizeCurrencyCode(editingSell.currency)})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>سعر البيع</Label>
                      <Input
                        type="number"
                        min="0"
                        step={editMoneyInputStep}
                        value={editForm.sellPrice}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, sellPrice: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ البيع</Label>
                      <Input
                        type="date"
                        value={editForm.sellDate}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, sellDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الرسوم (عمولة + ضريبة)</Label>
                      <Input
                        type="number"
                        min="0"
                        step={editMoneyInputStep}
                        value={editForm.fees}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, fees: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>مبلغ التطهير</Label>
                      <Input
                        type="number"
                        min="0"
                        step={editMoneyInputStep}
                        value={editForm.purificationAmount}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, purificationAmount: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>سبب التعديل</Label>
                    <Input
                      value={editForm.editReason}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, editReason: e.target.value }))}
                      placeholder="مثال: تصحيح رسوم الوساطة"
                    />
                  </div>
                </div>
              )}
              <DialogFooter className="gap-2 sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={savingEdit}
                >
                  إلغاء
                </Button>
                <Button type="button" onClick={handleSaveSellEdit} disabled={savingEdit} className="gap-2">
                  {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  حفظ التعديل
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  );
}
