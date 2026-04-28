'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { AI_PROVIDERS, callAI, getDefaultModelForProvider, getModelsForProvider } from '@/lib/ai-providers';
import { getAISettings, getApiKey, saveDefaults } from '@/lib/api-keys';
import {
  calculateADX,
  calculateATR,
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
  getMACDSignal,
  getRSISignal,
  type DataPoint,
} from '@/lib/technical-analysis';
import {
  normalizeAnalysisAssetType,
  toYahooSymbolForAsset,
  type AnalysisAssetType,
} from '@/lib/analysis-links';
import { formatNumber } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import {
  Activity,
  Brain,
  CandlestickChart,
  Crosshair,
  ExternalLink,
  Gauge,
  Layers,
  LineChart,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Waves,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Customized,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSearchParams } from 'next/navigation';
import { analyzeDiversification, analyzePortfolioRisk, type Holding } from '@/lib/risk-analysis';

type RangeOption = '3mo' | '6mo' | '1y' | '2y';

interface OHLCVBar {
  date: string;
  timestamp?: number;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
}

interface ChartResponse {
  success?: boolean;
  symbol?: string;
  currency?: string;
  regularMarketPrice?: number;
  previousClose?: number;
  data?: OHLCVBar[];
}

interface LiveQuote {
  symbol: string;
  price: number;
  change?: number;
  changePct?: number;
  volume?: number;
  currency?: string;
  source: string;
}

interface PriceMetricsSnapshot {
  marketCap?: number;
  sharesOutstanding?: number;
  floatShares?: number;
  volume?: number;
  averageVolume?: number;
  shortPercentOfFloat?: number;
  shortRatio?: number;
  source?: string;
}

interface AssetOption {
  symbol: string;
  name: string;
  type: AnalysisAssetType;
  valueSAR: number;
  currentPrice?: number;
}

interface StrategyRead {
  key: string;
  title: string;
  subtitle: string;
  score: number;
  state: 'bullish' | 'bearish' | 'neutral';
  icon: typeof LineChart;
}

const RANGE_OPTIONS: Array<{ value: RangeOption; label: string }> = [
  { value: '3mo', label: '3 أشهر' },
  { value: '6mo', label: '6 أشهر' },
  { value: '1y', label: 'سنة' },
  { value: '2y', label: 'سنتان' },
];

const ASSET_TYPES: Array<{ value: AnalysisAssetType; label: string }> = [
  { value: 'stocks', label: 'أسهم' },
  { value: 'funds', label: 'صناديق' },
  { value: 'crypto', label: 'عملات مشفرة' },
  { value: 'commodities', label: 'سلع ومعادن' },
  { value: 'forex', label: 'فوركس' },
  { value: 'bonds', label: 'سندات وصكوك' },
];

const schoolGuide = [
  { title: 'فهم السوق', text: 'حدد أولاً: اتجاه صاعد، اتجاه هابط، أو نطاق تجميع/تذبذب.' },
  { title: 'إليوت', text: 'قراءة المرحلة النفسية للدورة: موجات دافعة وتصحيحية بدون تعقيد زائد.' },
  { title: 'وايكوف', text: 'قراءة السيولة: تجميع، صعود، تصريف، هبوط مع مراقبة Spring و Upthrust.' },
  { title: 'الهارمونيك', text: 'البحث عن مناطق انعكاس دقيقة قرب نسب فيبوناتشي المهمة.' },
  { title: 'الكلاسيكي', text: 'تأكيد الاتجاه بالنماذج الواضحة: نطاقات، قنوات، اختراقات، قمم وقيعان.' },
  { title: 'المؤشرات', text: 'RSI و MACD و EMA و Bollinger والفوليوم أدوات تأكيد، وليست قراراً منفرداً.' },
  { title: 'الدعم والمقاومة', text: 'المناطق الأقوى هي الأكثر اختباراً. راقب الكسر الوهمي، الارتداد، أو الاختراق المؤكد.' },
  { title: 'أنواع الاختراق', text: 'الاختراق الحقيقي يحتاج إغلاقاً أعلى المستوى + حجم قوي. الكاذب يظهر بذيل ورفض. الأفضل غالباً إعادة الاختبار.' },
  { title: 'الفلتر الأساسي', text: 'فرّق بين السعر والقيمة: ربحية، نمو، مديونية، سيولة، وتوزيعات قبل قرار الاحتفاظ.' },
];

const rsiMasteryPlaybook = [
  {
    key: 'zones',
    title: 'مناطق الإشباع (RSI)',
    points: [
      'فوق 70: حرارة عالية واحتمال تهدئة/تصحيح.',
      'حول 50: حياد نسبي ويحتاج تأكيد من الاتجاه.',
      'تحت 30: ضغط بيعي مرتفع واحتمال ارتداد.',
    ],
  },
  {
    key: 'divergence',
    title: 'الدايفرجنس (الإشارة الذهبية)',
    points: [
      'هبوطي: السعر قمم أعلى و RSI قمم أدنى = ضعف زخم صاعد.',
      'صعودي: السعر قيعان أدنى و RSI قيعان أعلى = تجميع محتمل.',
      'لا يكفي وحده، يحتاج دعم/مقاومة وحجم للتأكيد.',
    ],
  },
  {
    key: 'trendline-break',
    title: 'كسر خط الاتجاه على RSI',
    points: [
      'اختراق RSI لخط هابط = احتمال دخول شرائي.',
      'كسر RSI لخط صاعد = احتمال ضغط بيعي.',
      'كلما توافق مع السعر والحجم زادت جودة الإشارة.',
    ],
  },
];

const visualStrategyInsights = [
  {
    title: 'تحليل صور الدعم والمقاومة',
    bullets: [
      'الدعم/المقاومة مناطق وليست خطاً واحداً دقيقاً.',
      'تكرار اللمس يزيد قوة المنطقة.',
      'تحول المقاومة إلى دعم (والعكس) بعد الكسر الثابت مهم للدخول.',
    ],
  },
  {
    title: 'تحليل صور الاختراقات',
    bullets: [
      'الاختراق الحقيقي: إغلاق فوق المستوى + حجم تداول داعم.',
      'الاختراق الكاذب: ذيل/رفض سريع والعودة أسفل المستوى.',
      'اختراق مع إعادة اختبار: غالباً أفضل نقطة دخول مؤسسية.',
    ],
  },
  {
    title: 'تحليل صور المؤشرات الفنية',
    bullets: [
      'RSI حرارة الزخم، MACD اتجاه الزخم، EMA هيكل الاتجاه.',
      'Bollinger يوضح تمدد الحركة أو احتمال الارتداد.',
      'Volume هو فلتر الصدق: الحركة بدون حجم تستحق الحذر.',
    ],
  },
  {
    title: 'تحليل صورة المؤشرات المالية',
    bullets: [
      'فلتر الجودة: ROE وROA والهامش الصافي ونسبة الديون والسيولة السريعة.',
      'العائد النقدي مفيد للمستثمر الدخلي لكنه ليس كافياً وحده.',
      'القرار الأفضل يجمع: الاتجاه الفني + جودة الشركة + إدارة المخاطر.',
    ],
  },
];

function compactNumber(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString('en-US');
}

function sourceLabel(source?: string | null): string {
  const value = String(source || '').toLowerCase();
  if (!value) return 'غير محدد';
  if (value.includes('alpha')) return 'Alpha Vantage';
  if (value.includes('financial') || value.includes('fmp')) return 'Financial Modeling Prep';
  if (value.includes('twelve')) return 'Twelve Data';
  if (value.includes('extended')) return 'Yahoo Quote - Extended Hours';
  if (value.includes('yahoo_v7')) return 'Yahoo Quote';
  if (value.includes('yahoo_chart')) return 'Yahoo Chart';
  if (value.includes('yahoo')) return 'Yahoo Finance';
  return source || 'غير محدد';
}

function toPositiveNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function normalizeTickerQuote(payload: unknown, requestedSymbol: string): LiveQuote | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = (payload as { data?: Record<string, unknown> }).data;
  if (!data || typeof data !== 'object') return null;
  const direct = data[requestedSymbol];
  const fallback = Object.values(data)[0];
  const row = (direct || fallback) as Record<string, unknown> | undefined;
  const price = toPositiveNumber(row?.price);
  if (!row || price == null) return null;
  return {
    symbol: requestedSymbol,
    price,
    change: Number(row.change ?? 0),
    changePct: Number(row.changePct ?? 0),
    volume: toPositiveNumber(row.volume) ?? undefined,
    currency: typeof row.currency === 'string' ? row.currency : undefined,
    source: typeof row.source === 'string' ? row.source : 'ticker',
  };
}

