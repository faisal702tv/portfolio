'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Newspaper, Search, RefreshCw, TrendingUp, TrendingDown,
  Globe, Clock, ExternalLink, Link2, Star,
  Bookmark, BookmarkCheck, Minus, Briefcase, Eye,
  ArrowUpRight, ArrowDownRight, BarChart3, Coins, Landmark, DollarSign,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { fetchAllPortfoliosSnapshots } from '@/lib/export-utils';
import type { PortfolioSnapshot } from '@/lib/export-utils';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceIcon: string;
  date: string;
  url?: string;
  category: string;
  categoryAr: string;
  market: string;
  symbols?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface WatchlistData {
  items: { symbol: string; name: string | null; market: string | null }[];
}

interface AssetInfo {
  symbol: string;
  name: string;
  type: 'stock' | 'fund' | 'bond' | 'forex' | 'crypto' | 'commodity';
}

const CATEGORY_TABS = [
  { key: 'all', label: 'الكل', icon: '📰' },
  { key: 'portfolio', label: 'محفظتي', icon: '💼' },
  { key: 'watchlist', label: 'قائمة المتابعة', icon: '⭐' },
  { key: 'stocks', label: 'أسهم', icon: '📊' },
  { key: 'funds', label: 'صناديق', icon: '🏦' },
  { key: 'bonds', label: 'سندات وصكوك', icon: '🏛️' },
  { key: 'forex', label: 'فوركس', icon: '💱' },
  { key: 'crypto', label: 'عملات مشفرة', icon: '₿' },
  { key: 'commodities', label: 'سلع ومعادن', icon: '🪙' },
];

const ASSET_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  stock: { label: 'سهم', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '📊' },
  fund: { label: 'صندوق', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '🏦' },
  bond: { label: 'سند', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: '🏛️' },
  forex: { label: 'فوركس', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: '💱' },
  crypto: { label: 'مشفر', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: '₿' },
  commodity: { label: 'سلعة', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: '🪙' },
};

const CATEGORY_COLORS: Record<string, string> = {
  'أسهم': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'صناديق استثمار': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'سندات وصكوك': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'عملات مشفرة': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'فوركس': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'سلع ومعادن': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'أخبار مالية': 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  return new Date(dateStr).toLocaleDateString('ar-SA-u-ca-gregory');
}

function getSentimentBadge(sentiment?: string) {
  switch (sentiment) {
    case 'positive': return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1"><TrendingUp className="h-3 w-3" />إيجابي</Badge>;
    case 'negative': return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 gap-1"><TrendingDown className="h-3 w-3" />سلبي</Badge>;
    default: return <Badge variant="outline" className="gap-1"><Minus className="h-3 w-3" />محايد</Badge>;
  }
}

