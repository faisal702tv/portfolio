'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar, updateSidebarCounts } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { notifySuccess, notifyWarning, notifyInfo, notifyError } from '@/hooks/use-notifications';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { useLivePrices } from '@/hooks/use-live-prices';
import { fetchAllPortfoliosSnapshots, persistPortfolioSnapshot, type SnapshotBond, type SellRecord, type PortfolioSnapshot } from '@/lib/export-utils';
import { calcTradeFees, getTaxDefaults } from '@/lib/tax-settings';
import { fmtN } from '@/lib/helpers';
import { Plus, RefreshCw, Search, Trash2, Edit2, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { SymbolLookup } from '@/components/forms/SymbolLookup';
import { ShariaBadgesPanel, ShariaInlineBadge } from '@/components/ui/sharia-badges';

function normalizeSymbol(s: string) { return s.trim().toUpperCase(); }
function getPriceForBond(prices: Record<string, { price: number }>, symbol: string) {
  const n = normalizeSymbol(symbol);
  return prices[`FUND_${n}`]?.price ?? prices[n]?.price ?? prices[n.replace('.', '_')]?.price ?? null;
}
const todayStr = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
  symbol: '', name: '', type: 'sukuk', exchange: '', qty: '', buyPrice: '',
  faceValue: '', couponRate: '', maturityDate: '', buyDate: todayStr(),
  customBrok: '', customVat: '',
  shariaStatus: '', shariaBilad: '', shariaRajhi: '', shariaMaqasid: '', shariaZero: '',
});

