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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { notifySuccess, notifyWarning, notifyInfo, notifyError } from '@/hooks/use-notifications';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { useLivePrices } from '@/hooks/use-live-prices';
import { fetchAllPortfoliosSnapshots, persistPortfolioSnapshot, type SnapshotFund, type SellRecord, type PortfolioSnapshot } from '@/lib/export-utils';
import { calcTradeFees, getTaxDefaults } from '@/lib/tax-settings';
import { convertCurrency, fmtN } from '@/lib/helpers';
import { calcPurificationAmount, fetchPurificationMetrics, ZERO_PURIFICATION_METRICS } from '@/lib/purification';
import { SymbolLookup } from '@/components/forms/SymbolLookup';
import { Plus, RefreshCw, Search, Trash2, Edit2, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { ShariaBadgesPanel, ShariaInlineBadge } from '@/components/ui/sharia-badges';
import { FundEditDialog, FundMoveDialog, FundDeleteDialog } from './FundDialogs';

function normalizeSymbol(symbol: string) { return symbol.trim().toUpperCase(); }

function getPriceForFund(prices: Record<string, { price: number }>, symbol?: string) {
  if (!symbol) return null;
  const n = normalizeSymbol(symbol);
  return prices[`FUND_${n}`]?.price ?? prices[n]?.price ?? prices[n.replace('.', '_')]?.price ?? null;
}

const todayStr = () => new Date().toISOString().split('T')[0];

const precise = (num: number) => Number(num.toFixed(4));

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

const emptyForm = (currency?: string) => ({
  symbol: '', name: '', units: '', buyPrice: '', fundType: 'equity', exchange: '',
  currency: currency || 'SAR',
  sector: '', buyDate: todayStr(), customBrok: '', customVat: '',
  shariaStatus: '', shariaBilad: '', shariaRajhi: '', shariaMaqasid: '', shariaZero: '',
});

const ASSET_METRIC_BADGE_CLASS = 'inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300/90 bg-background px-2.5 py-1.5 text-[13px] font-extrabold text-foreground shadow-sm dark:border-slate-700';
const ASSET_METRIC_LABEL_CLASS = 'text-[11px] font-bold text-muted-foreground';
const ACTION_BUTTON_BASE_CLASS = 'h-9 rounded-lg border-2 px-3 text-xs font-bold shadow-sm transition-colors';
const ACTION_MOVE_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300`;
const ACTION_EDIT_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300`;
const ACTION_SELL_BUTTON_CLASS = `${ACTION_BUTTON_BASE_CLASS} border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300`;

export default function FundsPage() {
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

  const allFundsRaw = useMemo(() => activeSnapshots.flatMap((s) => s.funds), [activeSnapshots]);
  const assetPortfolioMap = useMemo(() => {
    const map = new Map<string, string>();
    activeSnapshots.forEach(s => { s.funds.forEach(f => map.set(f.id, s.portfolioName || '')); });
    return map;
  }, [activeSnapshots]);
  const assetPortfolioIdMap = useMemo(() => {
    const map = new Map<string, string>();
    activeSnapshots.forEach(s => { s.funds.forEach(f => map.set(f.id, s.portfolioId || '')); });
    return map;
  }, [activeSnapshots]);
  const symbolsToFetch = useMemo(() => Array.from(new Set(allFundsRaw.map(s => s.symbol).filter(Boolean))), [allFundsRaw]);
  const { prices, refresh } = useLivePrices({ refreshInterval: 60000, symbols: symbolsToFetch as string[] });

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm(snapshot?.currency));
  const [addTargetPortfolioId, setAddTargetPortfolioId] = useState<string>(selectedPortfolioId || portfolios[0]?.id || '');
  const [editOpen, setEditOpen] = useState(false);
  const [editFund, setEditFund] = useState<SnapshotFund | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sellOpen, setSellOpen] = useState(false);
  const [sellFund, setSellFund] = useState<SnapshotFund | null>(null);
  const [sellForm, setSellForm] = useState({ units: '', sellPrice: '', sellDate: todayStr(), customBrok: '', customVat: '', customPurification: '' });
  const [sellPurification, setSellPurification] = useState(ZERO_PURIFICATION_METRICS);
  const [sellPurificationLoading, setSellPurificationLoading] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<SnapshotFund | null>(null);
  const [moveTargetPortfolioId, setMoveTargetPortfolioId] = useState<string>('');

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
    allSnapshots.forEach((s) => {
      if (s.portfolioId && s.currency) map.set(s.portfolioId, s.currency);
    });
    return map;
  }, [allSnapshots]);

  const resolveFundCurrency = useMemo(() => {
    return (fund: SnapshotFund): string => {
      const itemPortfolioId = assetPortfolioIdMap.get(fund.id);
      const itemPortfolioCurrency = itemPortfolioId ? portfolioCurrencyMap.get(itemPortfolioId) : undefined;
      return fund.currency || currencyFromExchange(fund.exchange) || itemPortfolioCurrency || displayCurrency || 'SAR';
    };
  }, [assetPortfolioIdMap, portfolioCurrencyMap, displayCurrency]);

  const { marketKey, brokeragePct, vatPct } = getTaxDefaults({ symbol: form.symbol, exchange: form.exchange, currency: form.currency || (activePortfolio?.currency ?? snapshot?.currency) });
  const unitsNum = Number(form.units || 0);
  const buyPriceNum = Number(form.buyPrice || 0);
  const grossBuy = unitsNum * buyPriceNum;
  const feeCalc = calcTradeFees({ grossAmount: grossBuy, brokeragePct, vatPct, customBrokerageAmount: form.customBrok !== '' ? Number(form.customBrok || 0) : undefined, customVatAmount: form.customVat !== '' ? Number(form.customVat || 0) : undefined });
  const brokFee = feeCalc.brokerage;
  const vatFee = feeCalc.vat;
  const totalCostWithFees = feeCalc.total;

  const funds = useMemo(() => allFundsRaw.filter((f) => f.fundType !== 'commodities'), [allFundsRaw]);
  const filtered = useMemo(() => {
    let result = funds.filter((f) => {
      const q = search.toLowerCase();
      return f.name.toLowerCase().includes(q) || (f.symbol ?? '').toLowerCase().includes(q);
    });

    if (statusFilter !== 'all') {
      result = result.filter((f) => {
        const live = getPriceForFund(prices as Record<string, { price: number }>, f.symbol) ?? f.currentPrice ?? f.buyPrice;
        const pl = (live - f.buyPrice) * f.units;
        if (statusFilter === 'profit') return pl >= 0;
        if (statusFilter === 'loss') return pl < 0;
        return true;
      });
    }

    if (sortFilter !== 'default') {
      result = [...result].sort((a, b) => {
        const liveA = getPriceForFund(prices as Record<string, { price: number }>, a.symbol) ?? a.currentPrice ?? a.buyPrice;
        const liveB = getPriceForFund(prices as Record<string, { price: number }>, b.symbol) ?? b.currentPrice ?? b.buyPrice;

        const valA = a.units * liveA;
        const valB = b.units * liveB;
        const plA = valA - (a.units * a.buyPrice);
        const plB = valB - (b.units * b.buyPrice);
        const currA = resolveFundCurrency(a);
        const currB = resolveFundCurrency(b);
        const valAConv = convertCurrency(valA, currA, displayCurrency);
        const valBConv = convertCurrency(valB, currB, displayCurrency);
        const plAConv = convertCurrency(plA, currA, displayCurrency);
        const plBConv = convertCurrency(plB, currB, displayCurrency);

        switch (sortFilter) {
          case 'value-desc': return valBConv - valAConv;
          case 'value-asc': return valAConv - valBConv;
          case 'pl-desc': return plBConv - plAConv;
          case 'pl-asc': return plAConv - plBConv;
          default: return 0;
        }
      });
    }

    return result;
  }, [funds, search, statusFilter, sortFilter, prices, resolveFundCurrency, displayCurrency]);

  useEffect(() => { updateSidebarCounts({ funds: filtered.length }); }, [filtered.length]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, fund) => {
        const live = getPriceForFund(prices as Record<string, { price: number }>, fund.symbol) ?? fund.currentPrice ?? fund.buyPrice;
        const fundCurrency = resolveFundCurrency(fund);
        const cost = fund.units * fund.buyPrice;
        const value = fund.units * live;
        acc.cost += convertCurrency(cost, fundCurrency, displayCurrency);
        acc.value += convertCurrency(value, fundCurrency, displayCurrency);
        return acc;
      },
      { cost: 0, value: 0 }
    );
  }, [filtered, prices, resolveFundCurrency, displayCurrency]);

  const totalProfitLoss = totals.value - totals.cost;
  const totalProfitLossPct = totals.cost > 0 ? (totalProfitLoss / totals.cost) * 100 : 0;

  const addFund = async () => {
    if (!form.name || !form.units || !form.buyPrice) {
      toast({ title: 'الحقول مطلوبة', description: 'أكمل اسم الصندوق والوحدات والسعر.', variant: 'destructive' });
      return;
    }
    const symbol = form.symbol ? normalizeSymbol(form.symbol) : undefined;
    const units = Number(form.units);
    const buyPrice = Number(form.buyPrice);
    if (!Number.isFinite(units) || units <= 0 || !Number.isFinite(buyPrice) || buyPrice <= 0) {
      toast({ title: 'قيم غير صالحة', description: 'الوحدات وسعر الشراء يجب أن يكونا أكبر من صفر.', variant: 'destructive' });
      return;
    }
    const live = getPriceForFund(prices as Record<string, { price: number }>, symbol) ?? buyPrice;
    const effectiveBuyPrice = precise(units > 0 ? totalCostWithFees / units : buyPrice);
    const detectedCurrency = form.currency || currencyFromExchange(form.exchange) || activePortfolio?.currency || snapshot?.currency || 'SAR';
    const nextFund: SnapshotFund = {
      id: crypto.randomUUID(), symbol: symbol || '', name: form.name, fundType: form.fundType,
      exchange: form.exchange || undefined, sector: form.sector || undefined,
      currency: detectedCurrency,
      units, buyPrice: effectiveBuyPrice, currentPrice: live, buyDate: form.buyDate || todayStr(),
      shariaStatus: form.shariaStatus || undefined, shariaBilad: form.shariaBilad || undefined,
      shariaRajhi: form.shariaRajhi || undefined, shariaMaqasid: form.shariaMaqasid || undefined,
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

    const updated = { ...selectedSnapshot, funds: [nextFund, ...selectedSnapshot.funds], exportedAt: new Date().toISOString() };
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
        description: 'تمت إضافة الصندوق محليًا لكن لم يتم تأكيد الحفظ في قاعدة البيانات. تحقق من تسجيل الدخول.',
        variant: 'destructive',
      });
      notifyWarning('إضافة صندوق محليًا', `تمت إضافة ${nextFund.name} محليًا بدون مزامنة كاملة`, { source: 'funds' });
      setOpen(false);
      setForm(emptyForm(activePortfolio?.currency));
      return;
    }

    setOpen(false);
    setForm(emptyForm(activePortfolio?.currency));
    const targetName = portfolios.find((p) => p.id === resolvedTargetId)?.name || '';
    toast({ title: 'تمت الإضافة', description: `تمت إضافة ${nextFund.name}${resolvedTargetId !== selectedPortfolioId ? ` في ${targetName}` : ''}.` });
    notifySuccess('تمت إضافة صندوق', `تمت إضافة ${nextFund.name} بنجاح`, { source: 'funds' });
  };

  const saveEdit = async () => {
    if (!editFund) return;
    const itemPortfolioId = assetPortfolioIdMap.get(editFund.id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const updated = { ...targetSnap, funds: targetSnap.funds.map((f) => f.id === editFund.id ? editFund : f), exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) { await save(updated); } else { await persistPortfolioSnapshot(updated, itemPortfolioId!); }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    setEditOpen(false); setEditFund(null);
    toast({ title: 'تم التعديل', description: 'تم تحديث بيانات الصندوق.' });
  };

  const executeSell = async () => {
    if (!sellFund) return;
    const sellUnits = Number(sellForm.units);
    const sellPrice = Number(sellForm.sellPrice);
    if (!sellUnits || !sellPrice || sellUnits > sellFund.units) { toast({ title: 'خطأ', description: 'تأكد من الكمية والسعر.', variant: 'destructive' }); return; }
    const sellFundCurrency = resolveFundCurrency(sellFund);
    const itemPortfolioId = assetPortfolioIdMap.get(sellFund.id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const grossSell = precise(sellUnits * sellPrice);
    const sellTaxDefs = getTaxDefaults({ symbol: sellFund.symbol, exchange: sellFund.exchange, currency: sellFundCurrency });
    const sf = calcTradeFees({ grossAmount: grossSell, brokeragePct: sellTaxDefs.brokeragePct, vatPct: sellTaxDefs.vatPct, customBrokerageAmount: sellForm.customBrok !== '' ? Number(sellForm.customBrok || 0) : undefined, customVatAmount: sellForm.customVat !== '' ? Number(sellForm.customVat || 0) : undefined });
    const net = precise(grossSell - sf.brokerage - sf.vat);
    const costBasis = precise(sellUnits * sellFund.buyPrice);
    const profitBeforePurification = precise(net - costBasis);
    const profitBaseForPurification = Math.max(0, profitBeforePurification);
    const purificationMetrics = await fetchPurificationMetrics({
      symbol: sellFund.symbol,
      exchange: sellFund.exchange,
      assetType: 'fund',
    });
    const purificationPct = purificationMetrics.purificationPct || 0;
    const purificationAmountAuto = calcPurificationAmount(profitBaseForPurification, purificationPct);
    const manualPurificationRaw = sellForm.customPurification !== '' ? Number(sellForm.customPurification) : NaN;
    const hasManualPurification = sellForm.customPurification !== '' && Number.isFinite(manualPurificationRaw);
    const purificationAmount = Math.min(
      profitBaseForPurification,
      Math.max(0, hasManualPurification ? manualPurificationRaw : purificationAmountAuto),
    );
    const netAfterPurification = precise(net - purificationAmount);
    const pl = precise(netAfterPurification - costBasis);
    const plPct = costBasis > 0 ? (pl / costBasis) * 100 : 0;
    const record: SellRecord = {
      id: crypto.randomUUID(),
      symbol: sellFund.symbol || sellFund.name,
      name: sellFund.name,
      assetType: 'fund',
      qty: sellUnits,
      buyPrice: sellFund.buyPrice,
      sellPrice,
      buyDate: sellFund.buyDate,
      sellDate: sellForm.sellDate || todayStr(),
      profitLoss: pl,
      profitLossPct: plPct,
      fees: sf.brokerage + sf.vat,
      purificationPct,
      purificationAmount,
      interestIncomeToRevenuePct: purificationMetrics.interestIncomeToRevenuePct || 0,
      debtToMarketCapPct: purificationMetrics.debtToMarketCapPct || 0,
      currency: sellFundCurrency,
      exchange: sellFund.exchange,
      high52w: sellFund.high52w,
      low52w: sellFund.low52w,
    };
    const remaining = sellFund.units - sellUnits;
    const nextFunds = remaining > 0 ? targetSnap.funds.map((f) => f.id === sellFund.id ? { ...f, units: remaining } : f) : targetSnap.funds.filter((f) => f.id !== sellFund.id);
    const updated = { ...targetSnap, funds: nextFunds, sellHistory: [record, ...(targetSnap.sellHistory ?? [])], exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) { await save(updated); } else { await persistPortfolioSnapshot(updated, itemPortfolioId!); }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    setSellOpen(false); setSellFund(null); setSellForm({ units: '', sellPrice: '', sellDate: todayStr(), customBrok: '', customVat: '', customPurification: '' });
    toast({ title: pl >= 0 ? 'تم البيع بربح' : 'تم البيع بخسارة', description: `${sellFund.name} × ${sellUnits} = ${pl >= 0 ? '+' : ''}${fmtN(pl)} ${sellFundCurrency}` });
    notifySuccess('تم بيع صندوق', `${sellFund.name} × ${sellUnits} بصافي ${pl >= 0 ? '+' : ''}${fmtN(pl)} ${sellFundCurrency}`, { source: 'funds' });
  };

  const removeFund = async (id: string) => {
    const itemPortfolioId = assetPortfolioIdMap.get(id) || selectedPortfolioId;
    const targetSnap = (itemPortfolioId === selectedPortfolioId) ? snapshot : allSnapshots.find(s => s.portfolioId === itemPortfolioId);
    if (!targetSnap) return;
    const updated = { ...targetSnap, funds: targetSnap.funds.filter((f) => f.id !== id), exportedAt: new Date().toISOString() };
    if (itemPortfolioId === selectedPortfolioId) { await save(updated); } else { await persistPortfolioSnapshot(updated, itemPortfolioId!); }
    setAllSnapshots(prev => prev.map(s => s.portfolioId === itemPortfolioId ? updated : s));
    toast({ title: 'تم الحذف', description: 'تم حذف الصندوق.' });
    notifyWarning('تم حذف صندوق', 'تم حذف الصندوق من المحفظة', { source: 'funds' });
  };

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
    toast({ title: 'تم النقل', description: `تم نقل ${moveItem.name} إلى ${targetName}.` });
  };

  const sellCurrency = sellFund ? resolveFundCurrency(sellFund) : (activePortfolio?.currency || displayCurrency || 'SAR');
  const sellTaxDefaults = sellFund ? getTaxDefaults({ symbol: sellFund.symbol, exchange: sellFund.exchange, currency: sellCurrency }) : { brokeragePct, vatPct };
  const sellUnitsNum = Number(sellForm.units || 0);
  const sellPriceNum = Number(sellForm.sellPrice || 0);
  const grossSellCalc = sellUnitsNum * sellPriceNum;
  const sellFeeCalc = calcTradeFees({ grossAmount: grossSellCalc, brokeragePct: sellTaxDefaults.brokeragePct, vatPct: sellTaxDefaults.vatPct, customBrokerageAmount: sellForm.customBrok !== '' ? Number(sellForm.customBrok || 0) : undefined, customVatAmount: sellForm.customVat !== '' ? Number(sellForm.customVat || 0) : undefined });
  const sellNetBeforePurification = grossSellCalc - sellFeeCalc.brokerage - sellFeeCalc.vat;
  const sellCostBasisCalc = sellUnitsNum * (sellFund?.buyPrice || 0);
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
    if (!sellOpen || !sellFund?.symbol) {
      setSellPurification(ZERO_PURIFICATION_METRICS);
      setSellPurificationLoading(false);
      return;
    }

    setSellPurificationLoading(true);
    fetchPurificationMetrics({
      symbol: sellFund.symbol,
      exchange: sellFund.exchange,
      assetType: 'fund',
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
  }, [sellOpen, sellFund?.symbol, sellFund?.exchange]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 transition-all duration-300 lg:mr-64">
        <TopBar title="💼 الصناديق (بيانات حقيقية)" />
        <main className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-5">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">عدد الصناديق</p><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">إجمالي التكلفة</p><p className="text-2xl font-bold">{fmtN(totals.cost)} <span className="text-sm font-normal text-muted-foreground">{displayCurrency}</span></p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">إجمالي القيمة</p><p className="text-2xl font-bold">{fmtN(totals.value)} <span className="text-sm font-normal text-muted-foreground">{displayCurrency}</span></p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">الربح/الخسارة</p><p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalProfitLoss >= 0 ? '+' : ''}{fmtN(totalProfitLoss)} <span className="text-sm font-normal text-muted-foreground">{displayCurrency}</span><span className="mr-2 text-xs text-muted-foreground">({totalProfitLossPct >= 0 ? '+' : ''}{fmtN(totalProfitLossPct)}%)</span></p></CardContent></Card>
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
              <Button variant="outline" className="gap-2" onClick={() => { void refresh(); void reload(); }}><RefreshCw className="h-4 w-4" /> تحديث</Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> إضافة صندوق</Button></DialogTrigger>
                <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>إضافة صندوق استثماري</DialogTitle><DialogDescription>واجهة إضافة محسنة مع سعر حي.</DialogDescription></DialogHeader>
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
                    <div><Label>بحث صندوق / ETF</Label>
                      <SymbolLookup type="fund" value={form.symbol} onChange={(next) => setForm((p) => ({ ...p, symbol: next }))}
                        onPick={(item) => {
                          const detectedCurrency = item.currency || currencyFromExchange(item.exchange) || undefined;
                          setForm((prev) => ({
                            ...prev,
                            symbol: item.symbol,
                            name: item.name || prev.name,
                            buyPrice: item.quote?.price ? item.quote.price.toFixed(4) : prev.buyPrice,
                            fundType: item.type || prev.fundType || 'etf',
                            exchange: item.exchange || prev.exchange,
                            currency: detectedCurrency || prev.currency,
                            sector: item.sector || prev.sector,
                            shariaStatus: item.shariaStatus || '',
                            shariaBilad: item.shariaBilad || '',
                            shariaRajhi: item.shariaRajhi || '',
                            shariaMaqasid: item.shariaMaqasid || '',
                            shariaZero: item.shariaZero || '',
                          }));
                          toast({ title: 'تمت التعبئة التلقائية', description: item.quote ? `${item.symbol} • ${item.quote.price.toFixed(4)} (${item.quote.changePct.toFixed(2)}%) • ${item.quote.source}` : `${item.symbol} • ${item.name}` });
                        }} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label>الرمز</Label><Input value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))} /></div>
                      <div><Label>النوع</Label><Input value={form.fundType} onChange={(e) => setForm((p) => ({ ...p, fundType: e.target.value }))} /></div>
                      <div><Label>البورصة</Label><Input value={form.exchange} onChange={(e) => setForm((p) => ({ ...p, exchange: e.target.value }))} placeholder="TADAWUL / NYSE..." /></div>
                    </div>
                    <div><Label>اسم الصندوق</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>القطاع</Label><Input value={form.sector} onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))} placeholder="تقنية / بنوك..." /></div>
                      <div><Label>تاريخ الشراء</Label><Input type="date" value={form.buyDate} onChange={(e) => setForm((p) => ({ ...p, buyDate: e.target.value }))} /></div>
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
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>عدد الوحدات</Label><Input type="number" value={form.units} onChange={(e) => setForm((p) => ({ ...p, units: e.target.value }))} /></div>
                      <div><Label>سعر الشراء</Label><Input type="number" value={form.buyPrice} onChange={(e) => setForm((p) => ({ ...p, buyPrice: e.target.value }))} /></div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold text-primary">مبالغ العمولة والضريبة</p>
                      <p className="mb-3 text-xs text-muted-foreground">إعدادات السوق: {marketKey.toUpperCase()} • عمولة {brokeragePct}% • ضريبة {vatPct}%</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>عمولة السمسرة ({form.currency || 'SAR'})</Label><Input type="number" value={form.customBrok} placeholder={grossBuy > 0 ? `تلقائي ${fmtN(grossBuy * (brokeragePct / 100))}` : 'مبلغ...'} onChange={(e) => setForm((p) => ({ ...p, customBrok: e.target.value }))} /></div>
                        <div><Label>ضريبة القيمة المضافة ({form.currency || 'SAR'})</Label><Input type="number" value={form.customVat} placeholder={brokFee > 0 ? `تلقائي ${fmtN(brokFee * (vatPct / 100))}` : 'مبلغ...'} onChange={(e) => setForm((p) => ({ ...p, customVat: e.target.value }))} /></div>
                      </div>
                      <div className="mt-3 rounded-md border bg-background p-2 text-sm">
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي الشراء</span><span>{fmtN(grossBuy)}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">العمولة</span><span>{fmtN(brokFee)}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">الضريبة</span><span>{fmtN(vatFee)}</span></div>
                        <div className="mt-1 flex items-center justify-between font-bold"><span>التكلفة الفعلية</span><span>{fmtN(totalCostWithFees)} {form.currency || 'SAR'}</span></div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button><Button onClick={addFund} disabled={saving}>حفظ</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>قائمة الصناديق</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground">جاري التحميل...</p> : null}
              <div className="space-y-2">
                {filtered.map((fund) => {
                  const live = getPriceForFund(prices as Record<string, { price: number }>, fund.symbol) ?? fund.currentPrice ?? fund.buyPrice;
                  const fundCurrency = resolveFundCurrency(fund);
                  const isDiff = fundCurrency !== displayCurrency;
                  const fundKey = fund.symbol ? Object.keys(prices).find(k => {
                    const norm = (s: string) => s.trim().toUpperCase().replace('.', '_');
                    return norm(k) === norm(fund.symbol || '') || k === (fund.symbol || '').replace('.', '_');
                  }) : undefined;
                  const live52h = (fundKey && (prices as Record<string, any>)[fundKey]?.high52w) ?? fund.high52w;
                  const live52l = (fundKey && (prices as Record<string, any>)[fundKey]?.low52w) ?? fund.low52w;
                  const value = fund.units * live;
                  const cost = fund.units * fund.buyPrice;
                  const pl = value - cost;
                  const convLive = convertCurrency(live, fundCurrency, displayCurrency);
                  const convPl = convertCurrency(pl, fundCurrency, displayCurrency);
                  const pctPos = pos52w(live, live52h, live52l);
                  return (
                    <div key={fund.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        {portfolioFilter === 'all' && assetPortfolioMap.get(fund.id) && (
                          <Badge variant="secondary" className="text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">💼 {assetPortfolioMap.get(fund.id)}</Badge>
                        )}
                        <div className="min-w-28 font-bold">{fund.symbol ?? 'N/A'}</div>
                        <div className="flex-1 min-w-40">
                          <p className="font-medium">{fund.name}</p>
                          <p className="text-xs text-muted-foreground">{[fund.fundType, fund.exchange, fund.sector].filter(Boolean).join(' • ') || 'عام'}</p>
                        </div>
                        <ShariaBadgesPanel
                          shariaStatus={fund.shariaStatus}
                          shariaBilad={fund.shariaBilad}
                          shariaRajhi={fund.shariaRajhi}
                          shariaMaqasid={fund.shariaMaqasid}
                          shariaZero={fund.shariaZero}
                        />
                        <Badge variant="outline" className={ASSET_METRIC_BADGE_CLASS}>
                          <span className={ASSET_METRIC_LABEL_CLASS}>الوحدات:</span>
                          <span>{fund.units}</span>
                        </Badge>
                        <Badge variant="outline" className={`${ASSET_METRIC_BADGE_CLASS} bg-blue-50/80 dark:bg-blue-950/30`}>
                          <span className={ASSET_METRIC_LABEL_CLASS}>سعر الشراء:</span>
                          <span>{fmtN(fund.buyPrice, 4)}</span>
                          <span className="text-[10px] opacity-80">{fundCurrency}</span>
                        </Badge>
                        <Badge variant="outline" className={ASSET_METRIC_BADGE_CLASS}>
                          <span className={ASSET_METRIC_LABEL_CLASS}>الحالي:</span>
                          <span>{fmtN(live, 4)}</span>
                          <span className="text-[10px] opacity-80">{fundCurrency}</span>
                          {isDiff && <span className="text-[10px] text-muted-foreground">({fmtN(convLive, 4)} {displayCurrency})</span>}
                        </Badge>
                        <Badge className={`rounded-lg border-2 px-3 py-1.5 text-[13px] font-extrabold shadow-sm ${pl >= 0 ? 'border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300' : 'border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300'}`}>
                          <span className="text-[11px] font-bold opacity-80">الربح/الخسارة:</span>
                          <span>{pl >= 0 ? '+' : ''}{fmtN(pl)}</span>
                          <span className="text-[10px] opacity-80">{fundCurrency}</span>
                          {isDiff && <span className="opacity-80 text-[10px]">({pl >= 0 ? '+' : ''}{fmtN(convPl)} {displayCurrency})</span>}
                        </Badge>
                        {fund.buyDate && (
                          <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/30">📅 {fund.buyDate}</Badge>
                        )}
                        {portfolios.length > 1 && (
                          <Button variant="outline" size="sm" className={ACTION_MOVE_BUTTON_CLASS} title="نقل لمحفظة أخرى" onClick={() => { setMoveItem(fund); setMoveTargetPortfolioId(''); setMoveOpen(true); }}>
                            <ArrowRightLeft className="h-4 w-4" />
                            <span>نقل</span>
                          </Button>
                        )}
                        <>
                          <Button variant="outline" size="sm" className={ACTION_EDIT_BUTTON_CLASS} title="تعديل" onClick={() => { setEditFund({ ...fund }); setEditOpen(true); }}>
                            <Edit2 className="h-4 w-4" />
                            <span>تعديل</span>
                          </Button>
                          <Button variant="outline" size="sm" className={ACTION_SELL_BUTTON_CLASS} title="بيع" onClick={() => { setSellFund(fund); setSellForm({ units: String(fund.units), sellPrice: live.toFixed(4), sellDate: todayStr(), customBrok: '', customVat: '', customPurification: '' }); setSellOpen(true); }}>
                            <ArrowDownRight className="h-4 w-4" />
                            <span>بيع</span>
                          </Button>
                          {!isReadOnly && (
                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(fund.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                          )}
                        </>
                      </div>
                      {/* 52-Week Range Bar */}
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
      <FundEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        fund={editFund}
        onChange={setEditFund as (f: SnapshotFund) => void}
        onSave={saveEdit}
        saving={saving}
      />

      {/* Move Dialog */}
      <FundMoveDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        itemName={moveItem?.name}
        targetPortfolioId={moveTargetPortfolioId}
        onTargetChange={setMoveTargetPortfolioId}
        portfolios={portfolios}
        sourcePortfolioId={assetPortfolioIdMap.get(moveItem?.id || '') || selectedPortfolioId || ''}
        onMove={moveToPortfolio}
        saving={saving}
      />

      {/* Sell Dialog */}
      <Dialog open={sellOpen} onOpenChange={setSellOpen}>
        <DialogContent dir="rtl"><DialogHeader><DialogTitle>بيع {sellFund?.name}</DialogTitle><DialogDescription>الكمية المتاحة: {sellFund?.units} وحدة</DialogDescription></DialogHeader>
          {sellFund && (<div className="grid gap-3">
            <div className="grid grid-cols-3 gap-3"><div><Label>كمية البيع</Label><Input type="number" value={sellForm.units} onChange={(e) => setSellForm((p) => ({ ...p, units: e.target.value }))} /></div><div><Label>سعر البيع</Label><Input type="number" value={sellForm.sellPrice} onChange={(e) => setSellForm((p) => ({ ...p, sellPrice: e.target.value }))} /></div><div><Label>تاريخ البيع</Label><Input type="date" value={sellForm.sellDate} onChange={(e) => setSellForm((p) => ({ ...p, sellDate: e.target.value }))} /></div></div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><div><Label>عمولة السمسرة ({sellCurrency})</Label><Input type="number" value={sellForm.customBrok} placeholder="تلقائي" onChange={(e) => setSellForm((p) => ({ ...p, customBrok: e.target.value }))} /></div><div><Label>ضريبة القيمة المضافة ({sellCurrency})</Label><Input type="number" value={sellForm.customVat} placeholder="تلقائي" onChange={(e) => setSellForm((p) => ({ ...p, customVat: e.target.value }))} /></div><div><Label>مبلغ التطهير ({sellCurrency})</Label><Input type="number" min="0" value={sellForm.customPurification} placeholder={sellProfitBeforePurificationCalc > 0 ? `تلقائي ${fmtN(sellPurificationAmountAutoCalc)}` : '0.00'} onChange={(e) => setSellForm((p) => ({ ...p, customPurification: e.target.value }))} /></div></div>
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
                <div className="flex items-center justify-between"><span className="text-muted-foreground">إجمالي تكلفة الشراء</span><span>{fmtN(sellCostBasisCalc)}</span></div>
                <div className={`mt-1 border-t pt-1 flex items-center justify-between font-bold ${(sellNetAfterPurification - sellCostBasisCalc) >= 0 ? 'text-green-600' : 'text-red-600'}`}><span>الربح/الخسارة الصافي</span><span>{(sellNetAfterPurification - sellCostBasisCalc) >= 0 ? '+' : ''}{fmtN(sellNetAfterPurification - sellCostBasisCalc)} {sellCurrency}</span></div>
                {sellPurificationLoading && (
                  <p className="mt-1 text-[10px] text-muted-foreground">جاري تحميل بيانات التطهير...</p>
                )}
                {!sellPurificationLoading && !sellPurification.found && (
                  <p className="mt-1 text-[10px] text-muted-foreground">لا تتوفر بيانات تطهير مباشرة لهذا الرمز، تم اعتماد قيمة 0%.</p>
                )}
              </div>
            </div>
          </div>)}
          <DialogFooter><Button variant="outline" onClick={() => setSellOpen(false)}>إلغاء</Button><Button onClick={executeSell} disabled={saving} className="bg-amber-600 hover:bg-amber-700">تنفيذ البيع</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <FundDeleteDialog
        id={deleteConfirmId}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
        onConfirm={() => { if (deleteConfirmId) { void removeFund(deleteConfirmId); setDeleteConfirmId(null); } }}
      />
    </div>
  );
}
