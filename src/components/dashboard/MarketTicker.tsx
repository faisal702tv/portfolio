'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { formatNumber } from '@/lib/helpers';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { marketIndices } from '@/data/markets';

interface TickerQuote {
  price: number;
  change: number;
  changePct: number;
}

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  category: 'index' | 'crypto' | 'forex' | 'commodity';
}

// Build index map from markets.ts
const INDEX_MAP: Record<string, { symbol: string; name: string }> = {};
marketIndices.forEach((idx) => {
  if (idx.yahoo) {
    INDEX_MAP[idx.yahoo] = { symbol: idx.symbol, name: idx.name };
  }
});

// Yahoo symbol → display info
const SYMBOL_MAP: Record<string, { symbol: string; name: string; category: TickerItem['category'] }> = {
  // Crypto
  'BTC-USD': { symbol: 'BTC', name: 'بيتكوين', category: 'crypto' },
  'ETH-USD': { symbol: 'ETH', name: 'إيثيريوم', category: 'crypto' },
  'SOL-USD': { symbol: 'SOL', name: 'سولانا', category: 'crypto' },
  'XRP-USD': { symbol: 'XRP', name: 'ريبل', category: 'crypto' },
  'BNB-USD': { symbol: 'BNB', name: 'بينانس', category: 'crypto' },
  'ADA-USD': { symbol: 'ADA', name: 'كاردانو', category: 'crypto' },
  'DOGE-USD': { symbol: 'DOGE', name: 'دوجكوين', category: 'crypto' },
  'AVAX-USD': { symbol: 'AVAX', name: 'أفالانش', category: 'crypto' },
  'DOT-USD': { symbol: 'DOT', name: 'بولكادوت', category: 'crypto' },
  'LINK-USD': { symbol: 'LINK', name: 'تشين لينك', category: 'crypto' },
  'MATIC-USD': { symbol: 'MATIC', name: 'بوليجون', category: 'crypto' },
  'SHIB-USD': { symbol: 'SHIB', name: 'شيبا', category: 'crypto' },
  'UNI-USD': { symbol: 'UNI', name: 'يوني سواب', category: 'crypto' },
  'LTC-USD': { symbol: 'LTC', name: 'لايتكوين', category: 'crypto' },
  'NEAR-USD': { symbol: 'NEAR', name: 'نير', category: 'crypto' },
  'ATOM-USD': { symbol: 'ATOM', name: 'كوزموس', category: 'crypto' },
  'FET-USD': { symbol: 'FET', name: 'فيتش AI', category: 'crypto' },
  'RENDER-USD': { symbol: 'RENDER', name: 'ريندر', category: 'crypto' },
  'ARB-USD': { symbol: 'ARB', name: 'أربيتروم', category: 'crypto' },
  'OP-USD': { symbol: 'OP', name: 'أوبتيميزم', category: 'crypto' },
  // Precious Metals
  'GC=F': { symbol: 'GOLD', name: 'الذهب', category: 'commodity' },
  'SI=F': { symbol: 'SILVER', name: 'الفضة', category: 'commodity' },
  'PL=F': { symbol: 'PLAT', name: 'البلاتين', category: 'commodity' },
  'PA=F': { symbol: 'PALL', name: 'البلاديوم', category: 'commodity' },
  // Energy
  'CL=F': { symbol: 'WTI', name: 'نفط WTI', category: 'commodity' },
  'BZ=F': { symbol: 'BRENT', name: 'نفط برنت', category: 'commodity' },
  'NG=F': { symbol: 'NGAS', name: 'الغاز الطبيعي', category: 'commodity' },
  'HO=F': { symbol: 'HEAT', name: 'زيت التدفئة', category: 'commodity' },
  'RB=F': { symbol: 'RBOB', name: 'البنزين', category: 'commodity' },
  // Industrial Metals
  'HG=F': { symbol: 'COPPER', name: 'النحاس', category: 'commodity' },
  // Agriculture
  'ZW=F': { symbol: 'WHEAT', name: 'القمح', category: 'commodity' },
  'ZC=F': { symbol: 'CORN', name: 'الذرة', category: 'commodity' },
  'ZS=F': { symbol: 'SOYB', name: 'فول الصويا', category: 'commodity' },
  'KC=F': { symbol: 'COFFEE', name: 'القهوة', category: 'commodity' },
  'CC=F': { symbol: 'COCOA', name: 'الكاكاو', category: 'commodity' },
  'SB=F': { symbol: 'SUGAR', name: 'السكر', category: 'commodity' },
  'CT=F': { symbol: 'COTTON', name: 'القطن', category: 'commodity' },
  // Forex
  'EURUSD=X': { symbol: 'EUR/USD', name: 'يورو/دولار', category: 'forex' },
  'GBPUSD=X': { symbol: 'GBP/USD', name: 'جنيه/دولار', category: 'forex' },
  'USDJPY=X': { symbol: 'USD/JPY', name: 'دولار/ين', category: 'forex' },
  'USDCHF=X': { symbol: 'USD/CHF', name: 'دولار/فرنك', category: 'forex' },
  'AUDUSD=X': { symbol: 'AUD/USD', name: 'أسترالي/دولار', category: 'forex' },
  'USDCAD=X': { symbol: 'USD/CAD', name: 'دولار/كندي', category: 'forex' },
  'NZDUSD=X': { symbol: 'NZD/USD', name: 'نيوزيلندي/دولار', category: 'forex' },
  'SAR=X': { symbol: 'USD/SAR', name: 'دولار/ريال', category: 'forex' },
  'AED=X': { symbol: 'USD/AED', name: 'دولار/درهم', category: 'forex' },
  'KWD=X': { symbol: 'USD/KWD', name: 'دولار/دينار كويتي', category: 'forex' },
  'EGP=X': { symbol: 'USD/EGP', name: 'دولار/جنيه مصري', category: 'forex' },
  // Global Indices
  '^TASI.SR': { symbol: 'TASI', name: 'تاسي', category: 'index' },
  '^MT30.SR': { symbol: 'MT30', name: 'تداول 30', category: 'index' },
  '^NOMUC.SR': { symbol: 'NOMUC', name: 'نمو', category: 'index' },
  '^FTSE': { symbol: 'FTSE', name: 'فوتسي 100', category: 'index' },
  '^GDAXI': { symbol: 'DAX', name: 'داكس الألماني', category: 'index' },
  '^FCHI': { symbol: 'CAC40', name: 'كاك الفرنسي', category: 'index' },
  '^N225': { symbol: 'NIKKEI', name: 'نيكاي الياباني', category: 'index' },
  '^HSI': { symbol: 'HSI', name: 'هانغ سنغ', category: 'index' },
};

