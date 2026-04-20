'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Database,
  Download,
  RefreshCw,
  Search,
  Shield,
  Archive,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type MarketSummary = {
  key: string;
  name: string;
  flag: string;
  currency: string;
  total: number;
  bilad_count: number;
  rajhi_count: number;
  maqasid_count: number;
  fiqh_count: number;
};

type DatabaseSummaryResponse = {
  summaries: MarketSummary[];
  totalStocks: number;
  totalFunds: number;
  shariaFunds: number;
  stats: {
    totalBilad: number;
    totalRajhi: number;
    totalMaqasid: number;
    totalFiqh: number;
  };
};

type DatabaseStock = {
  symbol?: string;
  name?: string;
  sector?: string;
  actual_price?: number;
  price?: number;
  change_pct?: number;
  dividend_pct?: number;
  pe_ratio?: number;
  grade?: string;
  status?: string;
  recommendation?: string;
};

type DatabaseMarketResponse = {
  market?: {
    name?: string;
    flag?: string;
    currency?: string;
  };
  stocks: DatabaseStock[];
  total: number;
  page: number;
  totalPages: number;
};

const PER_PAGE = 50;

const METHODOLOGY_OPTIONS = [
  { value: 'all', label: 'جميع النتائج' },
  { value: 'bilad', label: 'منهج البلاد' },
  { value: 'rajhi', label: 'منهج الراجحي' },
  { value: 'maqasid', label: 'منهج المقاصد' },
  { value: 'fiqh', label: 'منهج فقهي' },
] as const;

const STATUS_OPTIONS = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'halal', label: 'متوافق' },
  { value: 'forbidden', label: 'غير متوافق' },
] as const;

