'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getMarketByCode,
  getIndicesByMarket,
  getStocksByMarket,
  cryptoData,
  commoditiesData,
  getCryptoByCategory,
  getCommoditiesByCategory
} from '@/data/markets';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  Calendar,
  BarChart3,
  Globe,
  RefreshCw,
  Star,
  StarOff,
  Info,
  Bitcoin
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, use, useMemo, useCallback } from 'react';
import { notFound } from 'next/navigation';

const COMMODITY_YAHOO_MAP: Record<string, string> = {
  'الذهب': 'GC=F', 'Gold': 'GC=F', 'GOLD': 'GC=F', 'XAU': 'GC=F',
  'الفضة': 'SI=F', 'Silver': 'SI=F', 'SILVER': 'SI=F', 'XAG': 'SI=F',
  'البلاتين': 'PL=F', 'Platinum': 'PL=F', 'XPT': 'PL=F',
  'البلاديوم': 'PA=F', 'Palladium': 'PA=F', 'XPD': 'PA=F',
  'نفط WTI': 'CL=F', 'Crude Oil WTI': 'CL=F', 'WTI': 'CL=F', 'CL': 'CL=F',
  'نفط برنت': 'BZ=F', 'Brent Crude': 'BZ=F', 'BRENT': 'BZ=F', 'BR': 'BZ=F',
  'الغاز الطبيعي': 'NG=F', 'Natural Gas': 'NG=F', 'NGAS': 'NG=F', 'NG': 'NG=F', 'NATGAS': 'NG=F',
  'النحاس': 'HG=F', 'Copper': 'HG=F', 'COPPER': 'HG=F', 'HG': 'HG=F',
  'القمح': 'ZW=F', 'Wheat': 'ZW=F', 'WHEAT': 'ZW=F', 'ZW': 'ZW=F',
  'الذرة': 'ZC=F', 'Corn': 'ZC=F', 'CORN': 'ZC=F', 'ZC': 'ZC=F',
  'فول الصويا': 'ZS=F', 'Soybeans': 'ZS=F', 'SOYB': 'ZS=F', 'ZS': 'ZS=F',
  'القهوة': 'KC=F', 'Coffee': 'KC=F', 'COFFEE': 'KC=F', 'KC': 'KC=F',
  'القطن': 'CT=F', 'Cotton': 'CT=F', 'COTTON': 'CT=F', 'CT': 'CT=F',
  'السكر': 'SB=F', 'Sugar': 'SB=F', 'SUGAR': 'SB=F', 'SB': 'SB=F',
  'الكاكاو': 'CC=F', 'Cocoa': 'CC=F', 'COCOA': 'CC=F', 'CC': 'CC=F',
  'زيت التدفئة': 'HO=F', 'Heating Oil': 'HO=F', 'HEAT': 'HO=F',
  'البنزين': 'RB=F', 'Gasoline RBOB': 'RB=F', 'RBOB': 'RB=F',
  'الفحم': 'MTF=F', 'Coal': 'MTF=F', 'COAL': 'MTF=F',
  'الأرز': 'ZR=F', 'Rice': 'ZR=F', 'RICE': 'ZR=F',
  'عصير البرتقال': 'OJ=F', 'Orange Juice': 'OJ=F', 'OJ': 'OJ=F',
  'المواشي الحية': 'LE=F', 'Live Cattle': 'LE=F', 'CATTLE': 'LE=F',
  'ماشية التسمين': 'GF=F', 'Feeder Cattle': 'GF=F', 'FEEDER': 'GF=F',
  'الألمنيوم': 'ALI=F', 'Aluminum': 'ALI=F', 'ALU': 'ALI=F',
  'الزنك': 'ZNC=F', 'Zinc': 'ZNC=F', 'ZINC': 'ZNC=F',
  'النيكل': 'NIK=F', 'Nickel': 'NIK=F', 'NICKEL': 'NIK=F',
  'القصدير': 'TIN=F', 'Tin': 'TIN=F',
  'BCOM': '^BCOM', 'CRB': '^CRY', 'GSCI': '^SPGSCI'
};

