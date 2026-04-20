import { NextResponse } from 'next/server';
import { forexData, getAllForexPairs } from '@/data/markets';

interface LiveForexQuote {
  price: number;
  change: number;
  changePct: number;
  previousClose: number;
  bid?: number;
  ask?: number;
  high?: number;
  low?: number;
}

// Cache live forex rates (60s TTL)
let liveCache: { data: Record<string, LiveForexQuote>; ts: number } = { data: {}, ts: 0 };
const CACHE_TTL = 60_000;

// Fetch live forex from Yahoo Finance
async function fetchLiveForexRates(): Promise<Record<string, LiveForexQuote>> {
  const result: Record<string, LiveForexQuote> = {};

  // Map our symbols to Yahoo symbols
  const pairToYahoo: Record<string, string> = {
    // Major
    'EURUSD': 'EURUSD=X', 'GBPUSD': 'GBPUSD=X', 'USDJPY': 'USDJPY=X',
    'USDCHF': 'USDCHF=X', 'AUDUSD': 'AUDUSD=X', 'USDCAD': 'USDCAD=X',
    'NZDUSD': 'NZDUSD=X',
    // Minor
    'EURGBP': 'EURGBP=X', 'EURJPY': 'EURJPY=X',
    'GBPJPY': 'GBPJPY=X', 'EURCHF': 'EURCHF=X', 'AUDJPY': 'AUDJPY=X',
    'EURAUD': 'EURAUD=X', 'GBPAUD': 'GBPAUD=X', 'EURNZD': 'EURNZD=X',
    // Emerging & Arab
    'USDSAR': 'SAR=X', 'USDAED': 'AED=X', 'USDKWD': 'KWD=X',
    'USDEGP': 'EGP=X', 'USDTRY': 'TRY=X', 'USDCNY': 'CNY=X',
    'USDINR': 'INR=X', 'USDMXN': 'MXN=X', 'USDZAR': 'ZAR=X',
  };

  const yahooSymbols = Object.values(pairToYahoo).join(',');
  const yahooToOurs = Object.fromEntries(Object.entries(pairToYahoo).map(([k, v]) => [v, k]));

  const urls = [
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbols)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,bid,ask,regularMarketDayHigh,regularMarketDayLow`,
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbols)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,bid,ask,regularMarketDayHigh,regularMarketDayLow`,
  ];

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];

  // Try v7 batch
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)] },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const quotes = data?.quoteResponse?.result || [];
      for (const q of quotes) {
        if (!q.symbol || !q.regularMarketPrice) continue;
        const ourSymbol = yahooToOurs[q.symbol];
        if (ourSymbol) {
          result[ourSymbol] = {
            price: q.regularMarketPrice,
            change: q.regularMarketChange ?? 0,
            changePct: q.regularMarketChangePercent ?? 0,
            previousClose: q.regularMarketPreviousClose ?? q.regularMarketPrice,
            bid: q.bid || undefined,
            ask: q.ask || undefined,
            high: q.regularMarketDayHigh || undefined,
            low: q.regularMarketDayLow || undefined,
          };
        }
      }
      if (Object.keys(result).length > 0) return result;
    } catch { /* try next */ }
  }

  // Fallback: individual v8/chart calls for key pairs
  const keyPairs = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X', 'SAR=X'];
  const promises = keyPairs.map(async (ySym) => {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}?interval=1d&range=2d`,
        {
          headers: { 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)] },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) return;
      const price = meta.regularMarketPrice;
      const prev = meta.previousClose || meta.chartPreviousClose || price;
      const ourSymbol = yahooToOurs[ySym];
      if (ourSymbol) {
        result[ourSymbol] = {
          price,
          change: +(price - prev).toFixed(4),
          changePct: prev > 0 ? +((price - prev) / prev * 100).toFixed(2) : 0,
          previousClose: prev,
        };
      }
    } catch { /* skip */ }
  });
  await Promise.all(promises);

  return result;
}

function mergeLiveData(staticPairs: any[], liveData: Record<string, LiveForexQuote>) {
  return staticPairs.map(pair => {
    const live = liveData[pair.symbol];
    if (live) {
      return {
        ...pair,
        price: live.price,
        change: live.change,
        changePct: live.changePct,
        previousClose: live.previousClose,
        ...(live.bid && { bid: live.bid }),
        ...(live.ask && { ask: live.ask }),
        ...(live.high && { high: live.high }),
        ...(live.low && { low: live.low }),
        isLive: true,
      };
    }
    return { ...pair, isLive: false };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const symbol = searchParams.get('symbol');

  try {
    // Fetch live data (cached)
    const now = Date.now();
    let liveData = liveCache.data;
    if (!liveCache.ts || now - liveCache.ts > CACHE_TTL) {
      const freshData = await fetchLiveForexRates();
      if (Object.keys(freshData).length > 0) {
        liveData = freshData;
        liveCache = { data: freshData, ts: now };
      }
    }

    // Get specific symbol
    if (symbol) {
      const allPairs = getAllForexPairs();
      const pair = allPairs.find(p => p.symbol.toLowerCase() === symbol.toLowerCase());

      if (!pair) {
        return NextResponse.json({ error: 'Currency pair not found' }, { status: 404 });
      }

      const live = liveData[pair.symbol];
      const merged = live ? {
        ...pair,
        price: live.price, change: live.change, changePct: live.changePct,
        isLive: true,
      } : { ...pair, isLive: false };

      return NextResponse.json({ pair: merged });
    }

    // Get by category
    if (category) {
      const categories: Record<string, any[]> = {
        major: forexData.majorPairs,
        minor: forexData.minorPairs,
        emerging: forexData.emergingPairs,
        arab: forexData.arabPairs,
      };

      const pairs = categories[category.toLowerCase()];
      if (!pairs) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }

      const mergedPairs = mergeLiveData(pairs, liveData);
      return NextResponse.json({
        category,
        count: mergedPairs.length,
        pairs: mergedPairs,
        liveCount: mergedPairs.filter((p: any) => p.isLive).length,
      });
    }

    // Get all forex data
    return NextResponse.json({
      dollarIndex: forexData.dollarIndex,
      categories: {
        major: {
          count: forexData.majorPairs.length,
          pairs: mergeLiveData(forexData.majorPairs, liveData),
        },
        minor: {
          count: forexData.minorPairs.length,
          pairs: mergeLiveData(forexData.minorPairs, liveData),
        },
        emerging: {
          count: forexData.emergingPairs.length,
          pairs: mergeLiveData(forexData.emergingPairs, liveData),
        },
        arab: {
          count: forexData.arabPairs.length,
          pairs: mergeLiveData(forexData.arabPairs, liveData),
        },
      },
      totalPairs: getAllForexPairs().length,
      liveDataAvailable: Object.keys(liveData).length > 0,
    });
  } catch (error) {
    console.error('Error fetching forex data:', error);
    return NextResponse.json({ error: 'Failed to fetch forex data' }, { status: 500 });
  }
}
