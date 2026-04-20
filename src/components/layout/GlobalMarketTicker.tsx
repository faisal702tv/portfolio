'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { formatNumber } from '@/lib/helpers';

interface QuoteData {
  price: number;
  change: number;
  changePct: number;
}

interface TickerEntry {
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePct: number;
}

// ─── Symbol definitions ───

const INDEX_DEFS: Array<{ sym: string; label: string; aliases?: string[] }> = [
  // Gulf + Arab indices
  { sym: '^TASI.SR', label: 'تاسي', aliases: ['^TASI'] },
  { sym: '^TASI.BK', label: 'تاسي البنوك', aliases: ['^TASI.BNK', 'TASI-BNK'] },
  { sym: '^TASI.EN', label: 'تاسي الطاقة', aliases: ['TASI-ENR'] },
  { sym: '^TASI.TC', label: 'تاسي الاتصالات', aliases: ['TASI-TEL'] },
  { sym: 'MT30', label: 'تداول 30', aliases: ['^MT30'] },
  { sym: 'NOMUC', label: 'نمو', aliases: ['^NOMUC'] },
  { sym: '^FTFADGI', label: 'أبوظبي' },
  { sym: '^DFMGI', label: 'دبي' },
  { sym: '^KWSE', label: 'الكويت' },
  { sym: '^QSI', label: 'قطر', aliases: ['^QSII'] },
  { sym: '^BSEX', label: 'البحرين', aliases: ['^BAX'] },
  { sym: '^MSI30', label: 'مسقط', aliases: ['^MSM'] },
  { sym: '^AMMANGI', label: 'الأردن' },
  { sym: '^CASE30', label: 'مصر EGX30', aliases: ['EGX30.CA'] },
  { sym: 'EGX70.CA', label: 'مصر EGX70', aliases: ['^EGX70.CA'] },
  { sym: 'EGX100.CA', label: 'مصر EGX100', aliases: ['^EGX100.CA'] },

  // US indices (expanded)
  { sym: '^GSPC', label: 'S&P 500' },
  { sym: '^IXIC', label: 'ناسداك' },
  { sym: '^DJI', label: 'داو جونز' },
  { sym: '^NDX', label: 'ناسداك 100' },
  { sym: '^RUT', label: 'راسل 2000' },
  { sym: '^NYA', label: 'NYSE المركب' },
  { sym: '^SP400', label: 'S&P 400' },
  { sym: '^SP600', label: 'S&P 600' },
  { sym: '^W5000', label: 'ويلشاير 5000' },
  { sym: '^DJT', label: 'داو للنقل' },
  { sym: '^DJU', label: 'داو للمرافق' },
  { sym: '^SOX', label: 'أشباه الموصلات' },

  // Global extras
  { sym: '^FTSE', label: 'فوتسي 100' },
  { sym: '^GDAXI', label: 'داكس' },
  { sym: '^FCHI', label: 'كاك 40' },
  { sym: '^N225', label: 'نيكاي' },
  { sym: '^HSI', label: 'هانغ سنغ' },
  { sym: '^VIX', label: 'VIX' },
];

const COMMODITY_DEFS: Array<{ sym: string; label: string; prefix?: string }> = [
  // Precious Metals
  { sym: 'GC=F', label: 'الذهب', prefix: '$' },
  { sym: 'SI=F', label: 'الفضة', prefix: '$' },
  { sym: 'PL=F', label: 'البلاتين', prefix: '$' },
  { sym: 'PA=F', label: 'البلاديوم', prefix: '$' },
  // Energy
  { sym: 'CL=F', label: 'نفط WTI', prefix: '$' },
  { sym: 'BZ=F', label: 'نفط برنت', prefix: '$' },
  { sym: 'NG=F', label: 'الغاز', prefix: '$' },
  // Industrial
  { sym: 'HG=F', label: 'النحاس', prefix: '$' },
  // Agriculture
  { sym: 'ZW=F', label: 'القمح', prefix: '$' },
  { sym: 'ZC=F', label: 'الذرة', prefix: '$' },
  { sym: 'KC=F', label: 'القهوة', prefix: '$' },
  { sym: 'CC=F', label: 'الكاكاو', prefix: '$' },
  { sym: 'SB=F', label: 'السكر', prefix: '$' },
  { sym: 'CT=F', label: 'القطن', prefix: '$' },
];

const CRYPTO_LABELS: Record<string, string> = {
  'BTC': 'بيتكوين', 'ETH': 'إيثيريوم', 'SOL': 'سولانا', 'XRP': 'ريبل',
  'BNB': 'بينانس', 'ADA': 'كاردانو', 'DOGE': 'دوجكوين', 'AVAX': 'أفالانش',
  'DOT': 'بولكادوت', 'LINK': 'تشين لينك', 'MATIC': 'بوليجون', 'SHIB': 'شيبا',
  'UNI': 'يوني سواب', 'LTC': 'لايتكوين', 'NEAR': 'نير', 'ATOM': 'كوزموس',
  'FET': 'فيتش AI', 'RENDER': 'ريندر', 'ARB': 'أربيتروم', 'OP': 'أوبتيميزم',
  'TRX': 'ترون', 'PEPE': 'بيبي', 'TON': 'تون', 'BCH': 'بيتكوين كاش',
  'SUI': 'سوي', 'APT': 'أبتوس', 'INJ': 'إنجكتيف', 'FIL': 'فايل كوين',
  'AAVE': 'آفي', 'ICP': 'ICP', 'HBAR': 'هيديرا', 'XLM': 'ستيلار',
  'KAS': 'كاسبا', 'SEI': 'سي', 'TIA': 'سلستيا', 'STX': 'ستاكس',
};

