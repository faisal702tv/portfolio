'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/lib/helpers';
import { Globe, TrendingUp, TrendingDown } from 'lucide-react';
import { marketIndices, cryptoData, commoditiesData } from '@/data/markets';

interface QuoteData {
  price: number;
  change: number;
  changePct: number;
}

interface MarketIndexDisplay {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  group: string;
}

const GROUPS = {
  gulf: {
    title: 'الأسواق الخليجية',
    symbols: [
      { yahoo: '^TASI.SR', symbol: 'TASI', name: 'تداول جميع الأسهم' },
      { yahoo: 'NOMUC', symbol: 'NOMUC', name: 'سوق نمو (NomuC)' },
      { yahoo: '^FTFADGI', symbol: 'FTADGI', name: 'فوتسي أبوظبي العام' },
      { yahoo: '^DFMGI', symbol: 'DFMGI', name: 'مؤشر دبي المالي' },
      { yahoo: '^GNRI', symbol: 'KSE', name: 'مؤشر الكويت' },
      { yahoo: '^QSI', symbol: 'QSE', name: 'مؤشر قطر' },
      { yahoo: '^MSI30', symbol: 'MSX30', name: 'مؤشر مسقط 30' },
      { yahoo: '^BSEX', symbol: 'BSE', name: 'مؤشر البحرين' },
    ],
  },
  arab: {
    title: 'الأسواق العربية',
    symbols: [
      { yahoo: '^CASE30', symbol: 'EGX30', name: 'مؤشر مصر 30' },
    ],
  },
  global: {
    title: 'الأسواق العالمية',
    symbols: [
      { yahoo: '^GSPC', symbol: 'S&P 500', name: 'مؤشر ستاندرد آند بورز' },
      { yahoo: '^DJI', symbol: 'DJI', name: 'داو جونز' },
      { yahoo: '^IXIC', symbol: 'NASDAQ', name: 'ناسداك' },
      { yahoo: '^RUT', symbol: 'RUSSELL', name: 'راسيل 2000' },
      { yahoo: '^FTSE', symbol: 'FTSE', name: 'فوتسي 100' },
      { yahoo: '^N225', symbol: 'NIKKEI', name: 'نيكي 225' },
      { yahoo: '^VIX', symbol: 'VIX', name: 'مؤشر الخوف' },
    ],
  },
  commodities: {
    title: 'السلع والعملات',
    symbols: [
      { yahoo: 'GC=F', symbol: 'GOLD', name: 'الذهب' },
      { yahoo: 'CL=F', symbol: 'WTI', name: 'نفط WTI' },
      { yahoo: 'BZ=F', symbol: 'BRENT', name: 'نفط برنت' },
      { yahoo: 'BTC-USD', symbol: 'BTC', name: 'بيتكوين' },
      { yahoo: 'ETH-USD', symbol: 'ETH', name: 'إيثيريوم' },
    ],
  },
};

function MarketIndexCard({ index }: { index: MarketIndexDisplay }) {
  const isPositive = index.changePct >= 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border hover:bg-accent/50 transition-all duration-200 cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isPositive
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-red-100 dark:bg-red-900/30'
          }`}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div>
          <p className="font-bold text-sm">{index.symbol}</p>
          <p className="text-xs text-muted-foreground">{index.name}</p>
        </div>
      </div>
      <div className="text-left">
        <p className="font-bold">{formatNumber(index.price, 2)}</p>
        <Badge variant="outline" className={`text-[10px] ${isPositive
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
          }`}>
          {isPositive ? '+' : ''}{formatNumber(index.changePct, 2)}%
        </Badge>
      </div>
    </div>
  );
}

export function GlobalMarketsWidget() {
  const [marketData, setMarketData] = useState<MarketIndexDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch('/api/ticker');
      const json = await res.json();
      if (!json.success || !json.data) return;

      const raw: Record<string, QuoteData> = json.data;
      const items: MarketIndexDisplay[] = [];

      for (const [groupKey, group] of Object.entries(GROUPS)) {
        for (const sym of group.symbols) {
          const quote = raw[sym.yahoo];
          if (quote && quote.price > 0) {
            items.push({
              symbol: sym.symbol,
              name: sym.name,
              price: quote.price,
              change: quote.change,
              changePct: quote.changePct,
              group: group.title,
            });
          }
        }
      }

      if (items.length > 0) {
        setMarketData(items);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 60000);
    return () => clearInterval(interval);
  }, [fetchMarkets]);

  const groupedData = marketData.reduce<Record<string, MarketIndexDisplay[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">المؤشرات العالمية</CardTitle>
            <p className="text-xs text-muted-foreground">
              {loading ? 'جاري التحميل...' : `${marketData.length} مؤشر - تحديث مباشر`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {Object.entries(groupedData).map(([groupTitle, indices]) => (
          <div key={groupTitle} className="mb-4 last:mb-0">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">{groupTitle}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {indices.map((index) => (
                <MarketIndexCard key={index.symbol} index={index} />
              ))}
            </div>
          </div>
        ))}
        {marketData.length === 0 && !loading && (
          <p className="text-center text-muted-foreground py-4">لا توجد بيانات متاحة حالياً</p>
        )}
      </CardContent>
    </Card>
  );
}
