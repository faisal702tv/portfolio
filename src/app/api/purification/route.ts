import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getShariaMarketsData } from '@/lib/sharia-dataset-store';

export const runtime = 'nodejs';

type AssetType = 'stock' | 'fund';

interface MarketRow {
  symbol?: string;
  name?: string;
  debt_capital?: number;
  purification?: number;
  market_cap?: string;
}

interface MarketFile {
  all_stocks?: MarketRow[];
}

interface MetricsMatch {
  symbol: string;
  name: string;
  market: string;
  marketCap?: string;
  interestIncomeRatio: number;
  debtToMarketCapRatio: number;
}

interface ShariaPurificationMatch {
  symbol: string;
  name: string;
  marketKey: string;
  purificationPct: number;
}

const DATA_DIR = path.join(process.cwd(), 'data', 'stocks');

const MARKET_FILES = [
  'saudi',
  'american',
  'american_etf',
  'uae',
  'egypt',
  'qatar',
  'kuwait',
  'bahrain',
  'oman',
  'jordan',
] as const;

const marketIndexCache = new Map<string, Map<string, MetricsMatch>>();

const EXCHANGE_MARKET_MAP: Array<{ pattern: RegExp; markets: string[] }> = [
  { pattern: /(TADAWUL|SAUDI|TASI|NOMU|\.SR)/i, markets: ['saudi'] },
  { pattern: /(NYSE|NASDAQ|AMEX|CBOE|OTC|\bUS\b)/i, markets: ['american', 'american_etf'] },
  { pattern: /(ADX|DFM|\.AD|\.DU)/i, markets: ['uae'] },
  { pattern: /(KSE|BOURSA|\.KW)/i, markets: ['kuwait'] },
  { pattern: /(QSE|QATAR|\.QA)/i, markets: ['qatar'] },
  { pattern: /(BHB|BAHRAIN|\.BH)/i, markets: ['bahrain'] },
  { pattern: /(EGX|EGYPT|\.CA)/i, markets: ['egypt'] },
  { pattern: /(MSM|OMAN|\.OM)/i, markets: ['oman'] },
  { pattern: /(ASE|AMMAN|\.JO)/i, markets: ['jordan'] },
];

const SHARIA_MARKET_KEY_MAP: Record<string, string> = {
  saudi: 'sa',
  american: 'us',
  american_etf: 'us',
  uae: 'ae',
  egypt: 'eg',
  qatar: 'qa',
  kuwait: 'kw',
  bahrain: 'bh',
  oman: 'om',
  jordan: 'jo',
};

function normalizeRatio(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 1) return n / 100;
  return n;
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function stripKnownSuffix(symbol: string): string {
  return symbol.replace(/\.(SR|AD|DU|CA|QA|BH|OM|KW|JO|L|TO|NE|AX)$/i, '');
}

function symbolAliases(rawSymbol: string): string[] {
  const normalized = normalizeSymbol(rawSymbol);
  const base = stripKnownSuffix(normalized);
  const aliases = new Set<string>([
    normalized,
    normalized.replace('_', '.'),
    normalized.replace('.', '_'),
    base,
  ]);

  if (base.includes('/')) aliases.add(base.replace('/', '-'));
  if (base.includes('-')) aliases.add(base.replace('-', '/'));
  return [...aliases].filter(Boolean);
}

function scoreMatch(match: MetricsMatch): number {
  return (
    (match.interestIncomeRatio > 0 ? 1 : 0) +
    (match.debtToMarketCapRatio > 0 ? 1 : 0) +
    (match.marketCap && match.marketCap !== '-' ? 1 : 0)
  );
}

function upsertBest(index: Map<string, MetricsMatch>, key: string, incoming: MetricsMatch) {
  const current = index.get(key);
  if (!current || scoreMatch(incoming) > scoreMatch(current)) {
    index.set(key, incoming);
  }
}

async function loadMarketIndex(market: string): Promise<Map<string, MetricsMatch>> {
  if (marketIndexCache.has(market)) {
    return marketIndexCache.get(market)!;
  }

  const filePath = path.join(DATA_DIR, `${market}.json`);
  const index = new Map<string, MetricsMatch>();

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as MarketFile;
    const rows = Array.isArray(parsed.all_stocks) ? parsed.all_stocks : [];

    for (const row of rows) {
      if (!row?.symbol) continue;

      const symbol = normalizeSymbol(String(row.symbol));
      const candidate: MetricsMatch = {
        symbol,
        name: String(row.name || symbol),
        market,
        marketCap: row.market_cap ? String(row.market_cap) : undefined,
        // مصدر البيانات يخزن النسب كقيم معيارية (0.05 = 5%)
        interestIncomeRatio: normalizeRatio(row.purification),
        debtToMarketCapRatio: normalizeRatio(row.debt_capital),
      };

      for (const alias of symbolAliases(symbol)) {
        upsertBest(index, alias, candidate);
      }
    }
  } catch {
    // ignore and keep empty index
  }

  marketIndexCache.set(market, index);
  return index;
}

function candidateMarkets(exchange: string, assetType: AssetType): string[] {
  const ex = exchange.trim();
  if (!ex) {
    return assetType === 'fund'
      ? ['american_etf', ...MARKET_FILES.filter((m) => m !== 'american_etf')]
      : [...MARKET_FILES];
  }

  const matched = EXCHANGE_MARKET_MAP.find((entry) => entry.pattern.test(ex));
  if (!matched) return [...MARKET_FILES];

  const prioritized = [...matched.markets];
  if (assetType === 'fund' && prioritized.includes('american')) {
    return ['american_etf', ...prioritized.filter((m) => m !== 'american_etf')];
  }
  return prioritized;
}

