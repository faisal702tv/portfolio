'use client';

import { useMemo, useState, useEffect } from 'react';
import { Sidebar, updateSidebarCounts } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLivePrices } from '@/hooks/use-live-prices';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { fetchAllPortfoliosSnapshots, persistPortfolioSnapshot, type SnapshotFund, type SellRecord, type PortfolioSnapshot } from '@/lib/export-utils';
import { commoditiesData } from '@/data/markets';
import {
  Edit2, ArrowDownRight, Trash2, RefreshCw, ShoppingCart,
  TrendingUp, TrendingDown, ArrowRightLeft,
} from 'lucide-react';
import { fmtN } from '@/lib/helpers';
import { getTaxDefaults, calcTradeFees } from '@/lib/tax-settings';

/* ──────────────────── Types ──────────────────── */

type CommodityItem = {
  symbol: string;
  name: string;
  nameEn: string;
  price: number;
  change: number;
  changePct: number;
  unit: string;
  icon: string;
  category: string;
};

/* ──────────────────── Constants ──────────────────── */

const COMMODITY_YAHOO_MAP: Record<string, string> = {
  'الذهب': 'GC=F', 'Gold': 'GC=F', 'GOLD': 'GC=F', 'XAU': 'GC=F',
  'الفضة': 'SI=F', 'Silver': 'SI=F', 'SILVER': 'SI=F', 'XAG': 'SI=F',
  'البلاتين': 'PL=F', 'Platinum': 'PL=F', 'XPT': 'PL=F',
  'البلاديوم': 'PA=F', 'Palladium': 'PA=F', 'XPD': 'PA=F',
  'نفط WTI': 'CL=F', 'Crude Oil WTI': 'CL=F', 'WTI': 'CL=F', 'CL': 'CL=F',
  'نفط برنت': 'BZ=F', 'Brent Crude': 'BZ=F', 'BRENT': 'BZ=F', 'BR': 'BZ=F',
  'الغاز الطبيعي': 'NG=F', 'Natural Gas': 'NG=F', 'NGAS': 'NG=F', 'NG': 'NG=F',
  'النحاس': 'HG=F', 'Copper': 'HG=F', 'COPPER': 'HG=F', 'HG': 'HG=F',
  'القمح': 'ZW=F', 'Wheat': 'ZW=F', 'WHEAT': 'ZW=F', 'ZW': 'ZW=F',
  'الذرة': 'ZC=F', 'Corn': 'ZC=F', 'CORN': 'ZC=F', 'ZC': 'ZC=F',
  'فول الصويا': 'ZS=F', 'Soybeans': 'ZS=F', 'SOYB': 'ZS=F', 'ZS': 'ZS=F',
  'القهوة': 'KC=F', 'Coffee': 'KC=F', 'COFFEE': 'KC=F', 'KC': 'KC=F',
  'القطن': 'CT=F', 'Cotton': 'CT=F', 'COTTON': 'CT=F', 'CT': 'CT=F',
  'السكر': 'SB=F', 'Sugar': 'SB=F', 'SUGAR': 'SB=F', 'SB': 'SB=F',
  'الكاكاو': 'CC=F', 'Cocoa': 'CC=F', 'COCOA': 'CC=F', 'CC': 'CC=F',
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  precious: { label: 'المعادن الثمينة', icon: '🥇', color: 'from-amber-500 to-yellow-600' },
  industrial: { label: 'المعادن الصناعية', icon: '⚙️', color: 'from-gray-500 to-slate-600' },
  energy: { label: 'الطاقة', icon: '🛢️', color: 'from-red-500 to-orange-600' },
  agriculture: { label: 'المنتجات الزراعية', icon: '🌾', color: 'from-green-500 to-emerald-600' },
  livestock: { label: 'الماشية', icon: '🐄', color: 'from-amber-600 to-amber-700' },
};

