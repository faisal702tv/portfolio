'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { notifySuccess, notifyWarning, notifyInfo, notifyError } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { formatCurrencyByCode } from '@/lib/helpers';
import {
  Plus, Trash2, CheckCircle2, Edit2, GripVertical,
  Briefcase, BarChart3, TrendingUp, TrendingDown, Wallet,
  Coins, Gem, Landmark, CircleDollarSign, ArrowUpDown,
  Bitcoin, Diamond,
} from 'lucide-react';

interface StockItem {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  industry?: string;
  qty: number;
  buyPrice: number;
  currentPrice: number;
  change?: number;
  changePct?: number;
  totalCost: number;
  currentValue: number;
  profitLoss: number;
  profitLossPct: number;
  buyCurrency: string;
  exchange?: string;
}

interface FundItem {
  id: string;
  symbol: string;
  name: string;
  fundType?: string;
  units: number;
  buyPrice: number;
  currentPrice: number;
}

interface BondItem {
  id: string;
  symbol: string;
  name: string;
  type?: string;
  faceValue?: number;
  qty: number;
  buyPrice: number;
  currentPrice: number;
}

interface PortfolioItem {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  currency: string;
  isActive: boolean;
  totalValue: number;
  stockCount: number;
  bondCount: number;
  fundCount: number;
  stocks: StockItem[];
  bonds: BondItem[];
  funds: FundItem[];
}

const SELECTED_PORTFOLIO_KEY = 'selected_portfolio_id';
const PORTFOLIO_ORDER_KEY = 'portfolio_order_ids';

const EXCHANGE_RATES: Record<string, number> = {
  SAR: 1, USD: 3.75, EUR: 4.05, GBP: 4.75, AED: 1.02, KWD: 12.27, QAR: 1.03, BHD: 9.95, EGP: 0.074,
  JOD: 5.29, OMR: 9.74,
};

const CURRENCY_OPTIONS = [
  { code: 'SAR', label: 'ر.س (SAR) - ريال سعودي' },
  { code: 'AED', label: 'د.إ (AED) - درهم إماراتي' },
  { code: 'KWD', label: 'د.ك (KWD) - دينار كويتي' },
  { code: 'QAR', label: 'ر.ق (QAR) - ريال قطري' },
  { code: 'BHD', label: 'د.ب (BHD) - دينار بحريني' },
  { code: 'OMR', label: 'ر.ع (OMR) - ريال عماني' },
  { code: 'JOD', label: 'د.أ (JOD) - دينار أردني' },
  { code: 'EGP', label: 'ج.م (EGP) - جنيه مصري' },
  { code: 'USD', label: '$ (USD) - دولار أمريكي' },
  { code: 'EUR', label: '€ (EUR) - يورو' },
  { code: 'GBP', label: '£ (GBP) - جنيه إسترليني' },
] as const;

function normalizeCurrencyCode(value?: string | null): string {
  const code = String(value || '').trim().toUpperCase();
  return code || 'SAR';
}

function convertTo(amount: number, fromCurrency: string, toCurrency: string): number {
  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);
  const sarAmount = amount * (EXCHANGE_RATES[from] || 1);
  return sarAmount / (EXCHANGE_RATES[to] || 1);
}

function applyOrder<T extends { id: string }>(items: T[], orderedIds: string[]) {
  if (!orderedIds.length) return items;
  const map = new Map(items.map((item) => [item.id, item]));
  const ordered = orderedIds.map((id) => map.get(id)).filter(Boolean) as T[];
  const rest = items.filter((item) => !orderedIds.includes(item.id));
  return [...ordered, ...rest];
}

function persistPortfolioOrder(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PORTFOLIO_ORDER_KEY, JSON.stringify(ids));
}

