'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/helpers';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
} from 'lucide-react';

interface StockMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume?: number;
  value?: number;
}

interface StockMoversProps {
  gainers: StockMover[];
  losers: StockMover[];
  mostTraded: StockMover[];
  mostActiveByValue?: StockMover[];
}

function StockMoverCard({ stock, type }: { stock: StockMover; type: 'gainer' | 'loser' | 'traded' | 'value' }) {
  const isPositive = stock.changePct >= 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          type === 'gainer' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
          type === 'loser' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
          type === 'value' ? 'bg-gradient-to-br from-purple-500 to-violet-600' :
          'bg-gradient-to-br from-amber-500 to-orange-600'
        } shadow-lg`}>
          {type === 'gainer' && <TrendingUp className="h-5 w-5 text-white" />}
          {type === 'loser' && <TrendingDown className="h-5 w-5 text-white" />}
          {type === 'traded' && <Activity className="h-5 w-5 text-white" />}
          {type === 'value' && <DollarSign className="h-5 w-5 text-white" />}
        </div>
        <div>
          <p className="font-bold text-sm group-hover:text-primary transition-colors">{stock.symbol}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[120px]">{stock.name}</p>
        </div>
      </div>
      <div className="text-left">
        <p className="font-bold">{formatNumber(stock.price, 2)}</p>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className={`text-[10px] px-1.5 ${
            isPositive
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
          }`}>
            {isPositive ? '+' : ''}{formatNumber(stock.changePct, 2)}%
          </Badge>
          {stock.volume && (
            <span className="text-[10px] text-muted-foreground">
              {(stock.volume / 1000000).toFixed(1)}M
            </span>
          )}
          {stock.value && (
            <span className="text-[10px] text-muted-foreground font-semibold">
              {(stock.value / 1000000).toFixed(0)}M ر.س
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function StockMoversSection({ gainers, losers, mostTraded, mostActiveByValue }: StockMoversProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <Card className="border-2 border-green-200 dark:border-green-900/50 bg-gradient-to-b from-green-50/50 to-transparent dark:from-green-900/10">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-green-700 dark:text-green-400">الأكثر ارتفاعاً</CardTitle>
              <p className="text-xs text-muted-foreground">الجلسة الحالية</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {gainers.map((stock) => (
            <StockMoverCard key={stock.symbol} stock={stock} type="gainer" />
          ))}
        </CardContent>
      </Card>

      <Card className="border-2 border-red-200 dark:border-red-900/50 bg-gradient-to-b from-red-50/50 to-transparent dark:from-red-900/10">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-600 shadow-md">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-red-700 dark:text-red-400">الأكثر انخفاضاً</CardTitle>
              <p className="text-xs text-muted-foreground">الجلسة الحالية</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {losers.map((stock) => (
            <StockMoverCard key={stock.symbol} stock={stock} type="loser" />
          ))}
        </CardContent>
      </Card>

      <Card className="border-2 border-amber-200 dark:border-amber-900/50 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-900/10">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-amber-700 dark:text-amber-400">الأكثر تداولاً</CardTitle>
              <p className="text-xs text-muted-foreground">حسب الكمية</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {mostTraded.map((stock) => (
            <StockMoverCard key={stock.symbol} stock={stock} type="traded" />
          ))}
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-200 dark:border-purple-900/50 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-900/10">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 shadow-md">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg text-purple-700 dark:text-purple-400">الأكثر نشاطاً بالقيمة</CardTitle>
              <p className="text-xs text-muted-foreground">حسب قيمة التداول</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {(mostActiveByValue || []).map((stock) => (
            <StockMoverCard key={stock.symbol} stock={stock} type="value" />
          ))}
          {(!mostActiveByValue || mostActiveByValue.length === 0) && (
            <p className="text-center text-muted-foreground py-4 text-sm">جاري التحميل...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to fetch live Saudi stock movers from API
export function useLiveStockMovers() {
  const [data, setData] = useState<{ gainers: StockMover[]; losers: StockMover[]; mostTraded: StockMover[]; mostActiveByValue: StockMover[] }>({
    gainers: [], losers: [], mostTraded: [], mostActiveByValue: [],
  });

  useEffect(() => {
    let mounted = true;
    async function fetchMovers() {
      try {
        const res = await fetch('/api/live-prices');
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success || !json.data) return;

        const STOCK_NAMES: Record<string, string> = {
          '1120.SR': 'أرامكو', '1180.SR': 'الراجحي', '7010.SR': 'الاتصالات',
          '2222.SR': 'المملكة القابضة', '2002.SR': 'سابك', '4002.SR': 'بنك الرياض',
          '2380.SR': 'الإنماء للتعمير', '1060.SR': 'الجزيرة', '4050.SR': 'البنك الفرنسي',
          '6010.SR': 'المراعي', '8070.SR': 'التعاونية', '4260.SR': 'الإنماء',
          '4001.SR': 'ساب', '4160.SR': 'العربي الوطني', '1201.SR': 'كيان',
          '5110.SR': 'ثبات', '4180.SR': 'البلاد', '4190.SR': 'الجزيرة',
          '4100.SR': 'ساب تكافل', '4150.SR': 'الأهلي',
        };

        const stocks: StockMover[] = [];
        for (const [key, value] of Object.entries(json.data)) {
          if (key.endsWith('.SR') && STOCK_NAMES[key]) {
            const d = value as any;
            stocks.push({
              symbol: key,
              name: STOCK_NAMES[key],
              price: d.price,
              change: d.change,
              changePct: d.changePct,
              value: d.price * 1000000, // approximate
            });
          }
        }

        if (!mounted || stocks.length === 0) return;

        const sorted = [...stocks];
        setData({
          gainers: [...sorted].sort((a, b) => b.changePct - a.changePct).slice(0, 5),
          losers: [...sorted].sort((a, b) => a.changePct - b.changePct).slice(0, 5),
          mostTraded: [...sorted].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5),
          mostActiveByValue: [...sorted].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5),
        });
      } catch {}
    }
    fetchMovers();
    const interval = setInterval(fetchMovers, 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return data;
}
