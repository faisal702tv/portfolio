'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MarketTicker, MarketOverviewBar } from '@/components/dashboard/MarketTicker';
import {
  AssetAllocationChart,
  SectorAllocationChart,
  PortfolioValueChart,
  AssetComparisonChart,
} from '@/components/dashboard/Charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { convertCurrency, formatCurrencyByCode, formatNumber, formatPercent } from '@/lib/helpers';
import Image from 'next/image';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Wallet,
  Landmark,
  Coins,
  Globe,
  ChevronLeft,
  CircleDollarSign,
  Gem,
  Building2,
  Shield,
  Activity,
  Loader2,
  PieChart,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function SectionSkeleton({ height = 200 }: { height?: number }) {
  return (
    <Card className="border-2 animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-muted" />
          <div className="space-y-1">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
        </div>
      </CardHeader>
      <CardContent><div className="bg-muted rounded" style={{ height }} /></CardContent>
    </Card>
  );
}

const CURRENCY_OPTIONS = [
  { code: 'SAR', label: 'ر.س (SAR) - ريال سعودي' },
  { code: 'AED', label: 'د.إ (AED) - درهم إماراتي' },
  { code: 'KWD', label: 'د.ك (KWD) - دينار كويتي' },
  { code: 'QAR', label: 'ر.ق (QAR) - ريال قطري' },
  { code: 'BHD', label: 'د.ب (BHD) - دينار بحريني' },
  { code: 'OMR', label: 'ر.ع (OMR) - ريال عماني' },
  { code: 'JOD', label: 'د.أ (JOD) - دينار أردني' },
  { code: 'EGP', label: 'ج.م (EGP) - جنيه مصري' },
  { code: 'USD', label: '$ (USD) - دولار أمريكي' },
  { code: 'EUR', label: '€ (EUR) - يورو' },
  { code: 'GBP', label: '£ (GBP) - جنيه إسترليني' },
] as const;

function normalizeCurrencyCode(value?: string | null): string {
  const code = String(value || '').trim().toUpperCase();
  return code || 'SAR';
}

