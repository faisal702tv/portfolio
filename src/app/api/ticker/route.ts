import { NextResponse } from 'next/server';

interface QuoteData {
  price: number;
  change: number;
  changePct: number;
  volume: number;
  currency?: string;
  source?: string;
}

// Cache with 60s TTL + stale fallback
const cacheByKey: Record<string, { data: Record<string, QuoteData>; ts: number }> = {};
const CACHE_TTL = 60_000;
const STALE_MAX_AGE = 10 * 60_000;
const MAX_SYMBOLS = 500;
const V7_CHUNK_SIZE = 120;
const MAX_CHART_FALLBACK = 220;
const MAX_PROVIDER_FALLBACK = 60;
const SAUDI_EXCHANGE_INDICES_URLS = [
  'https://www.saudiexchange.sa/wps/portal/saudiexchange/ourmarkets/main-market-watch/main-market-indices?locale=en',
  'https://www.saudiexchange.sa/wps/portal/saudiexchange/ourmarkets/main-market-watch/main-market-indices-performance?locale=en',
  'https://www.saudiexchange.sa/wps/portal/saudiexchange/ourmarkets/nomuc-market-watch/nomu-indices-performance?locale=en',
];
const DFM_INDICES_URL = 'https://service.dfm.ae/Indices';
const DFM_BULLETINS_URL = 'https://service.dfm.ae/Bulletins/';
const QSE_HOME_URL = 'https://www.qe.com.qa/';
const BOURSA_KUWAIT_HOME_URL = 'https://www.boursakuwait.com.kw/en/';
const BAHRAIN_BOURSE_HOME_URL = 'https://www.bahrainbourse.com/';
const MSX_HOME_URL = 'https://www.msx.om/default.aspx';
const NSE_HOME_URL = 'https://www.nseindia.com/';
const NSE_ALL_INDICES_API = 'https://www.nseindia.com/api/allIndices';
const BSE_HOME_URL = 'https://www.bseindia.com/';
const JPX_INDICES_URL = 'https://www.jpx.co.jp/english/markets/indices/';
const JPX_HOME_URL = 'https://www.jpx.co.jp/english/';
const HSI_HOME_URL = 'https://www.hsi.com.hk/eng';
const KRX_GLOBAL_HOME_URL = 'https://global.krx.co.kr/main/main.jsp';
const LSE_FTSE100_URL = 'https://www.londonstockexchange.com/indices/ftse-100';
const LSE_FTSE250_URL = 'https://www.londonstockexchange.com/indices/ftse-250';
const DEUTSCHE_BOERSE_HOME_URL = 'https://www.deutsche-boerse.com/dbg-en/';
const EURONEXT_PARIS_INDICES_URL = 'https://live.euronext.com/en/markets/paris/indices';
const STOXX_HOME_URL = 'https://www.stoxx.com/';
const EURONEXT_AMSTERDAM_INDICES_URL = 'https://live.euronext.com/en/markets/amsterdam/indices';
const SIX_MARKET_DATA_URL = 'https://www.six-group.com/en/market-data.html';
const BME_IBEX_URL = 'https://www.bolsasymercados.es/bme-exchange/en/Indices/Overview';
const NASDAQ_NORDIC_INDICES_URL = 'https://www.nasdaqomxnordic.com/index/index_info';
const CBOE_VIX_URL = 'https://www.cboe.com/tradable_products/vix/';
const STOOQ_QUOTES_URL = 'https://stooq.com/q/l/';

const SYMBOL_ALIASES: Record<string, string[]> = {
  '^TASI': ['^TASI.SR'],
  '^TASI.SR': ['^TASI'],
  '^TASI.BK': ['^TASI.BNK', 'TASI-BNK'],
  '^TASI.BNK': ['^TASI.BK', 'TASI-BNK'],
  'TASI-BNK': ['^TASI.BK', '^TASI.BNK'],
  '^TASI.EN': ['TASI-ENR'],
  'TASI-ENR': ['^TASI.EN'],
  '^TASI.TC': ['TASI-TEL'],
  'TASI-TEL': ['^TASI.TC'],
  '^QSII': ['^QSI'],
  'EGX30.CA': ['^CASE30'],
  '^BAX': ['^BSEX'],
  '^MSM': ['^MSI30'],
  '^OMX': ['^OMXS30'],
  'NASDAQ.DU': ['^DIFX'],
  '^NOMUC': ['NOMUC'],
  '^MT30': ['MT30'],
};

const STOOQ_SYMBOL_MAP: Record<string, { code: string; currency: string }> = {
  '^GSPC': { code: '^spx', currency: 'USD' },
  '^IXIC': { code: '^ixic', currency: 'USD' },
  '^DJI': { code: '^dji', currency: 'USD' },
  '^NDX': { code: '^ndx', currency: 'USD' },
  '^RUT': { code: '^rut', currency: 'USD' },
  '^VIX': { code: '^vix', currency: 'USD' },
  '^FTSE': { code: '^ukx', currency: 'GBP' },
  '^GDAXI': { code: '^dax', currency: 'EUR' },
  '^FCHI': { code: '^cac', currency: 'EUR' },
  '^STOXX50E': { code: '^stoxx50e', currency: 'EUR' },
  '^AEX': { code: '^aex', currency: 'EUR' },
  '^SSMI': { code: '^smi', currency: 'CHF' },
  '^IBEX': { code: '^ibex', currency: 'EUR' },
  '^OMXS30': { code: '^omx', currency: 'SEK' },
  '^ATX': { code: '^atx', currency: 'EUR' },
  '^BFX': { code: '^bfx', currency: 'EUR' },
  '^WIG20': { code: '^wig20', currency: 'PLN' },
  '^N225': { code: '^nkx', currency: 'JPY' },
  '^HSI': { code: '^hsi', currency: 'HKD' },
  '^BSESN': { code: '^sensex', currency: 'INR' },
  '^NSEI': { code: '^nifty', currency: 'INR' },
  '^KS11': { code: '^kospi', currency: 'KRW' },
  '^TWII': { code: '^twse', currency: 'TWD' },
  '^STI': { code: '^sti', currency: 'SGD' },
  '^KLSE': { code: '^klse', currency: 'MYR' },
  '^SET.BK': { code: '^set', currency: 'THB' },
  '^JKSE': { code: '^jkse', currency: 'IDR' },
  '^PSEI': { code: '^psei', currency: 'PHP' },
  '^AXJO': { code: '^asx', currency: 'AUD' },
  '^AORD': { code: '^aord', currency: 'AUD' },
  '^NZ50': { code: '^nz50', currency: 'NZD' },
  '^GSPTSE': { code: '^tsx', currency: 'CAD' },
  '^BVSP': { code: '^bvsp', currency: 'BRL' },
  '^MXX': { code: '^mexbol', currency: 'MXN' },
  '^MERV': { code: '^merv', currency: 'ARS' },
  '^IPSA': { code: '^ipsa', currency: 'CLP' },
};

