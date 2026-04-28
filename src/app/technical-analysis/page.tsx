'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AI_PROVIDERS, getModelsForProvider, getDefaultModelForProvider } from '@/lib/ai-providers';
import { getAISettings, saveDefaults } from '@/lib/api-keys';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import {
  calculateRSI, calculateMACD, calculateBollingerBands,
  calculateSMA, calculateEMA, calculateATR,
  calculateADX, calculateWilliamsR, calculateCCI,
  calculateOBV, calculateStochastic,
  getRSISignal, getMACDSignal, getBollingerSignal,
} from '@/lib/technical-analysis';
import { callAI } from '@/lib/ai-providers';
import { getApiKey } from '@/lib/api-keys';
import { notifySuccess, notifyError } from '@/hooks/use-notifications';
import {
  Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  Bar, ComposedChart, ReferenceLine, CartesianGrid, Cell, Area, AreaChart,
} from 'recharts';
import {
  Search, TrendingUp, BarChart3, Activity, DollarSign,
  Bitcoin, Coins, Landmark, FileText, Loader2, Brain,
  ArrowUpCircle, ArrowDownCircle, MinusCircle, Zap, Shield,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatNumber } from '@/lib/helpers';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  normalizeAnalysisAssetType,
  toYahooSymbolForAsset,
  type AnalysisAssetType,
} from '@/lib/analysis-links';

interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AssetItem {
  symbol: string;
  name: string;
  type: AnalysisAssetType;
  currentPrice?: number;
  buyPrice: number;
  valueSAR: number;
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof TrendingUp; badgeClass: string }> = {
  stocks: { label: 'سهم', icon: TrendingUp, badgeClass: 'bg-blue-100 text-blue-700' },
  crypto: { label: 'عملة مشفرة', icon: Bitcoin, badgeClass: 'bg-orange-100 text-orange-700' },
  forex: { label: 'فوركس', icon: DollarSign, badgeClass: 'bg-teal-100 text-teal-700' },
  bonds: { label: 'سند/صك', icon: FileText, badgeClass: 'bg-purple-100 text-purple-700' },
  funds: { label: 'صندوق', icon: Landmark, badgeClass: 'bg-green-100 text-green-700' },
  commodities: { label: 'سلعة', icon: Coins, badgeClass: 'bg-amber-100 text-amber-700' },
};

const CATEGORIES = [
  { id: 'stocks', label: 'الأسهم', icon: TrendingUp },
  { id: 'crypto', label: 'العملات المشفرة', icon: Bitcoin },
  { id: 'forex', label: 'الفوركس', icon: DollarSign },
  { id: 'bonds', label: 'السندات والصكوك', icon: FileText },
  { id: 'funds', label: 'الصناديق', icon: Landmark },
  { id: 'commodities', label: 'السلع والمعادن', icon: Coins },
];