const FOREX_DEFS: Array<{ sym: string; label: string }> = [
  { sym: 'EURUSD=X', label: 'EUR/USD' },
  { sym: 'GBPUSD=X', label: 'GBP/USD' },
  { sym: 'USDJPY=X', label: 'USD/JPY' },
  { sym: 'USDCHF=X', label: 'USD/CHF' },
  { sym: 'AUDUSD=X', label: 'AUD/USD' },
  { sym: 'USDCAD=X', label: 'USD/CAD' },
  { sym: 'NZDUSD=X', label: 'NZD/USD' },
  { sym: 'SAR=X', label: 'USD/SAR' },
  { sym: 'AED=X', label: 'USD/AED' },
  { sym: 'KWD=X', label: 'USD/KWD' },
  { sym: 'EGP=X', label: 'USD/EGP' },
];

// ─── Cache ───
const CACHE_KEY = 'global_ticker_v2';

function loadCache(): Record<string, QuoteData> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - (parsed._ts || 0) > 300_000) return null;
    delete parsed._ts;
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch { return null; }
}

function saveCache(data: Record<string, QuoteData>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, _ts: Date.now() })); } catch {}
}

// ─── Component ───

function TickerRow({ items, direction = 'normal', speed = 2 }: { items: TickerEntry[]; direction?: string; speed?: number }) {
  if (items.length === 0) return null;
  const tripled = [...items, ...items, ...items];
  const duration = Math.max(30, items.length * speed);

  return (
    <div className="overflow-hidden">
      <div
        className="flex whitespace-nowrap"
        style={{
          width: 'max-content',
          animationName: 'ticker-scroll',
          animationDuration: `${duration}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationDirection: direction,
          willChange: 'transform',
        }}
      >
        {tripled.map((item, i) => {
          const isUp = item.change >= 0;
          return (
            <div key={`${item.symbol}-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 border-r border-border/20 flex-shrink-0">
              <span className="text-muted-foreground text-xs font-medium">{item.label}</span>
              <span className="font-bold text-sm tabular-nums">{fmtPrice(item.price)}</span>
              <span className={`text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${isUp ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-red-600 dark:text-red-400 bg-red-500/10'}`}>
                {isUp ? '▲' : '▼'} {formatNumber(Math.abs(item.changePct), 2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmtPrice(n: number): string {
  if (n >= 10000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (n >= 100) return formatNumber(n, 2);
  if (n >= 1) return formatNumber(n, 4);
  return formatNumber(n, 6);
}

function resolveQuoteBySymbols(
  data: Record<string, QuoteData>,
  symbols: string[]
): { symbol: string; quote: QuoteData } | null {
  for (const s of symbols) {
    const q = data[s];
    if (q && q.price) return { symbol: s, quote: q };
  }
  return null;
}

export function GlobalMarketTicker() {
  const pathname = usePathname();
  const [tickerData, setTickerData] = useState<Record<string, QuoteData>>({});
  const [cryptoData, setCryptoData] = useState<Record<string, QuoteData>>({});
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [tickerRes, cryptoRes] = await Promise.allSettled([
        fetch('/api/ticker', { signal: AbortSignal.timeout(12000) }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/real-prices?type=crypto', { signal: AbortSignal.timeout(8000) }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (!mountedRef.current) return;

      let newData: Record<string, QuoteData> = {};

      if (tickerRes.status === 'fulfilled' && tickerRes.value?.success && tickerRes.value.data) {
        newData = tickerRes.value.data;
      }

      if (Object.keys(newData).length > 0) {
        setTickerData((prev) => {
          const merged = { ...prev, ...newData };
          saveCache(merged);
          return merged;
        });
        setIsLive(true);
      }

      if (cryptoRes.status === 'fulfilled' && cryptoRes.value?.success && cryptoRes.value.data) {
        setCryptoData(cryptoRes.value.data);
      }
    } catch {}
    if (mountedRef.current) setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const cached = loadCache();
    if (cached && Object.keys(cached).length > 0) {
      setTickerData(cached);
      setIsLive(true);
      setLoading(false);
    }
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [refresh]);

  if (pathname === '/login') return null;

  // Build rows
  const indexItems: TickerEntry[] = INDEX_DEFS.map((d) => {
    const matched = resolveQuoteBySymbols(tickerData, [d.sym, ...(d.aliases || [])]);
    if (!matched) return null;
    return {
      symbol: d.label,
      label: d.label,
      price: matched.quote.price,
      change: matched.quote.change,
      changePct: matched.quote.changePct,
    };
  }).filter(Boolean) as TickerEntry[];

  const commodityItems: TickerEntry[] = COMMODITY_DEFS.map(d => {
    const q = tickerData[d.sym];
    if (!q || !q.price) return null;
    return { symbol: d.sym, label: d.label, price: q.price, change: q.change, changePct: q.changePct };
  }).filter(Boolean) as TickerEntry[];

  // Crypto from CoinGecko (better data) + fallback to ticker API
  const cryptoItems: TickerEntry[] = [];
  const addedCrypto = new Set<string>();

  // First add from CoinGecko
  for (const [key, data] of Object.entries(cryptoData)) {
    if (key.startsWith('TOTAL') || key.startsWith('BTC_DOM') || key.startsWith('ETH_DOM')) continue;
    const sym = key.replace('-USD', '').replace('-USDT', '');
    const label = CRYPTO_LABELS[sym];
    if (!label || !data.price || data.price <= 0) continue;
    cryptoItems.push({ symbol: sym, label, price: data.price, change: data.change, changePct: data.changePct });
    addedCrypto.add(sym);
  }

  // Then add from ticker API if not already added
  const yahooToCrypto: Record<string, string> = {
    'BTC-USD': 'BTC', 'ETH-USD': 'ETH', 'SOL-USD': 'SOL', 'XRP-USD': 'XRP', 'BNB-USD': 'BNB',
    'ADA-USD': 'ADA', 'DOGE-USD': 'DOGE', 'AVAX-USD': 'AVAX', 'DOT-USD': 'DOT', 'LINK-USD': 'LINK',
    'MATIC-USD': 'MATIC', 'SHIB-USD': 'SHIB', 'UNI-USD': 'UNI', 'LTC-USD': 'LTC', 'NEAR-USD': 'NEAR',
    'ATOM-USD': 'ATOM', 'FET-USD': 'FET', 'RENDER-USD': 'RENDER', 'ARB-USD': 'ARB', 'OP-USD': 'OP',
  };
  for (const [ySym, cSym] of Object.entries(yahooToCrypto)) {
    if (addedCrypto.has(cSym)) continue;
    const q = tickerData[ySym];
    if (!q || !q.price) continue;
    const label = CRYPTO_LABELS[cSym];
    if (!label) continue;
    cryptoItems.push({ symbol: cSym, label, price: q.price, change: q.change, changePct: q.changePct });
  }

  // Forex from ticker API
  const forexItems: TickerEntry[] = FOREX_DEFS.map(d => {
    const q = tickerData[d.sym];
    if (!q || !q.price) return null;
    return { symbol: d.sym, label: d.label, price: q.price, change: q.change, changePct: q.changePct };
  }).filter(Boolean) as TickerEntry[];

  const totalItems = indexItems.length + commodityItems.length + cryptoItems.length + forexItems.length;

  // Loading skeleton
  if (loading && totalItems === 0) {
    return (
      <div className="sticky top-0 z-50 bg-card text-card-foreground border-b overflow-hidden select-none" dir="ltr">
        <div className="border-b border-border/50 py-2 px-4">
          <div className="flex items-center gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                <div className="h-3 w-10 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 bg-card text-card-foreground border-b overflow-hidden select-none" dir="ltr">
      {/* Row 1: Global Exchanges */}
      <div className="border-b border-border/50 flex items-center">
        <div className="bg-muted px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shrink-0 border-r border-border/30 self-stretch">
          <span>🌐</span>
          <span>البورصات العالمية</span>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        </div>
        <div className="flex-1 overflow-hidden">
          {indexItems.length > 0 ? (
            <TickerRow items={indexItems} direction="normal" speed={5} />
          ) : (
            <div className="px-3 py-1.5 text-xs text-muted-foreground">جاري تحديث مؤشرات البورصات...</div>
          )}
        </div>
      </div>

      {/* Row 2: Commodities, Metals, Forex */}
      <div className="border-b border-border/50 flex items-center">
        <div className="bg-muted px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shrink-0 border-r border-border/30 self-stretch">
          <span>⛏️</span>
          <span>السلع والمعادن والعملات</span>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        </div>
        <div className="flex-1 overflow-hidden">
          {(commodityItems.length > 0 || forexItems.length > 0) ? (
            <TickerRow items={[...commodityItems, ...forexItems]} direction="reverse" speed={5} />
          ) : (
            <div className="px-3 py-1.5 text-xs text-muted-foreground">جاري تحديث السلع والمعادن والعملات...</div>
          )}
        </div>
      </div>

      {/* Row 3: Crypto */}
      <div className="flex items-center">
        <div className="bg-muted px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shrink-0 border-r border-border/30 self-stretch">
          <span>₿</span>
          <span>العملات المشفرة</span>
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        </div>
        <div className="flex-1 overflow-hidden">
          {cryptoItems.length > 0 ? (
            <TickerRow items={cryptoItems} direction="normal" speed={5} />
          ) : (
            <div className="px-3 py-1.5 text-xs text-muted-foreground">جاري تحديث العملات المشفرة...</div>
          )}
        </div>
      </div>
    </div>
  );
}