export default function DashboardPage() {
  const { data, loading, error, refresh } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [summaryCurrency, setSummaryCurrency] = useState('SAR');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    const firstPortfolioCurrency = data.portfolios.find((p) => p.currency)?.currency;
    if (firstPortfolioCurrency) {
      setSummaryCurrency((prev) => (prev === 'SAR' ? normalizeCurrencyCode(firstPortfolioCurrency) : prev));
    }
  }, [data.portfolios]);

  const toSummaryAmount = (amountSar: number) => convertCurrency(Number.isFinite(amountSar) ? amountSar : 0, 'SAR', summaryCurrency);
  const formatSummaryAmount = (amountSar: number) => formatCurrencyByCode(toSummaryAmount(amountSar), summaryCurrency);

  const mainForex = data.forex.filter(f => f.category === 'major');
  const minorForex = data.forex.filter(f => f.category === 'minor').slice(0, 6);
  const arabForex = data.forex.filter(f => f.category === 'arab');
  const emergingForex = data.forex.filter(f => f.category === 'emerging').slice(0, 6);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="لوحة التحكم المالية" subtitle="نظرة شاملة على جميع استثماراتك والأسواق المالية" onRefresh={handleRefresh} isRefreshing={isRefreshing} />

        <div className="relative h-48 md:h-56 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-l from-emerald-900/90 via-teal-800/80 to-transparent z-10" />
          <Image src="/images/ai-generated/hero-banner.png" alt="Hero Banner" fill className="object-cover" priority />
          <div className="relative z-20 h-full flex flex-col justify-center px-8">
            <div className="flex items-center gap-3 mb-3">
              <Image src="/images/ai-generated/logo.png" alt="Logo" width={48} height={48} className="rounded-xl shadow-lg" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">لوحة التحكم المالية</h1>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-2">
              <div className="text-white">
                <span className="text-white/60 text-xs">إجمالي القيمة</span>
                <p className="text-xl font-bold">{formatSummaryAmount(data.totalPortfolioValue)}</p>
              </div>
            </div>
          </div>
        </div>

        <MarketOverviewBar />
        <MarketTicker />

        <main className="p-4 md:p-6 space-y-6">

          <Card className="border-dashed">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <div>
                <p className="text-sm font-medium">عملة الملخص الموحد</p>
                <p className="text-xs text-muted-foreground">كل القيم الإجمالية في لوحة المعلومات تتحول لهذه العملة.</p>
              </div>
              <div className="w-full sm:w-[320px]">
                <Select value={summaryCurrency} onValueChange={(value) => setSummaryCurrency(normalizeCurrencyCode(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((item) => (
                      <SelectItem key={`dashboard-currency-${item.code}`} value={item.code}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="border-2 border-green-200 dark:border-green-900/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-16 h-16 bg-green-500/10 rounded-full -translate-x-8 -translate-y-8" />
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-[10px] text-muted-foreground">إجمالي القيمة</span>
                </div>
                <p className="text-base font-bold text-green-700 dark:text-green-400">{formatSummaryAmount(data.totalPortfolioValue)}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-16 h-16 bg-blue-500/10 rounded-full -translate-x-8 -translate-y-8" />
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-[10px] text-muted-foreground">الأسهم</span>
                </div>
                <p className="text-base font-bold text-blue-700 dark:text-blue-400">{formatSummaryAmount(data.stockTotalSAR)}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-16 h-16 bg-amber-500/10 rounded-full -translate-x-8 -translate-y-8" />
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Landmark className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-[10px] text-muted-foreground">الصكوك/السندات</span>
                </div>
                <p className="text-base font-bold text-amber-700 dark:text-amber-400">{formatSummaryAmount(data.bondTotalSAR)}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-900/20 dark:to-sky-900/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-16 h-16 bg-indigo-500/10 rounded-full -translate-x-8 -translate-y-8" />
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="text-[10px] text-muted-foreground">الصناديق</span>
                </div>
                <p className="text-base font-bold text-indigo-700 dark:text-indigo-400">{formatSummaryAmount(data.fundTotalSAR)}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-cyan-200 dark:border-cyan-900/50 bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-16 h-16 bg-cyan-500/10 rounded-full -translate-x-8 -translate-y-8" />
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Coins className="h-3.5 w-3.5 text-cyan-600" />
                  <span className="text-[10px] text-muted-foreground">العملات المشفرة</span>
                </div>
                <p className="text-base font-bold text-cyan-700 dark:text-cyan-400">{formatSummaryAmount(data.cryptoTotalSAR)}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-teal-200 dark:border-teal-900/50 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-16 h-16 bg-teal-500/10 rounded-full -translate-x-8 -translate-y-8" />
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CircleDollarSign className="h-3.5 w-3.5 text-teal-600" />
                  <span className="text-[10px] text-muted-foreground">الفوركس</span>
                </div>
                <p className="text-base font-bold text-teal-700 dark:text-teal-400">{formatSummaryAmount(data.forexTotalSAR)}</p>
              </CardContent>
            </Card>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>إعادة المحاولة</Button>
            </div>
          )}

          {/* Main Charts Section */}
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <SectionSkeleton height={280} />
                <SectionSkeleton height={350} />
                <SectionSkeleton height={300} />
                <SectionSkeleton height={250} />
              </div>
              <div className="space-y-6">
                <SectionSkeleton height={220} />
                <SectionSkeleton height={220} />
                <SectionSkeleton height={180} />
              </div>
            </div>
          ) : (data.stocks.length > 0 || data.bonds.length > 0 || data.funds.length > 0) ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {/* Portfolio Value Chart */}
                <Card className="border-2 overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">أداء المحفظة</CardTitle>
                          <p className="text-xs text-muted-foreground">تطور قيمة المحفظة</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PortfolioValueChart
                      stocks={data.stocks}
                      bonds={data.bonds}
                      funds={data.funds}
                      cryptoTotal={data.cryptoTotalSAR}
                      forexTotal={data.forexTotalSAR}
                      commodityTotal={data.commodityTotalSAR}
                    />
                  </CardContent>
                </Card>

                {/* Sector Bar Chart */}
                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                        <BarChart3 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">القطاعات - القيمة الاستثمارية</CardTitle>
                        <p className="text-xs text-muted-foreground">توزيع رأس المال حسب القطاع</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SectorAllocationChart
                      stocks={data.stocks}
                      bonds={data.bonds}
                      funds={data.funds}
                      includeCrypto={true}
                      includeForex={true}
                      includeCommodities={true}
                    />
                  </CardContent>
                </Card>

              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
                        <CircleDollarSign className="h-4 w-4 text-white" />
                      </div>
                      <CardTitle className="text-base">توزيع الأصول</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AssetAllocationChart
                      stocks={data.stocks}
                      bonds={data.bonds}
                      funds={data.funds}
                      cryptoTotal={data.cryptoTotalSAR}
                      forexTotal={data.forexTotalSAR}
                      commodityTotal={data.commodityTotalSAR}
                      stockCount={data.stocks.filter(s => s.sector !== 'Cryptocurrency' && s.sector !== 'Forex').length}
                      cryptoCount={data.stocks.filter(s => s.sector === 'Cryptocurrency').length}
                      forexCount={data.stocks.filter(s => s.sector === 'Forex').length}
                      commodityCount={data.funds.filter(f => f.fundType === 'commodities').length}
                    />
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                        <PieChart className="h-4 w-4 text-white" />
                      </div>
                      <CardTitle className="text-base">توزيع القطاعات</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SectorAllocationChart
                      stocks={data.stocks}
                      bonds={data.bonds}
                      funds={data.funds}
                    />
                  </CardContent>
                </Card>

                {data.assetCategories.length > 1 && (
                  <Card className="border-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                          <BarChart3 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">مقارنة الأصول</CardTitle>
                          <p className="text-xs text-muted-foreground">القيمة مقابل التكلفة</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <AssetComparisonChart categories={data.assetCategories} />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : null}

          {/* Market Live Data Tabs */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Globe className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">الأسواق المباشرة</CardTitle>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    أسعار مباشرة - تحديث تلقائي كل دقيقة
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary ml-2" />
                  <span className="text-muted-foreground">جاري تحميل بيانات الأسواق...</span>
                </div>
              ) : (
                <Tabs defaultValue={data.stocks.length > 0 ? "stocks" : "crypto"} dir="rtl">
                  <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
                    {data.stocks.length > 0 && (
                      <TabsTrigger value="stocks" className="text-xs gap-1"><TrendingUp className="h-3 w-3" />الأسهم</TabsTrigger>
                    )}
                    <TabsTrigger value="forex" className="text-xs gap-1"><CircleDollarSign className="h-3 w-3" />الفوركس</TabsTrigger>
                    <TabsTrigger value="funds" className="text-xs gap-1"><Building2 className="h-3 w-3" />الصناديق والصكوك</TabsTrigger>
                  </TabsList>

                  {/* Stocks Tab */}
                  {data.stocks.length > 0 && (
                    <TabsContent value="stocks" className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {data.stocks.slice(0, 16).map(stock => {
                          const pl = stock.profitLoss || 0;
                          const plPct = stock.profitLossPct || 0;
                          const isPositive = pl >= 0;
                          return (
                            <Link key={stock.id} href="/stocks">
                              <div className="p-3 rounded-xl border hover:bg-accent/50 transition-all cursor-pointer">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">{stock.symbol}</span>
                                    {stock.sector && <Badge variant="outline" className="text-[9px] px-1">{stock.sector}</Badge>}
                                  </div>
                                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                    {isPositive ? '+' : ''}{plPct.toFixed(2)}%
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate mb-1.5">{stock.name}</p>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-sm">{formatCurrencyByCode(stock.currentPrice || stock.buyPrice, stock.buyCurrency || stock.portfolioCurrency || 'SAR')}</span>
                                  <span className={`text-[10px] ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{isPositive ? '+' : ''}{formatCurrencyByCode(pl, stock.buyCurrency || stock.portfolioCurrency || 'SAR')}</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                        {data.stocks.length > 16 && (
                          <Link href="/stocks">
                            <div className="p-3 rounded-xl border border-dashed hover:bg-accent/50 transition-all flex items-center justify-center h-full min-h-[80px]">
                              <span className="text-sm text-muted-foreground">عرض الكل ({data.stocks.length})<ChevronLeft className="h-4 w-4 inline mr-1" /></span>
                            </div>
                          </Link>
                        )}
                      </div>
                    </TabsContent>
                  )}

                  {/* Forex Tab */}
                  <TabsContent value="forex" className="mt-4">
                    {(mainForex.length > 0 || arabForex.length > 0) ? (
                      <div className="space-y-4">
                        {mainForex.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">أزواج رئيسية</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {mainForex.map(pair => {
                                const isPositive = pair.changePct >= 0;
                                return (
                                  <div key={pair.symbol} className="p-3 rounded-xl border hover:bg-accent/50 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-sm">{pair.baseCurrency}/{pair.quoteCurrency}</span>
                                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                        {isPositive ? '+' : ''}{pair.changePct.toFixed(2)}%
                                      </span>
                                    </div>
                                    <p className="font-bold">{formatNumber(pair.price, 4)}</p>
                                    <p className="text-[10px] text-muted-foreground">{pair.name}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {minorForex.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">أزواج ثانوية</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {minorForex.map(pair => {
                                const isPositive = pair.changePct >= 0;
                                return (
                                  <div key={pair.symbol} className="p-3 rounded-xl border hover:bg-accent/50 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-sm">{pair.baseCurrency}/{pair.quoteCurrency}</span>
                                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                        {isPositive ? '+' : ''}{pair.changePct.toFixed(2)}%
                                      </span>
                                    </div>
                                    <p className="font-bold">{formatNumber(pair.price, 4)}</p>
                                    <p className="text-[10px] text-muted-foreground">{pair.name}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {arabForex.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">أزواج عربية</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {arabForex.map(pair => {
                                const isPositive = pair.changePct >= 0;
                                return (
                                  <div key={pair.symbol} className="p-3 rounded-xl border hover:bg-accent/50 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-sm">{pair.baseCurrency}/{pair.quoteCurrency}</span>
                                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                        {isPositive ? '+' : ''}{pair.changePct.toFixed(2)}%
                                      </span>
                                    </div>
                                    <p className="font-bold">{formatNumber(pair.price, 4)}</p>
                                    <p className="text-[10px] text-muted-foreground">{pair.name}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {emergingForex.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">أزواج ناشئة</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {emergingForex.map(pair => {
                                const isPositive = pair.changePct >= 0;
                                return (
                                  <div key={pair.symbol} className="p-3 rounded-xl border hover:bg-accent/50 transition-all cursor-pointer">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-sm">{pair.baseCurrency}/{pair.quoteCurrency}</span>
                                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                        {isPositive ? '+' : ''}{pair.changePct.toFixed(2)}%
                                      </span>
                                    </div>
                                    <p className="font-bold">{formatNumber(pair.price, 4)}</p>
                                    <p className="text-[10px] text-muted-foreground">{pair.name}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground"><CircleDollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>جاري تحميل بيانات الفوركس...</p></div>
                    )}
                    <Link href="/forex"><Button variant="outline" size="sm" className="w-full mt-3">عرض جميع أزواج العملات<ChevronLeft className="h-4 w-4 mr-1" /></Button></Link>
                  </TabsContent>

                  {/* Funds/Sukuk Tab */}
                  <TabsContent value="funds" className="mt-4">
                    {data.liveFunds.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.liveFunds.slice(0, 12).map((item, i) => {
                          const isPositive = (item.changePct || 0) >= 0;
                          const typeLabel: Record<string, string> = { reit: 'صندوق عقاري', fund: 'صندوق استثماري', sukuk: 'صكوك' };
                          return (
                            <div key={i} className="p-3 rounded-xl border hover:bg-accent/50 transition-all cursor-pointer">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[9px]">{typeLabel[item.type || 'fund'] || 'صندوق'}</Badge>
                                  {item.symbol && <span className="font-bold text-xs">{item.symbol}</span>}
                                </div>
                                {item.changePct !== undefined && (
                                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                    {isPositive ? '+' : ''}{item.changePct.toFixed(2)}%
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              {item.price ? <p className="font-bold mt-1">{formatNumber(item.price, 2)}</p> : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground"><Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>جاري تحميل بيانات الصناديق والصكوك...</p></div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Link href="/funds" className="flex-1"><Button variant="outline" size="sm" className="w-full">الصناديق<ChevronLeft className="h-4 w-4 mr-1" /></Button></Link>
                      <Link href="/bonds" className="flex-1"><Button variant="outline" size="sm" className="w-full">الصكوك والسندات<ChevronLeft className="h-4 w-4 mr-1" /></Button></Link>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Holdings Table */}
          {data.stocks.length > 0 && (
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">جميع الأصول المملوكة</CardTitle>
                      <p className="text-xs text-muted-foreground">{data.stocks.length + data.bonds.length + data.funds.length} أصل عبر {data.portfolios.length} محفظة — القيم بعملة {summaryCurrency}</p>
                    </div>
                  </div>
                  <Link href="/stocks"><Button variant="outline" size="sm">عرض الكل<ChevronLeft className="h-4 w-4 mr-1" /></Button></Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">الرمز</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">الاسم</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">النوع</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">الكمية</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">سعر الشراء</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">السعر الحالي</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">العملة</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground">القيمة ({summaryCurrency})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.stocks.slice(0, 15).map(stock => {
                        const plSAR = stock.plSAR ?? (stock.profitLoss || 0);
                        const plPct = stock.profitLossPct || 0;
                        const isPositive = plSAR >= 0;
                        const displayPrice = stock.livePrice ?? stock.currentPrice ?? stock.buyPrice;
                        const typeLabel = stock.sector === 'Cryptocurrency' ? 'مشفر' : stock.sector === 'Forex' ? 'فوركس' : 'سهم';
                        return (
                          <tr key={stock.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-2 px-2"><span className="font-bold text-primary">{stock.symbol}</span></td>
                            <td className="py-2 px-2 max-w-[120px] truncate">{stock.name}</td>
                            <td className="py-2 px-2"><Badge variant="outline" className="text-[9px]">{typeLabel}</Badge></td>
                            <td className="py-2 px-2">{formatNumber(stock.qty, 0)}</td>
                            <td className="py-2 px-2">{formatNumber(stock.buyPrice, 2)}</td>
                            <td className="py-2 px-2 font-semibold">{formatNumber(displayPrice, 2)}</td>
                            <td className="py-2 px-2"><Badge variant="outline" className="text-[9px]">{stock.buyCurrency || stock.portfolioCurrency || 'SAR'}</Badge></td>
                            <td className="py-2 px-2 font-semibold">{formatSummaryAmount(stock.valueSAR ?? stock.qty * displayPrice)}</td>
                          </tr>
                        );
                      })}
                      {data.bonds.map(bond => {
                        const typeLabel = bond.type === 'sukuk' ? 'صك' : 'سند';
                        return (
                          <tr key={bond.id} className="border-b hover:bg-muted/50 transition-colors bg-amber-50/30 dark:bg-amber-900/10">
                            <td className="py-2 px-2"><span className="font-bold text-amber-600">{bond.symbol}</span></td>
                            <td className="py-2 px-2 max-w-[120px] truncate">{bond.name}</td>
                            <td className="py-2 px-2"><Badge className="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{typeLabel}</Badge></td>
                            <td className="py-2 px-2">{formatNumber(bond.qty, 0)}</td>
                            <td className="py-2 px-2">{formatNumber(bond.buyPrice, 2)}</td>
                            <td className="py-2 px-2 font-semibold">{formatNumber(bond.currentPrice ?? bond.buyPrice, 2)}</td>
                            <td className="py-2 px-2"><Badge variant="outline" className="text-[9px]">{bond.portfolioCurrency || 'SAR'}</Badge></td>
                            <td className="py-2 px-2 font-semibold">{formatSummaryAmount(bond.valueSAR)}</td>
                          </tr>
                        );
                      })}
                      {data.funds.map(fund => {
                        const typeLabel = fund.fundType === 'commodities' ? 'سلعة' : 'صندوق';
                        return (
                          <tr key={fund.id} className="border-b hover:bg-muted/50 transition-colors bg-purple-50/30 dark:bg-purple-900/10">
                            <td className="py-2 px-2"><span className="font-bold text-purple-600">{fund.symbol || '-'}</span></td>
                            <td className="py-2 px-2 max-w-[120px] truncate">{fund.name}</td>
                            <td className="py-2 px-2"><Badge className="text-[9px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{typeLabel}</Badge></td>
                            <td className="py-2 px-2">{formatNumber(fund.units, 0)}</td>
                            <td className="py-2 px-2">{formatNumber(fund.buyPrice, 2)}</td>
                            <td className="py-2 px-2 font-semibold">{formatNumber(fund.currentPrice ?? fund.buyPrice, 2)}</td>
                            <td className="py-2 px-2"><Badge variant="outline" className="text-[9px]">{fund.portfolioCurrency || 'SAR'}</Badge></td>
                            <td className="py-2 px-2 font-semibold">{formatSummaryAmount(fund.valueSAR)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {data.stocks.length > 15 && (
                    <div className="text-center pt-3">
                      <Link href="/stocks"><Button variant="ghost" size="sm" className="text-muted-foreground">و {data.stocks.length - 15} أصل آخر...<ChevronLeft className="h-4 w-4 mr-1" /></Button></Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Portfolios Overview */}
          {data.portfolios.length > 0 && (
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                      <Wallet className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">المحافظ الاستثمارية</CardTitle>
                      <p className="text-xs text-muted-foreground">{data.portfolios.length} محفظة</p>
                    </div>
                  </div>
                  <Link href="/portfolios"><Button variant="outline" size="sm">عرض الكل<ChevronLeft className="h-4 w-4 mr-1" /></Button></Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {data.portfolios.map(portfolio => (
                    <Link key={portfolio.id} href="/portfolios">
                      <div className="p-4 rounded-xl border hover:bg-accent/50 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm group-hover:text-primary transition-colors">{portfolio.name}</span>
                          {portfolio.isActive && <span className="h-2 w-2 rounded-full bg-green-500" />}
                        </div>
                        <p className="text-lg font-bold">{formatSummaryAmount(portfolio.totalValueSAR ?? portfolio.totalValue)}</p>
                        <Badge variant="outline" className="mt-2 text-[9px]">{portfolio.currency}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </main>
      </div>
    </div>
  );
}
