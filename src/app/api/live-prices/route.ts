import { NextResponse } from 'next/server';

interface PriceData {
  price: number;
  change: number;
  changePct: number;
  lastUpdate: number;
  source: string;
}

// Cache with 30s TTL
let priceCache: { data: Record<string, PriceData>; ts: number } = { data: {}, ts: 0 };
const CACHE_TTL = 30_000;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ─── Yahoo Finance symbols ───

const YAHOO_SYMBOLS: Record<string, string> = {
  // US Indices
  '^GSPC': 'SPX', '^DJI': 'DJI', '^IXIC': 'IXIC', '^RUT': 'RUT',
  '^NDX': 'NDX', '^VIX': 'VIX', '^MID': 'MID', '^SML': 'SML',
  // Saudi Market
  '^TASI.SR': 'TASI',
  '^TASI': 'TASI',
  'MT30': 'MT30',
  'NOMUC': 'NOMUC',
  '1120.SR': '1120.SR', '1180.SR': '1180.SR', '7010.SR': '7010.SR',
  '2222.SR': '2222.SR', '2002.SR': '2002.SR', '4002.SR': '4002.SR',
  '4180.SR': '4180.SR', '5110.SR': '5110.SR', '8070.SR': '8070.SR',
  '6002.SR': '6002.SR', '6010.SR': '6010.SR', '7201.SR': '7201.SR',
  '4260.SR': '4260.SR', '1201.SR': '1201.SR', '2380.SR': '2380.SR',
  '4001.SR': '4001.SR', '4160.SR': '4160.SR', '4190.SR': '4190.SR',
  '4050.SR': '4050.SR', '4100.SR': '4100.SR', '1060.SR': '1060.SR',
  '4150.SR': '4150.SR',
  // Gulf Indices
  '^FTFADGI': 'ADI', '^DFMGI': 'DFMGI', '^KWSE': 'KSE',
  '^QSI': 'QSE', '^BSEX': 'BHX', '^MSI30': 'MSX30',
  '^CASE30': 'EGX30',
  // Commodities
  'GC=F': 'XAU', 'SI=F': 'XAG', 'PL=F': 'XPT', 'PA=F': 'XPD',
  'CL=F': 'WTI', 'BZ=F': 'BRENT', 'NG=F': 'NATGAS', 'HG=F': 'COPPER',
  // Forex
  'EURUSD=X': 'EUR/USD', 'GBPUSD=X': 'GBP/USD', 'USDJPY=X': 'USD/JPY',
  'USDCHF=X': 'USD/CHF', 'AUDUSD=X': 'AUD/USD', 'USDCAD=X': 'USD/CAD',
  'SAR=X': 'SAR/USD', 'AED=X': 'AED/USD',
};

// ─── Yahoo Finance fetchers ───