function readPortfolioOrder(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PORTFOLIO_ORDER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function classifyStock(s: StockItem): 'stocks' | 'crypto' | 'forex' {
  const sec = (s.sector || '').toLowerCase();
  const exc = (s.exchange || '').toUpperCase();
  if (sec === 'cryptocurrency' || exc === 'CRYPTO') return 'crypto';
  if (sec === 'forex' || exc === 'FOREX') return 'forex';
  return 'stocks';
}

function classifyFund(f: FundItem): 'funds' | 'commodities' {
  if ((f.fundType || '').toLowerCase() === 'commodities') return 'commodities';
  return 'funds';
}

const typeLabels: Record<string, string> = {
  mixed: 'مختلطة', stocks: 'أسهم', funds: 'صناديق', bonds: 'صكوك/سندات',
  international: 'دولية', saudi: 'سعودية', crypto: 'عملات رقمية',
};

function SortablePortfolioCard({
  portfolio,
  saving,
  onSetActive,
  onRename,
  onDelete,
}: {
  portfolio: PortfolioItem;
  saving: boolean;
  onSetActive: (id: string) => void;
  onRename: (portfolio: PortfolioItem) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: portfolio.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const stats = useMemo(() => {
    const stocks = portfolio.stocks || [];
    const funds = portfolio.funds || [];
    const bonds = portfolio.bonds || [];
    const targetCurrency = portfolio.currency || 'SAR';

    let stockCount = 0, cryptoCount = 0, forexCount = 0;
    let fundCount = 0, commodityCount = 0;
    let totalPL = 0, totalCost = 0, totalValue = 0;

    for (const s of stocks) {
      const type = classifyStock(s);
      if (type === 'crypto') cryptoCount++;
      else if (type === 'forex') forexCount++;
      else stockCount++;
      const qty = s.qty || 0;
      const buy = s.buyPrice || 0;
      const cur = s.currentPrice || 0;
      const srcCur = s.buyCurrency || targetCurrency;
      const cost = convertTo(s.totalCost || buy * qty, srcCur, targetCurrency);
      const val = convertTo(s.currentValue || cur * qty, srcCur, targetCurrency);
      totalCost += cost;
      totalValue += val;
      totalPL += val - cost;
    }
    for (const f of funds) {
      const type = classifyFund(f);
      if (type === 'commodities') commodityCount++;
      else fundCount++;
      const units = f.units || 0;
      const buy = f.buyPrice || 0;
      const cur = f.currentPrice || 0;
      const srcCur = portfolio.currency || 'SAR';
      const cost = convertTo(buy * units, srcCur, targetCurrency);
      const val = convertTo(cur * units, srcCur, targetCurrency);
      totalCost += cost;
      totalValue += val;
      totalPL += val - cost;
    }
    for (const b of bonds) {
      const qty = b.qty || 0;
      const buy = b.buyPrice || 0;
      const cur = b.currentPrice || 0;
      const srcCur = portfolio.currency || 'SAR';
      const cost = convertTo(buy * qty, srcCur, targetCurrency);
      const val = convertTo(cur * qty, srcCur, targetCurrency);
      totalCost += cost;
      totalValue += val;
      totalPL += val - cost;
    }

    const plPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    return { stockCount, cryptoCount, forexCount, fundCount, commodityCount, bondCount: bonds.length, totalPL, totalCost, totalValue, plPct, currency: targetCurrency };
  }, [portfolio]);

  const isProfit = stats.totalPL >= 0;

  return (
    <Card ref={setNodeRef} style={style} className={cn(
      "group relative overflow-hidden transition-all hover:shadow-lg",
      portfolio.isActive && "ring-2 ring-primary shadow-md"
    )}>
      {portfolio.isActive && (
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-green-500 via-emerald-500 to-teal-500" />
      )}
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <button type="button" className="mt-2 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing" {...attributes} {...listeners}>
            <GripVertical className="h-5 w-5" />
          </button>

          <div className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold",
            portfolio.isActive
              ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25"
              : "bg-muted text-muted-foreground"
          )}>
            {portfolio.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-base truncate">{portfolio.name}</h3>
              {portfolio.isActive && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0 text-[10px]">نشطة</Badge>}
              <Badge variant="outline" className="text-[10px]">{typeLabels[portfolio.type] || portfolio.type}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-2 text-sm">
              {stats.stockCount > 0 && (
                <div className="flex items-center gap-1">
                  <Landmark className="h-3 w-3 text-blue-500" />
                  <span className="text-muted-foreground">أسهم</span>
                  <span className="font-semibold">{stats.stockCount}</span>
                </div>
              )}
              {stats.cryptoCount > 0 && (
                <div className="flex items-center gap-1">
                  <Bitcoin className="h-3 w-3 text-orange-500" />
                  <span className="text-muted-foreground">كريبتو</span>
                  <span className="font-semibold">{stats.cryptoCount}</span>
                </div>
              )}
              {stats.forexCount > 0 && (
                <div className="flex items-center gap-1">
                  <CircleDollarSign className="h-3 w-3 text-cyan-500" />
                  <span className="text-muted-foreground">فوركس</span>
                  <span className="font-semibold">{stats.forexCount}</span>
                </div>
              )}
              {stats.fundCount > 0 && (
                <div className="flex items-center gap-1">
                  <Gem className="h-3 w-3 text-amber-500" />
                  <span className="text-muted-foreground">صناديق</span>
                  <span className="font-semibold">{stats.fundCount}</span>
                </div>
              )}
              {stats.commodityCount > 0 && (
                <div className="flex items-center gap-1">
                  <Diamond className="h-3 w-3 text-yellow-600" />
                  <span className="text-muted-foreground">سلع</span>
                  <span className="font-semibold">{stats.commodityCount}</span>
                </div>
              )}
              {stats.bondCount > 0 && (
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-purple-500" />
                  <span className="text-muted-foreground">سندات</span>
                  <span className="font-semibold">{stats.bondCount}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">القيمة</span>
                <span className="font-bold text-sm">{formatCurrencyByCode(stats.totalValue, stats.currency)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">التكلفة</span>
                <span className="font-medium text-sm text-muted-foreground">{formatCurrencyByCode(stats.totalCost, stats.currency)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground">الربح/الخسارة</span>
                <span className={cn("font-bold text-sm", isProfit ? "text-green-600" : "text-red-600")}>
                  {isProfit ? '+' : ''}{formatCurrencyByCode(stats.totalPL, stats.currency)}
                  <span className="text-[10px] mr-1">({isProfit ? '+' : ''}{stats.plPct.toFixed(2)}%)</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            {!portfolio.isActive && (
              <Button size="sm" variant="outline" onClick={() => onSetActive(portfolio.id)} disabled={saving} className="gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                تفعيل
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => onRename(portfolio)} disabled={saving} className="h-7 w-7 p-0">
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(portfolio.id)} disabled={saving} className="h-7 w-7 p-0">
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PortfoliosPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [summaryCurrency, setSummaryCurrency] = useState('SAR');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioItem | null>(null);
  const [editingName, setEditingName] = useState('');
  const [form, setForm] = useState({ name: '', description: '', type: 'mixed', currency: 'SAR' });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const loadPortfolios = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const response = await fetch('/api/portfolios', {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'فشل تحميل المحافظ');
      const list = Array.isArray(data?.portfolios) ? data.portfolios : [];
      setPortfolios(applyOrder(list as PortfolioItem[], readPortfolioOrder()));
    } catch (error) {
      toast({ title: 'خطأ', description: error instanceof Error ? error.message : 'تعذر تحميل المحافظ', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadPortfolios(); }, []);

  useEffect(() => {
    const activePortfolio = portfolios.find((p) => p.isActive);
    if (activePortfolio?.currency) {
      setSummaryCurrency((prev) => (prev === 'SAR' ? normalizeCurrencyCode(activePortfolio.currency) : prev));
    }
  }, [portfolios]);

  const createPortfolio = async () => {
    if (!form.name.trim()) { toast({ title: 'اسم المحفظة مطلوب', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'create', ...form, makeActive: portfolios.length === 0 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'فشل إنشاء المحفظة');
      setForm({ name: '', description: '', type: 'mixed', currency: normalizeCurrencyCode(summaryCurrency) });
      await loadPortfolios();
      if (data?.portfolio?.id && typeof window !== 'undefined') localStorage.setItem(SELECTED_PORTFOLIO_KEY, data.portfolio.id);
      toast({ title: 'تمت الإضافة', description: 'تم إنشاء المحفظة الجديدة بنجاح.' });
      notifySuccess('تمت إضافة محفظة', 'تم إنشاء المحفظة الجديدة بنجاح', { source: 'portfolios' });
    } catch (error) {
      toast({ title: 'تعذر الإضافة', description: error instanceof Error ? error.message : 'حدث خطأ', variant: 'destructive' });
      notifyError('فشل إنشاء المحفظة', error instanceof Error ? error.message : 'حدث خطأ أثناء الإنشاء', { source: 'portfolios' });
    } finally { setSaving(false); }
  };

  const setActivePortfolio = async (id: string) => {
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const response = await fetch('/api/portfolios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id, isActive: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'فشل تفعيل المحفظة');
      if (typeof window !== 'undefined') localStorage.setItem(SELECTED_PORTFOLIO_KEY, id);
      await loadPortfolios();
      toast({ title: 'تم التفعيل', description: 'أصبحت هذه هي المحفظة الافتراضية.' });
    } catch (error) {
      toast({ title: 'تعذر التفعيل', description: error instanceof Error ? error.message : 'حدث خطأ', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const deletePortfolio = async (id: string) => {
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const response = await fetch(`/api/portfolios?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'فشل حذف المحفظة');
      if (typeof window !== 'undefined' && localStorage.getItem(SELECTED_PORTFOLIO_KEY) === id) localStorage.removeItem(SELECTED_PORTFOLIO_KEY);
      await loadPortfolios();
      toast({ title: 'تم الحذف', description: 'تم حذف المحفظة بنجاح.' });
      notifyWarning('تم حذف محفظة', 'تم حذف المحفظة من حسابك', { source: 'portfolios' });
    } catch (error) {
      toast({ title: 'تعذر الحذف', description: error instanceof Error ? error.message : 'حدث خطأ', variant: 'destructive' });
      notifyError('فشل حذف المحفظة', error instanceof Error ? error.message : 'حدث خطأ أثناء الحذف', { source: 'portfolios' });
    } finally { setSaving(false); }
  };

  const openRenameDialog = (portfolio: PortfolioItem) => {
    setEditingPortfolio(portfolio);
    setEditingName(portfolio.name);
    setShowEditDialog(true);
  };

  const renamePortfolio = async () => {
    if (!editingPortfolio) return;
    const nextName = editingName.trim();
    if (!nextName) { toast({ title: 'اسم المحفظة مطلوب', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const response = await fetch('/api/portfolios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id: editingPortfolio.id, name: nextName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'فشل تعديل الاسم');
      await loadPortfolios();
      setShowEditDialog(false);
      setEditingPortfolio(null);
      toast({ title: 'تم التعديل', description: 'تم تحديث اسم المحفظة.' });
    } catch (error) {
      toast({ title: 'تعذر التعديل', description: error instanceof Error ? error.message : 'حدث خطأ', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const globalStats = useMemo(() => {
    const displayCurrency = normalizeCurrencyCode(summaryCurrency);

    let totalValue = 0, totalCost = 0, totalStocks = 0, totalCrypto = 0, totalForex = 0;
    let totalFunds = 0, totalCommodities = 0, totalBonds = 0;
    for (const p of portfolios) {
      const pCur = p.currency || 'SAR';
      for (const s of (p.stocks || [])) {
        const t = classifyStock(s);
        if (t === 'crypto') totalCrypto++;
        else if (t === 'forex') totalForex++;
        else totalStocks++;
        const qty = s.qty || 0;
        const srcCur = s.buyCurrency || pCur;
        totalCost += convertTo(s.totalCost || (s.buyPrice || 0) * qty, srcCur, displayCurrency);
        totalValue += convertTo(s.currentValue || (s.currentPrice || 0) * qty, srcCur, displayCurrency);
      }
      for (const f of (p.funds || [])) {
        const t = classifyFund(f);
        if (t === 'commodities') totalCommodities++;
        else totalFunds++;
        const units = f.units || 0;
        totalCost += convertTo((f.buyPrice || 0) * units, pCur, displayCurrency);
        totalValue += convertTo((f.currentPrice || 0) * units, pCur, displayCurrency);
      }
      for (const b of (p.bonds || [])) {
        totalBonds++;
        const qty = b.qty || 0;
        totalCost += convertTo((b.buyPrice || 0) * qty, pCur, displayCurrency);
        totalValue += convertTo((b.currentPrice || 0) * qty, pCur, displayCurrency);
      }
    }
    const totalPL = totalValue - totalCost;
    const plPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    const totalAssets = totalStocks + totalCrypto + totalForex + totalFunds + totalCommodities + totalBonds;
    return { totalValue, totalCost, totalPL, plPct, totalAssets, totalStocks, totalCrypto, totalForex, totalFunds, totalCommodities, totalBonds, currency: displayCurrency };
  }, [portfolios, summaryCurrency]);

  const handleReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPortfolios((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      persistPortfolioOrder(next.map((item) => item.id));
      return next;
    });
  };

  const isProfit = globalStats.totalPL >= 0;
  const plPct = globalStats.plPct;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 transition-all duration-300 lg:mr-64">
        <TopBar title="إدارة المحافظ" />
        <main className="space-y-6 p-6">

          <Card className="border-dashed">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div>
                <p className="text-sm font-medium">عملة الملخص الموحد</p>
                <p className="text-xs text-muted-foreground">يتم تحويل إجماليات جميع المحافظ للعملة المختارة.</p>
              </div>
              <div className="w-full sm:w-[300px]">
                <Select value={summaryCurrency} onValueChange={(value) => setSummaryCurrency(normalizeCurrencyCode(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((item) => (
                      <SelectItem key={`summary-currency-${item.code}`} value={item.code}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="border-blue-200 dark:border-blue-800/50">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">المحافظ</p>
                  <p className="text-xl font-bold">{portfolios.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800/50">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">الأصول</p>
                  <p className="text-xl font-bold">{globalStats.totalAssets}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-200 dark:border-amber-800/50">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2">
                  <Wallet className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">القيمة</p>
                  <p className="text-lg font-bold">{formatCurrencyByCode(globalStats.totalValue, globalStats.currency)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className={cn(isProfit ? "border-green-200 dark:border-green-800/50" : "border-red-200 dark:border-red-800/50")}>
              <CardContent className="p-3 flex items-center gap-2">
                <div className={cn("rounded-lg p-2", isProfit ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                  {isProfit ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">الربح/الخسارة</p>
                  <p className={cn("text-lg font-bold", isProfit ? "text-green-600" : "text-red-600")}>
                    {isProfit ? '+' : ''}{formatCurrencyByCode(globalStats.totalPL, globalStats.currency)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-cyan-200 dark:border-cyan-800/50">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="rounded-lg bg-cyan-100 dark:bg-cyan-900/30 p-2">
                  <ArrowUpDown className="h-4 w-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">نسبة التغير</p>
                  <p className={cn("text-lg font-bold", isProfit ? "text-green-600" : "text-red-600")}>
                    {isProfit ? '+' : ''}{plPct.toFixed(2)}%
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 dark:border-purple-800/50">
              <CardContent className="p-3 flex items-center gap-2">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
                  <Coins className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">التكلفة</p>
                  <p className="text-lg font-bold">{formatCurrencyByCode(globalStats.totalCost, globalStats.currency)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {globalStats.totalStocks > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border p-2">
                <Landmark className="h-3.5 w-3.5 text-blue-500" />
                <div>
                  <p className="text-[10px] text-muted-foreground">أسهم</p>
                  <p className="font-bold text-sm">{globalStats.totalStocks}</p>
                </div>
              </div>
            )}
            {globalStats.totalCrypto > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border p-2">
                <Bitcoin className="h-3.5 w-3.5 text-orange-500" />
                <div>
                  <p className="text-[10px] text-muted-foreground">كريبتو</p>
                  <p className="font-bold text-sm">{globalStats.totalCrypto}</p>
                </div>
              </div>
            )}
            {globalStats.totalForex > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border p-2">
                <CircleDollarSign className="h-3.5 w-3.5 text-cyan-500" />
                <div>
                  <p className="text-[10px] text-muted-foreground">فوركس</p>
                  <p className="font-bold text-sm">{globalStats.totalForex}</p>
                </div>
              </div>
            )}
            {globalStats.totalFunds > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border p-2">
                <Gem className="h-3.5 w-3.5 text-amber-500" />
                <div>
                  <p className="text-[10px] text-muted-foreground">صناديق</p>
                  <p className="font-bold text-sm">{globalStats.totalFunds}</p>
                </div>
              </div>
            )}
            {globalStats.totalCommodities > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border p-2">
                <Diamond className="h-3.5 w-3.5 text-yellow-600" />
                <div>
                  <p className="text-[10px] text-muted-foreground">سلع/معادن</p>
                  <p className="font-bold text-sm">{globalStats.totalCommodities}</p>
                </div>
              </div>
            )}
            {globalStats.totalBonds > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border p-2">
                <Coins className="h-3.5 w-3.5 text-purple-500" />
                <div>
                  <p className="text-[10px] text-muted-foreground">سندات</p>
                  <p className="font-bold text-sm">{globalStats.totalBonds}</p>
                </div>
              </div>
            )}
          </div>

          {/* P&L Progress Bar */}
          {globalStats.totalCost > 0 && (
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">نسبة الربح/الخسارة الإجمالية</span>
                <span className={cn("text-sm font-bold", isProfit ? "text-green-600" : "text-red-600")}>
                  {isProfit ? '+' : ''}{formatCurrencyByCode(globalStats.totalPL, globalStats.currency)} ({isProfit ? '+' : ''}{plPct.toFixed(2)}%)
                </span>
              </div>
              <Progress value={Math.min(Math.abs(plPct), 100)} className={cn("h-3", isProfit ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500")} />
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>التكلفة: {formatCurrencyByCode(globalStats.totalCost, globalStats.currency)}</span>
                <span>القيمة: {formatCurrencyByCode(globalStats.totalValue, globalStats.currency)}</span>
              </div>
            </Card>
          )}

          {/* Add Portfolio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" />
                إضافة محفظة جديدة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">اسم المحفظة</Label>
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="مثال: محفظة النمو" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">النوع</Label>
                  <Select value={form.type} onValueChange={(value) => setForm((p) => ({ ...p, type: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">مختلطة</SelectItem>
                      <SelectItem value="stocks">أسهم</SelectItem>
                      <SelectItem value="funds">صناديق</SelectItem>
                      <SelectItem value="bonds">صكوك/سندات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">العملة</Label>
                  <Select value={normalizeCurrencyCode(form.currency)} onValueChange={(value) => setForm((p) => ({ ...p, currency: normalizeCurrencyCode(value) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((item) => (
                        <SelectItem key={`portfolio-currency-${item.code}`} value={item.code}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={createPortfolio} disabled={saving} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    إنشاء
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الوصف (اختياري)</Label>
                <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="مثال: محفظة للاستثمار طويل الأجل" />
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Cards Grid */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">كل المحافظ — اسحب للترتيب</h3>
            {loading && <p className="text-muted-foreground text-sm">جاري التحميل...</p>}
            {!loading && portfolios.length === 0 && <p className="text-muted-foreground text-sm">لا توجد محافظ بعد.</p>}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorder}>
              <SortableContext items={portfolios.map((item) => item.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {portfolios.map((portfolio) => (
                    <SortablePortfolioCard
                      key={portfolio.id}
                      portfolio={portfolio}
                      saving={saving}
                      onSetActive={(id) => void setActivePortfolio(id)}
                      onRename={openRenameDialog}
                      onDelete={(id) => void deletePortfolio(id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </main>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل اسم المحفظة</DialogTitle>
            <DialogDescription>اكتب الاسم الجديد للمحفظة</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>اسم المحفظة</Label>
            <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>إلغاء</Button>
            <Button onClick={() => void renamePortfolio()} disabled={saving || !editingName.trim()}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