interface MarketPageProps {
  params: Promise<{ market: string }>;
}

interface TickerQuote {
  price: number;
  change: number;
  changePct: number;
  currency?: string;
  source?: string;
}

type BaseMarketIndex = ReturnType<typeof getIndicesByMarket>[number];

type DisplayIndex = Omit<BaseMarketIndex, 'price' | 'change' | 'changePct'> & {
  price: number | null;
  change: number | null;
  changePct: number | null;
  currency?: string;
  source?: string | null;
};

const formatEn = (num: number | null | undefined, decimals: number = 2) => {
  if (num === null || num === undefined || !Number.isFinite(num)) return '—';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const formatLargeEn = (num: number | null | undefined) => {
  if (num === null || num === undefined || !Number.isFinite(num)) return '—';
  if (num >= 1e12) return `${(num / 1e12).toLocaleString('en-US', { maximumFractionDigits: 2 })}T`;
  if (num >= 1e9) return `${(num / 1e9).toLocaleString('en-US', { maximumFractionDigits: 2 })}B`;
  if (num >= 1e6) return `${(num / 1e6).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`;
  if (num >= 1e3) return `${(num / 1e3).toLocaleString('en-US', { maximumFractionDigits: 2 })}K`;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

function getQuoteSourceMeta(source?: string | null): { label: string; variant: 'default' | 'secondary' | 'outline' } {
  if (!source) return { label: 'غير محدد', variant: 'outline' };
  if (source.startsWith('yahoo_')) return { label: 'Yahoo', variant: 'default' };
  if (source.startsWith('official_')) return { label: 'رسمي', variant: 'secondary' };
  if (source === 'stooq') return { label: 'Stooq', variant: 'secondary' };
  if (source.startsWith('provider_')) return { label: 'مزود بديل', variant: 'outline' };
  return { label: source, variant: 'outline' };
}

export default function MarketDetailPage({ params }: MarketPageProps) {
  const resolvedParams = use(params);
  const marketCode = resolvedParams.market.toUpperCase();
  const market = getMarketByCode(marketCode);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [liveIndexQuotes, setLiveIndexQuotes] = useState<Record<string, TickerQuote>>({});

  useEffect(() => {
    const updateTime = () => {
      if (market) {
        try {
          setCurrentTime(new Date().toLocaleTimeString('ar-SA-u-ca-gregory', { timeZone: market.timezone }));
        } catch {
          setCurrentTime(new Date().toLocaleTimeString('ar-SA-u-ca-gregory'));
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [market]);

  if (!market) {
    notFound();
  }

  const indices = useMemo(() => getIndicesByMarket(marketCode), [marketCode]);
  const stocks = useMemo(() => getStocksByMarket(marketCode), [marketCode]);
  const indexSymbols = useMemo(
    () => indices.map((index) => index.yahoo).filter((yahoo): yahoo is string => Boolean(yahoo)),
    [indices]
  );

  const getLiveCommodity = useCallback((item: any) => {
    const yahooSym = COMMODITY_YAHOO_MAP[item.symbol] || COMMODITY_YAHOO_MAP[item.name] || COMMODITY_YAHOO_MAP[item.nameEn] || item.symbol;
    const live = liveIndexQuotes[yahooSym];
    return {
      price: live?.price ?? item.price ?? 0,
      change: live?.change ?? item.change ?? 0,
      changePct: live?.changePct ?? item.changePct ?? 0,
    };
  }, [liveIndexQuotes]);

  const refreshLiveIndexQuotes = useCallback(async () => {
    let symbolsToFetch = [...indexSymbols];
    if (marketCode === 'COMMODITIES') {
      symbolsToFetch = Array.from(new Set([...symbolsToFetch, ...Object.values(COMMODITY_YAHOO_MAP)]));
    }

    if (symbolsToFetch.length === 0) {
      setLiveIndexQuotes({});
      return;
    }

    try {
      const res = await fetch(`/api/ticker?symbols=${encodeURIComponent(symbolsToFetch.join(','))}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const payload = await res.json();
      const quotes = payload?.success && payload?.data ? payload.data : {};

      if (marketCode === 'COMMODITIES') {
        let savedKeys: any = {};
        try { savedKeys = JSON.parse(localStorage.getItem('api_keys') || '{}'); } catch (e) { }

        try {
          const bRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=PAXGUSDT');
          if (bRes.ok) {
            const d = await bRes.json();
            if (!quotes['GC=F'] || !quotes['GC=F'].price) {
              quotes['GC=F'] = { price: parseFloat(d.lastPrice), change: parseFloat(d.priceChange), changePct: parseFloat(d.priceChangePercent) };
            }
          }
        } catch (e) { }

        if (savedKeys.financial_modeling_prep) {
          try {
            const fRes = await fetch(`https://financialmodelingprep.com/api/v3/quote/GC=F,SI=F,CL=F,BZ=F,NG=F?apikey=${savedKeys.financial_modeling_prep}`);
            if (fRes.ok) {
              const data = await fRes.json();
              data.forEach((item: any) => { quotes[item.symbol] = { price: item.price, change: item.change, changePct: item.changesPercentage }; });
            }
          } catch (e) { }
        }
        if (savedKeys.twelve_data && !quotes['CL=F']) {
          try {
            const tRes = await fetch(`https://api.twelvedata.com/quote?symbol=XAU/USD,XAG/USD,WTI/USD,BRENT/USD&apikey=${savedKeys.twelve_data}`);
            if (tRes.ok) {
              const d = await tRes.json();
              if (d['XAU/USD']) quotes['GC=F'] = { price: parseFloat(d['XAU/USD'].close), change: parseFloat(d['XAU/USD'].change), changePct: parseFloat(d['XAU/USD'].percent_change) };
              if (d['XAG/USD']) quotes['SI=F'] = { price: parseFloat(d['XAG/USD'].close), change: parseFloat(d['XAG/USD'].change), changePct: parseFloat(d['XAG/USD'].percent_change) };
              if (d['WTI/USD']) quotes['CL=F'] = { price: parseFloat(d['WTI/USD'].close), change: parseFloat(d['WTI/USD'].change), changePct: parseFloat(d['WTI/USD'].percent_change) };
              if (d['BRENT/USD']) quotes['BZ=F'] = { price: parseFloat(d['BRENT/USD'].close), change: parseFloat(d['BRENT/USD'].change), changePct: parseFloat(d['BRENT/USD'].percent_change) };
            }
          } catch (e) { }
        }
      }

      setLiveIndexQuotes(quotes);
    } catch {
      // Keep last successful values if refresh fails.
    }
  }, [indexSymbols, marketCode]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!active) return;
      await refreshLiveIndexQuotes();
    };

    void run();
    const interval = setInterval(() => {
      void run();
    }, 30_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [refreshLiveIndexQuotes]);

  const indicesWithLive = useMemo<DisplayIndex[]>(
    () =>
      indices.map((index) => {
        if (!index.yahoo) {
          return {
            ...index,
            price: index.price,
            change: index.change,
            changePct: index.changePct,
            currency: index.currency,
            source: null,
          };
        }
        const quote = liveIndexQuotes[index.yahoo];
        if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
          return {
            ...index,
            price: null,
            change: null,
            changePct: null,
            currency: index.currency,
            source: null,
          };
        }
        return {
          ...index,
          price: quote.price,
          change: Number.isFinite(quote.change) ? quote.change : 0,
          changePct: Number.isFinite(quote.changePct) ? quote.changePct : 0,
          currency: quote.currency || index.currency,
          source: quote.source || null,
        };
      }),
    [indices, liveIndexQuotes]
  );

  const mainIndex = indicesWithLive[0];
  const mainIndexLive = Boolean(mainIndex?.yahoo && liveIndexQuotes[mainIndex.yahoo]?.price > 0);
  const mainIndexHasDelta = Boolean(mainIndex && mainIndex.change !== null && mainIndex.changePct !== null);
  const mainIndexPositive = (mainIndex?.changePct ?? 0) >= 0;

  const handleRefresh = () => {
    setIsRefreshing(true);
    void refreshLiveIndexQuotes().finally(() => {
      setIsRefreshing(false);
    });
  };

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Check if market is open
  const now = new Date();
  const currentHour = now.getHours();
  const isOpen = market.type === 'crypto' || (currentHour >= 10 && currentHour < 15);

  // Render Crypto Market
  if (market.type === 'crypto') {
    const mainCoins = cryptoData.coins.slice(0, 5);

    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Sidebar />

        <div className="mr-16 lg:mr-64 transition-all duration-300">
          <TopBar
            title={market.name}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          <main className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Link href="/markets">
                <Button variant="ghost" size="icon">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{market.flag}</span>
                <div>
                  <h1 className="text-2xl font-bold">{market.name}</h1>
                  <p className="text-muted-foreground">{market.nameEn}</p>
                </div>
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  نشط 24/7
                </Badge>
              </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cryptoData.indices.map((index) => {
                const isPositive = index.change >= 0;
                return (
                  <Card key={index.symbol} className={index.symbol === 'TOTAL' ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{index.name}</p>
                          <p className="text-2xl font-bold mt-1">
                            {index.symbol === 'TOTAL'
                              ? formatLargeEn(index.price)
                              : <span dir="ltr">{formatEn(index.price, 2)}{index.currencySymbol}</span>
                            }
                          </p>
                        </div>
                        <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          {isPositive ? (
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          ) : (
                            <TrendingDown className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                      </div>
                      <div className={`mt-2 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                        {isPositive ? '+' : ''}{formatEn(index.changePct, 2)}%
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Crypto Categories */}
            <Tabs defaultValue="main">
              <TabsList>
                <TabsTrigger value="main">العملات الرئيسية</TabsTrigger>
                <TabsTrigger value="defi">DeFi</TabsTrigger>
                <TabsTrigger value="layer2">Layer 2</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
                <TabsTrigger value="meme">Meme</TabsTrigger>
                <TabsTrigger value="stable">مستقرة</TabsTrigger>
              </TabsList>

              {['main', 'defi', 'layer2', 'ai', 'meme', 'stable'].map((category) => (
                <TabsContent key={category} value={category}>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-right py-3 px-4 font-medium text-muted-foreground">#</th>
                              <th className="text-right py-3 px-4 font-medium text-muted-foreground">العملة</th>
                              <th className="text-right py-3 px-4 font-medium text-muted-foreground">السعر</th>
                              <th className="text-right py-3 px-4 font-medium text-muted-foreground">التغيير 24h</th>
                              <th className="text-right py-3 px-4 font-medium text-muted-foreground">القيمة السوقية</th>
                              <th className="text-right py-3 px-4 font-medium text-muted-foreground">الحجم</th>
                              <th className="text-center py-3 px-4 font-medium text-muted-foreground">مفضل</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getCryptoByCategory(category).map((coin, index) => {
                              const isPositive = coin.change >= 0;
                              const isFavorite = favorites.includes(coin.symbol);

                              return (
                                <tr key={coin.symbol} className="border-b hover:bg-muted/50 transition-colors">
                                  <td className="py-3 px-4 text-muted-foreground">{index + 1}</td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">{coin.icon}</span>
                                      <div>
                                        <p className="font-bold text-primary">{coin.symbol}</p>
                                        <p className="text-xs text-muted-foreground">{coin.name}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 font-semibold" dir="ltr">
                                    ${formatEn(coin.price, coin.price < 1 ? 6 : 2)}
                                  </td>
                                  <td className={`py-3 px-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                                    <div className="flex items-center justify-end gap-1">
                                      {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                      {isPositive ? '+' : ''}{formatEn(coin.changePct, 2)}%
                                    </div>
                                  </td>
                                  <td className="py-3 px-4" dir="ltr">{formatLargeEn(coin.marketCap)}</td>
                                  <td className="py-3 px-4" dir="ltr">{formatLargeEn(coin.volume)}</td>
                                  <td className="py-3 px-4 text-center">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => toggleFavorite(coin.symbol)}
                                    >
                                      {isFavorite ? (
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                      ) : (
                                        <StarOff className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Crypto Exchanges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  بورصات العملات المشفرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cryptoData.exchanges.map((exchange) => (
                    <div key={exchange.code} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{exchange.flag}</span>
                        <div>
                          <p className="font-semibold">{exchange.name}</p>
                          <p className="text-xs text-muted-foreground">{exchange.country}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">حجم 24h:</span>
                          <span className="font-medium" dir="ltr">{formatLargeEn(exchange.volume24h)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">أزواج:</span>
                          <span className="font-medium">{exchange.pairs.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // Render Commodities Market
  if (market.type === 'commodity') {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Sidebar />

        <div className="mr-16 lg:mr-64 transition-all duration-300">
          <TopBar
            title={market.name}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />

          <main className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Link href="/markets">
                <Button variant="ghost" size="icon">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{market.flag}</span>
                <div>
                  <h1 className="text-2xl font-bold">{market.name}</h1>
                  <p className="text-muted-foreground">{market.nameEn}</p>
                </div>
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <Badge variant={isOpen ? "default" : "secondary"} className="gap-1">
                  <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  {isOpen ? 'مفتوح' : 'مغلق'}
                </Badge>
              </div>
            </div>

            {/* Commodity Indices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {commoditiesData.indices.map((index) => {
                const live = getLiveCommodity(index);
                const isPositive = live.change >= 0;
                return (
                  <Card key={index.symbol}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{index.name}</p>
                          <p className="text-2xl font-bold mt-1" dir="ltr">${formatEn(live.price, 2)}</p>
                        </div>
                        <div className={`p-3 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          {isPositive ? (
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          ) : (
                            <TrendingDown className="h-6 w-6 text-red-600" />
                          )}
                        </div>
                      </div>
                      <div className={`mt-2 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                        {isPositive ? '+' : ''}{formatEn(live.change, 2)} ({isPositive ? '+' : ''}{formatEn(live.changePct, 2)}%)
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Commodity Categories */}
            <Tabs defaultValue="precious">
              <TabsList className="flex-wrap">
                <TabsTrigger value="precious">🥇 المعادن الثمينة</TabsTrigger>
                <TabsTrigger value="energy">🛢️ الطاقة</TabsTrigger>
                <TabsTrigger value="agriculture">🌾 الزراعة</TabsTrigger>
                <TabsTrigger value="industrial">⚙️ المعادن الصناعية</TabsTrigger>
                <TabsTrigger value="livestock">🐄 الماشية</TabsTrigger>
              </TabsList>

              <TabsContent value="precious">
                <Card>
                  <CardHeader>
                    <CardTitle>المعادن الثمينة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {commoditiesData.preciousMetals.map((item) => {
                        const live = getLiveCommodity(item);
                        const isPositive = live.changePct >= 0;
                        return (
                          <div key={item.symbol} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-3xl">{item.icon}</span>
                              <div>
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.nameEn}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold" dir="ltr">${formatEn(live.price, 2)}</span>
                                <Badge variant={isPositive ? "default" : "destructive"} className="gap-1" dir="ltr">
                                  {isPositive ? '+' : ''}{formatEn(live.changePct, 2)}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">للكل {item.unitAr}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="energy">
                <Card>
                  <CardHeader>
                    <CardTitle>الطاقة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {commoditiesData.energy.map((item) => {
                        const live = getLiveCommodity(item);
                        const isPositive = live.changePct >= 0;
                        return (
                          <div key={item.symbol} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-3xl">{item.icon}</span>
                              <div>
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.nameEn}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold" dir="ltr">${formatEn(live.price, 2)}</span>
                                <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
                                  {isPositive ? '+' : ''}{formatEn(live.changePct, 2)}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">للكل {item.unitAr}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="agriculture">
                <Card>
                  <CardHeader>
                    <CardTitle>المنتجات الزراعية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">السلعة</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">السعر</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">التغيير</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">الوحدة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {commoditiesData.agriculture.map((item) => {
                            const live = getLiveCommodity(item);
                            const isPositive = live.changePct >= 0;
                            return (
                              <tr key={item.symbol} className="border-b hover:bg-muted/50 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{item.icon}</span>
                                    <div>
                                      <p className="font-medium">{item.name}</p>
                                      <p className="text-xs text-muted-foreground">{item.nameEn}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-semibold" dir="ltr">${formatEn(live.price, 2)}</td>
                                <td className={`py-3 px-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                                  <div className="flex items-center justify-end gap-1">
                                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    {isPositive ? '+' : ''}{formatEn(live.changePct, 2)}%
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-muted-foreground">{item.unitAr}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="industrial">
                <Card>
                  <CardHeader>
                    <CardTitle>المعادن الصناعية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {commoditiesData.industrialMetals.map((item) => {
                        const live = getLiveCommodity(item);
                        const isPositive = live.changePct >= 0;
                        return (
                          <div key={item.symbol} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{item.icon}</span>
                              <p className="font-semibold">{item.name}</p>
                            </div>
                            <p className="text-xl font-bold" dir="ltr">${formatEn(live.price, 2)}</p>
                            <Badge variant={isPositive ? "outline" : "destructive"} className="mt-2 gap-1" dir="ltr">
                              {isPositive ? '+' : ''}{formatEn(live.changePct, 2)}%
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="livestock">
                <Card>
                  <CardHeader>
                    <CardTitle>الماشية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {commoditiesData.livestock.map((item) => {
                        const live = getLiveCommodity(item);
                        const isPositive = live.changePct >= 0;
                        return (
                          <div key={item.symbol} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-3xl">{item.icon}</span>
                              <div>
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.nameEn}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold" dir="ltr">${formatEn(live.price, 2)}</span>
                                <Badge variant={isPositive ? "default" : "destructive"} className="gap-1" dir="ltr">
                                  {isPositive ? '+' : ''}{formatEn(live.changePct, 2)}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">للكل {item.unitAr}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    );
  }

  // Render Stock Market (default)
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />

      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar
          title={market.name}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/markets">
              <Button variant="ghost" size="icon">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{market.flag}</span>
              <div>
                <h1 className="text-2xl font-bold">{market.name}</h1>
                <p className="text-muted-foreground">{market.nameEn}</p>
              </div>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <Badge variant={isOpen ? "default" : "secondary"} className="gap-1">
                <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                {isOpen ? 'مفتوح' : 'مغلق'}
              </Badge>
              <Badge variant="outline">{market.countryAr}</Badge>
            </div>
          </div>

          {/* Market Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Main Index */}
            {mainIndex && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{mainIndex.name}</p>
                      <p className="text-3xl font-bold mt-1" dir="ltr">
                        {mainIndex.price === null ? '—' : formatEn(mainIndex.price, 2)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${mainIndexHasDelta ? (mainIndexPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30') : 'bg-muted'}`}>
                      {mainIndexHasDelta ? (
                        mainIndexPositive ? (
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        ) : (
                          <TrendingDown className="h-6 w-6 text-red-600" />
                        )
                      ) : (
                        <BarChart3 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {mainIndexHasDelta ? (
                    <div className={`mt-2 text-sm font-medium ${mainIndexPositive ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                      {mainIndexPositive ? '+' : ''}{formatEn(mainIndex.change ?? 0, 2)} ({mainIndexPositive ? '+' : ''}{formatEn(mainIndex.changePct ?? 0, 2)}%)
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-muted-foreground">
                      لا توجد بيانات مباشرة حالياً
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-1">
                    <Badge variant={mainIndexLive ? 'default' : 'outline'} className="text-[11px]">
                      {mainIndexLive ? 'بيانات مباشرة' : 'غير متاح حالياً'}
                    </Badge>
                    <Badge variant={getQuoteSourceMeta(mainIndex.source).variant} className="text-[11px]">
                      {getQuoteSourceMeta(mainIndex.source).label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Currency */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">العملة</p>
                    <p className="text-xl font-bold">{market.currencySymbol} {market.currencyName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trading Hours */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ساعات التداول</p>
                    <p className="text-xl font-bold">{market.openTime} - {market.closeTime}</p>
                    <p className="text-xs text-muted-foreground">{currentTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trading Days */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <Calendar className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">أيام التداول</p>
                    <p className="text-xl font-bold">{market.tradingDays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Indices Section */}
          {indicesWithLive.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  مؤشرات السوق
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {indicesWithLive.map((index) => {
                    const hasDelta = index.change !== null && index.changePct !== null;
                    const isPositive = (index.changePct ?? 0) >= 0;
                    return (
                      <div
                        key={index.symbol}
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{index.symbol}</p>
                            <p className="text-sm text-muted-foreground">{index.name}</p>
                            <Badge variant={getQuoteSourceMeta(index.source).variant} className="text-[10px] mt-1">
                              {getQuoteSourceMeta(index.source).label}
                            </Badge>
                          </div>
                          <Badge variant={hasDelta ? (isPositive ? 'default' : 'destructive') : 'outline'} className="gap-1" dir="ltr">
                            {hasDelta ? (
                              isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                            ) : null}
                            {hasDelta ? `${isPositive ? '+' : ''}${formatEn(index.changePct ?? 0, 2)}%` : 'غير متاح'}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-2xl font-bold" dir="ltr">
                            {index.price === null ? '—' : formatEn(index.price, 2)}
                          </p>
                          {hasDelta ? (
                            <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                              {isPositive ? '+' : ''}{formatEn(index.change ?? 0, 2)} {index.currencySymbol}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stocks Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  الأسهم الأكثر نشاطاً
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  تحديث
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الرمز</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">الاسم</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">القطاع</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">السعر</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">التغيير</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">النسبة</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">مفضل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((stock) => {
                      const isPositive = stock.change >= 0;
                      const isFavorite = favorites.includes(stock.symbol);

                      return (
                        <tr key={stock.symbol} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-primary">{stock.symbol}</span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium">{stock.name}</p>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-xs">
                              {stock.sector || '-'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-semibold" dir="ltr">
                            {formatEn(stock.price, 2)} {market.currencySymbol}
                          </td>
                          <td className={`py-3 px-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                            {isPositive ? '+' : ''}{formatEn(stock.change, 2)}
                          </td>
                          <td className={`py-3 px-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                            <div className="flex items-center justify-end gap-1">
                              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {isPositive ? '+' : ''}{formatEn(stock.changePct, 2)}%
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFavorite(stock.symbol)}
                            >
                              {isFavorite ? (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <StarOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Market Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                معلومات السوق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">الاسم الكامل</span>
                    <span className="font-medium">{market.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">الاسم بالإنجليزية</span>
                    <span className="font-medium">{market.nameEn}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">الدولة</span>
                    <span className="font-medium">{market.countryAr}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">المنطقة الزمنية</span>
                    <span className="font-medium">{market.timezone}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">العملة</span>
                    <span className="font-medium">{market.currencyName} ({market.currency})</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">رمز العملة</span>
                    <span className="font-medium">{market.currencySymbol}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">المؤشر الرئيسي</span>
                    <span className="font-medium">{market.mainIndexName}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">رمز المؤشر</span>
                    <span className="font-medium">{market.mainIndex}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