// CoinGecko symbol → Arabic name (for coins not already in SYMBOL_MAP)
const CRYPTO_NAMES: Record<string, string> = {
  'BTC': 'بيتكوين', 'ETH': 'إيثيريوم', 'SOL': 'سولانا', 'XRP': 'ريبل',
  'BNB': 'بينانس', 'ADA': 'كاردانو', 'DOGE': 'دوجكوين', 'DOT': 'بولكادوت',
  'AVAX': 'أفالانش', 'MATIC': 'بوليجون', 'LINK': 'تشين لينك', 'UNI': 'يوني سواب',
  'ATOM': 'كوزموس', 'LTC': 'لايتكوين', 'NEAR': 'نير', 'TRX': 'ترون',
  'SHIB': 'شيبا', 'PEPE': 'بيبي', 'ARB': 'أربيتروم', 'OP': 'أوبتيميزم',
  'FET': 'فيتش AI', 'RENDER': 'ريندر', 'TAO': 'بايتنس', 'SUI': 'سوي',
  'APT': 'أبتوس', 'IMX': 'إيميوتابل', 'INJ': 'إنجكتيف', 'FIL': 'فايل كوين',
  'AAVE': 'آفي', 'MKR': 'ميكر', 'GRT': 'ذا غراف', 'ALGO': 'ألغوراند',
  'XLM': 'ستيلار', 'ICP': 'كمبيوتر الإنترنت', 'HBAR': 'هيديرا',
  'VET': 'في تشين', 'SAND': 'ذا ساندبوكس', 'MANA': 'ديسنترالاند',
  'EOS': 'إيوس', 'THETA': 'ثيتا', 'XTZ': 'تيزوس', 'FLOW': 'فلو',
  'CRV': 'كيرف', 'SNX': 'سينثيتكس', 'COMP': 'كومباوند',
  'EGLD': 'ملتيفيرس', 'QNT': 'كوانت', 'KAS': 'كاسبا',
  'SEI': 'سي', 'TIA': 'سلستيا', 'STX': 'ستاكس', 'WLD': 'وورلد كوين',
  'TON': 'تون كوين', 'BCH': 'بيتكوين كاش', 'LEO': 'ليو', 'ETC': 'إيثيريوم كلاسيك',
  'OKB': 'أو كي بي', 'FTM': 'فانتوم', 'RUNE': 'ثور تشين', 'MNT': 'مانتل',
};