const BUY_OPTIONS = [
  { symbol: 'GC=F', name: 'الذهب (Gold)' },
  { symbol: 'SI=F', name: 'الفضة (Silver)' },
  { symbol: 'CL=F', name: 'نفط WTI' },
  { symbol: 'BZ=F', name: 'نفط برنت' },
  { symbol: 'NG=F', name: 'الغاز الطبيعي' },
  { symbol: 'PL=F', name: 'البلاتين' },
  { symbol: 'PA=F', name: 'البلاديوم' },
  { symbol: 'HG=F', name: 'النحاس' },
  { symbol: 'ZC=F', name: 'الذرة' },
  { symbol: 'ZW=F', name: 'القمح' },
  { symbol: 'ZS=F', name: 'فول الصويا' },
  { symbol: 'KC=F', name: 'القهوة' },
];

const todayStr = () => new Date().toISOString().split('T')[0];
const ASSET_METRIC_BADGE_CLASS = 'inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300/90 bg-background px-2.5 py-1.5 text-[13px] font-extrabold text-foreground shadow-sm dark:border-slate-700';
const ASSET_METRIC_LABEL_CLASS = 'text-[11px] font-bold text-muted-foreground';
const ACTION_BUTTON_BASE_CLASS = 'h-9 rounded-lg border-2 px-3 text-xs font-bold shadow-sm transition-colors';
const ACTION_MOVE_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300`;
const ACTION_EDIT_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300`;
const ACTION_SELL_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300`;

/* ──────────────────── Commodity Price Card ──────────────────── */

function CommodityCard({ item, livePrice }: { item: CommodityItem; livePrice?: { price: number; changePct: number } }) {
  const price = livePrice?.price ?? item.price;
  const changePct = livePrice?.changePct ?? item.changePct;
  const change = livePrice ? (price * changePct / 100) : item.change;
  const up = changePct >= 0;

  return (
    <div className="flex items-center gap-3 rounded-xl border p-4 hover:bg-muted/50 transition-colors">
      <span className="text-2xl">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm">{item.name}</p>
        <p className="text-[11px] text-muted-foreground">{item.nameEn} · {item.unit}</p>
      </div>
      <div className="text-left">
        <p className="font-mono font-bold text-sm">${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
        <div className={`flex items-center gap-1 text-xs font-bold ${up ? 'text-green-600' : 'text-red-600'}`}>
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{up ? '+' : ''}{change.toFixed(2)}</span>
          <span>({up ? '+' : ''}{changePct.toFixed(2)}%)</span>
        </div>
      </div>
      {livePrice && <Badge variant="outline" className="text-[9px] h-5">LIVE</Badge>}
    </div>
  );
}

/* ──────────────────── Main Page ──────────────────── */

export default function CommoditiesPage() {
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

  const allCommoditiesRaw = useMemo(() => activeSnapshots.flatMap((s) => s.funds).filter((f) => f.fundType === 'commodities'), [activeSnapshots]);
  const assetPortfolioMap = useMemo(() => {
    const map = new Map<string, string>();
    activeSnapshots.forEach(s => { s.funds.filter(f => f.fundType === 'commodities').forEach(f => map.set(f.id, s.portfolioName || '')); });
    return map;
  }, [activeSnapshots]);
  const assetPortfolioIdMap = useMemo(() => {
    const map = new Map<string, string>();
    activeSnapshots.forEach(s => { s.funds.filter(f => f.fundType === 'commodities').forEach(f => map.set(f.id, s.portfolioId || '')); });
    return map;
  }, [activeSnapshots]);
  const symbolsToFetch = useMemo(() => Array.from(new Set(allCommoditiesRaw.map(s => s.symbol).filter(Boolean))), [allCommoditiesRaw]);

  // Combine fetched symbols plus known symbols we display
  const standardCommoditySymbols = useMemo(() => [
    ...BUY_OPTIONS.map(o => o.symbol),
    ...Object.values(COMMODITY_YAHOO_MAP)
  ], []);
  const combinedSymbols = useMemo(() => Array.from(new Set([...symbolsToFetch, ...standardCommoditySymbols])), [symbolsToFetch, standardCommoditySymbols]);

  const { prices, loading, refresh, lastUpdate } = useLivePrices({ refreshInterval: 45000, symbols: combinedSymbols as string[] });
  const [fallbackQuotes, setFallbackQuotes] = useState<Record<string, { price: number; changePct: number }>>({});

  useEffect(() => {
    let isMounted = true;
    async function fetchFallbacks() {
      let savedKeys: any = {};
      try { savedKeys = JSON.parse(localStorage.getItem('api_keys') || '{}'); } catch (e) { }
      const quotes: Record<string, any> = {};

      try {
        const bRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT');
        if (bRes.ok) {
          const d = await bRes.json();
          quotes['GC=F'] = { price: parseFloat(d.lastPrice), changePct: parseFloat(d.priceChangePercent) };
        }
      } catch (e) { }

      if (savedKeys.financial_modeling_prep) {
        try {
          const fRes = await fetch(`https://financialmodelingprep.com/api/v3/quote/GC=F,SI=F,CL=F,BZ=F,NG=F?apikey=${savedKeys.financial_modeling_prep}`);
          if (fRes.ok) {
            const data = await fRes.json();
            data.forEach((item: any) => { quotes[item.symbol] = { price: item.price, changePct: item.changesPercentage }; });
          }
        } catch (e) { }
      }
      if (savedKeys.twelve_data && !quotes['CL=F']) {
        try {
          const tRes = await fetch(`https://api.twelvedata.com/quote?symbol=XAU/USD,XAG/USD,WTI/USD,BRENT/USD&apikey=${savedKeys.twelve_data}`);
          if (tRes.ok) {
            const d = await tRes.json();
            if (d['XAU/USD']) quotes['GC=F'] = { price: parseFloat(d['XAU/USD'].close), changePct: parseFloat(d['XAU/USD'].percent_change) };
            if (d['XAG/USD']) quotes['SI=F'] = { price: parseFloat(d['XAG/USD'].close), changePct: parseFloat(d['XAG/USD'].percent_change) };
            if (d['WTI/USD']) quotes['CL=F'] = { price: parseFloat(d['WTI/USD'].close), changePct: parseFloat(d['WTI/USD'].percent_change) };
            if (d['BRENT/USD']) quotes['BZ=F'] = { price: parseFloat(d['BRENT/USD'].close), changePct: parseFloat(d['BRENT/USD'].percent_change) };
          }
        } catch (e) { }
      }
      if (isMounted) setFallbackQuotes(quotes);
    }
    fetchFallbacks();
    const interval = setInterval(fetchFallbacks, 45000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // Buy form state
  const [symbol, setSymbol] = useState('GC=F');
  const [units, setUnits] = useState('');
  const [price, setPrice] = useState('');
  const [buyDate, setBuyDate] = useState(todayStr());
  const [addTargetPortfolioId, setAddTargetPortfolioId] = useState<string>(selectedPortfolioId || portfolios[0]?.id || '');

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<SnapshotFund | null>(null);

  // Sell dialog
  const [sellOpen, setSellOpen] = useState(false);
  const [sellItem, setSellItem] = useState<SnapshotFund | null>(null);
  const [sellForm, setSellForm] = useState({ qty: '', sellPrice: '', sellDate: todayStr(), customBrok: '', customVat: '' });

  // Move dialog
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<SnapshotFund | null>(null);
  const [moveTargetPortfolioId, setMoveTargetPortfolioId] = useState<string>('');

  // Derived
  const live = prices[symbol]?.price ?? 0;
  const amount = useMemo(() => Number(units || 0) * Number(price || live || 0), [units, price, live]);

  const commodityHoldings = useMemo(() => {
    let result = allCommoditiesRaw;

    if (statusFilter !== 'all') {
      result = result.filter((s) => {
        const live = prices[s.symbol ?? '']?.price ?? s.currentPrice ?? s.buyPrice;
        const pl = (live - s.buyPrice) * s.units;
        if (statusFilter === 'profit') return pl >= 0;
        if (statusFilter === 'loss') return pl < 0;
        return true;
      });
    }

    if (sortFilter !== 'default') {
      result = [...result].sort((a, b) => {
        const liveA = prices[a.symbol ?? '']?.price ?? a.currentPrice ?? a.buyPrice;
        const liveB = prices[b.symbol ?? '']?.price ?? b.currentPrice ?? b.buyPrice;
        const valA = a.units * liveA;
        const valB = b.units * liveB;
        const plA = valA - (a.units * a.buyPrice);
        const plB = valB - (b.units * b.buyPrice);

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
  }, [allCommoditiesRaw, statusFilter, sortFilter, prices]);

  const allCategories = [
    { key: 'precious', items: commoditiesData.preciousMetals as CommodityItem[] },
    { key: 'industrial', items: commoditiesData.industrialMetals as CommodityItem[] },
    { key: 'energy', items: commoditiesData.energy as CommodityItem[] },
    { key: 'agriculture', items: commoditiesData.agriculture as CommodityItem[] },
    { key: 'livestock', items: commoditiesData.livestock as CommodityItem[] },
  ];

  const totalItems = allCategories.reduce((a, c) => a + c.items.length, 0);

  const getLivePrice = (item: any) => {
    if (!item) return undefined;
    const targetSym = COMMODITY_YAHOO_MAP[item.symbol] || COMMODITY_YAHOO_MAP[item.name] || COMMODITY_YAHOO_MAP[item.nameEn] || `${item.symbol}=F` || item.symbol;
    const p = prices[targetSym] || fallbackQuotes[targetSym] || prices[item.symbol];
    if (!p) return undefined;
    return { price: p.price, changePct: p.changePct };
  };

  /* ── Buy ── */
  const buy = async () => {
    if (!snapshot) return;
    const u = Number(units);
    const p = Number(price || live);
    if (!u || !p) {
      toast({ title: 'بيانات ناقصة', description: 'أدخل الوحدات والسعر.', variant: 'destructive' });
      return;
    }

    const name = BUY_OPTIONS.find((o) => o.symbol === symbol)?.name ?? symbol;

    const newEntry: SnapshotFund = {
      id: crypto.randomUUID(),
      symbol,
      name,
      fundType: 'commodities',
      exchange: 'COMMODITY',
      units: u,
      buyPrice: p,
      currentPrice: live || p,
      buyDate: buyDate || todayStr(),
      sector: 'Commodities',
    };

    const targetId = addTargetPortfolioId || selectedPortfolioId;
    if (targetId && targetId !== selectedPortfolioId) {
      const targetSnap = allSnapshots.find(s => s.portfolioId === targetId);
      if (targetSnap) {
        const updated = { ...targetSnap, funds: [newEntry, ...targetSnap.funds], exportedAt: new Date().toISOString() };
        await persistPortfolioSnapshot(updated, targetId);
        setAllSnapshots(prev => prev.map(s => s.portfolioId === targetId ? updated : s));
      }
    } else {
      const updated = { ...snapshot, funds: [newEntry, ...snapshot.funds], exportedAt: new Date().toISOString() };
      await save(updated);
      setAllSnapshots(prev => prev.map(s => s.portfolioId === selectedPortfolioId ? updated : s));
    }

    setUnits('');
    setPrice('');
    setBuyDate(todayStr());
    const targetName = portfolios.find(pt => pt.id === targetId)?.name || '';
    toast({ title: 'تم تنفيذ الشراء', description: `تم شراء ${u} من ${name} بسعر $${p.toLocaleString()}${targetId !== selectedPortfolioId ? ` في ${targetName}` : ''}.` });
  };

  /* ── Save Edit ── */
  const saveEdit = async () => {
    if (!editItem) return;
    const itemPortfolioId = assetPortfolioIdMap.get(editItem.id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const updated = { ...targetSnap, funds: targetSnap.funds.map((f) => (f.id === editItem.id ? editItem : f)), exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) { await save(updated); } else { await persistPortfolioSnapshot(updated, itemPortfolioId!); }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    setEditOpen(false);
    setEditItem(null);
    toast({ title: 'تم التعديل' });
  };

  /* ── Execute Sell ── */
  const executeSell = async () => {
    if (!sellItem) return;
    const sellQty = Number(sellForm.qty);
    const sellPrice = Number(sellForm.sellPrice);
    if (!sellQty || !sellPrice || sellQty > sellItem.units) {
      toast({ title: 'خطأ', description: 'تأكد من الكمية والسعر.', variant: 'destructive' });
      return;
    }
    const itemPortfolioId = assetPortfolioIdMap.get(sellItem.id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const grossSell = sellQty * sellPrice;
    const tradeCurrency = sellItem.currency || 'USD';
    const sellTaxDefs = getTaxDefaults({ currency: tradeCurrency, symbol: sellItem.symbol, exchange: 'COMMODITY' });
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
      id: crypto.randomUUID(), symbol: sellItem.symbol ?? '', name: sellItem.name, assetType: 'commodity',
      qty: sellQty, buyPrice: sellItem.buyPrice, sellPrice, buyDate: sellItem.buyDate,
      sellDate: sellForm.sellDate || todayStr(), profitLoss: pl, profitLossPct: plPct,
      fees: sellFees.brokerage + sellFees.vat,
      currency: tradeCurrency, exchange: 'COMMODITY', high52w: sellItem.high52w, low52w: sellItem.low52w,
    };

    const remaining = sellItem.units - sellQty;
    const nextFunds = remaining > 0
      ? targetSnap.funds.map((f) => (f.id === sellItem.id ? { ...f, units: remaining } : f))
      : targetSnap.funds.filter((f) => f.id !== sellItem.id);

    const updated = { ...targetSnap, funds: nextFunds, sellHistory: [record, ...(targetSnap.sellHistory ?? [])], exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) { await save(updated); } else { await persistPortfolioSnapshot(updated, itemPortfolioId!); }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));

    setSellOpen(false);
    setSellItem(null);
    setSellForm({ qty: '', sellPrice: '', sellDate: todayStr(), customBrok: '', customVat: '' });
    toast({
      title: pl >= 0 ? 'تم البيع بربح' : 'تم البيع بخسارة',
      description: `${sellItem.symbol} × ${sellQty} = ${pl >= 0 ? '+' : ''}${fmtN(pl)} ${tradeCurrency}`,
    });
  };

  /* ── Remove ── */
  const removeItem = async (id: string) => {
    const itemPortfolioId = assetPortfolioIdMap.get(id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const updated = { ...targetSnap, funds: targetSnap.funds.filter((f) => f.id !== id), exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) { await save(updated); } else { await persistPortfolioSnapshot(updated, itemPortfolioId!); }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    toast({ title: 'تم الحذف' });
  };

  /* ── Move ── */
  const moveToPortfolio = async () => {
    if (!moveItem || !moveTargetPortfolioId) return;
    const sourcePortfolioId = assetPortfolioIdMap.get(moveItem.id) || selectedPortfolioId;
    if (!sourcePortfolioId || sourcePortfolioId === moveTargetPortfolioId) return;
    const sourceSnap = (sourcePortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === sourcePortfolioId);
    if (!sourceSnap) return;
    const updatedSource = { ...sourceSnap, funds: sourceSnap.funds.filter(f => f.id !== moveItem.id), exportedAt: new Date().toISOString() };
    const targetSnap = (moveTargetPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === moveTargetPortfolioId);
    if (!targetSnap) return;
    const updatedTarget = { ...targetSnap, funds: [moveItem, ...targetSnap.funds], exportedAt: new Date().toISOString() };
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

  const sellCurrency = sellItem?.currency || 'USD';
  const sellTaxDefaults = getTaxDefaults({ currency: sellCurrency, symbol: sellItem?.symbol, exchange: 'COMMODITY' });
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

  /* ──────────────────── Render ──────────────────── */
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 transition-all duration-300 lg:mr-64">
        <TopBar
          title="السلع والمعادن"
          subtitle={`${totalItems} سلعة · أسعار مباشرة`}
          onRefresh={() => { void refresh(); void reload(); }}
          isRefreshing={loading}
        />
        <main className="space-y-5 p-4 md:p-6">

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

          {/* ═══ 1. Hero ═══ */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-amber-900 via-orange-800 to-amber-950 p-6 md:p-8">
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <span className="text-4xl">🥇</span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white">السلع والمعادن</h1>
                <p className="text-white/70 mt-1 text-sm">أسعار المعادن الثمينة · الطاقة · الزراعة · المعادن الصناعية</p>
              </div>
              <div className="flex gap-4 flex-wrap" dir="ltr">
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{totalItems}</p>
                  <p className="text-[10px] text-white/60">سلعة</p>
                </div>
                <div className="w-px bg-white/20" />
                <div className="text-center">
                  <p className="text-2xl font-black text-amber-300">5</p>
                  <p className="text-[10px] text-white/60">فئات</p>
                </div>
                {commodityHoldings.length > 0 && (
                  <>
                    <div className="w-px bg-white/20" />
                    <div className="text-center">
                      <p className="text-2xl font-black text-green-300">{commodityHoldings.length}</p>
                      <p className="text-[10px] text-white/60">مركز</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ═══ 2. Buy Form ═══ */}
          <Card className="max-w-2xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                أمر شراء جديد
              </CardTitle>
            </CardHeader>
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
                <Label>السلعة</Label>
                <Select value={symbol} onValueChange={setSymbol}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUY_OPTIONS.map((s) => (
                      <SelectItem key={s.symbol} value={s.symbol}>{s.name} ({s.symbol})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>الوحدات</Label>
                  <Input type="number" value={units} onChange={(e) => setUnits(e.target.value)} />
                </div>
                <div>
                  <Label>سعر التنفيذ ($)</Label>
                  <Input type="number" placeholder={live ? live.toString() : '0'} value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div>
                  <Label>تاريخ الشراء</Label>
                  <Input type="date" value={buyDate} onChange={(e) => setBuyDate(e.target.value)} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                السعر الحي: {live ? `$${live.toLocaleString('en-US', { maximumFractionDigits: 4 })}` : 'غير متاح'}
              </p>
              <p className="text-lg font-bold">
                إجمالي الصفقة: ${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </p>
              <Button onClick={() => void buy()} disabled={saving} className="w-full">
                تنفيذ الشراء
              </Button>
            </CardContent>
          </Card>

          {/* ═══ 3. Holdings ═══ */}
          {commodityHoldings.length > 0 && (
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>محفظة السلع والمعادن ({commodityHoldings.length})</CardTitle>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => { void refresh(); void reload(); }}>
                    <RefreshCw className="h-3 w-3" /> تحديث
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {commodityHoldings.map((item) => {
                    const liveP = prices[item.symbol ?? '']?.price ?? item.currentPrice ?? item.buyPrice;
                    const cost = item.units * item.buyPrice;
                    const value = item.units * liveP;
                    const pl = value - cost;
                    const plPct = cost > 0 ? (pl / cost) * 100 : 0;
                    const live52h = (prices as Record<string, any>)[item.symbol ?? '']?.high52w ?? item.high52w;
                    const live52l = (prices as Record<string, any>)[item.symbol ?? '']?.low52w ?? item.low52w;
                    const pctPos = pos52w(liveP, live52h, live52l);
                    return (
                      <div key={item.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          {portfolioFilter === 'all' && assetPortfolioMap.get(item.id) && (
                            <Badge variant="secondary" className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">💼 {assetPortfolioMap.get(item.id)}</Badge>
                          )}
                          <div className="min-w-20 font-bold">{item.symbol}</div>
                          <div className="flex-1 min-w-32">
                            <p className="font-medium">{item.name}</p>
                          </div>
                          <Badge variant="outline" className={ASSET_METRIC_BADGE_CLASS}>
                            <span className={ASSET_METRIC_LABEL_CLASS}>الوحدات:</span>
                            <span>{item.units}</span>
                          </Badge>
                          <Badge variant="outline" className={`${ASSET_METRIC_BADGE_CLASS} bg-blue-50/80 dark:bg-blue-950/30`}>
                            <span className={ASSET_METRIC_LABEL_CLASS}>سعر الشراء:</span>
                            <span>${item.buyPrice.toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
                          </Badge>
                          <Badge variant="outline" className={ASSET_METRIC_BADGE_CLASS}>
                            <span className={ASSET_METRIC_LABEL_CLASS}>الحالي:</span>
                            <span>${liveP.toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
                          </Badge>
                          <Badge className={`rounded-lg border-2 px-3 py-1.5 text-[13px] font-extrabold shadow-sm ${pl >= 0 ? 'border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300' : 'border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'}`}>
                            <span className="text-[11px] font-bold opacity-80">الربح/الخسارة:</span>
                            <span>{pl >= 0 ? '+' : ''}${pl.toFixed(2)} ({pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%)</span>
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
                            <Button variant="outline" size="sm" className={ACTION_SELL_BUTTON_CLASS} title="بيع" onClick={() => {
                              setSellItem(item);
                              setSellForm({
                                qty: String(item.units),
                                sellPrice: (prices[item.symbol ?? '']?.price ?? item.currentPrice ?? item.buyPrice).toFixed(4),
                                sellDate: todayStr(),
                                customBrok: '',
                                customVat: '',
                              });
                              setSellOpen(true);
                            }}>
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
                              <span className="text-red-500 font-medium">أدنى 52w: {live52l != null ? `$${live52l.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}</span>
                              {liveP != null && pctPos !== null && (
                                <span className="font-bold text-foreground text-xs">${liveP.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                              )}
                              <span className="text-green-500 font-medium">أعلى 52w: {live52h != null ? `$${live52h.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}</span>
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

          {/* ═══ 4. Action bar ═══ */}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => void refresh()}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> تحديث الأسعار
            </Button>
            {lastUpdate && <Badge variant="outline">آخر تحديث: {lastUpdate.toLocaleTimeString('ar-SA')}</Badge>}
          </div>

          {/* ═══ 5. Indices ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {commoditiesData.indices.map((idx) => {
              const live = getLivePrice(idx);
              const price = live?.price ?? idx.price;
              const changePct = live?.changePct ?? idx.changePct;
              return (
                <Card key={idx.symbol} className="border-2">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{idx.name}</p>
                      <p className="text-xl font-bold">{price.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                    </div>
                    <Badge className={changePct >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ═══ 6. Tabs by category ═══ */}
          <Tabs defaultValue="precious">
            <TabsList className="grid w-full grid-cols-5 h-12">
              {allCategories.map(({ key, items }) => {
                const cfg = CATEGORY_CONFIG[key];
                return (
                  <TabsTrigger key={key} value={key} className="gap-1 text-xs md:text-sm">
                    <span>{cfg.icon}</span>
                    <span className="hidden md:inline">{cfg.label}</span>
                    <Badge variant="secondary" className="text-[10px] h-5 ml-1">{items.length}</Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {allCategories.map(({ key, items }) => {
              const cfg = CATEGORY_CONFIG[key];
              return (
                <TabsContent key={key} value={key} className="mt-4">
                  <Card className="border-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="text-xl">{cfg.icon}</span>
                        {cfg.label}
                        <Badge variant="outline" className="text-xs">{items.length} سلعة</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {items.map((item) => (
                          <CommodityCard key={item.symbol} item={item} livePrice={getLivePrice(item)} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </main>
      </div>

      {/* ═══ Edit Dialog ═══ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تعديل {editItem?.symbol}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الرمز</Label><Input value={editItem.symbol ?? ''} onChange={(e) => setEditItem({ ...editItem, symbol: e.target.value })} /></div>
                <div><Label>الاسم</Label><Input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>الوحدات</Label><Input type="number" value={editItem.units} onChange={(e) => setEditItem({ ...editItem, units: Number(e.target.value) })} /></div>
                <div><Label>سعر الشراء</Label><Input type="number" value={editItem.buyPrice} onChange={(e) => setEditItem({ ...editItem, buyPrice: Number(e.target.value) })} /></div>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>إلغاء</Button>
            <Button onClick={saveEdit} disabled={saving}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Move Dialog ═══ */}
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

      {/* ═══ Sell Dialog ═══ */}
      <Dialog open={sellOpen} onOpenChange={setSellOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>بيع {sellItem?.symbol}</DialogTitle>
            <DialogDescription>الكمية المتاحة: {sellItem?.units}</DialogDescription>
          </DialogHeader>
          {sellItem && (
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>كمية البيع</Label><Input type="number" value={sellForm.qty} onChange={(e) => setSellForm((p) => ({ ...p, qty: e.target.value }))} /></div>
                <div><Label>سعر البيع ({sellCurrency})</Label><Input type="number" value={sellForm.sellPrice} onChange={(e) => setSellForm((p) => ({ ...p, sellPrice: e.target.value }))} /></div>
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
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي تكلفة الشراء</span><span>{fmtN(costB)} ({fmtN(sellItem.buyPrice, 4)})</span></div>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setSellOpen(false)}>إلغاء</Button>
            <Button onClick={executeSell} disabled={saving} className="bg-amber-600 hover:bg-amber-700">تنفيذ البيع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذه السلعة؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
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
