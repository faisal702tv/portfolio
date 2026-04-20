'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { convertSarToCurrency } from '@/lib/profile-finance';
import { fmtN } from '@/lib/helpers';
import {
  Briefcase,
  TrendingUp,
  FileText,
  Wallet,
  DollarSign,
  BarChart3,
  PieChart,
  RefreshCw,
  Database,
  Activity,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Bitcoin,
  Globe,
  Package,
  History,
  Loader2,
  HardDriveDownload,
  Settings as SettingsIcon,
  Bell,
  Star,
  ShieldCheck,
  BookOpen,
  BellRing,
} from 'lucide-react';

export interface AdminStatsResponse {
  success: boolean;
  system: {
    userCount: number;
    roleCount: number;
    roles: string[];
    portfolioCount: number;
    alertCount: number;
    activeAlertCount: number;
    triggeredAlertCount: number;
    watchlistCount: number;
    watchlistItemCount: number;
    notificationCount: number;
    unreadNotificationCount: number;
    journalCount: number;
    transactionCount: number;
  };
  assets: {
    stockCount: number;
    equitiesCount: number;
    cryptoCount: number;
    forexCount: number;
    bondCount: number;
    fundCount: number;
    commoditiesCount: number;
    sellHistoryCount: number;
    totalFundRows: number;
  };
  financial: {
    totalInvested: number;
    currentValue: number;
    profitLoss: number;
    profitLossPct: number;
    stocksInvested: number;
    stocksValue: number;
    bondsInvested: number;
    bondsValue: number;
    fundsInvested: number;
    fundsValue: number;
  };
}

interface AdminStatCard {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  href: string;
}

interface AdminProjectOverviewPanelProps {
  token?: string | null;
  title?: string;
  description?: string;
  manualInvestedCapitalSar?: number | null;
  displayCurrency?: string;
}

