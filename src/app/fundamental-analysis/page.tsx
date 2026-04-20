'use client';

import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { notifySuccess, notifyError } from '@/hooks/use-notifications';
import {
  AI_PROVIDERS, getDefaultModelForProvider, getModelsForProvider, callAI,
} from '@/lib/ai-providers';
import { getAISettings, getApiKey, saveDefaults } from '@/lib/api-keys';
import {
  LineChart, Line, BarChart, Bar, ComposedChart, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Cell,
} from 'recharts';
import {
  Search, Loader2, Brain, Zap, AlertTriangle,
} from 'lucide-react';

/* ─── Types ─── */
type AssetType = 'stock' | 'fund' | 'crypto' | 'forex' | 'commodity';

interface FundamentalAnalysis {
  overview: {
    companyName: string;
    sector: string;
    industry: string;
    description: string;
    assetType: string;
  };
  valuation: {
    currentPrice: number;
    fairValue: number;
    upsidePercent: number;
    pe: number;
    forwardPE: number;
    pegRatio: number;
    pbRatio: number;
    psRatio: number;
    evToEbitda: number;
    recommendation: string;
  };
  profitability: {
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    roe: number;
    roa: number;
    roic: number;
    margins: { year: string; gross: number; operating: number; net: number }[];
  };
  growth: {
    revenueGrowthYoY: number;
    epsGrowthYoY: number;
    epsCagr3y: number;
    epsCagr5y: number;
    revenueCagr3y: number;
    revenueHistory: { year: string; revenue: number; eps: number }[];
    rpoGrowth?: number;
  };
  cashFlow: {
    freeCashFlow: number;
    fcfMargin: number;
    fcfYield: number;
    capexToRevenue: number;
    netCash: number;
    debtToEquity: number;
    currentRatio: number;
    fcfHistory: { year: string; fcf: number; capexPercent: number }[];
  };
  segments?: { name: string; revenue: number; revenuePercent: number; margin: number; growth: number }[];
  scenarios: {
    bull: { price: number; probability: number; rationale: string; pe?: number; eps?: number };
    base: { price: number; probability: number; rationale: string; pe?: number; eps?: number };
    bear: { price: number; probability: number; rationale: string; pe?: number; eps?: number };
    weightedTarget: number;
  };
  sensitivityMatrix?: {
    peMultiples: number[];
    opMargins: number[];
    prices: number[][];
    revenueEstimate?: number;
    sharesOutstanding?: number;
    taxRate?: number;
    baseCase?: { pe: number; margin: number };
    bullCase?: { pe: number; margin: number };
  };
  risks: string[];
  catalysts: string[];
  competitorComparison?: { name: string; pe: number; pegRatio: number; margin: number; growth: number }[];
}

const ASSET_TYPES: { value: AssetType; label: string; icon: string }[] = [
  { value: 'stock', label: 'أسهم', icon: '📈' },
  { value: 'fund', label: 'صناديق', icon: '🏦' },
  { value: 'crypto', label: 'عملات مشفرة', icon: '₿' },
  { value: 'forex', label: 'فوركس', icon: '💱' },
  { value: 'commodity', label: 'سلع ومعادن', icon: '🪙' },
];

const RECOMMENDATION_COLORS: Record<string, string> = {
  'شراء قوي': 'bg-emerald-600 text-white',
  'شراء': 'bg-green-500 text-white',
  'احتفاظ': 'bg-blue-500 text-white',
  'بيع': 'bg-orange-500 text-white',
  'بيع قوي': 'bg-red-600 text-white',
  'Strong Buy': 'bg-emerald-600 text-white',
  'Buy': 'bg-green-500 text-white',
  'Hold': 'bg-blue-500 text-white',
  'Sell': 'bg-orange-500 text-white',
  'Strong Sell': 'bg-red-600 text-white',
};

