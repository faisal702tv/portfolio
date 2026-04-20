import { NextRequest, NextResponse } from 'next/server';
import { SHARIA_MARKETS_DB } from '@/data/sharia-markets-database';

// هيكل صف البيانات في SHARIA_MARKETS_DB:
// [0] symbol  [1] name  [2] exchange  [3] grade  [4] overall (✅/❌)
// [5] recommendation  [6] sector  [7] purification%
// [8] bilad  [9] rajhi  [10] maqasid  [11] zerodebt

// خريطة مفاتيح الخريطة الحرارية → مفاتيح قاعدة البيانات الشرعية
const HEATMAP_TO_SHARIA_KEY: Record<string, string> = {
  tasi: 'sa',
  us:   'us',
  uae:  'ae',
  kw:   'kw',
  qa:   'qa',
  bh:   'bh',
  eg:   'eg',
  jo:   'jo',
  om:   'om',
};

function canonicalSymbol(s: unknown): string {
  return String(s ?? '')
    .trim()
    .toUpperCase()
    .replace(/\.(SR|AD|DU|QA|BH|OM|KW|CA|JO)$/i, '');
}

export interface ShariaLookupResult {
  found: boolean;
  symbol: string;
  grade: string;
  overall: string;          // ✅ / ❌ / 🟡
  recommendation: string;   // 🟢 شراء / 🔴 تجنب / 🟡 احتفظ
  purification: string;     // e.g. "5.6%"
  bilad: string;
  rajhi: string;
  maqasid: string;
  zerodebt: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSymbol = searchParams.get('symbol') ?? '';
  const rawMarket = searchParams.get('market') ?? '';

  if (!rawSymbol || !rawMarket) {
    return NextResponse.json({ found: false, error: 'missing params' }, { status: 400 });
  }

  const symbol = canonicalSymbol(rawSymbol);
  const shariaKey = HEATMAP_TO_SHARIA_KEY[rawMarket.toLowerCase()] ?? rawMarket.toLowerCase();
  const rows: string[][] = (SHARIA_MARKETS_DB as Record<string, string[][]>)[shariaKey] ?? [];

  const row = rows.find((r) => canonicalSymbol(r?.[0]) === symbol);

  if (!row) {
    return NextResponse.json({ found: false, symbol });
  }

  const result: ShariaLookupResult = {
    found:          true,
    symbol,
    grade:          String(row[3]  ?? '').trim() || '—',
    overall:        String(row[4]  ?? '').trim() || '🟡',
    recommendation: String(row[5]  ?? '').trim() || '—',
    purification:   String(row[7]  ?? '').trim() || '—',
    bilad:          String(row[8]  ?? '').trim() || '—',
    rajhi:          String(row[9]  ?? '').trim() || '—',
    maqasid:        String(row[10] ?? '').trim() || '—',
    zerodebt:       String(row[11] ?? '').trim() || '—',
  };

  return NextResponse.json(result);
}
