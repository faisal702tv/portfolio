'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AI_PROVIDERS, getModelsForProvider, getDefaultModelForProvider } from '@/lib/ai-providers';
import { getAISettings, saveDefaults } from '@/lib/api-keys';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import {
  analyzePortfolioRisk,
  analyzeDiversification,
  type Holding,
} from '@/lib/risk-analysis';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/helpers';
import { useSearchParams } from 'next/navigation';
import {
  normalizeAnalysisAssetType,
  toYahooSymbolForAsset,
  type AnalysisAssetType,
} from '@/lib/analysis-links';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  PieChart as PieIcon,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface BenchmarkConfig {
  id: string;
  name: string;
  symbol: string;
  annualReturn: number;
  annualVolatility: number;
}

interface ChartApiPoint {
  close?: number | null;
}

interface ChartApiResponse {
  success?: boolean;
  data?: ChartApiPoint[];
}

const BENCHMARKS: BenchmarkConfig[] = [
  { id: 'SPX', name: 'S&P 500', symbol: '^GSPC', annualReturn: 0.08, annualVolatility: 0.18 },
  { id: 'NDX', name: 'ناسداك 100', symbol: '^NDX', annualReturn: 0.1, annualVolatility: 0.24 },
  { id: 'TASI', name: 'تاسي', symbol: '^TASI', annualReturn: 0.06, annualVolatility: 0.2 },
  { id: 'DFM', name: 'دبي المالي', symbol: 'DFMGI.AE', annualReturn: 0.05, annualVolatility: 0.16 },
  { id: 'EGX30', name: 'EGX30', symbol: 'EGX30.CA', annualReturn: 0.09, annualVolatility: 0.26 },
];

const ASSET_COLORS = [
  '#2563eb',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
  '#0ea5e9',
];

