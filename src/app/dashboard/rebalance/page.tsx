'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/Sidebar';
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
  Loader2,
  RefreshCw,
  Target,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { formatCurrencyByCode, formatNumber } from '@/lib/helpers';
import { cn } from '@/lib/utils';

const RebalanceDonut = dynamic(
  () => import('@/components/rebalance/RebalanceDonut').then((m) => m.RebalanceDonut),
  { ssr: false }
);

type AllocationMode = 'sector' | 'asset';

type StockItem = {
  symbol: string;
  name: string;
  sector?: string | null;
  qty: number;
  buyPrice: number;
  currentPrice?: number | null;
};

type BondItem = {
  symbol: string;
  name: string;
  type?: string | null;
  qty: number;
  faceValue: number;
  buyPrice: number;
  currentPrice?: number | null;
};

type FundItem = {
  symbol: string;
  name: string;
  fundType?: string | null;
  units: number;
  buyPrice: number;
  currentPrice?: number | null;
};

type PortfolioApiItem = {
  id: string;
  name: string;
  currency: string;
  stocks: StockItem[];
  bonds: BondItem[];
  funds: FundItem[];
  targetAllocation?: {
    mode: AllocationMode;
    entries: { key: string; label: string; weight: number }[];
    updatedAt?: string;
  } | null;
};

type AllocationRow = {
  key: string;
  label: string;
  currentValue: number;
  currentWeight: number;
  targetWeight: number;
};

type RebalanceAction = {
  key: string;
  label: string;
  currentWeight: number;
  targetWeight: number;
  diffWeight: number;
  amount: number;
  action: 'buy' | 'sell' | 'hold';
};

const CHART_COLORS = [
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#8b5cf6',
  '#6366f1',
  '#ec4899',
  '#06b6d4',
];

function stockValue(item: StockItem): number {
  const price = item.currentPrice ?? item.buyPrice;
  return Number(item.qty) * Number(price);
}

function fundValue(item: FundItem): number {
  const price = item.currentPrice ?? item.buyPrice;
  return Number(item.units) * Number(price);
}

function bondValue(item: BondItem): number {
  const pricePct = item.currentPrice ?? item.buyPrice;
  return Number(item.qty) * Number(item.faceValue) * (Number(pricePct) / 100);
}

function computePortfolioValue(portfolio: PortfolioApiItem | null): number {
  if (!portfolio) return 0;
  const stocks = portfolio.stocks.reduce((sum, item) => sum + stockValue(item), 0);
  const funds = portfolio.funds.reduce((sum, item) => sum + fundValue(item), 0);
  const bonds = portfolio.bonds.reduce((sum, item) => sum + bondValue(item), 0);
  return stocks + funds + bonds;
}

function buildAllocationRows(portfolio: PortfolioApiItem | null, mode: AllocationMode): AllocationRow[] {
  if (!portfolio) return [];
  const map = new Map<string, { label: string; value: number }>();

  const add = (key: string, label: string, value: number) => {
    const prev = map.get(key);
    if (prev) {
      prev.value += value;
      return;
    }
    map.set(key, { label, value });
  };

  if (mode === 'asset') {
    portfolio.stocks.forEach((item) => add(`stock:${item.symbol}`, `${item.symbol} · ${item.name}`, stockValue(item)));
    portfolio.funds.forEach((item) => add(`fund:${item.symbol}`, `${item.symbol} · ${item.name}`, fundValue(item)));
    portfolio.bonds.forEach((item) => add(`bond:${item.symbol}`, `${item.symbol} · ${item.name}`, bondValue(item)));
  } else {
    portfolio.stocks.forEach((item) => {
      const sector = item.sector?.trim() || 'أسهم غير مصنفة';
      add(`sector:stock:${sector}`, sector, stockValue(item));
    });
    portfolio.funds.forEach((item) => {
      const fundType = item.fundType?.trim() || 'صناديق';
      add(`sector:fund:${fundType}`, `صناديق · ${fundType}`, fundValue(item));
    });
    portfolio.bonds.forEach((item) => {
      const bondType = (item.type || '').toLowerCase() === 'sukuk' ? 'صكوك' : 'سندات';
      add(`sector:bond:${bondType}`, bondType, bondValue(item));
    });
  }

  const total = Array.from(map.values()).reduce((sum, item) => sum + item.value, 0);
  const rows = Array.from(map.entries()).map(([key, item]) => ({
    key,
    label: item.label,
    currentValue: item.value,
    currentWeight: total > 0 ? (item.value / total) * 100 : 0,
    targetWeight: 0,
  }));

  return rows.sort((a, b) => b.currentValue - a.currentValue);
}