export function AdminProjectOverviewPanel({
  token,
  title = 'نظرة شاملة على المشروع',
  description = 'إحصاءات تجميعية لكل المحافظ والأصول والمستخدمين في قاعدة البيانات',
  manualInvestedCapitalSar = null,
  displayCurrency = 'SAR',
}: AdminProjectOverviewPanelProps) {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const resolvedToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      const res = await fetch('/api/admin/stats', {
        headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`فشل الاتصال بالخادم (${res.status})`);
      }
      const data = (await res.json()) as AdminStatsResponse;
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل إحصاءات النظام');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const system = stats?.system;
  const assets = stats?.assets;
  const financial = stats?.financial;

  const effectiveInvestedSar = useMemo(() => {
    if (typeof manualInvestedCapitalSar === 'number' && Number.isFinite(manualInvestedCapitalSar) && manualInvestedCapitalSar > 0) {
      return manualInvestedCapitalSar;
    }
    return financial?.totalInvested ?? 0;
  }, [manualInvestedCapitalSar, financial?.totalInvested]);

  const effectiveProfitLoss = useMemo(() => (financial?.currentValue ?? 0) - effectiveInvestedSar, [financial?.currentValue, effectiveInvestedSar]);
  const effectiveProfitLossPct = useMemo(
    () => (effectiveInvestedSar > 0 ? (effectiveProfitLoss / effectiveInvestedSar) * 100 : 0),
    [effectiveInvestedSar, effectiveProfitLoss]
  );

  const manualCapitalDifference = useMemo(() => {
    if (typeof manualInvestedCapitalSar !== 'number' || !Number.isFinite(manualInvestedCapitalSar) || manualInvestedCapitalSar <= 0) {
      return null;
    }
    return manualInvestedCapitalSar - (financial?.totalInvested ?? 0);
  }, [manualInvestedCapitalSar, financial?.totalInvested]);

  const manualDisplayValue = useMemo(() => {
    if (typeof manualInvestedCapitalSar !== 'number' || manualInvestedCapitalSar <= 0) return 0;
    return convertSarToCurrency(manualInvestedCapitalSar, displayCurrency);
  }, [manualInvestedCapitalSar, displayCurrency]);

  const adminMetricCards = useMemo(
    () => [
      {
        title: 'مستخدم مسجل',
        value: system?.userCount ?? 0,
        icon: <Users className="h-5 w-5" />,
        color: 'text-indigo-500',
      },
      {
        title: 'مجموعات صلاحيات',
        value: system?.roleCount ?? 0,
        icon: <ShieldCheck className="h-5 w-5" />,
        color: 'text-teal-500',
      },
      {
        title: 'محافظ بالمشروع',
        value: system?.portfolioCount ?? 0,
        icon: <Briefcase className="h-5 w-5" />,
        color: 'text-blue-500',
      },
      {
        title: 'تنبيهات إجمالية',
        value: system?.alertCount ?? 0,
        icon: <BellRing className="h-5 w-5" />,
        color: 'text-amber-500',
      },
    ],
    [system]
  );

  const statCards: AdminStatCard[] = useMemo(
    () => [
      { title: 'محافظ', value: system?.portfolioCount ?? 0, icon: <Briefcase className="h-5 w-5" />, color: 'text-blue-500', href: '/portfolios' },
      { title: 'أسهم', value: assets?.equitiesCount ?? 0, icon: <TrendingUp className="h-5 w-5" />, color: 'text-green-500', href: '/stocks' },
      { title: 'سندات وصكوك', value: assets?.bondCount ?? 0, icon: <FileText className="h-5 w-5" />, color: 'text-amber-500', href: '/bonds' },
      { title: 'صناديق', value: assets?.fundCount ?? 0, icon: <Wallet className="h-5 w-5" />, color: 'text-purple-500', href: '/funds' },
      { title: 'عملات مشفرة', value: assets?.cryptoCount ?? 0, icon: <Bitcoin className="h-5 w-5" />, color: 'text-orange-500', href: '/crypto' },
      { title: 'فوركس', value: assets?.forexCount ?? 0, icon: <Globe className="h-5 w-5" />, color: 'text-cyan-500', href: '/forex' },
      { title: 'سلع', value: assets?.commoditiesCount ?? 0, icon: <Package className="h-5 w-5" />, color: 'text-emerald-500', href: '/commodities' },
      { title: 'سجل البيع', value: assets?.sellHistoryCount ?? 0, icon: <History className="h-5 w-5" />, color: 'text-rose-500', href: '/sell-history' },
    ],
    [system, assets]
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {error && (
            <Card className="border-destructive/50">
              <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {(manualInvestedCapitalSar ?? 0) > 0 ? 'رأس المال المستثمر الفعلي' : 'رأس المال المستثمر'}
                    </p>
                    <p className="text-2xl font-bold">{fmtN(effectiveInvestedSar)} ر.س</p>
                    {(manualInvestedCapitalSar ?? 0) > 0 && displayCurrency.toUpperCase() !== 'SAR' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ≈ {fmtN(manualDisplayValue)} {displayCurrency.toUpperCase()}
                      </p>
                    )}
                    {manualCapitalDifference !== null && (
                      <p className={`text-xs mt-1 ${manualCapitalDifference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        الفرق عن الحساب الآلي: {manualCapitalDifference >= 0 ? '+' : ''}{fmtN(manualCapitalDifference)} ر.س
                      </p>
                    )}
                  </div>
                  <DollarSign className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-chart-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">القيمة السوقية</p>
                    <p className="text-2xl font-bold">{fmtN(financial?.currentValue ?? 0)} ر.س</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-chart-2 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${effectiveProfitLoss >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الربح / الخسارة</p>
                    <p className={`text-2xl font-bold ${effectiveProfitLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {effectiveProfitLoss >= 0 ? '+' : ''}{fmtN(effectiveProfitLoss)} ر.س
                    </p>
                    <Badge variant={effectiveProfitLoss >= 0 ? 'default' : 'destructive'} className="mt-1">
                      {effectiveProfitLoss >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                      {effectiveProfitLossPct.toFixed(2)}%
                    </Badge>
                  </div>
                  <PieChart className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {adminMetricCards.map((card) => (
              <Card key={card.title} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className={`mx-auto mb-2 ${card.color}`}>{card.icon}</div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {statCards.map((card) => (
              <Link key={card.title} href={card.href} className="block">
                <Card className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer h-full">
                  <CardContent className="pt-6 text-center">
                    <div className={`mx-auto mb-2 ${card.color}`}>{card.icon}</div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  معلومات النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">قاعدة البيانات</span>
                  <Badge variant="outline">SQLite + Prisma</Badge>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">الإطار</span>
                  <Badge variant="outline">Next.js 16</Badge>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">اللغة</span>
                  <Badge variant="outline">TypeScript</Badge>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">إجمالي المعاملات</span>
                  <Badge variant="outline">{system?.transactionCount ?? 0}</Badge>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">تنبيهات نشطة</span>
                  <Badge variant="outline">{system?.activeAlertCount ?? 0} / {system?.alertCount ?? 0}</Badge>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">قوائم المتابعة</span>
                  <Badge variant="outline">{system?.watchlistCount ?? 0} ({system?.watchlistItemCount ?? 0} عنصر)</Badge>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">إشعارات غير مقروءة</span>
                  <Badge variant="outline">{system?.unreadNotificationCount ?? 0} / {system?.notificationCount ?? 0}</Badge>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">مذكرات التداول</span>
                  <Badge variant="outline">{system?.journalCount ?? 0}</Badge>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">الإصدار</span>
                  <Badge>v5.0.0</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  إجراءات سريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => loadStats()}>
                  <RefreshCw className="h-4 w-4" /> تحديث البيانات
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push('/backup')}>
                  <HardDriveDownload className="h-4 w-4" /> النسخ الاحتياطي
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push('/portfolios')}>
                  <Briefcase className="h-4 w-4" /> إدارة المحافظ
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push('/profile')}>
                  <Users className="h-4 w-4" /> إدارة المستخدمين
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push('/alerts')}>
                  <Bell className="h-4 w-4" /> التنبيهات
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push('/watchlist')}>
                  <Star className="h-4 w-4" /> قائمة المتابعة
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push('/database')}>
                  <Database className="h-4 w-4" /> قاعدة البيانات
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push('/settings')}>
                  <SettingsIcon className="h-4 w-4" /> الإعدادات
                </Button>
              </CardContent>
            </Card>
          </div>

          {system && system.roles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-5 w-5" />
                  مجموعات الصلاحيات المُفعّلة
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {system.roles.map((role) => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

