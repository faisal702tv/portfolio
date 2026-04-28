import { NextRequest, NextResponse } from 'next/server';
import { LOCAL_SYMBOL_DB } from '@/data/symbols-database';
import { getShariaMarketsData } from '@/lib/sharia-dataset-store';

type AssetType = 'stock' | 'fund';

interface SearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  type?: string;
  source: string;
  sector?: string;
  shariaStatus?: string;
  shariaBilad?: string;
  shariaRajhi?: string;
  shariaMaqasid?: string;
  shariaZero?: string;
}

function normalizeType(raw: string | null): AssetType {
  return raw === 'fund' ? 'fund' : 'stock';
}

// ═══════════════════════════════════════════════════════════
// LOCAL search from 15,137 symbols + 7,376 sharia entries
// ═══════════════════════════════════════════════════════════

function searchLocal(query: string, shariaDb: Record<string, string[][]>): SearchResult[] {
  const q = query.toLowerCase();
  const scored: Array<{ score: number; rank: number; result: SearchResult }> = [];
  let rank = 0;

  // Search LOCAL_SYMBOL_DB (15,137 symbols) with direct-match priority
  for (const [sym, info] of Object.entries(LOCAL_SYMBOL_DB)) {
    const symbolLower = sym.toLowerCase();
    const name = info.n || sym;
    const nameLower = name.toLowerCase();

    const exactSymbol = symbolLower === q;
    const startsWithSymbol = symbolLower.startsWith(q);
    const exactName = nameLower === q;
    const startsWithName = nameLower.startsWith(q);
    const includesSymbol = symbolLower.includes(q);
    const includesName = nameLower.includes(q);

    if (!includesSymbol && !includesName) continue;

    let score = 6;
    if (exactSymbol) score = 0;
    else if (startsWithSymbol) score = 1;
    else if (exactName) score = 2;
    else if (startsWithName) score = 3;
    else if (includesSymbol) score = 4;
    else if (includesName) score = 5;

    const sharia = lookupSharia(sym, shariaDb);
    scored.push({
      score,
      rank: rank++,
      result: {
        symbol: sym,
        name,
        exchange: info.e || '',
        currency: detectCurrencyFromMarket(info.mkt),
        type: info.c || 'Equity',
        source: 'قاعدة البيانات المحلية',
        sector: info.s || '',
        ...sharia,
      },
    });
  }

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (a.result.symbol.length !== b.result.symbol.length) return a.result.symbol.length - b.result.symbol.length;
    return a.rank - b.rank;
  });

  return scored.slice(0, 30).map((entry) => entry.result);
}

function lookupSharia(symbol: string, shariaDb: Record<string, string[][]>): {
  shariaStatus?: string;
  shariaBilad?: string;
  shariaRajhi?: string;
  shariaMaqasid?: string;
  shariaZero?: string;
} {
  const cleanSym = symbol.replace(/\.(SR|AD|DU|CA|QA|BH|OM)$/i, '');
  for (const [mktKey, rows] of Object.entries(shariaDb)) {
    const isFn = mktKey === 'fn';
    for (const r of rows) {
      if (r[0] === cleanSym || r[0] === symbol) {
        if (isFn) {
          return { shariaStatus: r[2] as string };
        }
        return {
          shariaStatus: r[4] as string,
          shariaBilad: r[8] as string,
          shariaRajhi: r[9] as string,
          shariaMaqasid: r[10] as string,
          shariaZero: r[11] as string,
        };
      }
    }
  }
  return {};
}

const MKT_CURRENCY: Record<string, string> = {
  saudi: 'SAR', adx: 'AED', dfm: 'AED', kuwait: 'KWD',
  qatar: 'QAR', bahrain: 'BHD', egypt: 'EGP', oman: 'OMR',
  jordan: 'JOD', usa: 'USD', crypto: 'USD', jo: 'JOD', om: 'OMR',
};

function detectCurrencyFromMarket(mkt: string | undefined): string {
  if (!mkt) return '';
  return MKT_CURRENCY[mkt.toLowerCase()] || '';
}

// ═══════════════════════════════════════════════════════════
// Yahoo Finance search (free, no API key needed)
// ═══════════════════════════════════════════════════════════