function getSentimentIcon(sentiment?: string) {
  switch (sentiment) {
    case 'positive': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    case 'negative': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    default: return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

function buildSymbolsParam(assets: AssetInfo[]): string {
  return assets.map(a => `${a.symbol}:${a.name || a.symbol}`).join(',');
}

export default function NewsPage() {
  const { snapshot, portfolios } = usePortfolioSnapshot();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [matchedSymbolCount, setMatchedSymbolCount] = useState(0);

  const [watchlistItems, setWatchlistItems] = useState<AssetInfo[]>([]);
  const [portfolioAssets, setPortfolioAssets] = useState<AssetInfo[]>([]);
  const [showAllPortfolio, setShowAllPortfolio] = useState(false);
  const [showAllWatchlist, setShowAllWatchlist] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('news_bookmarks');
      if (saved) setBookmarks(JSON.parse(saved));
    } catch { /* */ }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('watchlist_data');
      if (raw) {
        const data: WatchlistData = JSON.parse(raw);
        const items = data.items || [];
        setWatchlistItems(items.map(i => ({ symbol: i.symbol, name: i.name || i.symbol, type: 'stock' as const })));
      }
    } catch { /* */ }
  }, []);

  const extractAssets = useCallback((snap: PortfolioSnapshot): AssetInfo[] => {
    const assets: AssetInfo[] = [];

    snap.stocks?.forEach(s => {
      let type: AssetInfo['type'] = 'stock';
      if (s.exchange === 'FOREX' || s.type === 'Forex' || s.sector === 'Forex') type = 'forex';
      else if (s.exchange === 'CRYPTO' || s.sector === 'Cryptocurrency' || s.type === 'Crypto') type = 'crypto';
      assets.push({ symbol: s.symbol, name: s.name || s.symbol, type });
    });

    snap.funds?.forEach(f => {
      let type: AssetInfo['type'] = 'fund';
      if (f.fundType === 'commodities' || f.exchange === 'COMMODITY') type = 'commodity';
      assets.push({ symbol: f.symbol, name: f.name || f.symbol, type });
    });

    snap.bonds?.forEach(b => {
      if (b.symbol) assets.push({ symbol: b.symbol, name: b.name || b.symbol, type: 'bond' });
    });

    return assets;
  }, []);

  useEffect(() => {
    if (!snapshot) return;

    if (portfolios.length <= 1) {
      setPortfolioAssets(extractAssets(snapshot));
      return;
    }

    let cancelled = false;
    fetchAllPortfoliosSnapshots(portfolios).then(allSnaps => {
      if (cancelled) return;
      const merged = new Map<string, AssetInfo>();
      for (const snap of allSnaps) {
        for (const a of extractAssets(snap)) {
          if (!merged.has(a.symbol)) merged.set(a.symbol, a);
        }
      }
      setPortfolioAssets([...merged.values()]);
    }).catch(() => {
      if (!cancelled) setPortfolioAssets(extractAssets(snapshot));
    });

    return () => { cancelled = true; };
  }, [snapshot, portfolios, extractAssets]);

  const allAssets = useMemo(() => {
    const map = new Map<string, AssetInfo>();
    portfolioAssets.forEach(a => map.set(a.symbol, a));
    watchlistItems.forEach(a => { if (!map.has(a.symbol)) map.set(a.symbol, a); });
    return [...map.values()];
  }, [portfolioAssets, watchlistItems]);

  const portfolioSymbols = useMemo(() => portfolioAssets.map(a => a.symbol), [portfolioAssets]);
  const watchlistSymbols = useMemo(() => watchlistItems.map(a => a.symbol), [watchlistItems]);

  const assetsByType = useMemo(() => {
    const map: Record<string, AssetInfo[]> = {};
    portfolioAssets.forEach(a => {
      if (!map[a.type]) map[a.type] = [];
      map[a.type].push(a);
    });
    return map;
  }, [portfolioAssets]);

  const portfolioCount = useMemo(() => ({
    stocks: assetsByType.stock?.length || 0,
    funds: assetsByType.fund?.length || 0,
    bonds: assetsByType.bond?.length || 0,
    forex: assetsByType.forex?.length || 0,
    crypto: assetsByType.crypto?.length || 0,
    commodities: assetsByType.commodity?.length || 0,
    total: portfolioAssets.length,
  }), [assetsByType, portfolioAssets]);

  const fetchNews = useCallback(async (category: string, searchQuery?: string) => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams({ limit: '80', days: '5' });

      if (searchQuery) {
        params.set('q', searchQuery);
        params.set('category', 'all');
        params.set('market', 'all');
      } else if (category === 'portfolio') {
        params.set('category', 'all');
        params.set('market', 'all');
        if (portfolioAssets.length > 0) {
          params.set('symbols', buildSymbolsParam(portfolioAssets));
        }
      } else if (category === 'watchlist') {
        params.set('category', 'all');
        params.set('market', 'all');
        if (watchlistItems.length > 0) {
          params.set('symbols', buildSymbolsParam(watchlistItems));
        }
      } else {
        params.set('category', category === 'all' ? 'all' : category);
        params.set('market', 'all');
        if (allAssets.length > 0) {
          params.set('symbols', buildSymbolsParam(allAssets));
        }
      }

      const res = await fetch(`/api/news?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.articles?.length > 0) {
        const mapped = data.articles.map((a: NewsItem & { link?: string }, i: number) => ({
          id: `${category}-${i}-${Date.now()}`,
          title: a.title,
          summary: a.summary || '',
          source: a.source,
          sourceIcon: a.sourceIcon || '📰',
          date: a.date,
          url: a.url || a.link,
          category: a.category || category,
          categoryAr: a.categoryAr || '',
          market: a.market || 'all',
          symbols: a.symbols || [],
          sentiment: a.sentiment || 'neutral',
        }));
        setNews(mapped);
        setMatchedSymbolCount(data.matchedSymbolCount || 0);
        setLastFetch(new Date());
      } else {
        setFetchError(true);
        setNews([]);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [portfolioAssets, watchlistItems, allAssets]);

  useEffect(() => { void fetchNews('all'); }, [fetchNews]);

  const handleSearch = () => {
    if (search.trim()) void fetchNews(activeCategory, search.trim());
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    void fetchNews(category);
  };

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id];
      localStorage.setItem('news_bookmarks', JSON.stringify(next));
      return next;
    });
  };

  const filteredNews = useMemo(() => {
    if (showBookmarksOnly) return news.filter(n => bookmarks.includes(n.id));
    return news;
  }, [news, showBookmarksOnly, bookmarks]);

  const stats = useMemo(() => {
    const sources = new Set(news.map(n => n.source));
    const positive = news.filter(n => n.sentiment === 'positive').length;
    const negative = news.filter(n => n.sentiment === 'negative').length;
    const linkedSymbols = new Set(news.flatMap(n => n.symbols || []));
    return { sources: sources.size, positive, negative, linkedSymbols: linkedSymbols.size };
  }, [news]);

  const isSymbolInPortfolio = (sym: string) => portfolioSymbols.includes(sym);
  const isSymbolInWatchlist = (sym: string) => watchlistSymbols.includes(sym);
  const getAssetType = (sym: string): AssetInfo['type'] | null => {
    const asset = portfolioAssets.find(a => a.symbol === sym) || watchlistItems.find(a => a.symbol === sym);
    return asset?.type || null;
  };

  const renderAssetBadge = (sym: string) => {
    const inPortfolio = isSymbolInPortfolio(sym);
    const inWatchlist = isSymbolInWatchlist(sym);
    const assetType = getAssetType(sym);
    const config = assetType ? ASSET_TYPE_CONFIG[assetType] : null;

    return (
      <Badge
        key={sym}
        variant="secondary"
        className={`text-[10px] gap-0.5 px-1.5 py-0.5 ${
          inPortfolio && config ? config.color :
          inPortfolio ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          inWatchlist ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-muted text-muted-foreground'
        }`}
      >
        {config?.icon} {sym}
        {inPortfolio && !config?.icon && <Briefcase className="h-2 w-2" />}
        {inWatchlist && !inPortfolio && <Eye className="h-2 w-2" />}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="أخبار الأسواق" />
        <main className="p-4 lg:p-6 space-y-4">

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <Card className="border-blue-200/50 dark:border-blue-800/30">
              <CardContent className="p-2 flex items-center gap-1.5">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-1"><Newspaper className="h-3 w-3 text-blue-600" /></div>
                <div><p className="text-[8px] text-muted-foreground">الأخبار</p><p className="text-sm font-bold">{news.length}</p></div>
              </CardContent>
            </Card>
            <Card className="border-green-200/50 dark:border-green-800/30">
              <CardContent className="p-2 flex items-center gap-1.5">
                <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-1"><TrendingUp className="h-3 w-3 text-green-600" /></div>
                <div><p className="text-[8px] text-muted-foreground">إيجابي</p><p className="text-sm font-bold text-green-600">{stats.positive}</p></div>
              </CardContent>
            </Card>
            <Card className="border-red-200/50 dark:border-red-800/30">
              <CardContent className="p-2 flex items-center gap-1.5">
                <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-1"><TrendingDown className="h-3 w-3 text-red-600" /></div>
                <div><p className="text-[8px] text-muted-foreground">سلبي</p><p className="text-sm font-bold text-red-600">{stats.negative}</p></div>
              </CardContent>
            </Card>
            <Card className="border-purple-200/50 dark:border-purple-800/30">
              <CardContent className="p-2 flex items-center gap-1.5">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-1"><Link2 className="h-3 w-3 text-purple-600" /></div>
                <div><p className="text-[8px] text-muted-foreground">مرتبط</p><p className="text-sm font-bold text-purple-600">{stats.linkedSymbols}</p></div>
              </CardContent>
            </Card>
            <Card className="border-amber-200/50 dark:border-amber-800/30">
              <CardContent className="p-2 flex items-center gap-1.5">
                <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-1"><Briefcase className="h-3 w-3 text-amber-600" /></div>
                <div><p className="text-[8px] text-muted-foreground">المحفظة</p><p className="text-sm font-bold">{portfolioCount.total}</p></div>
              </CardContent>
            </Card>
            <Card className="border-yellow-200/50 dark:border-yellow-800/30">
              <CardContent className="p-2 flex items-center gap-1.5">
                <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-1"><Eye className="h-3 w-3 text-yellow-600" /></div>
                <div><p className="text-[8px] text-muted-foreground">المتابعة</p><p className="text-sm font-bold">{watchlistItems.length}</p></div>
              </CardContent>
            </Card>
            <Card className="border-cyan-200/50 dark:border-cyan-800/30">
              <CardContent className="p-2 flex items-center gap-1.5">
                <div className="rounded-lg bg-cyan-100 dark:bg-cyan-900/30 p-1"><DollarSign className="h-3 w-3 text-cyan-600" /></div>
                <div><p className="text-[8px] text-muted-foreground">فوركس</p><p className="text-sm font-bold">{portfolioCount.forex}</p></div>
              </CardContent>
            </Card>
            <Card className="border-orange-200/50 dark:border-orange-800/30">
              <CardContent className="p-2 flex items-center gap-1.5">
                <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-1"><Coins className="h-3 w-3 text-orange-600" /></div>
                <div><p className="text-[8px] text-muted-foreground">مشفر</p><p className="text-sm font-bold">{portfolioCount.crypto}</p></div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_TABS.map((tab) => (
                  <Button
                    key={tab.key}
                    variant={activeCategory === tab.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryChange(tab.key)}
                    className="text-xs gap-1 h-8"
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                    {tab.key === 'portfolio' && portfolioCount.total > 0 && (
                      <Badge variant="secondary" className="text-[9px] h-4 px-1">{portfolioCount.total}</Badge>
                    )}
                    {tab.key === 'watchlist' && watchlistItems.length > 0 && (
                      <Badge variant="secondary" className="text-[9px] h-4 px-1">{watchlistItems.length}</Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث عن أخبار أسهم، عملات، سلع، صناديق..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pr-9"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading} className="gap-1.5">
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  بحث
                </Button>
                <Button variant="outline" onClick={() => void fetchNews(activeCategory)} disabled={loading} className="gap-1.5">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
              </div>
            </CardContent>
          </Card>

          {portfolioCount.total > 0 && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 text-primary mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm">أصول المحفظة ({portfolioCount.total})</h3>
                      {portfolioCount.total > 20 && (
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-0.5" onClick={() => setShowAllPortfolio(!showAllPortfolio)}>
                          {showAllPortfolio ? <><ChevronUp className="h-3 w-3" /> إخفاء</> : <><ChevronDown className="h-3 w-3" /> عرض الكل</>}
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 mb-2">
                      {portfolioCount.stocks > 0 && <div className="flex items-center gap-1 p-1 rounded bg-green-50 dark:bg-green-900/20 text-[10px] font-medium"><BarChart3 className="h-3 w-3 text-green-600" />{portfolioCount.stocks} سهم</div>}
                      {portfolioCount.funds > 0 && <div className="flex items-center gap-1 p-1 rounded bg-blue-50 dark:bg-blue-900/20 text-[10px] font-medium"><Landmark className="h-3 w-3 text-blue-600" />{portfolioCount.funds} صندوق</div>}
                      {portfolioCount.bonds > 0 && <div className="flex items-center gap-1 p-1 rounded bg-purple-50 dark:bg-purple-900/20 text-[10px] font-medium"><Landmark className="h-3 w-3 text-purple-600" />{portfolioCount.bonds} سند</div>}
                      {portfolioCount.forex > 0 && <div className="flex items-center gap-1 p-1 rounded bg-cyan-50 dark:bg-cyan-900/20 text-[10px] font-medium"><DollarSign className="h-3 w-3 text-cyan-600" />{portfolioCount.forex} فوركس</div>}
                      {portfolioCount.crypto > 0 && <div className="flex items-center gap-1 p-1 rounded bg-orange-50 dark:bg-orange-900/20 text-[10px] font-medium"><Coins className="h-3 w-3 text-orange-600" />{portfolioCount.crypto} مشفر</div>}
                      {portfolioCount.commodities > 0 && <div className="flex items-center gap-1 p-1 rounded bg-amber-50 dark:bg-amber-900/20 text-[10px] font-medium"><Star className="h-3 w-3 text-amber-600" />{portfolioCount.commodities} سلعة</div>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(showAllPortfolio ? portfolioAssets : portfolioAssets.slice(0, 20)).map((a, i) => {
                        const config = ASSET_TYPE_CONFIG[a.type];
                        return <Badge key={`${a.symbol}-${i}`} variant="secondary" className={`text-[9px] ${config.color}`}>{config.icon} {a.symbol}</Badge>;
                      })}
                      {!showAllPortfolio && portfolioAssets.length > 20 && (
                        <Badge variant="outline" className="text-[9px] cursor-pointer" onClick={() => setShowAllPortfolio(true)}>+{portfolioAssets.length - 20} أكثر</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {watchlistItems.length > 0 && (
            <Card className="border-2 border-yellow-200/50 dark:border-yellow-800/30">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Eye className="h-4 w-4 text-yellow-600 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-bold text-sm">قائمة المتابعة ({watchlistItems.length})</h3>
                      {watchlistItems.length > 20 && (
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-0.5" onClick={() => setShowAllWatchlist(!showAllWatchlist)}>
                          {showAllWatchlist ? <><ChevronUp className="h-3 w-3" /> إخفاء</> : <><ChevronDown className="h-3 w-3" /> عرض الكل</>}
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(showAllWatchlist ? watchlistItems : watchlistItems.slice(0, 20)).map(a => (
                        <Badge key={a.symbol} variant="secondary" className="text-[9px] gap-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {a.symbol} {a.name !== a.symbol && <span className="opacity-60">({a.name})</span>}
                        </Badge>
                      ))}
                      {!showAllWatchlist && watchlistItems.length > 20 && (
                        <Badge variant="outline" className="text-[9px] cursor-pointer" onClick={() => setShowAllWatchlist(true)}>+{watchlistItems.length - 20} أكثر</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Newspaper className="h-4 w-4" />
                {filteredNews.length > 0 ? `${filteredNews.length} خبر` : 'جاري التحميل...'}
              </h2>
              {fetchError && news.length === 0 && (
                <Badge variant="outline" className="text-amber-600 gap-1 text-[10px]"><Globe className="h-3 w-3" /> تعذر جلب الأخبار</Badge>
              )}
              {matchedSymbolCount > 0 && (
                <Badge variant="secondary" className="text-[10px] gap-0.5">
                  <Link2 className="h-3 w-3" /> {matchedSymbolCount} رمز مراقب
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {lastFetch && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-3 w-3" />{lastFetch.toLocaleTimeString('ar-SA-u-ca-gregory')}</span>}
              <Button variant={showBookmarksOnly ? 'default' : 'outline'} size="sm" className="gap-1 h-7 text-[10px]" onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}>
                <BookmarkCheck className="h-3 w-3" /> المحفوظة ({bookmarks.length})
              </Button>
            </div>
          </div>

          {loading && news.length === 0 ? (
            <Card>
              <CardContent className="py-14 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-primary/40" />
                <p className="text-sm text-muted-foreground">جاري جلب الأخبار وترجمتها وربطها بـ {allAssets.length} أصل...</p>
              </CardContent>
            </Card>
          ) : filteredNews.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Newspaper className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-3">{showBookmarksOnly ? 'لا توجد أخبار محفوظة' : 'لا توجد أخبار حالياً'}</p>
                <Button variant="outline" size="sm" onClick={() => void fetchNews('all')} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> إعادة التحميل
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNews.map((item) => {
                const isBookmarked = bookmarks.includes(item.id);
                return (
                  <Card
                    key={item.id}
                    className={`group hover:shadow-md transition-all border-r-4 ${
                      item.sentiment === 'positive' ? 'border-r-green-500' :
                      item.sentiment === 'negative' ? 'border-r-red-500' : 'border-r-muted-foreground/20'
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className="font-bold text-sm leading-relaxed cursor-pointer hover:text-primary transition-colors flex-1" onClick={() => item.url && window.open(item.url, '_blank')}>
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          {getSentimentBadge(item.sentiment)}
                          <Badge className={`${CATEGORY_COLORS[item.categoryAr] || 'bg-muted text-muted-foreground'} text-[9px]`}>{item.categoryAr || item.category}</Badge>
                        </div>
                      </div>

                      {item.summary && <p className="text-muted-foreground text-xs mb-2 line-clamp-2 leading-relaxed">{item.summary}</p>}

                      {item.symbols && item.symbols.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mb-1.5">
                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Link2 className="h-2.5 w-2.5" /> مرتبط:</span>
                          {item.symbols.map(sym => renderAssetBadge(sym))}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center gap-1 font-medium"><span>{item.sourceIcon}</span>{item.source}</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{timeAgo(item.date)}</span>
                          <span className="flex items-center gap-0.5">{getSentimentIcon(item.sentiment)}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toggleBookmark(item.id)} title={isBookmarked ? 'إزالة' : 'حفظ'}>
                            {isBookmarked ? <BookmarkCheck className="h-3 w-3 text-primary" /> : <Bookmark className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </Button>
                          {item.url && (
                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => window.open(item.url, '_blank')} title="فتح المصدر">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="border-dashed">
            <CardContent className="p-2.5">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Star className="h-3 w-3 text-amber-500 shrink-0" />
                <span>
                  الأخبار تُجلب من جميع المصادر وتُترجم للعربية وترتبط تلقائياً بـ {allAssets.length} أصل (محفظة + متابعة).
                  <Briefcase className="h-2.5 w-2.5 text-green-500 inline mx-0.5" /> محفظتك
                  <Eye className="h-2.5 w-2.5 text-yellow-500 inline mx-0.5" /> متابعتك
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-blue-500" />
                المصادر والروابط
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">وكالات الأنباء المالية العالمية</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.reuters.com/markets/', '_blank')}>🌐 رويترز Reuters</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.bloomberg.com/markets', '_blank')}>💹 بلومبرج Bloomberg</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.cnbc.com/world/', '_blank')}>📺 CNBC</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.ft.com/markets', '_blank')}>📑 Financial Times</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.marketwatch.com/', '_blank')}>📰 MarketWatch</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://seekingalpha.com/', '_blank')}>🔎 Seeking Alpha</Badge>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">منصات التداول والتحليل</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.investing.com/news/', '_blank')}>📈 Investing.com</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.tradingview.com/news/', '_blank')}>📉 TradingView</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.webull.com/news', '_blank')}>📊 Webull</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://finance.yahoo.com/', '_blank')}>📊 Yahoo Finance</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.google.com/finance/', '_blank')}>💶 Google Finance</Badge>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">مصادر العملات المشفرة</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.coindesk.com/', '_blank')}>₿ CoinDesk</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://cointelegraph.com/', '_blank')}>🪙 CoinTelegraph</Badge>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">المصادر المالية العربية</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.argaam.com/', '_blank')}>🇸🇦 أرقام Argaam</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.mubasher.info/', '_blank')}>📡 مباشر Mubasher</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.aleqt.com/', '_blank')}>📋 الاقتصادية</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.arabnews.com/business', '_blank')}>🌍 Arab News</Badge>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">البورصات الرسمية</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.saudiexchange.sa/', '_blank')}>🇸🇦 تداول Tadawul</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.adx.ae/', '_blank')}>🇦🇪 أبوظبي ADX</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.dfm.ae/', '_blank')}>🇦🇪 دبي DFM</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.nasdaqdubai.com/', '_blank')}>🇦🇪 ناسداك دبي</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.boursakuwait.com.kw/', '_blank')}>🇰🇼 بورصة الكويت</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.qe.com.qa/', '_blank')}>🇶🇦 بورصة قطر</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.bahrainbourse.net/', '_blank')}>🇧🇭 بورصة البحرين</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.msm.gov.om/', '_blank')}>🇴🇲 بورصة مسقط</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.ase.com.jo/', '_blank')}>🇯🇴 بورصة عمّان</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.egx.com.eg/', '_blank')}>🇪🇬 بورصة مصر</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.nyse.com/', '_blank')}>🇺🇸 NYSE</Badge>
                  <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-accent" onClick={() => window.open('https://www.nasdaq.com/', '_blank')}>🇺🇸 NASDAQ</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