export default function BondsPage() {
  const { toast } = useToast();
  const { snapshot, portfolios, selectedPortfolioId, setSelectedPortfolioId, loading, saving, save, reload } = usePortfolioSnapshot();
  
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

  const allBondsRaw = useMemo(() => activeSnapshots.flatMap((s) => s.bonds), [activeSnapshots]);
  const assetPortfolioMap = useMemo(() => {
    const map = new Map<string, string>();
    activeSnapshots.forEach(s => { s.bonds.forEach(b => map.set(b.id, s.portfolioName || '')); });
    return map;
  }, [activeSnapshots]);
  const assetPortfolioIdMap = useMemo(() => {
    const map = new Map<string, string>();
    activeSnapshots.forEach(s => { s.bonds.forEach(b => map.set(b.id, s.portfolioId || '')); });
    return map;
  }, [activeSnapshots]);
  const symbolsToFetch = useMemo(() => Array.from(new Set(allBondsRaw.map(s => s.symbol).filter(Boolean))), [allBondsRaw]);
  const { prices, refresh } = useLivePrices({ refreshInterval: 60000, symbols: symbolsToFetch as string[] });

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [addTargetPortfolioId, setAddTargetPortfolioId] = useState<string>(selectedPortfolioId || portfolios[0]?.id || '');
  const [editOpen, setEditOpen] = useState(false);
  const [editBond, setEditBond] = useState<SnapshotBond | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sellOpen, setSellOpen] = useState(false);
  const [sellBond, setSellBond] = useState<SnapshotBond | null>(null);
  const [sellForm, setSellForm] = useState({ qty: '', sellPrice: '', sellDate: todayStr(), customBrok: '', customVat: '' });
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<SnapshotBond | null>(null);
  const [moveTargetPortfolioId, setMoveTargetPortfolioId] = useState<string>('');

  const activePortfolio = portfolios.find((p) => p.id === (selectedPortfolioId ?? snapshot?.portfolioId));
  const { marketKey, brokeragePct, vatPct } = getTaxDefaults({ symbol: form.symbol, exchange: form.exchange, currency: form.exchange ? undefined : activePortfolio?.currency ?? snapshot?.currency });
  const qtyNum = Number(form.qty || 0);
  const buyPriceNum = Number(form.buyPrice || 0);
  const faceValueNum = Number(form.faceValue || 1000);
  const grossBuy = qtyNum * faceValueNum * (buyPriceNum / 100);
  const feeCalc = calcTradeFees({ grossAmount: grossBuy, brokeragePct, vatPct, customBrokerageAmount: form.customBrok !== '' ? Number(form.customBrok || 0) : undefined, customVatAmount: form.customVat !== '' ? Number(form.customVat || 0) : undefined });
  const brokFee = feeCalc.brokerage;
  const vatFee = feeCalc.vat;
  const totalCostWithFees = feeCalc.total;

  const bonds = allBondsRaw;
  const filtered = useMemo(() => {
    let result = bonds.filter((b) => {
      const q = search.toLowerCase();
      return b.name.toLowerCase().includes(q) || b.symbol.toLowerCase().includes(q);
    });

    if (statusFilter !== 'all') {
      result = result.filter((b) => {
        const live = getPriceForBond(prices as Record<string, { price: number }>, b.symbol) ?? b.currentPrice ?? b.buyPrice;
        const face = b.faceValue ?? 1000;
        const pl = (b.qty * face * (live / 100)) - (b.qty * face * (b.buyPrice / 100));
        if (statusFilter === 'profit') return pl >= 0;
        if (statusFilter === 'loss') return pl < 0;
        return true;
      });
    }

    if (sortFilter !== 'default') {
      result = [...result].sort((a, b) => {
        const liveA = getPriceForBond(prices as Record<string, { price: number }>, a.symbol) ?? a.currentPrice ?? a.buyPrice;
        const liveB = getPriceForBond(prices as Record<string, { price: number }>, b.symbol) ?? b.currentPrice ?? b.buyPrice;
        
        const faceA = a.faceValue ?? 1000;
        const faceB = b.faceValue ?? 1000;

        const valA = a.qty * faceA * (liveA / 100);
        const valB = b.qty * faceB * (liveB / 100);
        const plA = valA - (a.qty * faceA * (a.buyPrice / 100));
        const plB = valB - (b.qty * faceB * (b.buyPrice / 100));

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
  }, [bonds, search, statusFilter, sortFilter, prices]);

  useEffect(() => { updateSidebarCounts({ bonds: filtered.length }); }, [filtered.length]);

  const totalValue = useMemo(() => filtered.reduce((s, b) => { const l = getPriceForBond(prices as Record<string, { price: number }>, b.symbol) ?? b.currentPrice ?? b.buyPrice; const face = b.faceValue ?? 1000; return s + b.qty * face * (l / 100); }, 0), [filtered, prices]);

  const addBond = async () => {
    if (!snapshot) return;
    if (!form.symbol || !form.name || !form.qty || !form.buyPrice) { toast({ title: 'الحقول مطلوبة', description: 'أكمل بيانات الصك/السند.', variant: 'destructive' }); return; }
    const symbol = normalizeSymbol(form.symbol);
    const qty = Number(form.qty);
    const buyPrice = Number(form.buyPrice);
    const faceValue = form.faceValue ? Number(form.faceValue) : 1000;
    const livePrice = getPriceForBond(prices as Record<string, { price: number }>, symbol) ?? buyPrice;
    const basePrincipal = qty * faceValue;
    const effectiveBuyPrice = basePrincipal > 0 ? (totalCostWithFees / basePrincipal) * 100 : buyPrice;
    const nextBond: SnapshotBond = {
      id: crypto.randomUUID(), symbol, name: form.name,
      type: form.type === 'bond' ? 'bond' : 'sukuk',
      exchange: form.exchange || undefined, qty, buyPrice: effectiveBuyPrice,
      currentPrice: livePrice, faceValue, buyDate: form.buyDate || todayStr(),
      couponRate: form.couponRate ? Number(form.couponRate) : undefined,
      maturityDate: form.maturityDate || undefined,
      shariaStatus: form.shariaStatus || undefined, shariaBilad: form.shariaBilad || undefined,
      shariaRajhi: form.shariaRajhi || undefined, shariaMaqasid: form.shariaMaqasid || undefined,
      shariaZero: form.shariaZero || undefined,
    };
    const targetId = addTargetPortfolioId || selectedPortfolioId;
    if (targetId && targetId !== selectedPortfolioId) {
      const targetSnap = allSnapshots.find(s => s.portfolioId === targetId);
      if (targetSnap) {
        const updated = { ...targetSnap, bonds: [nextBond, ...targetSnap.bonds], exportedAt: new Date().toISOString() };
        await persistPortfolioSnapshot(updated, targetId);
        setAllSnapshots(prev => prev.map(s => s.portfolioId === targetId ? updated : s));
      }
    } else {
      const updated = { ...snapshot, bonds: [nextBond, ...snapshot.bonds], exportedAt: new Date().toISOString() };
      await save(updated);
      setAllSnapshots(prev => prev.map(s => s.portfolioId === selectedPortfolioId ? updated : s));
    }
    setOpen(false); setForm(emptyForm());
    const targetName = portfolios.find(p => p.id === targetId)?.name || '';
    toast({ title: 'تمت الإضافة', description: `تمت إضافة ${nextBond.symbol}${targetId !== selectedPortfolioId ? ` في ${targetName}` : ''}.` });
    notifySuccess('تمت إضافة صك/سند', `تمت إضافة ${nextBond.symbol} بنجاح`, { source: 'bonds' });
  };

  const saveEdit = async () => {
    if (!editBond) return;
    const itemPortfolioId = assetPortfolioIdMap.get(editBond.id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const updated = { ...targetSnap, bonds: targetSnap.bonds.map((b) => b.id === editBond.id ? editBond : b), exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) { await save(updated); } else { await persistPortfolioSnapshot(updated, itemPortfolioId!); }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    setEditOpen(false); setEditBond(null);
    toast({ title: 'تم التعديل', description: 'تم تحديث بيانات الصك/السند.' });
  };

  const executeSell = async () => {
    if (!sellBond) return;
    const sellQty = Number(sellForm.qty);
    const sellPrice = Number(sellForm.sellPrice);
    if (!sellQty || !sellPrice || sellQty > sellBond.qty) { toast({ title: 'خطأ', description: 'تأكد من الكمية والسعر.', variant: 'destructive' }); return; }
    const itemPortfolioId = assetPortfolioIdMap.get(sellBond.id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const face = sellBond.faceValue ?? 1000;
    const grossSell = sellQty * face * (sellPrice / 100);
    const sellTaxDefs = getTaxDefaults({ symbol: sellBond.symbol, exchange: sellBond.exchange });
    const sf = calcTradeFees({ grossAmount: grossSell, brokeragePct: sellTaxDefs.brokeragePct, vatPct: sellTaxDefs.vatPct, customBrokerageAmount: sellForm.customBrok !== '' ? Number(sellForm.customBrok || 0) : undefined, customVatAmount: sellForm.customVat !== '' ? Number(sellForm.customVat || 0) : undefined });
    const net = grossSell - sf.brokerage - sf.vat;
    const costBasis = sellQty * face * (sellBond.buyPrice / 100);
    const pl = net - costBasis;
    const plPct = costBasis > 0 ? (pl / costBasis) * 100 : 0;
    const record: SellRecord = { id: crypto.randomUUID(), symbol: sellBond.symbol, name: sellBond.name, assetType: (sellBond.type as any) || 'bond', qty: sellQty, buyPrice: sellBond.buyPrice, sellPrice, buyDate: sellBond.buyDate, sellDate: sellForm.sellDate || todayStr(), profitLoss: pl, profitLossPct: plPct, fees: sf.brokerage + sf.vat, exchange: sellBond.exchange, high52w: sellBond.high52w, low52w: sellBond.low52w };
    const remaining = sellBond.qty - sellQty;
    const nextBonds = remaining > 0 ? targetSnap.bonds.map((b) => b.id === sellBond.id ? { ...b, qty: remaining } : b) : targetSnap.bonds.filter((b) => b.id !== sellBond.id);
    const updated = { ...targetSnap, bonds: nextBonds, sellHistory: [record, ...(targetSnap.sellHistory ?? [])], exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) { await save(updated); } else { await persistPortfolioSnapshot(updated, itemPortfolioId!); }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    setSellOpen(false); setSellBond(null); setSellForm({ qty: '', sellPrice: '', sellDate: todayStr(), customBrok: '', customVat: '' });
    toast({ title: pl >= 0 ? 'تم البيع بربح' : 'تم البيع بخسارة', description: `${sellBond.symbol} × ${sellQty} = ${pl >= 0 ? '+' : ''}${pl.toFixed(2)}` });
    notifySuccess('تم بيع صك/سند', `${sellBond.symbol} × ${sellQty} بصافي ${pl >= 0 ? '+' : ''}${pl.toFixed(2)}`, { source: 'bonds' });
  };

  const removeBond = async (id: string) => {
    const itemPortfolioId = assetPortfolioIdMap.get(id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const updated = { ...targetSnap, bonds: targetSnap.bonds.filter((b) => b.id !== id), exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) { await save(updated); } else { await persistPortfolioSnapshot(updated, itemPortfolioId!); }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    toast({ title: 'تم الحذف', description: 'تم حذف الصك/السند.' });
    notifyWarning('تم حذف صك/سند', 'تم حذف الصك/السند من المحفظة', { source: 'bonds' });
  };

  const moveToPortfolio = async () => {
    if (!moveItem || !moveTargetPortfolioId) return;
    const sourcePortfolioId = assetPortfolioIdMap.get(moveItem.id) || selectedPortfolioId;
    if (!sourcePortfolioId || sourcePortfolioId === moveTargetPortfolioId) return;
    const sourceSnap = (sourcePortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === sourcePortfolioId);
    if (!sourceSnap) return;
    const updatedSource = { ...sourceSnap, bonds: sourceSnap.bonds.filter(b => b.id !== moveItem.id), exportedAt: new Date().toISOString() };
    const targetSnap = (moveTargetPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === moveTargetPortfolioId);
    if (!targetSnap) return;
    const updatedTarget = { ...targetSnap, bonds: [moveItem, ...targetSnap.bonds], exportedAt: new Date().toISOString() };
    if (sourcePortfolioId === selectedPortfolioId) { await save(updatedSource); } else { await persistPortfolioSnapshot(updatedSource, sourcePortfolioId); }
    if (moveTargetPortfolioId === selectedPortfolioId) { await save(updatedTarget); } else { await persistPortfolioSnapshot(updatedTarget, moveTargetPortfolioId); }
    setAllSnapshots(prev => prev.map(s => {
      if (s.portfolioId === sourcePortfolioId) return updatedSource;
      if (s.portfolioId === moveTargetPortfolioId) return updatedTarget;
      return s;
    }));
    setMoveOpen(false); setMoveItem(null);
    const targetName = portfolios.find(p => p.id === moveTargetPortfolioId)?.name || '';
    toast({ title: 'تم النقل', description: `تم نقل ${moveItem.symbol} إلى ${targetName}.` });
  };

  const sellTaxDefaults = sellBond ? getTaxDefaults({ symbol: sellBond.symbol, exchange: sellBond.exchange }) : { brokeragePct, vatPct };
  const sellQtyNum = Number(sellForm.qty || 0);
  const sellPriceNum = Number(sellForm.sellPrice || 0);
  const sellFace = sellBond?.faceValue ?? 1000;
  const grossSellCalc = sellQtyNum * sellFace * (sellPriceNum / 100);
  const sellFeeCalc = calcTradeFees({ grossAmount: grossSellCalc, brokeragePct: sellTaxDefaults.brokeragePct, vatPct: sellTaxDefaults.vatPct, customBrokerageAmount: sellForm.customBrok !== '' ? Number(sellForm.customBrok || 0) : undefined, customVatAmount: sellForm.customVat !== '' ? Number(sellForm.customVat || 0) : undefined });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 transition-all duration-300 lg:mr-64">
        <TopBar title="📜 الصكوك والسندات (بيانات حقيقية)" />
        <main className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">عدد الأدوات</p><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">القيمة السوقية</p><p className="text-2xl font-bold">{totalValue.toFixed(2)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">الحفظ</p><p className="text-2xl font-bold">{saving ? 'جارٍ' : 'محدث'}</p></CardContent></Card>
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
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="pr-9" />
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
              <Button variant="outline" className="gap-2" onClick={() => { void refresh(); void reload(); }}><RefreshCw className="h-4 w-4" /> تحديث</Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> إضافة صك/سند</Button></DialogTrigger>
                <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>إضافة صك/سند</DialogTitle><DialogDescription>نموذج محسن مع تسعير حي.</DialogDescription></DialogHeader>
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
                    <div><Label>بحث الرمز</Label>
                      <SymbolLookup type="stock" value={form.symbol} onChange={(next) => setForm((p) => ({ ...p, symbol: next }))}
                        onPick={(item) => { setForm((prev) => ({ ...prev, symbol: item.symbol, name: item.name || prev.name, exchange: item.exchange || prev.exchange, shariaStatus: item.shariaStatus || '', shariaBilad: item.shariaBilad || '', shariaRajhi: item.shariaRajhi || '', shariaMaqasid: item.shariaMaqasid || '', shariaZero: item.shariaZero || '' })); }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3"><div><Label>الرمز</Label><Input value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))} /></div><div><Label>الاسم</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div></div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label>النوع</Label><Input value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} placeholder="sukuk / bond" /></div>
                      <div><Label>البورصة</Label><Input value={form.exchange} onChange={(e) => setForm((p) => ({ ...p, exchange: e.target.value }))} /></div>
                      <div><Label>الكمية</Label><Input type="number" value={form.qty} onChange={(e) => setForm((p) => ({ ...p, qty: e.target.value }))} /></div>
                    </div>
                    <ShariaBadgesPanel shariaStatus={form.shariaStatus} shariaBilad={form.shariaBilad} shariaRajhi={form.shariaRajhi} shariaMaqasid={form.shariaMaqasid} shariaZero={form.shariaZero} />
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label>سعر الشراء (%)</Label><Input type="number" value={form.buyPrice} onChange={(e) => setForm((p) => ({ ...p, buyPrice: e.target.value }))} /></div>
                      <div><Label>القيمة الاسمية</Label><Input type="number" value={form.faceValue} onChange={(e) => setForm((p) => ({ ...p, faceValue: e.target.value }))} /></div>
                      <div><Label>تاريخ الشراء</Label><Input type="date" value={form.buyDate} onChange={(e) => setForm((p) => ({ ...p, buyDate: e.target.value }))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>معدل العائد %</Label><Input type="number" value={form.couponRate} onChange={(e) => setForm((p) => ({ ...p, couponRate: e.target.value }))} /></div>
                      <div><Label>تاريخ الاستحقاق</Label><Input type="date" value={form.maturityDate} onChange={(e) => setForm((p) => ({ ...p, maturityDate: e.target.value }))} /></div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold text-primary">مبالغ العمولة والضريبة</p>
                      <p className="mb-3 text-xs text-muted-foreground">إعدادات السوق: {marketKey.toUpperCase()} • عمولة {brokeragePct}% • ضريبة {vatPct}%</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>عمولة السمسرة</Label><Input type="number" value={form.customBrok} placeholder={grossBuy > 0 ? `تلقائي ${(grossBuy * (brokeragePct / 100)).toFixed(2)}` : 'مبلغ...'} onChange={(e) => setForm((p) => ({ ...p, customBrok: e.target.value }))} /></div>
                        <div><Label>ضريبة القيمة المضافة</Label><Input type="number" value={form.customVat} placeholder={brokFee > 0 ? `تلقائي ${(brokFee * (vatPct / 100)).toFixed(2)}` : 'مبلغ...'} onChange={(e) => setForm((p) => ({ ...p, customVat: e.target.value }))} /></div>
                      </div>
                      <div className="mt-3 rounded-md border bg-background p-2 text-sm">
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي الشراء</span><span>{grossBuy.toFixed(2)}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">العمولة</span><span>{brokFee.toFixed(2)}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">الضريبة</span><span>{vatFee.toFixed(2)}</span></div>
                        <div className="mt-1 flex items-center justify-between font-bold"><span>التكلفة الفعلية</span><span>{totalCostWithFees.toFixed(2)}</span></div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button><Button onClick={addBond} disabled={saving}>حفظ</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>قائمة الصكوك والسندات</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground">جاري التحميل...</p> : null}
              <div className="space-y-2">
                {filtered.map((bond) => {
                  const live = getPriceForBond(prices as Record<string, { price: number }>, bond.symbol) ?? bond.currentPrice ?? bond.buyPrice;
                  const face = bond.faceValue ?? 1000;
                  const buyValue = bond.qty * face * (bond.buyPrice / 100);
                  const currentValue = bond.qty * face * (live / 100);
                  const pl = currentValue - buyValue;
                  const bondKey = bond.symbol ? Object.keys(prices).find(k => {
                    const norm = (s: string) => s.trim().toUpperCase().replace('.', '_');
                    return norm(k) === norm(bond.symbol) || k === bond.symbol.replace('.', '_');
                  }) : undefined;
                  const live52h = (bondKey && (prices as Record<string, any>)[bondKey]?.high52w) ?? bond.high52w;
                  const live52l = (bondKey && (prices as Record<string, any>)[bondKey]?.low52w) ?? bond.low52w;
                  const pctPos = pos52w(live, live52h, live52l);
                  return (
                    <div key={bond.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        {portfolioFilter === 'all' && assetPortfolioMap.get(bond.id) && (
                          <Badge variant="secondary" className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">💼 {assetPortfolioMap.get(bond.id)}</Badge>
                        )}
                        <div className="min-w-28 font-bold">{bond.symbol}</div>
                        <div className="flex-1 min-w-40">
                          <p className="font-medium">{bond.name}</p>
                          <p className="text-xs text-muted-foreground">{[bond.type?.toUpperCase(), bond.exchange, bond.maturityDate].filter(Boolean).join(' • ')}</p>
                        </div>
                        <ShariaBadgesPanel
                          shariaStatus={bond.shariaStatus}
                          shariaBilad={bond.shariaBilad}
                          shariaRajhi={bond.shariaRajhi}
                          shariaMaqasid={bond.shariaMaqasid}
                          shariaZero={bond.shariaZero}
                        />
                        <Badge variant="outline">الكمية: {bond.qty}</Badge>
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30">سعر الشراء: {bond.buyPrice.toFixed(2)}%</Badge>
                        <Badge variant="outline">الحالي: {live.toFixed(2)}%</Badge>
                        <Badge className={pl >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{pl >= 0 ? '+' : ''}{pl.toFixed(2)}</Badge>
                        {bond.buyDate && (
                          <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/30">📅 {bond.buyDate}</Badge>
                        )}
                        {portfolios.length > 1 && (
                          <Button variant="ghost" size="icon" title="نقل لمحفظة أخرى" onClick={() => { setMoveItem(bond); setMoveTargetPortfolioId(''); setMoveOpen(true); }}>
                            <ArrowRightLeft className="h-4 w-4 text-purple-600" />
                          </Button>
                        )}
                        {!isReadOnly && (
                          <>
                            <Button variant="ghost" size="icon" title="تعديل" onClick={() => { setEditBond({ ...bond }); setEditOpen(true); }}><Edit2 className="h-4 w-4 text-blue-600" /></Button>
                            <Button variant="ghost" size="icon" title="بيع" onClick={() => { setSellBond(bond); setSellForm({ qty: String(bond.qty), sellPrice: live.toFixed(2), sellDate: todayStr(), customBrok: '', customVat: '' }); setSellOpen(true); }}><ArrowDownRight className="h-4 w-4 text-amber-600" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(bond.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                          </>
                        )}
                      </div>
                      {(live52h != null || live52l != null) && (
                        <div className="w-full" dir="ltr">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                            <span className="text-red-500 font-medium">أدنى 52w: {live52l?.toFixed(2) ?? '—'}</span>
                            {live != null && pctPos !== null && (
                              <span className="font-bold text-foreground text-xs">{live.toFixed(2)}</span>
                            )}
                            <span className="text-green-500 font-medium">أعلى 52w: {live52h?.toFixed(2) ?? '—'}</span>
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
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent dir="rtl"><DialogHeader><DialogTitle>تعديل {editBond?.symbol}</DialogTitle></DialogHeader>
          {editBond && (<div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3"><div><Label>الرمز</Label><Input value={editBond.symbol} onChange={(e) => setEditBond({ ...editBond, symbol: e.target.value })} /></div><div><Label>الاسم</Label><Input value={editBond.name} onChange={(e) => setEditBond({ ...editBond, name: e.target.value })} /></div></div>
            <div className="grid grid-cols-3 gap-3"><div><Label>الكمية</Label><Input type="number" value={editBond.qty} onChange={(e) => setEditBond({ ...editBond, qty: Number(e.target.value) })} /></div><div><Label>سعر الشراء %</Label><Input type="number" value={editBond.buyPrice} onChange={(e) => setEditBond({ ...editBond, buyPrice: Number(e.target.value) })} /></div><div><Label>تاريخ الشراء</Label><Input type="date" value={editBond.buyDate || ''} onChange={(e) => setEditBond({ ...editBond, buyDate: e.target.value })} /></div></div>
            <div className="grid grid-cols-3 gap-3"><div><Label>القيمة الاسمية</Label><Input type="number" value={editBond.faceValue || 1000} onChange={(e) => setEditBond({ ...editBond, faceValue: Number(e.target.value) })} /></div><div><Label>معدل العائد %</Label><Input type="number" value={editBond.couponRate || ''} onChange={(e) => setEditBond({ ...editBond, couponRate: Number(e.target.value) || undefined })} /></div><div><Label>تاريخ الاستحقاق</Label><Input type="date" value={editBond.maturityDate || ''} onChange={(e) => setEditBond({ ...editBond, maturityDate: e.target.value })} /></div></div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="mb-2 text-xs font-semibold text-primary">التصنيف الشرعي</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {([['shariaStatus', 'الحالة'], ['shariaBilad', 'البلاد'], ['shariaRajhi', 'الراجحي'], ['shariaMaqasid', 'المقاصد']] as const).map(([key, label]) => (
                  <div key={key}>
                    <Label className="text-xs">{label}</Label>
                    <Select value={(editBond as unknown as Record<string, string>)[key] || ''} onValueChange={(v) => setEditBond({ ...editBond, [key]: v } as typeof editBond)}>
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
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="mb-2 text-xs font-semibold text-primary">مبالغ العمولة والضريبة</p>
              <p className="mb-3 text-xs text-muted-foreground">إعدادات السوق: {marketKey.toUpperCase()} • عمولة {brokeragePct}% • ضريبة {vatPct}%</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>عمولة السمسرة</Label><Input type="number" placeholder="تلقائي" /></div>
                <div><Label>ضريبة القيمة المضافة</Label><Input type="number" placeholder="تلقائي" /></div>
              </div>
            </div>
          </div>)}
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>إلغاء</Button><Button onClick={saveEdit} disabled={saving}>حفظ التعديل</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>نقل {moveItem?.symbol} إلى محفظة أخرى</DialogTitle>
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
        <DialogContent dir="rtl"><DialogHeader><DialogTitle>بيع {sellBond?.symbol}</DialogTitle><DialogDescription>الكمية المتاحة: {sellBond?.qty}</DialogDescription></DialogHeader>
          {sellBond && (<div className="grid gap-3">
            <div className="grid grid-cols-3 gap-3"><div><Label>كمية البيع</Label><Input type="number" value={sellForm.qty} onChange={(e) => setSellForm((p) => ({ ...p, qty: e.target.value }))} /></div><div><Label>سعر البيع (%)</Label><Input type="number" value={sellForm.sellPrice} onChange={(e) => setSellForm((p) => ({ ...p, sellPrice: e.target.value }))} /></div><div><Label>تاريخ البيع</Label><Input type="date" value={sellForm.sellDate} onChange={(e) => setSellForm((p) => ({ ...p, sellDate: e.target.value }))} /></div></div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="grid grid-cols-2 gap-3"><div><Label>عمولة السمسرة</Label><Input type="number" value={sellForm.customBrok} placeholder="تلقائي" onChange={(e) => setSellForm((p) => ({ ...p, customBrok: e.target.value }))} /></div><div><Label>ضريبة القيمة المضافة</Label><Input type="number" value={sellForm.customVat} placeholder="تلقائي" onChange={(e) => setSellForm((p) => ({ ...p, customVat: e.target.value }))} /></div></div>
              <div className="mt-3 rounded-md border bg-background p-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي مبلغ البيع</span><span>{grossSellCalc.toFixed(2)}</span></div>
                <div className="flex items-center justify-between text-red-500/80"><span className="text-xs">- العمولة والضريبة</span><span>{(sellFeeCalc.brokerage + sellFeeCalc.vat).toFixed(2)}</span></div>
                {(() => { const net = grossSellCalc - sellFeeCalc.brokerage - sellFeeCalc.vat; const cb = sellQtyNum * sellFace * (sellBond.buyPrice / 100); const p = net - cb; return (
                  <>
                    <div className="my-1 border-t pt-1 flex items-center justify-between font-medium"><span className="text-muted-foreground">صافي عائد البيع</span><span>{net.toFixed(2)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي تكلفة الشراء</span><span>{cb.toFixed(2)}</span></div>
                    <div className={`mt-1 border-t pt-1 flex items-center justify-between font-bold ${p >= 0 ? 'text-green-600' : 'text-red-600'}`}><span>الربح/الخسارة الصافي</span><span>{p >= 0 ? '+' : ''}{p.toFixed(2)}</span></div>
                  </>
                ); })()}
              </div>
            </div>
          </div>)}
          <DialogFooter><Button variant="outline" onClick={() => setSellOpen(false)}>إلغاء</Button><Button onClick={executeSell} disabled={saving} className="bg-amber-600 hover:bg-amber-700">تنفيذ البيع</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا الصك/السند؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { if (deleteConfirmId) { void removeBond(deleteConfirmId); setDeleteConfirmId(null); } }}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