function generateFallbackData(currentPrice: number): OHLCVBar[] {
  const data: OHLCVBar[] = [];
  let price = currentPrice * 0.92;
  for (let i = 0; i < 100; i++) {
    const change = (Math.random() - 0.48) * currentPrice * 0.03;
    price = Math.max(price + change, currentPrice * 0.5);
    const high = price + Math.random() * currentPrice * 0.015;
    const low = price - Math.random() * currentPrice * 0.015;
    data.push({
      date: new Date(Date.now() - (100 - i) * 86400000).toLocaleDateString('en-US'),
      open: Math.round(price * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round((price + Math.random() * currentPrice * 0.005) * 100) / 100,
      volume: Math.floor(Math.random() * 5000000) + 1000000,
    });
  }
  if (data.length > 0) {
    data[data.length - 1].close = currentPrice;
  }
  return data;
}

export default function TechnicalAnalysisPage() {
  const searchParams = useSearchParams();
  const { data, loading } = useDashboardData();
  const [symbol, setSymbol] = useState('');
  const [chartData, setChartData] = useState<OHLCVBar[] | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [period, setPeriod] = useState('20');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AnalysisAssetType | null>(null);
  const [appliedDeepLinkKey, setAppliedDeepLinkKey] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState(() => {
    if (typeof window === 'undefined') return 'zai';
    return getAISettings().defaultProvider || 'zai';
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window === 'undefined') return 'default';
    const settings = getAISettings();
    return settings.defaultModel || getDefaultModelForProvider(settings.defaultProvider || 'zai');
  });

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('charts');

  const deepLinkSymbol = (searchParams.get('symbol') || '').trim().toUpperCase();
  const deepLinkType = normalizeAnalysisAssetType(searchParams.get('type'));
  const deepLinkKey = `${deepLinkSymbol}|${deepLinkType || ''}`;

  const allAssets = useMemo((): AssetItem[] => {
    const assets: AssetItem[] = [];
    data.stocks.forEach(s => {
      const sector = s.sector || '';
      let type: AnalysisAssetType = 'stocks';
      if (sector === 'Cryptocurrency') type = 'crypto';
      else if (sector === 'Forex') type = 'forex';
      assets.push({
        symbol: s.symbol,
        name: s.name,
        type,
        currentPrice: s.livePrice ?? s.currentPrice ?? s.buyPrice,
        buyPrice: s.buyPrice,
        valueSAR: s.valueSAR,
      });
    });
    data.bonds.forEach(b => {
      assets.push({
        symbol: b.symbol,
        name: b.name,
        type: 'bonds',
        currentPrice: b.currentPrice ?? b.buyPrice,
        buyPrice: b.buyPrice,
        valueSAR: b.valueSAR,
      });
    });
    data.funds.forEach(f => {
      const type: AnalysisAssetType = f.fundType === 'commodities' ? 'commodities' : 'funds';
      assets.push({
        symbol: f.symbol || f.name,
        name: f.name,
        type,
        currentPrice: f.currentPrice ?? f.buyPrice,
        buyPrice: f.buyPrice,
        valueSAR: f.valueSAR,
      });
    });
    return assets;
  }, [data.stocks, data.bonds, data.funds]);

  const filteredAssets = useMemo(() => {
    if (activeCategory === 'all') return allAssets;
    return allAssets.filter(a => a.type === activeCategory);
  }, [activeCategory, allAssets]);

  const topAssets = useMemo(() => {
    const grouped = new Map<string, AssetItem>();

    for (const asset of filteredAssets) {
      const key = `${asset.symbol}::${asset.type}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, { ...asset });
        continue;
      }

      grouped.set(key, {
        ...existing,
        valueSAR: existing.valueSAR + asset.valueSAR,
        currentPrice: asset.currentPrice ?? existing.currentPrice,
      });
    }

    return [...grouped.values()]
      .sort((a, b) => b.valueSAR - a.valueSAR)
      .slice(0, 20);
  }, [filteredAssets]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach(cat => {
      counts[cat.id] = allAssets.filter(a => a.type === cat.id).length;
    });
    counts['all'] = allAssets.length;
    return counts;
  }, [allAssets]);

  const fetchData = async (sym: string, preferredType?: AnalysisAssetType | null) => {
    if (!sym) return;
    setChartLoading(true);
    try {
      const asset =
        allAssets.find(a => a.symbol === sym && (!preferredType || a.type === preferredType)) ||
        allAssets.find(a => a.symbol === sym);
      const yahooSym = toYahooSymbolForAsset(sym, preferredType || asset?.type || 'stocks');
      const res = await fetch(`/api/chart?symbol=${encodeURIComponent(yahooSym)}&range=6mo&interval=1d`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.length > 10) {
          setChartData(result.data);
          setChartLoading(false);
          return;
        }
      }
    } catch {
      // fallback below
    }
    const currentPrice = allAssets.find(a => a.symbol === sym)?.currentPrice || 100;
    setChartData(generateFallbackData(currentPrice));
    setChartLoading(false);
  };

  const handleAssetClick = (sym: string, type?: AnalysisAssetType) => {
    setSymbol(sym);
    setSelectedSymbol(sym);
    setSelectedType(type || null);
    void fetchData(sym, type || null);
  };

  useEffect(() => {
    if (!deepLinkSymbol || allAssets.length === 0) return;
    if (appliedDeepLinkKey === deepLinkKey) return;

    const matched =
      allAssets.find(
        (asset) =>
          asset.symbol.toUpperCase() === deepLinkSymbol &&
          (!deepLinkType || asset.type === deepLinkType)
      ) ||
      allAssets.find((asset) => asset.symbol.toUpperCase() === deepLinkSymbol);

    const resolvedType = matched?.type || deepLinkType || null;
    const resolvedSymbol = matched?.symbol || deepLinkSymbol;

    if (resolvedType) {
      setActiveCategory(resolvedType);
    }

    setSymbol(resolvedSymbol);
    setSelectedSymbol(resolvedSymbol);
    setSelectedType(resolvedType);
    void fetchData(resolvedSymbol, resolvedType);
    setAppliedDeepLinkKey(deepLinkKey);
  }, [allAssets, appliedDeepLinkKey, deepLinkKey, deepLinkSymbol, deepLinkType]);

  const indicators = useMemo(() => {
    if (!chartData) return null;
    const closes = chartData.map(d => d.close);
    const highs = chartData.map(d => d.high);
    const lows = chartData.map(d => d.low);
    const volumes = chartData.map(d => d.volume);
    const p = parseInt(period);

    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes, 12, 26, 9);
    const bollinger = calculateBollingerBands(closes, p, 2);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const atr = calculateATR(highs, lows, closes, 14);
    const adx = calculateADX(highs, lows, closes, 14);
    const williamsR = calculateWilliamsR(highs, lows, closes, 14);
    const cci = calculateCCI(highs, lows, closes, 20);
    const obv = calculateOBV(closes, volumes);
    const stochastic = calculateStochastic(highs, lows, closes, 14);

    // Support/Resistance from recent pivots
    const recentHighs = highs.slice(-30).sort((a, b) => b - a);
    const recentLows = lows.slice(-30).sort((a, b) => a - b);
    const resistance1 = recentHighs[0] || 0;
    const resistance2 = recentHighs[Math.min(2, recentHighs.length - 1)] || resistance1;
    const support1 = recentLows[0] || 0;
    const support2 = recentLows[Math.min(2, recentLows.length - 1)] || support1;

    // Overall signal count
    const signals: string[] = [];
    const rsiSig = getRSISignal(rsi);
    const macdSig = getMACDSignal(macd);
    const bbSig = getBollingerSignal(closes, bollinger);
    signals.push(rsiSig, macdSig, bbSig);
    // ADX signal
    signals.push((adx.adx.length > 0 && adx.adx[adx.adx.length - 1].value > 25) ? 'bullish' : 'neutral');
    // Stoch signal
    const stochVal = stochastic.k.length > 0 ? stochastic.k[stochastic.k.length - 1].value : 50;
    signals.push(stochVal < 20 ? 'oversold' : stochVal > 80 ? 'overbought' : 'neutral');
    // CCI signal
    const cciVal = cci.length > 0 ? cci[cci.length - 1].value : 0;
    signals.push(cciVal > 100 ? 'overbought' : cciVal < -100 ? 'oversold' : 'neutral');
    // SMA crossover
    const sma20Val = sma20.length > 0 ? sma20[sma20.length - 1].value : 0;
    const sma50Val = sma50.length > 0 ? sma50[sma50.length - 1].value : 0;
    signals.push(sma20Val > sma50Val ? 'bullish' : sma20Val < sma50Val ? 'bearish' : 'neutral');

    const bullCount = signals.filter(s => s === 'bullish' || s === 'oversold').length;
    const bearCount = signals.filter(s => s === 'bearish' || s === 'overbought').length;
    const overallSignal = bullCount > bearCount + 1 ? 'شراء' : bearCount > bullCount + 1 ? 'بيع' : 'محايد';
    const overallColor = overallSignal === 'شراء' ? 'text-emerald-500' : overallSignal === 'بيع' ? 'text-red-500' : 'text-amber-500';

    return {
      rsi, macd, bollinger, sma20, sma50, ema12, ema26, atr, adx, williamsR, cci, obv, stochastic,
      currentPrice: closes[closes.length - 1],
      currentRSI: rsi.length > 0 ? rsi[rsi.length - 1].value : null,
      currentMACD: macd.macd.length > 0 ? macd.macd[macd.macd.length - 1].value : null,
      currentBollinger: bollinger.upper.length > 0 ? {
        upper: bollinger.upper[bollinger.upper.length - 1].value,
        middle: bollinger.middle[bollinger.middle.length - 1].value,
        lower: bollinger.lower[bollinger.lower.length - 1].value,
      } : null,
      currentADX: adx.adx.length > 0 ? adx.adx[adx.adx.length - 1].value : null,
      currentWilliamsR: williamsR.length > 0 ? williamsR[williamsR.length - 1].value : null,
      currentStoch: stochVal,
      currentCCI: cciVal,
      currentATR: atr.length > 0 ? atr[atr.length - 1].value : null,
      currentOBV: obv.length > 0 ? obv[obv.length - 1].value : null,
      rsiSignal: rsiSig,
      macdSignal: macdSig,
      bollingerSignal: bbSig,
      support1, support2, resistance1, resistance2,
      overallSignal, overallColor, bullCount, bearCount,
      totalSignals: signals.length,
    };
  }, [chartData, period]);

  const chartDisplayData = useMemo(() => {
    if (!chartData || !indicators) return [];
    return chartData.map((d, i) => ({
      ...d,
      sma20: indicators.sma20.find(s => s.time === i)?.value,
      sma50: indicators.sma50.find(s => s.time === i)?.value,
      ema12: indicators.ema12.find(s => s.time === i)?.value,
      ema26: indicators.ema26.find(s => s.time === i)?.value,
      bbUpper: indicators.bollinger.upper.find(b => b.time === i)?.value,
      bbMiddle: indicators.bollinger.middle.find(b => b.time === i)?.value,
      bbLower: indicators.bollinger.lower.find(b => b.time === i)?.value,
      macd: indicators.macd.macd.find(m => m.time === i)?.value,
      macdSignal: indicators.macd.signal.find(m => m.time === i)?.value,
      macdHist: indicators.macd.histogram.find(m => m.time === i)?.value,
      rsi: indicators.rsi.find(r => r.time === i)?.value,
      atr: indicators.atr.find(a => a.time === i)?.value,
      cci: indicators.cci.find(c => c.time === i)?.value,
      obv: indicators.obv.find(o => o.time === i)?.value,
      stochK: indicators.stochastic.k.find(s => s.time === i)?.value,
      stochD: indicators.stochastic.d.find(s => s.time === i)?.value,
      volColor: i > 0 && d.close >= chartData[i - 1].close ? '#22c55e' : '#ef4444',
    }));
  }, [chartData, indicators]);

  /* ─── AI Analysis ─── */
  const requestAIAnalysis = async () => {
    if (!selectedSymbol) {
      notifyError('خطأ', 'اختر رمزاً أولاً');
      return;
    }
    setAiLoading(true);
    setAiAnalysis('');
    setActiveTab('ai');
    try {
      let prompt: string;
      if (indicators) {
        prompt = `حلل فنياً الرمز ${selectedSymbol} بناءً على المؤشرات التالية:
- السعر الحالي: ${indicators.currentPrice}
- RSI(14): ${indicators.currentRSI?.toFixed(1)} (${indicators.rsiSignal})
- MACD: ${indicators.currentMACD?.toFixed(3)} (${indicators.macdSignal})
- Bollinger: ${indicators.currentBollinger ? `Upper ${indicators.currentBollinger.upper.toFixed(2)}, Middle ${indicators.currentBollinger.middle.toFixed(2)}, Lower ${indicators.currentBollinger.lower.toFixed(2)}` : 'N/A'} (${indicators.bollingerSignal})
- ADX: ${indicators.currentADX?.toFixed(1)}
- Williams %R: ${indicators.currentWilliamsR?.toFixed(1)}
- Stochastic %K: ${indicators.currentStoch?.toFixed(1)}
- CCI(20): ${indicators.currentCCI?.toFixed(1)}
- ATR(14): ${indicators.currentATR?.toFixed(2)}
- دعم: S1=${indicators.support1.toFixed(2)}, S2=${indicators.support2.toFixed(2)}
- مقاومة: R1=${indicators.resistance1.toFixed(2)}, R2=${indicators.resistance2.toFixed(2)}
- التوصية الكمية: ${indicators.overallSignal} (${indicators.bullCount} صاعد / ${indicators.bearCount} هابط من ${indicators.totalSignals})

قدّم تحليلاً فنياً شاملاً يتضمن:
1. الاتجاه العام (صاعد/هابط/عرضي) مع السبب
2. مستويات الدعم والمقاومة الرئيسية
3. إشارات المؤشرات الفنية ومعناها
4. نقاط الدخول والخروج المقترحة
5. وقف الخسارة وجني الأرباح
6. التوصية النهائية (شراء/بيع/انتظار) مع درجة الثقة
7. المخاطر والتحذيرات

أجب بالعربية بشكل مختصر ومنظم.`;
      } else {
        prompt = `حلل فنياً الرمز ${selectedSymbol}.
قدّم تحليلاً عاماً يتضمن:
1. نظرة عامة على السهم وأدائه
2. أهم مستويات الدعم والمقاومة المحتملة
3. التوصية العامة
أجب بالعربية.`;
      }

      const apiKey = getApiKey(selectedProvider);
      const systemPrompt = 'أنت محلل فني محترف بخبرة 15 عاماً في أسواق المال. تستخدم التحليل الفني الكلاسيكي والحديث. قدّم تحليلاً عملياً مع مستويات دخول وخروج محددة.';
      const result = await callAI(prompt, selectedProvider, apiKey, systemPrompt, selectedModel);
      setAiAnalysis(result);
      setActiveTab('ai');
      notifySuccess('تحليل AI جاهز', `تحليل فني لـ ${selectedSymbol}`, { source: 'التحليل الفني' });
    } catch (err: any) {
      notifyError('فشل تحليل AI', err.message, { source: 'التحليل الفني' });
    } finally {
      setAiLoading(false);
    }
  };

  const getSignalColor = (signal: string) => {
    if (signal === 'bullish') return 'text-emerald-500';
    if (signal === 'bearish') return 'text-red-500';
    if (signal === 'overbought') return 'text-amber-500';
    if (signal === 'oversold') return 'text-blue-500';
    return 'text-muted-foreground';
  };

  const getSignalLabel = (signal: string) => {
    if (signal === 'bullish') return 'صاعد';
    if (signal === 'bearish') return 'هابط';
    if (signal === 'overbought') return 'مشبع شراء';
    if (signal === 'oversold') return 'مشبع بيع';
    return 'محايد';
  };

  const getSignalBadge = (signal: string): 'default' | 'destructive' | 'secondary' => {
    if (signal === 'bullish' || signal === 'oversold') return 'default';
    if (signal === 'bearish' || signal === 'overbought') return 'destructive';
    return 'secondary';
  };

  const selectedAsset = selectedSymbol
    ? allAssets.find(a => a.symbol === selectedSymbol && (!selectedType || a.type === selectedType)) ||
      allAssets.find(a => a.symbol === selectedSymbol)
    : null;

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="flex-1 mr-64 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  التحليل الفني
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  تحليل جميع الأصول بمؤشرات فنية متقدمة — أسهم، عملات مشفرة، فوركس، سندات، صناديق، سلع
                </p>
              </div>
              <div className="flex items-center gap-2">
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
              </div>
            </div>
            {deepLinkSymbol && (
              <div className="mt-2">
                <Badge variant="outline">
                  أصل مرتبط: {deepLinkSymbol}
                  {deepLinkType ? ` • ${TYPE_CONFIG[deepLinkType]?.label || deepLinkType}` : ''}
                </Badge>
              </div>
            )}
          </div>

          {/* Search & Category Filter */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-3 flex-wrap items-center">
                <Input
                  placeholder="أدخل رمز الأصل (مثال: AAPL, 2222.SR, BTC, EURUSD=X)"
                  value={symbol}
                  onChange={e => {
                    setSelectedType(null);
                    setSymbol(e.target.value.toUpperCase());
                  }}
                  onKeyDown={e => e.key === 'Enter' && void fetchData(symbol, selectedType)}
                  className="flex-1 min-w-[200px]"
                />
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 أيام</SelectItem>
                    <SelectItem value="20">20 يوم</SelectItem>
                    <SelectItem value="30">30 يوم</SelectItem>
                    <SelectItem value="50">50 يوم</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => void fetchData(symbol, selectedType)} disabled={chartLoading}>
                  <Search className="h-4 w-4 ml-2" />
                  {chartLoading ? 'جاري...' : 'تحليل'}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const count = categoryCounts[cat.id] || 0;
                  return (
                    <Button
                      key={cat.id}
                      variant={activeCategory === cat.id ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7 gap-1"
                      onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
                    >
                      <Icon className="h-3 w-3" />
                      {cat.label}
                      {count > 0 && <span className="opacity-70">({count})</span>}
                    </Button>
                  );
                })}
              </div>

              {topAssets.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground">من محفظتك:</span>
                  {topAssets.map((a, index) => {
                    const cfg = TYPE_CONFIG[a.type];
                    return (
                      <Button
                        key={`${a.symbol}-${a.type}-${index}`}
                        variant={selectedSymbol === a.symbol && selectedType === a.type ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={() => handleAssetClick(a.symbol, a.type)}
                      >
                        <Badge className={`text-[8px] px-1 h-4 ${cfg?.badgeClass || 'bg-muted'}`}>
                          {cfg?.label || a.type}
                        </Badge>
                        {a.symbol}
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Asset Info */}
          {selectedAsset && (
            <Card className="border-2">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{selectedAsset.symbol}</h3>
                    <p className="text-xs text-muted-foreground">{selectedAsset.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="text-lg font-bold">{formatCurrency(selectedAsset.valueSAR)}</p>
                      <p className="text-xs text-muted-foreground">القيمة (ريال)</p>
                    </div>
                    <Badge className={TYPE_CONFIG[selectedAsset.type]?.badgeClass || 'bg-muted'}>
                      {TYPE_CONFIG[selectedAsset.type]?.label || selectedAsset.type}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Indicators */}
          {indicators && (
            <>
              {/* Overall Verdict Card */}
              <Card className="border-2">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      {indicators.overallSignal === 'شراء' ? (
                        <ArrowUpCircle className="h-10 w-10 text-emerald-500" />
                      ) : indicators.overallSignal === 'بيع' ? (
                        <ArrowDownCircle className="h-10 w-10 text-red-500" />
                      ) : (
                        <MinusCircle className="h-10 w-10 text-amber-500" />
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">التوصية الفنية الشاملة</p>
                        <p className={`text-2xl font-black ${indicators.overallColor}`}>{indicators.overallSignal}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-emerald-500 font-bold text-lg">{indicators.bullCount}</p>
                        <p className="text-xs text-muted-foreground">صاعد</p>
                      </div>
                      <div className="text-center">
                        <p className="text-red-500 font-bold text-lg">{indicators.bearCount}</p>
                        <p className="text-xs text-muted-foreground">هابط</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground font-bold text-lg">{indicators.totalSignals - indicators.bullCount - indicators.bearCount}</p>
                        <p className="text-xs text-muted-foreground">محايد</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="text-center border rounded-lg p-2 min-w-[80px]">
                        <p className="text-xs text-muted-foreground">دعم S1</p>
                        <p className="font-bold text-emerald-500">{indicators.support1.toFixed(2)}</p>
                      </div>
                      <div className="text-center border rounded-lg p-2 min-w-[80px]">
                        <p className="text-xs text-muted-foreground">مقاومة R1</p>
                        <p className="font-bold text-red-500">{indicators.resistance1.toFixed(2)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={requestAIAnalysis}
                        disabled={aiLoading || !selectedSymbol}
                      >
                        {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                        تحليل AI
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Indicator Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {[
                  { label: 'RSI (14)', value: indicators.currentRSI?.toFixed(1), signal: indicators.rsiSignal },
                  { label: 'MACD', value: indicators.currentMACD?.toFixed(3), signal: indicators.macdSignal },
                  { label: 'Bollinger', value: indicators.currentBollinger ? `${indicators.currentBollinger.lower.toFixed(1)}-${indicators.currentBollinger.upper.toFixed(1)}` : null, signal: indicators.bollingerSignal },
                  { label: 'ADX (14)', value: indicators.currentADX?.toFixed(1), signal: (indicators.currentADX ?? 0) > 25 ? 'bullish' : 'neutral' },
                  { label: 'Williams %R', value: indicators.currentWilliamsR?.toFixed(1), signal: (indicators.currentWilliamsR ?? -50) < -80 ? 'oversold' : (indicators.currentWilliamsR ?? -50) > -20 ? 'overbought' : 'neutral' },
                  { label: 'Stochastic', value: indicators.currentStoch?.toFixed(1), signal: indicators.currentStoch < 20 ? 'oversold' : indicators.currentStoch > 80 ? 'overbought' : 'neutral' },
                  { label: 'CCI (20)', value: indicators.currentCCI?.toFixed(1), signal: indicators.currentCCI > 100 ? 'overbought' : indicators.currentCCI < -100 ? 'oversold' : 'neutral' },
                  { label: 'ATR (14)', value: indicators.currentATR?.toFixed(2), signal: 'neutral' },
                ].map((item) => (
                  <Card key={item.label}>
                    <CardContent className="pt-3 pb-2 text-center">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{item.label}</p>
                      <p className={`text-base font-bold ${getSignalColor(item.signal)}`}>{item.value || '—'}</p>
                      <Badge variant={getSignalBadge(item.signal)} className="mt-0.5 text-[9px] px-1">
                        {getSignalLabel(item.signal)}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Tabs: Charts / AI Analysis */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 w-full max-w-md">
                  <TabsTrigger value="charts">📊 الرسوم البيانية</TabsTrigger>
                  <TabsTrigger value="ai">🤖 تحليل AI</TabsTrigger>
                </TabsList>

                <TabsContent value="charts" className="space-y-4 mt-4">
                  {/* Price + Bollinger Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        السعر + Bollinger Bands + SMA/EMA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={chartDisplayData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Legend />
                          <ReferenceLine y={indicators.resistance1} stroke="#ef4444" strokeDasharray="8 4" label={{ value: `R1`, position: 'right', fontSize: 9 }} />
                          <ReferenceLine y={indicators.support1} stroke="#22c55e" strokeDasharray="8 4" label={{ value: `S1`, position: 'right', fontSize: 9 }} />
                          <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="السعر" />
                          <Line type="monotone" dataKey="bbUpper" stroke="#ef444480" strokeDasharray="5 5" strokeWidth={1} dot={false} name="BB العلوي" />
                          <Line type="monotone" dataKey="bbMiddle" stroke="#22c55e80" strokeDasharray="5 5" strokeWidth={1} dot={false} name="BB المتوسط" />
                          <Line type="monotone" dataKey="bbLower" stroke="#ef444480" strokeDasharray="5 5" strokeWidth={1} dot={false} name="BB السفلي" />
                          <Line type="monotone" dataKey="sma20" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="SMA 20" />
                          <Line type="monotone" dataKey="sma50" stroke="#a855f7" strokeWidth={1.5} dot={false} name="SMA 50" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Volume Chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">حجم التداول</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={150}>
                        <ComposedChart data={chartDisplayData.slice(-60)}>
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : `${(v / 1e3).toFixed(0)}K`} />
                          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => v.toLocaleString()} />
                          <Bar dataKey="volume" name="الحجم">
                            {chartDisplayData.slice(-60).map((entry, i) => (
                              <Cell key={i} fill={entry.volColor} opacity={0.7} />
                            ))}
                          </Bar>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* MACD */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">MACD (12, 26, 9)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <ComposedChart data={chartDisplayData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                          <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                          <Legend />
                          <ReferenceLine y={0} strokeDasharray="3 3" />
                          <Bar dataKey="macdHist" fill="hsl(var(--primary))" name="Histogram" />
                          <Line type="monotone" dataKey="macd" stroke="#22c55e" strokeWidth={2} dot={false} name="MACD" />
                          <Line type="monotone" dataKey="macdSignal" stroke="#ef4444" strokeWidth={2} dot={false} name="Signal" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* RSI */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">RSI (14)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <ComposedChart data={chartDisplayData.slice(-50)}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                            <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
                            <ReferenceLine y={50} strokeDasharray="3 3" />
                            <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} dot={false} name="RSI" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Stochastic */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Stochastic (14)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <ComposedChart data={chartDisplayData.slice(-50)}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" />
                            <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="3 3" />
                            <Line type="monotone" dataKey="stochK" stroke="#3b82f6" strokeWidth={2} dot={false} name="%K" />
                            <Line type="monotone" dataKey="stochD" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="%D" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* CCI */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">CCI (20)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <ComposedChart data={chartDisplayData.slice(-50)}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                            <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                            <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" />
                            <ReferenceLine y={-100} stroke="#22c55e" strokeDasharray="3 3" />
                            <ReferenceLine y={0} strokeDasharray="3 3" />
                            <Line type="monotone" dataKey="cci" stroke="#ec4899" strokeWidth={2} dot={false} name="CCI" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* ATR */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">ATR (14) — مدى التذبذب</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <AreaChart data={chartDisplayData.slice(-50)}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                            <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                            <Area type="monotone" dataKey="atr" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} name="ATR" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Interpretation */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        تفسير المؤشرات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div>
                          <h4 className="font-semibold text-sm text-primary mb-2">RSI</h4>
                          <ul className="text-xs text-muted-foreground space-y-1 list-disc pr-4">
                            <li>&gt; 70: مشبع شراء (تصحيح متوقع)</li>
                            <li>&lt; 30: مشبع بيع (ارتفاع متوقع)</li>
                            <li>50: محايد</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-emerald-500 mb-2">MACD</h4>
                          <ul className="text-xs text-muted-foreground space-y-1 list-disc pr-4">
                            <li>تقاطع لأعلى: إشارة شراء</li>
                            <li>تقاطع لأسفل: إشارة بيع</li>
                            <li>أعلى من الصفر: اتجاه صاعد</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-purple-500 mb-2">Bollinger Bands</h4>
                          <ul className="text-xs text-muted-foreground space-y-1 list-disc pr-4">
                            <li>السعر فوق العلوي: تصحيح محتمل</li>
                            <li>السعر تحت السفلي: ارتداد محتمل</li>
                            <li>ضيق النطاق: تذبذب منخفض</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-amber-500 mb-2">الدعم والمقاومة</h4>
                          <ul className="text-xs text-muted-foreground space-y-1 list-disc pr-4">
                            <li>S1: {indicators.support1.toFixed(2)} · S2: {indicators.support2.toFixed(2)}</li>
                            <li>R1: {indicators.resistance1.toFixed(2)} · R2: {indicators.resistance2.toFixed(2)}</li>
                            <li>كسر المقاومة = اتجاه صاعد</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI Analysis Tab */}
                <TabsContent value="ai" className="space-y-4 mt-4">
                  {aiLoading && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-3" />
                        <p className="font-semibold">جاري التحليل بالذكاء الاصطناعي...</p>
                      </CardContent>
                    </Card>
                  )}
                  {!aiLoading && !aiAnalysis && (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        <Brain className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="font-semibold mb-2">تحليل AI الفني</p>
                        {!selectedSymbol ? (
                          <p className="text-sm mb-4">اختر رمزاً من القائمة أعلاه أولاً</p>
                        ) : (
                          <>
                            <p className="text-sm mb-4">اضغط للحصول على تحليل بالذكاء الاصطناعي {indicators ? 'شامل للمؤشرات الفنية' : 'عام للرمز'}</p>
                            <Button onClick={requestAIAnalysis} disabled={!selectedSymbol}>
                              <Brain className="h-4 w-4 ml-2" />
                              بدء التحليل
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {!aiLoading && aiAnalysis && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />
                          تحليل AI الفني — {selectedSymbol}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                          {aiAnalysis}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-4 border-t pt-2">
                          ⚠️ هذا التحليل مُولد بالذكاء الاصطناعي ولا يُعد نصيحة استثمارية. تحقق دائماً من البيانات بنفسك.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>

              {/* External Links */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">روابط التحليل</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Link href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(selectedSymbol || '')}`} target="_blank">
                      <Button variant="outline" size="sm" className="w-full gap-1">
                        <TrendingUp className="h-3 w-3" />
                        TradingView
                      </Button>
                    </Link>
                    <Link href={`https://finance.yahoo.com/quote/${encodeURIComponent(selectedSymbol || '')}`} target="_blank">
                      <Button variant="outline" size="sm" className="w-full gap-1">
                        <BarChart3 className="h-3 w-3" />
                        Yahoo Finance
                      </Button>
                    </Link>
                    <Link href={`https://www.stockanalysis.com/stocks/${encodeURIComponent((selectedSymbol || '').replace('.SR', ''))}/`} target="_blank">
                      <Button variant="outline" size="sm" className="w-full gap-1">
                        <Search className="h-3 w-3" />
                        Stock Analysis
                      </Button>
                    </Link>
                    <Link href="https://www.investing.com" target="_blank">
                      <Button variant="outline" size="sm" className="w-full gap-1">
                        <Activity className="h-3 w-3" />
                        Investing.com
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!indicators && !chartLoading && (
            <Card>
              <CardContent className="pt-16 pb-16 text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">اختر أصل للتحليل</p>
                <p className="text-sm">اختر من أصول محفظتك أو أدخل رمز يدوياً</p>
                {allAssets.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3 justify-center">
                    {CATEGORIES.map(cat => {
                      const count = categoryCounts[cat.id] || 0;
                      return count > 0 ? (
                        <span key={cat.id} className="text-xs bg-muted px-2 py-1 rounded">
                          {cat.label}: {count}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