async function findMetrics(symbol: string, exchange: string, assetType: AssetType) {
  const aliases = symbolAliases(symbol);
  const primaryMarkets = candidateMarkets(exchange, assetType);
  const fallbackMarkets = MARKET_FILES.filter((m) => !primaryMarkets.includes(m));

  for (const market of [...primaryMarkets, ...fallbackMarkets]) {
    const index = await loadMarketIndex(market);
    for (const alias of aliases) {
      const found = index.get(alias);
      if (found) return found;
    }
  }
  return null;
}

function round4(n: number): number {
  return Number(n.toFixed(4));
}

function parsePercent(value: unknown): number {
  if (value == null) return 0;
  const cleaned = String(value).replace('%', '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function candidateShariaKeys(exchange: string, assetType: AssetType): string[] {
  const keys = candidateMarkets(exchange, assetType)
    .map((m) => SHARIA_MARKET_KEY_MAP[m])
    .filter(Boolean);
  if (assetType === 'fund') keys.unshift('fn');
  return [...new Set(keys)];
}

function buildShariaSearchSet(symbol: string): Set<string> {
  return new Set(symbolAliases(symbol).map((s) => normalizeSymbol(stripKnownSuffix(s))));
}

function findShariaPurification(
  symbol: string,
  exchange: string,
  assetType: AssetType,
  shariaDb: Record<string, string[][]>
): ShariaPurificationMatch | null {
  const searchSet = buildShariaSearchSet(symbol);
  const primary = candidateShariaKeys(exchange, assetType);
  const allKeys = Object.keys(shariaDb);
  const keys = [...primary, ...allKeys.filter((k) => !primary.includes(k))];

  for (const key of keys) {
    const rows = shariaDb[key];
    if (!Array.isArray(rows)) continue;

    for (const row of rows) {
      const rowSymbol = normalizeSymbol(String(row?.[0] || ''));
      if (!rowSymbol) continue;
      if (!searchSet.has(normalizeSymbol(stripKnownSuffix(rowSymbol)))) continue;

      const pct = parsePercent(row?.[7]);
      return {
        symbol: rowSymbol,
        name: String(row?.[1] || rowSymbol),
        marketKey: key,
        purificationPct: round4(pct),
      };
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get('symbol') || '').trim();
  const exchange = (searchParams.get('exchange') || '').trim();
  const assetTypeRaw = (searchParams.get('assetType') || 'stock').trim().toLowerCase();
  const assetType: AssetType = assetTypeRaw === 'fund' ? 'fund' : 'stock';

  if (!symbol) {
    return NextResponse.json(
      { success: false, error: 'symbol is required' },
      { status: 400 }
    );
  }

  try {
    const shariaDb = await getShariaMarketsData({ autoRefresh: true });
    const match = await findMetrics(symbol, exchange, assetType);
    const shariaFallback = findShariaPurification(symbol, exchange, assetType, shariaDb);
    const isUsExchange = /(NASDAQ|NYSE|AMEX|CBOE|OTC|\bUS\b)/i.test(exchange);

    if (!match && !shariaFallback) {
      return NextResponse.json({
        success: true,
        found: false,
        symbol: normalizeSymbol(symbol),
        sourceMarket: null,
        interestIncomeToRevenuePct: 0,
        debtToMarketCapPct: 0,
        purificationPct: 0,
      });
    }

    let sourceMarket: string | null = match?.market ?? null;
    let outSymbol = match?.symbol ?? normalizeSymbol(symbol);
    let outName = match?.name ?? normalizeSymbol(symbol);
    let outMarketCap: string | null = match?.marketCap ?? null;

    let interestIncomeToRevenuePct = round4((match?.interestIncomeRatio || 0) * 100);
    let debtToMarketCapPct = round4((match?.debtToMarketCapRatio || 0) * 100);

    // تحسين إظهار التطهير للأسهم الأمريكية:
    // عند وجود نسبة تطهير موثقة في قاعدة الشريعة، نعتمدها مباشرة كقيمة التطهير.
    if (shariaFallback && (isUsExchange || match?.market === 'american' || match?.market === 'american_etf' || !match || interestIncomeToRevenuePct <= 0)) {
      sourceMarket = `${shariaFallback.marketKey}-sharia`;
      outSymbol = shariaFallback.symbol;
      outName = shariaFallback.name;
      interestIncomeToRevenuePct = shariaFallback.purificationPct;
      debtToMarketCapPct = 0;
      if (!match) outMarketCap = null;
    }

    const purificationPct = round4(interestIncomeToRevenuePct + debtToMarketCapPct);

    return NextResponse.json({
      success: true,
      found: true,
      symbol: outSymbol,
      name: outName,
      sourceMarket,
      marketCap: outMarketCap,
      interestIncomeToRevenuePct,
      debtToMarketCapPct,
      purificationPct,
    });
  } catch (error) {
    console.error('Purification metrics route error:', error);
    return NextResponse.json(
      { success: false, error: 'failed to fetch purification metrics' },
      { status: 500 }
    );
  }
}
