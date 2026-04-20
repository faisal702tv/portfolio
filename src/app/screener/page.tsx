'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  AlertTriangle,
  Activity,
  BarChart3,
  Zap,
  Target,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScreenerStock {
  symbol: string;
  name: string;
  market: string;
  currency: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  avgVolume: number;
  rvolume: number;
  volumeChangePct: number;
  intradayChangePct: number;
  rsi: number | null;
  ma20: number | null;
  ma50: number | null;
  maCrossBullish: boolean;
  marketCap: number | null;
  capType: string | null;
  high52w: number | null;
  low52w: number | null;
}

interface FilterState {
  market: string;
  priceOp: string;
  priceVal: string;
  volumeChangePctOp: string;
  volumeChangePctVal: string;
  changePctOp: string;
  changePctVal: string;
  intradayChangeOp: string;
  intradayChangeVal: string;
  realVolumeOp: string;
  realVolumeVal: string;
  rvolOp: string;
  rvolVal: string;
  rsiHealthy: boolean;
  liquidityPctOp: string;
  liquidityPctVal: string;
  smallMidCap: boolean;
  maCrossBullish: boolean;
}

const MARKETS = [
  { id: 'saudi', name: '🇸🇦 تداول (السعودية)' },
  { id: 'abuDhabi', name: '🇦🇪 أبوظبي (ADX)' },
  { id: 'dubai', name: '🇦🇪 دبي (DFM)' },
  { id: 'kuwait', name: '🇰🇼 بورصة الكويت' },
  { id: 'qatar', name: '🇶🇦 بورصة قطر' },
  { id: 'bahrain', name: '🇧🇭 بورصة البحرين' },
  { id: 'oman', name: '🇴🇲 بورصة مسقط' },
  { id: 'egypt', name: '🇪🇬 البورصة المصرية' },
  { id: 'jordan', name: '🇯🇴 بورصة عمّان' },
  { id: 'usa', name: '🇺🇸 السوق الأمريكي' },
];

const DEFAULT_FILTERS: FilterState = {
  market: '',
  priceOp: 'gte',
  priceVal: '',
  volumeChangePctOp: 'gte',
  volumeChangePctVal: '',
  changePctOp: 'gte',
  changePctVal: '',
  intradayChangeOp: 'gte',
  intradayChangeVal: '',
  realVolumeOp: 'gte',
  realVolumeVal: '',
  rvolOp: 'gte',
  rvolVal: '',
  rsiHealthy: false,
  liquidityPctOp: 'gte',
  liquidityPctVal: '',
  smallMidCap: false,
  maCrossBullish: false,
};

type SortKey = 'symbol' | 'price' | 'changePct' | 'volume' | 'rvolume' | 'rsi' | 'ma20' | 'ma50' | 'marketCap';

function applyFilters(stocks: ScreenerStock[], f: FilterState): ScreenerStock[] {
  return stocks.filter((s) => {
    if (f.priceVal) {
      const v = parseFloat(f.priceVal);
      if (!isNaN(v)) {
        if (f.priceOp === 'gte' && s.price < v) return false;
        if (f.priceOp === 'lte' && s.price > v) return false;
      }
    }
    if (f.volumeChangePctVal) {
      const v = parseFloat(f.volumeChangePctVal);
      if (!isNaN(v)) {
        if (f.volumeChangePctOp === 'gte' && s.volumeChangePct < v) return false;
        if (f.volumeChangePctOp === 'lte' && s.volumeChangePct > v) return false;
      }
    }
    if (f.changePctVal) {
      const v = parseFloat(f.changePctVal);
      if (!isNaN(v)) {
        if (f.changePctOp === 'gte' && s.changePct < v) return false;
        if (f.changePctOp === 'lte' && s.changePct > v) return false;
      }
    }
    if (f.intradayChangeVal) {
      const v = parseFloat(f.intradayChangeVal);
      if (!isNaN(v)) {
        if (f.intradayChangeOp === 'gte' && s.intradayChangePct < v) return false;
        if (f.intradayChangeOp === 'lte' && s.intradayChangePct > v) return false;
      }
    }
    if (f.realVolumeVal) {
      const v = parseFloat(f.realVolumeVal);
      if (!isNaN(v)) {
        if (f.realVolumeOp === 'gte' && s.volume < v) return false;
        if (f.realVolumeOp === 'lte' && s.volume > v) return false;
      }
    }
    if (f.rvolVal) {
      const v = parseFloat(f.rvolVal);
      if (!isNaN(v)) {
        if (f.rvolOp === 'gte' && s.rvolume < v) return false;
        if (f.rvolOp === 'lte' && s.rvolume > v) return false;
      }
    }
    if (f.rsiHealthy) {
      if (s.rsi === null || s.rsi < 30 || s.rsi > 70) return false;
    }
    if (f.liquidityPctVal) {
      const v = parseFloat(f.liquidityPctVal);
      if (!isNaN(v) && s.avgVolume > 0) {
        const liq = (s.volume / s.avgVolume) * 100;
        if (f.liquidityPctOp === 'gte' && liq < v) return false;
        if (f.liquidityPctOp === 'lte' && liq > v) return false;
      }
    }
    if (f.smallMidCap) {
      if (!s.capType || s.capType === 'large') return false;
    }
    if (f.maCrossBullish) {
      if (!s.maCrossBullish) return false;
    }
    return true;
  });
}