function normalizeMarketQuote(payload: unknown, requestedSymbol: string): LiveQuote | null {
  if (!payload || typeof payload !== 'object') return null;
  const quote = (payload as { quote?: Record<string, unknown> }).quote;
  const price = toPositiveNumber(quote?.price);
  if (!quote || price == null) return null;
  return {
    symbol: typeof quote.symbol === 'string' ? quote.symbol : requestedSymbol,
    price,
    change: Number(quote.change ?? 0),
    changePct: Number(quote.changePct ?? 0),
    currency: typeof quote.currency === 'string' ? quote.currency : undefined,
    source: typeof quote.source === 'string' ? quote.source : 'market_quote',
  };
}

function quotePriority(quote: LiveQuote): number {
  const source = quote.source.toLowerCase();
  if (source.includes('extended')) return 6;
  if (source.includes('financial') || source.includes('fmp')) return 5;
  if (source.includes('alpha')) return 4;
  if (source.includes('twelve')) return 4;
  if (source.includes('yahoo_v7')) return 3;
  if (source.includes('ticker')) return 3;
  if (source.includes('yahoo')) return 2;
  return 1;
}

async function fetchLiveQuote(symbol: string): Promise<LiveQuote | null> {
  const [tickerResult, quoteResult] = await Promise.allSettled([
    fetch(`/api/ticker?symbols=${encodeURIComponent(symbol)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    }).then(async (response) => (response.ok ? response.json() : null)),
    fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    }).then(async (response) => (response.ok ? response.json() : null)),
  ]);

  const quotes = [
    tickerResult.status === 'fulfilled' ? normalizeTickerQuote(tickerResult.value, symbol) : null,
    quoteResult.status === 'fulfilled' ? normalizeMarketQuote(quoteResult.value, symbol) : null,
  ].filter((quote): quote is LiveQuote => Boolean(quote));

  if (quotes.length === 0) return null;
  return quotes.sort((a, b) => quotePriority(b) - quotePriority(a))[0];
}

function mergeLiveQuoteIntoRows(rows: OHLCVBar[], quote: LiveQuote | null): OHLCVBar[] {
  if (!quote || rows.length === 0) return rows;
  const last = rows[rows.length - 1];
  const today = new Date().toLocaleDateString('en-US');
  const shouldAppend = last.date !== today;
  const liveBar = shouldAppend
    ? {
        date: today,
        timestamp: Math.floor(Date.now() / 1000),
        open: last.close,
        high: Math.max(last.close, quote.price),
        low: Math.min(last.close, quote.price),
        close: quote.price,
        volume: quote.volume ?? last.volume,
      }
    : {
        ...last,
        high: Math.max(last.high ?? last.close, quote.price),
        low: Math.min(last.low ?? last.close, quote.price),
        close: quote.price,
        volume: quote.volume ?? last.volume,
      };

  return shouldAppend ? [...rows, liveBar] : [...rows.slice(0, -1), liveBar];
}

function pct(value?: number | null, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

function latest<T>(rows: T[]): T | null {
  return rows.length > 0 ? rows[rows.length - 1] : null;
}

function nearest(value: number, targets: number[]): number {
  return targets.reduce((best, current) => (
    Math.abs(current - value) < Math.abs(best - value) ? current : best
  ), targets[0]);
}

function stateClass(state: StrategyRead['state']) {
  if (state === 'bullish') return 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  if (state === 'bearish') return 'border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-300';
  return 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300';
}

function signalLabel(state: StrategyRead['state']) {
  if (state === 'bullish') return 'إيجابي';
  if (state === 'bearish') return 'سلبي';
  return 'محايد';
}

function estimateSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((sum, value) => sum + value, 0);
  const sumXY = values.reduce((sum, value, index) => sum + index * value, 0);
  const sumXX = values.reduce((sum, _, index) => sum + index * index, 0);
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

function pickExtrema(
  closes: number[],
  rsi: DataPoint[],
  mode: 'low' | 'high'
): { aPrice: number; bPrice: number; aRsi: number; bRsi: number } | null {
  const rsiByTime = new Map(rsi.map((point) => [point.time, point.value]));
  const points = closes
    .map((price, idx) => ({ idx, price, rsi: rsiByTime.get(idx) }))
    .filter((row) => row.rsi != null) as Array<{ idx: number; price: number; rsi: number }>;
  if (points.length < 10) return null;

  const window = points.slice(-40);
  const sorted = [...window].sort((x, y) => mode === 'low' ? x.price - y.price : y.price - x.price);
  const first = sorted[0];
  if (!first) return null;
  const second = sorted.find((row) => Math.abs(row.idx - first.idx) >= 5);
  if (!second) return null;

  const [a, b] = first.idx < second.idx ? [first, second] : [second, first];
  return { aPrice: a.price, bPrice: b.price, aRsi: a.rsi, bRsi: b.rsi };
}

function detectRsiDivergence(closes: number[], rsi: DataPoint[]): 'bullish' | 'bearish' | 'none' {
  const lows = pickExtrema(closes, rsi, 'low');
  const highs = pickExtrema(closes, rsi, 'high');

  const bullish =
    lows &&
    lows.bPrice < lows.aPrice * 0.997 &&
    lows.bRsi > lows.aRsi + 2;
  if (bullish) return 'bullish';

  const bearish =
    highs &&
    highs.bPrice > highs.aPrice * 1.003 &&
    highs.bRsi < highs.aRsi - 2;
  if (bearish) return 'bearish';

  return 'none';
}

function detectRsiTrendlineBreak(rsi: DataPoint[]): 'bullish' | 'bearish' | 'none' {
  if (rsi.length < 20) return 'none';
  const values = rsi.map((point) => point.value);
  const medium = values.slice(-14);
  const short = values.slice(-6);
  const mediumSlope = estimateSlope(medium);
  const shortSlope = estimateSlope(short);
  const last = values[values.length - 1] ?? 50;

  if (mediumSlope < -0.2 && shortSlope > 0.25 && last >= 50) return 'bullish';
  if (mediumSlope > 0.2 && shortSlope < -0.25 && last <= 50) return 'bearish';
  return 'none';
}

function classifyBreakout(params: {
  currentPrice: number;
  previousClose: number;
  lastHigh: number;
  lastLow: number;
  support: number;
  resistance: number;
  volumeRatio: number | null;
}): 'true_breakout' | 'false_breakout' | 'retest_breakout' | 'breakdown' | 'range' {
  const {
    currentPrice, previousClose, lastHigh, lastLow, support, resistance, volumeRatio,
  } = params;
  const highVol = (volumeRatio ?? 0) >= 1.3;
  const mildVol = (volumeRatio ?? 0) >= 0.95;
  const brokeUpNow = previousClose <= resistance * 1.001 && currentPrice > resistance * 1.004;
  const rejectedUp = lastHigh > resistance * 1.004 && currentPrice < resistance * 0.998;
  const retestUp = previousClose > resistance * 1.004 && currentPrice >= resistance * 0.995 && currentPrice <= resistance * 1.02;
  const brokeDown = previousClose >= support * 0.999 && currentPrice < support * 0.996 && highVol;
  const rejectedDown = lastLow < support * 0.996 && currentPrice > support * 1.002;

  if (brokeUpNow && highVol) return 'true_breakout';
  if ((retestUp && mildVol) || (brokeUpNow && !highVol && mildVol)) return 'retest_breakout';
  if (rejectedUp || rejectedDown) return 'false_breakout';
  if (brokeDown) return 'breakdown';
  return 'range';
}

function breakoutLabel(type: ReturnType<typeof classifyBreakout>): string {
  if (type === 'true_breakout') return 'اختراق حقيقي';
  if (type === 'retest_breakout') return 'اختراق مع إعادة اختبار';
  if (type === 'false_breakout') return 'اختراق كاذب';
  if (type === 'breakdown') return 'كسر هابط مؤكد';
  return 'نطاق/انتظار';
}

function rsiZoneLabel(rsi: number | null): string {
  if (rsi == null) return 'غير متاح';
  if (rsi >= 70) return 'حار جدًا (تشبع شراء)';
  if (rsi <= 30) return 'تشبع بيع';
  if (rsi >= 45 && rsi <= 55) return 'محايد';
  return 'متوازن';
}

function riskLevelLabel(level: string): string {
  if (level === 'very_low') return 'منخفض جدًا';
  if (level === 'low') return 'منخفض';
  if (level === 'medium') return 'متوسط';
  if (level === 'high') return 'مرتفع';
  if (level === 'very_high') return 'مرتفع جدًا';
  return 'غير متاح';
}

function diversificationLabel(level: string): string {
  if (level === 'excellent') return 'ممتاز';
  if (level === 'good') return 'جيد';
  if (level === 'moderate') return 'متوسط';
  if (level === 'concentrated') return 'مركز';
  return 'غير متاح';
}

function buildFallbackData(seedPrice = 100): OHLCVBar[] {
  const rows: OHLCVBar[] = [];
  let price = seedPrice * 0.9;
  for (let i = 0; i < 150; i += 1) {
    const drift = Math.sin(i / 9) * seedPrice * 0.004;
    const pulse = (Math.random() - 0.48) * seedPrice * 0.018;
    price = Math.max(seedPrice * 0.35, price + drift + pulse);
    const high = price * (1 + Math.random() * 0.015);
    const low = price * (1 - Math.random() * 0.015);
    rows.push({
      date: new Date(Date.now() - (150 - i) * 86400000).toLocaleDateString('en-US'),
      open: price * (1 - Math.random() * 0.006),
      high,
      low,
      close: price,
      volume: 500000 + Math.round(Math.random() * 4000000),
    });
  }
  rows[rows.length - 1].close = seedPrice;
  return rows;
}

type CandlestickDatum = {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
};

type AxisWithScale = {
  scale?: ((value: string | number) => number) & {
    bandwidth?: () => number;
  };
};

interface CandlestickLayerProps {
  data?: CandlestickDatum[];
  xAxisMap?: Record<string, AxisWithScale>;
  yAxisMap?: Record<string, AxisWithScale>;
}

function CandlestickLayer({ data, xAxisMap, yAxisMap }: CandlestickLayerProps) {
  if (!Array.isArray(data) || data.length === 0) return null;

  const xAxis = Object.values(xAxisMap || {})[0];
  const yAxis = (yAxisMap && yAxisMap.price) || Object.values(yAxisMap || {})[0];
  const xScale = xAxis?.scale;
  const yScale = yAxis?.scale;

  if (typeof xScale !== 'function' || typeof yScale !== 'function') return null;

  const band = typeof xScale.bandwidth === 'function' ? xScale.bandwidth() : 0;
  const candleWidth = Math.max(3, Math.min(11, band > 0 ? band * 0.6 : 6));

  return (
    <g className="recharts-candlestick-layer">
      {data.map((row, index) => {
        const open = Number(row.open ?? row.close);
        const high = Number(row.high ?? row.close);
        const low = Number(row.low ?? row.close);
        const close = Number(row.close);
        const xValue = Number(xScale(row.date));
        const yOpen = Number(yScale(open));
        const yClose = Number(yScale(close));
        const yHigh = Number(yScale(high));
        const yLow = Number(yScale(low));

        if (![xValue, yOpen, yClose, yHigh, yLow].every(Number.isFinite)) return null;

        const xCenter = xValue + (band > 0 ? band / 2 : 0);
        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
        const isBullish = close >= open;
        const fill = isBullish ? '#16a34a' : '#dc2626';
        const stroke = isBullish ? '#166534' : '#991b1b';

        return (
          <g key={`${row.date}-${index}`}>
            <line x1={xCenter} x2={xCenter} y1={yHigh} y2={yLow} stroke={stroke} strokeWidth={1.1} />
            <rect
              x={xCenter - candleWidth / 2}
              y={bodyTop}
              width={candleWidth}
              height={bodyHeight}
              fill={fill}
              stroke={stroke}
              strokeWidth={0.8}
              rx={1}
            />
          </g>
        );
      })}
    </g>
  );
}

export default function TechnicalSchoolsPage() {
  const searchParams = useSearchParams();
  const { data } = useDashboardData();
  const [symbol, setSymbol] = useState(() => (searchParams.get('symbol') || 'AAPL').trim().toUpperCase());
  const [assetType, setAssetType] = useState<AnalysisAssetType>(() => normalizeAnalysisAssetType(searchParams.get('type')) || 'stocks');
  const [range, setRange] = useState<RangeOption>('6mo');
  const [chartData, setChartData] = useState<OHLCVBar[]>([]);
  const [chartMeta, setChartMeta] = useState<ChartResponse | null>(null);
  const [liveQuote, setLiveQuote] = useState<LiveQuote | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(() => {
    if (typeof window === 'undefined') return 'zai';
    return getAISettings().defaultProvider || 'zai';
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window === 'undefined') return 'default';
    const settings = getAISettings();
    return settings.defaultModel || getDefaultModelForProvider(settings.defaultProvider || 'zai');
  });
  const [priceMetrics, setPriceMetrics] = useState<PriceMetricsSnapshot | null>(null);
  const [priceMetricsLoading, setPriceMetricsLoading] = useState(false);

  const assetOptions = useMemo((): AssetOption[] => {
    const map = new Map<string, AssetOption>();
    const push = (asset: AssetOption) => {
      const key = `${asset.symbol.toUpperCase()}::${asset.type}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, asset);
        return;
      }
      map.set(key, {
        ...existing,
        valueSAR: existing.valueSAR + asset.valueSAR,
        currentPrice: asset.currentPrice ?? existing.currentPrice,
      });
    };

    data.stocks.forEach((stock) => {
      const sector = stock.sector || '';
      let type: AnalysisAssetType = 'stocks';
      if (sector === 'Cryptocurrency') type = 'crypto';
      if (sector === 'Forex') type = 'forex';
      push({
        symbol: stock.symbol,
        name: stock.name,
        type,
        valueSAR: stock.valueSAR,
        currentPrice: stock.livePrice ?? stock.currentPrice ?? stock.buyPrice,
      });
    });
    data.funds.forEach((fund) => {
      push({
        symbol: fund.symbol || fund.name,
        name: fund.name,
        type: fund.fundType === 'commodities' ? 'commodities' : 'funds',
        valueSAR: fund.valueSAR,
        currentPrice: fund.livePrice ?? fund.currentPrice ?? fund.buyPrice,
      });
    });
    data.bonds.forEach((bond) => {
      push({
        symbol: bond.symbol,
        name: bond.name,
        type: 'bonds',
        valueSAR: bond.valueSAR,
        currentPrice: bond.currentPrice ?? bond.buyPrice,
      });
    });

    return [...map.values()].sort((a, b) => b.valueSAR - a.valueSAR).slice(0, 18);
  }, [data.bonds, data.funds, data.stocks]);

  const selectedAsset = useMemo(() => {
    const normalized = symbol.trim().toUpperCase();
    return assetOptions.find((asset) => asset.symbol.toUpperCase() === normalized && asset.type === assetType) ||
      assetOptions.find((asset) => asset.symbol.toUpperCase() === normalized) ||
      null;
  }, [assetOptions, assetType, symbol]);

  const portfolioHoldings = useMemo<Holding[]>(() => {
    const rows: Holding[] = [];

    data.stocks.forEach((stock) => {
      const sector = stock.sector || 'أخرى';
      const type = sector === 'Cryptocurrency' ? 'عملة مشفرة' : sector === 'Forex' ? 'فوركس' : 'سهم';
      rows.push({
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        value: Number(stock.valueSAR || 0),
        type,
        sector,
      });
    });

    data.funds.forEach((fund) => {
      const isCommodity = fund.fundType === 'commodities';
      rows.push({
        symbol: fund.symbol || fund.name,
        name: fund.name || fund.symbol || 'صندوق',
        value: Number(fund.valueSAR || 0),
        type: isCommodity ? 'سلعة' : 'صندوق',
        sector: isCommodity ? 'سلع ومعادن' : 'صناديق',
      });
    });

    data.bonds.forEach((bond) => {
      rows.push({
        symbol: bond.symbol,
        name: bond.name || bond.symbol,
        value: Number(bond.valueSAR || 0),
        type: 'سند/صك',
        sector: 'دخل ثابت',
      });
    });

    return rows.filter((item) => Number.isFinite(item.value) && item.value > 0);
  }, [data.bonds, data.funds, data.stocks]);

  const diversification = useMemo(() => analyzeDiversification(portfolioHoldings), [portfolioHoldings]);

  const focusedRisk = useMemo(() => {
    const closes = chartData
      .map((row) => Number(row.close))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (closes.length < 25) return null;
    return analyzePortfolioRisk(closes);
  }, [chartData]);

  const focusedSymbol = useMemo(() => symbol.trim().toUpperCase(), [symbol]);

  const strategyLinks = useMemo(() => {
    const params = new URLSearchParams();
    if (focusedSymbol) params.set('symbol', focusedSymbol);
    params.set('type', assetType);
    if (selectedAsset?.name) params.set('name', selectedAsset.name);
    const query = params.toString();
    const suffix = query ? `?${query}` : '';
    return {
      technical: `/technical-analysis${suffix}`,
      risk: `/risk-analysis${suffix}`,
      fundamental: '/fundamental-analysis',
    };
  }, [assetType, focusedSymbol, selectedAsset?.name]);

  const fetchPriceMetrics = useCallback(async () => {
    if (!focusedSymbol) {
      setPriceMetrics(null);
      return;
    }

    setPriceMetricsLoading(true);
    try {
      const yahooSymbol = toYahooSymbolForAsset(focusedSymbol, assetType);
      const response = await fetch(`/api/prices?symbols=${encodeURIComponent(yahooSymbol)}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        setPriceMetrics(null);
        return;
      }

      const payload = await response.json() as { data?: Record<string, Record<string, unknown>> };
      const map = payload?.data && typeof payload.data === 'object' ? payload.data : {};
      const candidates = Array.from(new Set([
        yahooSymbol,
        focusedSymbol,
        focusedSymbol.replace(/\.SR$/, ''),
        focusedSymbol.endsWith('.SR') ? focusedSymbol : `${focusedSymbol}.SR`,
      ]));

      const row = candidates
        .map((key) => map[key])
        .find((item) => item && typeof item === 'object');

      if (!row) {
        setPriceMetrics(null);
        return;
      }

      const toNum = (value: unknown): number | undefined => {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : undefined;
      };

      setPriceMetrics({
        marketCap: toNum(row.marketCap),
        sharesOutstanding: toNum(row.sharesOutstanding),
        floatShares: toNum(row.floatShares),
        volume: toNum(row.volume),
        averageVolume: toNum(row.averageVolume),
        shortPercentOfFloat: toNum(row.shortPercentOfFloat),
        shortRatio: toNum(row.shortRatio),
        source: typeof row.source === 'string' ? row.source : undefined,
      });
    } catch {
      setPriceMetrics(null);
    } finally {
      setPriceMetricsLoading(false);
    }
  }, [assetType, focusedSymbol]);

  const fetchChart = useCallback(async () => {
    const clean = symbol.trim().toUpperCase();
    if (!clean) return;
    setLoadingChart(true);
    setAiAnalysis('');
    try {
      const yahooSymbol = toYahooSymbolForAsset(clean, assetType);
      const [response, quote] = await Promise.all([
        fetch(`/api/chart?symbol=${encodeURIComponent(yahooSymbol)}&range=${range}&interval=1d`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(15000),
        }),
        fetchLiveQuote(yahooSymbol),
      ]);
      const payload = await response.json() as ChartResponse;
      setLiveQuote(quote);
      if (response.ok && payload.success && Array.isArray(payload.data) && payload.data.length > 20) {
        const rows = payload.data
          .filter((row) => Number.isFinite(Number(row.close)))
          .map((row) => ({
            ...row,
            open: row.open == null ? row.close : Number(row.open),
            high: row.high == null ? row.close : Number(row.high),
            low: row.low == null ? row.close : Number(row.low),
            close: Number(row.close),
            volume: row.volume == null ? null : Number(row.volume),
          }));
        setChartData(mergeLiveQuoteIntoRows(rows, quote));
        setChartMeta({
          ...payload,
          currency: quote?.currency || payload.currency,
          regularMarketPrice: quote?.price ?? payload.regularMarketPrice,
        });
        return;
      }
      const fallbackPrice = quote?.price || selectedAsset?.currentPrice || 100;
      setChartData(buildFallbackData(fallbackPrice));
      setChartMeta({ success: false, symbol: clean, currency: quote?.currency || 'USD', regularMarketPrice: quote?.price });
    } catch {
      const fallbackPrice = selectedAsset?.currentPrice || 100;
      setLiveQuote(null);
      setChartData(buildFallbackData(fallbackPrice));
      setChartMeta({ success: false, symbol: clean, currency: 'USD' });
    } finally {
      setLoadingChart(false);
    }
  }, [assetType, range, selectedAsset?.currentPrice, symbol]);

  useEffect(() => {
    void fetchChart();
  }, [fetchChart]);

  useEffect(() => {
    void fetchPriceMetrics();
  }, [fetchPriceMetrics]);

  const indicators = useMemo(() => {
    if (chartData.length < 30) return null;
    const closes = chartData.map((row) => row.close);
    const highs = chartData.map((row) => row.high ?? row.close);
    const lows = chartData.map((row) => row.low ?? row.close);
    const volumes = chartData.map((row) => row.volume ?? 0);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, Math.min(200, Math.max(55, Math.floor(chartData.length * 0.72))));
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, Math.min(200, Math.max(55, Math.floor(chartData.length * 0.72))));
    const bollinger = calculateBollingerBands(closes, 20, 2);
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes, 12, 26, 9);
    const atr = calculateATR(highs, lows, closes, 14);
    const adx = calculateADX(highs, lows, closes, 14);
    const recent = chartData.slice(-45);
    const support = Math.min(...recent.map((row) => row.low ?? row.close));
    const resistance = Math.max(...recent.map((row) => row.high ?? row.close));
    const lastClose = closes[closes.length - 1];
    const previousClose = closes[closes.length - 2] || lastClose;
    const avgVolume = volumes.slice(-30).reduce((sum, value) => sum + value, 0) / Math.max(1, volumes.slice(-30).length);
    const lastVolume = volumes[volumes.length - 1] || 0;
    const lastSma50 = latest(sma50)?.value ?? null;
    const lastSma200 = latest(sma200)?.value ?? null;
    const lastEma9 = latest(ema9)?.value ?? null;
    const lastEma21 = latest(ema21)?.value ?? null;
    const lastEma50 = latest(ema50)?.value ?? null;
    const lastEma200 = latest(ema200)?.value ?? null;
    const lastBollUpper = latest(bollinger.upper)?.value ?? null;
    const lastBollMiddle = latest(bollinger.middle)?.value ?? null;
    const lastBollLower = latest(bollinger.lower)?.value ?? null;
    const lastRsi = latest(rsi)?.value ?? null;
    const lastMacd = latest(macd.macd)?.value ?? null;
    const lastMacdSignal = latest(macd.signal)?.value ?? null;
    const lastAdx = latest(adx.adx)?.value ?? null;
    const lastAtr = latest(atr)?.value ?? null;
    const rangePct = support > 0 ? ((resistance - support) / support) * 100 : 0;
    const rangePosition = resistance > support ? ((lastClose - support) / (resistance - support)) * 100 : 50;
    const swingHigh = Math.max(...chartData.slice(-90).map((row) => row.high ?? row.close));
    const swingLow = Math.min(...chartData.slice(-90).map((row) => row.low ?? row.close));
    const retracement = swingHigh > swingLow ? (swingHigh - lastClose) / (swingHigh - swingLow) : 0;
    const nearestFib = nearest(retracement, [0.382, 0.5, 0.618, 0.786, 0.886]);
    const changePct = previousClose > 0 ? ((lastClose - previousClose) / previousClose) * 100 : 0;
    const lastRow = chartData[chartData.length - 1];
    const breakoutType = classifyBreakout({
      currentPrice: lastClose,
      previousClose,
      lastHigh: lastRow?.high ?? lastClose,
      lastLow: lastRow?.low ?? lastClose,
      support,
      resistance,
      volumeRatio: avgVolume > 0 ? lastVolume / avgVolume : null,
    });
    const rsiDivergence = detectRsiDivergence(closes, rsi);
    const rsiTrendlineBreak = detectRsiTrendlineBreak(rsi);
    const bollingerState = lastBollUpper != null && lastBollLower != null
      ? (lastClose > lastBollUpper
        ? 'above_upper'
        : lastClose < lastBollLower
          ? 'below_lower'
          : 'inside')
      : 'unknown';
    const bollingerWidthPct =
      lastBollUpper != null && lastBollLower != null && lastBollMiddle != null && lastBollMiddle !== 0
        ? ((lastBollUpper - lastBollLower) / lastBollMiddle) * 100
        : null;

    return {
      closes,
      sma20,
      sma50,
      sma200,
      ema9,
      ema21,
      ema50,
      ema200,
      bollinger,
      rsi,
      macd,
      atr,
      adx,
      support,
      resistance,
      currentPrice: lastClose,
      previousClose,
      changePct,
      avgVolume,
      lastVolume,
      volumeRatio: avgVolume > 0 ? lastVolume / avgVolume : null,
      lastSma50,
      lastSma200,
      lastEma9,
      lastEma21,
      lastEma50,
      lastEma200,
      lastBollUpper,
      lastBollMiddle,
      lastBollLower,
      bollingerState,
      bollingerWidthPct,
      lastRsi,
      rsiHeatLabel: rsiZoneLabel(lastRsi),
      rsiDivergence,
      rsiTrendlineBreak,
      lastMacd,
      lastMacdSignal,
      lastAdx,
      lastAtr,
      rangePct,
      rangePosition,
      swingHigh,
      swingLow,
      retracement,
      nearestFib,
      breakoutType,
      breakoutLabel: breakoutLabel(breakoutType),
      rsiSignal: getRSISignal(rsi),
      macdSignal: getMACDSignal(macd),
    };
  }, [chartData]);

  const displayData = useMemo(() => {
    if (!indicators) return [];
    return chartData.map((row, index) => ({
      ...row,
      sma20: indicators.sma20.find((item) => item.time === index)?.value,
      sma50: indicators.sma50.find((item) => item.time === index)?.value,
      sma200: indicators.sma200.find((item) => item.time === index)?.value,
      ema9: indicators.ema9.find((item) => item.time === index)?.value,
      ema21: indicators.ema21.find((item) => item.time === index)?.value,
      ema50: indicators.ema50.find((item) => item.time === index)?.value,
      ema200: indicators.ema200.find((item) => item.time === index)?.value,
      bbUpper: indicators.bollinger.upper.find((item) => item.time === index)?.value,
      bbMiddle: indicators.bollinger.middle.find((item) => item.time === index)?.value,
      bbLower: indicators.bollinger.lower.find((item) => item.time === index)?.value,
      rsi: indicators.rsi.find((item) => item.time === index)?.value,
      macd: indicators.macd.macd.find((item) => item.time === index)?.value,
      macdSignal: indicators.macd.signal.find((item) => item.time === index)?.value,
      macdHist: indicators.macd.histogram.find((item) => item.time === index)?.value,
      volumeColor: index > 0 && row.close >= chartData[index - 1].close ? '#16a34a' : '#dc2626',
    }));
  }, [chartData, indicators]);

  const strategyReads = useMemo((): StrategyRead[] => {
    if (!indicators) return [];
    const trendBull = indicators.currentPrice > (indicators.lastEma50 ?? indicators.lastSma50 ?? 0) && indicators.currentPrice > (indicators.lastEma200 ?? indicators.lastSma200 ?? 0);
    const trendBear =
      (indicators.lastEma50 != null || indicators.lastSma50 != null) &&
      (indicators.lastEma200 != null || indicators.lastSma200 != null) &&
      indicators.currentPrice < (indicators.lastEma50 ?? indicators.lastSma50 ?? indicators.currentPrice) &&
      indicators.currentPrice < (indicators.lastEma200 ?? indicators.lastSma200 ?? indicators.currentPrice);
    const rangeLike = (indicators.lastAdx ?? 0) < 22 || indicators.rangePct < 14;
    const highVolume = (indicators.volumeRatio ?? 0) > 1.25;
    const nearSupport = indicators.rangePosition <= 28;
    const nearResistance = indicators.rangePosition >= 72;
    const macdBull = indicators.lastMacd != null && indicators.lastMacdSignal != null && indicators.lastMacd > indicators.lastMacdSignal;
    const macdBear = indicators.lastMacd != null && indicators.lastMacdSignal != null && indicators.lastMacd < indicators.lastMacdSignal;
    const harmonicZone = Math.abs(indicators.retracement - indicators.nearestFib) <= 0.04 && [0.618, 0.786, 0.886].includes(indicators.nearestFib);

    const wyckoffState: StrategyRead['state'] = rangeLike && nearSupport && highVolume ? 'bullish' : rangeLike && nearResistance && highVolume ? 'bearish' : rangeLike ? 'neutral' : trendBull ? 'bullish' : trendBear ? 'bearish' : 'neutral';
    const elliottState: StrategyRead['state'] = trendBull && macdBull ? 'bullish' : trendBear && macdBear ? 'bearish' : 'neutral';
    const harmonicState: StrategyRead['state'] = harmonicZone && nearSupport ? 'bullish' : harmonicZone && nearResistance ? 'bearish' : 'neutral';
    const classicState: StrategyRead['state'] = trendBull && indicators.currentPrice > indicators.resistance * 0.985 ? 'bullish' : trendBear && indicators.currentPrice < indicators.support * 1.015 ? 'bearish' : rangeLike ? 'neutral' : trendBull ? 'bullish' : trendBear ? 'bearish' : 'neutral';
    const indicatorState: StrategyRead['state'] = macdBull && (indicators.lastRsi ?? 50) >= 45 && (indicators.lastRsi ?? 50) <= 70 ? 'bullish' : macdBear && (indicators.lastRsi ?? 50) <= 55 ? 'bearish' : 'neutral';
    const rsiProState: StrategyRead['state'] =
      indicators.rsiDivergence === 'bullish' || indicators.rsiTrendlineBreak === 'bullish'
        ? 'bullish'
        : indicators.rsiDivergence === 'bearish' || indicators.rsiTrendlineBreak === 'bearish'
          ? 'bearish'
          : indicators.lastRsi != null && indicators.lastRsi > 70
            ? 'bearish'
            : indicators.lastRsi != null && indicators.lastRsi < 30
              ? 'bullish'
              : 'neutral';
    const breakoutState: StrategyRead['state'] =
      indicators.breakoutType === 'true_breakout' || indicators.breakoutType === 'retest_breakout'
        ? 'bullish'
        : indicators.breakoutType === 'breakdown' || indicators.breakoutType === 'false_breakout'
          ? 'bearish'
          : 'neutral';

    return [
      {
        key: 'market',
        title: 'حالة السوق',
        subtitle: trendBull ? 'السعر أعلى المتوسطات الرئيسية' : trendBear ? 'السعر أسفل المتوسطات الرئيسية' : 'السوق بين الاتجاه والنطاق',
        score: trendBull ? 82 : trendBear ? 28 : 55,
        state: trendBull ? 'bullish' : trendBear ? 'bearish' : 'neutral',
        icon: Gauge,
      },
      {
        key: 'wyckoff',
        title: 'وايكوف والسيولة',
        subtitle: rangeLike && nearSupport ? 'قريب من دعم نطاق مع مراقبة Spring' : rangeLike && nearResistance ? 'قريب من مقاومة نطاق مع احتمال Upthrust' : 'القراءة مرتبطة بقوة الفوليوم',
        score: wyckoffState === 'bullish' ? 84 : wyckoffState === 'bearish' ? 30 : 58,
        state: wyckoffState,
        icon: Layers,
      },
      {
        key: 'elliott',
        title: 'إليوت بصورة عامة',
        subtitle: elliottState === 'bullish' ? 'زخم اتجاهي يشبه موجة دافعة' : elliottState === 'bearish' ? 'زخم هابط أو تصحيح عميق' : 'لا توجد موجة مسيطرة واضحة',
        score: elliottState === 'bullish' ? 78 : elliottState === 'bearish' ? 35 : 52,
        state: elliottState,
        icon: Waves,
      },
      {
        key: 'harmonic',
        title: 'الهارمونيك',
        subtitle: harmonicZone ? `قرب نسبة فيبوناتشي ${(indicators.nearestFib * 100).toFixed(1)}%` : 'بعيد عن منطقة PRZ واضحة',
        score: harmonicState === 'bullish' ? 80 : harmonicState === 'bearish' ? 33 : 50,
        state: harmonicState,
        icon: Crosshair,
      },
      {
        key: 'classic',
        title: 'الكلاسيكي',
        subtitle: classicState === 'bullish' ? 'اختراق/استمرار أقرب من الانعكاس' : classicState === 'bearish' ? 'كسر/ضغط بيعي أقرب' : 'نطاق يحتاج كسر مؤكد',
        score: classicState === 'bullish' ? 76 : classicState === 'bearish' ? 34 : 55,
        state: classicState,
        icon: CandlestickChart,
      },
      {
        key: 'indicators',
        title: 'المؤشرات',
        subtitle: `RSI ${formatNumber(indicators.lastRsi ?? 0, 1)} • MACD ${indicators.macdSignal} • Bollinger ${indicators.bollingerState === 'above_upper' ? 'قوة' : indicators.bollingerState === 'below_lower' ? 'ضعف/ارتداد' : 'داخل النطاق'}`,
        score: indicatorState === 'bullish' ? 81 : indicatorState === 'bearish' ? 31 : 54,
        state: indicatorState,
        icon: Activity,
      },
      {
        key: 'rsi-pro',
        title: 'RSI المتقدم',
        subtitle:
          indicators.rsiDivergence === 'bullish'
            ? 'دايفرجنس صاعد محتمل'
            : indicators.rsiDivergence === 'bearish'
              ? 'دايفرجنس هابط محتمل'
              : indicators.rsiTrendlineBreak === 'bullish'
                ? 'كسر خط اتجاه RSI لأعلى'
                : indicators.rsiTrendlineBreak === 'bearish'
                  ? 'كسر خط اتجاه RSI لأسفل'
                  : indicators.rsiHeatLabel,
        score: rsiProState === 'bullish' ? 79 : rsiProState === 'bearish' ? 35 : 55,
        state: rsiProState,
        icon: Gauge,
      },
      {
        key: 'breakout',
        title: 'جودة الاختراق',
        subtitle: `${indicators.breakoutLabel} • حجم ${indicators.volumeRatio ? `${indicators.volumeRatio.toFixed(2)}x` : '—'}`,
        score: breakoutState === 'bullish' ? 82 : breakoutState === 'bearish' ? 34 : 56,
        state: breakoutState,
        icon: Target,
      },
    ];
  }, [indicators]);

  const confluence = useMemo(() => {
    if (strategyReads.length === 0) return { score: 0, label: 'غير جاهز', state: 'neutral' as StrategyRead['state'] };
    const score = strategyReads.reduce((sum, item) => sum + item.score, 0) / strategyReads.length;
    const bullish = strategyReads.filter((item) => item.state === 'bullish').length;
    const bearish = strategyReads.filter((item) => item.state === 'bearish').length;
    const state: StrategyRead['state'] = bullish >= 4 ? 'bullish' : bearish >= 3 ? 'bearish' : 'neutral';
    const label = state === 'bullish' ? 'توافق إيجابي' : state === 'bearish' ? 'توافق سلبي' : 'انتظار تأكيد';
    return { score, label, state };
  }, [strategyReads]);

  const requestAI = async () => {
    if (!indicators || !symbol.trim()) return;
    setAiLoading(true);
    setAiAnalysis('');
    try {
      const prompt = `
حلل ${symbol.trim().toUpperCase()} وفق استراتيجية المدارس الفنية المتكاملة:

بيانات السوق:
- السعر الحالي: ${indicators.currentPrice.toFixed(4)} ${chartMeta?.currency || ''}
- مصدر السعر: ${sourceLabel(liveQuote?.source || (chartMeta?.success ? 'Yahoo Chart' : 'fallback'))}
- التغير اليومي التقريبي: ${pct(indicators.changePct, 2)}
- الدعم: ${indicators.support.toFixed(4)}
- المقاومة: ${indicators.resistance.toFixed(4)}
- EMA9: ${indicators.lastEma9?.toFixed(4) || 'غير متاح'}
- EMA21: ${indicators.lastEma21?.toFixed(4) || 'غير متاح'}
- EMA50: ${indicators.lastEma50?.toFixed(4) || 'غير متاح'}
- EMA200: ${indicators.lastEma200?.toFixed(4) || 'غير متاح'}
- RSI: ${indicators.lastRsi?.toFixed(2) || 'غير متاح'} (${indicators.rsiSignal})
- RSI Heat: ${indicators.rsiHeatLabel}
- RSI Divergence: ${indicators.rsiDivergence}
- RSI Trendline Break: ${indicators.rsiTrendlineBreak}
- MACD: ${indicators.lastMacd?.toFixed(4) || 'غير متاح'} / Signal ${indicators.lastMacdSignal?.toFixed(4) || 'غير متاح'} (${indicators.macdSignal})
- Bollinger: ${indicators.bollingerState} | Width ${indicators.bollingerWidthPct?.toFixed(2) || 'غير متاح'}%
- ADX: ${indicators.lastAdx?.toFixed(2) || 'غير متاح'}
- ATR: ${indicators.lastAtr?.toFixed(4) || 'غير متاح'}
- حجم اليوم: ${compactNumber(indicators.lastVolume)}
- متوسط الحجم 30 يوم: ${compactNumber(indicators.avgVolume)}
- تصنيف الاختراق الحالي: ${indicators.breakoutLabel}
- موقع السعر داخل النطاق: ${pct(indicators.rangePosition, 1)}
- أقرب نسبة فيبوناتشي: ${(indicators.nearestFib * 100).toFixed(1)}%

توافق المدارس الحالي:
${strategyReads.map((item) => `- ${item.title}: ${signalLabel(item.state)} | ${item.subtitle} | درجة ${item.score}`).join('\n')}

اكتب تقريراً عربياً عملياً ومنظماً يتضمن:
1. حالة السوق: صاعد/هابط/تجميع أو تذبذب.
2. قراءة وايكوف: تجميع أو تصريف أو انتظار، وهل يوجد Spring/Upthrust محتمل.
3. قراءة إليوت بصورة مبسطة بدون ترقيم متكلف.
4. قراءة هارمونيك: هل توجد PRZ محتملة.
5. قراءة كلاسيكية: نموذج/نطاق/اختراق/كسر.
6. المؤشرات: RSI و MACD والمتوسطات والفوليوم.
7. سيناريو دخول، وقف خسارة، أهداف، وسيناريو إلغاء الفكرة.
8. فلتر أساسي توعوي مختصر: ROE/ROA/الهامش/الديون/السيولة/التوزيعات (حتى لو بياناته غير مكتملة).
9. درجة ثقة من 100.

استخدم لغة واضحة للمضارب، ولا تعتبره توصية ملزمة.`;

      const systemPrompt = 'أنت محلل سوق محترف ومبرمج كمي. اجمع بين وايكوف، إليوت المبسط، الهارمونيك، التحليل الكلاسيكي، والمؤشرات. لا تبالغ في اليقين، واربط كل حكم ببيانات الشارت.';
      const result = await callAI(prompt, selectedProvider, getApiKey(selectedProvider), systemPrompt, selectedModel);
      setAiAnalysis(result);
    } catch (error) {
      setAiAnalysis(error instanceof Error ? `تعذر تشغيل الذكاء الاصطناعي: ${error.message}` : 'تعذر تشغيل الذكاء الاصطناعي.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="المدارس الفنية الذكية" />
        <main className="p-4 lg:p-6 space-y-5">
          <section className="rounded-lg border bg-gradient-to-l from-slate-950 via-slate-900 to-cyan-950 p-4 text-white shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-cyan-400 text-slate-950">AI + Live Market</Badge>
                  <Badge variant="outline" className="border-white/30 text-white">إليوت</Badge>
                  <Badge variant="outline" className="border-white/30 text-white">وايكوف</Badge>
                  <Badge variant="outline" className="border-white/30 text-white">هارمونيك</Badge>
                  <Badge variant="outline" className="border-white/30 text-white">كلاسيكي</Badge>
                </div>
                <div>
                  <h1 className="text-2xl font-bold lg:text-3xl">دليل احتراف المدارس الفنية وفهم السوق</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-200">
                    صفحة تشغيل تربط الاستراتيجية بالشارت والأسعار والمؤشرات، ثم تجمع القراءة في تقرير AI قابل للاستخدام قبل قرار المضاربة، مع دمج منهج RSI المتقدم وتحليل الدعم/المقاومة والاختراقات كما في النماذج التعليمية المرفقة.
                  </p>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="rounded-md border border-white/15 bg-white/10 p-3">
                    <p className="text-xs text-slate-300">التوافق الحالي</p>
                    <p className={cn('mt-1 text-xl font-bold', confluence.state === 'bullish' ? 'text-emerald-300' : confluence.state === 'bearish' ? 'text-red-300' : 'text-amber-300')}>
                      {confluence.label}
                    </p>
                  </div>
                  <div className="rounded-md border border-white/15 bg-white/10 p-3">
                    <p className="text-xs text-slate-300">درجة التوافق</p>
                    <p className="mt-1 text-xl font-bold">{formatNumber(confluence.score, 1)} / 100</p>
                  </div>
                  <div className="rounded-md border border-white/15 bg-white/10 p-3">
                    <p className="text-xs text-slate-300">مصدر السعر</p>
                    <p className="mt-1 text-xl font-bold">{sourceLabel(liveQuote?.source || (chartMeta?.success ? 'Yahoo Chart' : 'fallback'))}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-white/15 bg-black/20 p-4">
                <p className="text-sm font-bold text-cyan-200">ملخص القرار السريع</p>
                {indicators ? (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-md border border-white/15 bg-white/10 p-2">
                        <p className="text-slate-300">السعر المباشر</p>
                        <p className="mt-1 text-sm font-bold">
                          {formatNumber(indicators.currentPrice, 4)} {chartMeta?.currency || ''}
                        </p>
                      </div>
                      <div className="rounded-md border border-white/15 bg-white/10 p-2">
                        <p className="text-slate-300">التغير اليومي</p>
                        <p className={cn('mt-1 text-sm font-bold', (indicators.changePct ?? 0) >= 0 ? 'text-emerald-300' : 'text-red-300')}>
                          {pct(indicators.changePct, 2)}
                        </p>
                      </div>
                      <div className="rounded-md border border-white/15 bg-white/10 p-2">
                        <p className="text-slate-300">نسبة الفوليوم</p>
                        <p className="mt-1 text-sm font-bold">
                          {indicators.volumeRatio ? `${indicators.volumeRatio.toFixed(2)}x` : '—'}
                        </p>
                      </div>
                      <div className="rounded-md border border-white/15 bg-white/10 p-2">
                        <p className="text-slate-300">RSI / الاختراق</p>
                        <p className="mt-1 text-sm font-bold">
                          {formatNumber(indicators.lastRsi ?? 0, 1)} / {indicators.breakoutLabel}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-md border border-white/15 bg-white/5 p-3 text-xs">
                      <p className="mb-2 font-semibold text-slate-200">قائمة تحقق قبل التنفيذ</p>
                      <div className="space-y-1.5">
                        {[
                          {
                            label: 'ترتيب EMA إيجابي',
                            ok:
                              indicators.lastEma9 != null &&
                              indicators.lastEma21 != null &&
                              indicators.lastEma50 != null &&
                              indicators.lastEma200 != null &&
                              indicators.currentPrice >= indicators.lastEma50 &&
                              indicators.lastEma9 >= indicators.lastEma21 &&
                              indicators.lastEma21 >= indicators.lastEma50,
                          },
                          {
                            label: 'زخم MACD داعم',
                            ok: indicators.lastMacd != null && indicators.lastMacdSignal != null && indicators.lastMacd >= indicators.lastMacdSignal,
                          },
                          {
                            label: 'RSI صحي أو دايفرجنس صاعد',
                            ok:
                              ((indicators.lastRsi ?? 0) >= 40 && (indicators.lastRsi ?? 0) <= 70) ||
                              indicators.rsiDivergence === 'bullish' ||
                              indicators.rsiTrendlineBreak === 'bullish',
                          },
                          {
                            label: 'اختراق مؤكد بالحجم',
                            ok:
                              (indicators.breakoutType === 'true_breakout' || indicators.breakoutType === 'retest_breakout') &&
                              (indicators.volumeRatio ?? 0) >= 1,
                          },
                        ].map((check) => (
                          <div key={check.label} className="flex items-center justify-between rounded border border-white/10 px-2 py-1">
                            <span>{check.label}</span>
                            <span className={cn('font-semibold', check.ok ? 'text-emerald-300' : 'text-amber-300')}>
                              {check.ok ? 'متحقق' : 'راقب'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] leading-5 text-slate-300">
                      القرار النهائي يعتمد على إدارة المخاطر وحجم الصفقة. التوافق الحالي: {confluence.label} ({formatNumber(confluence.score, 1)} / 100)
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-md border border-white/15 bg-white/5 p-3 text-xs text-slate-300">
                    حمّل بيانات الرمز أولاً ليظهر ملخص القرار السريع.
                  </div>
                )}
              </div>
            </div>
          </section>

          <Card>
            <CardContent className="p-3">
              <div className="grid gap-2 lg:grid-cols-12">
                <div className="relative lg:col-span-3">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={symbol}
                    onChange={(event) => setSymbol(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void fetchChart();
                    }}
                    className="pr-9"
                    placeholder="AAPL أو 2222.SR أو BTC"
                  />
                </div>
                <Select value={assetType} onValueChange={(value) => setAssetType(value as AnalysisAssetType)}>
                  <SelectTrigger className="lg:col-span-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={range} onValueChange={(value) => setRange(value as RangeOption)}>
                  <SelectTrigger className="lg:col-span-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RANGE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedProvider} onValueChange={(value) => {
                  setSelectedProvider(value);
                  const nextModel = getDefaultModelForProvider(value);
                  setSelectedModel(nextModel);
                  saveDefaults(value, nextModel);
                }}>
                  <SelectTrigger className="lg:col-span-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>{provider.nameAr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedModel} onValueChange={(value) => {
                  setSelectedModel(value);
                  saveDefaults(selectedProvider, value);
                }}>
                  <SelectTrigger className="lg:col-span-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getModelsForProvider(selectedProvider).map((model) => (
                      <SelectItem key={model.id} value={model.id}>{model.nameAr || model.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => void fetchChart()} disabled={loadingChart} className="lg:col-span-1">
                  {loadingChart ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
              {assetOptions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {assetOptions.map((asset) => (
                    <Button
                      key={`${asset.symbol}-${asset.type}`}
                      variant={asset.symbol === symbol && asset.type === assetType ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSymbol(asset.symbol.toUpperCase());
                        setAssetType(asset.type);
                      }}
                    >
                      {asset.symbol}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
            <Card className="overflow-hidden">
              <CardHeader className="border-b py-3">
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <span className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-cyan-600" />
                    الشارت والمؤشرات
                  </span>
                  {indicators && (
                    <span className="text-sm font-normal text-muted-foreground" dir="ltr">
                      {symbol} · {formatNumber(indicators.currentPrice, 4)} {chartMeta?.currency || ''} · {sourceLabel(liveQuote?.source || 'Yahoo Chart')}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-3">
                <div className="h-[390px] w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={displayData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" minTickGap={24} tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="price" domain={['auto', 'auto']} orientation="right" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="volume" orientation="left" tickFormatter={(value) => compactNumber(Number(value))} tick={{ fontSize: 10 }} />
                      <Tooltip
                        labelFormatter={(label, payload) => {
                          const row = payload?.[0]?.payload as CandlestickDatum | undefined;
                          if (!row) return label;
                          const open = Number(row.open ?? row.close);
                          const high = Number(row.high ?? row.close);
                          const low = Number(row.low ?? row.close);
                          const close = Number(row.close);
                          return `${label} | O:${open.toFixed(4)} H:${high.toFixed(4)} L:${low.toFixed(4)} C:${close.toFixed(4)}`;
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'volume') return [compactNumber(value), 'Volume'];
                          return [Number(value).toFixed(4), name];
                        }}
                      />
                      <Legend />
                      <Customized component={<CandlestickLayer data={displayData} />} />
                      <Line yAxisId="price" type="monotone" dataKey="ema9" name="EMA 9" stroke="#f97316" dot={false} strokeWidth={1.3} />
                      <Line yAxisId="price" type="monotone" dataKey="ema21" name="EMA 21" stroke="#2563eb" dot={false} strokeWidth={1.4} />
                      <Line yAxisId="price" type="monotone" dataKey="ema50" name="EMA 50" stroke="#f59e0b" dot={false} strokeWidth={1.7} />
                      <Line yAxisId="price" type="monotone" dataKey="ema200" name="EMA 200" stroke="#7c3aed" dot={false} strokeWidth={1.7} />
                      <Line yAxisId="price" type="monotone" dataKey="bbUpper" name="Bollinger Upper" stroke="#14b8a6" dot={false} strokeWidth={1.1} strokeDasharray="4 3" />
                      <Line yAxisId="price" type="monotone" dataKey="bbLower" name="Bollinger Lower" stroke="#14b8a6" dot={false} strokeWidth={1.1} strokeDasharray="4 3" />
                      <Bar yAxisId="volume" dataKey="volume" name="volume" opacity={0.28} fill="#64748b" />
                      {indicators && (
                        <>
                          <ReferenceLine yAxisId="price" y={indicators.support} stroke="#16a34a" strokeDasharray="4 4" label="Support" />
                          <ReferenceLine yAxisId="price" y={indicators.resistance} stroke="#dc2626" strokeDasharray="4 4" label="Resistance" />
                        </>
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="h-[170px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={displayData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value: number) => [Number(value).toFixed(2), 'RSI']} />
                        <ReferenceLine y={70} stroke="#dc2626" strokeDasharray="4 4" />
                        <ReferenceLine y={30} stroke="#16a34a" strokeDasharray="4 4" />
                        <Area type="monotone" dataKey="rsi" stroke="#2563eb" fill="#2563eb" fillOpacity={0.14} name="RSI" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-[170px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={displayData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value: number, name: string) => [Number(value).toFixed(4), name]} />
                        <Bar dataKey="macdHist" fill="#94a3b8" name="MACD Hist" opacity={0.5} />
                        <Line type="monotone" dataKey="macd" stroke="#0f766e" dot={false} name="MACD" />
                        <Line type="monotone" dataKey="macdSignal" stroke="#ea580c" dot={false} name="Signal" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-5 w-5 text-amber-600" />
                    لوحة القرار
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {indicators ? (
                    <>
                      <div className={cn('rounded-md border p-3', stateClass(confluence.state))}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{confluence.label}</span>
                          <span className="text-lg font-black">{formatNumber(confluence.score, 1)}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-current" style={{ width: `${Math.max(0, Math.min(100, confluence.score))}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-md border p-2">
                          <p className="text-xs text-muted-foreground">السعر المباشر</p>
                          <p className="font-bold">{formatNumber(indicators.currentPrice, 4)} {chartMeta?.currency || ''}</p>
                        </div>
                        <div className="rounded-md border p-2">
                          <p className="text-xs text-muted-foreground">المصدر</p>
                          <p className="font-bold">{sourceLabel(liveQuote?.source || 'Yahoo Chart')}</p>
                        </div>
                        <div className="rounded-md border p-2">
                          <p className="text-xs text-muted-foreground">الدعم</p>
                          <p className="font-bold">{formatNumber(indicators.support, 4)}</p>
                        </div>
                        <div className="rounded-md border p-2">
                          <p className="text-xs text-muted-foreground">المقاومة</p>
                          <p className="font-bold">{formatNumber(indicators.resistance, 4)}</p>
                        </div>
                        <div className="rounded-md border p-2">
                          <p className="text-xs text-muted-foreground">RSI</p>
                          <p className="font-bold">{formatNumber(indicators.lastRsi ?? 0, 1)}</p>
                          <p className="text-[11px] text-muted-foreground">{indicators.rsiHeatLabel}</p>
                        </div>
                        <div className="rounded-md border p-2">
                          <p className="text-xs text-muted-foreground">الاختراق / الحجم</p>
                          <p className="font-bold">{indicators.breakoutLabel}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {indicators.volumeRatio ? `${indicators.volumeRatio.toFixed(1)}x` : '—'} · Boll {(indicators.bollingerWidthPct ?? 0).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <Button onClick={() => void requestAI()} disabled={aiLoading} className="w-full gap-2">
                        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        تحليل AI بالمدارس الفنية
                      </Button>
                    </>
                  ) : (
                    <div className="py-8 text-center text-sm text-muted-foreground">حمّل الشارت لاحتساب القراءة.</div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-2">
                {strategyReads.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className={cn('rounded-md border p-3', stateClass(item.state))}>
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-4 w-4" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold">{item.title}</p>
                            <Badge variant="outline">{signalLabel(item.state)}</Badge>
                          </div>
                          <p className="mt-1 text-xs leading-5 opacity-85">{item.subtitle}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <Tabs defaultValue="strategy-suite" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5 lg:w-[980px]">
              <TabsTrigger value="strategy-suite">المنظومة الموحّدة</TabsTrigger>
              <TabsTrigger value="ai">تحليل AI</TabsTrigger>
              <TabsTrigger value="guide">الدليل</TabsTrigger>
              <TabsTrigger value="rsi-mastery">RSI + الصور</TabsTrigger>
              <TabsTrigger value="playbook">خطة التنفيذ</TabsTrigger>
            </TabsList>
            <TabsContent value="strategy-suite" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">ملخص الاستراتيجية الموحّدة</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">المحور الفني</p>
                    <p className="mt-1 font-bold">{confluence.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      درجة التوافق: {formatNumber(confluence.score, 1)} / 100
                    </p>
                    <p className="text-xs text-muted-foreground">
                      RSI: {indicators ? formatNumber(indicators.lastRsi ?? 0, 1) : '—'} · {indicators?.breakoutLabel || '—'}
                    </p>
                  </div>

                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">تحليل المخاطر (الرمز الحالي)</p>
                    <p className="mt-1 font-bold">{focusedRisk ? riskLevelLabel(focusedRisk.riskLevel) : 'غير متاح'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      التقلب: {focusedRisk?.volatility != null ? `${formatNumber(focusedRisk.volatility, 2)}%` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      أقصى هبوط: {focusedRisk ? `${formatNumber(focusedRisk.maxDrawdown, 2)}%` : '—'}
                    </p>
                  </div>

                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">تنويع المحفظة</p>
                    <p className="mt-1 font-bold">{diversificationLabel(diversification.diversification)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      تركّز أعلى 5: {formatNumber(diversification.top5Concentration || 0, 1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      عدد المراكز: {formatNumber(diversification.count || 0, 0)}
                    </p>
                  </div>

                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">المحور الأساسي (سريع)</p>
                    {priceMetricsLoading ? (
                      <p className="mt-1 text-sm text-muted-foreground">جاري التحميل...</p>
                    ) : (
                      <>
                        <p className="mt-1 font-bold">
                          القيمة السوقية: {priceMetrics?.marketCap != null ? compactNumber(priceMetrics.marketCap) : 'غير متاح'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          الأسهم الحرة: {priceMetrics?.floatShares != null ? compactNumber(priceMetrics.floatShares) : 'غير متاح'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          القائمة: {priceMetrics?.sharesOutstanding != null ? compactNumber(priceMetrics.sharesOutstanding) : 'غير متاح'}
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="tech" className="space-y-3">
                <TabsList className="grid w-full grid-cols-3 lg:w-[760px]">
                  <TabsTrigger value="tech">صفحة التحليل الفني</TabsTrigger>
                  <TabsTrigger value="risk">صفحة تحليل المخاطر</TabsTrigger>
                  <TabsTrigger value="fundamental">صفحة التحليل الأساسي</TabsTrigger>
                </TabsList>

                <TabsContent value="tech">
                  <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                      <CardTitle className="text-sm">التحليل الفني المدمج</CardTitle>
                      <Button asChild size="sm" variant="outline">
                        <a href={strategyLinks.technical} target="_blank" rel="noreferrer" className="gap-1">
                          فتح كامل
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <iframe
                        src={strategyLinks.technical}
                        title="التحليل الفني"
                        loading="lazy"
                        className="h-[920px] w-full border-0"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="risk">
                  <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                      <CardTitle className="text-sm">تحليل المخاطر المدمج</CardTitle>
                      <Button asChild size="sm" variant="outline">
                        <a href={strategyLinks.risk} target="_blank" rel="noreferrer" className="gap-1">
                          فتح كامل
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <iframe
                        src={strategyLinks.risk}
                        title="تحليل المخاطر"
                        loading="lazy"
                        className="h-[920px] w-full border-0"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="fundamental">
                  <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                      <CardTitle className="text-sm">التحليل الأساسي المدمج</CardTitle>
                      <Button asChild size="sm" variant="outline">
                        <a href={strategyLinks.fundamental} target="_blank" rel="noreferrer" className="gap-1">
                          فتح كامل
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <iframe
                        src={strategyLinks.fundamental}
                        title="التحليل الأساسي"
                        loading="lazy"
                        className="h-[920px] w-full border-0"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
            <TabsContent value="ai">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain className="h-5 w-5 text-primary" />
                    القراءة الذكية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري بناء التقرير...
                    </div>
                  ) : aiAnalysis ? (
                    <div className="whitespace-pre-wrap rounded-md border bg-muted/25 p-4 text-sm leading-7">
                      {aiAnalysis}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      اضغط تحليل AI بعد تحميل الشارت للحصول على تقرير يجمع المدارس الأربع والمؤشرات.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="guide">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {schoolGuide.map((item) => (
                  <Card key={item.title}>
                    <CardContent className="p-4">
                      <p className="font-bold">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="rsi-mastery" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">محرّك RSI المتقدم (من الشارت الحالي)</CardTitle>
                </CardHeader>
                <CardContent>
                  {indicators ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">منطقة RSI</p>
                        <p className="mt-1 font-bold">{indicators.rsiHeatLabel}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">الدايفرجنس</p>
                        <p className="mt-1 font-bold">
                          {indicators.rsiDivergence === 'bullish' ? 'صاعد' : indicators.rsiDivergence === 'bearish' ? 'هابط' : 'غير واضح'}
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">كسر خط RSI</p>
                        <p className="mt-1 font-bold">
                          {indicators.rsiTrendlineBreak === 'bullish' ? 'لأعلى' : indicators.rsiTrendlineBreak === 'bearish' ? 'لأسفل' : 'لا يوجد كسر واضح'}
                        </p>
                      </div>
                      <div className="rounded-md border p-3">
                        <p className="text-xs text-muted-foreground">نوع الاختراق</p>
                        <p className="mt-1 font-bold">{indicators.breakoutLabel}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      حمّل الشارت أولاً لتفعيل قراءات RSI المتقدمة.
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {rsiMasteryPlaybook.map((item) => (
                  <Card key={item.key}>
                    <CardContent className="p-4">
                      <p className="font-bold">{item.title}</p>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {item.points.map((point) => (
                          <p key={point}>• {point}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {visualStrategyInsights.map((item) => (
                  <Card key={item.title}>
                    <CardContent className="p-4">
                      <p className="font-bold">{item.title}</p>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {item.bullets.map((bullet) => (
                          <p key={bullet}>• {bullet}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">فلتر مالي مساعد (فرق السعر عن القيمة)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    ['EPS / BVPS', 'مقارنة ربحية السهم والقيمة الدفترية مع السعر الحالي'],
                    ['ROE', 'فوق 15% ممتاز غالبًا'],
                    ['ROA', 'فوق 7% جيد غالبًا'],
                    ['هامش صافي الربح', 'فوق 10% يعطي هامش أمان أفضل'],
                    ['الديون إلى حقوق المساهمين', 'الأقل أفضل غالبًا (تحت 1 جيد)'],
                    ['السيولة السريعة', 'فوق 1 جيد وفوق 1.5 أقوى'],
                    ['العائد النقدي', 'مفيد للدخل لكن مع جودة ربحية مستدامة'],
                  ].map(([label, hint]) => (
                    <div key={label} className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 text-sm font-bold">{hint}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="playbook">
              <Card>
                <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['1', 'حدد الاتجاه', 'EMA50 و EMA200 + ADX'],
                    ['2', 'حدد المرحلة', 'وايكوف: تجميع أم تصريف؟'],
                    ['3', 'ابحث عن نقطة', 'PRZ أو دعم/مقاومة أو اختراق مع إعادة اختبار'],
                    ['4', 'أكد القرار', 'RSI (إشباع/دايفرجنس) + MACD + Bollinger + Volume'],
                  ].map(([step, title, text]) => (
                    <div key={step} className="rounded-md border p-3">
                      <Badge>{step}</Badge>
                      <p className="mt-3 font-bold">{title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/25 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>التحليل تعليمي ومساند للقرار. الصفقة القوية تحتاج توافق مدارس + إدارة مخاطرة + تأكيد فوليوم.</span>
            {selectedAsset && <span>الأصل من محفظتك: {selectedAsset.name}</span>}
          </div>
        </main>
      </div>
    </div>
  );
}