const TICKER_SYMBOLS = [
  // Saudi & Gulf Indices
  '^TASI.SR', '^TASI.BK', '^TASI.EN', '^TASI.TC', 'MT30', 'NOMUC', '^FTFADGI', '^DFMGI', '^KWSE', '^QSI',
  '^CASE30', '^BSEX', '^MSI30',
  '^AMMANGI', '^AMMANFF', '^AMMANWT',
  'EGX70.CA', 'EGX100.CA',
  // US & Global Indices
  '^GSPC', '^IXIC', '^DJI', '^RUT', '^NDX', '^NYA', '^SP400', '^SP600',
  '^RUI', '^RUA', '^MID', '^W5000', '^DJT', '^DJU', '^SOX',
  '^FTSE', '^FTMC', '^FTAS', '^GDAXI', '^FCHI', '^STOXX50E',
  '^N225', '^TOPX', '^HSI', '^HSCE',
  '000001.SS', '399001.SZ', '000300.SS',
  '^BSESN', '^NSEI', '^NSEBANK',
  '^KS11', '^KS200', '^KQ11',
  '^TWII', '^STI', '^KLSE', '^SET.BK', '^JKSE', '^PSEI', '^AXJO', '^AORD', '^NZ50',
  'FTSEMIB.MI', '^IBEX', '^AEX', '^SSMI', '^OMXS30', '^OMXC25', '^OMXH25', '^ATX', '^BFX', '^WIG20',
  'OSEAX.OL', 'PSI20.LS', 'XU100.IS',
  '^GSPTSE', '^BVSP', '^MXX', '^MERV', '^IPSA',
  // VIX
  '^VIX',
  // Precious Metals
  'GC=F', 'SI=F', 'PL=F', 'PA=F',
  // Energy
  'CL=F', 'BZ=F', 'NG=F', 'HO=F', 'RB=F',
  // Industrial Metals
  'HG=F',
  // Agriculture
  'ZW=F', 'ZC=F', 'ZS=F', 'KC=F', 'CC=F', 'SB=F', 'CT=F',
  // Crypto
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'BNB-USD',
  'ADA-USD', 'DOGE-USD', 'AVAX-USD', 'DOT-USD', 'LINK-USD',
  'MATIC-USD', 'SHIB-USD', 'UNI-USD', 'LTC-USD', 'NEAR-USD',
  'ATOM-USD', 'FET-USD', 'RENDER-USD', 'ARB-USD', 'OP-USD',
  // Forex
  'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X',
  'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X',
  'SAR=X', 'AED=X', 'KWD=X', 'EGP=X',
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

type HealthSource = 'chart' | 'official' | 'stooq' | 'provider';

interface SourceHealthState {
  successes: number;
  failures: number;
  consecutiveFailures: number;
  blockedUntil: number;
  lastSuccessAt?: number;
  lastFailureAt?: number;
}

const sourceHealthBySymbol: Record<string, Partial<Record<HealthSource, SourceHealthState>>> = {};
const HEALTH_FAIL_THRESHOLD = 3;
const HEALTH_BLOCK_BASE_MS = 5 * 60_000;
const HEALTH_BLOCK_MAX_MS = 60 * 60_000;

const OFFICIAL_EXCHANGE_SUPPORTED = new Set<string>([
  '^DFMGI', '^QSI', '^QSII', '^KWSE', '^BSEX', '^BAX', '^MSI30', '^MSM',
  '^NSEI', '^NSEBANK', '^BSESN',
  '^N225', '^TOPX', '^HSI', '^HSCE', '^KS11', '^KS200', '^KQ11',
  '^FTSE', '^FTMC', '^GDAXI', '^FCHI', '^STOXX50E', '^AEX', '^SSMI', '^IBEX',
  '^OMXS30', '^OMXC25', '^OMXH25', '^ATX', '^BFX', '^WIG20', '^VIX',
]);

function getSourceHealthState(symbol: string, source: HealthSource): SourceHealthState {
  const key = symbol.toUpperCase();
  if (!sourceHealthBySymbol[key]) sourceHealthBySymbol[key] = {};
  if (!sourceHealthBySymbol[key]![source]) {
    sourceHealthBySymbol[key]![source] = {
      successes: 0,
      failures: 0,
      consecutiveFailures: 0,
      blockedUntil: 0,
    };
  }
  return sourceHealthBySymbol[key]![source]!;
}

function shouldSkipSource(symbol: string, source: HealthSource, now: number): boolean {
  const state = getSourceHealthState(symbol, source);
  return state.blockedUntil > now;
}

function recordSourceSuccess(symbol: string, source: HealthSource, now: number): void {
  const state = getSourceHealthState(symbol, source);
  state.successes += 1;
  state.consecutiveFailures = 0;
  state.blockedUntil = 0;
  state.lastSuccessAt = now;
}

function recordSourceFailure(symbol: string, source: HealthSource, now: number): void {
  const state = getSourceHealthState(symbol, source);
  state.failures += 1;
  state.consecutiveFailures += 1;
  state.lastFailureAt = now;

  if (state.consecutiveFailures >= HEALTH_FAIL_THRESHOLD) {
    const exp = state.consecutiveFailures - HEALTH_FAIL_THRESHOLD;
    const blockMs = Math.min(HEALTH_BLOCK_BASE_MS * (2 ** exp), HEALTH_BLOCK_MAX_MS);
    state.blockedUntil = now + blockMs;
  }
}

const SAUDI_EXCHANGE_KEYS: Record<string, string> = {
  NOMUC: 'NomuC',
  '^NOMUC': 'NomuC',
  MT30: 'MT30',
  '^MT30': 'MT30',
  '^TASI.SR': 'TASI',
  '^TASI': 'TASI',
  '^TASI.BK': 'Banks',
  '^TASI.EN': 'Energy',
  '^TASI.TC': 'Telecommunication Services',
};

function normalizeNumber(raw: string): number {
  const cleaned = raw
    .replace(/\u00A0/g, '')
    .replace(/,/g, '')
    .replace(/[−–]/g, '-')
    .replace(/%/g, '')
    .trim();
  const isNegativeByParens = /^\(.+\)$/.test(cleaned);
  const token = cleaned.replace(/[()]/g, '');
  const value = Number(token);
  if (!Number.isFinite(value)) return NaN;
  return isNegativeByParens ? -Math.abs(value) : value;
}

function extractCookieHeaderFromSetCookie(rawHeader: string): string {
  if (!rawHeader) return '';
  return rawHeader
    .split(/,(?=[^;,]+=[^;,]+)/g)
    .map((segment) => segment.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

function extractSaudiExchangeQuote(page: string, label: string): QuoteData | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `${escaped}\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)\\s*([+\\-−–]?[0-9][0-9,]*(?:\\.[0-9]+)?)\\s*\\(([+\\-−–]?[0-9]+(?:\\.[0-9]+)?)%\\)`,
    'i'
  );
  const match = page.match(pattern);
  if (!match) return null;
  const price = normalizeNumber(match[1]);
  const change = normalizeNumber(match[2]);
  const changePct = normalizeNumber(match[3]);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    price,
    change: Number.isFinite(change) ? change : 0,
    changePct: Number.isFinite(changePct) ? changePct : 0,
    volume: 0,
    currency: 'SAR',
    source: 'official_tadawul',
  };
}