function fetchSafe(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

const CATEGORY_COLORS: Record<string, string> = {
  index: 'text-primary',
  crypto: 'text-orange-500 dark:text-orange-400',
  commodity: 'text-amber-600 dark:text-amber-400',
  forex: 'text-teal-600 dark:text-teal-400',
};

function formatPrice(price: number, category: string): string {
  if (category === 'forex') return formatNumber(price, 4);
  if (price >= 100) return formatNumber(price, 2);
  if (price >= 1) return formatNumber(price, 4);
  return formatNumber(price, 6);
}

// ─── MarketTicker (scrolling bar) ───
export function MarketTicker() {
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const mountedRef = useRef(true);

  const fetchAllSources = useCallback(async () => {
    const itemsBySymbol = new Map<string, TickerItem>();

    const [tickerRes, cryptoRes] = await Promise.allSettled([
      fetchSafe('/api/ticker', 10000).then(r => r.ok ? r.json() : null).catch(() => null),
      fetchSafe('/api/real-prices?type=crypto', 8000).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);

    // 1) Ticker API → indices, commodities, crypto, forex
    if (tickerRes.status === 'fulfilled' && tickerRes.value?.success && tickerRes.value.data) {
      const raw: Record<string, TickerQuote> = tickerRes.value.data;
      for (const [yahooKey, quote] of Object.entries(raw)) {
        if (!quote.price || quote.price <= 0) continue;
        const mapped = SYMBOL_MAP[yahooKey] || INDEX_MAP[yahooKey];
        if (mapped) {
          const sym = mapped.symbol;
          const cat = 'category' in mapped ? mapped.category : 'index';
          itemsBySymbol.set(sym, {
            symbol: sym,
            name: mapped.name,
            price: quote.price,
            change: quote.change,
            changePct: quote.changePct,
            category: cat as TickerItem['category'],
          });
        }
      }
    }

    // 2) CoinGecko → crypto (overrides Yahoo prices, adds missing coins)
    if (cryptoRes.status === 'fulfilled' && cryptoRes.value?.success && cryptoRes.value.data) {
      const cryptoData: Record<string, { price: number; change: number; changePct: number }> = cryptoRes.value.data;
      for (const [key, cData] of Object.entries(cryptoData)) {
        if (key.startsWith('TOTAL') || key.startsWith('BTC_DOM') || key.startsWith('ETH_DOM')) continue;
        if (!cData.price || cData.price <= 0) continue;
        const sym = key.replace('-USD', '').replace('-USDT', '');
        const name = CRYPTO_NAMES[sym];
        if (!name) continue;
        // CoinGecko has better changePct for crypto, always use it
        itemsBySymbol.set(sym, {
          symbol: sym,
          name,
          price: cData.price,
          change: cData.change,
          changePct: cData.changePct,
          category: 'crypto',
        });
      }
    }

    // --- FALLBACK LOGIC ---
    let savedKeys: any = {};
    try { savedKeys = JSON.parse(localStorage.getItem('api_keys') || '{}'); } catch (e) { }

    try {
      const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22%5D');
      if (binanceRes.ok) {
        const data = await binanceRes.json();
        data.forEach((item: any) => {
          const sym = item.symbol === 'BTCUSDT' ? 'BTC' : 'ETH';
          itemsBySymbol.set(sym, {
            symbol: sym, name: CRYPTO_NAMES[sym] || sym, price: parseFloat(item.lastPrice),
            change: parseFloat(item.priceChange), changePct: parseFloat(item.priceChangePercent), category: 'crypto',
          });
        });
      }
    } catch (e) { }

    const needFmp = !itemsBySymbol.has('GOLD') || !itemsBySymbol.has('VIX');
    if (needFmp && savedKeys.financial_modeling_prep) {
      try {
        const fmpRes = await fetch(`https://financialmodelingprep.com/api/v3/quote/GC=F,SI=F,^VIX?apikey=${savedKeys.financial_modeling_prep}`);
        if (fmpRes.ok) {
          const data = await fmpRes.json();
          data.forEach((item: any) => {
            const mapped = SYMBOL_MAP[item.symbol] || INDEX_MAP[item.symbol];
            if (mapped) {
              itemsBySymbol.set(mapped.symbol, { symbol: mapped.symbol, name: mapped.name, price: item.price, change: item.change, changePct: item.changesPercentage, category: ('category' in mapped ? mapped.category : 'index') as TickerItem['category'] });
            }
          });
        }
      } catch (e) { }
    }
    if (needFmp && savedKeys.twelve_data && !itemsBySymbol.has('GOLD')) {
      try {
        const tdRes = await fetch(`https://api.twelvedata.com/quote?symbol=XAU/USD,XAG/USD,VIX&apikey=${savedKeys.twelve_data}`);
        if (tdRes.ok) {
          const tdData = await tdRes.json();
          const setFromTD = (tdKey: string, yahooKey: string) => { if (tdData[tdKey] && tdData[tdKey].close) { const mapped = SYMBOL_MAP[yahooKey] || INDEX_MAP[yahooKey]; if (mapped) itemsBySymbol.set(mapped.symbol, { symbol: mapped.symbol, name: mapped.name, price: parseFloat(tdData[tdKey].close), change: parseFloat(tdData[tdKey].change), changePct: parseFloat(tdData[tdKey].percent_change), category: ('category' in mapped ? mapped.category : 'index') as TickerItem['category'] }); } };
          setFromTD('XAU/USD', 'GC=F');
          setFromTD('XAG/USD', 'SI=F');
          setFromTD('VIX', '^VIX');
        }
      } catch (e) { }
    }

    if (!mountedRef.current) return;
    const items = Array.from(itemsBySymbol.values());
    if (items.length > 0) {
      const order: Record<string, number> = { index: 0, commodity: 1, crypto: 2, forex: 3 };
      items.sort((a, b) => (order[a.category] ?? 9) - (order[b.category] ?? 9));
      setTickerData(items);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAllSources();
    const interval = setInterval(fetchAllSources, 60000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [fetchAllSources]);

  if (tickerData.length === 0) return null;

  // Duplicate 3x for seamless scroll with many items
  const displayData = [...tickerData, ...tickerData, ...tickerData];
  // ~3s per item for comfortable reading speed
  const duration = Math.max(60, tickerData.length * 5);

  return (
    <div className="border-b bg-muted/30 py-2 overflow-hidden relative">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div
        className="ticker-scroll gap-6 whitespace-nowrap"
        style={{ '--ticker-duration': `${duration}s` } as React.CSSProperties}
      >
        {displayData.map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="inline-flex items-center gap-1.5 px-2.5 flex-shrink-0"
          >
            <span className={`font-bold text-sm ${CATEGORY_COLORS[item.category] || 'text-primary'}`}>
              {item.symbol}
            </span>
            <span className="text-muted-foreground text-xs hidden md:inline">{item.name}</span>
            <span className="font-semibold text-sm tabular-nums">
              {formatPrice(item.price, item.category)}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${item.change >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
                }`}
            >
              {item.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {item.change >= 0 ? '+' : ''}{formatNumber(item.changePct, 2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MiniTicker Card ───
interface MiniTickerProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

export function MiniTicker({ symbol, name, price, change, changePct }: MiniTickerProps) {
  const isPositive = change >= 0;
  return (
    <Card className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50 transition-colors cursor-pointer">
      <div className="flex-shrink-0"><span className="font-bold text-sm">{symbol}</span></div>
      <div className="flex-1 min-w-0"><p className="text-xs text-muted-foreground truncate">{name}</p></div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">{formatNumber(price, 2)}</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
          {isPositive ? '+' : ''}{formatNumber(changePct, 2)}%
        </span>
      </div>
    </Card>
  );
}

// ─── MarketOverviewBar (static top bar) ───
export function MarketOverviewBar() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [indices, setIndices] = useState<TickerItem[]>([]);
  const mountedRef = useRef(true);

  const fetchOverview = useCallback(async () => {
    const items: TickerItem[] = [];

    const [tickerRes, cryptoRes] = await Promise.allSettled([
      fetchSafe('/api/ticker', 10000).then(r => r.ok ? r.json() : null).catch(() => null),
      fetchSafe('/api/real-prices?type=crypto', 8000).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);

    if (tickerRes.status === 'fulfilled' && tickerRes.value?.success && tickerRes.value.data) {
      const raw: Record<string, TickerQuote> = tickerRes.value.data;
      const wanted: Array<{ yahoo: string; sym: string; name: string; cat: TickerItem['category'] }> = [
        { yahoo: '^TASI.SR', sym: 'TASI', name: 'تاسي', cat: 'index' },
        { yahoo: '^MT30.SR', sym: 'MT30', name: 'تداول 30', cat: 'index' },
        { yahoo: '^NOMUC.SR', sym: 'NOMUC', name: 'نمو', cat: 'index' },
        { yahoo: '^GSPC', sym: 'S&P500', name: 'إس آند بي', cat: 'index' },
        { yahoo: '^IXIC', sym: 'NASDAQ', name: 'ناسداك', cat: 'index' },
        { yahoo: '^DJI', sym: 'DJI', name: 'داو جونز', cat: 'index' },
        { yahoo: 'GC=F', sym: 'GOLD', name: 'الذهب', cat: 'commodity' },
        { yahoo: 'SI=F', sym: 'SILVER', name: 'الفضة', cat: 'commodity' },
        { yahoo: 'CL=F', sym: 'WTI', name: 'نفط WTI', cat: 'commodity' },
        { yahoo: 'EURUSD=X', sym: 'EUR/USD', name: 'يورو/دولار', cat: 'forex' },
      ];
      for (const w of wanted) {
        const q = raw[w.yahoo];
        if (q && q.price > 0) {
          items.push({ symbol: w.sym, name: w.name, price: q.price, change: q.change, changePct: q.changePct, category: w.cat });
        }
      }
    }

    // BTC + ETH from CoinGecko
    if (cryptoRes.status === 'fulfilled' && cryptoRes.value?.success && cryptoRes.value.data) {
      const cd = cryptoRes.value.data;
      for (const [key, sym, name] of [['BTC', 'BTC', 'بيتكوين'], ['ETH', 'ETH', 'إيثيريوم']] as const) {
        const d = cd[key];
        if (d?.price > 0) items.push({ symbol: sym, name, price: d.price, change: d.change || 0, changePct: d.changePct || 0, category: 'crypto' });
      }
    }

    // --- FALLBACK LOGIC ---
    let savedKeys: any = {};
    try { savedKeys = JSON.parse(localStorage.getItem('api_keys') || '{}'); } catch (e) { }

    try {
      const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22PAXGUSDT%22%5D');
      if (binanceRes.ok) {
        const data = await binanceRes.json();
        data.forEach((item: any) => {
          let sym = '';
          let name = '';
          let cat: any = 'crypto';
          if (item.symbol === 'BTCUSDT') { sym = 'BTC'; name = 'بيتكوين'; }
          else if (item.symbol === 'ETHUSDT') { sym = 'ETH'; name = 'إيثيريوم'; }
          else if (item.symbol === 'PAXGUSDT') { sym = 'GOLD'; name = 'الذهب'; cat = 'commodity'; }
          if (sym) {
            const idx = items.findIndex(x => x.symbol === sym);
            const newItem = { symbol: sym, name, price: parseFloat(item.lastPrice), change: parseFloat(item.priceChange), changePct: parseFloat(item.priceChangePercent), category: cat };
            if (idx >= 0) items[idx] = newItem; else items.push(newItem);
          }
        });
      }
    } catch (e) { }

    const hasGold = items.some(x => x.symbol === 'GOLD');
    if (!hasGold && savedKeys.financial_modeling_prep) {
      try {
        const fmpRes = await fetch(`https://financialmodelingprep.com/api/v3/quote/GC=F,SI=F,^VIX?apikey=${savedKeys.financial_modeling_prep}`);
        if (fmpRes.ok) {
          const data = await fmpRes.json();
          data.forEach((item: any) => {
            const mapName: any = { 'GC=F': 'GOLD', 'SI=F': 'SILVER', '^VIX': 'VIX' };
            const mapAr: any = { 'GC=F': 'الذهب', 'SI=F': 'الفضة', '^VIX': 'مؤشر الخوف' };
            const mapCat: any = { 'GC=F': 'commodity', 'SI=F': 'commodity', '^VIX': 'index' };
            if (mapName[item.symbol]) {
              const idx = items.findIndex(x => x.symbol === mapName[item.symbol]);
              const newItem = { symbol: mapName[item.symbol], name: mapAr[item.symbol], price: item.price, change: item.change, changePct: item.changesPercentage, category: mapCat[item.symbol] };
              if (idx >= 0) items[idx] = newItem; else items.push(newItem);
            }
          });
        }
      } catch (e) { }
    }
    if (!hasGold && savedKeys.twelve_data) {
      try {
        const tdRes = await fetch(`https://api.twelvedata.com/quote?symbol=XAU/USD,XAG/USD,VIX&apikey=${savedKeys.twelve_data}`);
        if (tdRes.ok) {
          const tdData = await tdRes.json();
          const setFromTD = (tdKey: string, symName: string, arName: string, cat: any) => {
            if (tdData[tdKey] && tdData[tdKey].close) {
              const idx = items.findIndex(x => x.symbol === symName);
              const newItem = { symbol: symName, name: arName, price: parseFloat(tdData[tdKey].close), change: parseFloat(tdData[tdKey].change), changePct: parseFloat(tdData[tdKey].percent_change), category: cat };
              if (idx >= 0) items[idx] = newItem; else items.push(newItem);
            }
          };
          setFromTD('XAU/USD', 'GOLD', 'الذهب', 'commodity');
          setFromTD('XAG/USD', 'SILVER', 'الفضة', 'commodity');
          setFromTD('VIX', 'VIX', 'مؤشر الخوف', 'index');
        }
      } catch (e) { }
    }

    if (!mountedRef.current) return;
    if (items.length > 0) setIndices(items);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchOverview();
    const interval = setInterval(fetchOverview, 60000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [fetchOverview]);

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString('ar-SA-u-ca-gregory'));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-b bg-card">
      <div className="flex items-center gap-1 overflow-x-auto py-2 px-4 scrollbar-hide">
        {indices.map((item) => (
          <div key={item.symbol} className="flex items-center gap-2 px-3 py-1 border-l last:border-l-0 flex-shrink-0">
            <span className={`font-medium text-sm ${CATEGORY_COLORS[item.category] || ''}`}>{item.symbol}</span>
            <span className="font-bold tabular-nums">{formatPrice(item.price, item.category)}</span>
            <span className={`text-xs font-medium tabular-nums ${item.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {item.change >= 0 ? '+' : ''}{formatNumber(item.changePct, 2)}%
            </span>
          </div>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            مباشر
          </span>
          {currentTime && <span>آخر تحديث: {currentTime}</span>}
        </div>
      </div>
    </div>
  );
}