async function fetchV7Batch(symbols: string[]): Promise<Record<string, { price: number; change: number; changePct: number }>> {
  const result: Record<string, { price: number; change: number; changePct: number }> = {};
  const syms = symbols.join(',');
  const urls = [
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(syms)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent`,
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(syms)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': randomUA() },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const quotes = data?.quoteResponse?.result || [];
      for (const q of quotes) {
        if (!q.symbol || !q.regularMarketPrice) continue;
        result[q.symbol] = {
          price: q.regularMarketPrice,
          change: q.regularMarketChange ?? 0,
          changePct: q.regularMarketChangePercent ?? 0,
        };
      }
      if (Object.keys(result).length > 0) return result;
    } catch { /* try next */ }
  }
  return result;
}

async function fetchChartQuote(sym: string): Promise<{ price: number; change: number; changePct: number } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=2d`,
      { headers: { 'User-Agent': randomUA() }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    const price = meta.regularMarketPrice;
    const prev = meta.previousClose || meta.chartPreviousClose || price;
    return {
      price,
      change: +(price - prev).toFixed(4),
      changePct: prev > 0 ? +((price - prev) / prev * 100).toFixed(2) : 0,
    };
  } catch { return null; }
}

async function fetchYahooData(): Promise<Record<string, PriceData>> {
  const results: Record<string, PriceData> = {};
  const now = Date.now();
  const yahooSymbols = Object.keys(YAHOO_SYMBOLS);

  // Try v7 batch first
  const batchData = await fetchV7Batch(yahooSymbols);

  // Map Yahoo symbols to our keys
  for (const [ySym, ourKey] of Object.entries(YAHOO_SYMBOLS)) {
    const q = batchData[ySym];
    if (q) {
      results[ourKey] = { ...q, lastUpdate: now, source: 'Yahoo Finance' };
    }
  }

  // Fallback: fetch missing via v8/chart
  const missing = yahooSymbols.filter(s => !batchData[s]);
  if (missing.length > 0 && missing.length < yahooSymbols.length) {
    for (let i = 0; i < missing.length; i += 8) {
      const batch = missing.slice(i, i + 8);
      const promises = batch.map(async (sym) => {
        const q = await fetchChartQuote(sym);
        if (q) {
          const ourKey = YAHOO_SYMBOLS[sym];
          results[ourKey] = { ...q, lastUpdate: now, source: 'Yahoo Finance (chart)' };
        }
      });
      await Promise.all(promises);
    }
  }

  return results;
}

// ─── Crypto from CoinGecko (better data) ───

async function fetchCryptoPrices(): Promise<Record<string, PriceData>> {
  const results: Record<string, PriceData> = {};
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,binancecoin,cardano,dogecoin,polkadot,chainlink,uniswap,litecoin,avalanche-2,near,cosmos,fetch-ai,render-token,arbitrum,optimism&vs_currencies=usd&include_24hr_change=true',
      { signal: AbortSignal.timeout(8000), headers: { 'Accept': 'application/json' } }
    );
    if (response.ok) {
      const data = await response.json();
      const now = Date.now();
      const mapping: Record<string, string> = {
        bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', ripple: 'XRP',
        binancecoin: 'BNB', cardano: 'ADA', dogecoin: 'DOGE', polkadot: 'DOT',
        chainlink: 'LINK', uniswap: 'UNI', litecoin: 'LTC', 'avalanche-2': 'AVAX',
        near: 'NEAR', cosmos: 'ATOM', 'fetch-ai': 'FET', 'render-token': 'RENDER',
        arbitrum: 'ARB', optimism: 'OP',
      };
      for (const [id, symbol] of Object.entries(mapping)) {
        if (data[id]) {
          const price = data[id].usd;
          const changePct = data[id].usd_24h_change || 0;
          results[symbol] = {
            price,
            change: +(price * (changePct / 100)).toFixed(4),
            changePct: +changePct.toFixed(2),
            lastUpdate: now,
            source: 'CoinGecko',
          };
        }
      }
    }
  } catch (error) {
    console.error('CoinGecko error:', error);
  }
  return results;
}

export async function GET() {
  const now = Date.now();

  // Return cache if fresh
  if (priceCache.ts && now - priceCache.ts < CACHE_TTL && Object.keys(priceCache.data).length > 0) {
    return NextResponse.json({
      success: true,
      cached: true,
      timestamp: now,
      count: Object.keys(priceCache.data).length,
      data: priceCache.data,
    });
  }

  try {
    // Fetch Yahoo + CoinGecko in parallel
    const [yahoo, crypto] = await Promise.all([
      fetchYahooData(),
      fetchCryptoPrices(),
    ]);

    const allPrices: Record<string, PriceData> = { ...yahoo, ...crypto };

    if (Object.keys(allPrices).length > 0) {
      priceCache = { data: allPrices, ts: now };
    }

    return NextResponse.json({
      success: true,
      cached: false,
      timestamp: now,
      count: Object.keys(allPrices).length,
      data: allPrices,
    });
  } catch (error) {
    console.error('Live prices API error:', error);
    // Return stale cache
    if (Object.keys(priceCache.data).length > 0) {
      return NextResponse.json({
        success: true,
        cached: true,
        stale: true,
        timestamp: now,
        count: Object.keys(priceCache.data).length,
        data: priceCache.data,
      });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch live prices' }, { status: 500 });
  }
}