async function fetchSaudiExchangeQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  const targets = symbols
    .map((symbol) => {
      const label = SAUDI_EXCHANGE_KEYS[symbol.toUpperCase()];
      return label ? { symbol, label } : null;
    })
    .filter((item): item is { symbol: string; label: string } => item !== null);

  if (targets.length === 0) return {};

  try {
    const result: Record<string, QuoteData> = {};
    const quoteByLabel = new Map<string, QuoteData>();

    for (const url of SAUDI_EXCHANGE_INDICES_URLS) {
      const unresolvedTargets = targets.filter((target) => !result[target.symbol]);
      if (unresolvedTargets.length === 0) break;

      const res = await fetch(url, {
        headers: { 'User-Agent': randomUA() },
        signal: AbortSignal.timeout(9000),
        cache: 'no-store',
      });
      if (!res.ok) continue;

      const page = await res.text();
      for (const target of unresolvedTargets) {
        let quote = quoteByLabel.get(target.label);
        if (!quote) {
          quote = extractSaudiExchangeQuote(page, target.label) || undefined;
          if (quote) quoteByLabel.set(target.label, quote);
        }
        if (quote) result[target.symbol] = { ...quote, source: quote.source || 'official_tadawul' };
      }
    }

    return result;
  } catch {
    return {};
  }
}

function extractRegexQuote(
  page: string,
  regex: RegExp,
  currency: string,
  defaults: Partial<Pick<QuoteData, 'change' | 'changePct' | 'volume'>> = {},
  source?: string
): QuoteData | null {
  const match = page.match(regex);
  if (!match) return null;

  const price = normalizeNumber(match[1] || '');
  if (!Number.isFinite(price) || price <= 0) return null;

  const rawChange = match[2] || '';
  const rawPct = match[3] || '';
  const change = rawChange ? normalizeNumber(rawChange) : (defaults.change ?? 0);
  const changePct = rawPct ? normalizeNumber(rawPct) : (defaults.changePct ?? 0);

  return {
    price,
    change: Number.isFinite(change) ? change : (defaults.change ?? 0),
    changePct: Number.isFinite(changePct) ? changePct : (defaults.changePct ?? 0),
    volume: defaults.volume ?? 0,
    currency,
    source,
  };
}

async function fetchDfmOfficialQuote(): Promise<QuoteData | null> {
  // Preferred endpoint: dedicated indices page.
  const candidates = [
    {
      url: DFM_INDICES_URL,
      regex: /DFM General Index[\s\S]{0,180}?([0-9][0-9,]*(?:\.[0-9]+)?)\s*([+\-−–]?[0-9][0-9,]*(?:\.[0-9]+)?)\s*\(([+\-−–]?[0-9]+(?:\.[0-9]+)?)%\)/i,
    },
    // Fallback endpoint: daily bulletins page.
    {
      url: DFM_BULLETINS_URL,
      regex: /DFM Index[\s\u00A0]*\(([0-9][0-9,]*(?:\.[0-9]+)?)\)[\s\u00A0]*Change Point[\s\u00A0]*\(([+\-−–]?[0-9][0-9,]*(?:\.[0-9]+)?)\)[\s\u00A0]*Change %[\s\u00A0]*\(([+\-−–]?[0-9]+(?:\.[0-9]+)?)\)/i,
    },
  ];

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate.url, {
        headers: { 'User-Agent': randomUA() },
        signal: AbortSignal.timeout(9000),
        cache: 'no-store',
      });
      if (!res.ok) continue;
      const page = await res.text();
      const quote = extractRegexQuote(page, candidate.regex, 'AED', {}, 'official_dfm');
      if (quote) return quote;
    } catch {
      // Try next candidate endpoint.
    }
  }

  return null;
}