function formatNum(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatMarketCap(cap: number | null, currency: string): string {
  if (!cap) return '—';
  const suffix = currency === 'USD' ? '$' : currency;
  if (cap >= 1e12) return `${(cap / 1e12).toFixed(2)}T ${suffix}`;
  if (cap >= 1e9) return `${(cap / 1e9).toFixed(2)}B ${suffix}`;
  if (cap >= 1e6) return `${(cap / 1e6).toFixed(2)}M ${suffix}`;
  return `${cap.toLocaleString()} ${suffix}`;
}

function OpSelect({ value, onValueChange }: { value: string; onValueChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[90px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="gte">أكبر أو يساوي</SelectItem>
        <SelectItem value="lte">أصغر أو يساوي</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function ScreenerPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [allStocks, setAllStocks] = useState<ScreenerStock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<ScreenerStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedMarket, setLoadedMarket] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filtersOpen, setFiltersOpen] = useState(true);

  const updateFilter = useCallback((key: keyof FilterState, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyFilter = async () => {
    if (!filters.market) return;

    let stocks = allStocks;

    if (filters.market !== loadedMarket) {
      setLoading(true);
      try {
        const res = await fetch(`/api/screener?market=${filters.market}`);
        const data = await res.json();
        if (data.success) {
          stocks = data.data;
          setAllStocks(stocks);
          setLoadedMarket(filters.market);
          setLastUpdated(data.timestamp);
        }
      } catch {
        return;
      } finally {
        setLoading(false);
      }
    }

    const filtered = applyFilters(stocks, filters);
    setFilteredStocks(filtered);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setFilteredStocks(allStocks);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="فلتر الأسهم" />

        <main className="p-4 space-y-4">
          {/* Market Selector + Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Target className="h-5 w-5 text-primary shrink-0" />
              <Select value={filters.market} onValueChange={(v) => updateFilter('market', v)}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="اختر السوق أو البورصة..." />
                </SelectTrigger>
                <SelectContent>
                  {MARKETS.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setFiltersOpen(!filtersOpen)}
              variant="outline"
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {filtersOpen ? 'إخفاء الفلاتر' : 'عرض الفلاتر'}
            </Button>

            <Button
              onClick={applyFilter}
              disabled={!filters.market || loading}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              تطبيق الفلتر
            </Button>

            <Button variant="outline" onClick={resetFilters} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              إعادة تعيين
            </Button>
          </div>

          {/* Filter Panel */}
          {filtersOpen && (
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  معايير الفلترة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

                  {/* Price Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      السعر
                    </label>
                    <div className="flex gap-2">
                      <OpSelect value={filters.priceOp} onValueChange={(v) => updateFilter('priceOp', v)} />
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        placeholder="القيمة..."
                        value={filters.priceVal}
                        onChange={(e) => updateFilter('priceVal', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Volume Change % */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      حجم التداول كنسبة %
                    </label>
                    <div className="flex gap-2">
                      <OpSelect value={filters.volumeChangePctOp} onValueChange={(v) => updateFilter('volumeChangePctOp', v)} />
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        placeholder="%"
                        value={filters.volumeChangePctVal}
                        onChange={(e) => updateFilter('volumeChangePctVal', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Change % */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      التغير كنسبة %
                    </label>
                    <div className="flex gap-2">
                      <OpSelect value={filters.changePctOp} onValueChange={(v) => updateFilter('changePctOp', v)} />
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        placeholder="%"
                        value={filters.changePctVal}
                        onChange={(e) => updateFilter('changePctVal', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Intraday Change % */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      التغير بالدقائق كنسبة %
                    </label>
                    <div className="flex gap-2">
                      <OpSelect value={filters.intradayChangeOp} onValueChange={(v) => updateFilter('intradayChangeOp', v)} />
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        placeholder="%"
                        value={filters.intradayChangeVal}
                        onChange={(e) => updateFilter('intradayChangeVal', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Real Volume */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      الحجم الحقيقي
                    </label>
                    <div className="flex gap-2">
                      <OpSelect value={filters.realVolumeOp} onValueChange={(v) => updateFilter('realVolumeOp', v)} />
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        placeholder="مثال: 1000000"
                        value={filters.realVolumeVal}
                        onChange={(e) => updateFilter('realVolumeVal', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* RVOL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      بداية دخول سيولة (RVOL)
                    </label>
                    <div className="flex gap-2">
                      <OpSelect value={filters.rvolOp} onValueChange={(v) => updateFilter('rvolOp', v)} />
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        placeholder="مثال: 1.5"
                        value={filters.rvolVal}
                        onChange={(e) => updateFilter('rvolVal', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Liquidity % of Avg Vol */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                      سيولة كافية كنسبة (Avg Vol) %
                    </label>
                    <div className="flex gap-2">
                      <OpSelect value={filters.liquidityPctOp} onValueChange={(v) => updateFilter('liquidityPctOp', v)} />
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        placeholder="%"
                        value={filters.liquidityPctVal}
                        onChange={(e) => updateFilter('liquidityPctVal', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Toggle Filters */}
                  <div className="space-y-3 flex flex-col justify-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.rsiHealthy}
                        onChange={(e) => updateFilter('rsiHealthy', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-medium flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5 text-emerald-500" />
                        زخم صحي (RSI 30–70)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.smallMidCap}
                        onChange={(e) => updateFilter('smallMidCap', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-medium flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-blue-500" />
                        قابلة للحركة (Small/Mid cap)
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.maCrossBullish}
                        onChange={(e) => updateFilter('maCrossBullish', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-xs font-medium flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        تقاطع إيجابي MA50 &gt; MA20
                      </span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <Card className="border-2 border-primary/20">
              <CardContent className="flex items-center justify-center py-16 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-lg font-medium">جاري تحميل بيانات السوق...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {MARKETS.find(m => m.id === filters.market)?.name} — يحسب RSI, MA20, MA50, RVOL
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {!loading && filteredStocks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    النتائج: {filteredStocks.length} سهم
                    <Badge variant="outline" className="text-[10px]">
                      من أصل {allStocks.length}
                    </Badge>
                  </CardTitle>
                  {lastUpdated && (
                    <span className="text-[10px] text-muted-foreground">
                      آخر تحديث: {new Date(lastUpdated).toLocaleTimeString('ar-SA')}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('symbol')}>
                          <div className="flex items-center gap-1">الرمز <SortIcon col="symbol" /></div>
                        </TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead className="cursor-pointer select-none text-left" onClick={() => handleSort('price')}>
                          <div className="flex items-center gap-1">السعر <SortIcon col="price" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none text-left" onClick={() => handleSort('changePct')}>
                          <div className="flex items-center gap-1">التغير % <SortIcon col="changePct" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none text-left" onClick={() => handleSort('volume')}>
                          <div className="flex items-center gap-1">الحجم <SortIcon col="volume" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none text-left" onClick={() => handleSort('rvolume')}>
                          <div className="flex items-center gap-1">RVOL <SortIcon col="rvolume" /></div>
                        </TableHead>
                        <TableHead className="text-left">RSI</TableHead>
                        <TableHead className="text-left">MA20</TableHead>
                        <TableHead className="text-left">MA50</TableHead>
                        <TableHead className="text-center">تقاطع</TableHead>
                        <TableHead className="cursor-pointer select-none text-left" onClick={() => handleSort('marketCap')}>
                          <div className="flex items-center gap-1">القيمة السوقية <SortIcon col="marketCap" /></div>
                        </TableHead>
                        <TableHead className="text-center">النوع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedStocks.map((stock) => (
                        <TableRow key={stock.symbol} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-mono font-medium text-xs">{stock.symbol}</TableCell>
                          <TableCell className="text-xs max-w-[160px] truncate">{stock.name}</TableCell>
                          <TableCell className="text-left text-xs font-medium">{stock.price.toLocaleString()}</TableCell>
                          <TableCell className={cn('text-left text-xs font-medium', stock.changePct >= 0 ? 'text-green-600' : 'text-red-600')}>
                            <div className="flex items-center gap-1">
                              {stock.changePct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                            </div>
                          </TableCell>
                          <TableCell className="text-left text-xs">{formatNum(stock.volume)}</TableCell>
                          <TableCell className="text-left">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1.5',
                                stock.rvolume >= 2 ? 'bg-green-100 text-green-700 border-green-300' :
                                stock.rvolume >= 1 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                'bg-gray-100 text-gray-600 border-gray-300'
                              )}
                            >
                              {stock.rvolume.toFixed(2)}x
                            </Badge>
                          </TableCell>
                          <TableCell className="text-left">
                            {stock.rsi !== null ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] px-1.5',
                                  stock.rsi >= 30 && stock.rsi <= 70 ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                                  stock.rsi > 70 ? 'bg-red-100 text-red-700 border-red-300' :
                                  'bg-amber-100 text-amber-700 border-amber-300'
                                )}
                              >
                                {stock.rsi}
                              </Badge>
                            ) : <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                          <TableCell className="text-left text-xs">{stock.ma20 ?? '—'}</TableCell>
                          <TableCell className="text-left text-xs">{stock.ma50 ?? '—'}</TableCell>
                          <TableCell className="text-center">
                            {stock.maCrossBullish ? (
                              <Badge className="text-[9px] bg-green-500 text-white px-1.5 py-0">تقاطع ✓</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-left text-xs">{formatMarketCap(stock.marketCap, stock.currency)}</TableCell>
                          <TableCell className="text-center">
                            {stock.capType ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] px-1.5',
                                  stock.capType === 'large' ? 'border-blue-300 text-blue-700' :
                                  stock.capType === 'mid' ? 'border-purple-300 text-purple-700' :
                                  'border-orange-300 text-orange-700'
                                )}
                              >
                                {stock.capType === 'large' ? 'كبير' : stock.capType === 'mid' ? 'متوسط' : 'صغير'}
                              </Badge>
                            ) : <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State - No data loaded yet */}
          {!loading && filteredStocks.length === 0 && !loadedMarket && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
                  <Search className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">فلتر الأسهم المتقدم</h2>
                <p className="text-muted-foreground mb-6 max-w-lg text-sm">
                  اختر السوق أو البورصة ثم اضبط معايير الفلترة واضغط تطبيق الفلتر.
                  <br />يتضمن حساب RSI, MA20, MA50, RVOL, وتقاطع المتوسطات المتحركة.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-w-2xl">
                  {MARKETS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        updateFilter('market', m.id);
                      }}
                      className="px-3 py-2 rounded-lg border text-xs hover:bg-muted/50 hover:border-primary/30 transition-all"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State - Data loaded but no matches */}
          {!loading && filteredStocks.length === 0 && loadedMarket && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد أسهم مطابقة</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  تم تحميل {allStocks.length} سهم من {MARKETS.find(m => m.id === loadedMarket)?.name}
                  <br />ولكن لا توجد نتائج تطابق معايير الفلترة الحالية
                </p>
                <Button variant="outline" onClick={resetFilters}>إعادة تعيين الفلاتر</Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
