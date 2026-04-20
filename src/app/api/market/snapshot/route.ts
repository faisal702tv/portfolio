import { NextRequest, NextResponse } from 'next/server';
import { withApiTelemetry } from '@/lib/api-telemetry';

interface IndexData {
  price: number;
  chg: number;
  history: { t: string; v: number }[];
}

interface PriceData {
  price: number;
  changePct: number;
  volume: number;
}

interface SnapshotPayload {
  index: IndexData | null;
  prices: Record<string, PriceData>;
}

interface CacheEntry {
  data: SnapshotPayload;
  timestamp: number;
}

const CACHE_TTL_MS = 30 * 1000;
const cache = new Map<string, CacheEntry>();
const YAHOO_HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'] as const;

async function fetchYahooJson(pathname: string): Promise<any | null> {
  for (const host of YAHOO_HOSTS) {
    try {
      const res = await fetch(`https://${host}${pathname}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/1.0)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
        cache: 'no-store',
      });

      if (!res.ok) {
        continue;
      }

      return await res.json();
    } catch {
      continue;
    }
  }

  return null;
}

async function fetchIndex(sym: string): Promise<IndexData | null> {
  const payload = await fetchYahooJson(
    `/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`
  );

  const result = payload?.chart?.result?.[0];
  if (!result) {
    return null;
  }

  const meta = result.meta;
  const price = Number(meta?.regularMarketPrice || 0);
  if (!price || price <= 0) {
    return null;
  }

  const prev = Number(meta?.chartPreviousClose || meta?.previousClose || price);
  const chg = prev > 0 ? ((price - prev) / prev) * 100 : 0;
  const timestamps = (result.timestamp || []).slice(-5);
  const closes = (result.indicators?.quote?.[0]?.close || []).slice(-5);

  return {
    price,
    chg,
    history: timestamps.map((t: number, i: number) => ({
      t: new Date(t * 1000).toLocaleDateString('ar-SA-u-ca-gregory', { weekday: 'short' }),
      v: Number(closes[i] || price),
    })),
  };
}

async function fetchPrices(symbols: string[]): Promise<Record<string, PriceData>> {
  if (symbols.length === 0) {
    return {};
  }

  const payload = await fetchYahooJson(
    `/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`
  );

  const rows = payload?.quoteResponse?.result;
  if (!Array.isArray(rows)) {
    return {};
  }

  const out: Record<string, PriceData> = {};

  for (const row of rows) {
    const symbol = String(row?.symbol || '').trim();
    const price = Number(row?.regularMarketPrice || 0);
    if (!symbol || !price || price <= 0) {
      continue;
    }

    const prev = Number(row?.regularMarketPreviousClose || row?.regularMarketOpen || price);
    const changePctFromFeed = row?.regularMarketChangePercent;
    const changePct = Number.isFinite(changePctFromFeed)
      ? Number(changePctFromFeed)
      : prev > 0
        ? ((price - prev) / prev) * 100
        : 0;

    out[symbol] = {
      price,
      changePct,
      volume: Number(row?.regularMarketVolume || 0),
    };
  }

  return out;
}

async function getSnapshot(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const indexSym = (searchParams.get('indexSym') || '').trim();
  const symbols = (searchParams.get('symbols') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 120);

  if (!indexSym && symbols.length === 0) {
    return NextResponse.json({ success: false, error: 'indexSym or symbols is required' }, { status: 400 });
  }

  const cacheKey = `${indexSym}|${symbols.join(',')}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp <= CACHE_TTL_MS) {
    return NextResponse.json({ success: true, cached: true, ...cached.data });
  }

  const [index, prices] = await Promise.all([
    indexSym ? fetchIndex(indexSym) : Promise.resolve(null),
    fetchPrices(symbols),
  ]);

  const data: SnapshotPayload = { index, prices };
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return NextResponse.json({ success: true, ...data });
}

export const GET = withApiTelemetry('/api/market/snapshot', getSnapshot);