async function fetchQseOfficialQuote(): Promise<QuoteData | null> {
  // QSE home exposes current QE index in the page header.
  try {
    const res = await fetch(QSE_HOME_URL, {
      headers: { 'User-Agent': randomUA() },
      signal: AbortSignal.timeout(9000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const page = await res.text();
    const quote = extractRegexQuote(
      page,
      /QE Index:\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      'QAR',
      { change: 0, changePct: 0, volume: 0 },
      'official_qse'
    );
    return quote;
  } catch {
    return null;
  }
}

async function fetchSimpleOfficialPrice(
  url: string,
  regex: RegExp,
  currency: string,
  source = 'official_page'
): Promise<QuoteData | null> {
  // Best-effort scraper for exchanges that expose only index value text.
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': randomUA() },
      signal: AbortSignal.timeout(9000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const page = await res.text();
    return extractRegexQuote(page, regex, currency, { change: 0, changePct: 0, volume: 0 }, source);
  } catch {
    return null;
  }
}

function extractLabeledPrice(page: string, labels: string[], minPrice?: number, maxPrice?: number): number | null {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escaped}[\\s\\S]{0,180}?([0-9][0-9,]*(?:\\.[0-9]+)?)`, 'ig');
    const matches = Array.from(page.matchAll(regex));
    if (matches.length === 0) continue;

    for (const match of matches) {
      const price = normalizeNumber(match[1] || '');
      if (!Number.isFinite(price) || price <= 0) continue;
      if (typeof minPrice === 'number' && price < minPrice) continue;
      if (typeof maxPrice === 'number' && price > maxPrice) continue;
      return price;
    }
  }
  return null;
}

interface OfficialLabelTarget {
  symbol: string;
  labels: string[];
  currency: string;
  minPrice?: number;
  maxPrice?: number;
}

async function fetchOfficialPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': randomUA(), Accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(9000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchLabeledOfficialQuotes(
  urls: string[],
  targets: OfficialLabelTarget[],
  source = 'official_page'
): Promise<Record<string, QuoteData>> {
  const result: Record<string, QuoteData> = {};
  const pending = new Set(targets.map((target) => target.symbol));
  if (pending.size === 0) return result;

  for (const url of urls) {
    if (pending.size === 0) break;
    const page = await fetchOfficialPage(url);
    if (!page) continue;

    for (const target of targets) {
      if (!pending.has(target.symbol)) continue;
      const price = extractLabeledPrice(page, target.labels, target.minPrice, target.maxPrice);
      if (!price) continue;

      result[target.symbol] = {
        price,
        change: 0,
        changePct: 0,
        volume: 0,
        currency: target.currency,
        source,
      };
      pending.delete(target.symbol);
    }
  }

  return result;
}

async function fetchJapanOfficialQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  const requested = new Set(symbols.map((s) => s.toUpperCase()));
  const targets: OfficialLabelTarget[] = [];

  if (requested.has('^N225')) {
    targets.push({
      symbol: '^N225',
      labels: ['Nikkei 225', 'NIKKEI 225', 'Nikkei225'],
      currency: 'JPY',
      minPrice: 5000,
      maxPrice: 100000,
    });
  }

  if (requested.has('^TOPX')) {
    targets.push({
      symbol: '^TOPX',
      labels: ['TOPIX'],
      currency: 'JPY',
      minPrice: 200,
      maxPrice: 10000,
    });
  }

  if (targets.length === 0) return {};

  return fetchLabeledOfficialQuotes(
    [JPX_INDICES_URL, JPX_HOME_URL],
    targets,
    'official_jpx'
  );
}

async function fetchHsiOfficialQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  const requested = new Set(symbols.map((s) => s.toUpperCase()));
  const targets: OfficialLabelTarget[] = [];

  if (requested.has('^HSI')) {
    targets.push({
      symbol: '^HSI',
      labels: ['Hang Seng Index', 'HSI'],
      currency: 'HKD',
      minPrice: 3000,
      maxPrice: 50000,
    });
  }

  if (requested.has('^HSCE')) {
    targets.push({
      symbol: '^HSCE',
      labels: ['Hang Seng China Enterprises Index', 'HSCEI'],
      currency: 'HKD',
      minPrice: 1000,
      maxPrice: 30000,
    });
  }

  if (targets.length === 0) return {};

  return fetchLabeledOfficialQuotes(
    [HSI_HOME_URL, 'https://www.hsi.com.hk/eng/indexes/all-indexes/hsi', 'https://www.hsi.com.hk/eng/indexes/all-indexes/hscei'],
    targets,
    'official_hsi'
  );
}

async function fetchKrxOfficialQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  const requested = new Set(symbols.map((s) => s.toUpperCase()));
  const targets: OfficialLabelTarget[] = [];

  if (requested.has('^KS11')) {
    targets.push({
      symbol: '^KS11',
      labels: ['KOSPI'],
      currency: 'KRW',
      minPrice: 500,
      maxPrice: 10000,
    });
  }

  if (requested.has('^KS200')) {
    targets.push({
      symbol: '^KS200',
      labels: ['KOSPI 200', 'KOSPI200'],
      currency: 'KRW',
      minPrice: 100,
      maxPrice: 2000,
    });
  }

  if (requested.has('^KQ11')) {
    targets.push({
      symbol: '^KQ11',
      labels: ['KOSDAQ'],
      currency: 'KRW',
      minPrice: 100,
      maxPrice: 5000,
    });
  }

  if (targets.length === 0) return {};

  return fetchLabeledOfficialQuotes(
    [
      KRX_GLOBAL_HOME_URL,
      'https://global.krx.co.kr/contents/GLB/06/0601/0601010100/GLB0601010100.jsp',
      'https://global.krx.co.kr/contents/GLB/06/0601/0601030000/GLB0601030000.jsp',
    ],
    targets,
    'official_krx'
  );
}

async function fetchEuropeOfficialQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  const requested = new Set(symbols.map((s) => s.toUpperCase()));
  const targets: OfficialLabelTarget[] = [];

  if (requested.has('^FTSE')) {
    targets.push({
      symbol: '^FTSE',
      labels: ['FTSE 100', 'FTSE100'],
      currency: 'GBP',
      minPrice: 3000,
      maxPrice: 15000,
    });
  }

  if (requested.has('^FTMC')) {
    targets.push({
      symbol: '^FTMC',
      labels: ['FTSE 250', 'FTSE250'],
      currency: 'GBP',
      minPrice: 5000,
      maxPrice: 30000,
    });
  }

  if (requested.has('^GDAXI')) {
    targets.push({
      symbol: '^GDAXI',
      labels: ['DAX 40', 'DAX'],
      currency: 'EUR',
      minPrice: 5000,
      maxPrice: 40000,
    });
  }

  if (requested.has('^FCHI')) {
    targets.push({
      symbol: '^FCHI',
      labels: ['CAC 40', 'CAC40'],
      currency: 'EUR',
      minPrice: 2000,
      maxPrice: 20000,
    });
  }

  if (requested.has('^STOXX50E')) {
    targets.push({
      symbol: '^STOXX50E',
      labels: ['EURO STOXX 50', 'STOXX Europe 50', 'STOXX 50'],
      currency: 'EUR',
      minPrice: 1000,
      maxPrice: 10000,
    });
  }

  if (requested.has('^AEX')) {
    targets.push({
      symbol: '^AEX',
      labels: ['AEX Index', 'AEX'],
      currency: 'EUR',
      minPrice: 200,
      maxPrice: 3000,
    });
  }

  if (requested.has('^SSMI')) {
    targets.push({
      symbol: '^SSMI',
      labels: ['Swiss Market Index', 'SMI Index', 'SMI'],
      currency: 'CHF',
      minPrice: 3000,
      maxPrice: 30000,
    });
  }

  if (requested.has('^IBEX')) {
    targets.push({
      symbol: '^IBEX',
      labels: ['IBEX 35', 'IBEX35'],
      currency: 'EUR',
      minPrice: 3000,
      maxPrice: 25000,
    });
  }

  if (requested.has('^OMXS30')) {
    targets.push({
      symbol: '^OMXS30',
      labels: ['OMX Stockholm 30', 'OMXS30'],
      currency: 'SEK',
      minPrice: 500,
      maxPrice: 5000,
    });
  }

  if (requested.has('^OMXC25')) {
    targets.push({
      symbol: '^OMXC25',
      labels: ['OMX Copenhagen 25', 'OMXC25'],
      currency: 'DKK',
      minPrice: 500,
      maxPrice: 5000,
    });
  }

  if (requested.has('^OMXH25')) {
    targets.push({
      symbol: '^OMXH25',
      labels: ['OMX Helsinki 25', 'OMXH25'],
      currency: 'EUR',
      minPrice: 1000,
      maxPrice: 10000,
    });
  }

  if (requested.has('^ATX')) {
    targets.push({
      symbol: '^ATX',
      labels: ['Austrian Traded Index', 'ATX Index'],
      currency: 'EUR',
      minPrice: 1000,
      maxPrice: 20000,
    });
  }

  if (requested.has('^BFX')) {
    targets.push({
      symbol: '^BFX',
      labels: ['BEL 20', 'BEL20'],
      currency: 'EUR',
      minPrice: 1000,
      maxPrice: 10000,
    });
  }

  if (requested.has('^WIG20')) {
    targets.push({
      symbol: '^WIG20',
      labels: ['WIG20', 'WIG 20'],
      currency: 'PLN',
      minPrice: 500,
      maxPrice: 10000,
    });
  }

  if (targets.length === 0) return {};

  return fetchLabeledOfficialQuotes(
    [
      LSE_FTSE100_URL,
      LSE_FTSE250_URL,
      DEUTSCHE_BOERSE_HOME_URL,
      EURONEXT_PARIS_INDICES_URL,
      STOXX_HOME_URL,
      EURONEXT_AMSTERDAM_INDICES_URL,
      SIX_MARKET_DATA_URL,
      BME_IBEX_URL,
      NASDAQ_NORDIC_INDICES_URL,
    ],
    targets,
    'official_europe'
  );
}

async function fetchUsOfficialQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  const requested = new Set(symbols.map((s) => s.toUpperCase()));
  const targets: OfficialLabelTarget[] = [];

  if (requested.has('^VIX')) {
    targets.push({
      symbol: '^VIX',
      labels: ['Cboe Volatility Index', 'VIX Index', 'VIX'],
      currency: 'USD',
      minPrice: 5,
      maxPrice: 200,
    });
  }

  if (targets.length === 0) return {};

  return fetchLabeledOfficialQuotes([CBOE_VIX_URL], targets, 'official_cboe');
}

async function fetchStooqQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  const codeToSymbols = new Map<string, string[]>();
  const currencyByCode = new Map<string, string>();

  for (const symbol of symbols) {
    const mapped = STOOQ_SYMBOL_MAP[symbol.toUpperCase()];
    if (!mapped) continue;
    const code = mapped.code.toLowerCase();
    const existing = codeToSymbols.get(code) || [];
    existing.push(symbol);
    codeToSymbols.set(code, existing);
    currencyByCode.set(code, mapped.currency);
  }

  if (codeToSymbols.size === 0) return {};

  const codes = Array.from(codeToSymbols.keys());

  try {
    const res = await fetch(
      `${STOOQ_QUOTES_URL}?s=${encodeURIComponent(codes.join(','))}&f=sd2t2ohlcv&h&e=csv`,
      {
        headers: { 'User-Agent': randomUA() },
        signal: AbortSignal.timeout(9000),
        cache: 'no-store',
      }
    );
    if (!res.ok) return {};

    const csv = await res.text();
    const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length <= 1) return {};

    const result: Record<string, QuoteData> = {};

    for (const line of lines.slice(1)) {
      const cols = line.split(',');
      if (cols.length < 7) continue;

      const code = String(cols[0] || '').trim().toLowerCase();
      if (!code || !codeToSymbols.has(code)) continue;

      const open = normalizeNumber(String(cols[3] || ''));
      const close = normalizeNumber(String(cols[6] || ''));
      if (!Number.isFinite(close) || close <= 0) continue;

      const volume = normalizeNumber(String(cols[7] || '0'));
      const change = Number.isFinite(open) && open > 0 ? close - open : 0;
      const changePct = Number.isFinite(open) && open > 0 ? ((close - open) / open) * 100 : 0;
      const currency = currencyByCode.get(code);

      for (const symbol of codeToSymbols.get(code) || []) {
        result[symbol] = {
          price: close,
          change: Number.isFinite(change) ? Number(change.toFixed(4)) : 0,
          changePct: Number.isFinite(changePct) ? Number(changePct.toFixed(2)) : 0,
          volume: Number.isFinite(volume) ? volume : 0,
          currency,
          source: 'stooq',
        };
      }
    }

    return result;
  } catch {
    return {};
  }
}

function extractNseQuoteFromRows(rows: Array<Record<string, unknown>>, candidates: string[]): QuoteData | null {
  const normalizedCandidates = candidates.map((c) => c.toUpperCase());

  for (const row of rows) {
    const indexName = String(row.index ?? row.name ?? '').toUpperCase();
    if (!indexName) continue;
    const isMatch = normalizedCandidates.some((candidate) => indexName === candidate || indexName.includes(candidate));
    if (!isMatch) continue;

    const price = normalizeNumber(String(row.last ?? row.lastPrice ?? ''));
    if (!Number.isFinite(price) || price <= 0) continue;
    const change = normalizeNumber(String(row.variation ?? row.change ?? '0'));
    const changePct = normalizeNumber(String(row.percentChange ?? row.pChange ?? row.perChange ?? '0'));

    return {
      price,
      change: Number.isFinite(change) ? change : 0,
      changePct: Number.isFinite(changePct) ? changePct : 0,
      volume: 0,
      currency: 'INR',
      source: 'official_nse',
    };
  }

  return null;
}

async function fetchNseAllIndicesPayload(withCookie?: string): Promise<Array<Record<string, unknown>> | null> {
  const headers: Record<string, string> = {
    'User-Agent': randomUA(),
    Accept: 'application/json,text/plain,*/*',
    Referer: 'https://www.nseindia.com/market-data/live-equity-market',
    'Accept-Language': 'en-US,en;q=0.9',
  };
  if (withCookie) headers.Cookie = withCookie;

  try {
    const res = await fetch(NSE_ALL_INDICES_API, {
      headers,
      signal: AbortSignal.timeout(9000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : [];
    return rows;
  } catch {
    return null;
  }
}

async function fetchNseOfficialQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  const requested = new Set(symbols.map((s) => s.toUpperCase()));
  const targetMap: Record<string, string[]> = {};

  if (requested.has('^NSEI')) targetMap['^NSEI'] = ['NIFTY 50'];
  if (requested.has('^NSEBANK')) targetMap['^NSEBANK'] = ['NIFTY BANK'];

  if (Object.keys(targetMap).length === 0) return {};

  let rows = await fetchNseAllIndicesPayload();

  // NSE may require a cookie bootstrap from home page.
  if (!rows || rows.length === 0) {
    try {
      const home = await fetch(NSE_HOME_URL, {
        headers: { 'User-Agent': randomUA(), Accept: 'text/html' },
        signal: AbortSignal.timeout(9000),
        cache: 'no-store',
      });
      const setCookieHeader = home.headers.get('set-cookie') || '';
      const cookie = extractCookieHeaderFromSetCookie(setCookieHeader);
      rows = await fetchNseAllIndicesPayload(cookie || undefined);
    } catch {
      rows = null;
    }
  }

  if (!rows || rows.length === 0) return {};

  const result: Record<string, QuoteData> = {};
  for (const [symbol, candidates] of Object.entries(targetMap)) {
    const quote = extractNseQuoteFromRows(rows, candidates);
    if (quote) result[symbol] = quote;
  }

  return result;
}

async function fetchBseOfficialQuote(): Promise<QuoteData | null> {
  // BSE home page usually exposes SENSEX live value in HTML/embedded scripts.
  return fetchSimpleOfficialPrice(
    BSE_HOME_URL,
    /SENSEX[\s\S]{0,120}?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    'INR',
    'official_bse'
  );
}

async function fetchOfficialExchangeQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  const result: Record<string, QuoteData> = {};
  const requested = new Set(symbols.map((s) => s.toUpperCase()));
  const tasks: Array<Promise<void>> = [];

  if (requested.has('^DFMGI')) {
    tasks.push((async () => {
      const q = await fetchDfmOfficialQuote();
      if (q) result['^DFMGI'] = q;
    })());
  }

  if (requested.has('^QSI') || requested.has('^QSII')) {
    tasks.push((async () => {
      const q = await fetchQseOfficialQuote();
      if (q) {
        result['^QSI'] = q;
        result['^QSII'] = q;
      }
    })());
  }

  if (requested.has('^KWSE')) {
    tasks.push((async () => {
      const q = await fetchSimpleOfficialPrice(
        BOURSA_KUWAIT_HOME_URL,
        /Kuwait(?:\s+All\s+Share)?\s+Index[\s\S]{0,80}?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
        'KWD',
        'official_boursa_kuwait'
      );
      if (q) result['^KWSE'] = q;
    })());
  }

  if (requested.has('^BSEX') || requested.has('^BAX')) {
    tasks.push((async () => {
      const q = await fetchSimpleOfficialPrice(
        BAHRAIN_BOURSE_HOME_URL,
        /Bahrain\s+All\s+Share\s+Index[\s\S]{0,80}?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
        'BHD',
        'official_bahrain'
      );
      if (q) {
        result['^BSEX'] = q;
        result['^BAX'] = q;
      }
    })());
  }

  if (requested.has('^MSI30') || requested.has('^MSM')) {
    tasks.push((async () => {
      const q = await fetchSimpleOfficialPrice(
        MSX_HOME_URL,
        /MSX\s*30[\s\S]{0,120}?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
        'OMR',
        'official_msx'
      );
      if (q) {
        result['^MSI30'] = q;
        result['^MSM'] = q;
      }
    })());
  }

  if (requested.has('^NSEI') || requested.has('^NSEBANK')) {
    tasks.push((async () => {
      const nseQuotes = await fetchNseOfficialQuotes(Array.from(requested));
      for (const [sym, quote] of Object.entries(nseQuotes)) {
        result[sym] = quote;
      }
    })());
  }

  if (requested.has('^BSESN')) {
    tasks.push((async () => {
      const q = await fetchBseOfficialQuote();
      if (q) result['^BSESN'] = q;
    })());
  }

  if (requested.has('^N225') || requested.has('^TOPX')) {
    tasks.push((async () => {
      const jpxQuotes = await fetchJapanOfficialQuotes(Array.from(requested));
      for (const [sym, quote] of Object.entries(jpxQuotes)) {
        result[sym] = quote;
      }
    })());
  }

  if (requested.has('^HSI') || requested.has('^HSCE')) {
    tasks.push((async () => {
      const hsiQuotes = await fetchHsiOfficialQuotes(Array.from(requested));
      for (const [sym, quote] of Object.entries(hsiQuotes)) {
        result[sym] = quote;
      }
    })());
  }

  if (requested.has('^KS11') || requested.has('^KS200') || requested.has('^KQ11')) {
    tasks.push((async () => {
      const krxQuotes = await fetchKrxOfficialQuotes(Array.from(requested));
      for (const [sym, quote] of Object.entries(krxQuotes)) {
        result[sym] = quote;
      }
    })());
  }

  if (
    requested.has('^FTSE') ||
    requested.has('^FTMC') ||
    requested.has('^GDAXI') ||
    requested.has('^FCHI') ||
    requested.has('^STOXX50E') ||
    requested.has('^AEX') ||
    requested.has('^SSMI') ||
    requested.has('^IBEX') ||
    requested.has('^OMXS30') ||
    requested.has('^OMXC25') ||
    requested.has('^OMXH25') ||
    requested.has('^ATX') ||
    requested.has('^BFX') ||
    requested.has('^WIG20')
  ) {
    tasks.push((async () => {
      const euQuotes = await fetchEuropeOfficialQuotes(Array.from(requested));
      for (const [sym, quote] of Object.entries(euQuotes)) {
        result[sym] = quote;
      }
    })());
  }

  if (requested.has('^VIX')) {
    tasks.push((async () => {
      const usQuotes = await fetchUsOfficialQuotes(Array.from(requested));
      for (const [sym, quote] of Object.entries(usQuotes)) {
        result[sym] = quote;
      }
    })());
  }

  await Promise.all(tasks);
  return result;
}

// Fetch single quote via v8/chart (more reliable than v7)
async function fetchChartQuote(sym: string): Promise<QuoteData | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=2d`,
      {
        headers: { 'User-Agent': randomUA() },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    const price = meta.regularMarketPrice;
    const prev = meta.previousClose || meta.chartPreviousClose || price;
    return {
      price,
      change: +(price - prev).toFixed(4),
      changePct: prev > 0 ? +((price - prev) / prev * 100).toFixed(2) : 0,
      volume: Number(meta.regularMarketVolume || 0),
      currency: meta.currency || undefined,
      source: 'yahoo_chart',
    };
  } catch {
    return null;
  }
}

// Batch fetch via v7 (can be blocked)
async function fetchV7Chunk(symbols: string[]): Promise<Record<string, QuoteData>> {
  const result: Record<string, QuoteData> = {};
  const syms = symbols.join(',');
  const fields = [
    'regularMarketPrice',
    'regularMarketChange',
    'regularMarketChangePercent',
    'regularMarketPreviousClose',
    'regularMarketVolume',
    'preMarketPrice',
    'preMarketChange',
    'preMarketChangePercent',
    'postMarketPrice',
    'postMarketChange',
    'postMarketChangePercent',
    'marketState',
    'currency',
    'financialCurrency',
  ].join(',');

  const urls = [
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(syms)}&fields=${encodeURIComponent(fields)}`,
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(syms)}&fields=${encodeURIComponent(fields)}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': randomUA() },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const quotes = data?.quoteResponse?.result || [];
      for (const q of quotes) {
        if (!q.symbol) continue;
        const marketState = String(q.marketState || '').toUpperCase();
        const prePrice = Number(q.preMarketPrice || 0);
        const postPrice = Number(q.postMarketPrice || 0);
        const regularPrice = Number(q.regularMarketPrice || 0);
        const usePre = marketState.includes('PRE') && Number.isFinite(prePrice) && prePrice > 0;
        const usePost = marketState.includes('POST') && Number.isFinite(postPrice) && postPrice > 0;
        const price = usePre ? prePrice : usePost ? postPrice : regularPrice;
        if (!price || price <= 0) continue;
        const change = usePre ? q.preMarketChange : usePost ? q.postMarketChange : q.regularMarketChange;
        const changePct = usePre ? q.preMarketChangePercent : usePost ? q.postMarketChangePercent : q.regularMarketChangePercent;
        result[q.symbol] = {
          price,
          change: change ?? 0,
          changePct: changePct ?? 0,
          volume: Number(q.regularMarketVolume || 0),
          currency: q.currency || q.financialCurrency || undefined,
          source: usePre || usePost ? 'yahoo_v7_extended' : 'yahoo_v7',
        };
      }
      if (Object.keys(result).length > 0) return result;
    } catch { /* try next */ }
  }
  return result;
}

// Split large quote requests into chunks to reduce dropped symbols.
async function fetchV7Batch(symbols: string[]): Promise<Record<string, QuoteData>> {
  const result: Record<string, QuoteData> = {};
  for (let i = 0; i < symbols.length; i += V7_CHUNK_SIZE) {
    const chunk = symbols.slice(i, i + V7_CHUNK_SIZE);
    const partial = await fetchV7Chunk(chunk);
    Object.assign(result, partial);
  }
  return result;
}

function resolveAliases(symbol: string): string[] {
  const raw = symbol.trim();
  if (!raw) return [];
  const aliases = SYMBOL_ALIASES[raw] || [];
  return Array.from(new Set([raw, ...aliases]));
}

function providerSymbolCandidates(symbol: string): string[] {
  const candidates = new Set<string>([symbol]);
  if (symbol.startsWith('^')) candidates.add(symbol.slice(1));
  if (symbol.endsWith('.CA')) candidates.add(symbol.replace(/\.CA$/i, ''));
  return Array.from(candidates).filter(Boolean);
}

async function fetchAlphaVantageQuote(symbol: string): Promise<QuoteData | null> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(8000), cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const q = data?.['Global Quote'];
    if (!q?.['05. price']) return null;
    const price = Number(q['05. price']);
    if (!Number.isFinite(price) || price <= 0) return null;
    const change = Number(q['09. change'] ?? 0);
    const changePct = Number(String(q['10. change percent'] ?? '0').replace('%', ''));
    return {
      price,
      change: Number.isFinite(change) ? change : 0,
      changePct: Number.isFinite(changePct) ? changePct : 0,
      volume: 0,
      source: 'provider_alpha_vantage',
    };
  } catch {
    return null;
  }
}

async function fetchFmpQuote(symbol: string): Promise<QuoteData | null> {
  const key = process.env.FMP_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(8000), cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const q = Array.isArray(data) ? data[0] : null;
    const price = Number(q?.price ?? 0);
    if (!Number.isFinite(price) || price <= 0) return null;
    return {
      price,
      change: Number(q?.change ?? 0),
      changePct: Number(q?.changesPercentage ?? 0),
      volume: Number(q?.volume ?? 0),
      currency: q?.currency || q?.financialCurrency || undefined,
      source: 'provider_fmp',
    };
  } catch {
    return null;
  }
}

async function fetchTwelveDataQuote(symbol: string): Promise<QuoteData | null> {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(8000), cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = Number(data?.close ?? data?.price ?? 0);
    if (!Number.isFinite(price) || price <= 0) return null;
    return {
      price,
      change: Number(data?.change ?? 0),
      changePct: Number(data?.percent_change ?? 0),
      volume: Number(data?.volume ?? 0),
      currency: data?.currency || undefined,
      source: 'provider_twelve_data',
    };
  } catch {
    return null;
  }
}

async function fetchProviderFallback(symbol: string): Promise<QuoteData | null> {
  const candidates = providerSymbolCandidates(symbol);
  for (const candidate of candidates) {
    const providers = [fetchFmpQuote, fetchTwelveDataQuote, fetchAlphaVantageQuote];
    for (const provider of providers) {
      const q = await provider(candidate);
      if (q) return q;
    }
  }
  return null;
}

async function fetchAllQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  const now = Date.now();
  const requestedMap = new Map<string, string[]>();
  const lookupSymbols = new Set<string>();

  for (const symbol of symbols) {
    const candidates = resolveAliases(symbol);
    requestedMap.set(symbol, candidates);
    for (const cand of candidates) lookupSymbols.add(cand);
  }

  // Try v7 batch first (fastest for most symbols)
  const rawQuotes = await fetchV7Batch(Array.from(lookupSymbols));
  const result: Record<string, QuoteData> = {};

  // Map back quotes to requested symbols (including aliases)
  for (const [requested, candidates] of requestedMap.entries()) {
    for (const cand of candidates) {
      const q = rawQuotes[cand];
      if (q) {
        result[requested] = q;
        break;
      }
    }
  }

  // Fallback to v8/chart for missing symbols unless source is temporarily degraded.
  const chartCandidates = symbols
    .filter((s) => !result[s] && !shouldSkipSource(s, 'chart', now))
    .slice(0, MAX_CHART_FALLBACK);
  if (chartCandidates.length > 0) {
    for (let i = 0; i < chartCandidates.length; i += 8) {
      const batch = chartCandidates.slice(i, i + 8);
      const promises = batch.map(async (sym) => {
        const candidates = requestedMap.get(sym) || [sym];
        for (const candidate of candidates) {
          const quote = await fetchChartQuote(candidate);
          if (quote) {
            result[sym] = quote;
            break;
          }
        }
      });
      await Promise.all(promises);
    }

    for (const sym of chartCandidates) {
      if (result[sym]?.source === 'yahoo_chart') {
        recordSourceSuccess(sym, 'chart', now);
      } else {
        recordSourceFailure(sym, 'chart', now);
      }
    }
  }

  // Official Saudi Exchange fallback for Saudi index symbols.
  const saudiOfficialCandidates = symbols.filter(
    (s) =>
      !result[s] &&
      Boolean(SAUDI_EXCHANGE_KEYS[s.toUpperCase()]) &&
      !shouldSkipSource(s, 'official', now)
  );
  if (saudiOfficialCandidates.length > 0) {
    const exchangeQuotes = await fetchSaudiExchangeQuotes(saudiOfficialCandidates);
    for (const [sym, quote] of Object.entries(exchangeQuotes)) {
      result[sym] = quote;
    }

    for (const sym of saudiOfficialCandidates) {
      if ((result[sym]?.source || '').startsWith('official_')) {
        recordSourceSuccess(sym, 'official', now);
      } else {
        recordSourceFailure(sym, 'official', now);
      }
    }
  }

  // Fallback to official exchange/index pages when Yahoo is unavailable.
  const officialCandidates = symbols.filter(
    (s) =>
      !result[s] &&
      OFFICIAL_EXCHANGE_SUPPORTED.has(s.toUpperCase()) &&
      !shouldSkipSource(s, 'official', now)
  );
  if (officialCandidates.length > 0) {
    const officialQuotes = await fetchOfficialExchangeQuotes(officialCandidates);
    for (const [sym, quote] of Object.entries(officialQuotes)) {
      result[sym] = quote;
    }

    for (const sym of officialCandidates) {
      if ((result[sym]?.source || '').startsWith('official_')) {
        recordSourceSuccess(sym, 'official', now);
      } else {
        recordSourceFailure(sym, 'official', now);
      }
    }
  }

  // Public multi-market fallback for broad index coverage.
  const stooqCandidates = symbols.filter(
    (s) =>
      !result[s] &&
      Boolean(STOOQ_SYMBOL_MAP[s.toUpperCase()]) &&
      !shouldSkipSource(s, 'stooq', now)
  );
  if (stooqCandidates.length > 0) {
    const stooqQuotes = await fetchStooqQuotes(stooqCandidates);
    for (const [sym, quote] of Object.entries(stooqQuotes)) {
      result[sym] = quote;
    }

    for (const sym of stooqCandidates) {
      if (result[sym]?.source === 'stooq') {
        recordSourceSuccess(sym, 'stooq', now);
      } else {
        recordSourceFailure(sym, 'stooq', now);
      }
    }
  }

  // Final fallback to other configured providers (if API keys exist).
  const unresolved = symbols
    .filter((s) => !result[s] && !shouldSkipSource(s, 'provider', now))
    .slice(0, MAX_PROVIDER_FALLBACK);
  if (unresolved.length > 0) {
    for (let i = 0; i < unresolved.length; i += 5) {
      const batch = unresolved.slice(i, i + 5);
      const promises = batch.map(async (sym) => {
        const q = await fetchProviderFallback(sym);
        if (q) {
          result[sym] = q;
          recordSourceSuccess(sym, 'provider', now);
        } else {
          recordSourceFailure(sym, 'provider', now);
        }
      });
      await Promise.all(promises);
    }
  }

  return result;
}

function normalizeSymbols(raw: string | null): string[] {
  if (!raw) return TICKER_SYMBOLS;
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(parsed)).slice(0, MAX_SYMBOLS);
}

function cacheKey(symbols: string[]): string {
  if (symbols.length === 0) return '__default__';
  return symbols.slice().sort().join('|');
}

function hasUsableStaleCache(entry: { data: Record<string, QuoteData>; ts: number } | undefined, now: number): entry is { data: Record<string, QuoteData>; ts: number } {
  if (!entry) return false;
  if (!entry.ts || now - entry.ts > STALE_MAX_AGE) return false;
  return Object.keys(entry.data).length > 0;
}

export async function GET(request: Request) {
  const now = Date.now();
  const { searchParams } = new URL(request.url);
  const symbols = normalizeSymbols(searchParams.get('symbols'));
  const key = cacheKey(symbols);
  const existingCache = cacheByKey[key];

  // Return cache if fresh
  if (existingCache?.ts && now - existingCache.ts < CACHE_TTL && Object.keys(existingCache.data).length > 0) {
    return NextResponse.json({ success: true, cached: true, data: existingCache.data, count: Object.keys(existingCache.data).length });
  }

  try {
    const data = await fetchAllQuotes(symbols);
    if (Object.keys(data).length > 0) {
      cacheByKey[key] = { data, ts: now };
      return NextResponse.json({ success: true, cached: false, data, count: Object.keys(data).length });
    }
    // Return stale cache if available
    if (hasUsableStaleCache(existingCache, now)) {
      return NextResponse.json({ success: true, cached: true, stale: true, data: existingCache.data, count: Object.keys(existingCache.data).length });
    }
    return NextResponse.json({ success: false, data: {}, count: 0 });
  } catch {
    if (hasUsableStaleCache(existingCache, now)) {
      return NextResponse.json({ success: true, cached: true, data: existingCache.data, count: Object.keys(existingCache.data).length });
    }
    return NextResponse.json({ success: false, data: {}, count: 0 }, { status: 500 });
  }
}
