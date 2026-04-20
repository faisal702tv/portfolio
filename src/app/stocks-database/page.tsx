'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { notifyInfo, notifyError, notifySuccess } from '@/hooks/use-notifications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Database, TrendingUp, Shield, Building2, BarChart3, RefreshCw,
  ChevronLeft, ChevronRight, CheckCircle, Globe, Wallet, Search,
  Download, Check, X, AlertCircle, Star, Moon, Sparkles, ShieldCheck,
  Banknote, Percent, DollarSign, BookOpen, Eye, EyeOff, FileText,
  Loader2, ArrowUpDown, TrendingDown,
} from 'lucide-react';
import { LOCAL_SYMBOL_DB } from '@/data/symbols-database';
import type { ShariaMarketData } from '@/data/sharia-markets-database';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface SukukItem {
  symbol: string;
  name: string;
  nameEn: string;
  couponRate: number;
  maturityDate: string;
  price: number;
  yield: number;
  rating: string;
  isShariaCompliant: boolean;
  issuer: string;
  currency: string;
}

interface ShariaDatasetMeta {
  schemaVersion?: number;
  lastUpdatedAt: string;
  nextAutoUpdateAt: string;
  refreshMode: 'auto' | 'manual' | 'bootstrap';
  source: string;
  totalRows: number;
  marketCounts: Record<string, number>;
}