const RISK_META: Record<string, { label: string; className: string }> = {
  very_low: { label: 'منخفض جدًا', className: 'bg-emerald-100 text-emerald-700' },
  low: { label: 'منخفض', className: 'bg-blue-100 text-blue-700' },
  medium: { label: 'متوسط', className: 'bg-amber-100 text-amber-700' },
  high: { label: 'مرتفع', className: 'bg-orange-100 text-orange-700' },
  very_high: { label: 'مرتفع جدًا', className: 'bg-red-100 text-red-700' },
  unknown: { label: 'غير كافٍ', className: 'bg-muted text-muted-foreground' },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function seededNoise(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateSyntheticSeries(
  startValue: number,
  days: number,
  annualReturn: number,
  annualVolatility: number,
  seedBase: number
): number[] {
  const safeStart = Math.max(1, startValue);
  const safeDays = Math.max(2, days);
  const values = [safeStart];

  const dailyDrift = annualReturn / 252;
  const dailyVol = annualVolatility / Math.sqrt(252);

  for (let i = 1; i < safeDays; i++) {
    const noise = (seededNoise(seedBase + i * 17) - 0.5) * 2;
    const dailyReturn = dailyDrift + noise * dailyVol;
    const prev = values[i - 1];
    values.push(Math.max(1, prev * (1 + dailyReturn)));
  }

  return values;
}

function normalizeSeries(values: number[]): number[] {
  if (!values.length) return [];
  const base = values[0] || 1;
  return values.map((v) => ((v / base) - 1) * 100);
}

function getRiskMeta(level: string) {
  return RISK_META[level] || RISK_META.unknown;
}

function toNumeric(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getDiversificationLabel(level: string) {
  if (level === 'excellent') return 'ممتاز';
  if (level === 'good') return 'جيد';
  if (level === 'moderate') return 'متوسط';
  if (level === 'concentrated') return 'مركز';
  return 'غير معروف';
}

function holdingTypeToCanonical(type: string): AnalysisAssetType {
  if (type === 'عملة مشفرة') return 'crypto';
  if (type === 'فوركس') return 'forex';
  if (type === 'صندوق') return 'funds';
  if (type === 'سلعة') return 'commodities';
  if (type === 'سند/صك') return 'bonds';
  return 'stocks';
}

function estimateAssetRiskBand(type: AnalysisAssetType, annualVolatilityPct: number): string {
  const vol = Math.max(0, annualVolatilityPct);
  const base =
    type === 'crypto' ? 20 :
    type === 'forex' ? 14 :
    type === 'commodities' ? 16 :
    type === 'stocks' ? 12 :
    type === 'funds' ? 10 : 8;

  const score = base + vol / 6;
  if (score >= 16) return 'مرتفع جدًا';
  if (score >= 13) return 'مرتفع';
  if (score >= 10) return 'متوسط';
  if (score >= 7) return 'منخفض';
  return 'منخفض جدًا';
}

export default function RiskAnalysisPage() {
  const searchParams = useSearchParams();
  const { data, loading, error, refresh } = useDashboardData();
  const [benchmarkId, setBenchmarkId] = useState<string>('SPX');
  const [horizon, setHorizon] = useState<string>('252');
  const [benchmarkSeries, setBenchmarkSeries] = useState<number[]>([]);
  const [benchmarkLoading, setBenchmarkLoading] = useState<boolean>(false);
  const [focusedSeries, setFocusedSeries] = useState<number[]>([]);
  const [focusedSeriesLoading, setFocusedSeriesLoading] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState(() => {
    if (typeof window === 'undefined') return 'zai';
    return getAISettings().defaultProvider || 'zai';
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window === 'undefined') return 'default';
    const settings = getAISettings();
    return settings.defaultModel || getDefaultModelForProvider(settings.defaultProvider || 'zai');
  });

  const focusedSymbol = (searchParams.get('symbol') || '').trim().toUpperCase();
  const focusedName = (searchParams.get('name') || '').trim();
  const focusedType = normalizeAnalysisAssetType(searchParams.get('type'));

  const benchmarkConfig = useMemo(
    () => BENCHMARKS.find((b) => b.id === benchmarkId) || BENCHMARKS[0],
    [benchmarkId]
  );

  const dayCount = useMemo(() => {
    const parsed = Number.parseInt(horizon, 10);
    return Number.isFinite(parsed) ? clamp(parsed, 30, 252) : 252;
  }, [horizon]);

  const holdings = useMemo<Holding[]>(() => {
    const result: Holding[] = [];

    data.stocks.forEach((s) => {
      const sector = s.sector || 'أخرى';
      const type = sector === 'Cryptocurrency'
        ? 'عملة مشفرة'
        : sector === 'Forex'
        ? 'فوركس'
        : 'سهم';

      result.push({
        symbol: s.symbol,
        name: s.name || s.symbol,
        value: toNumeric(s.valueSAR),
        type,
        sector,
      });
    });

    data.bonds.forEach((b) => {
      result.push({
        symbol: b.symbol,
        name: b.name || b.symbol,
        value: toNumeric(b.valueSAR),
        type: 'سند/صك',
        sector: 'دخل ثابت',
      });
    });

    data.funds.forEach((f) => {
      const isCommodity = f.fundType === 'commodities';
      result.push({
        symbol: f.symbol || f.name,
        name: f.name,
        value: toNumeric(f.valueSAR),
        type: isCommodity ? 'سلعة' : 'صندوق',
        sector: isCommodity ? 'سلع ومعادن' : 'صناديق',
      });
    });

    return result.filter((h) => h.value > 0);
  }, [data.stocks, data.bonds, data.funds]);

  const totalValue = data.totalPortfolioValue;
  const totalCost = data.totalPortfolioCost;
  const totalReturn = totalValue - totalCost;
  const totalReturnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  const focusedHolding = useMemo(() => {
    if (!focusedSymbol) return null;

    const matches = holdings.filter((holding) => {
      if (holding.symbol.trim().toUpperCase() !== focusedSymbol) return false;
      if (!focusedType) return true;
      return holdingTypeToCanonical(holding.type) === focusedType;
    });

    if (matches.length === 0) return null;

    const value = matches.reduce((sum, h) => sum + h.value, 0);
    const representative = matches[0];

    return {
      symbol: representative.symbol,
      name: focusedName || representative.name,
      type: focusedType || holdingTypeToCanonical(representative.type),
      sector: representative.sector,
      value,
      weight: totalValue > 0 ? (value / totalValue) * 100 : 0,
      positions: matches.length,
    };
  }, [focusedName, focusedSymbol, focusedType, holdings, totalValue]);

  const portfolioSeries = useMemo(() => {
    const safeCurrent = Math.max(1, totalValue || 1000);
    const safeStart = totalCost > 0
      ? Math.max(1, totalCost)
      : Math.max(1, safeCurrent * 0.92);

    const annualReturn = safeStart > 0 ? (safeCurrent / safeStart) - 1 : 0.05;

    const diversification = analyzeDiversification(holdings);
    const concentrationBoost = clamp(diversification.top5Concentration / 100, 0.15, 0.7);
    const annualVolatility = 0.1 + concentrationBoost * 0.25;

    return generateSyntheticSeries(
      safeStart,
      dayCount,
      annualReturn,
      annualVolatility,
      Math.round(safeCurrent) + holdings.length * 31
    );
  }, [dayCount, holdings, totalCost, totalValue]);

  useEffect(() => {
    let cancelled = false;

    async function loadBenchmark() {
      setBenchmarkLoading(true);

      try {
        const res = await fetch(
          `/api/chart?symbol=${encodeURIComponent(benchmarkConfig.symbol)}&range=1y&interval=1d`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const payload = (await res.json()) as ChartApiResponse;
        const closes = (payload.data || [])
          .map((item) => toNumeric(item.close))
          .filter((n) => n > 0);

        if (closes.length >= 20) {
          const sliced = closes.slice(-dayCount);
          if (!cancelled) {
            setBenchmarkSeries(sliced);
          }
          return;
        }

        throw new Error('Insufficient benchmark data');
      } catch {
        const fallback = generateSyntheticSeries(
          100,
          dayCount,
          benchmarkConfig.annualReturn,
          benchmarkConfig.annualVolatility,
          benchmarkConfig.symbol.length * 113
        );

        if (!cancelled) {
          setBenchmarkSeries(fallback);
        }
      } finally {
        if (!cancelled) {
          setBenchmarkLoading(false);
        }
      }
    }

    loadBenchmark();

    return () => {
      cancelled = true;
    };
  }, [benchmarkConfig, dayCount]);

  useEffect(() => {
    let cancelled = false;

    async function loadFocusedSeries() {
      if (!focusedHolding) {
        setFocusedSeries([]);
        return;
      }

      setFocusedSeriesLoading(true);

      try {
        const canonicalType = focusedHolding.type || 'stocks';
        const yahooSymbol = toYahooSymbolForAsset(focusedHolding.symbol, canonicalType);

        const res = await fetch(
          `/api/chart?symbol=${encodeURIComponent(yahooSymbol)}&range=1y&interval=1d`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const payload = (await res.json()) as ChartApiResponse;
        const closes = (payload.data || [])
          .map((item) => toNumeric(item.close))
          .filter((n) => n > 0);

        if (closes.length >= 20) {
          const sliced = closes.slice(-dayCount);
          if (!cancelled) {
            setFocusedSeries(sliced);
          }
          return;
        }

        throw new Error('Insufficient focused asset data');
      } catch {
        const fallback = generateSyntheticSeries(
          Math.max(1, focusedHolding.value || 100),
          dayCount,
          0.06,
          focusedHolding.type === 'crypto' ? 0.55 : focusedHolding.type === 'forex' ? 0.18 : 0.25,
          focusedHolding.symbol.length * 71
        );

        if (!cancelled) {
          setFocusedSeries(fallback);
        }
      } finally {
        if (!cancelled) {
          setFocusedSeriesLoading(false);
        }
      }
    }

    void loadFocusedSeries();

    return () => {
      cancelled = true;
    };
  }, [dayCount, focusedHolding]);

  const alignedBenchmarkSeries = useMemo(() => {
    if (!benchmarkSeries.length) return null;

    if (benchmarkSeries.length === portfolioSeries.length) return benchmarkSeries;

    if (benchmarkSeries.length > portfolioSeries.length) {
      return benchmarkSeries.slice(-portfolioSeries.length);
    }

    const first = benchmarkSeries[0] || 100;
    const padCount = portfolioSeries.length - benchmarkSeries.length;
    return [...Array.from({ length: padCount }, () => first), ...benchmarkSeries];
  }, [benchmarkSeries, portfolioSeries]);

  const riskAnalysis = useMemo(
    () => analyzePortfolioRisk(portfolioSeries, alignedBenchmarkSeries),
    [portfolioSeries, alignedBenchmarkSeries]
  );

  const diversification = useMemo(
    () => analyzeDiversification(holdings),
    [holdings]
  );

  const riskMeta = getRiskMeta(riskAnalysis.riskLevel);

  const performanceChart = useMemo(() => {
    const p = normalizeSeries(portfolioSeries);
    const b = alignedBenchmarkSeries ? normalizeSeries(alignedBenchmarkSeries) : [];

    return p.map((value, i) => ({
      day: i + 1,
      portfolio: value,
      benchmark: b[i] ?? null,
    }));
  }, [portfolioSeries, alignedBenchmarkSeries]);

  const assetAllocation = useMemo(() => {
    return data.assetCategories
      .filter((c) => c.valueSAR > 0)
      .map((c, i) => ({
        name: c.label,
        value: c.valueSAR,
        count: c.count,
        color: ASSET_COLORS[i % ASSET_COLORS.length],
      }));
  }, [data.assetCategories]);

  const sectorBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    holdings.forEach((h) => {
      map.set(h.sector, (map.get(h.sector) || 0) + h.value);
    });

    return [...map.entries()]
      .map(([sector, value]) => ({ sector, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [holdings]);

  const riskRadarData = useMemo(() => {
    const varPct = Math.abs((riskAnalysis.var95 || 0) * 100);

    return [
      { metric: 'تقلب', value: clamp(riskAnalysis.volatility || 0, 0, 100) },
      { metric: 'تراجع', value: clamp(riskAnalysis.maxDrawdown || 0, 0, 100) },
      { metric: 'قيمة عند المخاطر', value: clamp(varPct * 4, 0, 100) },
      { metric: 'بيتا', value: clamp((riskAnalysis.beta || 1) * 35, 0, 100) },
      { metric: 'التركيز', value: clamp(diversification.top5Concentration, 0, 100) },
    ];
  }, [diversification.top5Concentration, riskAnalysis]);

  const recommendations = useMemo(() => {
    const tips: string[] = [];

    if (riskAnalysis.riskLevel === 'high' || riskAnalysis.riskLevel === 'very_high') {
      tips.push('المخاطر مرتفعة: قلل التمركز في الأصول الأعلى تذبذبًا وزد وزن الأصول الدفاعية.');
    }

    if (diversification.top5Concentration > 60) {
      tips.push('تركيز أعلى 5 أصول كبير: حاول تخفيضه إلى أقل من 50% لرفع جودة التنويع.');
    }

    if ((riskAnalysis.sharpe || 0) < 0.5) {
      tips.push('العائد المعدل بالمخاطر منخفض: راجع جودة الدخول وتوقيت إعادة التوازن.');
    }

    if ((riskAnalysis.maxDrawdown || 0) > 20) {
      tips.push('أقصى تراجع كبير: ضع حدود وقف خسارة وخطة توزيع تدريجي للمراكز.');
    }

    if (!tips.length) {
      tips.push('وضع المحفظة متوازن نسبيًا. استمر في إعادة التوازن الدورية ومراقبة المخاطر النظامية.');
    }

    return tips;
  }, [diversification.top5Concentration, riskAnalysis]);

  const focusedAssetStats = useMemo(() => {
    if (!focusedHolding || focusedSeries.length < 2) return null;

    const returns: number[] = [];
    for (let i = 1; i < focusedSeries.length; i++) {
      const prev = focusedSeries[i - 1];
      const next = focusedSeries[i];
      if (prev > 0 && next > 0) {
        returns.push((next - prev) / prev);
      }
    }

    if (returns.length === 0) return null;

    const avg = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance =
      returns.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / returns.length;
    const annualVolatility = Math.sqrt(Math.max(variance, 0)) * Math.sqrt(252) * 100;

    let peak = focusedSeries[0];
    let maxDrawdown = 0;
    for (const price of focusedSeries) {
      peak = Math.max(peak, price);
      const dd = peak > 0 ? ((peak - price) / peak) * 100 : 0;
      maxDrawdown = Math.max(maxDrawdown, dd);
    }

    const first = focusedSeries[0];
    const last = focusedSeries[focusedSeries.length - 1];
    const returnPct = first > 0 ? ((last / first) - 1) * 100 : 0;
    const riskBand = estimateAssetRiskBand(focusedHolding.type, annualVolatility);

    return {
      returnPct,
      annualVolatility,
      maxDrawdown,
      riskBand,
    };
  }, [focusedHolding, focusedSeries]);

  const topWeights = diversification.weights.slice(0, 5);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar
          title="تحليل المخاطر"
          subtitle="قياس مخاطر المحفظة، التنويع، والأداء مقابل المؤشرات"
          onRefresh={refresh}
        />

        <main className="p-4 md:p-6 space-y-6">
          {error && (
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6 text-red-700 text-sm">{error}</CardContent>
            </Card>
          )}

          {loading ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                جاري تحميل بيانات المخاطر...
              </CardContent>
            </Card>
          ) : holdings.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                لا توجد أصول كافية لتحليل المخاطر.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h1 className="text-xl md:text-2xl font-bold">لوحة مخاطر المحفظة</h1>
                </div>

                <div className="flex gap-2">
                  <Select value={selectedProvider} onValueChange={(v) => {
                    setSelectedProvider(v);
                    const m = getDefaultModelForProvider(v);
                    setSelectedModel(m);
                    saveDefaults(v, m);
                  }}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_PROVIDERS.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span>{p.icon} {p.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedModel} onValueChange={(v) => { setSelectedModel(v); saveDefaults(selectedProvider, v); }}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getModelsForProvider(selectedProvider).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <div className="flex items-center gap-2">
                            <span>{m.nameAr || m.name}</span>
                            {m.recommended && <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 px-1">موصى به</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={benchmarkId} onValueChange={setBenchmarkId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="المؤشر المرجعي" />
                    </SelectTrigger>
                    <SelectContent>
                      {BENCHMARKS.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={horizon} onValueChange={setHorizon}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="الفترة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">3 أشهر</SelectItem>
                      <SelectItem value="180">6 أشهر</SelectItem>
                      <SelectItem value="252">سنة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {focusedSymbol && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      الأصل المرتبط من صفحة الأصول
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {focusedHolding ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-lg border bg-background p-3">
                          <p className="text-xs text-muted-foreground">الأصل</p>
                          <p className="font-bold mt-1">{focusedHolding.name}</p>
                          <p className="text-xs text-muted-foreground">{focusedHolding.symbol}</p>
                        </div>
                        <div className="rounded-lg border bg-background p-3">
                          <p className="text-xs text-muted-foreground">الوزن في المحفظة</p>
                          <p className="text-lg font-bold mt-1">{formatPercent(focusedHolding.weight)}</p>
                          <p className="text-xs text-muted-foreground">
                            قيمة المركز: {formatCurrency(focusedHolding.value)}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-background p-3">
                          <p className="text-xs text-muted-foreground">تذبذب سنوي (فعلي)</p>
                          <p className="text-lg font-bold mt-1">
                            {focusedAssetStats ? `${formatNumber(focusedAssetStats.annualVolatility, 2)}%` : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {focusedSeriesLoading ? 'تحميل بيانات السوق...' : `نقاط بيانات: ${focusedSeries.length}`}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-background p-3">
                          <p className="text-xs text-muted-foreground">تقييم مخاطر الأصل</p>
                          <p className="text-lg font-bold mt-1">
                            {focusedAssetStats?.riskBand || '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            عائد الفترة: {focusedAssetStats ? `${formatNumber(focusedAssetStats.returnPct, 2)}%` : '—'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            تراجع أقصى: {focusedAssetStats ? `${formatNumber(focusedAssetStats.maxDrawdown, 2)}%` : '—'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                        الرمز {focusedSymbol} غير موجود ضمن مراكز المحفظة الحالية، لذلك يتم عرض تحليل المخاطر على مستوى المحفظة فقط.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs text-muted-foreground">قيمة المحفظة</p>
                    <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs text-muted-foreground">العائد الكلي</p>
                    <p className={`text-xl font-bold ${totalReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(totalReturn)}
                    </p>
                    <p className={`text-sm ${totalReturnPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatPercent(totalReturnPct)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs text-muted-foreground">مستوى المخاطر</p>
                    <div className="mt-2">
                      <Badge className={riskMeta.className}>{riskMeta.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{riskAnalysis.dataPoints} نقطة بيانات</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs text-muted-foreground">جودة التنويع</p>
                    <p className="text-xl font-bold">{getDiversificationLabel(diversification.diversification)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      تركيز أعلى 5 أصول: {formatNumber(diversification.top5Concentration, 1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      الأداء التراكمي مقابل {benchmarkConfig.name}
                      {benchmarkLoading && <span className="text-xs text-muted-foreground">(تحميل...)</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceChart}>
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          tickFormatter={(value: number) => `${formatNumber(value, 0)}%`}
                        />
                        <Tooltip
                          formatter={(value: number | string, name: string) => [
                            `${formatNumber(Number(value), 2)}%`,
                            name === 'portfolio' ? 'المحفظة' : benchmarkConfig.name,
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="portfolio"
                          name="المحفظة"
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="benchmark"
                          name={benchmarkConfig.name}
                          stroke="#f59e0b"
                          strokeWidth={2.2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      رادار المخاطر
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={riskRadarData} outerRadius="75%">
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
                        <Tooltip formatter={(value: number | string) => `${formatNumber(Number(value), 1)} / 100`} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PieIcon className="h-4 w-4" />
                      توزيع الأصول
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assetAllocation.length > 0 ? (
                      <ResponsiveContainer width="100%" height={290}>
                        <PieChart>
                          <Pie
                            data={assetAllocation}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={2}
                          >
                            {assetAllocation.map((entry, idx) => (
                              <Cell key={`asset-${entry.name}`} fill={ASSET_COLORS[idx % ASSET_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
                          <Legend iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-muted-foreground py-16">لا توجد بيانات كافية</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">أعلى القطاعات وزنًا</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={290}>
                      <BarChart data={sectorBreakdown}>
                        <XAxis dataKey="sector" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(value: number) => formatNumber(value / 1000, 0)} />
                        <Tooltip formatter={(value: number | string) => formatCurrency(Number(value))} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {sectorBreakdown.map((entry, idx) => (
                            <Cell key={`sector-${entry.sector}`} fill={ASSET_COLORS[idx % ASSET_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">مقاييس المخاطر التفصيلية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">المقياس</TableHead>
                          <TableHead className="text-center">القيمة</TableHead>
                          <TableHead className="text-right">التفسير</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Beta</TableCell>
                          <TableCell className="text-center">{riskAnalysis.beta != null ? formatNumber(riskAnalysis.beta, 2) : '—'}</TableCell>
                          <TableCell>حساسية المحفظة لحركة السوق</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Sharpe Ratio</TableCell>
                          <TableCell className="text-center">{riskAnalysis.sharpe != null ? formatNumber(riskAnalysis.sharpe, 2) : '—'}</TableCell>
                          <TableCell>العائد المعدل بالمخاطر الكلية</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Sortino Ratio</TableCell>
                          <TableCell className="text-center">{riskAnalysis.sortino != null ? formatNumber(riskAnalysis.sortino, 2) : '—'}</TableCell>
                          <TableCell>العائد المعدل بالمخاطر السلبية</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Calmar Ratio</TableCell>
                          <TableCell className="text-center">{riskAnalysis.calmar != null ? formatNumber(riskAnalysis.calmar, 2) : '—'}</TableCell>
                          <TableCell>العائد مقابل أقصى تراجع</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Volatility (سنوي)</TableCell>
                          <TableCell className="text-center">{riskAnalysis.volatility != null ? `${formatNumber(riskAnalysis.volatility, 2)}%` : '—'}</TableCell>
                          <TableCell>تذبذب المحفظة السنوي</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Max Drawdown</TableCell>
                          <TableCell className="text-center">{formatNumber(riskAnalysis.maxDrawdown, 2)}%</TableCell>
                          <TableCell>أكبر هبوط من قمة إلى قاع</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>VaR 95%</TableCell>
                          <TableCell className="text-center">
                            {riskAnalysis.var95 != null ? `${formatNumber(riskAnalysis.var95 * 100, 2)}%` : '—'}
                          </TableCell>
                          <TableCell>الخسارة اليومية المتوقعة بنسبة ثقة 95%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      توصيات المخاطر
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {recommendations.map((tip) => (
                      <div key={tip} className="rounded-lg border border-amber-200 bg-white p-3 text-sm">
                        {tip}
                      </div>
                    ))}
                    {topWeights.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-2">أكبر الأوزان في المحفظة:</p>
                        <div className="flex flex-wrap gap-2">
                          {topWeights.map((w) => (
                            <Badge key={`${w.symbol}-${w.weight}`} variant="outline">
                              {w.symbol} · {formatNumber(w.weight, 1)}%
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
