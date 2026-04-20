import { NextRequest, NextResponse } from 'next/server';

interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  currency?: string;
  source: string;
}

async function quoteAlphaVantage(symbol: string): Promise<Quote | null> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return null;
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) return null;
  const data = await res.json();
  const q = data?.['Global Quote'];
  if (!q?.['05. price']) return null;
  const price = Number(q['05. price']);
  const change = Number(q['09. change'] ?? 0);
  const changePct = Number(String(q['10. change percent'] ?? '0').replace('%', ''));
  return { symbol, price, change, changePct, source: 'Alpha Vantage' };
}

async function quoteFmp(symbol: string): Promise<Quote | null> {
  const key = process.env.FMP_API_KEY;
  if (!key) return null;
  const url = `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) return null;
  const data = await res.json();
  const q = Array.isArray(data) ? data[0] : null;
  if (!q?.price) return null;
  return {
    symbol,
    price: Number(q.price),
    change: Number(q.change ?? 0),
    changePct: Number(q.changesPercentage ?? 0),
    currency: q.currency ?? undefined,
    source: 'Financial Modeling Prep',
  };
}

async function quoteTwelveData(symbol: string): Promise<Quote | null> {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) return null;
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) return null;
  const q = await res.json();
  if (!q?.close) return null;
  return {
    symbol,
    price: Number(q.close),
    change: Number(q.change ?? 0),
    changePct: Number(q.percent_change ?? 0),
    currency: q.currency ?? undefined,
    source: 'Twelve Data',
  };
}

async function quoteYahooFallback(symbol: string): Promise<Quote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) return null;
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) return null;
  const price = Number(meta.regularMarketPrice);
  const prev = Number(meta.previousClose ?? price);
  const change = price - prev;
  const changePct = prev > 0 ? (change / prev) * 100 : 0;
  return {
    symbol,
    price,
    change,
    changePct,
    currency: meta.currency ?? undefined,
    source: 'Yahoo Finance (fallback)',
  };
}

export async function GET(request: NextRequest) {
  const symbol = (new URL(request.url).searchParams.get('symbol') ?? '').trim().toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: 'symbol is required' }, { status: 400 });
  }

  try {
    const providers = [quoteAlphaVantage, quoteFmp, quoteTwelveData, quoteYahooFallback];
    for (const provider of providers) {
      const quote = await provider(symbol);
      if (quote) return NextResponse.json({ quote });
    }
    return NextResponse.json({ error: 'quote not found' }, { status: 404 });
  } catch (error) {
    console.error('Market quote error:', error);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
