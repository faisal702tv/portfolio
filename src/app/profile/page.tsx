'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  TrendingUp,
  Shield,
  Target,
  Briefcase,
  Bell,
  Smartphone,
  Volume2,
  Palette,
  Download,
  Trash2,
  Camera,
  Calendar,
  BarChart3,
  Eye,
  EyeOff,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Languages,
  Currency,
  Building,
  Sparkles,
  Award,
  Loader2,
  RefreshCw,
  Type,
  KeyRound,
  Bot,
  Cpu,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { AI_PROVIDERS as ALL_AI_PROVIDERS } from '@/lib/ai-providers';

// GCC Countries + Egypt + USA
const COUNTRIES = [
  { code: 'SA', name: 'السعودية', nameEn: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AE', name: 'الإمارات', nameEn: 'UAE', flag: '🇦🇪' },
  { code: 'KW', name: 'الكويت', nameEn: 'Kuwait', flag: '🇰🇼' },
  { code: 'QA', name: 'قطر', nameEn: 'Qatar', flag: '🇶🇦' },
  { code: 'BH', name: 'البحرين', nameEn: 'Bahrain', flag: '🇧🇭' },
  { code: 'OM', name: 'عُمان', nameEn: 'Oman', flag: '🇴🇲' },
  { code: 'EG', name: 'مصر', nameEn: 'Egypt', flag: '🇪🇬' },
  { code: 'US', name: 'أمريكا', nameEn: 'USA', flag: '🇺🇸' },
];

// Markets
const MARKETS = [
  { code: 'SA', name: 'السعودية', flag: '🇸🇦' },
  { code: 'AE', name: 'الإمارات', flag: '🇦🇪' },
  { code: 'KW', name: 'الكويت', flag: '🇰🇼' },
  { code: 'QA', name: 'قطر', flag: '🇶🇦' },
  { code: 'BH', name: 'البحرين', flag: '🇧🇭' },
  { code: 'OM', name: 'عُمان', flag: '🇴🇲' },
  { code: 'EG', name: 'مصر', flag: '🇪🇬' },
  { code: 'US', name: 'أمريكا', flag: '🇺🇸' },
];

// Timezones
const TIMEZONES = [
  { value: 'Asia/Riyadh', label: 'الرياض (GMT+3)' },
  { value: 'Asia/Dubai', label: 'دبي (GMT+4)' },
  { value: 'Asia/Kuwait', label: 'الكويت (GMT+3)' },
  { value: 'Asia/Qatar', label: 'قطر (GMT+3)' },
  { value: 'Asia/Bahrain', label: 'البحرين (GMT+3)' },
  { value: 'Asia/Muscat', label: 'مسقط (GMT+4)' },
  { value: 'Africa/Cairo', label: 'القاهرة (GMT+2)' },
  { value: 'America/New_York', label: 'نيويورك (GMT-5)' },
];

// Currencies
const CURRENCIES = [
  { value: 'SAR', label: 'ريال سعودي (SAR)' },
  { value: 'AED', label: 'درهم إماراتي (AED)' },
  { value: 'KWD', label: 'دينار كويتي (KWD)' },
  { value: 'QAR', label: 'ريال قطري (QAR)' },
  { value: 'BHD', label: 'دينار بحريني (BHD)' },
  { value: 'OMR', label: 'ريال عُماني (OMR)' },
  { value: 'EGP', label: 'جنيه مصري (EGP)' },
  { value: 'USD', label: 'دولار أمريكي (USD)' },
];

// Income ranges
const INCOME_RANGES = [
  { value: '0-100k', label: 'أقل من 100,000' },
  { value: '100k-250k', label: '100,000 - 250,000' },
  { value: '250k-500k', label: '250,000 - 500,000' },
  { value: '500k-1m', label: '500,000 - 1,000,000' },
  { value: '1m+', label: 'أكثر من 1,000,000' },
];

// Net worth ranges
const NET_WORTH_RANGES = [
  { value: '0-500k', label: 'أقل من 500,000' },
  { value: '500k-1m', label: '500,000 - 1,000,000' },
  { value: '1m-5m', label: '1,000,000 - 5,000,000' },
  { value: '5m-10m', label: '5,000,000 - 10,000,000' },
  { value: '10m+', label: 'أكثر من 10,000,000' },
];

type ExternalApiProvider = {
  id: string;
  nameAr: string;
  description: string;
  freeRequests: string;
  icon: string;
  color: string;
  placeholder: string;
  url: string;
};

const MARKET_DATA_PROVIDERS: ExternalApiProvider[] = [
  {
    id: 'alpha_vantage',
    nameAr: 'Alpha Vantage',
    description: 'أسعار الأسهم والمؤشرات الفنية',
    freeRequests: '500 طلب/يوم',
    icon: '📈',
    color: 'bg-blue-500',
    placeholder: 'أدخل مفتاح Alpha Vantage...',
    url: 'https://www.alphavantage.co/support/#api-key',
  },
  {
    id: 'financial_modeling_prep',
    nameAr: 'Financial Modeling Prep',
    description: 'بيانات مالية شاملة وبيانات الشورت',
    freeRequests: '250 طلب/يوم',
    icon: '📊',
    color: 'bg-green-500',
    placeholder: 'أدخل مفتاح Financial Modeling Prep...',
    url: 'https://site.financialmodelingprep.com/developer/docs',
  },
  {
    id: 'twelve_data',
    nameAr: 'Twelve Data',
    description: 'بيانات الأسعار الحية والتاريخية',
    freeRequests: '800 طلب/يوم',
    icon: '📡',
    color: 'bg-purple-500',
    placeholder: 'أدخل مفتاح Twelve Data...',
    url: 'https://twelvedata.com/pricing',
  },
  {
    id: 'polygon',
    nameAr: 'Polygon.io',
    description: 'بيانات السوق الأمريكي الشاملة',
    freeRequests: 'محدود مجاني',
    icon: '🔷',
    color: 'bg-cyan-500',
    placeholder: 'أدخل مفتاح Polygon.io...',
    url: 'https://polygon.io/pricing',
  },
  {
    id: 'news_api',
    nameAr: 'News API',
    description: 'أخبار مالية من مئات المصادر',
    freeRequests: '100 طلب/يوم',
    icon: '📰',
    color: 'bg-orange-500',
    placeholder: 'أدخل مفتاح News API...',
    url: 'https://newsapi.org/pricing',
  },
  {
    id: 'eodhd',
    nameAr: 'EODHD',
    description: 'بيانات تاريخية وأساسية لأكثر من 70 بورصة عالمية',
    freeRequests: '20 طلب/يوم',
    icon: '🌍',
    color: 'bg-emerald-600',
    placeholder: 'أدخل مفتاح EODHD...',
    url: 'https://eodhd.com/pricing',
  },
  {
    id: 'finnhub',
    nameAr: 'Finnhub',
    description: 'بيانات لحظية وأخبار وتحليل مالي شامل',
    freeRequests: '60 طلب/دقيقة',
    icon: '🐟',
    color: 'bg-sky-600',
    placeholder: 'أدخل مفتاح Finnhub...',
    url: 'https://finnhub.io/pricing',
  },
  {
    id: 'massive',
    nameAr: 'Massive',
    description: 'أسهم وفوركس ومؤشرات وعقود آجلة بواجهات سريعة',
    freeRequests: 'مجاني محدود',
    icon: '🚀',
    color: 'bg-violet-600',
    placeholder: 'أدخل مفتاح Massive API...',
    url: 'https://massive.com/pricing',
  },
];

const LOCAL_WATCHLIST_KEY = 'watchlist_data';
const LOCAL_ALERTS_KEY = 'alerts_data';

type LocalWatchlistItem = {
  alertAbove?: number | null;
  alertBelow?: number | null;
  targetPrice?: number | null;
};

type LocalWatchlist = {
  itemCount?: number;
  items?: LocalWatchlistItem[];
};

type LocalAlert = {
  isActive?: boolean;
};

function readLocalWatchlistStats() {
  if (typeof window === 'undefined') {
    return {
      totalWatchlists: 0,
      totalWatchlistItems: 0,
      activeWatchlistAlerts: 0,
    };
  }

  try {
    const raw = localStorage.getItem(LOCAL_WATCHLIST_KEY);
    if (!raw) {
      return {
        totalWatchlists: 0,
        totalWatchlistItems: 0,
        activeWatchlistAlerts: 0,
      };
    }

    const parsed = JSON.parse(raw) as LocalWatchlist[];
    if (!Array.isArray(parsed)) {
      return {
        totalWatchlists: 0,
        totalWatchlistItems: 0,
        activeWatchlistAlerts: 0,
      };
    }

    let totalItems = 0;
    let activeWatchlistAlerts = 0;

    for (const list of parsed) {
      const items = Array.isArray(list?.items) ? list.items : [];
      totalItems += items.length > 0 ? items.length : Number(list?.itemCount || 0);

      for (const item of items) {
        if (item?.alertAbove != null || item?.alertBelow != null || item?.targetPrice != null) {
          activeWatchlistAlerts += 1;
        }
      }
    }

    return {
      totalWatchlists: parsed.length,
      totalWatchlistItems: totalItems,
      activeWatchlistAlerts,
    };
  } catch {
    return {
      totalWatchlists: 0,
      totalWatchlistItems: 0,
      activeWatchlistAlerts: 0,
    };
  }
}

function readLocalAlertStats() {
  if (typeof window === 'undefined') {
    return {
      totalAlerts: 0,
      activeAlerts: 0,
    };
  }

  try {
    const raw = localStorage.getItem(LOCAL_ALERTS_KEY);
    if (!raw) {
      return {
        totalAlerts: 0,
        activeAlerts: 0,
      };
    }
    const parsed = JSON.parse(raw) as LocalAlert[];
    if (!Array.isArray(parsed)) {
      return {
        totalAlerts: 0,
        activeAlerts: 0,
      };
    }
    return {
      totalAlerts: parsed.length,
      activeAlerts: parsed.filter((alert) => alert?.isActive).length,
    };
  } catch {
    return {
      totalAlerts: 0,
      activeAlerts: 0,
    };
  }
}

type ProfileApiMetrics = Partial<{
  totalTransactions: number;
  totalWatchlists: number;
  totalWatchlistItems: number;
  totalAlerts: number;
  activeAlerts: number;
  totalStocks: number;
  totalCrypto: number;
  totalForex: number;
  totalBonds: number;
  totalSukuk: number;
  totalFunds: number;
  totalCommodities: number;
  totalMetals: number;
  totalHoldings: number;
  activePortfolios: number;
}>;

type ProfileApiUser = Partial<{
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: string;
  avatar: string | null;
  preferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  _count: {
    portfolios?: number;
    watchlists?: number;
    alerts?: number;
  };
}>;

type ProfileApiPayload = Partial<{
  success: boolean;
  error: string;
  profile: ProfileApiUser | null;
  metrics: ProfileApiMetrics | null;
}>;

type SaveResult = {
  ok: boolean;
  error?: string;
  payload?: ProfileApiPayload | null;
};

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, token, updateUser } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [reloadingStats, setReloadingStats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    fullNameAr: '',
    fullNameEn: '',
    email: '',
    phone: '',
    country: 'SA',
    city: '',
    language: 'ar',
    timezone: 'Asia/Riyadh',
  });

  // Investment Profile State
  const [investmentProfile, setInvestmentProfile] = useState({
    experienceLevel: 'intermediate',
    riskTolerance: 'moderate',
    investmentGoals: [] as string[],
    primaryMarkets: [] as string[],
    annualIncome: '',
    netWorth: '',
  });

  // Preferences State
  const [preferences, setPreferences] = useState({
    defaultCurrency: 'SAR',
    defaultMarket: 'SA',
    notificationsEmail: true,
    notificationsPush: true,
    notificationsPrice: true,
    notificationsNews: false,
    priceAlertsEmail: true,
    priceAlertsPush: true,
    priceAlertsInApp: true,
    dailySummary: false,
    weeklySummary: true,
    darkMode: false,
    fontSize: '14',
  });

  // Account Statistics
  const [accountStats, setAccountStats] = useState({
    totalPortfolios: 0,
    totalWatchlists: 0,
    totalWatchlistItems: 0,
    totalAlerts: 0,
    activeAlerts: 0,
    totalTransactions: 0,
    totalStocks: 0,
    totalCrypto: 0,
    totalForex: 0,
    totalBonds: 0,
    totalSukuk: 0,
    totalFunds: 0,
    totalCommodities: 0,
    totalMetals: 0,
    totalHoldings: 0,
    activePortfolios: 0,
    memberSince: '',
    lastLogin: '',
  });
  const [defaultProvider, setDefaultProvider] = useState('zai');
  const [defaultModel, setDefaultModel] = useState('default');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [apiSaving, setApiSaving] = useState(false);

  const applyProfileResponse = useCallback((payload: ProfileApiPayload | null | undefined) => {
    const p = payload?.profile;
    if (!p) return;

    const prefs = (p.preferences as Record<string, unknown>) || {};
    const metrics = payload?.metrics || {};
    const localWatchlistStats = readLocalWatchlistStats();
    const localAlertStats = readLocalAlertStats();

    const totalWatchlists = Math.max(
      Number(metrics.totalWatchlists ?? p._count?.watchlists ?? 0),
      localWatchlistStats.totalWatchlists
    );
    const totalWatchlistItems = Math.max(
      Number(metrics.totalWatchlistItems || 0),
      localWatchlistStats.totalWatchlistItems
    );
    const activeAlerts = Math.max(
      Number(metrics.activeAlerts ?? 0),
      localWatchlistStats.activeWatchlistAlerts,
      localAlertStats.activeAlerts
    );
    const totalAlerts = Math.max(
      Number(metrics.totalAlerts ?? p._count?.alerts ?? 0),
      localWatchlistStats.activeWatchlistAlerts,
      localAlertStats.totalAlerts
    );

    setPersonalInfo({
      fullNameAr: (prefs.fullNameAr as string) || p.name || '',
      fullNameEn: (prefs.fullNameEn as string) || '',
      email: p.email || '',
      phone: (prefs.phone as string) || '',
      country: (prefs.country as string) || 'SA',
      city: (prefs.city as string) || '',
      language: (prefs.language as string) || 'ar',
      timezone: (prefs.timezone as string) || 'Asia/Riyadh',
    });

    const ip = (prefs.investmentProfile as Record<string, unknown>) || {};
    setInvestmentProfile({
      experienceLevel: (ip.experienceLevel as string) || 'intermediate',
      riskTolerance: (ip.riskTolerance as string) || 'moderate',
      investmentGoals: (ip.investmentGoals as string[]) || [],
      primaryMarkets: (ip.primaryMarkets as string[]) || [],
      annualIncome: (ip.annualIncome as string) || '',
      netWorth: (ip.netWorth as string) || '',
    });

    const up = (prefs.preferences as Record<string, unknown>) || {};
    setPreferences((prev) => ({ ...prev, ...up } as typeof prev));

    setAccountStats({
      totalPortfolios: p._count?.portfolios || 0,
      totalWatchlists,
      totalWatchlistItems,
      totalAlerts,
      activeAlerts,
      totalTransactions: Number(metrics.totalTransactions || 0),
      totalStocks: Number(metrics.totalStocks || 0),
      totalCrypto: Number(metrics.totalCrypto || 0),
      totalForex: Number(metrics.totalForex || 0),
      totalBonds: Number(metrics.totalBonds || 0),
      totalSukuk: Number(metrics.totalSukuk || 0),
      totalFunds: Number(metrics.totalFunds || 0),
      totalCommodities: Number(metrics.totalCommodities || 0),
      totalMetals: Number(metrics.totalMetals || 0),
      totalHoldings: Number(metrics.totalHoldings || 0),
      activePortfolios: Number(metrics.activePortfolios || 0),
      memberSince: p.createdAt || '',
      lastLogin: p.updatedAt || '',
    });
  }, []);

  const loadProfile = useCallback(async (silent = false) => {
    if (!token) return;
    if (silent) setReloadingStats(true);
    else setLoadingProfile(true);

    try {
      const res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const message = payload?.error || 'تعذر تحميل بيانات الملف الشخصي';
        setLastError(message);
        if (!silent) {
          toast({ title: 'فشل التحميل', description: message, variant: 'destructive' });
        }
        return;
      }

      setLastError(null);
      applyProfileResponse(payload);
    } catch (err) {
      console.error('Failed to load profile:', err);
      const message = 'حدث خطأ أثناء الاتصال بالخادم';
      setLastError(message);
      if (!silent) {
        toast({ title: 'فشل التحميل', description: message, variant: 'destructive' });
      }
    } finally {
      if (silent) setReloadingStats(false);
      else setLoadingProfile(false);
    }
  }, [token, applyProfileResponse, toast]);

  // Load profile from API
  useEffect(() => {
    if (!token) {
      setLoadingProfile(false);
      return;
    }
    void loadProfile();
  }, [token, loadProfile]);

  useEffect(() => {
    const loadApiSettings = async () => {
      try {
        const savedKeys = localStorage.getItem('api_keys');
        if (savedKeys) setApiKeys(JSON.parse(savedKeys));
        const savedProvider = localStorage.getItem('default_provider');
        if (savedProvider) setDefaultProvider(savedProvider);
        const savedModel = localStorage.getItem('default_model');
        if (savedModel) setDefaultModel(savedModel);
      } catch {
        // ignore local cache errors
      }

      if (!token) return;
      try {
        const response = await fetch('/api/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        const serverKeys = data?.keys && typeof data.keys === 'object' ? (data.keys as Record<string, string>) : null;
        if (serverKeys) {
          setApiKeys(serverKeys);
          localStorage.setItem('api_keys', JSON.stringify(serverKeys));
          localStorage.setItem('ai_api_keys', JSON.stringify(serverKeys));
        }
        if (typeof data?.defaultProvider === 'string' && data.defaultProvider.trim()) {
          setDefaultProvider(data.defaultProvider);
          localStorage.setItem('default_provider', data.defaultProvider);
        }
        if (typeof data?.defaultModel === 'string' && data.defaultModel.trim()) {
          setDefaultModel(data.defaultModel);
          localStorage.setItem('default_model', data.defaultModel);
        }
      } catch {
        // keep local fallback
      }
    };

    void loadApiSettings();
  }, [token]);

  // Save helper
  const saveToApi = useCallback(async (input: { preferences: Record<string, unknown>; name?: string; email?: string }): Promise<SaveResult> => {
    if (!token) {
      return { ok: false, error: 'يرجى تسجيل الدخول أولاً' };
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { preferences: input.preferences };
      if (input.name !== undefined) body.name = input.name;
      if (input.email !== undefined) body.email = input.email;
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const payload = await res.json().catch(() => null) as ProfileApiPayload | null;
      if (!res.ok) {
        return {
          ok: false,
          error: payload?.error || 'فشل حفظ البيانات',
        };
      }

      return { ok: true, payload };
    } catch {
      return { ok: false, error: 'تعذر الاتصال بالخادم أثناء الحفظ' };
    } finally {
      setSaving(false);
    }
  }, [token]);

  // Build full preferences object for saving
  const buildPrefs = useCallback(() => ({
    fullNameAr: personalInfo.fullNameAr,
    fullNameEn: personalInfo.fullNameEn,
    phone: personalInfo.phone,
    country: personalInfo.country,
    city: personalInfo.city,
    language: personalInfo.language,
    timezone: personalInfo.timezone,
    investmentProfile,
    preferences,
  }), [personalInfo, investmentProfile, preferences]);

  const getAvailableModels = useCallback((providerId: string) => {
    const provider = ALL_AI_PROVIDERS.find((item) => item.id === providerId);
    return provider?.models || [];
  }, []);

  const handleProviderChange = useCallback((providerId: string) => {
    setDefaultProvider(providerId);
    const models = getAvailableModels(providerId);
    if (models.length > 0) {
      setDefaultModel(models[0].id);
    }
  }, [getAvailableModels]);

  const handleSaveApiKeys = useCallback(async () => {
    setApiSaving(true);
    try {
      const aliasMap: Record<string, string> = {
        anthropic_claude: 'anthropic',
        google_gemini: 'google',
        xai_grok: 'xai',
        openRouter: 'openrouter',
      };
      const merged = { ...apiKeys };
      for (const [fromId, toId] of Object.entries(aliasMap)) {
        if (merged[fromId]) merged[toId] = merged[fromId];
        if (merged[toId]) merged[fromId] = merged[toId];
      }

      const keysJson = JSON.stringify(merged);
      localStorage.setItem('api_keys', keysJson);
      localStorage.setItem('ai_api_keys', keysJson);
      localStorage.setItem('default_provider', defaultProvider);
      localStorage.setItem('default_model', defaultModel);
      setApiKeys(merged);

      let syncedToServer = false;
      if (token) {
        try {
          const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              keys: merged,
              provider: defaultProvider,
              model: defaultModel,
            }),
          });
          syncedToServer = response.ok;
        } catch {
          syncedToServer = false;
        }
      }

      toast({
        title: 'تم حفظ إعدادات API',
        description: syncedToServer
          ? 'تم حفظ مفاتيحك واشتراكاتك وربطها بحسابك'
          : 'تم الحفظ محلياً. تأكد من تسجيل الدخول لمزامنة الإعدادات مع حسابك',
        variant: syncedToServer ? 'default' : 'destructive',
      });
    } finally {
      setApiSaving(false);
    }
  }, [apiKeys, defaultModel, defaultProvider, toast, token]);

  // Handle avatar upload
  const handleAvatarChange = () => {
    toast({ title: 'تغيير الصورة', description: 'سيتم فتح نافذة اختيار الصورة' });
  };

  // Handle save personal info
  const handleSavePersonalInfo = async () => {
    if (!personalInfo.email.trim()) {
      toast({
        title: 'بيانات ناقصة',
        description: 'البريد الإلكتروني مطلوب',
        variant: 'destructive',
      });
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email.trim());
    if (!emailOk) {
      toast({
        title: 'تنسيق غير صحيح',
        description: 'يرجى إدخال بريد إلكتروني صحيح',
        variant: 'destructive',
      });
      return;
    }

    const result = await saveToApi({
      preferences: buildPrefs(),
      name: personalInfo.fullNameAr || personalInfo.fullNameEn,
      email: personalInfo.email.trim(),
    });

    if (result.ok) {
      if (result.payload?.profile) {
        applyProfileResponse(result.payload);
        updateUser({
          name: result.payload.profile.name || null,
          email: result.payload.profile.email,
          username: result.payload.profile.username,
        });
      } else {
        await loadProfile(true);
      }
      setLastSavedAt(new Date().toISOString());
      setLastError(null);
    }

    toast({
      title: result.ok ? 'تم الحفظ' : 'خطأ',
      description: result.ok ? 'تم حفظ المعلومات الشخصية وربطها بالمشروع بنجاح' : (result.error || 'فشل في حفظ المعلومات'),
      variant: result.ok ? 'default' : 'destructive',
    });
  };

  // Handle save investment profile
  const handleSaveInvestmentProfile = async () => {
    const result = await saveToApi({ preferences: buildPrefs() });
    if (result.ok) {
      if (result.payload?.profile) applyProfileResponse(result.payload);
      else await loadProfile(true);
      setLastSavedAt(new Date().toISOString());
      setLastError(null);
    }
    toast({
      title: result.ok ? 'تم الحفظ' : 'خطأ',
      description: result.ok ? 'تم حفظ ملف الاستثمار ومزامنته مع المشروع' : (result.error || 'فشل في حفظ ملف الاستثمار'),
      variant: result.ok ? 'default' : 'destructive',
    });
  };

  // Handle save preferences
  const handleSavePreferences = async () => {
    const result = await saveToApi({ preferences: buildPrefs() });
    if (result.ok) {
      if (result.payload?.profile) applyProfileResponse(result.payload);
      else await loadProfile(true);
      setLastSavedAt(new Date().toISOString());
      setLastError(null);
    }
    toast({
      title: result.ok ? 'تم الحفظ' : 'خطأ',
      description: result.ok ? 'تم حفظ التفضيلات وتفعيلها في النظام' : (result.error || 'فشل في حفظ التفضيلات'),
      variant: result.ok ? 'default' : 'destructive',
    });
  };

  // Handle download data
  const handleDownloadData = () => {
    const data = { personalInfo, investmentProfile, preferences, accountStats };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'profile-data.json'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'تم التحميل', description: 'تم تحميل بياناتك بنجاح' });
  };

  // Handle delete account
  const handleDeleteAccount = () => {
    toast({ title: 'تم حذف الحساب', description: 'تم حذف حسابك بنجاح', variant: 'destructive' });
  };

  // Toggle investment goal
  const toggleInvestmentGoal = (goal: string) => {
    setInvestmentProfile(prev => ({
      ...prev,
      investmentGoals: prev.investmentGoals.includes(goal)
        ? prev.investmentGoals.filter(g => g !== goal)
        : [...prev.investmentGoals, goal],
    }));
  };

  // Toggle primary market
  const togglePrimaryMarket = (market: string) => {
    setInvestmentProfile(prev => ({
      ...prev,
      primaryMarkets: prev.primaryMarkets.includes(market)
        ? prev.primaryMarkets.filter(m => m !== market)
        : [...prev.primaryMarkets, market],
    }));
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Sidebar />
        <div className="mr-16 lg:mr-64 transition-all duration-300">
          <TopBar title="👤 الملف الشخصي والاعدادات" />
          <main className="p-6">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>جاري تحميل الملف الشخصي وربطه ببيانات المشروع...</span>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="👤 الملف الشخصي والاعدادات" />
        <main className="p-6 space-y-6">
          {/* Header Section */}
          <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-primary/20">
                    <AvatarImage src="/avatar.png" alt="صورة المستخدم" />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {(personalInfo.fullNameAr || user?.name || user?.username || '؟').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 left-0 h-8 w-8 rounded-full shadow-lg"
                    onClick={handleAvatarChange}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{personalInfo.fullNameAr}</h2>
                    <Badge className="gradient-gold text-white gap-1">
                      <Award className="h-3 w-3" />
                      {user?.role === 'admin' ? 'مدير النظام' : 'حساب احترافي'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{personalInfo.fullNameEn}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {personalInfo.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      عضو منذ {accountStats.memberSince ? new Date(accountStats.memberSince).toLocaleDateString('ar-SA-u-ca-gregory') : '-'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {lastSavedAt && (
                      <span className="text-emerald-600">
                        آخر حفظ: {new Date(lastSavedAt).toLocaleString('ar-SA-u-ca-gregory')}
                      </span>
                    )}
                    {lastError && (
                      <span className="text-red-600">{lastError}</span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 h-7 px-2"
                      onClick={() => void loadProfile(true)}
                      disabled={reloadingStats}
                    >
                      <RefreshCw className={`h-3 w-3 ${reloadingStats ? 'animate-spin' : ''}`} />
                      تحديث الربط
                    </Button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap gap-4">
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-primary">{accountStats.totalPortfolios}</p>
                    <p className="text-xs text-muted-foreground">محفظة</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-primary">{accountStats.totalWatchlists}</p>
                    <p className="text-xs text-muted-foreground">قائمة متابعة</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-primary">{accountStats.totalWatchlistItems}</p>
                    <p className="text-xs text-muted-foreground">عناصر المتابعة</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-primary">{accountStats.totalTransactions}</p>
                    <p className="text-xs text-muted-foreground">معاملة</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-primary">{accountStats.activeAlerts}</p>
                    <p className="text-xs text-muted-foreground">تنبيه نشط</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-primary">{accountStats.totalCrypto}</p>
                    <p className="text-xs text-muted-foreground">عملات مشفرة</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-primary">{accountStats.totalForex}</p>
                    <p className="text-xs text-muted-foreground">فوركس</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-primary">{accountStats.totalSukuk}</p>
                    <p className="text-xs text-muted-foreground">صكوك</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-primary">{accountStats.totalCommodities}</p>
                    <p className="text-xs text-muted-foreground">سلع ومعادن</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-2xl font-bold text-primary">{accountStats.totalHoldings}</p>
                    <p className="text-xs text-muted-foreground">مراكز استثمارية</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Right Column (in RTL) - Forms */}
            <Tabs defaultValue="personal" className="lg:col-span-2 space-y-6" dir="rtl">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/50">
                <TabsTrigger value="personal" className="py-2 text-xs md:text-sm whitespace-nowrap">البيانات الشخصية</TabsTrigger>
                <TabsTrigger value="investment" className="py-2 text-xs md:text-sm whitespace-nowrap">ملف الاستثمار</TabsTrigger>
                <TabsTrigger value="preferences" className="py-2 text-xs md:text-sm whitespace-nowrap">التفضيلات</TabsTrigger>
                <TabsTrigger value="api" className="py-2 text-xs md:text-sm whitespace-nowrap">API واشتراكات</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-0">
                {/* Personal Information Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      المعلومات الشخصية
                    </CardTitle>
                    <CardDescription>معلوماتك الشخصية الأساسية</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          الاسم الكامل (عربي)
                        </Label>
                        <Input
                          value={personalInfo.fullNameAr}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, fullNameAr: e.target.value })}
                          placeholder="أدخل اسمك بالعربية"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Languages className="h-4 w-4" />
                          الاسم الكامل (English)
                        </Label>
                        <Input
                          value={personalInfo.fullNameEn}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, fullNameEn: e.target.value })}
                          placeholder="Enter your name in English"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          البريد الإلكتروني
                        </Label>
                        <Input
                          type="email"
                          value={personalInfo.email}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                          placeholder="example@email.com"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          رقم الهاتف
                        </Label>
                        <Input
                          type="tel"
                          value={personalInfo.phone}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                          placeholder="+966 50 123 4567"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          الدولة
                        </Label>
                        <Select
                          value={personalInfo.country}
                          onValueChange={(value) => setPersonalInfo({ ...personalInfo, country: value })}
                          dir="rtl"
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر الدولة" />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRIES.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                <span className="flex items-center gap-2">
                                  <span>{country.flag}</span>
                                  <span>{country.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          المدينة
                        </Label>
                        <Input
                          value={personalInfo.city}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
                          placeholder="أدخل المدينة"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          اللغة المفضلة
                        </Label>
                        <Select
                          value={personalInfo.language}
                          onValueChange={(value) => setPersonalInfo({ ...personalInfo, language: value })}
                          dir="rtl"
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر اللغة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ar">العربية</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          المنطقة الزمنية
                        </Label>
                        <Select
                          value={personalInfo.timezone}
                          onValueChange={(value) => setPersonalInfo({ ...personalInfo, timezone: value })}
                          dir="rtl"
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر المنطقة الزمنية" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleSavePersonalInfo} disabled={saving} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="investment" className="mt-0">

                {/* Investment Profile Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      ملف الاستثمار
                    </CardTitle>
                    <CardDescription>حدد خبرتك الاستثمارية وأهدافك</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Experience Level */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">مستوى الخبرة الاستثمارية</Label>
                      <RadioGroup
                        value={investmentProfile.experienceLevel}
                        onValueChange={(value) => setInvestmentProfile({ ...investmentProfile, experienceLevel: value })}
                        dir="rtl"
                        className="grid grid-cols-2 md:grid-cols-4 gap-3"
                      >
                        {[
                          { value: 'beginner', label: 'مبتدئ', desc: 'أقل من سنة' },
                          { value: 'intermediate', label: 'متوسط', desc: '1-3 سنوات' },
                          { value: 'advanced', label: 'متقدم', desc: '3-5 سنوات' },
                          { value: 'expert', label: 'خبير', desc: 'أكثر من 5 سنوات' },
                        ].map((level) => (
                          <div
                            key={level.value}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${investmentProfile.experienceLevel === level.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                              }`}
                            onClick={() => setInvestmentProfile({ ...investmentProfile, experienceLevel: level.value })}
                          >
                            <RadioGroupItem value={level.value} className="sr-only" />
                            <span className="font-medium">{level.label}</span>
                            <span className="text-xs text-muted-foreground">{level.desc}</span>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <Separator />

                    {/* Risk Tolerance */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">تحمل المخاطر</Label>
                      <RadioGroup
                        value={investmentProfile.riskTolerance}
                        onValueChange={(value) => setInvestmentProfile({ ...investmentProfile, riskTolerance: value })}
                        dir="rtl"
                        className="grid grid-cols-1 md:grid-cols-3 gap-3"
                      >
                        {[
                          { value: 'conservative', label: 'محافظ', desc: 'أفضل الاستثمارات الآمنة ذات العائد المنخفض', icon: Shield },
                          { value: 'moderate', label: 'متوسط', desc: 'أفضل التوازن بين المخاطر والعائد', icon: Target },
                          { value: 'aggressive', label: 'مغامر', desc: 'أقبل المخاطر العالية مقابل عوائد أعلى', icon: TrendingUp },
                        ].map((risk) => (
                          <div
                            key={risk.value}
                            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${investmentProfile.riskTolerance === risk.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                              }`}
                            onClick={() => setInvestmentProfile({ ...investmentProfile, riskTolerance: risk.value })}
                          >
                            <RadioGroupItem value={risk.value} className="mt-1" />
                            <div>
                              <div className="flex items-center gap-2">
                                <risk.icon className="h-4 w-4 text-primary" />
                                <span className="font-medium">{risk.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{risk.desc}</p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <Separator />

                    {/* Investment Goals */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">أهداف الاستثمار</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { value: 'growth', label: 'نمو رأس المال', icon: TrendingUp },
                          { value: 'income', label: 'دخل ثابت', icon: Wallet },
                          { value: 'speculation', label: 'مضاربة', icon: Sparkles },
                          { value: 'balanced', label: 'متوازن', icon: BarChart3 },
                        ].map((goal) => (
                          <div
                            key={goal.value}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${investmentProfile.investmentGoals.includes(goal.value)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                              }`}
                            onClick={() => toggleInvestmentGoal(goal.value)}
                          >
                            <Checkbox
                              checked={investmentProfile.investmentGoals.includes(goal.value)}
                              onCheckedChange={() => toggleInvestmentGoal(goal.value)}
                            />
                            <goal.icon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{goal.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Primary Markets */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">الأسواق الرئيسية</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {MARKETS.map((market) => (
                          <div
                            key={market.code}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${investmentProfile.primaryMarkets.includes(market.code)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                              }`}
                            onClick={() => togglePrimaryMarket(market.code)}
                          >
                            <Checkbox
                              checked={investmentProfile.primaryMarkets.includes(market.code)}
                              onCheckedChange={() => togglePrimaryMarket(market.code)}
                            />
                            <span className="text-lg">{market.flag}</span>
                            <span className="text-sm font-medium">{market.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Financial Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          نطاق الدخل السنوي
                        </Label>
                        <Select
                          value={investmentProfile.annualIncome}
                          onValueChange={(value) => setInvestmentProfile({ ...investmentProfile, annualIncome: value })}
                          dir="rtl"
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر نطاق الدخل" />
                          </SelectTrigger>
                          <SelectContent>
                            {INCOME_RANGES.map((range) => (
                              <SelectItem key={range.value} value={range.value}>
                                {range.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          نطاق صافي الثروة
                        </Label>
                        <Select
                          value={investmentProfile.netWorth}
                          onValueChange={(value) => setInvestmentProfile({ ...investmentProfile, netWorth: value })}
                          dir="rtl"
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر نطاق صافي الثروة" />
                          </SelectTrigger>
                          <SelectContent>
                            {NET_WORTH_RANGES.map((range) => (
                              <SelectItem key={range.value} value={range.value}>
                                {range.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSaveInvestmentProfile} disabled={saving} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {saving ? 'جاري الحفظ...' : 'حفظ ملف الاستثمار'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="mt-0">

                {/* Preferences Section */}
                <Card id="section-preferences">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      التفضيلات
                    </CardTitle>
                    <CardDescription>تخصيص تجربتك في المنصة</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Default Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Currency className="h-4 w-4" />
                          العملة الافتراضية
                        </Label>
                        <Select
                          value={preferences.defaultCurrency}
                          onValueChange={(value) => setPreferences({ ...preferences, defaultCurrency: value })}
                          dir="rtl"
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر العملة" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          السوق الافتراضي
                        </Label>
                        <Select
                          value={preferences.defaultMarket}
                          onValueChange={(value) => setPreferences({ ...preferences, defaultMarket: value })}
                          dir="rtl"
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر السوق" />
                          </SelectTrigger>
                          <SelectContent>
                            {MARKETS.map((market) => (
                              <SelectItem key={market.code} value={market.code}>
                                <span className="flex items-center gap-2">
                                  <span>{market.flag}</span>
                                  <span>{market.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    {/* Alert Preferences */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        تفضيلات التنبيهات
                      </Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">تنبيهات البريد الإلكتروني</p>
                              <p className="text-xs text-muted-foreground">استلام تنبيهات الأسعار عبر البريد</p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.priceAlertsEmail}
                            onCheckedChange={(checked) => setPreferences({ ...preferences, priceAlertsEmail: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">إشعارات Push</p>
                              <p className="text-xs text-muted-foreground">إشعارات فورية على الجهاز</p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.priceAlertsPush}
                            onCheckedChange={(checked) => setPreferences({ ...preferences, priceAlertsPush: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">تنبيهات داخل التطبيق</p>
                              <p className="text-xs text-muted-foreground">إشعارات داخل المنصة</p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.priceAlertsInApp}
                            onCheckedChange={(checked) => setPreferences({ ...preferences, priceAlertsInApp: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* General Notifications (migrated from settings page) */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        إعدادات التنبيهات العامة
                      </Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">تنبيهات البريد الإلكتروني</p>
                              <p className="text-xs text-muted-foreground">استلام التنبيهات عبر البريد الإلكتروني</p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.notificationsEmail}
                            onCheckedChange={(checked) => setPreferences({ ...preferences, notificationsEmail: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">إشعارات الموبايل</p>
                              <p className="text-xs text-muted-foreground">استلام الإشعارات الفورية على الهاتف</p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.notificationsPush}
                            onCheckedChange={(checked) => setPreferences({ ...preferences, notificationsPush: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">تنبيهات الأسعار</p>
                              <p className="text-xs text-muted-foreground">تفعيل أو إيقاف تنبيهات أهداف الأسعار</p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.notificationsPrice}
                            onCheckedChange={(checked) => setPreferences({ ...preferences, notificationsPrice: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Volume2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">تنبيهات الأخبار</p>
                              <p className="text-xs text-muted-foreground">أخبار السوق والتنبيهات الإخبارية</p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.notificationsNews}
                            onCheckedChange={(checked) => setPreferences({ ...preferences, notificationsNews: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Email Summaries */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium">ملخصات المحفظة</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">ملخص يومي</p>
                              <p className="text-xs text-muted-foreground">تقرير يومي عن أداء المحفظة</p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.dailySummary}
                            onCheckedChange={(checked) => setPreferences({ ...preferences, dailySummary: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">ملخص أسبوعي</p>
                              <p className="text-xs text-muted-foreground">تقرير أسبوعي مفصل عن الأداء</p>
                            </div>
                          </div>
                          <Switch
                            checked={preferences.weeklySummary}
                            onCheckedChange={(checked) => setPreferences({ ...preferences, weeklySummary: checked })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Appearance */}
                    <div id="section-appearance" className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                      <Label className="text-base font-medium flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        المظهر
                      </Label>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">اختر الثيم المناسب لواجهة التطبيق</p>
                        <ThemeSelector />
                      </div>
                      <Separator />
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Type className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">حجم الخط</p>
                            <p className="text-xs text-muted-foreground">تغيير حجم النص داخل التطبيق</p>
                          </div>
                        </div>
                        <Select
                          value={preferences.fontSize}
                          onValueChange={(value) => setPreferences({ ...preferences, fontSize: value })}
                          dir="rtl"
                        >
                          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12">صغير</SelectItem>
                            <SelectItem value="14">متوسط</SelectItem>
                            <SelectItem value="16">كبير</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Palette className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">الوضع الداكن</p>
                            <p className="text-xs text-muted-foreground">تفعيل الوضع الداكن للواجهة</p>
                          </div>
                        </div>
                        <Switch
                          checked={preferences.darkMode}
                          onCheckedChange={(checked) => setPreferences({ ...preferences, darkMode: checked })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSavePreferences} disabled={saving} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {saving ? 'جاري الحفظ...' : 'حفظ التفضيلات'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="api" className="mt-0">

                {/* API & Subscriptions */}
                <Card id="section-api">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <KeyRound className="h-5 w-5" />
                      API والاشتراكات
                    </CardTitle>
                    <CardDescription>
                      إدارة مفاتيح API الخاصة بحسابك فقط وربط مزود الذكاء الاصطناعي الافتراضي
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div id="section-subscriptions" className="rounded-lg border bg-muted/40 p-3">
                      <p className="font-medium">الاشتراكات</p>
                      <p className="text-xs text-muted-foreground">إدارة اشتراكات مزودي بيانات السوق والذكاء الاصطناعي الخاصة بحسابك.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          مزود AI الافتراضي
                        </Label>
                        <Select value={defaultProvider} onValueChange={handleProviderChange} dir="rtl">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ALL_AI_PROVIDERS.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id}>
                                <div className="flex items-center gap-2">
                                  <span>{provider.icon}</span>
                                  <span>{provider.nameAr}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Cpu className="h-4 w-4" />
                          النموذج الافتراضي
                        </Label>
                        <Select value={defaultModel} onValueChange={setDefaultModel} dir="rtl">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {getAvailableModels(defaultProvider).map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.nameAr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Accordion type="multiple" defaultValue={['market-data', 'ai-apis']} className="space-y-4" dir="rtl">
                      <AccordionItem value="market-data">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📈</span>
                            <span className="font-semibold">بيانات السوق والأسعار</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          {MARKET_DATA_PROVIDERS.map((provider) => (
                            <div key={provider.id} className="p-4 border rounded-lg space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <span className={`text-2xl p-2 rounded ${provider.color}`}>{provider.icon}</span>
                                  <div>
                                    <p className="font-semibold">{provider.nameAr}</p>
                                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                                    <Badge variant="secondary" className="mt-1">{provider.freeRequests}</Badge>
                                  </div>
                                </div>
                                <a
                                  href={provider.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1 text-xs"
                                >
                                  احصل على مفتاح <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <div className="relative">
                                <Input
                                  type={showApiKeys[provider.id] ? 'text' : 'password'}
                                  placeholder={provider.placeholder}
                                  value={apiKeys[provider.id] || ''}
                                  onChange={(e) => setApiKeys({ ...apiKeys, [provider.id]: e.target.value })}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute left-0 top-0 h-full px-3"
                                  onClick={() => setShowApiKeys({ ...showApiKeys, [provider.id]: !showApiKeys[provider.id] })}
                                >
                                  {showApiKeys[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="ai-apis">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🤖</span>
                            <span className="font-semibold">مزودي الذكاء الاصطناعي</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4">
                          {ALL_AI_PROVIDERS.map((provider) => (
                            <div key={provider.id} className="p-4 border rounded-lg space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <span className={`text-2xl p-2 rounded ${provider.color}`}>{provider.icon}</span>
                                  <div>
                                    <p className="font-semibold">{provider.nameAr}</p>
                                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                                    <Badge variant="secondary" className="mt-1">
                                      {provider.isFree ? 'مجاني' : 'بحسب الخطة'}
                                    </Badge>
                                  </div>
                                </div>
                                {provider.keyUrl ? (
                                  <a
                                    href={provider.keyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1 text-xs"
                                  >
                                    احصل على مفتاح <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : null}
                              </div>
                              <div className="relative">
                                <Input
                                  type={showApiKeys[provider.id] ? 'text' : 'password'}
                                  placeholder={provider.keyPlaceholder || `أدخل مفتاح ${provider.nameAr}...`}
                                  value={apiKeys[provider.id] || ''}
                                  onChange={(e) => setApiKeys({ ...apiKeys, [provider.id]: e.target.value })}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute left-0 top-0 h-full px-3"
                                  onClick={() => setShowApiKeys({ ...showApiKeys, [provider.id]: !showApiKeys[provider.id] })}
                                >
                                  {showApiKeys[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="flex justify-end">
                      <Button onClick={() => void handleSaveApiKeys()} disabled={apiSaving} className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        {apiSaving ? 'جاري حفظ إعدادات API...' : 'حفظ إعدادات API'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Left Column (in RTL) - Stats & Actions */}
            <div className="space-y-6">
              {/* Account Statistics Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    إحصائيات الحساب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">المحافظ</span>
                      </div>
                      <p className="text-2xl font-bold">{accountStats.totalPortfolios}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm text-muted-foreground">المحافظ النشطة</span>
                      </div>
                      <p className="text-2xl font-bold">{accountStats.activePortfolios}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">المعاملات</span>
                      </div>
                      <p className="text-2xl font-bold">{accountStats.totalTransactions}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-muted-foreground">قوائم / عناصر المتابعة</span>
                      </div>
                      <p className="text-base font-bold">{accountStats.totalWatchlists} / {accountStats.totalWatchlistItems}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-muted-foreground">التنبيهات النشطة / الكل</span>
                      </div>
                      <p className="text-base font-bold">{accountStats.activeAlerts} / {accountStats.totalAlerts}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-muted-foreground">إجمالي المراكز</span>
                      </div>
                      <p className="text-2xl font-bold">{accountStats.totalHoldings}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-slate-600" />
                        <span className="text-sm text-muted-foreground">أسهم / مشفر / فوركس</span>
                      </div>
                      <p className="text-base font-bold">
                        {accountStats.totalStocks} / {accountStats.totalCrypto} / {accountStats.totalForex}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-teal-600" />
                        <span className="text-sm text-muted-foreground">سندات / صكوك</span>
                      </div>
                      <p className="text-base font-bold">
                        {accountStats.totalBonds} / {accountStats.totalSukuk}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-rose-600" />
                        <span className="text-sm text-muted-foreground">صناديق / سلع / معادن</span>
                      </div>
                      <p className="text-base font-bold">
                        {accountStats.totalFunds} / {accountStats.totalCommodities} / {accountStats.totalMetals}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">عضو منذ</span>
                      <span className="font-medium">
                        {accountStats.memberSince ? new Date(accountStats.memberSince).toLocaleDateString('ar-SA-u-ca-gregory') : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">آخر تسجيل دخول</span>
                      <span className="font-medium">
                        {accountStats.lastLogin
                          ? new Date(accountStats.lastLogin).toLocaleDateString('ar-SA-u-ca-gregory', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                          : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    إجراءات سريعة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={handleDownloadData}
                  >
                    <Download className="h-5 w-5 text-primary" />
                    <div className="text-right">
                      <p className="font-medium">تحميل بياناتي</p>
                      <p className="text-xs text-muted-foreground">تصدير جميع بياناتك بصيغة JSON</p>
                    </div>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-3 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:border-red-800"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                        <div className="text-right">
                          <p className="font-medium text-red-600">حذف الحساب</p>
                          <p className="text-xs text-muted-foreground">حذف حسابك وجميع بياناتك</p>
                        </div>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-5 w-5" />
                          تأكيد حذف الحساب
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>هل أنت متأكد من حذف حسابك؟</p>
                          <p className="text-red-500 font-medium">⚠️ سيتم حذف جميع بياناتك بشكل دائم ولن تتمكن من استعادتها:</p>
                          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                            <li>جميع المحافظ الاستثمارية</li>
                            <li>سجل المعاملات</li>
                            <li>قوائم المتابعة</li>
                            <li>التنبيهات النشطة</li>
                            <li>الإعدادات والتفضيلات</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          نعم، احذف حسابي
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>

              {/* Security Tips */}
              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Shield className="h-5 w-5" />
                    نصائح الأمان
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p>استخدم كلمة مرور قوية ومميزة</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p>فعّل المصادقة الثنائية لحماية إضافية</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p>راجع نشاط تسجيل الدخول بانتظام</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p>لا تشارك بيانات حسابك مع الآخرين</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
