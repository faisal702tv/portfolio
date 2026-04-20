import { NextRequest, NextResponse } from 'next/server';
import { withApiTelemetry } from '@/lib/api-telemetry';

interface CorporateAction {
  id: string;
  symbol: string;
  name: string;
  type: 'split' | 'reverse_split' | 'dividend';
  ratio: string | null;
  ratioFrom: number | null;
  ratioTo: number | null;
  dividendAmount: number | null;
  effectiveDate: string;
  currency: string;
  applied: boolean;
  source: 'auto';
  notes: string;
  createdAt: string;
}

interface CacheEntry {
  actions: CorporateAction[];
  timestamp: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, CacheEntry>();
const YAHOO_HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'] as const;

function formatDate(ts: number | string) {
  if (!ts) return '';
  const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
  return d.toISOString().slice(0, 10);
}

async function fetchYahooJson(pathname: string): Promise<any | null> {
  for (const host of YAHOO_HOSTS) {
    try {
      const res = await fetch(`https://${host}${pathname}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/1.0)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(12000),
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

async function getCorporateActions(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get('symbol') || '').trim().toUpperCase();
  const name = (searchParams.get('name') || symbol).trim();

  if (!symbol) {
    return NextResponse.json({ success: false, error: 'symbol is required' }, { status: 400 });
  }

  const cacheKey = `${symbol}:${name}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp <= CACHE_TTL_MS) {
    return NextResponse.json({ success: true, cached: true, actions: cached.actions });
  }

  const [splitsData, divData] = await Promise.all([
    fetchYahooJson(`/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5y&events=splits`),
    fetchYahooJson(`/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2y&events=div`),
  ]);

  const actions: CorporateAction[] = [];
  const createdAt = new Date().toISOString();

  const splitsObj = splitsData?.chart?.result?.[0]?.events?.splits;
  if (splitsObj) {
    (Object.values(splitsObj) as Record<string, unknown>[]).forEach((split) => {
      const effDate = formatDate(split.date as number);
      const num = Number(split.numerator) || 1;
      const den = Number(split.denominator) || 1;
      const isReverse = num < den;
      const type: CorporateAction['type'] = isReverse ? 'reverse_split' : 'split';
      const ratio = isReverse ? `${den}:${num}` : `${num}:${den}`;

      actions.push({
        id: `ca_${symbol}_${effDate}_${type}_${Math.random().toString(36).slice(2, 6)}`,
        symbol,
        name,
        type,
        ratio,
        ratioFrom: isReverse ? num : den,
        ratioTo: isReverse ? den : num,
        dividendAmount: null,
        effectiveDate: effDate,
        currency: 'USD',
        applied: false,
        source: 'auto',
        notes: `splitRatio: ${String(split.splitRatio || ratio)}`,
        createdAt,
      });
    });
  }

  const divsObj = divData?.chart?.result?.[0]?.events?.dividends;
  if (divsObj) {
    (Object.values(divsObj) as Record<string, unknown>[]).forEach((div) => {
      const effDate = formatDate(div.date as number);
      actions.push({
        id: `ca_${symbol}_${effDate}_div_${Math.random().toString(36).slice(2, 6)}`,
        symbol,
        name,
        type: 'dividend',
        ratio: null,
        ratioFrom: null,
        ratioTo: null,
        dividendAmount: Number(div.amount) || 0,
        effectiveDate: effDate,
        currency: 'USD',
        applied: false,
        source: 'auto',
        notes: '',
        createdAt,
      });
    });
  }

  const sorted = actions.sort((a, b) => (b.effectiveDate || '').localeCompare(a.effectiveDate || ''));
  cache.set(cacheKey, { actions: sorted, timestamp: Date.now() });

  return NextResponse.json({ success: true, actions: sorted });
}

export const GET = withApiTelemetry('/api/market/corporate-actions', getCorporateActions);
