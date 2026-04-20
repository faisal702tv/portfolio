'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  Shield,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Sparkles,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Settings,
  ChevronDown,
  ChevronUp,
  Key,
  Layers,
  Briefcase,
  Calculator,
  Printer,
  ArrowUpDown,
  Building2,
  Bitcoin,
  Coins,
  Landmark,
  Wallet,
  Package,
  Download,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber, formatPercent, convertCurrency } from '@/lib/helpers';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { resolveProvider, getAISettings, getApiKey, saveApiKeys, saveDefaults } from '@/lib/api-keys';
import { AI_PROVIDERS as SHARED_PROVIDERS, getModelsForProvider, getDefaultModelForProvider } from '@/lib/ai-providers';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import Link from 'next/link';
import { fetchAllPortfoliosSnapshots } from '@/lib/export-utils';
import {
  normalizeAnalysisAssetType,
  toYahooSymbolForAsset,
  type AnalysisAssetType,
} from '@/lib/analysis-links';

// بيانات تحليل المحفظة الافتراضية
const initialPortfolioAnalysis = {
  overallScore: 78,
  lastUpdated: new Date(),
  recommendations: [
    {
      id: 1,
      type: 'action',
      priority: 'high',
      title: 'تقليل التعرض لقطاع الطاقة',
      description: 'قطاع الطاقة يمثل 25% من المحفظة مع أداء سلبي. يُنصح بتقليل الوزن إلى 15%',
      impact: 'تحسين العائد المتوقع بنسبة 2-3%',
      action: 'بيع 50 سهم من أرامكو',
    },
    {
      id: 2,
      type: 'opportunity',
      priority: 'medium',
      title: 'إضافة صندوق عقاري',
      description: 'المحفظة تفتقر للتعرض لقطاع العقارات الذي يوفر عوائد مستقرة',
      impact: 'تنويع المحفظة وتقليل المخاطر',
      action: 'شراء صندوق الرياض العقاري',
    },
    {
      id: 3,
      type: 'risk',
      priority: 'high',
      title: 'تركز في البنوك',
      description: 'قطاع البنوك يمثل 35% من المحفظة مما يزيد المخاطر القطاعية',
      impact: 'مخاطر تنظيمية واقتصادية',
      action: 'تنويع داخل القطاع أو تقليل الوزن',
    },
    {
      id: 4,
      type: 'optimization',
      priority: 'low',
      title: 'تحسين التوزيعات',
      description: 'عائد التوزيعات الحالي 2.8% يمكن رفعه إلى 4% بإضافة أسهم بعوائد أعلى',
      impact: 'زيادة الدخل السنوي بـ 600 ريال',
      action: 'إضافة أسهم بعوائد توزيعات أعلى',
    },
  ],
  riskAnalysis: {
    overallRisk: 'متوسط',
    riskScore: 65,
    diversification: 72,
    concentration: 58,
    volatility: 45,
    sharpeRatio: 1.25,
    maxDrawdown: -12.5,
    beta: 0.85,
    factors: [
      { name: 'مخاطر السوق', level: 65, description: 'تعرض معتدل لتقلبات السوق' },
      { name: 'مخاطر القطاع', level: 72, description: 'تركز في بعض القطاعات' },
      { name: 'مخاطر السيولة', level: 25, description: 'سيولة عالية' },
      { name: 'مخاطر العملة', level: 15, description: 'تعرض منخفض' },
    ],
  },
  performance: {
    expected: {
      bullish: { prob: 45, return: 15 },
      neutral: { prob: 35, return: 5 },
      bearish: { prob: 20, return: -8 },
    },
    scenarios: [
      { scenario: 'أفضل حالة', value: 57700, change: 15 },
      { scenario: 'الحالة المتوسطة', value: 52680, change: 5 },
      { scenario: 'أسوأ حالة', value: 46160, change: -8 },
    ],
  },
  strengths: [
    'تنوع جيد في أنواع الأصول',
    'عائد توزيعات منتظم',
    'سيولة عالية',
    'أسهم شرعية بالكامل',
    'مركز مالي قوي للشركات المملوكة',
  ],
  weaknesses: [
    'تركز في قطاع البنوك',
    'نقص التعرض للقطاع التقني',
    'أداء ضعيف في قطاع الطاقة',
    'مخاطر تركز في السوق السعودي فقط',
  ],
  optimization: {
    currentAllocation: [
      { sector: 'البنوك', current: 35, optimal: 25 },
      { sector: 'الاتصالات', current: 28, optimal: 20 },
      { sector: 'الطاقة', current: 12, optimal: 15 },
      { sector: 'العقارات', current: 15, optimal: 25 },
      { sector: 'أخرى', current: 10, optimal: 15 },
    ],
    suggestedTrades: [
      { action: 'بيع', stock: 'أرامكو', qty: 50, reason: 'تقليل الوزن' },
      { action: 'بيع', stock: 'الراجحي', qty: 30, reason: 'جني أرباح' },
      { action: 'شراء', stock: 'دار الأركان', qty: 100, reason: 'تنويع عقاري' },
      { action: 'شراء', stock: 'صندوق الريت', qty: 50, reason: 'عوائد مستقرة' },
    ],
  },
  benchmark: {
    vsTasi: { performance: 2.3, status: 'outperform' },
    vsSector: { performance: 1.5, status: 'outperform' },
    riskAdjusted: { performance: 0.8, status: 'outperform' },
  },
};

// بيانات الرادار
const radarData = [
  { metric: 'التنويع', value: 72, fullMark: 100 },
  { metric: 'العائد', value: 78, fullMark: 100 },
  { metric: 'المخاطر', value: 65, fullMark: 100 },
  { metric: 'السيولة', value: 90, fullMark: 100 },
  { metric: 'التوزيعات', value: 70, fullMark: 100 },
  { metric: 'النمو', value: 60, fullMark: 100 },
];

const COLORS = ['#b8860b', '#4f46e5', '#059669', '#dc2626', '#7c3aed'];

interface FocusAssetContext {
  symbol: string;
  name: string;
  type: AnalysisAssetType;
  exchange?: string;
  currency?: string;
}

interface FocusAssetMarketStats {
  latestClose: number;
  return30d: number;
  volatility30d: number;
  bars: number;
}

function safeParseAIJson(raw: string): any {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('صيغة رد الذكاء الاصطناعي ليست JSON صالحاً.');
  }
}

