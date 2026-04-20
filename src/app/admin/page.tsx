'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AdminProjectOverviewPanel } from '@/components/admin/AdminProjectOverviewPanel';
import { AccessControlManager } from '@/components/admin/AccessControlManager';
import { parseActualInvestedCapitalSar, parseProfileDefaultCurrency } from '@/lib/profile-finance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertTriangle,
  Calculator,
  Database,
  Download,
  Eye,
  EyeOff,
  Globe,
  Info,
  Key,
  Landmark,
  LayoutDashboard,
  Percent,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  User,
} from 'lucide-react';

type TaxMarketConfig = {
  name: string;
  nameEn: string;
  flag: string;
  info: string;
  brokerage: number;
  vatOnBrokerage: number;
  capitalGains: number;
  dividendWithholding: number;
  bondInterestWithholding: number;
  zakat: number;
};

type TaxSettingsState = Record<string, TaxMarketConfig>;

type AdminGeneralSettings = {
  language: 'ar' | 'en';
  currency: string;
  autoSync: boolean;
  autoPriceRefresh: boolean;
};

const GENERAL_SETTINGS_STORAGE_KEY = 'admin_general_settings';
const TAX_SETTINGS_STORAGE_KEY = 'tax_settings';

const TAX_CONFIG: TaxSettingsState = {
  saudi: {
    name: 'السعودية',
    nameEn: 'Saudi Arabia',
    flag: '🇸🇦',
    info: 'لا ضريبة أرباح رأسمالية للمقيمين — زكاة 2.5% سنوياً',
    brokerage: 0.15,
    vatOnBrokerage: 15,
    capitalGains: 0,
    dividendWithholding: 0,
    bondInterestWithholding: 0,
    zakat: 2.5,
  },
  uae: {
    name: 'الإمارات',
    nameEn: 'UAE',
    flag: '🇦🇪',
    info: '0% ضريبة أرباح — VAT 5% على العمولات',
    brokerage: 0.15,
    vatOnBrokerage: 5,
    capitalGains: 0,
    dividendWithholding: 0,
    bondInterestWithholding: 0,
    zakat: 0,
  },
  kuwait: {
    name: 'الكويت',
    nameEn: 'Kuwait',
    flag: '🇰🇼',
    info: 'لا ضريبة على المستثمرين الأفراد',
    brokerage: 0.175,
    vatOnBrokerage: 0,
    capitalGains: 0,
    dividendWithholding: 0,
    bondInterestWithholding: 0,
    zakat: 0,
  },
  qatar: {
    name: 'قطر',
    nameEn: 'Qatar',
    flag: '🇶🇦',
    info: '0% ضريبة أرباح رأسمالية',
    brokerage: 0.2,
    vatOnBrokerage: 0,
    capitalGains: 0,
    dividendWithholding: 0,
    bondInterestWithholding: 0,
    zakat: 0,
  },
  bahrain: {
    name: 'البحرين',
    nameEn: 'Bahrain',
    flag: '🇧🇭',
    info: '0% ضريبة — VAT 10% على الخدمات',
    brokerage: 0.1,
    vatOnBrokerage: 10,
    capitalGains: 0,
    dividendWithholding: 0,
    bondInterestWithholding: 0,
    zakat: 0,
  },
  egypt: {
    name: 'مصر',
    nameEn: 'Egypt',
    flag: '🇪🇬',
    info: '10% ضريبة أرباح رأسمالية + 10% على التوزيعات — 20% على فوائد الأوراق المالية',
    brokerage: 0.15,
    vatOnBrokerage: 14,
    capitalGains: 10,
    dividendWithholding: 10,
    bondInterestWithholding: 20,
    zakat: 0,
  },
  usa: {
    name: 'أمريكا',
    nameEn: 'USA',
    flag: '🇺🇸',
    info: '15% CGT طويل الأمد — 30% حجب على التوزيعات للأجانب (W-8BEN قد يخفضها)',
    brokerage: 0.1,
    vatOnBrokerage: 0,
    capitalGains: 15,
    dividendWithholding: 30,
    bondInterestWithholding: 30,
    zakat: 0,
  },
  oman: {
    name: 'عُمان',
    nameEn: 'Oman',
    flag: '🇴🇲',
    info: '0% ضريبة على المستثمرين',
    brokerage: 0.15,
    vatOnBrokerage: 5,
    capitalGains: 0,
    dividendWithholding: 0,
    bondInterestWithholding: 0,
    zakat: 0,
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function safeNumber(value: unknown, fallback: number): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function readLocalTaxSettings(): TaxSettingsState {
  if (typeof window === 'undefined') return TAX_CONFIG;

  try {
    const raw = localStorage.getItem(TAX_SETTINGS_STORAGE_KEY);
    if (!raw) return TAX_CONFIG;
    const parsed = asRecord(JSON.parse(raw));
    const merged: TaxSettingsState = JSON.parse(JSON.stringify(TAX_CONFIG));

    for (const key of Object.keys(merged)) {
      const stored = asRecord(parsed[key]);
      merged[key] = {
        ...merged[key],
        brokerage: safeNumber(stored.brokerage, merged[key].brokerage),
        vatOnBrokerage: safeNumber(stored.vatOnBrokerage, merged[key].vatOnBrokerage),
        capitalGains: safeNumber(stored.capitalGains, merged[key].capitalGains),
        dividendWithholding: safeNumber(stored.dividendWithholding, merged[key].dividendWithholding),
        bondInterestWithholding: safeNumber(stored.bondInterestWithholding, merged[key].bondInterestWithholding),
        zakat: safeNumber(stored.zakat, merged[key].zakat),
      };
    }

    return merged;
  } catch {
    return TAX_CONFIG;
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { token, user, isLoading } = useAuth();

  const [manualInvestedCapitalSar, setManualInvestedCapitalSar] = useState<number | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState('SAR');
  const [accountSaving, setAccountSaving] = useState(false);
  const [profilePreferences, setProfilePreferences] = useState<Record<string, unknown>>({});
  const [accountInfo, setAccountInfo] = useState({
    username: '',
    email: '',
    displayName: '',
    companyName: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [generalSettings, setGeneralSettings] = useState<AdminGeneralSettings>({
    language: 'ar',
    currency: 'SAR',
    autoSync: true,
    autoPriceRefresh: true,
  });
  const [taxSettings, setTaxSettings] = useState<TaxSettingsState>(TAX_CONFIG);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingTaxes, setSavingTaxes] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [importingData, setImportingData] = useState(false);
  const [purgingData, setPurgingData] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isLoading) return;
    if (user && !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isLoading, router, user]);

  useEffect(() => {
    if (!token || !isAdmin) return;

    const loadProfileCapital = async () => {
      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) return;

        const payload = await res.json().catch(() => null);
        const profile = asRecord(payload?.profile);
        const preferences = asRecord(profile.preferences);

        const parsedCapital = parseActualInvestedCapitalSar(preferences);
        const parsedCurrency = parseProfileDefaultCurrency(preferences, 'SAR');

        setProfilePreferences(preferences);
        setAccountInfo({
          username: typeof profile.username === 'string' ? profile.username : '',
          email: typeof profile.email === 'string' ? profile.email : '',
          displayName: typeof profile.name === 'string' ? profile.name : '',
          companyName: typeof preferences.companyName === 'string' ? preferences.companyName : '',
          phone: typeof preferences.phone === 'string' ? preferences.phone : '',
        });
        setManualInvestedCapitalSar(parsedCapital);
        setDisplayCurrency(parsedCurrency);
        setGeneralSettings((prev) => ({
          ...prev,
          currency: parsedCurrency || prev.currency,
          language: (preferences.language === 'en' ? 'en' : 'ar') as AdminGeneralSettings['language'],
          autoSync: preferences.autoSync === false ? false : prev.autoSync,
          autoPriceRefresh: preferences.autoPriceRefresh === false ? false : prev.autoPriceRefresh,
        }));
      } catch {
        // Ignore profile fetch errors in admin page (non-blocking enhancement).
      }
    };

    void loadProfileCapital();
  }, [isAdmin, token]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const rawGeneral = localStorage.getItem(GENERAL_SETTINGS_STORAGE_KEY);
      if (rawGeneral) {
        const parsed = asRecord(JSON.parse(rawGeneral));
        setGeneralSettings((prev) => ({
          language: parsed.language === 'en' ? 'en' : 'ar',
          currency: typeof parsed.currency === 'string' && parsed.currency ? parsed.currency : prev.currency,
          autoSync: parsed.autoSync === false ? false : true,
          autoPriceRefresh: parsed.autoPriceRefresh === false ? false : true,
        }));
      }
    } catch {
      // ignore invalid local settings
    }

    setTaxSettings(readLocalTaxSettings());
  }, []);

  const taxRows = useMemo(() => Object.entries(taxSettings), [taxSettings]);

  const handleSaveGeneralSettings = () => {
    setSavingGeneral(true);
    try {
      localStorage.setItem(GENERAL_SETTINGS_STORAGE_KEY, JSON.stringify(generalSettings));
      setDisplayCurrency(generalSettings.currency);
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ الإعدادات العامة للوحة الإدارة بنجاح.',
      });
    } catch {
      toast({
        title: 'فشل الحفظ',
        description: 'تعذر حفظ الإعدادات العامة محليًا.',
        variant: 'destructive',
      });
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!token) {
      toast({
        title: 'غير مصرح',
        description: 'يرجى تسجيل الدخول أولاً',
        variant: 'destructive',
      });
      return;
    }

    setAccountSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: accountInfo.displayName,
          email: accountInfo.email,
          username: accountInfo.username,
          preferences: {
            ...profilePreferences,
            companyName: accountInfo.companyName,
            phone: accountInfo.phone,
          },
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'فشل حفظ الحساب');
      }

      const updatedProfile = payload?.profile;
      if (updatedProfile && typeof updatedProfile === 'object') {
        const updatedPrefs =
          updatedProfile.preferences && typeof updatedProfile.preferences === 'object' && !Array.isArray(updatedProfile.preferences)
            ? (updatedProfile.preferences as Record<string, unknown>)
            : {};
        setProfilePreferences(updatedPrefs);
      }

      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser) as Record<string, unknown>;
          const nextUser = {
            ...parsed,
            email: accountInfo.email,
            username: accountInfo.username,
            name: accountInfo.displayName || null,
          };
          localStorage.setItem('user', JSON.stringify(nextUser));
        }
      } catch {
        // no-op
      }

      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ معلومات الحساب بنجاح',
      });
    } catch (error) {
      toast({
        title: 'فشل الحفظ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ الحساب',
        variant: 'destructive',
      });
    } finally {
      setAccountSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new.length < 8) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 8 خانات على الأقل',
        variant: 'destructive',
      });
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور الجديدة غير متطابقة',
        variant: 'destructive',
      });
      return;
    }

    if (!token) {
      toast({
        title: 'غير مصرح',
        description: 'يرجى تسجيل الدخول أولاً',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || 'فشل تغيير كلمة المرور');
      }

      toast({
        title: 'تم التغيير',
        description: 'تم تغيير كلمة المرور بنجاح',
      });
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast({
        title: 'فشل تغيير كلمة المرور',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  const handleSaveTaxSettings = () => {
    setSavingTaxes(true);
    try {
      localStorage.setItem(TAX_SETTINGS_STORAGE_KEY, JSON.stringify(taxSettings));
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ إعدادات الضرائب والرسوم بنجاح.',
      });
    } catch {
      toast({
        title: 'فشل الحفظ',
        description: 'تعذر حفظ إعدادات الضرائب.',
        variant: 'destructive',
      });
    } finally {
      setSavingTaxes(false);
    }
  };

  const handleUpdateTaxField = (marketKey: string, field: keyof TaxMarketConfig, value: number) => {
    setTaxSettings((prev) => ({
      ...prev,
      [marketKey]: {
        ...prev[marketKey],
        [field]: Number.isFinite(value) ? value : 0,
      },
    }));
  };

  const handleExportData = async () => {
    if (!token) {
      toast({ title: 'غير مصرح', description: 'يرجى تسجيل الدخول أولاً.', variant: 'destructive' });
      return;
    }

    setExportingData(true);
    try {
      const res = await fetch('/api/portfolio/backup', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`فشل التصدير (${res.status})`);
      const payload = await res.json();

      const blob = new Blob(
        [
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              source: 'admin',
              ...payload,
            },
            null,
            2,
          ),
        ],
        { type: 'application/json;charset=utf-8' },
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast({ title: 'تم التصدير', description: 'تم تنزيل نسخة احتياطية من البيانات بنجاح.' });
    } catch (error) {
      toast({
        title: 'فشل التصدير',
        description: error instanceof Error ? error.message : 'تعذر تصدير البيانات.',
        variant: 'destructive',
      });
    } finally {
      setExportingData(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!token) {
      toast({ title: 'غير مصرح', description: 'يرجى تسجيل الدخول أولاً.', variant: 'destructive' });
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setImportingData(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const snapshot = asRecord(parsed.snapshot ?? parsed);
      if (!snapshot || Object.keys(snapshot).length === 0) {
        throw new Error('ملف النسخة الاحتياطية غير صالح.');
      }

      const portfolioId =
        typeof parsed.portfolioId === 'string'
          ? parsed.portfolioId
          : typeof snapshot.portfolioId === 'string'
            ? snapshot.portfolioId
            : null;

      const res = await fetch('/api/portfolio/backup', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          portfolioId,
          snapshot,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(typeof payload?.error === 'string' ? payload.error : `فشل الاستيراد (${res.status})`);
      }

      toast({ title: 'تم الاستيراد', description: 'تم استيراد النسخة الاحتياطية بنجاح.' });
      router.refresh();
    } catch (error) {
      toast({
        title: 'فشل الاستيراد',
        description: error instanceof Error ? error.message : 'تعذر استيراد النسخة الاحتياطية.',
        variant: 'destructive',
      });
    } finally {
      setImportingData(false);
      event.target.value = '';
    }
  };

  const handleClearCache = () => {
    try {
      const keysToClear = [
        'live_prices_cache',
        'market_prices_cache',
        'global_ticker_cache',
        'dashboard_cache',
      ];
      let deleted = 0;
      for (const key of keysToClear) {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          deleted += 1;
        }
      }
      toast({
        title: 'تم مسح الكاش',
        description: deleted > 0 ? `تم حذف ${deleted} عنصرًا من البيانات المؤقتة.` : 'لا توجد بيانات مؤقتة للحذف.',
      });
    } catch {
      toast({
        title: 'تعذر مسح الكاش',
        description: 'حدث خطأ أثناء حذف البيانات المؤقتة.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAllData = async () => {
    if (!token) {
      toast({ title: 'غير مصرح', description: 'يرجى تسجيل الدخول أولاً.', variant: 'destructive' });
      return;
    }
    const confirmed = window.confirm('هل أنت متأكد من حذف جميع بيانات المحافظ وسجل البيع؟ لا يمكن التراجع عن هذا الإجراء.');
    if (!confirmed) return;

    setPurgingData(true);
    try {
      const listRes = await fetch('/api/portfolio/backup', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!listRes.ok) throw new Error(`تعذر قراءة المحافظ (${listRes.status})`);
      const listPayload = await listRes.json();
      const portfolios: Array<{ id: string }> = Array.isArray(listPayload?.portfolios) ? listPayload.portfolios : [];

      if (portfolios.length === 0) {
        toast({ title: 'لا توجد محافظ', description: 'لا توجد بيانات قابلة للحذف.' });
        return;
      }

      for (const portfolio of portfolios) {
        const snapRes = await fetch(`/api/portfolio/backup?portfolioId=${encodeURIComponent(portfolio.id)}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!snapRes.ok) throw new Error(`تعذر تحميل بيانات محفظة (${portfolio.id})`);
        const snapPayload = await snapRes.json();
        const snapshot = asRecord(snapPayload?.snapshot);

        const emptySnapshot = {
          ...snapshot,
          stocks: [],
          bonds: [],
          funds: [],
          sellHistory: [],
          exportedAt: new Date().toISOString(),
        };

        const saveRes = await fetch('/api/portfolio/backup', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            portfolioId: portfolio.id,
            snapshot: emptySnapshot,
          }),
        });
        if (!saveRes.ok) throw new Error(`تعذر حذف بيانات محفظة (${portfolio.id})`);
      }

      toast({ title: 'تم الحذف', description: 'تم حذف جميع بيانات المحافظ وسجل البيع بنجاح.' });
      router.refresh();
    } catch (error) {
      toast({
        title: 'فشل الحذف',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء حذف البيانات.',
        variant: 'destructive',
      });
    } finally {
      setPurgingData(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        لا تملك صلاحية الوصول إلى لوحة الإدارة. جار التحويل...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="لوحة الإدارة" />
        <main className="p-6 space-y-6 text-right">
          <Card className="border-slate-300/70 bg-gradient-to-l from-background via-slate-50 to-blue-50/70 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                مركز تحكم الإدارة
              </CardTitle>
              <CardDescription>
                إدارة المشروع والإعدادات العامة والضرائب والبيانات من لوحة موحدة بصلاحيات المدير.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">Admin Only</Badge>
              <Badge variant="outline">إدارة مؤسسية</Badge>
              <Badge variant="outline">إعدادات مركزية</Badge>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
              <TabsTrigger value="overview" className="gap-2"><LayoutDashboard className="h-4 w-4" /> نظرة عامة</TabsTrigger>
              <TabsTrigger value="account" className="gap-2"><User className="h-4 w-4" /> الحساب</TabsTrigger>
              <TabsTrigger value="general" className="gap-2"><Settings className="h-4 w-4" /> عام</TabsTrigger>
              <TabsTrigger value="taxes" className="gap-2"><Calculator className="h-4 w-4" /> الضرائب</TabsTrigger>
              <TabsTrigger value="data" className="gap-2"><Database className="h-4 w-4" /> البيانات</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <AdminProjectOverviewPanel
                token={token}
                manualInvestedCapitalSar={manualInvestedCapitalSar}
                displayCurrency={displayCurrency}
              />
            </TabsContent>

            <TabsContent value="account" className="space-y-6" dir="rtl">
              <Card className="border-slate-300/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> معلومات حساب الإدارة</CardTitle>
                  <CardDescription>إدارة بيانات حساب المدير وصلاحياته المركزية.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                      {(accountInfo.displayName || accountInfo.username || user?.username || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{accountInfo.displayName || accountInfo.username || user?.username || 'المستخدم'}</p>
                      <p className="text-sm text-muted-foreground">مدير النظام</p>
                    </div>
                    <Badge variant="secondary" className="mr-auto">Admin</Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم المستخدم</Label>
                      <Input
                        value={accountInfo.username}
                        onChange={(event) => setAccountInfo((prev) => ({ ...prev, username: event.target.value }))}
                        placeholder="اسم المستخدم"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input
                        value={accountInfo.email}
                        onChange={(event) => setAccountInfo((prev) => ({ ...prev, email: event.target.value }))}
                        type="email"
                        placeholder="name@example.com"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الاسم المعروض</Label>
                      <Input
                        value={accountInfo.displayName}
                        onChange={(event) => setAccountInfo((prev) => ({ ...prev, displayName: event.target.value }))}
                        placeholder="اسم العرض"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>اسم الشركة</Label>
                      <Input
                        value={accountInfo.companyName}
                        onChange={(event) => setAccountInfo((prev) => ({ ...prev, companyName: event.target.value }))}
                        placeholder="اسم الشركة"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input
                        value={accountInfo.phone}
                        onChange={(event) => setAccountInfo((prev) => ({ ...prev, phone: event.target.value }))}
                        type="tel"
                        placeholder="+966 5X XXX XXXX"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveAccount} disabled={accountSaving} className="gap-2">
                      <Save className="h-4 w-4" />
                      {accountSaving ? 'جاري الحفظ...' : 'حفظ بيانات الحساب'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <AccessControlManager token={token} enabled={user?.role === 'admin'} />

              <Card className="border-slate-300/70">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> الأمان</CardTitle>
                  <CardDescription>تغيير كلمة المرور وإدارة حماية الحساب الإداري.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      تغيير كلمة المرور
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>كلمة المرور الحالية</Label>
                        <div className="relative">
                          <Input
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.current}
                            onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                            placeholder="••••••••"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>كلمة المرور الجديدة</Label>
                        <div className="relative">
                          <Input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.new}
                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                            placeholder="8 خانات على الأقل"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                          >
                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>تأكيد كلمة المرور</Label>
                        <div className="relative">
                          <Input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirm}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                            placeholder="أعد كتابة كلمة المرور"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                          >
                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">التحقق بخطوتين</p>
                      <p className="text-sm text-muted-foreground">إضافة طبقة حماية إضافية لحساب الإدارة.</p>
                    </div>
                    <Button variant="outline">تفعيل</Button>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => void handleChangePassword()} className="gap-2">
                      <Key className="h-4 w-4" />
                      تغيير كلمة المرور
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="general" className="space-y-6" dir="rtl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> الإعدادات العامة (الإدارة)</CardTitle>
                  <CardDescription>تحديد إعدادات التشغيل الافتراضية الخاصة بواجهة الإدارة.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>اللغة</Label>
                      <Select value={generalSettings.language} onValueChange={(value) => setGeneralSettings((prev) => ({ ...prev, language: value === 'en' ? 'en' : 'ar' }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>العملة الافتراضية</Label>
                      <Select value={generalSettings.currency} onValueChange={(value) => setGeneralSettings((prev) => ({ ...prev, currency: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                          <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                          <SelectItem value="KWD">دينار كويتي (KWD)</SelectItem>
                          <SelectItem value="QAR">ريال قطري (QAR)</SelectItem>
                          <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                          <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">التزامن التلقائي</p>
                      <p className="text-sm text-muted-foreground">مزامنة بيانات النظام تلقائيًا كل فترة.</p>
                    </div>
                    <Switch checked={generalSettings.autoSync} onCheckedChange={(checked) => setGeneralSettings((prev) => ({ ...prev, autoSync: checked }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">التحديث التلقائي للأسعار</p>
                      <p className="text-sm text-muted-foreground">تحديث الأسعار في لوحات العرض بدون تدخل يدوي.</p>
                    </div>
                    <Switch checked={generalSettings.autoPriceRefresh} onCheckedChange={(checked) => setGeneralSettings((prev) => ({ ...prev, autoPriceRefresh: checked }))} />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveGeneralSettings} disabled={savingGeneral} className="gap-2">
                      <Save className="h-4 w-4" />
                      {savingGeneral ? 'جاري الحفظ...' : 'حفظ الإعدادات العامة'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="taxes" className="space-y-6" dir="rtl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    الضرائب والرسوم — لكل سوق
                  </CardTitle>
                  <CardDescription>
                    تُطبَّق تلقائيًا في عمليات الشراء والبيع في جميع صفحات الأصول.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg mb-6">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      المصطلحات
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                      <div className="flex items-center gap-2"><Landmark className="h-4 w-4" /><span>🏦 عمولة السمسرة %</span></div>
                      <div className="flex items-center gap-2"><Percent className="h-4 w-4" /><span>📊 VAT على العمولة</span></div>
                      <div className="flex items-center gap-2"><Calculator className="h-4 w-4" /><span>📈 CGT ضريبة الأرباح</span></div>
                      <div className="flex items-center gap-2"><span>💸 حجب التوزيعات</span></div>
                      <div className="flex items-center gap-2"><span>📜 حجب فوائد السندات</span></div>
                      <div className="flex items-center gap-2"><span>🕌 زكاة % سنويًا</span></div>
                    </div>
                  </div>

                  <Accordion type="multiple" className="space-y-4" dir="rtl">
                    {taxRows.map(([key, config]) => (
                      <AccordionItem key={key} value={key}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{config.flag}</span>
                            <span className="font-semibold">{config.name}</span>
                            {key === 'saudi' && <Badge variant="default">السوق الرئيسي</Badge>}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="p-3 bg-muted/50 rounded-lg mb-4 flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{config.info}</p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">🏦 عمولة السمسرة %</Label>
                              <Input type="number" step="0.01" value={config.brokerage} onChange={(e) => handleUpdateTaxField(key, 'brokerage', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">📊 VAT على العمولة %</Label>
                              <Input type="number" step="0.01" value={config.vatOnBrokerage} onChange={(e) => handleUpdateTaxField(key, 'vatOnBrokerage', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">📈 ضريبة الأرباح %</Label>
                              <Input type="number" step="0.01" value={config.capitalGains} onChange={(e) => handleUpdateTaxField(key, 'capitalGains', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">💸 حجب التوزيعات %</Label>
                              <Input type="number" step="0.01" value={config.dividendWithholding} onChange={(e) => handleUpdateTaxField(key, 'dividendWithholding', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">📜 حجب فوائد السندات %</Label>
                              <Input type="number" step="0.01" value={config.bondInterestWithholding} onChange={(e) => handleUpdateTaxField(key, 'bondInterestWithholding', Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">🕌 زكاة %</Label>
                              <Input type="number" step="0.01" value={config.zakat} onChange={(e) => handleUpdateTaxField(key, 'zakat', Number(e.target.value))} />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveTaxSettings} disabled={savingTaxes} className="gap-2">
                      <Save className="h-4 w-4" />
                      {savingTaxes ? 'جاري الحفظ...' : 'حفظ إعدادات الضرائب'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📊 ملخص مقارن لجميع الأسواق</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-3">السوق</th>
                          <th className="text-center p-3">عمولة</th>
                          <th className="text-center p-3">VAT</th>
                          <th className="text-center p-3">CGT</th>
                          <th className="text-center p-3">حجب توزيعات</th>
                          <th className="text-center p-3">حجب سندات</th>
                          <th className="text-center p-3">زكاة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxRows.map(([key, config]) => (
                          <tr key={key} className="border-b hover:bg-muted/50">
                            <td className="p-3">{config.flag} {config.name}</td>
                            <td className="text-center p-3">{config.brokerage}%</td>
                            <td className="text-center p-3">{config.vatOnBrokerage}%</td>
                            <td className="text-center p-3">{config.capitalGains || '—'}</td>
                            <td className="text-center p-3">{config.dividendWithholding || '—'}</td>
                            <td className="text-center p-3">{config.bondInterestWithholding || '—'}</td>
                            <td className="text-center p-3">{config.zakat || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6" dir="rtl">
              <Card>
                <CardHeader>
                  <CardTitle>إدارة البيانات</CardTitle>
                  <CardDescription>عمليات النسخ الاحتياطي والصيانة التشغيلية لبيانات المحافظ.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">تصدير البيانات</p>
                      <p className="text-sm text-muted-foreground">تنزيل نسخة احتياطية كاملة بصيغة JSON.</p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => void handleExportData()} disabled={exportingData}>
                      <Download className="h-4 w-4" />
                      {exportingData ? 'جاري التصدير...' : 'تصدير'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">استيراد البيانات</p>
                      <p className="text-sm text-muted-foreground">استيراد نسخة احتياطية من ملف JSON.</p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => importInputRef.current?.click()} disabled={importingData}>
                      <Upload className="h-4 w-4" />
                      {importingData ? 'جاري الاستيراد...' : 'استيراد'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">مسح الكاش</p>
                      <p className="text-sm text-muted-foreground">حذف البيانات المؤقتة فقط دون المساس ببيانات المحافظ.</p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={handleClearCache}>
                      <RefreshCw className="h-4 w-4" />
                      مسح
                    </Button>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-red-300/60 bg-red-50/40 p-4 dark:bg-red-950/10">
                    <div>
                      <p className="font-medium text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        حذف جميع بيانات المحافظ
                      </p>
                      <p className="text-sm text-muted-foreground">يشمل الأسهم والسندات والصناديق وسجل البيع لكل المحافظ.</p>
                    </div>
                    <Button variant="destructive" className="gap-2" onClick={() => void handleDeleteAllData()} disabled={purgingData}>
                      <Trash2 className="h-4 w-4" />
                      {purgingData ? 'جاري الحذف...' : 'حذف شامل'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(event) => void handleImportData(event)}
          />
        </main>
      </div>
    </div>
  );
}