async function searchYahoo(query: string, shariaDb: Record<string, string[][]>): Promise<SearchResult[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    const quotes = Array.isArray(data?.quotes) ? data.quotes : [];
    return quotes.slice(0, 10).map((item: any) => {
      const sym = item.symbol ?? '';
      const sharia = lookupSharia(sym, shariaDb);
      return {
        symbol: sym,
        name: item.shortname ?? item.longname ?? '',
        exchange: item.exchDisp ?? item.exchange ?? '',
        currency: item.currency ?? '',
        type: item.quoteType ?? '',
        source: 'Yahoo Finance',
        ...sharia,
      };
    }).filter((x: SearchResult) => x.symbol && x.name);
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════
// Paid API providers (optional)
// ═══════════════════════════════════════════════════════════

async function searchAlphaVantage(query: string): Promise<SearchResult[]> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return [];
  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${encodeURIComponent(key)}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    const best = Array.isArray(data?.bestMatches) ? data.bestMatches : [];
    return best.slice(0, 10).map((item: Record<string, string>) => ({
      symbol: item['1. symbol'] ?? '',
      name: item['2. name'] ?? '',
      exchange: item['4. region'] ?? '',
      currency: item['8. currency'] ?? '',
      type: item['3. type'] ?? '',
      source: 'Alpha Vantage',
    })).filter((x: SearchResult) => x.symbol && x.name);
  } catch { return []; }
}

async function searchFmp(query: string): Promise<SearchResult[]> {
  const key = process.env.FMP_API_KEY;
  if (!key) return [];
  try {
    const url = `https://financialmodelingprep.com/stable/search-symbol?query=${encodeURIComponent(query)}&apikey=${encodeURIComponent(key)}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.slice(0, 10).map((item: any) => ({
      symbol: item.symbol ?? '',
      name: item.name ?? '',
      exchange: item.exchangeShortName ?? item.exchange ?? '',
      currency: item.currency ?? '',
      type: item.type ?? '',
      source: 'FMP',
    })).filter((x: SearchResult) => x.symbol && x.name);
  } catch { return []; }
}

// ═══════════════════════════════════════════════════════════
// Main search handler
// ═══════════════════════════════════════════════════════════

function dedupe(results: SearchResult[]) {
  const map = new Map<string, SearchResult>();
  for (const result of results) {
    if (!map.has(result.symbol)) {
      map.set(result.symbol, result);
    } else {
      // Merge sharia data if existing entry doesn't have it
      const existing = map.get(result.symbol)!;
      if (!existing.shariaStatus && result.shariaStatus) {
        map.set(result.symbol, { ...existing, ...result, source: existing.source });
      }
    }
  }
  return [...map.values()];
}

export async function GET(request: NextRequest) {
  const q = (new URL(request.url).searchParams.get('q') ?? '').trim();
  const type = normalizeType(new URL(request.url).searchParams.get('type'));

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const shariaDb = await getShariaMarketsData({ autoRefresh: true });

    // 1. Always search local DB first (instant, has sharia data)
    const localResults = searchLocal(q, shariaDb);

    // 2. Search Yahoo Finance + paid APIs in parallel
    const [yahoo, alpha, fmp] = await Promise.all([
      searchYahoo(q, shariaDb),
      searchAlphaVantage(q),
      searchFmp(q),
    ]);

    // 3. Merge: local first, then Yahoo, then paid
    let merged = dedupe([...localResults, ...yahoo, ...alpha, ...fmp]);

    // 4. Filter by type if needed
    if (type === 'fund') {
      merged = merged.filter(item => {
        const t = (item.type ?? '').toLowerCase();
        const n = item.name.toLowerCase();
        return t.includes('fund') || t.includes('etf') || n.includes('fund') || n.includes('etf') || n.includes('صندوق');
      });
    }

    return NextResponse.json({ results: merged.slice(0, 15) });
  } catch (error) {
    console.error('Market search error:', error);
    // Fallback to local only
    const shariaDb = await getShariaMarketsData({ autoRefresh: false }).catch(() => ({} as Record<string, string[][]>));
    const localResults = searchLocal(q, shariaDb);
    return NextResponse.json({ results: localResults.slice(0, 15) });
  }
}
