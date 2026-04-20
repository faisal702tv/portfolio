'use client';

import { useMemo, useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLivePrices } from '@/hooks/use-live-prices';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { fetchAllPortfoliosSnapshots, persistPortfolioSnapshot, type SnapshotStock, type SellRecord, type PortfolioSnapshot } from '@/lib/export-utils';
import { Edit2, ArrowDownRight, Trash2, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { fmtN } from '@/lib/helpers';
import { getTaxDefaults, calcTradeFees } from '@/lib/tax-settings';

const PAIRS = [
  { symbol: 'EURUSD=X', name: 'EUR/USD', base: 'EUR', quote: 'USD' },
  { symbol: 'GBPUSD=X', name: 'GBP/USD', base: 'GBP', quote: 'USD' },
  { symbol: 'USDJPY=X', name: 'USD/JPY', base: 'USD', quote: 'JPY' },
  { symbol: 'USDCHF=X', name: 'USD/CHF', base: 'USD', quote: 'CHF' },
  { symbol: 'AUDUSD=X', name: 'AUD/USD', base: 'AUD', quote: 'USD' },
  { symbol: 'USDCAD=X', name: 'USD/CAD', base: 'USD', quote: 'CAD' },
  { symbol: 'SAR=X', name: 'USD/SAR', base: 'USD', quote: 'SAR' },
  { symbol: 'AED=X', name: 'USD/AED', base: 'USD', quote: 'AED' },
  { symbol: 'KWD=X', name: 'USD/KWD', base: 'USD', quote: 'KWD' },
  { symbol: 'QAR=X', name: 'USD/QAR', base: 'USD', quote: 'QAR' },
  { symbol: 'BHD=X', name: 'USD/BHD', base: 'USD', quote: 'BHD' },
  { symbol: 'EGP=X', name: 'USD/EGP', base: 'USD', quote: 'EGP' },
];

// Simpler symbol keys for price lookup (useLivePrices may use shorter keys)
const PRICE_KEYS: Record<string, string> = {
  'EURUSD=X': 'EURUSD',
  'GBPUSD=X': 'GBPUSD',
  'USDJPY=X': 'USDJPY',
  'USDCHF=X': 'USDCHF',
  'AUDUSD=X': 'AUDUSD',
  'USDCAD=X': 'USDCAD',
  'SAR=X': 'SAR',
  'AED=X': 'AED',
  'KWD=X': 'KWD',
  'QAR=X': 'QAR',
  'BHD=X': 'BHD',
  'EGP=X': 'EGP',
};

const todayStr = () => new Date().toISOString().split('T')[0];
const ASSET_METRIC_BADGE_CLASS = 'inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300/90 bg-background px-2.5 py-1.5 text-[13px] font-extrabold text-foreground shadow-sm dark:border-slate-700';
const ASSET_METRIC_LABEL_CLASS = 'text-[11px] font-bold text-muted-foreground';
const ACTION_BUTTON_BASE_CLASS = 'h-9 rounded-lg border-2 px-3 text-xs font-bold shadow-sm transition-colors';
const ACTION_MOVE_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300`;
const ACTION_EDIT_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300`;
const ACTION_SELL_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300`;

export default function ForexPage() {
  const { toast } = useToast();
  const { snapshot, portfolios, selectedPortfolioId, setSelectedPortfolioId, save, saving, reload } = usePortfolioSnapshot();
  
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
    if (!price || !high || !low || high <= low) return null;
    return Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100));
  };

  const isReadOnly = portfolioFilter === 'all';

  const allForexRaw = useMemo(() => activeSnapshots.flatMap((s) => s.stocks).filter((s) => s.exchange === 'FOREX'), [activeSnapshots]);
  const assetPortfolioMap = useMemo(() => {
    const map = new Map<string, string>();
    activeSnapshots.forEach(s => { s.stocks.filter(st => st.exchange === 'FOREX').forEach(st => map.set(st.id, s.portfolioName || '')); });
    return map;
  }, [activeSnapshots]);
  const assetPortfolioIdMap = useMemo(() => {
    const map = new Map<string, string>();
    activeSnapshots.forEach(s => { s.stocks.filter(st => st.exchange === 'FOREX').forEach(st => map.set(st.id, s.portfolioId || '')); });
    return map;
  }, [activeSnapshots]);
  const symbolsToFetch = useMemo(() => Array.from(new Set(allForexRaw.map(s => s.symbol).filter(Boolean))), [allForexRaw]);
  const defaultForexSymbols = useMemo(() => PAIRS.map((o) => o.symbol), []);
  const combinedSymbols = useMemo(() => Array.from(new Set([...symbolsToFetch, ...defaultForexSymbols])), [symbolsToFetch, defaultForexSymbols]);
  
  const { prices, loading, refresh, lastUpdate } = useLivePrices({ refreshInterval: 45000, symbols: combinedSymbols as string[] });

  const [buySymbol, setBuySymbol] = useState('EURUSD=X');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [buyDate, setBuyDate] = useState(todayStr());
  const [addTargetPortfolioId, setAddTargetPortfolioId] = useState<string>(selectedPortfolioId || portfolios[0]?.id || '');

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<SnapshotStock | null>(null);

  // Sell
  const [sellOpen, setSellOpen] = useState(false);
  const [sellItem, setSellItem] = useState<SnapshotStock | null>(null);
  const [sellForm, setSellForm] = useState({ qty: '', sellPrice: '', sellDate: todayStr(), customBrok: '', customVat: '' });

  // Move
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<SnapshotStock | null>(null);
  const [moveTargetPortfolioId, setMoveTargetPortfolioId] = useState<string>('');

  const getPrice = (sym: string) => {
    const key = PRICE_KEYS[sym] ?? sym;
    return prices[key]?.price ?? prices[sym]?.price ?? 0;
  };

  const live = getPrice(buySymbol);
  const amount = useMemo(() => Number(qty || 0) * Number(price || live || 0), [qty, price, live]);

  // Filter forex from stocks
  const forexHoldings = useMemo(() => {
    let result = allForexRaw;

    if (statusFilter !== 'all') {
      result = result.filter((s) => {
        const live = getPrice(s.symbol) || s.currentPrice || s.buyPrice;
        const pl = (live - s.buyPrice) * s.qty;
        if (statusFilter === 'profit') return pl >= 0;
        if (statusFilter === 'loss') return pl < 0;
        return true;
      });
    }

    if (sortFilter !== 'default') {
      result = [...result].sort((a, b) => {
        const liveA = getPrice(a.symbol) || a.currentPrice || a.buyPrice;
        const liveB = getPrice(b.symbol) || b.currentPrice || b.buyPrice;
        const valA = a.qty * liveA;
        const valB = b.qty * liveB;
        const plA = valA - (a.qty * a.buyPrice);
        const plB = valB - (b.qty * b.buyPrice);

        switch (sortFilter) {
          case 'value-desc': return valB - valA;
          case 'value-asc': return valA - valB;
          case 'pl-desc': return plB - plA;
          case 'pl-asc': return plA - plB;
          default: return 0;
        }
      });
    }

    return result;
  }, [allForexRaw, statusFilter, sortFilter, prices]);

  const buy = async () => {
    if (!snapshot) return;
    const q = Number(qty);
    const p = Number(price || live);
    if (!q || !p) {
      toast({ title: 'بيانات ناقصة', description: 'أدخل الكمية والسعر.', variant: 'destructive' });
      return;
    }

    const pair = PAIRS.find((pr) => pr.symbol === buySymbol);
    const name = pair?.name ?? buySymbol;

    const newEntry: SnapshotStock = {
      id: crypto.randomUUID(),
      symbol: buySymbol,
      name,
      exchange: 'FOREX',
      currency: pair?.quote ?? 'USD',
      qty: q,
      buyPrice: p,
      currentPrice: live || p,
      buyDate: buyDate || todayStr(),
      sector: 'Forex',
      type: 'Forex',
    };

    const targetId = addTargetPortfolioId || selectedPortfolioId;
    if (targetId && targetId !== selectedPortfolioId) {
      const targetSnap = allSnapshots.find(s => s.portfolioId === targetId);
      if (targetSnap) {
        const updated = { ...targetSnap, stocks: [newEntry, ...targetSnap.stocks], exportedAt: new Date().toISOString() };
        await persistPortfolioSnapshot(updated, targetId);
        setAllSnapshots(prev => prev.map(s => s.portfolioId === targetId ? updated : s));
      }
    } else {
      const updated = { ...snapshot, stocks: [newEntry, ...snapshot.stocks], exportedAt: new Date().toISOString() };
      await save(updated);
      setAllSnapshots(prev => prev.map(s => s.portfolioId === selectedPortfolioId ? updated : s));
    }

    setQty('');
    setPrice('');
    setBuyDate(todayStr());
    const targetName = portfolios.find(pt => pt.id === targetId)?.name || '';
    toast({ title: 'تم تنفيذ الشراء', description: `تم شراء ${q} من ${name} بسعر ${p.toFixed(6)}${targetId !== selectedPortfolioId ? ` في ${targetName}` : ''}.` });
  };

  const saveEdit = async () => {
    if (!editItem) return;
    const itemPortfolioId = assetPortfolioIdMap.get(editItem.id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const updated = { ...targetSnap, stocks: targetSnap.stocks.map((s) => (s.id === editItem.id ? editItem : s)), exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) { await save(updated); } else { await persistPortfolioSnapshot(updated, itemPortfolioId!); }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    setEditOpen(false);
    setEditItem(null);
    toast({ title: 'تم التعديل' });
  };

  const executeSell = async () => {
    if (!sellItem) return;
    const sellQty = Number(sellForm.qty);
    const sellPrice = Number(sellForm.sellPrice);
    if (!sellQty || !sellPrice || sellQty > sellItem.qty) {
      toast({ title: 'خطأ', description: 'تأكد من الكمية والسعر.', variant: 'destructive' });
      return;
    }
    const itemPortfolioId = assetPortfolioIdMap.get(sellItem.id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const grossSell = sellQty * sellPrice;
    const tradeCurrency = sellItem.currency || 'USD';
    const sellTaxDefs = getTaxDefaults({ currency: tradeCurrency, symbol: sellItem.symbol, exchange: 'FOREX' });
    const sellFees = calcTradeFees({
      grossAmount: grossSell,
      brokeragePct: sellTaxDefs.brokeragePct,
      vatPct: sellTaxDefs.vatPct,
      customBrokerageAmount: sellForm.customBrok !== '' ? Number(sellForm.customBrok || 0) : undefined,
      customVatAmount: sellForm.customVat !== '' ? Number(sellForm.customVat || 0) : undefined,
    });
    const netSellProceeds = grossSell - sellFees.brokerage - sellFees.vat;
    const costBasis = sellQty * sellItem.buyPrice;
    const pl = netSellProceeds - costBasis;
    const plPct = costBasis > 0 ? (pl / costBasis) * 100 : 0;

    const record: SellRecord = {
      id: crypto.randomUUID(), symbol: sellItem.symbol, name: sellItem.name, assetType: 'forex',
      qty: sellQty, buyPrice: sellItem.buyPrice, sellPrice, buyDate: sellItem.buyDate,
      sellDate: sellForm.sellDate || todayStr(), profitLoss: pl, profitLossPct: plPct,
      fees: sellFees.brokerage + sellFees.vat,
      currency: tradeCurrency, exchange: 'FOREX', high52w: sellItem.high52w, low52w: sellItem.low52w,
    };

    const remaining = sellItem.qty - sellQty;
    const nextStocks = remaining > 0
      ? targetSnap.stocks.map((s) => (s.id === sellItem.id ? { ...s, qty: remaining } : s))
      : targetSnap.stocks.filter((s) => s.id !== sellItem.id);

    const updated = { ...targetSnap, stocks: nextStocks, sellHistory: [record, ...(targetSnap.sellHistory ?? [])], exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) { await save(updated); } else { await persistPortfolioSnapshot(updated, itemPortfolioId!); }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));

    setSellOpen(false);
    setSellItem(null);
    setSellForm({ qty: '', sellPrice: '', sellDate: todayStr(), customBrok: '', customVat: '' });
    toast({
      title: pl >= 0 ? 'تم البيع بربح' : 'تم البيع بخسارة',
      description: `${sellItem.name} × ${sellQty} = ${pl >= 0 ? '+' : ''}${fmtN(pl)} ${tradeCurrency}`,
    });
  };

  const removeItem = async (id: string) => {
    const itemPortfolioId = assetPortfolioIdMap.get(id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const updated = { ...targetSnap, stocks: targetSnap.stocks.filter((s) => s.id !== id), exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) { await save(updated); } else { await persistPortfolioSnapshot(updated, itemPortfolioId!); }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    toast({ title: 'تم الحذف' });
  };

  const moveToPortfolio = async () => {
    if (!moveItem || !moveTargetPortfolioId) return;
    const sourcePortfolioId = assetPortfolioIdMap.get(moveItem.id) || selectedPortfolioId;
    if (!sourcePortfolioId || sourcePortfolioId === moveTargetPortfolioId) return;
    const sourceSnap = (sourcePortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === sourcePortfolioId);
    if (!sourceSnap) return;
    const updatedSource = { ...sourceSnap, stocks: sourceSnap.stocks.filter(s => s.id !== moveItem.id), exportedAt: new Date().toISOString() };
    const targetSnap = (moveTargetPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === moveTargetPortfolioId);
    if (!targetSnap) return;
    const updatedTarget = { ...targetSnap, stocks: [moveItem, ...targetSnap.stocks], exportedAt: new Date().toISOString() };
    if (sourcePortfolioId === selectedPortfolioId) { await save(updatedSource); } else { await persistPortfolioSnapshot(updatedSource, sourcePortfolioId); }
    if (moveTargetPortfolioId === selectedPortfolioId) { await save(updatedTarget); } else { await persistPortfolioSnapshot(updatedTarget, moveTargetPortfolioId); }
    setAllSnapshots(prev => prev.map(s => {
      if (s.portfolioId === sourcePortfolioId) return updatedSource;
      if (s.portfolioId === moveTargetPortfolioId) return updatedTarget;
      return s;
    }));
    setMoveOpen(false); setMoveItem(null);
    const targetName = portfolios.find(p => p.id === moveTargetPortfolioId)?.name || '';
    toast({ title: 'تم النقل', description: `تم نقل ${moveItem.name} إلى ${targetName}.` });
  };

  const sellCurrency = sellItem?.currency || 'USD';
  const sellTaxDefaults = getTaxDefaults({ currency: sellCurrency, symbol: sellItem?.symbol, exchange: 'FOREX' });
  const sellQtyNum = Number(sellForm.qty || 0);
  const sellPriceNum = Number(sellForm.sellPrice || 0);
  const grossSellCalc = sellQtyNum * sellPriceNum;
  const sellFeeCalc = calcTradeFees({
    grossAmount: grossSellCalc,
    brokeragePct: sellTaxDefaults.brokeragePct,
    vatPct: sellTaxDefaults.vatPct,
    customBrokerageAmount: sellForm.customBrok !== '' ? Number(sellForm.customBrok || 0) : undefined,
    customVatAmount: sellForm.customVat !== '' ? Number(sellForm.customVat || 0) : undefined,
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 transition-all duration-300 lg:mr-64">
        <TopBar title="💱 سوق العملات - شراء وبيع" />
        <main className="space-y-6 p-6">
          {/* ── Top Filters ── */}
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
            </CardContent>
          </Card>

          {/* Live Prices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>أسعار أزواج الفوركس الحية</CardTitle>
                <div className="flex items-center gap-2">
                  {lastUpdate ? <Badge variant="outline">آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}</Badge> : null}
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => void refresh()}>
                    <RefreshCw className="h-3 w-3" /> تحديث
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground">جاري تحميل الأسعار...</p> : null}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {PAIRS.map((pair) => {
                  const p = getPrice(pair.symbol);
                  const key = PRICE_KEYS[pair.symbol] ?? pair.symbol;
                  const changePct = prices[key]?.changePct ?? prices[pair.symbol]?.changePct ?? 0;
                  const up = changePct >= 0;
                  return (
                    <div key={pair.symbol} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="min-w-20 font-bold">{pair.name}</div>
                      <div className="flex-1" />
                      <Badge variant="outline">{p ? p.toLocaleString('en-US', { maximumFractionDigits: 6 }) : '—'}</Badge>
                      <Badge className={up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {p ? `${up ? '+' : ''}${changePct.toFixed(2)}%` : '—'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Buy Form */}
          <Card className="max-w-2xl">
            <CardHeader><CardTitle>أمر شراء جديد</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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
                <Label>زوج العملة</Label>
                <Select value={buySymbol} onValueChange={setBuySymbol}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAIRS.map((p) => <SelectItem key={p.symbol} value={p.symbol}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>الكمية (Lots)</Label><Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
                <div><Label>سعر التنفيذ</Label><Input type="number" step="0.000001" placeholder={live ? live.toFixed(6) : '0'} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                <div><Label>تاريخ الشراء</Label><Input type="date" value={buyDate} onChange={(e) => setBuyDate(e.target.value)} /></div>
              </div>
              <p className="text-sm text-muted-foreground">السعر الحي: {live ? live.toLocaleString('en-US', { maximumFractionDigits: 6 }) : 'غير متاح'}</p>
              <p className="text-lg font-bold">إجمالي الصفقة: {amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}</p>
              <Button onClick={() => void buy()} disabled={saving} className="w-full">تنفيذ الشراء</Button>
            </CardContent>
          </Card>

          {/* Holdings */}
          {forexHoldings.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>محفظة الفوركس ({forexHoldings.length})</CardTitle>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => { void refresh(); void reload(); }}>
                    <RefreshCw className="h-3 w-3" /> تحديث
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {forexHoldings.map((item) => {
                    const liveP = getPrice(item.symbol) || item.currentPrice || item.buyPrice;
                    const cost = item.qty * item.buyPrice;
                    const value = item.qty * liveP;
                    const pl = value - cost;
                    const fxKey = Object.keys(prices).find(k => {
                      const norm = (s: string) => s.trim().toUpperCase().replace('.', '_');
                      return norm(k) === norm(item.symbol) || k === item.symbol.replace('.', '_');
                    });
                    const live52h = (fxKey && (prices as Record<string, any>)[fxKey]?.high52w) ?? item.high52w;
                    const live52l = (fxKey && (prices as Record<string, any>)[fxKey]?.low52w) ?? item.low52w;
                    const pctPos = pos52w(liveP, live52h, live52l);
                    return (
                      <div key={item.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          {portfolioFilter === 'all' && assetPortfolioMap.get(item.id) && (
                            <Badge variant="secondary" className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">💼 {assetPortfolioMap.get(item.id)}</Badge>
                          )}
                          <div className="min-w-24 font-bold">{item.name}</div>
                          <div className="flex-1 min-w-32" />
                          <Badge variant="outline" className={ASSET_METRIC_BADGE_CLASS}>
                            <span className={ASSET_METRIC_LABEL_CLASS}>الكمية:</span>
                            <span>{item.qty}</span>
                          </Badge>
                          <Badge variant="outline" className={`${ASSET_METRIC_BADGE_CLASS} bg-blue-50/80 dark:bg-blue-950/30`}>
                            <span className={ASSET_METRIC_LABEL_CLASS}>سعر الشراء:</span>
                            <span>{item.buyPrice.toFixed(6)}</span>
                          </Badge>
                          <Badge variant="outline" className={ASSET_METRIC_BADGE_CLASS}>
                            <span className={ASSET_METRIC_LABEL_CLASS}>الحالي:</span>
                            <span>{liveP.toFixed(6)}</span>
                          </Badge>
                          <Badge className={`rounded-lg border-2 px-3 py-1.5 text-[13px] font-extrabold shadow-sm ${pl >= 0 ? 'border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300' : 'border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'}`}>
                            <span className="text-[11px] font-bold opacity-80">الربح/الخسارة:</span>
                            <span>{pl >= 0 ? '+' : ''}{pl.toFixed(4)}</span>
                          </Badge>
                          {item.buyDate && (
                            <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/30">📅 {item.buyDate}</Badge>
                          )}
                          {portfolios.length > 1 && (
                            <Button variant="outline" size="sm" className={ACTION_MOVE_BUTTON_CLASS} title="نقل لمحفظة أخرى" onClick={() => { setMoveItem(item); setMoveTargetPortfolioId(''); setMoveOpen(true); }}>
                              <ArrowRightLeft className="h-4 w-4" />
                              <span>نقل</span>
                            </Button>
                          )}
                          <>
                            <Button variant="outline" size="sm" className={ACTION_EDIT_BUTTON_CLASS} title="تعديل" onClick={() => { setEditItem({ ...item }); setEditOpen(true); }}>
                              <Edit2 className="h-4 w-4" />
                              <span>تعديل</span>
                            </Button>
                            <Button variant="outline" size="sm" className={ACTION_SELL_BUTTON_CLASS} title="بيع" onClick={() => { setSellItem(item); setSellForm({ qty: String(item.qty), sellPrice: (getPrice(item.symbol) || item.currentPrice || item.buyPrice).toFixed(6), sellDate: todayStr(), customBrok: '', customVat: '' }); setSellOpen(true); }}>
                              <ArrowDownRight className="h-4 w-4" />
                              <span>بيع</span>
                            </Button>
                            {!isReadOnly && (
                              <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(item.id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </>
                        </div>
                        {/* 52-Week Range Bar */}
                        {(live52h != null || live52l != null) && (
                          <div className="w-full" dir="ltr">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                              <span className="text-red-500 font-medium">أدنى 52w: {live52l?.toFixed(6) ?? '—'}</span>
                              {liveP != null && pctPos !== null && (
                                <span className="font-bold text-foreground text-xs">{liveP.toFixed(6)}</span>
                              )}
                              <span className="text-green-500 font-medium">أعلى 52w: {live52h?.toFixed(6) ?? '—'}</span>
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
                        )}
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
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تعديل {editItem?.name}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الزوج</Label><Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} /></div>
                <div><Label>الرمز</Label><Input value={editItem.symbol} onChange={(e) => setEditItem({ ...editItem, symbol: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>الكمية</Label><Input type="number" value={editItem.qty} onChange={(e) => setEditItem({ ...editItem, qty: Number(e.target.value) })} /></div>
                <div><Label>سعر الشراء</Label><Input type="number" step="0.000001" value={editItem.buyPrice} onChange={(e) => setEditItem({ ...editItem, buyPrice: Number(e.target.value) })} /></div>
                <div><Label>تاريخ الشراء</Label><Input type="date" value={editItem.buyDate || ''} onChange={(e) => setEditItem({ ...editItem, buyDate: e.target.value })} /></div>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold text-primary">التصنيف الشرعي</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {([['shariaStatus', 'الحالة'], ['shariaBilad', 'البلاد'], ['shariaRajhi', 'الراجحي'], ['shariaMaqasid', 'المقاصد']] as const).map(([key, label]) => (
                    <div key={key}>
                      <Label className="text-xs">{label}</Label>
                      <Select value={(editItem as unknown as Record<string, string>)[key] || ''} onValueChange={(v) => setEditItem({ ...editItem!, [key]: v } as typeof editItem)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="حلال">حلال</SelectItem>
                          <SelectItem value="نقي">نقي</SelectItem>
                          <SelectItem value="مختلط">مختلط</SelectItem>
                          <SelectItem value="غير متوافق">غير متوافق</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>إلغاء</Button><Button onClick={saveEdit} disabled={saving}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>نقل {moveItem?.name} إلى محفظة أخرى</DialogTitle>
            <DialogDescription>اختر المحفظة المراد النقل إليها</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Select value={moveTargetPortfolioId} onValueChange={setMoveTargetPortfolioId}>
              <SelectTrigger><SelectValue placeholder="اختر المحفظة" /></SelectTrigger>
              <SelectContent>
                {portfolios.filter(p => p.id !== (assetPortfolioIdMap.get(moveItem?.id || '') || selectedPortfolioId)).map((p) => (
                  <SelectItem key={p.id} value={p.id}>📁 {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>إلغاء</Button>
            <Button onClick={moveToPortfolio} disabled={!moveTargetPortfolioId || saving} className="bg-purple-600 hover:bg-purple-700">نقل</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell Dialog */}
      <Dialog open={sellOpen} onOpenChange={setSellOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>بيع {sellItem?.name}</DialogTitle><DialogDescription>الكمية المتاحة: {sellItem?.qty}</DialogDescription></DialogHeader>
          {sellItem && (
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>كمية البيع</Label><Input type="number" value={sellForm.qty} onChange={(e) => setSellForm((p) => ({ ...p, qty: e.target.value }))} /></div>
                <div><Label>سعر البيع</Label><Input type="number" step="0.000001" value={sellForm.sellPrice} onChange={(e) => setSellForm((p) => ({ ...p, sellPrice: e.target.value }))} /></div>
                <div><Label>تاريخ البيع</Label><Input type="date" value={sellForm.sellDate} onChange={(e) => setSellForm((p) => ({ ...p, sellDate: e.target.value }))} /></div>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold text-primary">مبالغ العمولة والضريبة</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>عمولة السمسرة ({sellCurrency})</Label><Input type="number" value={sellForm.customBrok} placeholder={grossSellCalc > 0 ? `تلقائي ${(grossSellCalc * (sellTaxDefaults.brokeragePct / 100)).toFixed(2)}` : 'مبلغ...'} onChange={(e) => setSellForm((p) => ({ ...p, customBrok: e.target.value }))} /></div>
                  <div><Label>ضريبة القيمة المضافة ({sellCurrency})</Label><Input type="number" value={sellForm.customVat} placeholder={sellFeeCalc.brokerage > 0 ? `تلقائي ${(sellFeeCalc.brokerage * (sellTaxDefaults.vatPct / 100)).toFixed(2)}` : 'مبلغ...'} onChange={(e) => setSellForm((p) => ({ ...p, customVat: e.target.value }))} /></div>
                </div>
                <div className="mt-3 rounded-md border bg-background p-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي مبلغ البيع</span><span>{fmtN(grossSellCalc)} {sellCurrency}</span></div>
                  <div className="flex items-center justify-between text-red-500/80"><span className="text-xs">- العمولة</span><span>{fmtN(sellFeeCalc.brokerage)} {sellCurrency}</span></div>
                  <div className="flex items-center justify-between text-red-500/80"><span className="text-xs">- الضريبة</span><span>{fmtN(sellFeeCalc.vat)} {sellCurrency}</span></div>
                  {(() => {
                    const net = grossSellCalc - sellFeeCalc.brokerage - sellFeeCalc.vat;
                    const costB = sellQtyNum * sellItem.buyPrice;
                    const plCalc = net - costB;
                    return (
                      <>
                        <div className="my-1 border-t pt-1 flex items-center justify-between font-medium"><span className="text-muted-foreground">صافي عائد البيع</span><span>{fmtN(net)} {sellCurrency}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي تكلفة الشراء</span><span>{fmtN(costB)} ({fmtN(sellItem.buyPrice, 6)})</span></div>
                        <div className={`mt-1 border-t pt-1 flex items-center justify-between font-bold ${plCalc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <span>الربح/الخسارة الصافي</span><span>{plCalc >= 0 ? '+' : ''}{fmtN(plCalc)} {sellCurrency}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setSellOpen(false)}>إلغاء</Button><Button onClick={executeSell} disabled={saving} className="bg-amber-600 hover:bg-amber-700">تنفيذ البيع</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا الزوج؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { if (deleteConfirmId) { void removeItem(deleteConfirmId); setDeleteConfirmId(null); } }}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