interface ShariaDatasetResponse {
  success: boolean;
  autoRefreshed?: boolean;
  shariaMarkets?: ShariaMarketData;
  funds?: any[];
  meta?: ShariaDatasetMeta;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// Markets Config — ALL markets including Oman & Jordan
// ═══════════════════════════════════════════════════════════════

const MKTS: Record<string, { label: string; flag: string; exch: string; curr: string; color: string }> = {
  sa: { label: 'السعودية',  flag: '🇸🇦', exch: 'تاسي',       curr: 'ر.س', color: '#16a34a' },
  ae: { label: 'الإمارات',  flag: '🇦🇪', exch: 'ADX / DFM',  curr: 'د.إ', color: '#2563eb' },
  kw: { label: 'الكويت',    flag: '🇰🇼', exch: 'KSE',        curr: 'د.ك', color: '#0891b2' },
  qa: { label: 'قطر',       flag: '🇶🇦', exch: 'QSE',        curr: 'ر.ق', color: '#7c3aed' },
  bh: { label: 'البحرين',   flag: '🇧🇭', exch: 'BHB',        curr: 'د.ب', color: '#dc2626' },
  om: { label: 'عُمان',     flag: '🇴🇲', exch: 'MSM',        curr: 'ر.ع', color: '#ea580c' },
  eg: { label: 'مصر',       flag: '🇪🇬', exch: 'EGX',        curr: 'ج.م', color: '#d97706' },
  jo: { label: 'الأردن',    flag: '🇯🇴', exch: 'ASE',        curr: 'د.أ', color: '#059669' },
  us: { label: 'أمريكا',    flag: '🇺🇸', exch: 'NYSE/NASDAQ', curr: '$',   color: '#0f766e' },
  fn: { label: 'الصناديق',  flag: '🏦',  exch: 'متعدد',      curr: 'ر.س', color: '#9333ea' },
};

// Map stocks_database.json market keys to our keys
const JSON_MKT_MAP: Record<string, string> = {
  TADAWUL: 'sa', ADX: 'ae', DFM: 'ae', QE: 'qa', KSE: 'kw',
  BHB: 'bh', EGX: 'eg', MSM: 'om', US: 'us', US_ETF: 'us_etf',
  COMMODITIES: 'commodities', CRYPTO: 'crypto', FOREX: 'forex',
};

const MKT_LABELS: Record<string, string> = {
  saudi: '🇸🇦', adx: '🇦🇪', dfm: '🇦🇪', kuwait: '🇰🇼', qatar: '🇶🇦',
  egypt: '🇪🇬', bahrain: '🇧🇭', oman: '🇴🇲', usa: '🇺🇸', crypto: '🪙', jo: '🇯🇴',
};

const PER_PAGE = 50;

const ENGLISH_GLOSSARY: Array<{ en: string; ar: string }> = [
  { en: 'Symbol', ar: 'الرمز' },
  { en: 'Market Cap (Mkt Cap)', ar: 'القيمة السوقية' },
  { en: 'P/E', ar: 'مكرر الربحية' },
  { en: 'EPS', ar: 'ربحية السهم' },
  { en: 'Debt', ar: 'إجمالي الديون' },
  { en: 'Eqt (Equity)', ar: 'حقوق الملكية' },
  { en: 'Debt/Eqt', ar: 'نسبة الدين إلى حقوق الملكية' },
  { en: 'Total Revenue', ar: 'إجمالي الإيرادات' },
  { en: 'Interest Income', ar: 'دخل الفوائد' },
  { en: 'Interest Income / Total Revenue', ar: 'نسبة دخل الفوائد إلى إجمالي الإيرادات' },
  { en: 'Last Update', ar: 'تاريخ آخر تحديث' },
  { en: 'NAV', ar: 'صافي قيمة الأصول' },
  { en: 'YTD', ar: 'منذ بداية السنة' },
  { en: 'Yield', ar: 'العائد' },
  { en: 'Coupon', ar: 'معدل الكوبون' },
  { en: 'Sharia', ar: 'الشرعية' },
  { en: 'Grade', ar: 'التقييم' },
];

const FORBIDDEN_SECTOR_KEYWORDS: string[] = [
  // Riba banks / conventional finance
  'bank', 'banks', 'banking', 'finance', 'financial services', 'lending', 'interest',
  'ربوي', 'ربوية', 'بنك', 'بنوك',
  // Conventional insurance
  'insurance', 'تأمين', 'التأمين التجاري',
  // Alcohol and intoxicants
  'alcohol', 'liquor', 'brew', 'brewery', 'beer', 'wine', 'spirits', 'distill',
  'كحول', 'خمور', 'خمر', 'مسكرات',
  // Non-medical narcotics
  'narcotic', 'drug', 'cannabis',
  'مخدر', 'مخدرات',
  // Tobacco
  'tobacco', 'cigarette', 'smoking',
  'تبغ', 'دخان', 'سجائر',
  // Gambling
  'gambling', 'casino', 'bet', 'lottery',
  'قمار', 'مقامرة', 'كازينو', 'رهان', 'يانصيب',
  // Pork and derivatives
  'pork', 'swine', 'hog',
  'خنزير', 'خنازير',
  // Non-halal slaughtered meat/poultry
  'non-halal meat', 'non halal meat', 'non-halal poultry', 'slaughterhouse',
  'لحوم غير مذبوحة', 'دواجن غير مذبوحة', 'مذابح',
  // Nightclubs / prohibited entertainment and media
  'nightclub', 'adult entertainment', 'adult media', 'porn', 'casino resort',
  'music', 'musical instrument', 'radio', 'television', 'tv', 'film', 'movie', 'magazine',
  'ملهى', 'ملاهي', 'ترفيه محرم', 'قنوات محرمة', 'افلام محرمة', 'مجلات محرمة', 'ادوات موسيقية', 'موسيقى', 'اذاعة', 'إذاعة',
];

const TERM_TRANSLATIONS: Record<string, string> = {
  // Recommendations / ratings
  buy: 'شراء',
  'strong buy': 'شراء قوي',
  hold: 'احتفاظ',
  neutral: 'محايد',
  reduce: 'تقليل مراكز',
  sell: 'بيع',
  'strong sell': 'بيع قوي',
  watch: 'مراقبة',
  compliant: 'متوافق',
  'non-compliant': 'غير متوافق',
  mixed: 'مختلط',

  // Sectors
  technology: 'تقنية',
  'information technology': 'تقنية المعلومات',
  semiconductors: 'أشباه الموصلات',
  software: 'برمجيات',
  'communication services': 'خدمات الاتصالات',
  'consumer discretionary': 'استهلاكي اختياري',
  'consumer staples': 'استهلاكي أساسي',
  healthcare: 'الرعاية الصحية',
  'health care': 'الرعاية الصحية',
  pharmaceuticals: 'الأدوية',
  biotech: 'تقنية حيوية',
  biotechnology: 'تقنية حيوية',
  financials: 'القطاع المالي',
  'financial services': 'الخدمات المالية',
  banking: 'البنوك',
  banks: 'البنوك',
  insurance: 'التأمين',
  industrials: 'الصناعة',
  utilities: 'المرافق',
  energy: 'الطاقة',
  'oil & gas': 'النفط والغاز',
  materials: 'المواد الأساسية',
  'basic materials': 'المواد الأساسية',
  'real estate': 'العقار',
  telecommunications: 'الاتصالات',
  media: 'الإعلام',
  entertainment: 'الترفيه',
  transportation: 'النقل',
  retail: 'التجزئة',
  internet: 'الإنترنت',
  'food & beverage': 'الأغذية والمشروبات',
  construction: 'الإنشاءات',
  mining: 'التعدين',
  diversified: 'متنوع',
  'holding company': 'شركة قابضة',

  // Exchanges / markets
  nasdaq: 'ناسداك',
  nyse: 'بورصة نيويورك',
  amex: 'بورصة أمريكان',
  tadawul: 'تداول',
  adx: 'سوق أبوظبي',
  dfm: 'سوق دبي',
  qse: 'بورصة قطر',
  kse: 'بورصة الكويت',
  egx: 'البورصة المصرية',
  bhb: 'بورصة البحرين',
  msm: 'بورصة مسقط',
  ase: 'بورصة عمّان',

  // Fund / bond terms
  equity: 'أسهم',
  bond: 'صكوك/سندات',
  etf: 'صندوق متداول',
  index: 'مؤشر',
  balanced: 'متوازن',
  'money market': 'سوق نقد',
  commodity: 'سلع',

  // Issuers and currencies
  'ministry of finance': 'وزارة المالية',
  usd: 'دولار أمريكي',
  sar: 'ريال سعودي',
  eur: 'يورو',
  gbp: 'جنيه إسترليني',
  aed: 'درهم إماراتي',
};

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function isHalal(sym: string, shariaDb: ShariaMarketData): boolean | null {
  const cleanSym = sym.replace(/\.(SR|AD|DU|CA|QA|BH|OM)$/i, '');
  for (const [mktKey, rows] of Object.entries(shariaDb)) {
    const hIdx = mktKey === 'fn' ? 2 : 4;
    for (const r of rows) {
      if (r[0] === cleanSym || r[0] === sym) {
        return r[hIdx] === '✅' ? true : r[hIdx] === '❌' ? false : null;
      }
    }
  }
  return null;
}

function HalalBadge({ value }: { value: string }) {
  if (value === '✅') return <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">✅</span>;
  if (value === '❌') return <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">❌</span>;
  if (value === '🟡') return <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">🟡</span>;
  return <span className="text-xs text-muted-foreground">—</span>;
}

function SectorComplianceBadge({ value }: { value: string | null | undefined }) {
  if (value === '✅') {
    return <Badge className="bg-green-500 text-white text-[10px] h-5">حلال</Badge>;
  }
  if (value === '❌') {
    return <Badge className="bg-red-500 text-white text-[10px] h-5">حرام</Badge>;
  }
  if (value === '🟡') {
    return <Badge className="bg-amber-500 text-white text-[10px] h-5">مختلط</Badge>;
  }
  return <span className="text-[10px] text-muted-foreground">—</span>;
}

function GradeBadge({ grade }: { grade: string }) {
  const c = !grade ? '' : grade === 'A+' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : grade.startsWith('A') ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : grade.startsWith('B') ? 'text-lime-600 bg-lime-50 dark:bg-lime-900/20' : grade === 'F' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-muted-foreground';
  return <span className={`px-2 py-0.5 rounded-md text-xs font-black ${c}`}>{grade || '—'}</span>;
}

function PriceCell({ value, prefix }: { value: number | null | undefined; prefix?: string }) {
  if (!value || value === 0) return <span className="text-muted-foreground text-xs">—</span>;
  return <span className="font-mono text-xs">{prefix}{value.toFixed(2)}</span>;
}

function ChangeCell({ value }: { value: number | null | undefined }) {
  if (!value || value === 0) return <span className="text-muted-foreground text-xs">—</span>;
  return <span className={`font-mono text-xs font-bold ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>{value > 0 ? '+' : ''}{value.toFixed(2)}%</span>;
}

function formatFinancialValue(value: string | null | undefined): string {
  const n = Number(String(value ?? '').replace(/,/g, '').trim());
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (abs >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return n.toFixed(4);
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-2" dir="rtl">
      <p className="text-sm text-muted-foreground" dir="rtl">صفحة {page} من {totalPages}</p>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>«</Button>
        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
          let p: number;
          if (totalPages <= 7) p = i + 1;
          else if (page <= 4) p = i + 1;
          else if (page >= totalPages - 3) p = totalPages - 6 + i;
          else p = page - 3 + i;
          if (p < 1 || p > totalPages) return null;
          return <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" onClick={() => onPageChange(p)} className="w-9">{p}</Button>;
        })}
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>»</Button>
      </div>
    </div>
  );
}

function formatGregorianDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleString('ar-SA-u-ca-gregory', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeSectorText(value: string | null | undefined): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isForbiddenSectorName(value: string | null | undefined): boolean {
  const normalized = normalizeSectorText(value);
  if (!normalized) return false;
  return FORBIDDEN_SECTOR_KEYWORDS.some((keyword) => normalized.includes(normalizeSectorText(keyword)));
}

function toArabicTerm(value: string | null | undefined): { ar: string; en?: string } {
  const raw = String(value ?? '').trim();
  if (!raw) return { ar: '—' };
  const normalized = raw.toLowerCase();
  const translated = TERM_TRANSLATIONS[normalized];
  if (!translated) return { ar: raw };
  return { ar: translated, en: raw };
}

function BilingualValue({ value, className }: { value: string | null | undefined; className?: string }) {
  const term = toArabicTerm(value);
  if (!term.en) return <span className={className}>{term.ar}</span>;
  return (
    <span className={className}>
      {term.ar}
      <span className="text-[10px] text-muted-foreground mr-1">({term.en})</span>
    </span>
  );
}

function HeadLabel({ ar, en }: { ar: string; en: string }) {
  return (
    <span className="inline-flex flex-col leading-tight">
      <span>{ar}</span>
      <span className="text-[10px] text-muted-foreground font-normal">{en}</span>
    </span>
  );
}

// Column visibility types
type ColKey =
  | 'grade'
  | 'halal'
  | 'rec'
  | 'yield'
  | 'debt'
  | 'eqt'
  | 'debtEqtRatio'
  | 'totalRevenue'
  | 'interestIncomeValue'
  | 'interestIncomeRatio'
  | 'bilad'
  | 'rajhi'
  | 'maqasid'
  | 'zero'
  | 'lastUpdated'
  | 'price'
  | 'high52'
  | 'low52'
  | 'change';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function StocksDatabasePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('sharia');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDatasetUpdating, setIsDatasetUpdating] = useState(false);
  const [isDatasetLoading, setIsDatasetLoading] = useState(true);
  const [shariaMarkets, setShariaMarkets] = useState<ShariaMarketData>({});
  const [allFundsData, setAllFundsData] = useState<any[]>([]);
  const [datasetMeta, setDatasetMeta] = useState<ShariaDatasetMeta | null>(null);

  // ─── Sharia DB state ────────────────────────────────────
  const [mktTab, setMktTab] = useState('sa');
  const [shariaSearch, setShariaSearch] = useState('');
  const [shariaFilter, setShariaFilter] = useState('all');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [shariaPage, setShariaPage] = useState(1);
  const [shariaCols, setShariaCols] = useState<Record<ColKey, boolean>>({
    grade: true, halal: true, rec: true, yield: true,
    debt: true, eqt: true, debtEqtRatio: true,
    totalRevenue: true, interestIncomeValue: true, interestIncomeRatio: true,
    bilad: true, rajhi: true, maqasid: true, zero: true, lastUpdated: true,
    price: true, high52: true, low52: true, change: true,
  });

  // ─── Symbols state ──────────────────────────────────────
  const [symSearch, setSymSearch] = useState('');
  const [symMktFilter, setSymMktFilter] = useState('all');
  const [symHalFilter, setSymHalFilter] = useState('all');
  const [symSort, setSymSort] = useState('mc');
  const [symPage, setSymPage] = useState(1);

  // ─── Funds state ────────────────────────────────────────
  const [fundSearch, setFundSearch] = useState('');
  const [fundSharia, setFundSharia] = useState('all');
  const [fundType, setFundType] = useState('all');
  const [fundMarket, setFundMarket] = useState('all');
  const [fundPage, setFundPage] = useState(1);

  // ─── Live prices state ──────────────────────────────────
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; change: number; high52: number; low52: number; volume?: number; avgVolume?: number }>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesFetched, setPricesFetched] = useState<Set<string>>(new Set());

  // ─── Sukuk state ────────────────────────────────────────
  const [sukuk, setSukuk] = useState<SukukItem[]>([]);
  const [sukukLoading, setSukukLoading] = useState(false);

  const applyDataset = useCallback((resp: ShariaDatasetResponse) => {
    if (!resp?.success || !resp.shariaMarkets) return false;
    setShariaMarkets(resp.shariaMarkets);
    setAllFundsData(Array.isArray(resp.funds) ? resp.funds : []);
    setDatasetMeta(resp.meta ?? null);
    return true;
  }, []);

  const emitUpdateNotification = useCallback((meta: ShariaDatasetMeta | null | undefined, mode: 'auto' | 'manual') => {
    if (!meta?.lastUpdatedAt) return;
    if (typeof window === 'undefined') return;

    const notifyKey = 'sharia_dataset_notified_at';
    const latest = meta.lastUpdatedAt;
    const prev = localStorage.getItem(notifyKey);

    if (mode === 'auto') {
      if (prev === latest) return;
      localStorage.setItem(notifyKey, latest);
      notifyInfo(
        'تم تحديث بيانات المعايير الشرعية تلقائياً',
        `آخر تحديث: ${formatGregorianDate(latest)} • التحديث القادم: ${formatGregorianDate(meta.nextAutoUpdateAt)}`,
        { source: 'قاعدة الأسهم والصناديق', href: '/stocks-database' }
      );
      return;
    }

    localStorage.setItem(notifyKey, latest);
    notifySuccess(
      'تم تحديث بيانات المعايير الشرعية',
      `تم تحديث قاعدة الأسهم والصناديق بنجاح (${formatGregorianDate(latest)})`,
      { source: 'قاعدة الأسهم والصناديق', href: '/stocks-database' }
    );
  }, []);

  const fetchDataset = useCallback(async (mode: 'auto' | 'manual' = 'auto') => {
    if (mode === 'manual') setIsDatasetUpdating(true);
    else setIsDatasetLoading(true);

    try {
      const isManual = mode === 'manual';
      const res = await fetch(isManual ? '/api/sharia-dataset' : '/api/sharia-dataset?auto=true', {
        method: isManual ? 'POST' : 'GET',
        headers: isManual ? { 'Content-Type': 'application/json' } : undefined,
        body: isManual ? JSON.stringify({ mode: 'manual' }) : undefined,
        cache: 'no-store',
      });
      const data = (await res.json()) as ShariaDatasetResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تحميل البيانات');
      }

      const applied = applyDataset(data);
      if (!applied) throw new Error('استجابة غير صالحة من مزود بيانات الشرعية');

      if (mode === 'manual') {
        emitUpdateNotification(data.meta ?? null, 'manual');
        toast({ title: 'تم التحديث', description: 'تم تحديث قاعدة المعايير الشرعية والصناديق.' });
      } else if (data.autoRefreshed) {
        emitUpdateNotification(data.meta ?? null, 'auto');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'تعذر تحديث البيانات';
      if (mode === 'manual') {
        toast({ title: 'فشل التحديث', description: msg, variant: 'destructive' });
        notifyError('فشل تحديث قاعدة الشرعية', msg, { source: 'قاعدة الأسهم والصناديق', href: '/stocks-database' });
      }
    } finally {
      setIsDatasetLoading(false);
      setIsDatasetUpdating(false);
    }
  }, [applyDataset, emitUpdateNotification, toast]);

  useEffect(() => {
    void fetchDataset('auto');
  }, [fetchDataset]);

  // ═══════════════════════════════════════════════════════════
  // SHARIA DB computations
  // ═══════════════════════════════════════════════════════════

  const grandTotal = useMemo(
    () => Object.values(shariaMarkets).reduce((a, v) => a + (Array.isArray(v) ? v.length : 0), 0),
    [shariaMarkets]
  );
  const grandHalal = useMemo(
    () => Object.entries(shariaMarkets).reduce((a, [k, rows]) => a + rows.filter(r => r[k === 'fn' ? 2 : 4] === '✅').length, 0),
    [shariaMarkets]
  );

  const marketStats = useMemo(() => {
    return Object.entries(MKTS).filter(([k]) => shariaMarkets[k]).map(([k, m]) => {
      const data = shariaMarkets[k] || [];
      const isFn = k === 'fn';
      const hIdx = isFn ? 2 : 4;
      return {
        key: k, ...m, total: data.length,
        halal: data.filter(r => r[hIdx] === '✅').length,
        bilad: isFn ? 0 : data.filter(r => r[8] === '✅').length,
        rajhi: isFn ? 0 : data.filter(r => r[9] === '✅').length,
        maqasid: isFn ? 0 : data.filter(r => r[10] === '✅').length,
        zero: isFn ? 0 : data.filter(r => r[11] === '✅').length,
        isFn,
      };
    });
  }, [shariaMarkets]);

  const sectors = useMemo(() => {
    if (mktTab === 'fn') return [];
    const data = shariaMarkets[mktTab] || [];
    return Array.from(new Set(data.map(r => r[6]).filter(Boolean))).sort();
  }, [mktTab, shariaMarkets]);

  const sectorStatusMap = useMemo(() => {
    if (mktTab === 'fn') return {} as Record<string, '✅' | '❌' | '🟡'>;
    const rows = shariaMarkets[mktTab] || [];
    const stats = new Map<string, { halal: number; haram: number; mixed: number; forcedHaram: boolean }>();

    for (const row of rows) {
      const sector = String(row?.[6] ?? '').trim();
      if (!sector) continue;

      const entry = stats.get(sector) ?? { halal: 0, haram: 0, mixed: 0, forcedHaram: false };
      if (isForbiddenSectorName(sector)) {
        entry.forcedHaram = true;
        stats.set(sector, entry);
        continue;
      }

      if (row?.[4] === '✅') entry.halal += 1;
      else if (row?.[4] === '❌') entry.haram += 1;
      else entry.mixed += 1;
      stats.set(sector, entry);
    }

    const result: Record<string, '✅' | '❌' | '🟡'> = {};
    for (const [sector, counts] of stats.entries()) {
      if (counts.forcedHaram) {
        result[sector] = '❌';
      } else if (counts.halal > 0 && counts.haram === 0 && counts.mixed === 0) {
        result[sector] = '✅';
      } else if (counts.haram > 0 && counts.halal === 0 && counts.mixed === 0) {
        result[sector] = '❌';
      } else {
        result[sector] = '🟡';
      }
    }
    return result;
  }, [mktTab, shariaMarkets]);

  const filteredSharia = useMemo(() => {
    const data = shariaMarkets[mktTab] || [];
    const isFn = mktTab === 'fn';
    const q = shariaSearch.toLowerCase();
    return data.filter(r => {
      if (q && !String(r[0]).toLowerCase().includes(q) && !String(r[1]).toLowerCase().includes(q)) return false;
      if (!isFn && sectorFilter !== 'all' && r[6] !== sectorFilter) return false;
      const h = isFn ? r[2] : r[4];
      if (shariaFilter === 'halal' && h !== '✅') return false;
      if (shariaFilter === 'haram' && h !== '❌') return false;
      if (!isFn) {
        if (shariaFilter === 'bilad' && r[8] !== '✅') return false;
        if (shariaFilter === 'rajhi' && r[9] !== '✅') return false;
        if (shariaFilter === 'maqasid' && r[10] !== '✅') return false;
        if (shariaFilter === 'zero' && r[11] !== '✅') return false;
      }
      return true;
    });
  }, [mktTab, shariaSearch, shariaFilter, sectorFilter, shariaMarkets]);

  const shariaTotalPages = Math.max(1, Math.ceil(filteredSharia.length / PER_PAGE));
  const shariaPageData = filteredSharia.slice((shariaPage - 1) * PER_PAGE, shariaPage * PER_PAGE);
  useEffect(() => { setShariaPage(1); }, [mktTab, shariaSearch, shariaFilter, sectorFilter]);

  // Column toggle
  const toggleCol = (col: ColKey) => setShariaCols(prev => ({ ...prev, [col]: !prev[col] }));

  // ═══════════════════════════════════════════════════════════
  // SYMBOLS computations (15,137 symbols)
  // ═══════════════════════════════════════════════════════════

  const allSymbols = useMemo(() => Object.entries(LOCAL_SYMBOL_DB), []);
  const isHalalSymbol = useCallback((sym: string) => isHalal(sym, shariaMarkets), [shariaMarkets]);

  const filteredSymbols = useMemo(() => {
    const q = symSearch.toLowerCase();
    return allSymbols.filter(([sym, info]) => {
      if (q && !sym.toLowerCase().includes(q) && !(info.n || '').toLowerCase().includes(q)) return false;
      if (symMktFilter !== 'all' && info.mkt !== symMktFilter) return false;
      if (symHalFilter !== 'all') {
        const h = isHalalSymbol(sym);
        if (symHalFilter === 'halal' && h !== true) return false;
        if (symHalFilter === 'haram' && h !== false) return false;
      }
      return true;
    });
  }, [allSymbols, symSearch, symMktFilter, symHalFilter, isHalalSymbol]);

  const sortedSymbols = useMemo(() =>
    [...filteredSymbols].sort((a, b) => symSort === 'mc' ? (b[1].mc || 0) - (a[1].mc || 0) : (b[1].div || 0) - (a[1].div || 0)),
  [filteredSymbols, symSort]);

  const symTotalPages = Math.max(1, Math.ceil(sortedSymbols.length / PER_PAGE));
  const symPageData = sortedSymbols.slice((symPage - 1) * PER_PAGE, symPage * PER_PAGE);
  useEffect(() => { setSymPage(1); }, [symSearch, symMktFilter, symHalFilter, symSort]);

  const symMktCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let halalCount = 0;
    filteredSymbols.forEach(([sym, info]) => {
      counts[info.mkt] = (counts[info.mkt] || 0) + 1;
      if (isHalalSymbol(sym) === true) halalCount++;
    });
    return { counts, halalCount, total: filteredSymbols.length };
  }, [filteredSymbols, isHalalSymbol]);

  // ═══════════════════════════════════════════════════════════
  // FUNDS computations (100 funds from JSON)
  // ═══════════════════════════════════════════════════════════

  const allFunds = useMemo(() => allFundsData as any[], [allFundsData]);

  const filteredFunds = useMemo(() => {
    const q = fundSearch.toLowerCase();
    return allFunds.filter(f => {
      if (q && !f.name?.toLowerCase().includes(q) && !f.nameEn?.toLowerCase().includes(q) && !f.manager?.toLowerCase().includes(q) && !f.symbol?.toLowerCase().includes(q)) return false;
      if (fundSharia === 'yes' && !f.shariaCompliant) return false;
      if (fundSharia === 'no' && f.shariaCompliant) return false;
      if (fundType !== 'all' && f.type !== fundType) return false;
      if (fundMarket !== 'all' && f.market !== fundMarket) return false;
      return true;
    });
  }, [allFunds, fundSearch, fundSharia, fundType, fundMarket]);

  const fundTotalPages = Math.max(1, Math.ceil(filteredFunds.length / PER_PAGE));
  const fundPageData = filteredFunds.slice((fundPage - 1) * PER_PAGE, fundPage * PER_PAGE);
  useEffect(() => { setFundPage(1); }, [fundSearch, fundSharia, fundType, fundMarket]);

  const fundTypes = useMemo(() => Array.from(new Set(allFunds.map(f => f.type))), [allFunds]);
  const fundMarkets = useMemo(() => Array.from(new Set(allFunds.map(f => f.market))), [allFunds]);
  const fundTypeLabel: Record<string, string> = { equity: 'أسهم', bond: 'صكوك', mixed: 'مختلط', money_market: 'نقد', real_estate: 'عقاري', commodity: 'سلع', reit: 'ريت', etf: 'صندوق متداول (ETF)', index: 'مؤشر', balanced: 'متوازن' };
  const fundMktLabel: Record<string, string> = { SA: '🇸🇦 السعودية', UAE: '🇦🇪 الإمارات', KW: '🇰🇼 الكويت', QA: '🇶🇦 قطر', BH: '🇧🇭 البحرين', OM: '🇴🇲 عُمان', EG: '🇪🇬 مصر', US: '🇺🇸 أمريكا', JO: '🇯🇴 الأردن', GCC: '🌍 خليجي', INTL: '🌐 دولي' };

  // ═══════════════════════════════════════════════════════════
  // SUKUK fetch
  // ═══════════════════════════════════════════════════════════

  const fetchSukuk = useCallback(async () => {
    setSukukLoading(true);
    try {
      const res = await fetch('/api/funds?type=sukuk');
      const data = await res.json();
      const items: SukukItem[] = [];
      if (data.sukuk?.government) items.push(...data.sukuk.government);
      if (data.sukuk?.corporate) items.push(...data.sukuk.corporate);
      setSukuk(items);
    } catch { setSukuk([]); }
    setSukukLoading(false);
  }, []);

  useEffect(() => { if (activeTab === 'sukuk' && sukuk.length === 0) fetchSukuk(); }, [activeTab, sukuk.length, fetchSukuk]);

  // ─── Live price fetching ───────────────────────────────
  const fetchLivePrices = useCallback(async (symbols: string[]) => {
    const newSymbols = symbols.filter(s => !pricesFetched.has(s));
    if (newSymbols.length === 0) return;
    setPricesLoading(true);
    try {
      // Batch in chunks of 20
      const chunks: string[][] = [];
      for (let i = 0; i < newSymbols.length; i += 20) {
        chunks.push(newSymbols.slice(i, i + 20));
      }
      for (const chunk of chunks) {
        const res = await fetch(`/api/prices?symbols=${chunk.join(',')}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.prices) {
          const newPrices: typeof livePrices = {};
          for (const [sym, info] of Object.entries(data.prices) as [string, any][]) {
            newPrices[sym] = {
              price: info.price ?? info.currentPrice ?? 0,
              change: info.changePercent ?? info.change_percent ?? 0,
              high52: info.high52 ?? info.fiftyTwoWeekHigh ?? 0,
              low52: info.low52 ?? info.fiftyTwoWeekLow ?? 0,
              volume: info.volume ?? 0,
              avgVolume: info.avgVolume ?? 0,
            };
          }
          setLivePrices(prev => ({ ...prev, ...newPrices }));
          setPricesFetched(prev => { const n = new Set(prev); chunk.forEach(s => n.add(s)); return n; });
        }
      }
    } catch { /* silent */ }
    setPricesLoading(false);
  }, [pricesFetched]);

  // Auto-fetch prices when sharia page data changes
  useEffect(() => {
    if (activeTab === 'sharia' && shariaPageData.length > 0) {
      const symbols = shariaPageData.map(r => String(r[0])).filter(Boolean);
      if (symbols.length > 0) fetchLivePrices(symbols);
    }
  }, [activeTab, shariaPage, mktTab, shariaPageData.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fetch prices for symbols tab
  useEffect(() => {
    if (activeTab === 'symbols' && symPageData.length > 0) {
      const symbols = symPageData.map(([sym]) => sym).filter(Boolean);
      if (symbols.length > 0) fetchLivePrices(symbols);
    }
  }, [activeTab, symPage, symMktFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === 'sukuk') await fetchSukuk();
    await fetchDataset('manual');
    setIsRefreshing(false);
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  const isFn = mktTab === 'fn';
  const ms = marketStats.find(m => m.key === mktTab);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar
          title="قاعدة بيانات الأسهم والصناديق"
          subtitle={`${grandTotal.toLocaleString()} سهم وصندوق · ${allSymbols.length.toLocaleString()} رمز · ${allFunds.length.toLocaleString()} صندوق`}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <main className="p-4 md:p-6 space-y-5">
          {/* ─── Hero ─────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-emerald-900 via-teal-800 to-emerald-950 p-6 md:p-8">
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <Moon className="h-10 w-10 text-amber-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  قاعدة بيانات الأسهم والصناديق المركزية
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                </h1>
                <p className="text-white/70 mt-1 text-sm">جميع الأسواق · ٤ معايير شرعية · البلاد · الراجحي · المقاصد · صفر ديون
                  <a href="/us-market" className="inline-flex items-center gap-1 mr-2 text-amber-300 hover:text-amber-200 underline">🇺🇸 السوق الأمريكي</a>
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge className="bg-white/15 text-white border-white/25">
                    آخر تحديث: {formatGregorianDate(datasetMeta?.lastUpdatedAt)}
                  </Badge>
                  <Badge className="bg-white/10 text-white/90 border-white/20">
                    التحديث القادم: {formatGregorianDate(datasetMeta?.nextAutoUpdateAt)}
                  </Badge>
                  <Badge className="bg-white/10 text-white/90 border-white/20">
                    المصدر: {datasetMeta?.source || '—'}
                  </Badge>
                  <Button
                    size="sm"
                    className="h-8 bg-white text-emerald-900 hover:bg-emerald-50 font-bold"
                    disabled={isDatasetUpdating || isDatasetLoading}
                    onClick={() => void fetchDataset('manual')}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ml-1 ${isDatasetUpdating ? 'animate-spin' : ''}`} />
                    تحديث يدوي لبيانات المعايير
                  </Button>
                </div>
              </div>
              <div className="flex gap-4 flex-wrap" dir="rtl">
                <div className="text-center"><p className="text-2xl font-black text-white">{grandTotal.toLocaleString()}</p><p className="text-[10px] text-white/60">سهم وصندوق</p></div>
                <div className="w-px bg-white/20" />
                <div className="text-center"><p className="text-2xl font-black text-emerald-300">{grandHalal.toLocaleString()}</p><p className="text-[10px] text-white/60">حلال</p></div>
                <div className="w-px bg-white/20" />
                <div className="text-center"><p className="text-2xl font-black text-amber-300">{allSymbols.length.toLocaleString()}</p><p className="text-[10px] text-white/60">رمز</p></div>
                <div className="w-px bg-white/20" />
                <div className="text-center"><p className="text-2xl font-black text-blue-300">{allFunds.length.toLocaleString()}</p><p className="text-[10px] text-white/60">صندوق</p></div>
              </div>
            </div>
          </div>

          {isDatasetLoading && (
            <Card className="border-2 border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20">
              <CardContent className="p-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                <RefreshCw className="h-4 w-4 animate-spin" />
                جاري مزامنة بيانات المعايير الشرعية من المصدر المركزي...
              </CardContent>
            </Card>
          )}

          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                دليل المصطلحات الإنجليزية
              </CardTitle>
              <CardDescription className="text-xs">
                لتسهيل القراءة، ستجد ترجمة عربية للمصطلحات المالية الإنجليزية الأكثر استخداماً داخل الجداول.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1.5">
                {ENGLISH_GLOSSARY.map((item) => (
                  <Badge key={item.en} variant="outline" className="text-[10px] font-normal">
                    {item.ar}
                    <span className="mx-1 text-muted-foreground">|</span>
                    {item.en}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Main Tabs ────────────────────────────────── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="grid w-full grid-cols-4 h-12" dir="rtl">
              <TabsTrigger value="sharia" className="gap-1 text-xs md:text-sm data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                <Shield className="h-4 w-4" />قاعدة الشرعية ({grandTotal.toLocaleString()})
              </TabsTrigger>
              <TabsTrigger value="symbols" className="gap-1 text-xs md:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <BookOpen className="h-4 w-4" />دليل الرموز ({allSymbols.length.toLocaleString()})
              </TabsTrigger>
              <TabsTrigger value="funds" className="gap-1 text-xs md:text-sm data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Wallet className="h-4 w-4" />الصناديق ({allFunds.length.toLocaleString()})
              </TabsTrigger>
              <TabsTrigger value="sukuk" className="gap-1 text-xs md:text-sm data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                <FileText className="h-4 w-4" />الصكوك والسندات
              </TabsTrigger>
            </TabsList>

            {/* ═══════════════════════════════════════════════ */}
            {/* TAB 1: SHARIA DATABASE */}
            {/* ═══════════════════════════════════════════════ */}
            <TabsContent value="sharia" className="space-y-4 mt-5">
              {/* Market cards */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-11 gap-2" dir="rtl">
                {marketStats.map(m => {
                  const pct = m.total > 0 ? Math.round(m.halal / m.total * 100) : 0;
                  return (
                    <div key={m.key} onClick={() => { setMktTab(m.key); setShariaFilter('all'); setSectorFilter('all'); setShariaSearch(''); }}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all border-2 text-center ${mktTab === m.key ? 'shadow-lg' : 'border-transparent bg-card hover:border-muted-foreground/20'}`}
                      style={mktTab === m.key ? { borderColor: m.color, background: `${m.color}08` } : {}}>
                      <span className="text-xl">{m.flag}</span>
                      <p className="text-[10px] font-bold mt-0.5">{m.label}</p>
                      <p className="text-lg font-black" style={{ color: m.color }}>{m.total.toLocaleString()}</p>
                      <div className="h-1 rounded-full bg-muted mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: m.color }} />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">✅ {m.halal} ({pct}%)</p>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-2 flex-wrap items-center text-[10px] text-muted-foreground p-2 rounded-lg bg-muted/50 border">
                <strong className="text-foreground text-xs">المعايير:</strong>
                <Badge variant="outline" className="text-[10px] h-5">🏦 البلاد &lt;30%</Badge>
                <Badge variant="outline" className="text-[10px] h-5">🏦 الراجحي &lt;25%</Badge>
                <Badge variant="outline" className="text-[10px] h-5">📐 المقاصد نقية/مختلطة</Badge>
                <Badge variant="outline" className="text-[10px] h-5">⚖️ صفر ديون</Badge>
                <span>✅ حلال · 🟡 مختلط · ❌ محرم</span>
              </div>

              {/* Market header + filters */}
              {ms && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{ms.flag}</span>
                        <div>
                          <CardTitle className="text-lg">{ms.label} — {ms.exch}</CardTitle>
                          <p className="text-xs text-muted-foreground">{ms.total.toLocaleString()} {isFn ? 'صندوق' : 'سهم'}</p>
                        </div>
                      </div>
                      {!isFn && (
                        <div className="flex gap-2 flex-wrap text-center">
                          <div className="px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20"><p className="text-[10px] text-green-600">البلاد</p><p className="text-sm font-black text-green-700">{ms.bilad}</p></div>
                          <div className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20"><p className="text-[10px] text-blue-600">الراجحي</p><p className="text-sm font-black text-blue-700">{ms.rajhi}</p></div>
                          <div className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20"><p className="text-[10px] text-amber-600">المقاصد</p><p className="text-sm font-black text-amber-700">{ms.maqasid}</p></div>
                          <div className="px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20"><p className="text-[10px] text-purple-600">صفر ديون</p><p className="text-sm font-black text-purple-700">{ms.zero}</p></div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Search + filters */}
                    <div className="flex flex-wrap gap-2">
                      <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث بالرمز أو الاسم..." value={shariaSearch} onChange={e => setShariaSearch(e.target.value)} className="pr-10 h-9 text-sm" />
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {[
                          { k: 'all', l: 'الكل' }, { k: 'halal', l: '✅ حلال' }, { k: 'haram', l: '❌ محرم' },
                          ...(!isFn ? [{ k: 'bilad', l: 'البلاد' }, { k: 'rajhi', l: 'الراجحي' }, { k: 'maqasid', l: 'المقاصد' }, { k: 'zero', l: 'صفر ديون' }] : []),
                        ].map(f => (
                          <Button key={f.k} variant={shariaFilter === f.k ? 'default' : 'outline'} size="sm" className="text-[11px] h-9"
                            onClick={() => { setShariaFilter(f.k); setShariaPage(1); }}
                            style={shariaFilter === f.k ? { backgroundColor: ms.color } : {}}>
                            {f.l}
                          </Button>
                        ))}
                      </div>
                      {!isFn && sectors.length > 0 && (
                        <Select value={sectorFilter} onValueChange={v => { setSectorFilter(v); setShariaPage(1); }}>
                          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="القطاع" /></SelectTrigger>
                          <SelectContent><SelectItem value="all">جميع القطاعات</SelectItem>{sectors.map(s => <SelectItem key={s} value={s}>{toArabicTerm(s).ar}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Column toggles */}
                    <div className="flex gap-1 flex-wrap items-center">
                      <span className="text-[10px] text-muted-foreground ml-1">الأعمدة:</span>
                      {([
                        ['price', 'السعر'], ['change', 'التغير%'], ['high52', 'أعلى 52 أسبوع'], ['low52', 'أدنى 52 أسبوع'],
                        ['grade', 'التقييم'], ['halal', 'الحكم'], ['rec', 'التوصية'], ['yield', 'العائد'],
                        ['debt', 'Debt'], ['eqt', 'Eqt'], ['debtEqtRatio', 'Debt/Eqt'],
                        ['totalRevenue', 'Total Revenue'], ['interestIncomeValue', 'Interest Income'],
                        ['interestIncomeRatio', 'Interest/Revenue'],
                        ['lastUpdated', 'آخر تحديث'],
                        ...(!isFn ? [['bilad', 'البلاد'], ['rajhi', 'الراجحي'], ['maqasid', 'المقاصد'], ['zero', 'صفر ديون']] : []),
                      ] as [ColKey, string][]).map(([k, l]) => (
                        <Button key={k} variant={shariaCols[k] ? 'default' : 'ghost'} size="sm" className="text-[10px] h-6 px-2" onClick={() => toggleCol(k)}>
                          {shariaCols[k] ? <Eye className="h-3 w-3 ml-0.5" /> : <EyeOff className="h-3 w-3 ml-0.5" />}{l}
                        </Button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{filteredSharia.length.toLocaleString()} نتيجة</p>
                        {pricesLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1 h-8 text-xs" onClick={() => {
                          const syms = shariaPageData.map(r => String(r[0])).filter(Boolean);
                          if (syms.length > 0) { setPricesFetched(new Set()); fetchLivePrices(syms); }
                        }}>
                          <TrendingUp className="h-3 w-3" />تحديث الأسعار
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 h-8 text-xs"><Download className="h-3 w-3" />تصدير</Button>
                      </div>
                    </div>

                    {!isFn && (
                      <div className="rounded-lg border border-red-500/20 bg-red-50/60 dark:bg-red-950/20 px-3 py-2 text-[11px] text-red-700 dark:text-red-300">
                        تصنيف حكم القطاع يطبق قائمة القطاعات المحرمة شرعاً: البنوك الربوية، التأمين التجاري، الخمور، المخدرات غير الطبية، التبغ، المقامرة، لحم الخنزير ومشتقاته، اللحوم/الدواجن غير المذبوحة شرعياً، الملاهي والإعلام/الترفيه المحرم، الأدوات الموسيقية والإذاعات.
                      </div>
                    )}

                    {/* Table */}
                    <div className="rounded-xl border overflow-x-auto" dir="rtl">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-bold text-center w-8">#</TableHead>
                            <TableHead className="font-bold text-center"><HeadLabel ar="الرمز" en="Symbol" /></TableHead>
                            <TableHead className="font-bold text-center"><HeadLabel ar="الاسم" en="Name" /></TableHead>
                            {shariaCols.price && <TableHead className="font-bold text-center"><HeadLabel ar="السعر" en="Price" /></TableHead>}
                            {shariaCols.change && <TableHead className="font-bold text-center"><HeadLabel ar="التغير%" en="Change%" /></TableHead>}
                            {shariaCols.high52 && <TableHead className="font-bold text-center"><HeadLabel ar="أعلى 52w" en="52w High" /></TableHead>}
                            {shariaCols.low52 && <TableHead className="font-bold text-center"><HeadLabel ar="أدنى 52w" en="52w Low" /></TableHead>}
                            {!isFn && <TableHead className="font-bold text-center"><HeadLabel ar="القطاع" en="Sector" /></TableHead>}
                            {!isFn && <TableHead className="font-bold text-center"><HeadLabel ar="حكم القطاع" en="Sector Status" /></TableHead>}
                            {shariaCols.grade && <TableHead className="font-bold text-center"><HeadLabel ar="التقييم" en="Grade" /></TableHead>}
                            {shariaCols.halal && <TableHead className="font-bold text-center"><HeadLabel ar="الحالة" en="Status" /></TableHead>}
                            {shariaCols.rec && <TableHead className="font-bold text-center"><HeadLabel ar="التوصية" en="Rec." /></TableHead>}
                            {shariaCols.yield && <TableHead className="font-bold text-center"><HeadLabel ar="العائد" en="Yield" /></TableHead>}
                            {shariaCols.debt && <TableHead className="font-bold text-center"><HeadLabel ar="الدين" en="Debt" /></TableHead>}
                            {shariaCols.eqt && <TableHead className="font-bold text-center"><HeadLabel ar="الملكية" en="Eqt" /></TableHead>}
                            {shariaCols.debtEqtRatio && <TableHead className="font-bold text-center"><HeadLabel ar="الدين/الملكية" en="Debt/Eqt" /></TableHead>}
                            {shariaCols.totalRevenue && <TableHead className="font-bold text-center"><HeadLabel ar="إجمالي الإيرادات" en="Total Revenue" /></TableHead>}
                            {shariaCols.interestIncomeValue && <TableHead className="font-bold text-center"><HeadLabel ar="دخل الفوائد" en="Interest Income" /></TableHead>}
                            {shariaCols.interestIncomeRatio && <TableHead className="font-bold text-center"><HeadLabel ar="نسبة دخل الفوائد" en="Interest/Revenue" /></TableHead>}
                            {!isFn && shariaCols.bilad && <TableHead className="font-bold text-center"><HeadLabel ar="معيار البلاد" en="Bilad" /></TableHead>}
                            {!isFn && shariaCols.rajhi && <TableHead className="font-bold text-center"><HeadLabel ar="معيار الراجحي" en="Rajhi" /></TableHead>}
                            {!isFn && shariaCols.maqasid && <TableHead className="font-bold text-center"><HeadLabel ar="معيار المقاصد" en="Maqasid" /></TableHead>}
                            {!isFn && shariaCols.zero && <TableHead className="font-bold text-center"><HeadLabel ar="صفر ديون" en="Zero" /></TableHead>}
                            {shariaCols.lastUpdated && <TableHead className="font-bold text-center"><HeadLabel ar="آخر تحديث" en="Last Update" /></TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shariaPageData.map((r, idx) => (
                            <TableRow key={`${r[0]}-${idx}`} className="hover:bg-muted/50">
                              <TableCell className="text-center text-[10px] text-muted-foreground">{(shariaPage - 1) * PER_PAGE + idx + 1}</TableCell>
                              <TableCell className="font-bold font-mono text-sm text-left">{r[0]}</TableCell>
                              <TableCell className="text-left"><p className="text-sm font-medium">{r[1]}</p><p className="text-[10px] text-muted-foreground">{r[2]}</p></TableCell>
                              {shariaCols.price && <TableCell className="text-center font-mono text-xs font-medium">{livePrices[r[0]]?.price ? livePrices[r[0]].price.toFixed(2) : <span className="text-muted-foreground">—</span>}</TableCell>}
                              {shariaCols.change && <TableCell className="text-center"><ChangeCell value={livePrices[r[0]]?.change} /></TableCell>}
                              {shariaCols.high52 && <TableCell className="text-center font-mono text-xs">{livePrices[r[0]]?.high52 ? livePrices[r[0]].high52.toFixed(2) : <span className="text-muted-foreground">—</span>}</TableCell>}
                              {shariaCols.low52 && <TableCell className="text-center font-mono text-xs">{livePrices[r[0]]?.low52 ? livePrices[r[0]].low52.toFixed(2) : <span className="text-muted-foreground">—</span>}</TableCell>}
                              {!isFn && <TableCell className="text-left text-xs"><BilingualValue value={r[6]} /></TableCell>}
                              {!isFn && <TableCell className="text-center"><SectorComplianceBadge value={sectorStatusMap[String(r[6] || '')]} /></TableCell>}
                              {shariaCols.grade && <TableCell className="text-center"><GradeBadge grade={r[3]} /></TableCell>}
                              {shariaCols.halal && <TableCell className="text-center"><HalalBadge value={isFn ? r[2] : r[4]} /></TableCell>}
                              {shariaCols.rec && <TableCell className="text-left text-xs"><BilingualValue value={r[5]} /></TableCell>}
                              {shariaCols.yield && (
                                <TableCell className="text-center text-xs">
                                  {String(r[7] || '').trim() || (mktTab === 'om' ? 'غير متاح' : '—')}
                                </TableCell>
                              )}
                              {shariaCols.debt && (
                                <TableCell className="text-center text-xs font-mono">
                                  {formatFinancialValue(String((isFn ? r[9] : r[12]) ?? ''))}
                                </TableCell>
                              )}
                              {shariaCols.eqt && (
                                <TableCell className="text-center text-xs font-mono">
                                  {formatFinancialValue(String((isFn ? r[10] : r[13]) ?? ''))}
                                </TableCell>
                              )}
                              {shariaCols.debtEqtRatio && (
                                <TableCell className="text-center text-xs font-mono">
                                  {String((isFn ? r[11] : r[14]) ?? '').trim() || '—'}
                                </TableCell>
                              )}
                              {shariaCols.totalRevenue && (
                                <TableCell className="text-center text-xs font-mono">
                                  {formatFinancialValue(String((isFn ? r[12] : r[15]) ?? ''))}
                                </TableCell>
                              )}
                              {shariaCols.interestIncomeValue && (
                                <TableCell className="text-center text-xs font-mono">
                                  {formatFinancialValue(String((isFn ? r[13] : r[16]) ?? ''))}
                                </TableCell>
                              )}
                              {shariaCols.interestIncomeRatio && (
                                <TableCell className="text-center text-xs font-mono">
                                  {String((isFn ? r[14] : r[17]) ?? '').trim() || '—'}
                                </TableCell>
                              )}
                              {!isFn && shariaCols.bilad && <TableCell className="text-center"><HalalBadge value={r[8]} /></TableCell>}
                              {!isFn && shariaCols.rajhi && <TableCell className="text-center"><HalalBadge value={r[9]} /></TableCell>}
                              {!isFn && shariaCols.maqasid && <TableCell className="text-center"><HalalBadge value={r[10]} /></TableCell>}
                              {!isFn && shariaCols.zero && <TableCell className="text-center"><HalalBadge value={r[11]} /></TableCell>}
                              {shariaCols.lastUpdated && (
                                <TableCell className="text-center text-xs font-mono">
                                  {String((isFn ? r[15] : r[18]) ?? '').trim() || '—'}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                          {shariaPageData.length === 0 && <TableRow><TableCell colSpan={27} className="text-center py-10 text-muted-foreground">لا توجد نتائج</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </div>
                    <Pagination page={shariaPage} totalPages={shariaTotalPages} onPageChange={setShariaPage} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ═══════════════════════════════════════════════ */}
            {/* TAB 2: SYMBOLS (15,137) */}
            {/* ═══════════════════════════════════════════════ */}
            <TabsContent value="symbols" className="space-y-4 mt-5">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                <Card className="border-2 border-primary/20"><CardContent className="p-3 text-center"><Database className="h-6 w-6 mx-auto mb-1 text-primary" /><p className="text-xl font-bold">{symMktCounts.total.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">رموز</p></CardContent></Card>
                <Card className="border-2 border-green-500/20 bg-green-500/5"><CardContent className="p-3 text-center"><Shield className="h-6 w-6 mx-auto mb-1 text-green-600" /><p className="text-xl font-bold text-green-600">{symMktCounts.halalCount.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">حلال</p></CardContent></Card>
                <Card className="border-2"><CardContent className="p-3 text-center"><Globe className="h-6 w-6 mx-auto mb-1 text-blue-600" /><p className="text-xl font-bold text-blue-600">{Object.keys(symMktCounts.counts).length}</p><p className="text-[10px] text-muted-foreground">أسواق</p></CardContent></Card>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(symMktCounts.counts).sort((a, b) => b[1] - a[1]).map(([mkt, cnt]) => (
                  <Button key={mkt} variant={symMktFilter === mkt ? 'default' : 'outline'} size="sm" className="text-[10px] h-7"
                    onClick={() => setSymMktFilter(symMktFilter === mkt ? 'all' : mkt)}>
                    {MKT_LABELS[mkt] || ''} {mkt} ({cnt.toLocaleString()})
                  </Button>
                ))}
              </div>

              <Card><CardContent className="p-3"><div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px]"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="بحث..." value={symSearch} onChange={e => setSymSearch(e.target.value)} className="pr-10 h-9" /></div>
                <Select value={symHalFilter} onValueChange={setSymHalFilter}><SelectTrigger className="w-32 h-9"><SelectValue placeholder="الشرعية" /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="halal">✅ حلال</SelectItem><SelectItem value="haram">❌ حرام</SelectItem></SelectContent></Select>
                <Select value={symSort} onValueChange={setSymSort}><SelectTrigger className="w-40 h-9"><SelectValue placeholder="ترتيب" /></SelectTrigger><SelectContent><SelectItem value="mc">القيمة السوقية</SelectItem><SelectItem value="div">التوزيعات</SelectItem></SelectContent></Select>
              </div></CardContent></Card>

              <Card className="border-2">
                <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />دليل الرموز ({filteredSymbols.length.toLocaleString()})</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-xl border overflow-x-auto" dir="rtl">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50">
                        <TableHead className="font-bold text-center w-8">#</TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="الرمز" en="Symbol" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="الاسم" en="Name" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="السعر" en="Price" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="التغير%" en="Change%" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="أعلى 52w" en="52w High" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="أدنى 52w" en="52w Low" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="السوق" en="Market" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="القطاع" en="Sector" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="الشرعية" en="Sharia" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="القيمة السوقية" en="Mkt Cap" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="مكرر الربحية" en="P/E" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="التوزيع" en="Div%" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="ربحية السهم" en="EPS" /></TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {symPageData.map(([sym, info], idx) => {
                          const h = isHalalSymbol(sym);
                          return (
                            <TableRow key={sym} className="hover:bg-muted/50">
                              <TableCell className="text-center text-[10px] text-muted-foreground">{(symPage - 1) * PER_PAGE + idx + 1}</TableCell>
                              <TableCell className="font-bold font-mono text-sm text-left">{sym}</TableCell>
                              <TableCell className="text-sm text-left">{info.n}</TableCell>
                              <TableCell className="text-center font-mono text-xs font-medium">{livePrices[sym]?.price ? livePrices[sym].price.toFixed(2) : <span className="text-muted-foreground">—</span>}</TableCell>
                              <TableCell className="text-center"><ChangeCell value={livePrices[sym]?.change} /></TableCell>
                              <TableCell className="text-center font-mono text-xs">{livePrices[sym]?.high52 ? livePrices[sym].high52.toFixed(2) : <span className="text-muted-foreground">—</span>}</TableCell>
                              <TableCell className="text-center font-mono text-xs">{livePrices[sym]?.low52 ? livePrices[sym].low52.toFixed(2) : <span className="text-muted-foreground">—</span>}</TableCell>
                              <TableCell className="text-left"><Badge variant="outline" className="text-[10px]">{MKT_LABELS[info.mkt] || ''} {info.mkt}</Badge></TableCell>
                              <TableCell className="text-left text-xs"><BilingualValue value={info.s} /></TableCell>
                              <TableCell className="text-center">{h === true ? <HalalBadge value="✅" /> : h === false ? <HalalBadge value="❌" /> : <span className="text-[10px] text-muted-foreground">—</span>}</TableCell>
                              <TableCell className="text-right font-mono text-xs">{info.mc ? (info.mc >= 1000 ? `${(info.mc / 1000).toFixed(1)}T` : `${info.mc.toFixed(1)}B`) : '—'}</TableCell>
                              <TableCell className="text-right text-xs">{info.pe?.toFixed(1) || '—'}</TableCell>
                              <TableCell className="text-right">{info.div ? <span className="text-green-600 text-xs font-medium">{info.div.toFixed(1)}%</span> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                              <TableCell className="text-right text-xs">{info.eps?.toFixed(2) || '—'}</TableCell>
                            </TableRow>
                          );
                        })}
                        {symPageData.length === 0 && <TableRow><TableCell colSpan={14} className="text-center py-10 text-muted-foreground">لا توجد نتائج</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination page={symPage} totalPages={symTotalPages} onPageChange={setSymPage} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════════════════════════════════════ */}
            {/* TAB 3: FUNDS (100 funds all markets) */}
            {/* ═══════════════════════════════════════════════ */}
            <TabsContent value="funds" className="space-y-4 mt-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-2"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">إجمالي الصناديق</p><p className="text-2xl font-bold">{allFunds.length}</p></div><Building2 className="h-8 w-8 text-muted-foreground/40" /></CardContent></Card>
                <Card className="border-2 border-green-500/20 bg-green-500/5"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">شرعية</p><p className="text-2xl font-bold text-green-600">{allFunds.filter(f => f.shariaCompliant).length}</p></div><ShieldCheck className="h-8 w-8 text-green-500/40" /></CardContent></Card>
                <Card className="border-2 border-blue-500/20 bg-blue-500/5"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">أسواق</p><p className="text-2xl font-bold text-blue-600">{fundMarkets.length}</p></div><Globe className="h-8 w-8 text-blue-500/40" /></CardContent></Card>
                <Card className="border-2 border-purple-500/20 bg-purple-500/5"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">أنواع</p><p className="text-2xl font-bold text-purple-600">{fundTypes.length}</p></div><BarChart3 className="h-8 w-8 text-purple-500/40" /></CardContent></Card>
              </div>

              <Card><CardContent className="p-3"><div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px]"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="بحث بالاسم أو المدير..." value={fundSearch} onChange={e => setFundSearch(e.target.value)} className="pr-10 h-9" /></div>
                <Select value={fundSharia} onValueChange={setFundSharia}><SelectTrigger className="w-32 h-9"><SelectValue placeholder="الشرعية" /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="yes">شرعي</SelectItem><SelectItem value="no">غير شرعي</SelectItem></SelectContent></Select>
                <Select value={fundType} onValueChange={setFundType}><SelectTrigger className="w-32 h-9"><SelectValue placeholder="النوع" /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem>{fundTypes.map(t => <SelectItem key={t} value={t}>{fundTypeLabel[t] || toArabicTerm(t).ar}</SelectItem>)}</SelectContent></Select>
                <Select value={fundMarket} onValueChange={setFundMarket}><SelectTrigger className="w-40 h-9"><SelectValue placeholder="السوق" /></SelectTrigger><SelectContent><SelectItem value="all">جميع الأسواق</SelectItem>{fundMarkets.map(m => <SelectItem key={m} value={m}>{fundMktLabel[m] || m}</SelectItem>)}</SelectContent></Select>
              </div></CardContent></Card>

              <Card className="border-2">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Banknote className="h-4 w-4" />الصناديق ({filteredFunds.length.toLocaleString()})</CardTitle>
                    <p className="text-xs text-muted-foreground">صفحة {fundPage} من {fundTotalPages}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border overflow-x-auto" dir="rtl">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50">
                        <TableHead className="font-bold text-center w-8">#</TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="الرمز" en="Symbol" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="اسم الصندوق" en="Fund Name" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="مدير الصندوق" en="Manager" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="الشرعية" en="Sharia" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="النوع" en="Type" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="السوق" en="Market" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="العملة" en="Currency" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="صافي الأصول" en="NAV" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="التغير%" en="Change%" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="منذ بداية السنة" en="YTD%" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="سنة واحدة" en="1Y%" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="توزيعات" en="Div%" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="الحجم (مليون)" en="Size (M)" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="نسبة المصاريف" en="Expense%" /></TableHead>
                        <TableHead className="font-bold text-center"><HeadLabel ar="التقييم" en="Grade" /></TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {fundPageData.map((f: any, i: number) => (
                          <TableRow key={f.id || i} className="hover:bg-muted/50">
                            <TableCell className="text-center text-[10px] text-muted-foreground">{(fundPage - 1) * PER_PAGE + i + 1}</TableCell>
                            <TableCell className="text-left font-mono font-bold text-xs">{f.symbol || '—'}</TableCell>
                            <TableCell className="text-left"><p className="font-medium text-sm">{f.name}</p>{f.nameEn && f.nameEn !== f.name && <p className="text-[10px] text-muted-foreground">{f.nameEn}</p>}</TableCell>
                            <TableCell className="text-left text-xs text-muted-foreground">{f.manager || '—'}</TableCell>
                            <TableCell className="text-center">{f.shariaCompliant ? <Badge className="bg-green-500 text-white text-[10px] h-5">شرعي</Badge> : <Badge variant="outline" className="text-[10px] h-5">—</Badge>}</TableCell>
                            <TableCell className="text-center"><Badge variant="outline" className="text-[10px]">{fundTypeLabel[f.type] || toArabicTerm(f.type).ar}</Badge></TableCell>
                            <TableCell className="text-center text-xs">{fundMktLabel[f.market] || f.market}</TableCell>
                            <TableCell className="text-center text-xs"><BilingualValue value={f.currency} /></TableCell>
                            <TableCell className="text-right font-mono text-xs">{f.nav?.toFixed(2) || f.unitPrice?.toFixed(2) || '—'}</TableCell>
                            <TableCell className="text-right"><ChangeCell value={f.changePct || f.change_pct} /></TableCell>
                            <TableCell className="text-right"><ChangeCell value={f.ytdReturn} /></TableCell>
                            <TableCell className="text-right"><ChangeCell value={f.oneYearReturn || f.return1y} /></TableCell>
                            <TableCell className="text-right">{f.dividendPct ? <span className="text-green-600 text-xs font-medium">{Number(f.dividendPct).toFixed(2)}%</span> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="text-right text-xs font-mono">{f.sizeMillion ? Number(f.sizeMillion).toLocaleString(undefined, {maximumFractionDigits: 1}) : '—'}</TableCell>
                            <TableCell className="text-right text-xs font-mono">{f.expenseRatio ? <span>{Number(f.expenseRatio).toFixed(2)}%</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="text-center">{f.grade ? <GradeBadge grade={f.grade} /> : (f.rating ? '⭐'.repeat(Math.min(f.rating, 5)) : '—')}</TableCell>
                          </TableRow>
                        ))}
                        {fundPageData.length === 0 && <TableRow><TableCell colSpan={16} className="text-center py-10 text-muted-foreground">لا توجد نتائج</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination page={fundPage} totalPages={fundTotalPages} onPageChange={setFundPage} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══════════════════════════════════════════════ */}
            {/* TAB 4: SUKUK & BONDS */}
            {/* ═══════════════════════════════════════════════ */}
            <TabsContent value="sukuk" className="space-y-4 mt-5">
              {sukukLoading ? (
                <div className="flex items-center justify-center py-20"><RefreshCw className="h-10 w-10 animate-spin text-muted-foreground" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="border-2"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">إجمالي الصكوك</p><p className="text-2xl font-bold">{sukuk.length}</p></div><FileText className="h-8 w-8 text-muted-foreground/40" /></CardContent></Card>
                    <Card className="border-2 border-green-500/20 bg-green-500/5"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">شرعية</p><p className="text-2xl font-bold text-green-600">{sukuk.filter(s => s.isShariaCompliant).length}</p></div><ShieldCheck className="h-8 w-8 text-green-500/40" /></CardContent></Card>
                    <Card className="border-2 border-amber-500/20 bg-amber-500/5"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">حكومية</p><p className="text-2xl font-bold text-amber-600">{sukuk.filter(s => s.issuer === 'Ministry of Finance').length}</p></div><Building2 className="h-8 w-8 text-amber-500/40" /></CardContent></Card>
                    <Card className="border-2 border-blue-500/20 bg-blue-500/5"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">شركات</p><p className="text-2xl font-bold text-blue-600">{sukuk.filter(s => s.issuer !== 'Ministry of Finance').length}</p></div><DollarSign className="h-8 w-8 text-blue-500/40" /></CardContent></Card>
                  </div>

                  <Card className="border-2">
                    <CardHeader className="py-3"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />الصكوك والسندات</CardTitle></CardHeader>
                    <CardContent>
                      <div className="rounded-xl border overflow-x-auto" dir="rtl">
                        <Table>
                          <TableHeader><TableRow className="bg-muted/50">
                            <TableHead className="font-bold text-center w-8">#</TableHead>
                            <TableHead className="font-bold text-center"><HeadLabel ar="الرمز" en="Symbol" /></TableHead>
                            <TableHead className="font-bold text-center"><HeadLabel ar="الاسم" en="Name" /></TableHead>
                            <TableHead className="font-bold text-center"><HeadLabel ar="الجهة المصدرة" en="Issuer" /></TableHead>
                            <TableHead className="font-bold text-center"><HeadLabel ar="التصنيف" en="Rating" /></TableHead>
                            <TableHead className="font-bold text-center"><HeadLabel ar="الشرعية" en="Sharia" /></TableHead>
                            <TableHead className="font-bold text-center"><HeadLabel ar="السعر" en="Price" /></TableHead>
                            <TableHead className="font-bold text-center"><HeadLabel ar="الكوبون" en="Coupon%" /></TableHead>
                            <TableHead className="font-bold text-center"><HeadLabel ar="العائد" en="Yield%" /></TableHead>
                            <TableHead className="font-bold text-center"><HeadLabel ar="الاستحقاق" en="Maturity" /></TableHead>
                            <TableHead className="font-bold text-center"><HeadLabel ar="العملة" en="Currency" /></TableHead>
                          </TableRow></TableHeader>
                          <TableBody>
                            {sukuk.map((s, i) => (
                              <TableRow key={s.symbol} className="hover:bg-muted/50">
                                <TableCell className="text-center text-[10px] text-muted-foreground">{i + 1}</TableCell>
                                <TableCell className="text-left font-mono font-bold text-sm">{s.symbol}</TableCell>
                                <TableCell className="text-left"><p className="text-sm font-medium">{s.name}</p><p className="text-[10px] text-muted-foreground">{s.nameEn}</p></TableCell>
                                <TableCell className="text-left text-xs"><BilingualValue value={s.issuer} /></TableCell>
                                <TableCell className="text-center"><Badge variant="outline" className="text-xs">{s.rating}</Badge></TableCell>
                                <TableCell className="text-center">{s.isShariaCompliant ? <Badge className="bg-green-500 text-white text-[10px]">شرعي</Badge> : <Badge variant="outline" className="text-[10px]">—</Badge>}</TableCell>
                                <TableCell className="text-right font-mono text-xs">{s.price?.toFixed(2)}</TableCell>
                                <TableCell className="text-right text-xs font-medium text-blue-600">{s.couponRate?.toFixed(2)}%</TableCell>
                                <TableCell className="text-right text-xs font-medium text-green-600">{s.yield?.toFixed(2)}%</TableCell>
                                <TableCell className="text-center text-xs">{s.maturityDate}</TableCell>
                                <TableCell className="text-center"><Badge variant="secondary" className="text-[10px]"><BilingualValue value={s.currency} /></Badge></TableCell>
                              </TableRow>
                            ))}
                            {sukuk.length === 0 && <TableRow><TableCell colSpan={11} className="text-center py-10 text-muted-foreground">لا توجد صكوك · اضغط تحديث لجلب البيانات</TableCell></TableRow>}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Funds with type=bond from full DB */}
                      {allFunds.filter(f => f.type === 'bond').length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-base font-bold mb-3 flex items-center gap-2" dir="rtl"><Banknote className="h-4 w-4" />صناديق الصكوك والسندات</h3>
                          <div className="rounded-xl border overflow-x-auto" dir="rtl">
                            <Table>
                              <TableHeader><TableRow className="bg-muted/50">
                                <TableHead className="font-bold text-center w-8">#</TableHead>
                                <TableHead className="font-bold text-center"><HeadLabel ar="اسم الصندوق" en="Fund Name" /></TableHead>
                                <TableHead className="font-bold text-center"><HeadLabel ar="مدير الصندوق" en="Manager" /></TableHead>
                                <TableHead className="font-bold text-center"><HeadLabel ar="الشرعية" en="Sharia" /></TableHead>
                                <TableHead className="font-bold text-center"><HeadLabel ar="السوق" en="Market" /></TableHead>
                                <TableHead className="font-bold text-center"><HeadLabel ar="صافي الأصول" en="NAV" /></TableHead>
                                <TableHead className="font-bold text-center"><HeadLabel ar="منذ بداية السنة" en="YTD%" /></TableHead>
                                <TableHead className="font-bold text-center"><HeadLabel ar="سنة واحدة" en="1Y%" /></TableHead>
                              </TableRow></TableHeader>
                              <TableBody>
                                {allFunds.filter(f => f.type === 'bond').map((f: any, i: number) => (
                                  <TableRow key={f.id || i} className="hover:bg-muted/50">
                                    <TableCell className="text-center text-[10px] text-muted-foreground">{i + 1}</TableCell>
                                    <TableCell className="text-left"><p className="text-sm font-medium">{f.name}</p><p className="text-[10px] text-muted-foreground">{f.nameEn}</p></TableCell>
                                    <TableCell className="text-left text-xs">{f.manager}</TableCell>
                                    <TableCell className="text-center">{f.shariaCompliant ? <Badge className="bg-green-500 text-white text-[10px]">شرعي</Badge> : <Badge variant="outline" className="text-[10px]">—</Badge>}</TableCell>
                                    <TableCell className="text-center text-xs">{fundMktLabel[f.market] || f.market}</TableCell>
                                    <TableCell className="text-right font-mono text-xs">{f.nav?.toFixed(2) || f.unitPrice?.toFixed(2) || '—'}</TableCell>
                                    <TableCell className="text-right"><ChangeCell value={f.ytdReturn} /></TableCell>
                                    <TableCell className="text-right"><ChangeCell value={f.oneYearReturn} /></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
