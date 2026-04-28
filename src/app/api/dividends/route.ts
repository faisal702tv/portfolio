import { NextResponse } from 'next/server';
import { DIVIDEND_DATABASE } from '@/data/dividends-database';

export const dynamic = 'force-dynamic';

interface YahooDividend {
  symbol: string;
  name: string;
  currency: string;
  annualDiv: number;
  yieldPct: number;
  frequency: string;
  lastExDate: string;
  nextExDate: string;
  lastDivPerShare: number;
  recentDividends: Array<{ date: string; amount: number }>;
  source: string;
}

async function fetchYahooDividends(symbols: string[]): Promise<YahooDividend[]> {
  const results: YahooDividend[] = [];

  const batches: string[][] = [];
  for (let i = 0; i < symbols.length; i += 5) {
    batches.push(symbols.slice(i, i + 5));
  }

  for (const batch of batches) {
    const promises = batch.map(async (sym) => {
      try {
        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1y&events=div`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return null;

        const d = await res.json();
        const r = d?.chart?.result?.[0];
        if (!r) return null;

        const meta = r.meta || {};
        const events = r.events || {};
        const dividends = events.dividends || {};

        const divs: Array<{ date: string; amount: number }> = [];
        for (const v of Object.values(dividends) as Array<{ date: number; amount: number }>) {
          const dt = new Date(v.date * 1000).toISOString().split('T')[0];
          divs.push({ date: dt, amount: v.amount });
        }
        divs.sort((a, b) => b.date.localeCompare(a.date));

        const recent = divs.slice(0, 4);
        const annualTotal = recent.reduce((s, d) => s + d.amount, 0);
        const price = meta.regularMarketPrice || 0;
        const yieldPct = price > 0 ? (annualTotal / price) * 100 : 0;

        let frequency: string = 'none';
        if (divs.length >= 10) frequency = 'monthly';
        else if (divs.length >= 3) frequency = 'quarterly';
        else if (divs.length >= 1) frequency = 'semi-annual';
        else if (annualTotal > 0) frequency = 'annual';

        let nextExDate = '';
        if (divs.length >= 2) {
          try {
            const d1 = new Date(divs[0].date);
            const d2 = new Date(divs[1].date);
            const diff = Math.abs(d1.getTime() - d2.getTime());
            const next = new Date(d1.getTime() + diff);
            nextExDate = next.toISOString().split('T')[0];
          } catch {}
        }

        return {
          symbol: sym,
          name: meta.shortName || sym,
          currency: meta.currency || 'USD',
          annualDiv: Math.round(annualTotal * 10000) / 10000,
          yieldPct: Math.round(yieldPct * 100) / 100,
          frequency,
          lastExDate: divs[0]?.date || '',
          nextExDate,
          lastDivPerShare: divs[0]?.amount || 0,
          recentDividends: divs.slice(0, 6),
          source: 'Yahoo Finance (مباشر)',
        } as YahooDividend;
      } catch {
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }

  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'local';
  const symbolsParam = searchParams.get('symbols');
  const market = searchParams.get('market');

  if (mode === 'live' && symbolsParam) {
    const symbols = symbolsParam.split(',').map((s) => s.trim()).filter(Boolean);
    const liveData = await fetchYahooDividends(symbols);
    return NextResponse.json({ success: true, mode: 'live', count: liveData.length, data: liveData });
  }

  if (mode === 'local' || !mode) {
    const allEntries = Object.values(DIVIDEND_DATABASE);

    let filtered = allEntries;
    if (market) {
      filtered = filtered.filter((e) => {
        if (market === 'saudi') return e.symbol.endsWith('.SR');
        if (market === 'usa') return !e.symbol.includes('.');
        if (market === 'funds') return e.frequency === 'monthly' || e.annualDiv > 0;
        return true;
      });
    }

    const upcoming = filtered
      .filter((e) => e.nextExDate && e.nextExDate >= new Date().toISOString().split('T')[0])
      .sort((a, b) => a.nextExDate.localeCompare(b.nextExDate));

    return NextResponse.json({
      success: true,
      mode: 'local',
      totalEntries: allEntries.length,
      upcomingCount: upcoming.length,
      upcoming,
      all: filtered,
      lastUpdated: '2026-04-25',
    });
  }

  return NextResponse.json({ success: false, error: 'Invalid mode' }, { status: 400 });
}
