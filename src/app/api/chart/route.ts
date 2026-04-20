import { NextRequest, NextResponse } from 'next/server';

const CACHE = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const range = searchParams.get('range') || '6mo';
  const interval = searchParams.get('interval') || '1d';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
  }

  const cacheKey = `${symbol}-${range}-${interval}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch', success: false }, { status: res.status });
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) {
      return NextResponse.json({ error: 'No chart data', success: false }, { status: 404 });
    }

    const timestamp = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const ohlcv = timestamp
      .map((t: number, i: number) => ({
        date: new Date(t * 1000).toLocaleDateString('en-US'),
        timestamp: t,
        open: quote.open?.[i] ?? null,
        high: quote.high?.[i] ?? null,
        low: quote.low?.[i] ?? null,
        close: quote.close?.[i] ?? null,
        volume: quote.volume?.[i] ?? null,
      }))
      .filter((d: any) => d.close != null);

    const response = {
      success: true,
      symbol: result.meta?.symbol || symbol,
      currency: result.meta?.currency || 'USD',
      regularMarketPrice: result.meta?.regularMarketPrice,
      previousClose: result.meta?.previousClose,
      data: ohlcv,
    };

    CACHE.set(cacheKey, { data: response, ts: Date.now() });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Chart API error:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data', success: false }, { status: 500 });
  }
}