function getAssetTypeLabel(type: AnalysisAssetType): string {
  if (type === 'stocks') return 'سهم';
  if (type === 'funds') return 'صندوق';
  if (type === 'crypto') return 'عملة مشفرة';
  if (type === 'commodities') return 'سلعة';
  if (type === 'forex') return 'فوركس';
  return 'سند/صك';
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function PortfolioAIPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analysis, setAnalysis] = useState<any>(initialPortfolioAnalysis);
  const [analysisFromAI, setAnalysisFromAI] = useState(false);
  const [focusStats, setFocusStats] = useState<FocusAssetMarketStats | null>(null);
  const [focusStatsLoading, setFocusStatsLoading] = useState(false);
  const focusStatsCache = useMemo(() => new Map<string, FocusAssetMarketStats>(), []);
  const [showProviderPanel, setShowProviderPanel] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(() => {
    if (typeof window === 'undefined') return 'zai';
    return getAISettings().defaultProvider || 'zai';
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window === 'undefined') return 'default';
    const settings = getAISettings();
    return settings.defaultModel || getDefaultModelForProvider(settings.defaultProvider || 'zai');
  });
  const [providerApiKey, setProviderApiKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    const settings = getAISettings();
    return getApiKey(settings.defaultProvider || 'zai');
  });

  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { snapshot, portfolios } = usePortfolioSnapshot();
  const { data: dashboardData } = useDashboardData();
  const [allSnapshots, setAllSnapshots] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'value', direction: 'desc' });
  const [tableSearch, setTableSearch] = useState('');

  const linkedSymbol = (searchParams.get('symbol') || '').trim().toUpperCase();
  const linkedName = (searchParams.get('name') || '').trim();
  const linkedType = normalizeAnalysisAssetType(searchParams.get('type'));

  useEffect(() => {
    if (portfolios && portfolios.length > 0) {
      fetchAllPortfoliosSnapshots(portfolios).then(setAllSnapshots);
    }
  }, [portfolios]);

  const displayCurrency = snapshot?.currency || 'SAR';

  const portfolioCurrencyMap = useMemo(() => {
    const map = new Map<string, string>();
    allSnapshots.forEach(s => { if (s.portfolioId && s.currency) map.set(s.portfolioId, s.currency); });
    return map;
  }, [allSnapshots]);

  const allConsolidatedAssets = useMemo(() => {
    const list: any[] = [];
    const snaps = allSnapshots.length > 0 ? allSnapshots : (snapshot ? [snapshot] : []);

    const EXCHANGE_CURRENCY_MAP: Record<string, string> = {
      TADAWUL: 'SAR', SAUDI: 'SAR', TASI: 'SAR',
      ADX: 'AED', DFM: 'AED', KSE: 'KWD', QSE: 'QAR',
      BHB: 'BHD', EGX: 'EGP', MSM: 'OMR', ASE: 'JOD',
      NYSE: 'USD', NASDAQ: 'USD', AMEX: 'USD', OTC: 'USD', CBOE: 'USD',
      LSE: 'GBP', TSE: 'JPY', CRYPTO: 'USD', FOREX: 'USD'
    };

    function getAssetCurrency(asset: any, pId: string) {
      if (asset.currency) return asset.currency;
      const exch = String(asset.exchange || asset.market || '').toUpperCase();
      for (const [key, curr] of Object.entries(EXCHANGE_CURRENCY_MAP)) {
        if (exch.includes(key)) return curr;
      }
      return portfolioCurrencyMap.get(pId) || 'SAR';
    }

    snaps.forEach(snap => {
      const pName = snap.portfolioName || snap.portfolioId || 'المحفظة';
      const pId = snap.portfolioId || '';

      const processAsset = (asset: any, displayType: string, originalType: string) => {
        const assetCurrency = getAssetCurrency(asset, pId);
        const qty = asset.qty || asset.units || 0;
        const bp = asset.buyPrice || 0;
        const cp = asset.currentPrice || asset.livePrice || asset.buyPrice || 0;

        const bpConv = convertCurrency(bp, assetCurrency, displayCurrency);
        const cpConv = convertCurrency(cp, assetCurrency, displayCurrency);
        const costConv = qty * bpConv;
        const valConv = qty * cpConv;

        list.push({
          ...asset,
          portfolioName: pName,
          displayType,
          originalType,
          assetCurrency,
          isDiffCurrency: assetCurrency !== displayCurrency,
          bpConv,
          cpConv,
          costConv,
          valConv
        });
      };

      snap.stocks?.forEach((s: any) => {
        const type = (s.sector || '').toLowerCase() === 'cryptocurrency' || (s.exchange || '').toUpperCase() === 'CRYPTO' ? 'عملة مشفرة' :
          (s.sector || '').toLowerCase() === 'forex' || (s.exchange || '').toUpperCase() === 'FOREX' ? 'فوركس' : 'سهم';
        processAsset(s, type, 'stocks');
      });

      snap.funds?.forEach((f: any) => {
        const type = f.fundType === 'commodities' ? 'سلعة' : 'صندوق';
        processAsset(f, type, 'funds');
      });

      snap.bonds?.forEach((b: any) => {
        const type = b.type === 'sukuk' ? 'صك' : 'سند';
        processAsset(b, type, 'bonds');
      });
    });

    return list.sort((a, b) => {
      return b.valConv - a.valConv;
    });
  }, [allSnapshots, snapshot, portfolioCurrencyMap, displayCurrency]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAssets = useMemo(() => {
    let filteredItems = [...allConsolidatedAssets];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      filteredItems = filteredItems.filter(a =>
        (a.symbol || '').toLowerCase().includes(q) ||
        (a.name || '').toLowerCase().includes(q)
      );
    }

    filteredItems.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortConfig.key) {
        case 'symbol':
          valA = a.symbol || a.name || '';
          valB = b.symbol || b.name || '';
          break;
        case 'type':
          valA = a.displayType || '';
          valB = b.displayType || '';
          break;
        case 'portfolio':
          valA = a.portfolioName || '';
          valB = b.portfolioName || '';
          break;
        case 'qty':
          valA = a.qty || a.units || 0;
          valB = b.qty || b.units || 0;
          break;
        case 'price':
          valA = a.cpConv;
          valB = b.cpConv;
          break;
        case 'value':
          valA = a.valConv;
          valB = b.valConv;
          break;
        case 'cost':
          valA = a.costConv;
          valB = b.costConv;
          break;
        case 'pnl':
          valA = a.valConv - a.costConv;
          valB = b.valConv - b.costConv;
          break;
        case 'pnlPct': {
          valA = a.costConv > 0 ? ((a.valConv - a.costConv) / a.costConv) * 100 : 0;
          valB = b.costConv > 0 ? ((b.valConv - b.costConv) / b.costConv) * 100 : 0;
          break;
        }
      }
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return filteredItems;
  }, [allConsolidatedAssets, sortConfig, tableSearch]);

  const handleExportExcel = () => {
    import('xlsx').then((XLSX) => {
      const exportData = sortedAssets.map(asset => {
        const qty = asset.qty || asset.units || 0;
        const cost = asset.costConv;
        const val = asset.valConv;
        const pnl = val - cost;
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;

        return {
          'الأصل': asset.symbol || asset.name,
          'الاسم': asset.name,
          'النوع': asset.displayType,
          'المحفظة': asset.portfolioName,
          'الكمية': qty,
          'سعر الشراء': asset.bpConv,
          'السعر الحالي': asset.cpConv,
          [`التكلفة الإجمالية (${displayCurrency})`]: cost,
          [`القيمة الإجمالية (${displayCurrency})`]: val,
          [`الربح/الخسارة (${displayCurrency})`]: pnl,
          'النسبة المئوية %': Number(pnlPct.toFixed(2))
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "الأصول المدمجة");
      XLSX.writeFile(wb, "portfolio-consolidated-assets.xlsx");
    }).catch(err => {
      console.error("Error loading xlsx library", err);
      toast({ title: 'خطأ', description: 'تعذر تصدير الملف. تأكد من توفر مكتبة xlsx.', variant: 'destructive' });
    });
  };

  const allAssets = useMemo<FocusAssetContext[]>(() => {
    if (allConsolidatedAssets.length === 0) return [];
    return allConsolidatedAssets.map(item => ({
      symbol: item.symbol,
      name: item.name || item.symbol,
      type: item.originalType as AnalysisAssetType,
      exchange: item.exchange,
      currency: item.currency,
    }));
  }, [allConsolidatedAssets]);

  const consolidatedStats = useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;

    allConsolidatedAssets.forEach((asset) => {
      totalCost += asset.costConv;
      totalValue += asset.valConv;
    });

    const pnl = totalValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

    return { totalCost, totalValue, pnl, pnlPct };
  }, [allConsolidatedAssets]);

  const distributionByType = useMemo(() => {
    const map: Record<string, number> = {};
    allConsolidatedAssets.forEach(asset => {
      const val = asset.valConv;
      if (val > 0) {
        map[asset.displayType] = (map[asset.displayType] || 0) + val;
      }
    });
    return Object.keys(map).map(key => ({ name: key, value: map[key] })).sort((a, b) => b.value - a.value);
  }, [allConsolidatedAssets]);

  const distributionByPortfolio = useMemo(() => {
    const map: Record<string, number> = {};
    allConsolidatedAssets.forEach(asset => {
      const val = asset.valConv;
      if (val > 0) {
        map[asset.portfolioName] = (map[asset.portfolioName] || 0) + val;
      }
    });
    return Object.keys(map).map(key => ({ name: key, value: map[key] })).sort((a, b) => b.value - a.value);
  }, [allConsolidatedAssets]);

  const top5AssetsByValue = useMemo(() => {
    return [...allConsolidatedAssets]
      .map(asset => ({
        name: asset.symbol || asset.name || 'غير معروف',
        value: asset.valConv
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((item, index) => ({ ...item, fill: COLORS[index % COLORS.length] }));
  }, [allConsolidatedAssets]);

  const top5AssetsByPNL = useMemo(() => {
    return [...allConsolidatedAssets]
      .map(asset => {
        const pnl = asset.valConv - asset.costConv;
        return {
          name: asset.symbol || asset.name || 'غير معروف',
          pnl
        };
      })
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
      .slice(0, 5)
      .map((item) => ({ ...item, fill: item.pnl >= 0 ? '#10b981' : '#ef4444' }));
  }, [allConsolidatedAssets]);

  const focusedAsset = useMemo(() => {
    if (!linkedSymbol) return null;
    return (
      allAssets.find((asset) => asset.symbol.toUpperCase() === linkedSymbol && (!linkedType || asset.type === linkedType)) ||
      allAssets.find((asset) => asset.symbol.toUpperCase() === linkedSymbol) ||
      null
    );
  }, [allAssets, linkedSymbol, linkedType]);

  const displayFocusedAsset = useMemo<FocusAssetContext | null>(() => {
    if (!focusedAsset && !linkedSymbol) return null;
    if (focusedAsset) {
      return {
        ...focusedAsset,
        name: linkedName || focusedAsset.name,
      };
    }
    if (!linkedType) return null;
    return {
      symbol: linkedSymbol,
      name: linkedName || linkedSymbol,
      type: linkedType,
    };
  }, [focusedAsset, linkedName, linkedSymbol, linkedType]);

  const liveBaseline = useMemo(() => {
    const totalValue = consolidatedStats.totalValue;
    const totalCost = consolidatedStats.totalCost;
    const pnlPct = consolidatedStats.pnlPct;
    const categories = [...dashboardData.assetCategories]
      .filter((item) => item.valueSAR > 0)
      .sort((a, b) => b.valueSAR - a.valueSAR);

    const topWeight = totalValue > 0 && categories.length
      ? (categories[0].valueSAR / totalValue) * 100
      : 0;
    const concentration = Math.round(clampNumber(topWeight, 5, 95));
    const diversification = Math.round(clampNumber(100 - topWeight, 35, 95));
    const riskScore = Math.round(clampNumber(30 + concentration * 0.55, 20, 90));
    const overallScore = Math.round(clampNumber(65 + (pnlPct * 0.8) - ((riskScore - 50) * 0.4), 35, 95));

    const baseValue = totalValue > 0 ? totalValue : (totalCost > 0 ? totalCost : 100000);
    const scenarios = [
      { scenario: 'أفضل حالة', value: baseValue * 1.12, change: 12 },
      { scenario: 'الحالة المتوسطة', value: baseValue * 1.05, change: 5 },
      { scenario: 'أسوأ حالة', value: baseValue * 0.92, change: -8 },
    ];

    const currentAllocation = categories.slice(0, 5).map((item) => ({
      sector: item.label,
      current: totalValue > 0 ? Number(((item.valueSAR / totalValue) * 100).toFixed(1)) : 0,
      optimal: totalValue > 0 ? Number((100 / Math.max(categories.length, 4)).toFixed(1)) : 0,
    }));

    const benchmarkDelta = Number((pnlPct - 6).toFixed(2));
    const benchmarkSector = Number((pnlPct - 4).toFixed(2));
    const benchmarkRiskAdjusted = Number((pnlPct - 3).toFixed(2));

    return {
      overallScore,
      concentration,
      diversification,
      riskScore,
      scenarios,
      currentAllocation: currentAllocation.length ? currentAllocation : initialPortfolioAnalysis.optimization.currentAllocation,
      benchmarkDelta,
      benchmarkSector,
      benchmarkRiskAdjusted,
    };
  }, [dashboardData.assetCategories, consolidatedStats]);

  useEffect(() => {
    if (analysisFromAI) return;

    setAnalysis((prev: any) => ({
      ...prev,
      overallScore: liveBaseline.overallScore,
      riskAnalysis: {
        ...prev.riskAnalysis,
        riskScore: liveBaseline.riskScore,
        diversification: liveBaseline.diversification,
        concentration: liveBaseline.concentration,
      },
      performance: {
        ...prev.performance,
        scenarios: liveBaseline.scenarios,
      },
      optimization: {
        ...prev.optimization,
        currentAllocation: liveBaseline.currentAllocation,
      },
      benchmark: {
        ...prev.benchmark,
        vsTasi: { ...prev.benchmark?.vsTasi, performance: liveBaseline.benchmarkDelta },
        vsSector: { ...prev.benchmark?.vsSector, performance: liveBaseline.benchmarkSector },
        riskAdjusted: { ...prev.benchmark?.riskAdjusted, performance: liveBaseline.benchmarkRiskAdjusted },
      },
    }));
  }, [analysisFromAI, liveBaseline]);

  useEffect(() => {
    setAnalysisFromAI(false);
  }, [snapshot?.portfolioId]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadFocusStats() {
      if (!displayFocusedAsset) {
        setFocusStats(null);
        return;
      }

      setFocusStatsLoading(true);
      try {
        const yahooSymbol = toYahooSymbolForAsset(displayFocusedAsset.symbol, displayFocusedAsset.type);
        const cacheKey = `${yahooSymbol}-6mo-1d`;

        // التحقق من الذاكرة المؤقتة أولاً
        if (focusStatsCache.has(cacheKey)) {
          setFocusStats(focusStatsCache.get(cacheKey)!);
          setFocusStatsLoading(false);
          return;
        }

        const res = await fetch(`/api/chart?symbol=${encodeURIComponent(yahooSymbol)}&range=6mo&interval=1d`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const payload = await res.json();
        const closes = (payload?.data || [])
          .map((item: any) => Number(item?.close))
          .filter((value: number) => Number.isFinite(value) && value > 0);

        if (closes.length < 10) {
          throw new Error('Insufficient market bars');
        }

        const windowed = closes.slice(-30);
        const first = windowed[0] || 0;
        const last = windowed[windowed.length - 1] || 0;
        const return30d = first > 0 ? ((last / first) - 1) * 100 : 0;

        const returns: number[] = [];
        for (let i = 1; i < windowed.length; i++) {
          const prev = windowed[i - 1];
          const next = windowed[i];
          if (prev > 0) returns.push((next - prev) / prev);
        }
        const avg = returns.reduce((sum, val) => sum + val, 0) / (returns.length || 1);
        const variance = returns.reduce((sum, val) => sum + ((val - avg) ** 2), 0) / (returns.length || 1);
        const volatility30d = Math.sqrt(Math.max(variance, 0)) * Math.sqrt(252) * 100;

        if (!cancelled) {
          const stats = {
            latestClose: last,
            return30d,
            volatility30d,
            bars: closes.length,
          };
          focusStatsCache.set(cacheKey, stats);
          setFocusStats(stats);
        }
      } catch {
        if (!cancelled) {
          setFocusStats(null);
        }
      } finally {
        if (!cancelled) {
          setFocusStatsLoading(false);
        }
      }
    }

    void loadFocusStats();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [displayFocusedAsset]);

  const handleAnalyze = async () => {
    try {
      const totalOpenPositions =
        (snapshot?.stocks?.length || 0) +
        (snapshot?.funds?.length || 0) +
        (snapshot?.bonds?.length || 0);

      if (totalOpenPositions === 0) {
        toast({ title: 'تنبيه', description: 'لا يوجد أوامر مفتوحة في محفظتك لتحليلها.', variant: 'default' });
        return;
      }

      setIsAnalyzing(true);

      const providerInfo = SHARED_PROVIDERS.find(p => p.id === selectedProvider);
      const resolved = resolveProvider(selectedProvider);

      if (providerInfo?.needsKey && !providerApiKey?.trim()) {
        toast({
          title: 'مفتاح API مطلوب',
          description: `أدخل مفتاح ${providerInfo.nameAr} في الإعدادات أدناه أو اختر مزود آخر.`,
          variant: 'destructive',
        });
        setIsAnalyzing(false);
        return;
      }

      const effectiveResolved = (providerInfo?.needsKey && providerApiKey?.trim())
        ? { provider: selectedProvider, apiKey: providerApiKey.trim(), model: selectedModel }
        : { ...resolved, model: selectedModel };

      const consolidatedAiData = allConsolidatedAssets.map(item => ({
        portfolio: item.portfolioName,
        symbol: item.symbol || item.name,
        name: item.name,
        type: item.displayType,
        qty: item.qty || item.units,
        buyPrice: item.buyPrice,
        currentPrice: item.currentPrice || item.livePrice || item.buyPrice,
        currency: item.assetCurrency,
        valueSAR: item.valConv
      }));

      const portfolioData = {
        snapshotCurrency: snapshot?.currency || 'SAR',
        totals: {
          portfolioValueSAR: consolidatedStats.totalValue,
          portfolioCostSAR: consolidatedStats.totalCost,
          pnlSAR: consolidatedStats.pnl,
          pnlPct: consolidatedStats.pnlPct,
        },
        categories: dashboardData.assetCategories,
        positionsCount: {
          stocks: snapshot?.stocks?.length || 0,
          funds: snapshot?.funds?.length || 0,
          bonds: snapshot?.bonds?.length || 0,
          total: totalOpenPositions,
        },
        holdings: {
          stocks: snapshot?.stocks || [],
          funds: snapshot?.funds || [],
          bonds: snapshot?.bonds || [],
        },
        liveTopPositions: consolidatedAiData,
        focusAsset: displayFocusedAsset
          ? {
            symbol: displayFocusedAsset.symbol,
            name: displayFocusedAsset.name,
            type: displayFocusedAsset.type,
            typeLabel: getAssetTypeLabel(displayFocusedAsset.type),
            marketStats: focusStats,
          }
          : null,
        sources: ['/api/ticker', '/api/real-prices', '/api/forex', '/api/funds', '/api/chart'],
        generatedAt: new Date().toISOString(),
      };

      const focusInstructions = displayFocusedAsset
        ? `تركيز إضافي: قم بإعطاء تحليل تفصيلي للأصل المحدد (${displayFocusedAsset.symbol} - ${displayFocusedAsset.name}) ضمن سياق المحفظة بالكامل، مع توصية تنفيذية واضحة.`
        : 'قم بتحليل جميع الأصول المدمجة من جميع المحافظ (أسهم، صناديق، صكوك، سندات، عملات مشفرة، فوركس). أبرز أكبر 3 نقاط قوة وأكبر 3 مخاطر بناءً على التنوع الكلي.';

      const promptText = `
أنت مستشار مالي ومحلل محافظ استثمارية متمرس وخبير في السوق السعودي والأمريكي والعملات الرقمية والصناديق.
المهمة: قم بتحليل دقيق للمحفظة الاستثمارية المرفقة (بصيغة JSON) وحدّد التوصيات لتحسين العائد والمخاطرة. يجب استخراج وتوزيع المخاطر وتقييم القطاعات، وتقييم التنويع والسيولة.
استخدم البيانات الحية المضمنة (liveTopPositions + categories + marketStats) لزيادة دقة التوصيات.
${focusInstructions}
الهدف الحصري: قم برد إجابتك **حصرياً** بتنسيق JSON (بدون تضمين الأقواس المعكوسة Markdown أو كلمة json) ومطابق تماماً لهذا الهيكل بحيث يمكن لبرنامجي القيام بـ JSON.parse(response) دون أي أخطاء:
${JSON.stringify(initialPortfolioAnalysis, null, 2)}

بيانات المحفظة الحالية للدروس والتحليل:
${JSON.stringify(portfolioData)}
`;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: effectiveResolved.provider,
          model: effectiveResolved.model || undefined,
          apiKey: effectiveResolved.apiKey || undefined,
          prompt: promptText,
        })
      });

      const data = await res.json();
      if (!data.success) {
        const errMsg = data.error || 'حدث خطأ غير معروف';
        throw new Error(errMsg);
      }

      const parsed = safeParseAIJson(data.content || '');
      setAnalysis(parsed);
      setAnalysisFromAI(true);
      toast({ title: 'نجاح', description: 'تم التحديث بناءً على تحليل الذكاء الاصطناعي!' });
    } catch (e: any) {
      console.error(e);
      const errorMsg = e.message || 'حدث خطأ.';
      if (errorMsg.includes('لا يوجد مزود') || errorMsg.includes('مفتاح API')) {
        toast({
          title: 'مطلوب إعداد الذكاء الاصطناعي',
          description: 'اختر مزوداً وأدخل مفتاح API من القائمة أدناه، أو انتقل إلى صفحة الإعدادات.',
          variant: 'destructive',
        });
        setShowProviderPanel(true);
      } else {
        toast({ title: 'خطأ أثناء التحليل', description: errorMsg, variant: 'destructive' });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // دالة لمحاكاة التحليل بدون إنترنت أو API
  const handleSimulate = () => {
    setIsAnalyzing(true);

    // افتعال تأخير زمني لمحاكاة انتظار رد السيرفر
    setTimeout(() => {
      setAnalysis((prev: any) => ({
        ...initialPortfolioAnalysis,
        overallScore: liveBaseline.overallScore,
        recommendations: [
          {
            id: 99,
            type: 'optimization',
            priority: 'medium',
            title: 'محاكاة التحليل (Offline Mode)',
            description: 'تم إنشاء هذا التحليل محلياً لاختبار الواجهة بدون إنترنت أو استهلاك رصيد الذكاء الاصطناعي.',
            impact: 'توفير تكلفة API',
            action: 'اختبار الواجهة بنجاح',
          },
          ...initialPortfolioAnalysis.recommendations.slice(0, 3)
        ],
      }));
      setAnalysisFromAI(true);
      setIsAnalyzing(false);
      toast({ title: 'وضع المحاكاة', description: 'تم عرض بيانات تحليل وهمية بنجاح.' });
    }, 1500);
  };

  const chartConfig = {
    value: {
      label: 'القيمة',
      color: '#b8860b',
    },
  } satisfies ChartConfig;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="📈 أداء وتحليل المحفظة" />
        <main className="p-6 space-y-6">
          {/* العنوان */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-7 w-7 text-primary" />
                منصة أداء وتحليل المحفظة
              </h2>
              <p className="text-muted-foreground">
                أداء حي + تحليل ذكي للمحفظة مع توصيات تنفيذية مخصصة
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProviderPanel(!showProviderPanel)}
                className="gap-1 text-xs"
              >
                <Settings className="h-3.5 w-3.5" />
                <Key className="h-3.5 w-3.5" />
                {SHARED_PROVIDERS.find(p => p.id === selectedProvider)?.icon} {SHARED_PROVIDERS.find(p => p.id === selectedProvider)?.nameAr}
                · {getModelsForProvider(selectedProvider).find(m => m.id === selectedModel)?.nameAr || selectedModel}
                {showProviderPanel ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="gap-2"
                title="طباعة التقرير أو حفظه كـ PDF"
              >
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
              <Button
                variant="secondary"
                onClick={handleSimulate}
                disabled={isAnalyzing}
                className="gap-2"
              >
                محاكاة (Offline)
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    تحديث التحليل الذكي
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* إحصائيات مجمعة لجميع المحافظ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-primary/20 shadow-sm">
              <CardContent className="p-4 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  القيمة الإجمالية
                </p>
                <p className="text-2xl font-bold">{formatCurrency(consolidatedStats.totalValue)}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 shadow-sm">
              <CardContent className="p-4 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  التكلفة الإجمالية
                </p>
                <p className="text-2xl font-bold">{formatCurrency(consolidatedStats.totalCost)}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 shadow-sm">
              <CardContent className="p-4 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  الربح / الخسارة
                </p>
                <p className={cn("text-2xl font-bold", consolidatedStats.pnl >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {consolidatedStats.pnl > 0 ? '+' : ''}{formatCurrency(consolidatedStats.pnl)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 shadow-sm">
              <CardContent className="p-4 flex flex-col gap-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  العائد الإجمالي
                </p>
                <p className={cn("text-2xl font-bold", consolidatedStats.pnlPct >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {consolidatedStats.pnlPct > 0 ? '+' : ''}{formatPercent(consolidatedStats.pnlPct)}
                </p>
              </CardContent>
            </Card>
          </div>

          {showProviderPanel && (
            <Card className="border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Key className="h-4 w-4 text-amber-600" />
                    إعدادات مزود الذكاء الاصطناعي
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {SHARED_PROVIDERS.map((p) => {
                      const isActive = selectedProvider === p.id;
                      const keyVal = getApiKey(p.id);
                      const hasKey = !p.needsKey || (keyVal.trim().length >= 10 && !keyVal.includes('dummy'));
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProvider(p.id);
                            const newModel = getDefaultModelForProvider(p.id);
                            setSelectedModel(newModel);
                            setProviderApiKey(getApiKey(p.id));
                            saveDefaults(p.id, newModel);
                          }}
                          className={cn(
                            'flex flex-col items-start gap-1 rounded-lg border p-3 text-right transition-all hover:shadow-sm',
                            isActive
                              ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                              : 'border-border hover:border-primary/40'
                          )}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="text-lg">{p.icon}</span>
                            <span className="font-medium text-sm">{p.nameAr}</span>
                            {isActive && <Badge variant="default" className="mr-auto text-[10px] px-1.5 py-0">مختار</Badge>}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{p.description}</span>
                          {p.isFree && <span className="text-[10px] text-green-600">✓ مجاني</span>}
                          {p.needsKey && (
                            <span className={cn('text-[10px]', hasKey ? 'text-green-600' : 'text-red-500')}>
                              {hasKey ? '✓ مفتاح محفوظ' : '✗ يتطلب مفتاح'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">النموذج</label>
                      <Select value={selectedModel} onValueChange={(v) => { setSelectedModel(v); saveDefaults(selectedProvider, v); }}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getModelsForProvider(selectedProvider).map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              <div className="flex items-center gap-2">
                                <span>{m.nameAr}</span>
                                {m.recommended && <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800 px-1">موصى به</Badge>}
                                {m.free && <Badge variant="secondary" className="text-[10px] px-1">مجاني</Badge>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {SHARED_PROVIDERS.find(p => p.id === selectedProvider)?.needsKey && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">مفتاح API</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={providerApiKey}
                            onChange={(e) => setProviderApiKey(e.target.value)}
                            placeholder={SHARED_PROVIDERS.find(p => p.id === selectedProvider)?.keyPlaceholder || 'أدخل مفتاح API...'}
                            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const keys = getAISettings().apiKeys;
                              keys[selectedProvider] = providerApiKey.trim();
                              const aliasMap: Record<string, string> = { anthropic: 'anthropic_claude', anthropic_claude: 'anthropic', google: 'google_gemini', google_gemini: 'google', xai: 'xai_grok', xai_grok: 'xai' };
                              const alias = aliasMap[selectedProvider];
                              if (alias) keys[alias] = providerApiKey.trim();
                              saveApiKeys(keys);
                              saveDefaults(selectedProvider, selectedModel);
                              toast({ title: 'تم الحفظ', description: `تم حفظ مفتاح ${SHARED_PROVIDERS.find(p => p.id === selectedProvider)?.nameAr}` });
                            }}
                            disabled={!providerApiKey?.trim()}
                          >
                            حفظ
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      المفاتيح تُحفظ محلياً في المتصفح فقط. يمكنك أيضاً إدارتها من{' '}
                      <Link href="/settings" className="text-primary underline">صفحة الإعدادات</Link>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {(displayFocusedAsset || consolidatedStats.totalValue > 0) && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">التحليل مرتبط ببيانات حية من مصادر المشروع</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">/api/ticker</Badge>
                      <Badge variant="outline">/api/real-prices</Badge>
                      <Badge variant="outline">/api/forex</Badge>
                      <Badge variant="outline">/api/funds</Badge>
                      <Badge variant="outline">/api/chart</Badge>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">قيمة المحفظة الحالية:</span>{' '}
                    <span className="font-bold">{formatCurrency(consolidatedStats.totalValue)}</span>
                  </div>
                </div>

                {displayFocusedAsset && (
                  <div className="mt-4 rounded-lg border bg-background p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold">{displayFocusedAsset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {displayFocusedAsset.symbol} • {getAssetTypeLabel(displayFocusedAsset.type)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {focusStatsLoading ? (
                          <Badge variant="outline">تحميل بيانات الأصل...</Badge>
                        ) : focusStats ? (
                          <>
                            <Badge variant="outline">آخر سعر: {formatNumber(focusStats.latestClose, 4)}</Badge>
                            <Badge variant="outline">30 يوم: {formatPercent(focusStats.return30d)}</Badge>
                            <Badge variant="outline">تقلب سنوي: {formatNumber(focusStats.volatility30d, 2)}%</Badge>
                          </>
                        ) : (
                          <Badge variant="outline">تعذر تحميل بيانات تفصيلية للأصل</Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/technical-analysis?symbol=${encodeURIComponent(displayFocusedAsset.symbol)}&type=${displayFocusedAsset.type}&name=${encodeURIComponent(displayFocusedAsset.name)}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <BarChart3 className="h-3.5 w-3.5" />
                          عرض التحليل الفني
                        </Button>
                      </Link>
                      <Link href={`/risk-analysis?symbol=${encodeURIComponent(displayFocusedAsset.symbol)}&type=${displayFocusedAsset.type}&name=${encodeURIComponent(displayFocusedAsset.name)}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Shield className="h-3.5 w-3.5" />
                          عرض تحليل المخاطر
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* النتيجة الإجمالية */}
          <Card className="bg-gradient-to-l from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <svg className="h-24 w-24 -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted/20"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={`${analysis.overallScore * 2.51} 251`}
                        className="text-amber-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-amber-600">
                        {analysis.overallScore}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-amber-800 dark:text-amber-200">
                      نتيجة المحفظة: جيد جداً
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300">
                      المحفظة في وضع جيد مع فرص للتحسين
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-green-600 gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        متفوقة على المؤشر بـ 2.3%
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20">
                    <p className="text-xs text-muted-foreground">مخاطر</p>
                    <Badge variant="outline" className="mt-1">متوسط</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20">
                    <p className="text-xs text-muted-foreground">تنويع</p>
                    <Badge variant="outline" className="mt-1">جيد</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-white/50 dark:bg-black/20">
                    <p className="text-xs text-muted-foreground">عائد متوقع</p>
                    <Badge className="mt-1 bg-green-600">+8-12%</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* التوصيات الرئيسية */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                التوصيات الرئيسية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={cn(
                      'p-4 rounded-lg border-r-4',
                      rec.type === 'action' && 'bg-blue-50 dark:bg-blue-900/20 border-blue-500',
                      rec.type === 'opportunity' && 'bg-green-50 dark:bg-green-900/20 border-green-500',
                      rec.type === 'risk' && 'bg-red-50 dark:bg-red-900/20 border-red-500',
                      rec.type === 'optimization' && 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {rec.type === 'action' && <Zap className="h-4 w-4 text-blue-500" />}
                          {rec.type === 'opportunity' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {rec.type === 'risk' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {rec.type === 'optimization' && <Target className="h-4 w-4 text-amber-500" />}
                          <span className="font-medium">{rec.title}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              rec.priority === 'high' && 'border-red-500 text-red-600',
                              rec.priority === 'medium' && 'border-amber-500 text-amber-600',
                              rec.priority === 'low' && 'border-green-500 text-green-600'
                            )}
                          >
                            {rec.priority === 'high' ? 'أولوية عالية' :
                              rec.priority === 'medium' ? 'أولوية متوسطة' : 'أولوية منخفضة'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-muted-foreground">
                            <strong>التأثير:</strong> {rec.impact}
                          </span>
                          <span className="text-muted-foreground">
                            <strong>الإجراء:</strong> {rec.action}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* التحليل التفصيلي */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="risk">المخاطر</TabsTrigger>
              <TabsTrigger value="optimization">التحسين</TabsTrigger>
              <TabsTrigger value="scenarios">السيناريوهات</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* رسم الرادار */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      تقييم الأبعاد
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" className="text-xs" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="التقييم"
                          dataKey="value"
                          stroke="#b8860b"
                          fill="#b8860b"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* نقاط القوة والضعف */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                        <ThumbsUp className="h-5 w-5" />
                        نقاط القوة
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.strengths.map((strength, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                        <ThumbsDown className="h-5 w-5" />
                        نقاط الضعف
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.weaknesses.map((weakness, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm">{weakness}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="risk" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">مخاطر إجمالية</p>
                    <Badge className="text-lg">متوسط</Badge>
                    <p className="text-2xl font-bold mt-2">{analysis.riskAnalysis.riskScore}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">معامل شارب</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analysis.riskAnalysis.sharpeRatio}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">أقصى انخفاض</p>
                    <p className="text-2xl font-bold text-red-600">
                      {analysis.riskAnalysis.maxDrawdown}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">بيتا</p>
                    <p className="text-2xl font-bold">{analysis.riskAnalysis.beta}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    عوامل المخاطر
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.riskAnalysis.factors.map((factor) => (
                      <div key={factor.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{factor.name}</span>
                          <span className={cn(
                            'text-sm font-medium',
                            factor.level > 70 ? 'text-red-600' :
                              factor.level > 40 ? 'text-amber-600' : 'text-green-600'
                          )}>
                            {factor.level}%
                          </span>
                        </div>
                        <Progress
                          value={factor.level}
                          className={cn(
                            'h-2',
                            factor.level > 70 && 'bg-red-100',
                            factor.level > 40 && factor.level <= 70 && 'bg-amber-100',
                            factor.level <= 40 && 'bg-green-100'
                          )}
                        />
                        <p className="text-xs text-muted-foreground">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    التحسين وتوزيع الأصول
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-4">التوزيع الحالي مقابل الأمثل</h4>
                      <div className="space-y-4">
                        {analysis.optimization.currentAllocation.map((item: any, index: number) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>{item.sector}</span>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span>حالي: {item.current}%</span>
                                <span>•</span>
                                <span>أمثل: {item.optimal}%</span>
                              </div>
                            </div>
                            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="absolute top-0 right-0 h-full bg-primary"
                                style={{ width: `${Math.min(item.current, item.optimal)}%` }}
                              />
                              <div
                                className="absolute top-0 bottom-0 w-1 bg-amber-500 z-10"
                                style={{ right: `calc(${item.optimal}% - 2px)` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-4">الصفقات المقترحة</h4>
                      <div className="space-y-3">
                        {analysis.optimization.suggestedTrades.map((trade: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <Badge className={trade.action === 'شراء' ? 'bg-green-600' : 'bg-red-600'}>
                                {trade.action}
                              </Badge>
                              <div>
                                <p className="font-medium">{trade.stock}</p>
                                <p className="text-xs text-muted-foreground">{trade.qty} سهم • {trade.reason}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scenarios" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    السيناريوهات المتوقعة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysis.performance.scenarios.map((scenario: any, index: number) => (
                      <div key={index} className={cn(
                        "p-4 rounded-xl text-center border-t-4 shadow-sm",
                        scenario.change > 0 ? "border-green-500 bg-green-50 dark:bg-green-900/10" :
                          scenario.change < 0 ? "border-red-500 bg-red-50 dark:bg-red-900/10" :
                            "border-amber-500 bg-amber-50 dark:bg-amber-900/10"
                      )}>
                        <h4 className="font-medium mb-2">{scenario.scenario}</h4>
                        <p className="text-2xl font-bold mb-1">{formatCurrency(scenario.value)}</p>
                        <Badge variant="outline" className={cn(
                          scenario.change > 0 ? "text-green-600 border-green-200" :
                            scenario.change < 0 ? "text-red-600 border-red-200" :
                              "text-amber-600 border-amber-200"
                        )}>
                          {scenario.change > 0 ? '+' : ''}{scenario.change}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* جدول جميع الأصول المدمجة للطباعة والعرض التفصيلي */}
          <Card className="mt-6 border-primary/20 shadow-sm">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                تفاصيل الأصول المدمجة ({allConsolidatedAssets.length})
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto print:hidden">
                <div className="relative w-full md:w-64">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالأصل أو الاسم..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="pr-9 h-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 h-9">
                  <Download className="h-4 w-4" />
                  تصدير Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {allConsolidatedAssets.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6 print:hidden">
                  {/* توزيع الأصول حسب النوع */}
                  <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-muted/10 shadow-sm">
                    <h4 className="font-medium text-sm mb-4 flex items-center gap-2 text-primary">
                      <PieChartIcon className="h-4 w-4" /> توزيع الأصول حسب النوع
                    </h4>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={distributionByType} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {distributionByType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                                      <span className="font-medium">{payload[0].name}</span>
                                    </div>
                                    <div className="mt-1 font-bold text-primary">{formatCurrency(payload[0].value as number)}</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {distributionByType.map((entry, index) => (
                        <div key={`legend-${index}`} className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span>{entry.name} ({formatPercent((entry.value / consolidatedStats.totalValue) * 100)})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* توزيع الأصول حسب المحفظة */}
                  <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-muted/10 shadow-sm">
                    <h4 className="font-medium text-sm mb-4 flex items-center gap-2 text-primary">
                      <Briefcase className="h-4 w-4" /> توزيع الأصول حسب المحفظة
                    </h4>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={distributionByPortfolio} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {distributionByPortfolio.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                                      <span className="font-medium">{payload[0].name}</span>
                                    </div>
                                    <div className="mt-1 font-bold text-primary">{formatCurrency(payload[0].value as number)}</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {distributionByPortfolio.map((entry, index) => (
                        <div key={`legend-${index}`} className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span>{entry.name} ({formatPercent((entry.value / consolidatedStats.totalValue) * 100)})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* أعلى 5 أصول من حيث القيمة */}
                  <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-muted/10 shadow-sm">
                    <h4 className="font-medium text-sm mb-4 flex items-center gap-2 text-primary">
                      <TrendingUp className="h-4 w-4" /> أعلى 5 أصول بالقيمة
                    </h4>
                    <div className="h-[250px] w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={top5AssetsByValue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                          />
                          <Tooltip
                            cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm text-right" dir="rtl">
                                    <span className="font-medium">{payload[0].payload.name}</span>
                                    <div className="mt-1 font-bold text-primary">{formatCurrency(payload[0].value as number)}</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {top5AssetsByValue.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* أعلى 5 أصول من حيث الربح/الخسارة */}
                  <div className="flex flex-col items-center justify-center p-4 border rounded-xl bg-muted/10 shadow-sm">
                    <h4 className="font-medium text-sm mb-4 flex items-center gap-2 text-primary">
                      <ArrowUpDown className="h-4 w-4" /> أعلى 5 أصول (ربح/خسارة)
                    </h4>
                    <div className="h-[250px] w-full" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={top5AssetsByPNL} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(value) => Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                          />
                          <Tooltip
                            cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const val = payload[0].value as number;
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm text-right" dir="rtl">
                                    <span className="font-medium">{payload[0].payload.name}</span>
                                    <div className={cn("mt-1 font-bold", val >= 0 ? "text-emerald-600" : "text-red-600")}>
                                      {val > 0 ? '+' : ''}{formatCurrency(val)}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="pnl" radius={[4, 4, 4, 4]}>
                            {top5AssetsByPNL.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-2 font-medium cursor-pointer hover:text-primary transition-colors select-none" onClick={() => requestSort('symbol')}>
                        <div className="flex items-center justify-start gap-1">
                          الأصل
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                      </th>
                      <th className="pb-2 font-medium cursor-pointer hover:text-primary transition-colors select-none" onClick={() => requestSort('type')}>
                        <div className="flex items-center justify-start gap-1">
                          النوع
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                      </th>
                      <th className="pb-2 font-medium cursor-pointer hover:text-primary transition-colors select-none" onClick={() => requestSort('portfolio')}>
                        <div className="flex items-center justify-start gap-1">
                          المحفظة
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                      </th>
                      <th className="pb-2 font-medium cursor-pointer hover:text-primary transition-colors select-none" onClick={() => requestSort('qty')}>
                        <div className="flex items-center justify-start gap-1">
                          الكمية
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                      </th>
                      <th className="pb-2 font-medium cursor-pointer hover:text-primary transition-colors select-none" onClick={() => requestSort('price')}>
                        <div className="flex items-center justify-start gap-1">
                          السعر الحالي
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                      </th>
                      <th className="pb-2 font-medium cursor-pointer hover:text-primary transition-colors select-none" onClick={() => requestSort('cost')}>
                        <div className="flex items-center justify-start gap-1">
                          التكلفة ({displayCurrency})
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                      </th>
                      <th className="pb-2 font-medium cursor-pointer hover:text-primary transition-colors select-none" onClick={() => requestSort('value')}>
                        <div className="flex items-center justify-start gap-1">
                          القيمة ({displayCurrency})
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                      </th>
                      <th className="pb-2 font-medium cursor-pointer hover:text-primary transition-colors select-none" onClick={() => requestSort('pnl')}>
                        <div className="flex items-center justify-start gap-1">
                          الربح/الخسارة
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                      </th>
                      <th className="pb-2 font-medium cursor-pointer hover:text-primary transition-colors select-none" onClick={() => requestSort('pnlPct')}>
                        <div className="flex items-center justify-start gap-1">
                          النسبة ٪
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAssets.map((asset, idx) => {
                      const qty = asset.qty || asset.units || 0;
                      const cost = asset.costConv;
                      const val = asset.valConv;
                      const pnl = val - cost;
                      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                      const origPrice = asset.currentPrice || asset.livePrice || asset.buyPrice || 0;

                      let AssetIcon = Building2;
                      if (asset.displayType === 'عملة مشفرة') AssetIcon = Bitcoin;
                      else if (asset.displayType === 'فوركس') AssetIcon = Coins;
                      else if (asset.displayType === 'صندوق') AssetIcon = Wallet;
                      else if (asset.displayType === 'سلعة') AssetIcon = Package;
                      else if (asset.displayType === 'صك' || asset.displayType === 'سند') AssetIcon = Landmark;

                      return (
                        <tr
                          key={`${asset.symbol}-${idx}`}
                          className={cn(
                            "border-b last:border-0 transition-colors",
                            pnl > 0 ? "bg-emerald-50/40 hover:bg-emerald-100/50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20" :
                              pnl < 0 ? "bg-red-50/40 hover:bg-red-100/50 dark:bg-red-900/10 dark:hover:bg-red-900/20" :
                                "hover:bg-muted/30"
                          )}
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-3 justify-start">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary shrink-0">
                                <AssetIcon className="h-4 w-4" />
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-primary">{asset.symbol || asset.name}</div>
                                {asset.symbol && <div className="text-xs text-muted-foreground">{asset.name}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3"><Badge variant="outline">{asset.displayType}</Badge></td>
                          <td className="py-3"><Badge variant="secondary" className="bg-primary/10 text-primary">{asset.portfolioName}</Badge></td>
                          <td className="py-3 font-mono">{formatNumber(qty)}</td>
                          <td className="py-3 font-mono">
                            {formatNumber(origPrice, 4)} <span className="text-[10px] text-muted-foreground mr-1">{asset.assetCurrency}</span>
                            {asset.isDiffCurrency && <div className="text-[10px] text-muted-foreground">({formatCurrency(asset.cpConv)})</div>}
                          </td>
                          <td className="py-3 font-mono">{formatCurrency(cost)}</td>
                          <td className="py-3 font-mono font-bold">{formatCurrency(val)}</td>
                          <td className="py-3 font-mono font-bold">
                            <span className={cn(pnl >= 0 ? "text-emerald-600" : "text-red-600")}>
                              {pnl > 0 ? '+' : ''}{formatCurrency(pnl)}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-bold">
                            <Badge variant="outline" className={cn("text-xs font-mono", pnlPct >= 0 ? "text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20" : "text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20")}>
                              {pnlPct > 0 ? '+' : ''}{formatPercent(pnlPct)}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {allConsolidatedAssets.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-6 text-center text-muted-foreground">لا توجد أصول لعرضها</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}