export default function RebalancePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioApiItem[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [mode, setMode] = useState<AllocationMode>('sector');
  const [targetWeightsByContext, setTargetWeightsByContext] = useState<Record<string, Record<string, number>>>({});

  const selectedPortfolio = useMemo(
    () => portfolios.find((item) => item.id === selectedPortfolioId) ?? null,
    [portfolios, selectedPortfolioId]
  );

  const currentRows = useMemo(
    () => buildAllocationRows(selectedPortfolio, mode),
    [selectedPortfolio, mode]
  );

  const rebalanceContextKey = `${selectedPortfolioId || 'none'}:${mode}`;

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const response = await fetch('/api/portfolios', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'تعذر تحميل المحافظ.');

        const list = (data.portfolios || []) as PortfolioApiItem[];
        if (!isMounted) return;
        setPortfolios(list);
        if (list.length) {
          setSelectedPortfolioId((prev) => prev || list[0].id);
        }
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'تعذر تحميل البيانات.';
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const savedTargetWeights = useMemo(() => {
    const initial: Record<string, number> = {};
    if (!selectedPortfolio) return initial;

    const saved = selectedPortfolio.targetAllocation;
    if (saved && saved.mode === mode && Array.isArray(saved.entries)) {
      saved.entries.forEach((entry) => {
        if (entry && typeof entry.key === 'string') {
          const value = Number(entry.weight);
          if (Number.isFinite(value) && value >= 0) {
            initial[entry.key] = value;
          }
        }
      });
    }

    currentRows.forEach((row) => {
      if (initial[row.key] == null) {
        initial[row.key] = row.currentWeight;
      }
    });

    return initial;
  }, [selectedPortfolio, mode, currentRows]);

  const activeTargetWeights = targetWeightsByContext[rebalanceContextKey] ?? savedTargetWeights;

  const setActiveTargetWeights = (next: Record<string, number>) => {
    setTargetWeightsByContext((prev) => ({
      ...prev,
      [rebalanceContextKey]: next,
    }));
  };

  const rows = useMemo<AllocationRow[]>(() => {
    return currentRows.map((row) => ({
      ...row,
      targetWeight: Number.isFinite(activeTargetWeights[row.key]) ? activeTargetWeights[row.key] : row.currentWeight,
    }));
  }, [currentRows, activeTargetWeights]);

  const totalValue = useMemo(() => computePortfolioValue(selectedPortfolio), [selectedPortfolio]);

  const targetTotal = useMemo(
    () => rows.reduce((sum, row) => sum + (Number.isFinite(row.targetWeight) ? row.targetWeight : 0), 0),
    [rows]
  );

  const recommendations = useMemo<RebalanceAction[]>(() => {
    return rows
      .map((row) => {
        const diffWeight = row.targetWeight - row.currentWeight;
        const amount = (diffWeight / 100) * totalValue;
        const action: RebalanceAction['action'] =
          Math.abs(diffWeight) < 0.5 ? 'hold' : diffWeight > 0 ? 'buy' : 'sell';
        return {
          key: row.key,
          label: row.label,
          currentWeight: row.currentWeight,
          targetWeight: row.targetWeight,
          diffWeight,
          amount,
          action,
        };
      })
      .sort((a, b) => Math.abs(b.diffWeight) - Math.abs(a.diffWeight));
  }, [rows, totalValue]);

  const actionsCount = useMemo(
    () => recommendations.filter((item) => item.action !== 'hold').length,
    [recommendations]
  );

  const normalizeTargets = () => {
    if (!rows.length) return;
    const currentTotal = rows.reduce((sum, row) => sum + Math.max(0, row.targetWeight), 0);
    if (currentTotal <= 0) {
      const equal = 100 / rows.length;
      const next: Record<string, number> = {};
      rows.forEach((row) => { next[row.key] = equal; });
      setActiveTargetWeights(next);
      return;
    }
    const next: Record<string, number> = {};
    rows.forEach((row) => {
      next[row.key] = (Math.max(0, row.targetWeight) / currentTotal) * 100;
    });
    setActiveTargetWeights(next);
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/portfolios', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر تحديث البيانات.');
      setPortfolios((data.portfolios || []) as PortfolioApiItem[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'تعذر تحديث البيانات.';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  };

  const saveTargets = async () => {
    if (!selectedPortfolio) return;
    try {
      setSaving(true);
      setError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const payload = {
        id: selectedPortfolio.id,
        targetAllocation: {
          mode,
          updatedAt: new Date().toISOString(),
          entries: rows
            .map((row) => ({
              key: row.key,
              label: row.label,
              weight: Number(row.targetWeight.toFixed(4)),
            }))
            .filter((entry) => entry.weight >= 0),
        },
      };

      const response = await fetch('/api/portfolios', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'تعذر حفظ التوزيع المستهدف.');
      await refreshData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'تعذر حفظ التوزيع المستهدف.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const chartCurrent = rows.map((row) => ({ name: row.label, value: row.currentWeight }));
  const chartTarget = rows.map((row) => ({ name: row.label, value: row.targetWeight }));

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar
          title="إعادة التوازن الذكي"
          subtitle="مقارنة التوزيع الحالي والمستهدف مع توصيات شراء/بيع تنفيذية"
          onRefresh={refreshData}
          isRefreshing={refreshing}
        />

        <main className="p-4 md:p-6 space-y-6">
          {loading ? (
            <Card>
              <CardContent className="p-8 flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>جارٍ تحميل بيانات إعادة التوازن...</span>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">القيمة الحالية للمحفظة</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrencyByCode(totalValue, selectedPortfolio?.currency || 'SAR')}
                    </p>
                  </CardContent>
                </Card>
                <Card className={cn(
                  'border-2',
                  Math.abs(targetTotal - 100) < 0.2 ? 'border-emerald-300 dark:border-emerald-800' : 'border-amber-300 dark:border-amber-800'
                )}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">مجموع الأوزان المستهدفة</p>
                    <p className="text-2xl font-bold">{formatNumber(targetTotal, 2)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.abs(targetTotal - 100) < 0.2 ? 'موزون بشكل صحيح' : 'يفضّل تعديل المجموع إلى 100%'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-sky-200 dark:border-sky-800">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">توصيات تنفيذية</p>
                    <p className="text-2xl font-bold text-sky-600">{actionsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">شراء/بيع مطلوبة للوصول للهدف</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    إعدادات إعادة التوازن
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>المحفظة</Label>
                      <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المحفظة" />
                        </SelectTrigger>
                        <SelectContent>
                          {portfolios.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>نوع التوزيع</Label>
                      <Select value={mode} onValueChange={(value) => setMode(value as AllocationMode)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sector">حسب القطاع/الفئة</SelectItem>
                          <SelectItem value="asset">حسب كل أصل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end gap-2">
                      <Button variant="outline" className="w-full" onClick={normalizeTargets}>
                        <RefreshCw className="h-4 w-4 me-2" />
                        موازنة إلى 100%
                      </Button>
                      <Button className="w-full" onClick={saveTargets} disabled={saving || !selectedPortfolio}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <CheckCircle2 className="h-4 w-4 me-2" />}
                        حفظ التوزيع
                      </Button>
                    </div>
                  </div>
                  {error && (
                    <div className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-md p-3">
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">التوزيع الحالي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RebalanceDonut data={chartCurrent} colors={CHART_COLORS} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">التوزيع المستهدف</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RebalanceDonut data={chartTarget} colors={CHART_COLORS} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">فجوات الأوزان (Current vs Target)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rows.map((row) => {
                    const diff = row.targetWeight - row.currentWeight;
                    const colorClass = diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-muted-foreground';
                    return (
                      <div key={row.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center border rounded-lg p-3">
                        <div className="md:col-span-4">
                          <p className="font-medium">{row.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrencyByCode(row.currentValue, selectedPortfolio?.currency || 'SAR')}
                          </p>
                        </div>
                        <div className="md:col-span-2 text-sm">
                          <p className="text-muted-foreground">الحالي</p>
                          <p className="font-semibold">{formatNumber(row.currentWeight, 2)}%</p>
                        </div>
                        <div className="md:col-span-3">
                          <Label className="text-xs text-muted-foreground">المستهدف %</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.1"
                            value={Number.isFinite(row.targetWeight) ? row.targetWeight : 0}
                            onChange={(event) => {
                              const numeric = Number(event.target.value);
                              setActiveTargetWeights({
                                ...activeTargetWeights,
                                [row.key]: Number.isFinite(numeric) ? Math.max(0, numeric) : 0,
                              });
                            }}
                          />
                        </div>
                        <div className="md:col-span-3 text-sm md:text-end">
                          <p className="text-muted-foreground">الفارق</p>
                          <p className={cn('font-bold', colorClass)}>
                            {diff > 0 ? '+' : ''}{formatNumber(diff, 2)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">التوصيات الإجرائية (Actionable Insights)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendations.map((item) => (
                    <div key={item.key} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border rounded-lg p-3">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          الحالي: {formatNumber(item.currentWeight, 2)}% | المستهدف: {formatNumber(item.targetWeight, 2)}%
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.action === 'buy' && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <TrendingUp className="h-3.5 w-3.5 me-1" />
                            شراء
                          </Badge>
                        )}
                        {item.action === 'sell' && (
                          <Badge className="bg-rose-600 hover:bg-rose-700 text-white">
                            <TrendingDown className="h-3.5 w-3.5 me-1" />
                            بيع
                          </Badge>
                        )}
                        {item.action === 'hold' && (
                          <Badge variant="outline">احتفاظ</Badge>
                        )}
                        <span className={cn(
                          'text-sm font-semibold',
                          item.amount > 0 ? 'text-emerald-600' : item.amount < 0 ? 'text-rose-600' : 'text-muted-foreground'
                        )}>
                          {formatCurrencyByCode(Math.abs(item.amount), selectedPortfolio?.currency || 'SAR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