function fmt(n: number | undefined | null, d = 1): string {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtPct(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '—';
  return `${n >= 0 ? '+' : ''}${fmt(n)}%`;
}
function fmtBig(n: number | undefined | null): string {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${fmt(n / 1e12, 2)}T`;
  if (abs >= 1e9) return `${fmt(n / 1e9, 2)}B`;
  if (abs >= 1e6) return `${fmt(n / 1e6, 2)}M`;
  return fmt(n, 0);
}
function shortenText(v: string | undefined | null, max = 56): string {
  const s = String(v || '').trim();
  if (!s) return '—';
  if (s.length <= max) return s;
  return `${s.slice(0, max).trim()}...`;
}

/* ─── Build system prompts per asset type ─── */
function buildSystemPrompt(assetType: AssetType): string {
  const base = `أنت محلل مالي محترف بخبرة 20 عاماً. قدّم تحليلاً أساسياً شاملاً ودقيقاً باللغة العربية.
يجب أن تُرجع الإجابة كـ JSON فقط (بدون أي نص قبله أو بعده) يطابق الهيكل التالي بالضبط.
جميع النسب المئوية كأرقام (مثال: 25.5 وليس "25.5%").
جميع المبالغ بالدولار أو العملة المحلية كأرقام.`;

  const jsonSchema = `
{
  "overview": { "companyName": "string", "sector": "string", "industry": "string", "description": "string (2-3 جمل)", "assetType": "string" },
  "valuation": { "currentPrice": number, "fairValue": number, "upsidePercent": number, "pe": number, "forwardPE": number, "pegRatio": number, "pbRatio": number, "psRatio": number, "evToEbitda": number, "recommendation": "شراء قوي|شراء|احتفاظ|بيع|بيع قوي" },
  "profitability": { "grossMargin": number, "operatingMargin": number, "netMargin": number, "roe": number, "roa": number, "roic": number, "margins": [{"year":"2020","gross":40,"operating":20,"net":15}, ...] },
  "growth": { "revenueGrowthYoY": number, "epsGrowthYoY": number, "epsCagr3y": number, "epsCagr5y": number, "revenueCagr3y": number, "revenueHistory": [{"year":"2020","revenue":386000000000,"eps":2.09}, ...], "rpoGrowth": number|null },
  "cashFlow": { "freeCashFlow": number, "fcfMargin": number, "fcfYield": number, "capexToRevenue": number, "netCash": number, "debtToEquity": number, "currentRatio": number, "fcfHistory": [{"year":"2020","fcf":25000000000,"capexPercent":12}, ...] },
  "segments": [{"name":"string","revenue":number,"revenuePercent":number,"margin":number,"growth":number}] | null,
  "scenarios": { "bull": {"price":number,"probability":number,"rationale":"string","pe":number,"eps":number}, "base": {"price":number,"probability":number,"rationale":"string","pe":number,"eps":number}, "bear": {"price":number,"probability":number,"rationale":"string","pe":number,"eps":number}, "weightedTarget": number },
  "sensitivityMatrix": { "peMultiples": [25,27,29,31,33], "opMargins": [11,12,13,14,15], "prices": [[188,203,218,234,249],[205,222,238,255,271],[223,240,258,276,294],[240,259,278,297,316],[257,277,298,318,339]], "revenueEstimate": number, "sharesOutstanding": number, "taxRate": number, "baseCase": {"pe":29,"margin":13}, "bullCase": {"pe":31,"margin":14} },
  "risks": ["string", ...],
  "catalysts": ["string", ...],
  "competitorComparison": [{"name":"string","pe":number,"pegRatio":number,"margin":number,"growth":number}] | null
}`;

  const assetSpecific: Record<AssetType, string> = {
    stock: `ركّز على: DCF، نسب التقييم (PE/Forward PE/PEG/P/B/P/S/EV/EBITDA)، ROIC وROE، الهوامش التشغيلية، CapEx كنسبة من الإيرادات، نمو EPS CAGR (3 و5 سنوات)، RPO إن وجد، تحليل القطاعات، سيناريوهات سعرية (Bull/Base/Bear) مع احتمالات وPE وEPS لكل سيناريو (السعر = PE × EPS)، جدول حساسية التقييم (مصفوفة P/E × هامش التشغيل مع 5 قيم لكل محور، أنشئ prices كمصفوفة 5×5 محسوبة من الإيرادات المتوقعة والأسهم)، مقارنة المنافسين.`,
    fund: `ركّز على: NAV، نسب المصاريف، الأداء المقارن مع المؤشر، توزيعات الأرباح، مخاطر التركيز، أعلى الحيازات، استراتيجية الصندوق.`,
    crypto: `ركّز على: TVL، Tokenomics، معدل التبني، Market Dominance، حجم التداول، الشبكة والتقنية، المنافسين، السيناريوهات.`,
    forex: `ركّز على: فروقات أسعار الفائدة، الميزان التجاري، المؤشرات الاقتصادية، التضخم، سياسات البنوك المركزية، المستويات الفنية الرئيسية.`,
    commodity: `ركّز على: العرض والطلب، المخزونات، الأنماط الموسمية، التكلفة الهامشية للإنتاج، العوامل الجيوسياسية، التوقعات.`,
  };

  return `${base}\n\n${assetSpecific[assetType]}\n\nأرجع JSON بالهيكل التالي فقط:\n${jsonSchema}`;
}

/* ─── Page ─── */
export default function FundamentalAnalysisPage() {
  const { toast } = useToast();

  // Form state
  const [symbol, setSymbol] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('stock');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<FundamentalAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('summary');

  // AI provider state
  const [selectedProvider, setSelectedProvider] = useState(() => {
    if (typeof window === 'undefined') return 'zai';
    return getAISettings().defaultProvider || 'zai';
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window === 'undefined') return 'default';
    const s = getAISettings();
    return s.defaultModel || getDefaultModelForProvider(s.defaultProvider || 'zai');
  });

  const providerModels = useMemo(() => getModelsForProvider(selectedProvider), [selectedProvider]);
  const providerInfo = useMemo(() => AI_PROVIDERS.find(p => p.id === selectedProvider), [selectedProvider]);

  /* ─── Analyze ─── */
  const analyzeSymbol = async () => {
    const sym = symbol.trim().toUpperCase();
    if (!sym) {
      toast({ title: 'الرجاء إدخال رمز', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setAnalysis(null);

    try {
      // 1. Fetch live price
      let priceInfo = '';
      try {
        const priceRes = await fetch(`/api/prices?symbols=${encodeURIComponent(sym)}`);
        const priceData = await priceRes.json();
        const p = priceData?.data?.[sym] || priceData?.data?.[`US_${sym}`];
        if (p) {
          priceInfo = `السعر الحالي: ${p.price}, التغيير: ${p.changePercent}%, القيمة السوقية: ${p.marketCap || 'غير متوفر'}, PE: ${p.pe || 'غير متوفر'}, EPS: ${p.eps || 'غير متوفر'}`;
        }
      } catch { /* continue without price */ }

      // 2. Fetch chart data (5 year monthly)
      let chartInfo = '';
      try {
        const chartRes = await fetch(`/api/chart?symbol=${encodeURIComponent(sym)}&range=5y&interval=1mo`);
        const chartData = await chartRes.json();
        if (chartData?.bars?.length) {
          const bars = chartData.bars;
          const first = bars[0];
          const last = bars[bars.length - 1];
          chartInfo = `بيانات تاريخية: من ${first.date || first.t} إلى ${last.date || last.t}, عدد الأشهر: ${bars.length}, أعلى سعر: ${Math.max(...bars.map((b: any) => b.high || b.h || 0))}, أدنى سعر: ${Math.min(...bars.filter((b: any) => (b.low || b.l) > 0).map((b: any) => b.low || b.l))}`;
        }
      } catch { /* continue without chart */ }

      // 3. Build user prompt
      const assetLabel = ASSET_TYPES.find(t => t.value === assetType)?.label || 'أصل';
      const userPrompt = `حلل ${assetLabel}: ${sym}

${priceInfo ? `📊 بيانات السوق:\n${priceInfo}\n` : ''}
${chartInfo ? `📈 بيانات تاريخية:\n${chartInfo}\n` : ''}

قدّم تحليلاً أساسياً شاملاً بصيغة JSON فقط.`;

      // 4. Call AI
      const apiKey = getApiKey(selectedProvider);
      const systemPrompt = buildSystemPrompt(assetType);
      const response = await callAI(userPrompt, selectedProvider, apiKey, systemPrompt, selectedModel);

      // 5. Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('لم يتم العثور على JSON في الاستجابة');

      const parsed: FundamentalAnalysis = JSON.parse(jsonMatch[0]);
      setAnalysis(parsed);
      setActiveTab('summary');
      notifySuccess('تم التحليل', `تحليل أساسي لـ ${sym}`, { source: 'التحليل الأساسي' });
    } catch (err: any) {
      console.error('Analysis error:', err);
      toast({ title: 'خطأ في التحليل', description: err.message || 'حاول مرة أخرى', variant: 'destructive' });
      notifyError('فشل التحليل', err.message || 'خطأ غير معروف', { source: 'التحليل الأساسي' });
    } finally {
      setLoading(false);
    }
  };

  /* ─── Scenario bar helpers ─── */
  const scenarioBar = analysis ? (() => {
    const { bull, base, bear } = analysis.scenarios;
    const current = analysis.valuation.currentPrice;
    const min = Math.min(bear.price, current) * 0.95;
    const max = Math.max(bull.price, current) * 1.05;
    const range = max - min;
    const pct = (v: number) => ((v - min) / range) * 100;
    return { min, max, pct, current, bull: bull.price, base: base.price, bear: bear.price };
  })() : null;

  const weightedReturnPct = analysis && analysis.valuation.currentPrice > 0
    ? ((analysis.scenarios.weightedTarget - analysis.valuation.currentPrice) / analysis.valuation.currentPrice) * 100
    : 0;

  const valuationSensitivity = useMemo(() => {
    if (!analysis || analysis.valuation.currentPrice <= 0) return null;

    const sm = analysis.sensitivityMatrix;

    // If AI provided a full matrix, use it directly
    if (sm && sm.peMultiples?.length === 5 && sm.opMargins?.length === 5 && sm.prices?.length === 5) {
      const multiples = sm.peMultiples;
      const margins = sm.opMargins;
      const grid = sm.prices;
      const baseCase = sm.baseCase || { pe: multiples[2], margin: margins[2] };
      const bullCase = sm.bullCase || { pe: multiples[3], margin: margins[3] };
      const baseCol = multiples.indexOf(baseCase.pe);
      const baseRow = margins.indexOf(baseCase.margin);
      const bullCol = multiples.indexOf(bullCase.pe);
      const bullRow = margins.indexOf(bullCase.margin);
      return {
        margins, multiples, grid,
        baseRow: baseRow >= 0 ? baseRow : 2,
        baseCol: baseCol >= 0 ? baseCol : 2,
        bullRow: bullRow >= 0 ? bullRow : 3,
        bullCol: bullCol >= 0 ? bullCol : 3,
        baseMargin: baseCase.margin,
        baseMultiple: baseCase.pe,
        basePrice: grid[baseRow >= 0 ? baseRow : 2]?.[baseCol >= 0 ? baseCol : 2] || analysis.valuation.fairValue,
        bullMargin: bullCase.margin,
        bullMultiple: bullCase.pe,
        bullPrice: grid[bullRow >= 0 ? bullRow : 3]?.[bullCol >= 0 ? bullCol : 3] || analysis.scenarios.bull.price,
        revenueEstimate: sm.revenueEstimate,
        sharesOutstanding: sm.sharesOutstanding,
        taxRate: sm.taxRate,
      };
    }

    // Fallback: generate from current data
    const baseMultipleRaw = analysis.valuation.forwardPE > 0
      ? analysis.valuation.forwardPE
      : (analysis.valuation.pe > 0 ? analysis.valuation.pe : 25);
    const baseMultiple = Math.max(5, Math.round(baseMultipleRaw));

    const baseMarginRaw = analysis.profitability.operatingMargin > 0
      ? analysis.profitability.operatingMargin
      : (analysis.profitability.netMargin > 0 ? analysis.profitability.netMargin : 12);
    const baseMargin = Math.max(1, Number(baseMarginRaw.toFixed(1)));

    const multipleOffsets = [-4, -2, 0, 2, 4];
    const marginOffsets = [-2, -1, 0, 1, 2];

    const multiples: number[] = [];
    for (const off of multipleOffsets) {
      const v = Math.max(4, baseMultiple + off);
      const prev = multiples[multiples.length - 1];
      multiples.push(prev == null ? v : Math.max(v, prev + 1));
    }

    const margins: number[] = [];
    for (const off of marginOffsets) {
      const v = Number(Math.max(1, baseMargin + off).toFixed(1));
      const prev = margins[margins.length - 1];
      margins.push(prev == null ? v : Number(Math.max(v, Number((prev + 0.5).toFixed(1))).toFixed(1)));
    }

    const grid = margins.map((margin) => (
      multiples.map((multiple) => {
        const marginFactor = margin / baseMargin;
        const multipleFactor = multiple / baseMultiple;
        return Number((analysis.valuation.currentPrice * marginFactor * multipleFactor).toFixed(2));
      })
    ));

    const baseRow = 2;
    const baseCol = 2;
    const bullRow = Math.min(margins.length - 1, baseRow + 1);
    const bullCol = Math.min(multiples.length - 1, baseCol + 1);

    return {
      margins,
      multiples,
      grid,
      baseRow,
      baseCol,
      bullRow,
      bullCol,
      baseMargin: margins[baseRow],
      baseMultiple: multiples[baseCol],
      basePrice: grid[baseRow][baseCol],
      bullMargin: margins[bullRow],
      bullMultiple: multiples[bullCol],
      bullPrice: grid[bullRow][bullCol],
    };
  }, [analysis]);

  const scenarioMultiples = useMemo(() => {
    if (!analysis) return null;
    const base = Math.max(5, Math.round(
      analysis.valuation.forwardPE > 0
        ? analysis.valuation.forwardPE
        : (analysis.valuation.pe > 0 ? analysis.valuation.pe : 25),
    ));
    return {
      bear: Math.max(3, base - 4),
      base,
      bull: base + 3,
    };
  }, [analysis]);

  /* ─── Render helpers ─── */
  const MetricCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${color || ''}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="flex-1 mr-64 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              التحليل الأساسي والتقييم
            </h1>
            <p className="text-muted-foreground text-sm mt-1">تحليل شامل للأسهم والصناديق والعملات والسلع مدعوم بالذكاء الاصطناعي</p>
          </div>

          {/* Input Bar */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex gap-3 flex-wrap items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-muted-foreground mb-1 block">الرمز</label>
                  <Input
                    placeholder="مثال: AMZN, 2222.SR, BTC-USD"
                    value={symbol}
                    onChange={e => setSymbol(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && analyzeSymbol()}
                    className="text-base"
                  />
                </div>
                <div className="w-[160px]">
                  <label className="text-xs text-muted-foreground mb-1 block">نوع الأصل</label>
                  <Select value={assetType} onValueChange={v => setAssetType(v as AssetType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[180px]">
                  <label className="text-xs text-muted-foreground mb-1 block">مزود AI</label>
                  <Select value={selectedProvider} onValueChange={v => {
                    setSelectedProvider(v);
                    const m = getDefaultModelForProvider(v);
                    setSelectedModel(m);
                    saveDefaults(v, m);
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AI_PROVIDERS.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.icon} {p.nameAr} {p.isFree ? '🆓' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[200px]">
                  <label className="text-xs text-muted-foreground mb-1 block">النموذج</label>
                  <Select value={selectedModel} onValueChange={v => {
                    setSelectedModel(v);
                    saveDefaults(selectedProvider, v);
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {providerModels.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nameAr} {m.free ? '🆓' : ''} {m.recommended ? '⭐' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={analyzeSymbol} disabled={loading} className="h-10 px-6">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Search className="h-4 w-4 ml-2" />}
                  {loading ? 'جاري التحليل...' : 'تحليل'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="py-16 text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                <p className="text-lg font-semibold">جاري تحليل {symbol}...</p>
                <p className="text-sm text-muted-foreground mt-1">يتم جمع البيانات وتحليلها بواسطة الذكاء الاصطناعي</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loading && !analysis && (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Brain className="h-14 w-14 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-semibold">أدخل رمز الأصل وابدأ التحليل</p>
                <p className="text-sm mt-2">يدعم: أسهم أمريكية وسعودية، صناديق ETF، عملات مشفرة، فوركس، سلع ومعادن</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {['AMZN', 'AAPL', '2222.SR', 'BTC-USD', 'GC=F', 'EURUSD=X'].map(s => (
                    <Button key={s} variant="outline" size="sm" onClick={() => { setSymbol(s); }}>
                      {s}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysis && !loading && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="summary">📊 الملخص والتقييم</TabsTrigger>
                <TabsTrigger value="profitability">📈 الربحية والنمو</TabsTrigger>
                <TabsTrigger value="cashflow">💰 التدفقات النقدية</TabsTrigger>
                <TabsTrigger value="scenarios">🎯 السيناريوهات</TabsTrigger>
                <TabsTrigger value="risks">⚠️ المخاطر والمحفزات</TabsTrigger>
              </TabsList>

              {/* ═══ Tab 1: Summary & Valuation ═══ */}
              <TabsContent value="summary" className="space-y-4 mt-4">
                {/* Overview Card */}
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[250px]">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-xl font-bold">{analysis.overview.companyName || symbol}</h2>
                          <Badge variant="outline">{symbol}</Badge>
                          <Badge className={RECOMMENDATION_COLORS[analysis.valuation.recommendation] || 'bg-gray-500 text-white'}>
                            {analysis.valuation.recommendation}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {analysis.overview.sector} {analysis.overview.industry ? `• ${analysis.overview.industry}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{analysis.overview.description}</p>
                      </div>
                      <div className="text-left min-w-[200px]">
                        <p className="text-3xl font-bold">${fmt(analysis.valuation.currentPrice, 2)}</p>
                        <p className="text-sm mt-1">
                          القيمة العادلة: <span className="font-semibold text-primary">${fmt(analysis.valuation.fairValue, 2)}</span>
                        </p>
                        <p className={`text-sm font-semibold mt-0.5 ${analysis.valuation.upsidePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {analysis.valuation.upsidePercent >= 0 ? '↑' : '↓'} {fmtPct(analysis.valuation.upsidePercent)} عن القيمة العادلة
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Valuation Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <MetricCard label="P/E" value={fmt(analysis.valuation.pe)} />
                  <MetricCard label="Forward P/E" value={fmt(analysis.valuation.forwardPE)} />
                  <MetricCard label="PEG" value={fmt(analysis.valuation.pegRatio, 2)} color={analysis.valuation.pegRatio < 1.5 ? 'text-emerald-500' : analysis.valuation.pegRatio > 2.5 ? 'text-red-500' : ''} />
                  <MetricCard label="P/B" value={fmt(analysis.valuation.pbRatio)} />
                  <MetricCard label="P/S" value={fmt(analysis.valuation.psRatio)} />
                  <MetricCard label="EV/EBITDA" value={fmt(analysis.valuation.evToEbitda)} />
                </div>

                {/* Valuation Sensitivity Matrix */}
                {valuationSensitivity && (
                  <Card className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">جدول حساسية التقييم</CardTitle>
                      <CardDescription>
                        الحالي ~${fmt(analysis.valuation.currentPrice, 0)}
                        {valuationSensitivity.revenueEstimate ? ` · Rev ${fmtBig(valuationSensitivity.revenueEstimate)}` : ''}
                        {valuationSensitivity.taxRate ? ` · ضريبة ${valuationSensitivity.taxRate}%` : ''}
                        {valuationSensitivity.sharesOutstanding ? ` · أسهم ${fmtBig(valuationSensitivity.sharesOutstanding)}` : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="overflow-x-auto rounded-xl border">
                        <table className="min-w-[760px] w-full text-sm">
                          <thead className="bg-muted/60">
                            <tr>
                              <th className="text-center py-3 px-2 font-bold text-xs leading-tight">P/E<br/>FY+1<br/><span className="font-normal text-muted-foreground">Op. Margin</span></th>
                              {valuationSensitivity.multiples.map((m, colIdx) => (
                                <th key={`pe-${colIdx}-${m}`} className="text-center py-3 px-2 font-bold">
                                  {m}x
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {valuationSensitivity.margins.map((margin, rowIdx) => (
                              <tr key={`margin-${rowIdx}-${margin}`} className="border-t">
                                <td className="text-center py-3 px-2 font-semibold">{fmt(margin, 1)}%</td>
                                {valuationSensitivity.grid[rowIdx].map((price, colIdx) => {
                                  const isBase = rowIdx === valuationSensitivity.baseRow && colIdx === valuationSensitivity.baseCol;
                                  const isBull = rowIdx === valuationSensitivity.bullRow && colIdx === valuationSensitivity.bullCol;
                                  return (
                                    <td
                                      key={`${margin}-${colIdx}`}
                                      className={[
                                        'text-center py-3 px-2 font-semibold',
                                        isBase ? 'bg-amber-50 dark:bg-amber-950/20 ring-1 ring-amber-500/60' : '',
                                        isBull ? 'bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-500/60' : '',
                                      ].join(' ')}
                                    >
                                      ${fmt(price, 0)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="rounded-xl border p-3 bg-muted/20 space-y-1.5 text-sm">
                        <p className="font-semibold text-amber-700 dark:text-amber-300">
                          الأساسي: {valuationSensitivity.baseMultiple}x × {fmt(valuationSensitivity.baseMargin, 1)}% = ${fmt(valuationSensitivity.basePrice, 0)}
                          {' '}
                          ({fmtPct(((valuationSensitivity.basePrice - analysis.valuation.currentPrice) / analysis.valuation.currentPrice) * 100)})
                        </p>
                        <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                          المتفائل: {valuationSensitivity.bullMultiple}x × {fmt(valuationSensitivity.bullMargin, 1)}% = ${fmt(valuationSensitivity.bullPrice, 0)}
                          {' '}
                          ({fmtPct(((valuationSensitivity.bullPrice - analysis.valuation.currentPrice) / analysis.valuation.currentPrice) * 100)})
                        </p>
                        <p className="text-xs text-muted-foreground">المصفوفة حساسة للفرضيات وليست توصية استثمارية.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Competitor PEG Comparison */}
                {analysis.competitorComparison && analysis.competitorComparison.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">مقارنة PEG مع المنافسين</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={[
                          { name: symbol, peg: analysis.valuation.pegRatio },
                          ...analysis.competitorComparison.map(c => ({ name: c.name, peg: c.pegRatio })),
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="peg" name="PEG" radius={[4, 4, 0, 0]}>
                            {[{ name: symbol, peg: analysis.valuation.pegRatio }, ...analysis.competitorComparison.map(c => ({ name: c.name, peg: c.pegRatio }))].map((entry, i) => (
                              <Cell key={i} fill={entry.name === symbol ? '#10b981' : '#64748b'} />
                            ))}
                          </Bar>
                          <ReferenceLine y={1.5} stroke="#f59e0b" strokeDasharray="5 5" label="PEG 1.5" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ═══ Tab 2: Profitability & Growth ═══ */}
              <TabsContent value="profitability" className="space-y-4 mt-4">
                {/* Profitability Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <MetricCard label="الهامش الإجمالي" value={fmtPct(analysis.profitability.grossMargin)} />
                  <MetricCard label="الهامش التشغيلي" value={fmtPct(analysis.profitability.operatingMargin)} />
                  <MetricCard label="صافي الهامش" value={fmtPct(analysis.profitability.netMargin)} />
                  <MetricCard label="ROE" value={fmtPct(analysis.profitability.roe)} color={analysis.profitability.roe > 20 ? 'text-emerald-500' : ''} />
                  <MetricCard label="ROA" value={fmtPct(analysis.profitability.roa)} />
                  <MetricCard label="ROIC" value={fmtPct(analysis.profitability.roic)} color={analysis.profitability.roic > 15 ? 'text-emerald-500' : ''} />
                </div>

                {/* Margins Chart */}
                {analysis.profitability.margins?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">تطور الهوامش عبر السنوات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={analysis.profitability.margins}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                          <Tooltip formatter={(v: number) => `${fmt(v)}%`} />
                          <Legend />
                          <Line type="monotone" dataKey="gross" name="إجمالي" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="operating" name="تشغيلي" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="net" name="صافي" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Revenue & EPS Chart */}
                {analysis.growth.revenueHistory?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">الإيرادات وربحية السهم</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={analysis.growth.revenueHistory}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                          <YAxis yAxisId="rev" tick={{ fontSize: 11 }} tickFormatter={v => fmtBig(v)} />
                          <YAxis yAxisId="eps" orientation="left" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                          <Tooltip formatter={(v: number, name: string) => name === 'الإيرادات' ? fmtBig(v) : `$${fmt(v, 2)}`} />
                          <Legend />
                          <Bar yAxisId="rev" dataKey="revenue" name="الإيرادات" fill="#3b82f6" opacity={0.7} radius={[4, 4, 0, 0]} />
                          <Line yAxisId="eps" type="monotone" dataKey="eps" name="EPS" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Growth Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <MetricCard label="نمو الإيرادات (سنوي)" value={fmtPct(analysis.growth.revenueGrowthYoY)} color={analysis.growth.revenueGrowthYoY > 0 ? 'text-emerald-500' : 'text-red-500'} />
                  <MetricCard label="نمو EPS (سنوي)" value={fmtPct(analysis.growth.epsGrowthYoY)} color={analysis.growth.epsGrowthYoY > 0 ? 'text-emerald-500' : 'text-red-500'} />
                  <MetricCard label="EPS CAGR 3Y" value={fmtPct(analysis.growth.epsCagr3y)} />
                  <MetricCard label="EPS CAGR 5Y" value={fmtPct(analysis.growth.epsCagr5y)} />
                  <MetricCard label="إيرادات CAGR 3Y" value={fmtPct(analysis.growth.revenueCagr3y)} />
                </div>

                {/* Segments Table */}
                {analysis.segments && analysis.segments.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">تحليل القطاعات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-muted-foreground">
                              <th className="text-right py-2 px-3">القطاع</th>
                              <th className="text-right py-2 px-3">الإيرادات</th>
                              <th className="text-right py-2 px-3">النسبة</th>
                              <th className="text-right py-2 px-3">الهامش</th>
                              <th className="text-right py-2 px-3">النمو</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.segments.map((seg, i) => (
                              <tr key={i} className="border-b last:border-0">
                                <td className="py-2 px-3 font-medium">{seg.name}</td>
                                <td className="py-2 px-3">{fmtBig(seg.revenue)}</td>
                                <td className="py-2 px-3">{fmt(seg.revenuePercent)}%</td>
                                <td className="py-2 px-3">{fmt(seg.margin)}%</td>
                                <td className={`py-2 px-3 ${seg.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmtPct(seg.growth)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ═══ Tab 3: Cash Flow ═══ */}
              <TabsContent value="cashflow" className="space-y-4 mt-4">
                {/* Cash Flow Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                  <MetricCard label="التدفق الحر FCF" value={fmtBig(analysis.cashFlow.freeCashFlow)} color={analysis.cashFlow.freeCashFlow > 0 ? 'text-emerald-500' : 'text-red-500'} />
                  <MetricCard label="هامش FCF" value={fmtPct(analysis.cashFlow.fcfMargin)} />
                  <MetricCard label="عائد FCF" value={fmtPct(analysis.cashFlow.fcfYield)} />
                  <MetricCard label="CapEx/الإيرادات" value={fmtPct(analysis.cashFlow.capexToRevenue)} />
                  <MetricCard label="صافي الكاش" value={fmtBig(analysis.cashFlow.netCash)} color={analysis.cashFlow.netCash > 0 ? 'text-emerald-500' : 'text-red-500'} />
                  <MetricCard label="D/E" value={fmt(analysis.cashFlow.debtToEquity, 2)} color={analysis.cashFlow.debtToEquity > 2 ? 'text-red-500' : ''} />
                  <MetricCard label="النسبة الجارية" value={fmt(analysis.cashFlow.currentRatio, 2)} color={analysis.cashFlow.currentRatio < 1 ? 'text-red-500' : 'text-emerald-500'} />
                </div>

                {/* FCF History Chart */}
                {analysis.cashFlow.fcfHistory?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">التدفق النقدي الحر التاريخي</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={analysis.cashFlow.fcfHistory}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtBig(v)} />
                          <Tooltip formatter={(v: number) => fmtBig(v)} />
                          <Bar dataKey="fcf" name="FCF" radius={[4, 4, 0, 0]}>
                            {analysis.cashFlow.fcfHistory.map((entry, i) => (
                              <Cell key={i} fill={entry.fcf >= 0 ? '#10b981' : '#ef4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* CapEx as % of Revenue */}
                {analysis.cashFlow.fcfHistory?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">CapEx كنسبة من الإيرادات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={analysis.cashFlow.fcfHistory}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                          <Tooltip formatter={(v: number) => `${fmt(v)}%`} />
                          <Area type="monotone" dataKey="capexPercent" name="CapEx %" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                          <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="5 5" label="15%" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ═══ Tab 4: Scenarios ═══ */}
              <TabsContent value="scenarios" className="space-y-4 mt-4">
                <Card className="border-2">
                  <CardHeader className="space-y-3">
                    <div>
                      <CardTitle className="text-xl">تحليل السيناريوهات — FY+1</CardTitle>
                      <CardDescription className="mt-1">
                        سيناريو متفائل / أساسي / متحفظ مع العائد المرجح بالاحتمالات
                      </CardDescription>
                    </div>
                    <div className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-bold text-center">
                      العائد المرجح بالاحتمالات: {fmtPct(weightedReturnPct)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" dir="rtl">
                      <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-4 text-center">
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">BULL | المتفائل</p>
                        <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-1">${fmt(analysis.scenarios.bull.price, 0)}</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {fmtPct(((analysis.scenarios.bull.price - analysis.valuation.currentPrice) / analysis.valuation.currentPrice) * 100)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">احتمالية {analysis.scenarios.bull.probability}%</p>
                      </div>

                      <div className="rounded-xl border border-blue-400/30 bg-blue-500/5 p-4 text-center">
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300">BASE | الأساسي</p>
                        <p className="text-4xl font-black text-blue-700 dark:text-blue-300 mt-1">${fmt(analysis.scenarios.base.price, 0)}</p>
                        <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5">
                          {fmtPct(((analysis.scenarios.base.price - analysis.valuation.currentPrice) / analysis.valuation.currentPrice) * 100)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">احتمالية {analysis.scenarios.base.probability}%</p>
                      </div>

                      <div className="rounded-xl border border-red-400/30 bg-red-500/5 p-4 text-center">
                        <p className="text-sm font-bold text-red-700 dark:text-red-300">BEAR | المتحفظ</p>
                        <p className="text-4xl font-black text-red-600 dark:text-red-400 mt-1">${fmt(analysis.scenarios.bear.price, 0)}</p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-0.5">
                          {fmtPct(((analysis.scenarios.bear.price - analysis.valuation.currentPrice) / analysis.valuation.currentPrice) * 100)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">احتمالية {analysis.scenarios.bear.probability}%</p>
                      </div>
                    </div>

                    <div className="text-sm font-semibold">السعر الحالي: ~${fmt(analysis.valuation.currentPrice, 0)}</div>

                    {scenarioBar && (
                      <div className="space-y-2">
                        <div className="relative h-10 rounded-full border bg-gradient-to-l from-emerald-500/90 via-slate-50 to-red-500/90 overflow-hidden">
                          <div
                            className="absolute inset-y-0 w-[2px] bg-red-600"
                            style={{ right: `${scenarioBar.pct(scenarioBar.bear)}%` }}
                            title="Bear"
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-red-600 bg-white"
                            style={{ right: `calc(${scenarioBar.pct(scenarioBar.bear)}% - 6px)` }}
                          />

                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 border-2 border-blue-700 bg-white"
                            style={{ right: `calc(${scenarioBar.pct(scenarioBar.base)}% - 6px)` }}
                            title="Base"
                          />

                          <div
                            className="absolute inset-y-0 w-[2px] bg-emerald-600"
                            style={{ right: `${scenarioBar.pct(scenarioBar.bull)}%` }}
                            title="Bull"
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-emerald-700 bg-white"
                            style={{ right: `calc(${scenarioBar.pct(scenarioBar.bull)}% - 6px)` }}
                          />

                          <div
                            className="absolute -top-1 h-12 w-[2px] bg-slate-900"
                            style={{ right: `${scenarioBar.pct(scenarioBar.current)}%` }}
                            title="Current"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>${fmt(scenarioBar.min, 0)}</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">الحالي ${fmt(scenarioBar.current, 0)}</span>
                          <span>${fmt(scenarioBar.max, 0)}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {([
                        { key: 'bear' as const, color: 'text-red-600', label: 'Bear', sc: analysis.scenarios.bear, fallbackPE: scenarioMultiples?.bear },
                        { key: 'base' as const, color: 'text-blue-700 dark:text-blue-300', label: 'Base', sc: analysis.scenarios.base, fallbackPE: scenarioMultiples?.base },
                        { key: 'bull' as const, color: 'text-emerald-700 dark:text-emerald-300', label: 'Bull', sc: analysis.scenarios.bull, fallbackPE: scenarioMultiples?.bull },
                      ]).map(({ key, color, label, sc, fallbackPE }) => {
                        const pe = sc.pe || fallbackPE || Math.round(sc.price / (analysis.valuation.currentPrice / (analysis.valuation.pe || 25)));
                        const eps = sc.eps || Number((sc.price / pe).toFixed(2));
                        return (
                          <div key={key} className="rounded-lg border p-3">
                            <p className={`font-bold ${color} text-sm`}>
                              {pe}x × ${fmt(eps, 2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{shortenText(sc.rationale, 70)}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-lg border p-3 bg-muted/30 text-center">
                      <p className="text-sm text-muted-foreground">السعر المستهدف المرجح بالاحتمالات</p>
                      <p className="text-4xl font-black text-primary mt-1">${fmt(analysis.scenarios.weightedTarget, 2)}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ═══ Tab 5: Risks & Catalysts ═══ */}
              <TabsContent value="risks" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Risks */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        المخاطر
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.risks.map((risk, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Catalysts */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-emerald-500">
                        <Zap className="h-4 w-4" />
                        المحفزات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.catalysts.map((cat, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>{cat}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Competitor Comparison Table */}
                {analysis.competitorComparison && analysis.competitorComparison.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">مقارنة المنافسين</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-muted-foreground">
                              <th className="text-right py-2 px-3">الشركة</th>
                              <th className="text-right py-2 px-3">P/E</th>
                              <th className="text-right py-2 px-3">PEG</th>
                              <th className="text-right py-2 px-3">الهامش</th>
                              <th className="text-right py-2 px-3">النمو</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b bg-primary/5 font-semibold">
                              <td className="py-2 px-3">{symbol} ⭐</td>
                              <td className="py-2 px-3">{fmt(analysis.valuation.pe)}</td>
                              <td className="py-2 px-3">{fmt(analysis.valuation.pegRatio, 2)}</td>
                              <td className="py-2 px-3">{fmt(analysis.profitability.operatingMargin)}%</td>
                              <td className="py-2 px-3">{fmtPct(analysis.growth.revenueGrowthYoY)}</td>
                            </tr>
                            {analysis.competitorComparison.map((comp, i) => (
                              <tr key={i} className="border-b last:border-0">
                                <td className="py-2 px-3">{comp.name}</td>
                                <td className="py-2 px-3">{fmt(comp.pe)}</td>
                                <td className="py-2 px-3">{fmt(comp.pegRatio, 2)}</td>
                                <td className="py-2 px-3">{fmt(comp.margin)}%</td>
                                <td className={`py-2 px-3 ${comp.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{fmtPct(comp.growth)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  );
}
