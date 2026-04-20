import { NextRequest, NextResponse } from 'next/server';
import { withApiTelemetry } from '@/lib/api-telemetry';

type EarningsResult = 'beat' | 'miss' | 'inline' | null;

interface EarningsRecord {
  id: string;
  symbol: string;
  name: string;
  quarter: string;
  year: number;
  announcementDate: string;
  expectedEPS: number | null;
  actualEPS: number | null;
  surprise: number | null;
  surprisePct: number | null;
  result: EarningsResult;
  currency: string;
  source: 'auto';
  notes: string;
  createdAt: string;
}

interface CacheEntry {
  records: EarningsRecord[];
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();
const YAHOO_HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'] as const;

function quarterFromMonth(month: number) {
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}

function calcSurprise(expected: number | null, actual: number | null): {
  surprise: number | null;
  surprisePct: number | null;
  result: EarningsResult;
} {
  if (expected == null || actual == null) {
    return { surprise: null, surprisePct: null, result: null };
  }

  const surprise = actual - expected;
  const surprisePct = Math.abs(expected) > 0 ? (surprise / Math.abs(expected)) * 100 : 0;
  const result: EarningsResult = surprise > 0.01 ? 'beat' : surprise < -0.01 ? 'miss' : 'inline';
  return { surprise, surprisePct, result };
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

function parseRecords(result: any, symbol: string, stockName: string): EarningsRecord[] {
  const records: EarningsRecord[] = [];
  const nowIso = new Date().toISOString();

  const quarterly = result?.earnings?.earningsChart?.quarterly;
  if (quarterly && Array.isArray(quarterly)) {
    for (const q of quarterly) {
      const dateParts = (q.date || '').match(/(\d)Q(\d{4})/);
      let quarter: string;
      let year: number;

      if (dateParts) {
        quarter = `Q${dateParts[1]}`;
        year = Number.parseInt(dateParts[2], 10);
      } else {
        const alt = (q.date || '').match(/Q(\d)\s*(\d{4})/i);
        if (!alt) {
          continue;
        }
        quarter = `Q${alt[1]}`;
        year = Number.parseInt(alt[2], 10);
      }

      const actual = q.actual?.raw ?? (typeof q.actual === 'number' ? q.actual : null);
      const estimate = q.estimate?.raw ?? (typeof q.estimate === 'number' ? q.estimate : null);
      const { surprise, surprisePct, result: outcome } = calcSurprise(estimate, actual);

      records.push({
        id: `er_${symbol}_${year}_${quarter}_hist_${Math.random().toString(36).slice(2, 6)}`,
        symbol,
        name: stockName || symbol,
        quarter,
        year,
        announcementDate: '',
        expectedEPS: estimate,
        actualEPS: actual,
        surprise,
        surprisePct: surprisePct != null ? Number(surprisePct.toFixed(2)) : null,
        result: outcome,
        currency: 'USD',
        source: 'auto',
        notes: '',
        createdAt: nowIso,
      });
    }
  }

  const calEarnings = result?.calendarEvents?.earnings;
  if (calEarnings) {
    const earningsDate = calEarnings.earningsDate?.[0]?.raw
      ? new Date(calEarnings.earningsDate[0].raw * 1000).toISOString().split('T')[0]
      : calEarnings.earningsDate?.[0]?.fmt || null;

    if (earningsDate) {
      const d = new Date(earningsDate);
      const upcomingQuarter = quarterFromMonth(d.getMonth() + 1);
      const upcomingYear = d.getFullYear();

      let upcomingEstimate: number | null = null;
      const trends = result?.earningsTrend?.trend;
      if (trends && Array.isArray(trends)) {
        const currentQ = trends.find((t: Record<string, unknown>) => t.period === '0q') as any;
        if (currentQ?.earningsEstimate?.avg?.raw != null) {
          upcomingEstimate = currentQ.earningsEstimate.avg.raw;
        }
      }
      if (upcomingEstimate == null) {
        const epsEst = calEarnings.earningsAverage?.raw;
        if (epsEst != null) {
          upcomingEstimate = epsEst;
        }
      }

      records.push({
        id: `er_${symbol}_${upcomingYear}_${upcomingQuarter}_upcoming_${Math.random().toString(36).slice(2, 6)}`,
        symbol,
        name: stockName || symbol,
        quarter: upcomingQuarter,
        year: upcomingYear,
        announcementDate: earningsDate,
        expectedEPS: upcomingEstimate,
        actualEPS: null,
        surprise: null,
        surprisePct: null,
        result: null,
        currency: 'USD',
        source: 'auto',
        notes: '',
        createdAt: nowIso,
      });
    }
  }

  return records;
}

async function getEarnings(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get('symbol') || '').trim().toUpperCase();
  const name = (searchParams.get('name') || symbol).trim();

  if (!symbol) {
    return NextResponse.json({ success: false, error: 'symbol is required' }, { status: 400 });
  }

  const cacheKey = `${symbol}:${name}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp <= CACHE_TTL_MS) {
    return NextResponse.json({ success: true, cached: true, records: cached.records });
  }

  const payload = await fetchYahooJson(
    `/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=earnings,earningsTrend,calendarEvents`
  );

  const result = payload?.quoteSummary?.result?.[0];
  if (!result) {
    cache.set(cacheKey, { records: [], timestamp: Date.now() });
    return NextResponse.json({ success: true, records: [] });
  }

  const records = parseRecords(result, symbol, name);
  cache.set(cacheKey, { records, timestamp: Date.now() });

  return NextResponse.json({ success: true, records });
}

export const GET = withApiTelemetry('/api/market/earnings', getEarnings);