function downloadJson(fileName: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toNumber(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function formatNumber(value: unknown, maximumFractionDigits = 2): string {
  const num = toNumber(value);
  if (num === null) return '—';
  return num.toLocaleString('en-US', { maximumFractionDigits });
}

function formatPercent(value: unknown): string {
  const num = toNumber(value);
  if (num === null) return '—';
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
}

function statusBadgeStyle(status: string) {
  if (status.includes('✅') || status.includes('متوافق')) {
    return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
  }
  if (status.includes('❌') || status.includes('غير')) {
    return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  }
  return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
}

export default function DatabasePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [summaries, setSummaries] = useState<MarketSummary[]>([]);
  const [summaryTotals, setSummaryTotals] = useState<DatabaseSummaryResponse['stats']>({
    totalBilad: 0,
    totalRajhi: 0,
    totalMaqasid: 0,
    totalFiqh: 0,
  });
  const [totalStocks, setTotalStocks] = useState(0);
  const [totalFunds, setTotalFunds] = useState(0);
  const [shariaFunds, setShariaFunds] = useState(0);

  const [selectedMarket, setSelectedMarket] = useState('');
  const [methodology, setMethodology] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [stocks, setStocks] = useState<DatabaseStock[]>([]);
  const [marketInfo, setMarketInfo] = useState<DatabaseMarketResponse['market']>({});
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isStocksLoading, setIsStocksLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedMarketSummary = useMemo(
    () => summaries.find((market) => market.key === selectedMarket) || null,
    [summaries, selectedMarket],
  );

  const loadSummaries = useCallback(async () => {
    setIsSummaryLoading(true);
    try {
      const response = await fetch('/api/database?market=all', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`تعذر تحميل ملخص الأسواق (${response.status})`);
      }

      const payload = (await response.json()) as DatabaseSummaryResponse;
      const nextSummaries = Array.isArray(payload.summaries) ? payload.summaries : [];
      setSummaries(nextSummaries);
      setSummaryTotals(payload.stats || { totalBilad: 0, totalRajhi: 0, totalMaqasid: 0, totalFiqh: 0 });
      setTotalStocks(Number(payload.totalStocks || 0));
      setTotalFunds(Number(payload.totalFunds || 0));
      setShariaFunds(Number(payload.shariaFunds || 0));

      setSelectedMarket((prev) => {
        if (prev && nextSummaries.some((market) => market.key === prev)) {
          return prev;
        }
        return nextSummaries[0]?.key || '';
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل تحميل ملخص قاعدة البيانات.';
      setErrorMessage(message);
      toast({ title: 'خطأ', description: message, variant: 'destructive' });
    } finally {
      setIsSummaryLoading(false);
    }
  }, [toast]);

  const loadStocks = useCallback(async () => {
    if (!selectedMarket) return;

    setIsStocksLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams({
        market: selectedMarket,
        page: String(page),
        limit: String(PER_PAGE),
      });

      if (methodology !== 'all') {
        params.set('methodology', methodology);
      }
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (search.trim()) {
        params.set('search', search.trim());
      }

      const response = await fetch(`/api/database?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`تعذر تحميل بيانات السوق (${response.status})`);
      }

      const payload = (await response.json()) as DatabaseMarketResponse;
      setStocks(Array.isArray(payload.stocks) ? payload.stocks : []);
      setMarketInfo(payload.market || {});
      setTotalRows(Number(payload.total || 0));
      setTotalPages(Math.max(1, Number(payload.totalPages || 1)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل تحميل بيانات السوق.';
      setErrorMessage(message);
      setStocks([]);
      toast({ title: 'خطأ', description: message, variant: 'destructive' });
    } finally {
      setIsStocksLoading(false);
    }
  }, [methodology, page, search, selectedMarket, statusFilter, toast]);

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  useEffect(() => {
    if (!selectedMarket) return;
    void loadStocks();
  }, [loadStocks, selectedMarket]);

  useEffect(() => {
    setPage(1);
  }, [selectedMarket, methodology, statusFilter, search]);

  const handleApplySearch = () => {
    setPage(1);
    setSearch(searchDraft.trim());
  };

  const handleClearSearch = () => {
    setSearchDraft('');
    setSearch('');
    setPage(1);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([loadSummaries(), loadStocks()]).finally(() => setIsRefreshing(false));
  };

  const handleExportCurrentView = () => {
    if (stocks.length === 0) {
      toast({ title: 'لا توجد بيانات', description: 'لا توجد نتائج حالية للتصدير.', variant: 'destructive' });
      return;
    }

    downloadJson(`database-${selectedMarket}-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedAt: new Date().toISOString(),
      market: selectedMarket,
      marketName: selectedMarketSummary?.name || marketInfo?.name || selectedMarket,
      methodology,
      statusFilter,
      search,
      totalRows,
      rows: stocks,
    });

    toast({ title: 'تم التصدير', description: 'تم تصدير نتائج العرض الحالية بنجاح.' });
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 transition-all duration-300 lg:mr-64">
        <TopBar title="🗄️ قاعدة البيانات" onRefresh={handleRefresh} isRefreshing={isRefreshing} />

        <main className="space-y-6 p-6">
          <Card className="border-slate-300/70 bg-gradient-to-l from-background via-slate-50 to-blue-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                قاعدة البيانات المركزية
              </CardTitle>
              <CardDescription>
                عرض مباشر لبيانات الأسواق والصناديق مع فلاتر بحث وتصدير فعّال.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-background/70 p-4 text-center">
                <p className="text-xs text-muted-foreground">الأسواق المتاحة</p>
                <p className="mt-1 text-2xl font-bold">{summaries.length}</p>
              </div>
              <div className="rounded-lg border bg-background/70 p-4 text-center">
                <p className="text-xs text-muted-foreground">إجمالي الأسهم</p>
                <p className="mt-1 text-2xl font-bold">{totalStocks.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border bg-background/70 p-4 text-center">
                <p className="text-xs text-muted-foreground">إجمالي الصناديق</p>
                <p className="mt-1 text-2xl font-bold">{totalFunds.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border bg-background/70 p-4 text-center">
                <p className="text-xs text-muted-foreground">الصناديق الشرعية</p>
                <p className="mt-1 text-2xl font-bold">{shariaFunds.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">الأسواق</CardTitle>
                <CardDescription>اختر السوق لعرض سجلاته الفعلية.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isSummaryLoading ? (
                  <p className="text-sm text-muted-foreground">جاري تحميل الأسواق...</p>
                ) : summaries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد أسواق متاحة حالياً.</p>
                ) : (
                  summaries.map((market) => (
                    <button
                      key={market.key}
                      type="button"
                      onClick={() => setSelectedMarket(market.key)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-right transition-all hover:bg-muted/40',
                        selectedMarket === market.key && 'border-primary bg-primary/5',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{market.flag} {market.name}</p>
                          <p className="text-xs text-muted-foreground">{market.key.toUpperCase()}</p>
                        </div>
                        <Badge variant="outline">{market.total.toLocaleString()}</Badge>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">
                      {marketInfo?.flag || selectedMarketSummary?.flag || '🏳️'}{' '}
                      {marketInfo?.name || selectedMarketSummary?.name || 'السوق'}
                    </CardTitle>
                    <CardDescription>
                      إجمالي السجلات: {totalRows.toLocaleString()} • العملة: {marketInfo?.currency || selectedMarketSummary?.currency || '—'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleExportCurrentView}>
                      <Download className="h-4 w-4" />
                      تصدير النتائج
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => router.push('/backup')}>
                      <Archive className="h-4 w-4" />
                      النسخ الاحتياطي
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <Select value={methodology} onValueChange={setMethodology}>
                    <SelectTrigger>
                      <SelectValue placeholder="المنهجية" />
                    </SelectTrigger>
                    <SelectContent>
                      {METHODOLOGY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchDraft}
                        onChange={(event) => setSearchDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleApplySearch();
                        }}
                        className="pr-9"
                        placeholder="بحث بالرمز أو الاسم أو القطاع"
                      />
                    </div>
                    <Button variant="outline" onClick={handleApplySearch}>بحث</Button>
                    <Button variant="ghost" onClick={handleClearSearch}>مسح</Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">بلاد: {summaryTotals.totalBilad.toLocaleString()}</Badge>
                  <Badge variant="secondary">راجحي: {summaryTotals.totalRajhi.toLocaleString()}</Badge>
                  <Badge variant="secondary">مقاصد: {summaryTotals.totalMaqasid.toLocaleString()}</Badge>
                  <Badge variant="secondary">فقهي: {summaryTotals.totalFiqh.toLocaleString()}</Badge>
                  {search && <Badge variant="outline">بحث: {search}</Badge>}
                </div>
              </CardHeader>

              <CardContent>
                {errorMessage ? (
                  <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
                    {errorMessage}
                  </div>
                ) : isStocksLoading ? (
                  <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                    <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                    جاري تحميل البيانات...
                  </div>
                ) : stocks.length === 0 ? (
                  <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                    لا توجد نتائج مطابقة للفلاتر الحالية.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40">
                            <TableHead className="text-right">الرمز</TableHead>
                            <TableHead className="text-right">الاسم</TableHead>
                            <TableHead className="text-right">القطاع</TableHead>
                            <TableHead className="text-center">السعر</TableHead>
                            <TableHead className="text-center">التغير %</TableHead>
                            <TableHead className="text-center">التوزيع %</TableHead>
                            <TableHead className="text-center">P/E</TableHead>
                            <TableHead className="text-center">التقييم</TableHead>
                            <TableHead className="text-center">الحالة</TableHead>
                            <TableHead className="text-center">التوصية</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stocks.map((stock, index) => {
                            const price = toNumber(stock.actual_price) ?? toNumber(stock.price);
                            const change = toNumber(stock.change_pct);
                            const dividend = toNumber(stock.dividend_pct);
                            const pe = toNumber(stock.pe_ratio);
                            const status = String(stock.status || '—');

                            return (
                              <TableRow key={`${stock.symbol || 'row'}-${index}`}>
                                <TableCell className="font-mono text-xs">{stock.symbol || '—'}</TableCell>
                                <TableCell>{stock.name || '—'}</TableCell>
                                <TableCell>{stock.sector || '—'}</TableCell>
                                <TableCell className="text-center font-mono text-xs">{formatNumber(price)}</TableCell>
                                <TableCell className={cn('text-center font-mono text-xs', change && change > 0 ? 'text-green-600' : change && change < 0 ? 'text-red-600' : 'text-muted-foreground')}>
                                  {formatPercent(change)}
                                </TableCell>
                                <TableCell className="text-center text-xs">{dividend === null ? '—' : `${dividend.toFixed(2)}%`}</TableCell>
                                <TableCell className="text-center text-xs">{pe === null ? '—' : pe.toFixed(2)}</TableCell>
                                <TableCell className="text-center text-xs font-semibold">{stock.grade || '—'}</TableCell>
                                <TableCell className="text-center">
                                  <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold', statusBadgeStyle(status))}>
                                    {status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center text-xs">{stock.recommendation || '—'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        صفحة {page} من {totalPages} • إجمالي {totalRows.toLocaleString()} سجل
                      </p>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          className="gap-1"
                        >
                          <ChevronRight className="h-4 w-4" />
                          السابق
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                          className="gap-1"
                        >
                          التالي
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-amber-300/60 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
              <Shield className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-300" />
              <p className="text-amber-800 dark:text-amber-200">
                جميع البيانات في هذه الصفحة تُقرأ مباشرة من ملفات قاعدة البيانات المحلية عبر API،
                بدون بيانات تجريبية أو أزرار غير موصولة.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
