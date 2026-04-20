import { promises as fs } from 'fs';
import path from 'path';
import { SHARIA_MARKETS_DB, type ShariaMarketData } from '@/data/sharia-markets-database';
import bundledFunds from '@/data/funds_merged.json';
import { LOCAL_SYMBOL_DB } from '@/data/symbols-database';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/security/encryption';

type RefreshMode = 'auto' | 'manual' | 'bootstrap';
type StockMetricsMarketKey =
  | 'saudi'
  | 'uae'
  | 'qatar'
  | 'kuwait'
  | 'bahrain'
  | 'oman'
  | 'egypt'
  | 'jordan'
  | 'american'
  | 'american_etf';

interface StockMetricsRow {
  symbol?: string;
  debt_capital?: number | string;
  purification?: number | string;
  debt?: number | string;
  total_debt?: number | string;
  equity?: number | string;
  eqt?: number | string;
  total_revenue?: number | string;
  interest_income?: number | string;
  debt_to_equity?: number | string;
  debtToEquity?: number | string;
  sector?: string;
}

interface StockMetricsFile {
  all_stocks?: StockMetricsRow[];
}

interface UsMetricsRow {
  symbol?: string;
  debtToEquity?: number | string;
  totalDebt?: number | string;
  stockholdersEquity?: number | string;
  totalRevenue?: number | string;
  interestIncome?: number | string;
  sector?: string;
}

interface UsMetricsFile {
  US?: UsMetricsRow[];
  US_ETF?: UsMetricsRow[];
}

interface EnrichmentMetrics {
  debtValue?: number;
  equityValue?: number;
  debtToEquity?: number;
  totalRevenue?: number;
  interestIncome?: number;
  interestIncomePct?: number;
  sector?: string;
  source?: string;
}

interface MetricsCacheFile {
  schemaVersion?: number;
  updatedAt: string;
  values: Record<string, EnrichmentMetrics>;
}

interface MarketDataApiKeys {
  fmp?: string;
  eodhd?: string;
  alphaVantage?: string;
  finnhub?: string;
}

export interface ShariaDatasetMeta {
  schemaVersion: number;
  lastUpdatedAt: string;
  nextAutoUpdateAt: string;
  refreshMode: RefreshMode;
  source: string;
  totalRows: number;
  marketCounts: Record<string, number>;
}

export interface ShariaDatasetPayload {
  shariaMarkets: ShariaMarketData;
  funds: any[];
  meta: ShariaDatasetMeta;
}

export interface ShariaDatasetSnapshot {
  payload: ShariaDatasetPayload;
  autoRefreshed: boolean;
}

const AUTO_REFRESH_MS = 15 * 24 * 60 * 60 * 1000;
const DATASET_SCHEMA_VERSION = 4;
const RUNTIME_DIR = path.join(process.cwd(), 'data', 'runtime');
const RUNTIME_FILE = path.join(RUNTIME_DIR, 'sharia-dataset.json');
const METRICS_CACHE_FILE = path.join(RUNTIME_DIR, 'sharia-metrics-cache.json');
const STOCKS_SOURCE_FILE = path.join(process.cwd(), 'src', 'data', 'stocks_database.json');
const FUNDS_SOURCE_FILE = path.join(process.cwd(), 'src', 'data', 'funds_merged.json');
const US_STOCKS_SOURCE_FILE = path.join(process.cwd(), 'src', 'data', 'us_stocks_database.json');
const STOCK_METRICS_DIR = path.join(process.cwd(), 'data', 'stocks');
const METRICS_MARKET_FILES: StockMetricsMarketKey[] = [
  'saudi',
  'uae',
  'qatar',
  'kuwait',
  'bahrain',
  'oman',
  'egypt',
  'jordan',
  'american',
  'american_etf',
];
const REMOTE_ENRICH_LIMIT: Record<RefreshMode, number> = {
  bootstrap: 0,
  auto: 60,
  manual: 220,
};
const REMOTE_ENRICH_CONCURRENCY = 4;

const MARKET_CODE_MAP: Record<string, keyof ShariaMarketData | undefined> = {
  TADAWUL: 'sa',
  ADX: 'ae',
  DFM: 'ae',
  QE: 'qa',
  KSE: 'kw',
  BHB: 'bh',
  MSM: 'om',
  EGX: 'eg',
  US: 'us',
  US_ETF: 'us',
};

const MARKET_CODE_TO_METRICS_KEYS: Record<string, StockMetricsMarketKey[] | undefined> = {
  TADAWUL: ['saudi'],
  ADX: ['uae'],
  DFM: ['uae'],
  QE: ['qatar'],
  KSE: ['kuwait'],
  BHB: ['bahrain'],
  MSM: ['oman'],
  EGX: ['egypt'],
  ASE: ['jordan'],
  JO: ['jordan'],
  US: ['american'],
  US_ETF: ['american_etf', 'american'],
  SA: ['saudi'],
  UAE: ['uae'],
  QA: ['qatar'],
  KW: ['kuwait'],
  BH: ['bahrain'],
  OM: ['oman'],
  EG: ['egypt'],
};

let cache: ShariaDatasetPayload | null = null;
let refreshInFlight: Promise<ShariaDatasetPayload> | null = null;
let localMetricsIndexCache: Map<string, EnrichmentMetrics> | null = null;
let bundledSectorIndexCache: Partial<Record<keyof ShariaMarketData, Map<string, string>>> | null = null;

function cloneBundledSharia(): ShariaMarketData {
  return JSON.parse(JSON.stringify(SHARIA_MARKETS_DB)) as ShariaMarketData;
}

function cloneBundledFunds(): any[] {
  return JSON.parse(JSON.stringify(bundledFunds)) as any[];
}

function toMark(value: unknown): string {
  const v = String(value ?? '').trim().toLowerCase();
  if (!v) return '🟡';
  if (v.includes('✅') || v.includes('compliant') || v.includes('نقية')) return '✅';
  if (v.includes('❌') || v.includes('non_compliant') || v.includes('محرم')) return '❌';
  return '🟡';
}

function toRecommendation(statusMark: string): string {
  if (statusMark === '✅') return '🟢 شراء';
  if (statusMark === '❌') return '🔴 تجنب';
  return '🟡 احتفظ';
}

function toPercent(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  const pct = n > 1 ? n : n * 100;
  return `${pct.toFixed(1)}%`;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const raw = String(value ?? '').replace(/[,_%]/g, '').trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function hasRawFinancials(metrics?: EnrichmentMetrics | null): boolean {
  if (!metrics) return false;
  return (
    metrics.debtValue != null &&
    metrics.equityValue != null &&
    metrics.totalRevenue != null &&
    metrics.interestIncome != null
  );
}

function normalizeProviderSymbol(symbol: string): string {
  return canonicalSymbol(symbol)
    .replace(/\//g, '-')
    .replace(/\s+/g, '');
}

function parseSettingSecret(value: unknown): string | null {
  if (value == null) return null;
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const variants = new Set<string>([trimmed]);
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    variants.add(trimmed.slice(1, -1).trim());
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'string' && parsed.trim()) {
      variants.add(parsed.trim());
    }
  } catch {
    // not JSON
  }

  for (const candidate of variants) {
    try {
      const decrypted = decrypt(candidate);
      if (decrypted && decrypted.trim().length >= 5) {
        return decrypted.trim();
      }
    } catch {
      // ignored
    }
  }

  for (const candidate of variants) {
    if (!candidate || candidate.length < 8) continue;
    if (/[{}\[\]\s]/.test(candidate)) continue;
    const looksEncryptedPayload = /^[A-Za-z0-9+/=]+(?::[A-Za-z0-9+/=]+){1,2}$/.test(candidate);
    if (looksEncryptedPayload) continue;
    return candidate;
  }
  return null;
}

async function loadMarketDataApiKeys(): Promise<MarketDataApiKeys> {
  const keys: MarketDataApiKeys = {
    fmp: process.env.FMP_API_KEY,
    eodhd: process.env.EODHD_API_KEY,
    alphaVantage: process.env.ALPHA_VANTAGE_API_KEY,
    finnhub: process.env.FINNHUB_API_KEY,
  };

  try {
    const settings = await db.setting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'api_key_' } },
          { key: { contains: ':api_key_' } },
        ],
      },
    });
    const decryptedByProvider: Record<string, string> = {};

    for (const setting of settings) {
      const key = String(setting.key ?? '').trim();
      if (!key) continue;
      const provider = key.includes(':api_key_')
        ? key.split(':api_key_').pop()
        : key.replace(/^api_key_/, '');
      if (!provider) continue;
      const secret = parseSettingSecret(setting.value);
      if (!secret) continue;
      decryptedByProvider[provider] = secret;
    }

    keys.fmp =
      decryptedByProvider.financial_modeling_prep ??
      decryptedByProvider.fmp ??
      keys.fmp;
    keys.eodhd =
      decryptedByProvider.eodhd ??
      keys.eodhd;
    keys.alphaVantage =
      decryptedByProvider.alpha_vantage ??
      decryptedByProvider.alphavantage ??
      keys.alphaVantage;
    keys.finnhub =
      decryptedByProvider.finnhub ??
      keys.finnhub;
  } catch {
    // keep env fallback only
  }

  return keys;
}

function firstArrayRow(payload: any): Record<string, any> | null {
  if (Array.isArray(payload) && payload.length > 0 && payload[0] && typeof payload[0] === 'object') {
    return payload[0] as Record<string, any>;
  }
  if (Array.isArray(payload?.data) && payload.data.length > 0 && payload.data[0] && typeof payload.data[0] === 'object') {
    return payload.data[0] as Record<string, any>;
  }
  if (Array.isArray(payload?.results) && payload.results.length > 0 && payload.results[0] && typeof payload.results[0] === 'object') {
    return payload.results[0] as Record<string, any>;
  }
  return null;
}

function numberFromCandidates(source: Record<string, any> | null | undefined, keys: string[]): number | null {
  if (!source) return null;
  for (const key of keys) {
    if (!(key in source)) continue;
    const parsed = parseNumber(source[key]);
    if (parsed != null && Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function latestReportRow(block: any): Record<string, any> | null {
  const candidates = [
    block?.quarterly,
    block?.yearly,
    block,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    if (Array.isArray(candidate)) {
      const row = candidate.find((entry) => entry && typeof entry === 'object');
      if (row) return row as Record<string, any>;
      continue;
    }
    const entries = Object.entries(candidate as Record<string, any>)
      .filter(([, value]) => value && typeof value === 'object');
    if (entries.length === 0) continue;
    entries.sort((a, b) => String(b[0]).localeCompare(String(a[0])));
    return entries[0][1] as Record<string, any>;
  }

  return null;
}

function buildProviderSymbolCandidates(symbol: string, marketCode: string): string[] {
  const base = normalizeProviderSymbol(symbol);
  const yahooCandidates = buildYahooSymbolCandidates(symbol, marketCode);
  const candidates = new Set<string>([base, ...yahooCandidates.map(normalizeProviderSymbol)]);
  for (const candidate of [...candidates]) {
    if (candidate.endsWith('.SR')) candidates.add(candidate.replace(/\.SR$/, ''));
    if (candidate.endsWith('.AD')) candidates.add(candidate.replace(/\.AD$/, ''));
    if (candidate.endsWith('.DU')) candidates.add(candidate.replace(/\.DU$/, ''));
    if (candidate.endsWith('.QA')) candidates.add(candidate.replace(/\.QA$/, ''));
    if (candidate.endsWith('.KW')) candidates.add(candidate.replace(/\.KW$/, ''));
    if (candidate.endsWith('.BH')) candidates.add(candidate.replace(/\.BH$/, ''));
    if (candidate.endsWith('.OM')) candidates.add(candidate.replace(/\.OM$/, ''));
    if (candidate.endsWith('.CA')) candidates.add(candidate.replace(/\.CA$/, ''));
    if (candidate.endsWith('.JO')) candidates.add(candidate.replace(/\.JO$/, ''));
    if (candidate.endsWith('.US')) candidates.add(candidate.replace(/\.US$/, ''));
  }
  return [...candidates].filter(Boolean);
}

function buildEodhdSymbolCandidates(symbol: string, marketCode: string): string[] {
  const normalized = normalizeMarketCode(marketCode);
  const base = canonicalSymbol(symbol);
  const candidates = new Set<string>();
  const withSuffix = (suffix: string) => {
    if (base) candidates.add(`${base}${suffix}`);
  };

  for (const candidate of buildProviderSymbolCandidates(symbol, marketCode)) {
    candidates.add(candidate);
  }

  if (normalized === 'US' || normalized === 'US_ETF') withSuffix('.US');
  if (normalized === 'TADAWUL' || normalized === 'SA') withSuffix('.SR');
  if (normalized === 'ADX') withSuffix('.AD');
  if (normalized === 'DFM') withSuffix('.DU');
  if (normalized === 'QE' || normalized === 'QA') withSuffix('.QA');
  if (normalized === 'KSE' || normalized === 'KW') withSuffix('.KW');
  if (normalized === 'BHB' || normalized === 'BH') withSuffix('.BH');
  if (normalized === 'MSM' || normalized === 'OM') withSuffix('.OM');
  if (normalized === 'EGX' || normalized === 'EG') withSuffix('.CA');
  if (normalized === 'ASE' || normalized === 'JO') withSuffix('.JO');

  return [...candidates].filter(Boolean);
}

async function safeFetchJson(url: string, timeoutMs = 9000): Promise<any | null> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function normalizeRatio(value: unknown): number | null {
  const n = parseNumber(value);
  if (n == null || n < 0) return null;
  if (n > 1) return n / 100;
  return n;
}

function debtToEquityFromDebtCapital(value: unknown): number | null {
  const debtCapitalRatio = normalizeRatio(value);
  if (debtCapitalRatio == null) return null;
  if (debtCapitalRatio <= 0) return 0;
  if (debtCapitalRatio >= 0.9999) return null;
  return debtCapitalRatio / (1 - debtCapitalRatio);
}

function debtToEquityFromDebtAndEquity(debt: unknown, equity: unknown): number | null {
  const debtValue = parseNumber(debt);
  const equityValue = parseNumber(equity);
  if (debtValue == null || equityValue == null) return null;
  if (equityValue === 0) return null;
  const ratio = debtValue / equityValue;
  return Number.isFinite(ratio) && ratio >= 0 ? ratio : null;
}

function interestIncomePctFromIncomeAndRevenue(interestIncome: unknown, totalRevenue: unknown): number | null {
  const interestValue = parseNumber(interestIncome);
  const revenueValue = parseNumber(totalRevenue);
  if (interestValue == null || revenueValue == null || revenueValue === 0) return null;
  const pct = (Math.abs(interestValue) / Math.abs(revenueValue)) * 100;
  return Number.isFinite(pct) && pct >= 0 ? pct : null;
}

function formatMoneyValue(value: unknown): string {
  const n = parseNumber(value);
  if (n == null) return '';
  return n.toFixed(2);
}

function formatDebtToEquity(value: unknown): string {
  const n = parseNumber(value);
  if (n == null || n < 0) return '';
  return n.toFixed(2);
}

function formatInterestIncomePercent(value: unknown): string {
  const n = parseNumber(value);
  if (n == null || n < 0) return '';
  return `${n.toFixed(2)}%`;
}

function formatLastUpdatedDate(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const parsed = new Date(raw);
  if (Number.isFinite(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const isoMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  return raw;
}

function isValidSectorName(value: unknown): boolean {
  const raw = String(value ?? '').trim();
  if (!raw) return false;
  if (/[✅❌🟡]/.test(raw)) return false;
  const normalized = raw.toLowerCase();
  if (
    normalized.includes('حلال') ||
    normalized.includes('محرم') ||
    normalized.includes('مختلط') ||
    normalized.includes('compliant') ||
    normalized.includes('non_compliant') ||
    normalized.includes('non-compliant') ||
    normalized.includes('pending')
  ) {
    return false;
  }
  return true;
}

function symbolDbKeyCandidates(symbol: string, marketCode: string): string[] {
  const aliases = buildSymbolAliases(symbol);
  if (aliases.length === 0) return [];
  const normalizedMarket = normalizeMarketCode(marketCode);
  const keys = new Set<string>(aliases);
  const appendSuffix = (suffix: string) => {
    for (const alias of aliases) {
      if (!alias.endsWith(suffix)) keys.add(`${alias}${suffix}`);
    }
  };
  if (normalizedMarket === 'TADAWUL' || normalizedMarket === 'SA') appendSuffix('.SR');
  if (normalizedMarket === 'ADX') appendSuffix('.AD');
  if (normalizedMarket === 'DFM') appendSuffix('.DU');
  if (normalizedMarket === 'QE' || normalizedMarket === 'QA') appendSuffix('.QA');
  if (normalizedMarket === 'KSE' || normalizedMarket === 'KW') appendSuffix('.KW');
  if (normalizedMarket === 'BHB' || normalizedMarket === 'BH') appendSuffix('.BH');
  if (normalizedMarket === 'MSM' || normalizedMarket === 'OM') appendSuffix('.OM');
  if (normalizedMarket === 'EGX' || normalizedMarket === 'EG') appendSuffix('.CA');
  if (normalizedMarket === 'ASE' || normalizedMarket === 'JO') appendSuffix('.JO');
  return [...keys];
}

function lookupSectorFromSymbolDb(symbol: string, marketCode: string): string {
  for (const key of symbolDbKeyCandidates(symbol, marketCode)) {
    const info = LOCAL_SYMBOL_DB[key];
    if (!info) continue;
    const sector = String((info as { s?: unknown }).s ?? '').trim();
    if (isValidSectorName(sector)) return sector;
  }
  return '';
}

function buildBundledSectorIndex(): Partial<Record<keyof ShariaMarketData, Map<string, string>>> {
  if (bundledSectorIndexCache) return bundledSectorIndexCache;
  const index: Partial<Record<keyof ShariaMarketData, Map<string, string>>> = {};
  for (const [marketKey, rows] of Object.entries(SHARIA_MARKETS_DB)) {
    if (!Array.isArray(rows)) continue;
    const map = new Map<string, string>();
    for (const row of rows) {
      const symbol = canonicalSymbol(row?.[0]);
      const sector = String(row?.[6] ?? '').trim();
      if (!symbol || !isValidSectorName(sector)) continue;
      map.set(symbol, sector);
    }
    index[marketKey as keyof ShariaMarketData] = map;
  }
  bundledSectorIndexCache = index;
  return index;
}

function marketKeyDefaultCode(marketKey: string): string {
  if (marketKey === 'sa') return 'TADAWUL';
  if (marketKey === 'ae') return 'ADX';
  if (marketKey === 'kw') return 'KSE';
  if (marketKey === 'qa') return 'QE';
  if (marketKey === 'bh') return 'BHB';
  if (marketKey === 'om') return 'MSM';
  if (marketKey === 'eg') return 'EGX';
  if (marketKey === 'jo') return 'ASE';
  if (marketKey === 'us') return 'US';
  return '';
}

function sanitizeShariaSectors(shariaMarkets: ShariaMarketData): boolean {
  const bundledIndex = buildBundledSectorIndex();
  let changed = false;
  for (const marketKey of ['sa', 'ae', 'kw', 'qa', 'bh', 'om', 'eg', 'jo', 'us'] as const) {
    const rows = shariaMarkets[marketKey];
    if (!Array.isArray(rows)) continue;
    const sectorMap = bundledIndex[marketKey] ?? new Map<string, string>();
    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 7) continue;
      const currentSector = String(row[6] ?? '').trim();
      if (isValidSectorName(currentSector)) continue;
      const symbol = canonicalSymbol(row[0]);
      const exchange = String(row[2] ?? marketKeyDefaultCode(marketKey)).trim() || marketKeyDefaultCode(marketKey);
      const fallbackSector = sectorMap.get(symbol) || lookupSectorFromSymbolDb(symbol, exchange);
      if (isValidSectorName(fallbackSector)) {
        row[6] = fallbackSector;
        changed = true;
      }
    }
  }
  return changed;
}

function canonicalSymbol(symbol: unknown): string {
  return String(symbol ?? '')
    .trim()
    .toUpperCase()
    .replace(/\.(SR|AD|DU|QA|BH|OM|KW|CA|JO)$/i, '');
}

function buildSymbolAliases(symbol: unknown): string[] {
  const base = canonicalSymbol(symbol);
  if (!base) return [];

  const aliases = new Set<string>([base]);
  aliases.add(base.replace(/\//g, '-'));
  aliases.add(base.replace(/\//g, '.'));
  aliases.add(base.replace(/\./g, '-'));
  aliases.add(base.replace(/-/g, '.'));
  aliases.add(base.replace(/\./g, '/'));

  const prefSlash = /^([A-Z0-9]+)\/P([A-Z0-9]+)$/i.exec(base);
  if (prefSlash) {
    aliases.add(`${prefSlash[1]}-PR${prefSlash[2]}`);
    aliases.add(`${prefSlash[1]}.PR${prefSlash[2]}`);
  }

  const prefDash = /^([A-Z0-9]+)-PR([A-Z0-9]+)$/i.exec(base);
  if (prefDash) {
    aliases.add(`${prefDash[1]}/P${prefDash[2]}`);
    aliases.add(`${prefDash[1]}.PR${prefDash[2]}`);
  }

  const prefDot = /^([A-Z0-9]+)\.PR([A-Z0-9]+)$/i.exec(base);
  if (prefDot) {
    aliases.add(`${prefDot[1]}/P${prefDot[2]}`);
    aliases.add(`${prefDot[1]}-PR${prefDot[2]}`);
  }

  return [...aliases].filter(Boolean);
}

function resolveMark(value: unknown, fallback?: string): string {
  const primary = String(value ?? '').trim();
  if (primary) return toMark(primary);
  const secondary = String(fallback ?? '').trim();
  if (secondary) return toMark(secondary);
  return '🟡';
}

function normalizeGrade(value: unknown): string {
  const grade = String(value ?? '').trim();
  if (grade) return grade;
  return 'C';
}

function normalizeMarketCode(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

function metricsCacheKey(marketCode: string, symbol: unknown): string {
  const normalizedMarket = normalizeMarketCode(marketCode) || 'GLOBAL';
  return `${normalizedMarket}:${canonicalSymbol(symbol)}`;
}

function mergeMetrics(primary?: EnrichmentMetrics | null, secondary?: EnrichmentMetrics | null): EnrichmentMetrics {
  const mergedDebt = primary?.debtValue ?? secondary?.debtValue;
  const mergedEquity = primary?.equityValue ?? secondary?.equityValue;
  const mergedRevenue = primary?.totalRevenue ?? secondary?.totalRevenue;
  const mergedInterest = primary?.interestIncome ?? secondary?.interestIncome;
  const ratioFromRaw = debtToEquityFromDebtAndEquity(mergedDebt, mergedEquity) ?? undefined;
  const interestPctFromRaw = interestIncomePctFromIncomeAndRevenue(mergedInterest, mergedRevenue) ?? undefined;

  return {
    debtValue: mergedDebt,
    equityValue: mergedEquity,
    debtToEquity: ratioFromRaw ?? primary?.debtToEquity ?? secondary?.debtToEquity,
    totalRevenue: mergedRevenue,
    interestIncome: mergedInterest,
    interestIncomePct: interestPctFromRaw ?? primary?.interestIncomePct ?? secondary?.interestIncomePct,
    sector: primary?.sector ?? secondary?.sector,
    source: primary?.source ?? secondary?.source,
  };
}

function metricsScore(metrics?: EnrichmentMetrics | null): number {
  if (!metrics) return 0;
  let score = 0;
  if (metrics.debtValue != null && Number.isFinite(metrics.debtValue)) score += 2;
  if (metrics.equityValue != null && Number.isFinite(metrics.equityValue)) score += 2;
  if (metrics.debtToEquity != null && Number.isFinite(metrics.debtToEquity)) score += 1;
  if (metrics.totalRevenue != null && Number.isFinite(metrics.totalRevenue)) score += 2;
  if (metrics.interestIncome != null && Number.isFinite(metrics.interestIncome)) score += 2;
  if (metrics.interestIncomePct != null && Number.isFinite(metrics.interestIncomePct)) score += 1;
  if (isValidSectorName(metrics.sector)) score += 1;
  return score;
}

function upsertMetrics(index: Map<string, EnrichmentMetrics>, key: string, candidate: EnrichmentMetrics) {
  const current = index.get(key);
  if (!current || metricsScore(candidate) > metricsScore(current)) {
    index.set(key, candidate);
    return;
  }
  index.set(key, mergeMetrics(current, candidate));
}

function marketMetricCandidates(marketCode: string): StockMetricsMarketKey[] {
  const normalized = normalizeMarketCode(marketCode);
  return MARKET_CODE_TO_METRICS_KEYS[normalized] ?? [];
}

function resolveLocalMetrics(
  index: Map<string, EnrichmentMetrics>,
  marketCode: string,
  symbol: unknown
): EnrichmentMetrics | null {
  const aliases = buildSymbolAliases(symbol);
  if (aliases.length === 0) return null;

  const candidates: EnrichmentMetrics[] = [];
  for (const marketKey of marketMetricCandidates(marketCode)) {
    for (const alias of aliases) {
      const localCandidate = index.get(`${marketKey}:${alias}`);
      if (localCandidate) candidates.push(localCandidate);
    }
  }

  const globalCandidates = aliases
    .map((alias) => index.get(`GLOBAL:${alias}`))
    .filter((v): v is EnrichmentMetrics => Boolean(v));

  let merged: EnrichmentMetrics | null = null;
  for (const candidate of [...candidates, ...globalCandidates]) {
    merged = mergeMetrics(merged, candidate);
  }
  return merged;
}

function resolveCachedMetrics(
  cacheValues: Record<string, EnrichmentMetrics>,
  marketCode: string,
  symbol: unknown
): EnrichmentMetrics | null {
  const normalizedMarket = normalizeMarketCode(marketCode);
  const aliases = buildSymbolAliases(symbol);
  if (aliases.length === 0) return null;

  let merged: EnrichmentMetrics | null = null;
  for (const alias of aliases) {
    merged = mergeMetrics(merged, cacheValues[metricsCacheKey(normalizedMarket, alias)]);
  }
  for (const alias of aliases) {
    merged = mergeMetrics(merged, cacheValues[metricsCacheKey('GLOBAL', alias)]);
  }
  return metricsScore(merged) > 0 ? merged : null;
}

function buildYahooSymbolCandidates(symbol: string, marketCode: string): string[] {
  const aliases = buildSymbolAliases(symbol);
  if (aliases.length === 0) return [];
  const normalizedMarket = normalizeMarketCode(marketCode);
  const candidates = new Set<string>(aliases);
  const appendSuffix = (suffix: string) => {
    for (const alias of aliases) {
      if (!alias.endsWith(suffix)) candidates.add(`${alias}${suffix}`);
    }
  };
  if (normalizedMarket === 'TADAWUL' || normalizedMarket === 'SA') appendSuffix('.SR');
  if (normalizedMarket === 'ADX') appendSuffix('.AD');
  if (normalizedMarket === 'DFM') appendSuffix('.DU');
  if (normalizedMarket === 'QE' || normalizedMarket === 'QA') appendSuffix('.QA');
  if (normalizedMarket === 'KSE' || normalizedMarket === 'KW') appendSuffix('.KW');
  if (normalizedMarket === 'BHB' || normalizedMarket === 'BH') appendSuffix('.BH');
  if (normalizedMarket === 'MSM' || normalizedMarket === 'OM') appendSuffix('.OM');
  if (normalizedMarket === 'EGX' || normalizedMarket === 'EG') appendSuffix('.CA');
  if (normalizedMarket === 'ASE' || normalizedMarket === 'JO') appendSuffix('.JO');
  return [...candidates];
}

function getRawNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value && typeof value === 'object' && 'raw' in value) {
    const rawValue = (value as { raw?: unknown }).raw;
    return typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : null;
  }
  return null;
}

function extractYahooMetrics(payload: any): EnrichmentMetrics | null {
  const result = payload?.quoteSummary?.result?.[0];
  if (!result) return null;

  const annualIncomeStatements = Array.isArray(result?.incomeStatementHistory?.incomeStatementHistory)
    ? result.incomeStatementHistory.incomeStatementHistory
    : [];
  const quarterlyIncomeStatements = Array.isArray(result?.incomeStatementHistoryQuarterly?.incomeStatementHistory)
    ? result.incomeStatementHistoryQuarterly.incomeStatementHistory
    : [];

  const annualBalanceStatements = Array.isArray(result?.balanceSheetHistory?.balanceSheetStatements)
    ? result.balanceSheetHistory.balanceSheetStatements
    : [];
  const quarterlyBalanceStatements = Array.isArray(result?.balanceSheetHistoryQuarterly?.balanceSheetStatements)
    ? result.balanceSheetHistoryQuarterly.balanceSheetStatements
    : [];

  let debtValue: number | undefined;
  let equityValue: number | undefined;
  for (const statement of [...quarterlyBalanceStatements, ...annualBalanceStatements]) {
    const debtCandidate =
      getRawNumber(statement?.totalDebt) ??
      getRawNumber(statement?.shortLongTermDebt) ??
      getRawNumber(statement?.longTermDebt);
    const equityCandidate =
      getRawNumber(statement?.totalStockholderEquity) ??
      getRawNumber(statement?.stockholdersEquity);
    if (debtCandidate != null) debtValue = debtCandidate;
    if (equityCandidate != null && equityCandidate !== 0) equityValue = equityCandidate;
    if (debtValue != null && equityValue != null) break;
  }

  if (debtValue == null) {
    debtValue = getRawNumber(result?.financialData?.totalDebt) ?? undefined;
  }

  let totalRevenue: number | undefined;
  let interestIncome: number | undefined;
  for (const statement of [...quarterlyIncomeStatements, ...annualIncomeStatements]) {
    const statementRevenue = getRawNumber(statement?.totalRevenue);
    const statementInterestIncome =
      getRawNumber(statement?.interestIncome) ??
      getRawNumber(statement?.interestIncomeNonOperating) ??
      getRawNumber(statement?.netNonOperatingInterestIncomeExpense) ??
      getRawNumber(statement?.netInterestIncome);

    if (statementRevenue != null) {
      // Preserve first (most recent) available total revenue.
      if (Number.isFinite(statementRevenue)) {
        totalRevenue = statementRevenue;
      }
    }
    if (statementInterestIncome != null && Number.isFinite(statementInterestIncome)) {
      interestIncome = statementInterestIncome;
    }
    if (totalRevenue != null && interestIncome != null) {
      break;
    }
  }

  if (totalRevenue == null) {
    totalRevenue = getRawNumber(result?.financialData?.totalRevenue) ?? undefined;
  }

  const debtToEquityFromRaw = debtToEquityFromDebtAndEquity(debtValue, equityValue) ?? undefined;
  const debtToEquityFromYahooRaw =
    getRawNumber(result?.financialData?.debtToEquity) ??
    getRawNumber(result?.defaultKeyStatistics?.debtToEquity);
  const debtToEquityFromYahoo = debtToEquityFromYahooRaw == null
    ? undefined
    : debtToEquityFromYahooRaw > 10
      ? debtToEquityFromYahooRaw / 100
      : debtToEquityFromYahooRaw;

  const interestIncomePct = interestIncomePctFromIncomeAndRevenue(interestIncome, totalRevenue) ?? undefined;

  const sectorCandidate = String(
    result?.assetProfile?.sector ??
    result?.assetProfile?.industry ??
    ''
  ).trim();
  const sector = isValidSectorName(sectorCandidate) ? sectorCandidate : undefined;

  if (
    debtValue == null &&
    equityValue == null &&
    debtToEquityFromRaw == null &&
    debtToEquityFromYahoo == null &&
    totalRevenue == null &&
    interestIncome == null &&
    interestIncomePct == null &&
    !sector
  ) {
    return null;
  }

  return {
    debtValue: debtValue != null && debtValue >= 0 ? debtValue : undefined,
    equityValue: equityValue != null && equityValue >= 0 ? equityValue : undefined,
    debtToEquity: debtToEquityFromRaw ?? (debtToEquityFromYahoo != null && debtToEquityFromYahoo >= 0 ? debtToEquityFromYahoo : undefined),
    totalRevenue: totalRevenue != null && Number.isFinite(totalRevenue) ? totalRevenue : undefined,
    interestIncome: interestIncome != null && Number.isFinite(interestIncome) ? interestIncome : undefined,
    interestIncomePct,
    sector,
    source: 'Yahoo Finance',
  };
}

async function fetchYahooMetrics(symbol: string, marketCode: string): Promise<EnrichmentMetrics | null> {
  const candidates = buildYahooSymbolCandidates(symbol, marketCode);
  const hosts = ['query2.finance.yahoo.com', 'query1.finance.yahoo.com'];
  for (const candidate of candidates) {
    for (const host of hosts) {
      try {
        const url =
          `https://${host}/v10/finance/quoteSummary/${encodeURIComponent(candidate)}` +
          '?modules=defaultKeyStatistics,financialData,incomeStatementHistory,incomeStatementHistoryQuarterly,balanceSheetHistory,balanceSheetHistoryQuarterly,assetProfile';
        const res = await fetch(url, {
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'Mozilla/5.0',
            Accept: 'application/json',
          },
        });
        if (!res.ok) continue;
        const json = await res.json();
        const extracted = extractYahooMetrics(json);
        if (extracted) return extracted;
      } catch {
        // best effort only
      }
    }
  }
  return null;
}

async function fetchFmpMetrics(symbol: string, marketCode: string, apiKey: string): Promise<EnrichmentMetrics | null> {
  if (!apiKey?.trim()) return null;
  const candidates = buildProviderSymbolCandidates(symbol, marketCode);

  for (const candidate of candidates) {
    const encoded = encodeURIComponent(candidate);
    const [balanceStable, incomeStable, profileStable, ratiosStable] = await Promise.all([
      safeFetchJson(`https://financialmodelingprep.com/stable/balance-sheet-statement?symbol=${encoded}&limit=1&apikey=${encodeURIComponent(apiKey)}`),
      safeFetchJson(`https://financialmodelingprep.com/stable/income-statement?symbol=${encoded}&limit=1&apikey=${encodeURIComponent(apiKey)}`),
      safeFetchJson(`https://financialmodelingprep.com/stable/profile?symbol=${encoded}&apikey=${encodeURIComponent(apiKey)}`),
      safeFetchJson(`https://financialmodelingprep.com/stable/ratios?symbol=${encoded}&limit=1&apikey=${encodeURIComponent(apiKey)}`),
    ]);
    const [balancePayload, incomePayload, profilePayload, ratiosPayload] = await Promise.all([
      balanceStable ?? safeFetchJson(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${encoded}?limit=1&apikey=${encodeURIComponent(apiKey)}`),
      incomeStable ?? safeFetchJson(`https://financialmodelingprep.com/api/v3/income-statement/${encoded}?limit=1&apikey=${encodeURIComponent(apiKey)}`),
      profileStable ?? safeFetchJson(`https://financialmodelingprep.com/api/v3/profile/${encoded}?apikey=${encodeURIComponent(apiKey)}`),
      ratiosStable ?? safeFetchJson(`https://financialmodelingprep.com/api/v3/ratios/${encoded}?limit=1&apikey=${encodeURIComponent(apiKey)}`),
    ]);

    const balanceRow = firstArrayRow(balancePayload);
    const incomeRow = firstArrayRow(incomePayload);
    const profileRow = firstArrayRow(profilePayload);
    const ratiosRow = firstArrayRow(ratiosPayload);

    const debtValue = numberFromCandidates(balanceRow, [
      'totalDebt',
      'netDebt',
      'shortTermDebt',
    ]) ?? undefined;
    const equityValue = numberFromCandidates(balanceRow, [
      'totalStockholdersEquity',
      'totalShareholdersEquity',
      'stockholdersEquity',
      'totalEquity',
    ]) ?? undefined;
    const totalRevenue = numberFromCandidates(incomeRow, [
      'revenue',
      'totalRevenue',
      'revenueNet',
    ]) ?? undefined;
    const interestIncome = numberFromCandidates(incomeRow, [
      'interestIncome',
      'interestIncomeNonOperating',
      'netInterestIncome',
      'interestAndDebtIncome',
    ]) ?? undefined;

    const debtToEquity =
      debtToEquityFromDebtAndEquity(debtValue, equityValue) ??
      numberFromCandidates(ratiosRow, ['debtEquityRatio', 'debtRatio']) ??
      undefined;
    const interestIncomePct =
      interestIncomePctFromIncomeAndRevenue(interestIncome, totalRevenue) ??
      undefined;
    const sectorCandidate = String(
      profileRow?.sector ??
      profileRow?.industry ??
      ''
    ).trim();
    const sector = isValidSectorName(sectorCandidate) ? sectorCandidate : undefined;

    const candidateMetrics: EnrichmentMetrics = {
      debtValue,
      equityValue,
      debtToEquity: debtToEquity != null && debtToEquity >= 0 ? debtToEquity : undefined,
      totalRevenue,
      interestIncome,
      interestIncomePct,
      sector,
      source: 'Financial Modeling Prep',
    };
    if (metricsScore(candidateMetrics) > 0) return candidateMetrics;
  }

  return null;
}

async function fetchEodhdMetrics(symbol: string, marketCode: string, apiKey: string): Promise<EnrichmentMetrics | null> {
  if (!apiKey?.trim()) return null;
  const candidates = buildEodhdSymbolCandidates(symbol, marketCode);
  for (const candidate of candidates) {
    const payload = await safeFetchJson(
      `https://eodhd.com/api/fundamentals/${encodeURIComponent(candidate)}?api_token=${encodeURIComponent(apiKey)}&fmt=json`
    );
    if (!payload || typeof payload !== 'object') continue;

    const balanceRow = latestReportRow(payload?.Financials?.Balance_Sheet);
    const incomeRow = latestReportRow(payload?.Financials?.Income_Statement);
    const highlights = payload?.Highlights && typeof payload.Highlights === 'object'
      ? payload.Highlights as Record<string, unknown>
      : null;
    const general = payload?.General && typeof payload.General === 'object'
      ? payload.General as Record<string, unknown>
      : null;

    const debtValue = numberFromCandidates(balanceRow, [
      'totalDebt',
      'shortLongTermDebtTotal',
      'shortLongTermDebt',
      'longTermDebt',
      'shortTermDebt',
    ]) ?? numberFromCandidates(highlights, ['TotalDebt']) ?? undefined;

    const equityValue = numberFromCandidates(balanceRow, [
      'totalStockholderEquity',
      'totalStockholdersEquity',
      'stockholdersEquity',
      'totalEquity',
      'commonStockEquity',
      'totalShareholderEquity',
    ]) ?? numberFromCandidates(highlights, ['BookValue']) ?? undefined;

    const totalRevenue = numberFromCandidates(incomeRow, [
      'totalRevenue',
      'revenue',
      'totalRevenueAsReported',
    ]) ?? numberFromCandidates(highlights, ['RevenueTTM', 'Revenue']) ?? undefined;

    const interestIncome = numberFromCandidates(incomeRow, [
      'interestIncome',
      'interestAndSimilarIncome',
      'interestIncomeAfterProvisionForLoanLoss',
      'nonOperatingInterestIncome',
    ]) ?? undefined;

    const debtRatioHighlight = numberFromCandidates(highlights, ['DebtToEquity']);
    const debtToEquityFromHighlight =
      debtRatioHighlight == null
        ? undefined
        : debtRatioHighlight > 10
          ? debtRatioHighlight / 100
          : debtRatioHighlight;
    const debtToEquity =
      debtToEquityFromDebtAndEquity(debtValue, equityValue) ??
      debtToEquityFromHighlight;
    const interestIncomePct =
      interestIncomePctFromIncomeAndRevenue(interestIncome, totalRevenue) ??
      undefined;
    const sectorCandidate = String(
      general?.Sector ??
      general?.Industry ??
      ''
    ).trim();
    const sector = isValidSectorName(sectorCandidate) ? sectorCandidate : undefined;

    const candidateMetrics: EnrichmentMetrics = {
      debtValue,
      equityValue,
      debtToEquity: debtToEquity != null && debtToEquity >= 0 ? debtToEquity : undefined,
      totalRevenue,
      interestIncome,
      interestIncomePct,
      sector,
      source: 'EODHD',
    };
    if (metricsScore(candidateMetrics) > 0) return candidateMetrics;
  }
  return null;
}

async function fetchFinnhubMetrics(symbol: string, marketCode: string, apiKey: string): Promise<EnrichmentMetrics | null> {
  if (!apiKey?.trim()) return null;
  const candidates = buildProviderSymbolCandidates(symbol, marketCode);
  for (const candidate of candidates) {
    const payload = await safeFetchJson(
      `https://finnhub.io/api/v1/stock/metric?symbol=${encodeURIComponent(candidate)}&metric=all&token=${encodeURIComponent(apiKey)}`
    );
    const metric = payload?.metric && typeof payload.metric === 'object'
      ? payload.metric as Record<string, unknown>
      : null;
    if (!metric) continue;

    const debtValue = numberFromCandidates(metric, ['totalDebt']) ?? undefined;
    const equityValue = numberFromCandidates(metric, ['totalEquity']) ?? undefined;
    const totalRevenue = numberFromCandidates(metric, ['revenuePerShareTTM']) ?? undefined;
    const debtToEquityRaw = numberFromCandidates(metric, ['totalDebt/totalEquityAnnual', 'totalDebtToEquityAnnual']);
    const debtToEquity =
      debtToEquityFromDebtAndEquity(debtValue, equityValue) ??
      (debtToEquityRaw != null
        ? (debtToEquityRaw > 10 ? debtToEquityRaw / 100 : debtToEquityRaw)
        : undefined);
    const candidateMetrics: EnrichmentMetrics = {
      debtValue,
      equityValue,
      debtToEquity: debtToEquity != null && debtToEquity >= 0 ? debtToEquity : undefined,
      totalRevenue,
      source: 'Finnhub',
    };
    if (metricsScore(candidateMetrics) > 0) return candidateMetrics;
  }
  return null;
}

async function fetchRemoteMetrics(
  symbol: string,
  marketCode: string,
  keys: MarketDataApiKeys
): Promise<EnrichmentMetrics | null> {
  let merged: EnrichmentMetrics | null = await fetchYahooMetrics(symbol, marketCode);
  if (hasRawFinancials(merged)) return merged;

  if (keys.fmp) {
    const fmpMetrics = await fetchFmpMetrics(symbol, marketCode, keys.fmp);
    merged = mergeMetrics(merged, fmpMetrics);
    if (hasRawFinancials(merged)) return merged;
  }

  if (keys.eodhd) {
    const eodhdMetrics = await fetchEodhdMetrics(symbol, marketCode, keys.eodhd);
    merged = mergeMetrics(merged, eodhdMetrics);
    if (hasRawFinancials(merged)) return merged;
  }

  if (keys.finnhub) {
    const finnhubMetrics = await fetchFinnhubMetrics(symbol, marketCode, keys.finnhub);
    merged = mergeMetrics(merged, finnhubMetrics);
  }

  return metricsScore(merged) > 0 ? merged : null;
}

async function runWithConcurrency<T>(
  tasks: T[],
  concurrency: number,
  worker: (task: T) => Promise<void>
) {
  if (tasks.length === 0) return;
  const size = Math.max(1, concurrency);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(size, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      const current = tasks[cursor];
      cursor += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
}

async function readMetricsCache(): Promise<Record<string, EnrichmentMetrics>> {
  const cached = await readJsonFile<MetricsCacheFile>(METRICS_CACHE_FILE);
  if (!cached || typeof cached !== 'object' || !cached.values || typeof cached.values !== 'object') {
    return {};
  }
  const schemaVersion = Number(cached.schemaVersion ?? 0);
  if (schemaVersion !== DATASET_SCHEMA_VERSION) {
    return {};
  }
  return cached.values;
}

async function writeMetricsCache(values: Record<string, EnrichmentMetrics>) {
  try {
    await fs.mkdir(RUNTIME_DIR, { recursive: true });
    const payload: MetricsCacheFile = {
      schemaVersion: DATASET_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      values,
    };
    await fs.writeFile(METRICS_CACHE_FILE, JSON.stringify(payload), 'utf-8');
  } catch {
    // best-effort caching
  }
}

async function buildLocalMetricsIndex(): Promise<Map<string, EnrichmentMetrics>> {
  if (localMetricsIndexCache) return localMetricsIndexCache;
  const index = new Map<string, EnrichmentMetrics>();

  for (const market of METRICS_MARKET_FILES) {
    const filePath = path.join(STOCK_METRICS_DIR, `${market}.json`);
    const parsed = await readJsonFile<StockMetricsFile>(filePath);
    const rows = Array.isArray(parsed?.all_stocks) ? parsed!.all_stocks! : [];
    for (const row of rows) {
      const symbol = canonicalSymbol(row?.symbol);
      if (!symbol) continue;

      const debtValue =
        parseNumber(row?.debt) ??
        parseNumber(row?.total_debt);
      const equityValue =
        parseNumber(row?.equity) ??
        parseNumber(row?.eqt);
      const totalRevenue = parseNumber(row?.total_revenue);
      const interestIncome = parseNumber(row?.interest_income);
      const debtToEquity =
        debtToEquityFromDebtAndEquity(debtValue, equityValue) ??
        parseNumber(row?.debtToEquity) ??
        parseNumber(row?.debt_to_equity) ??
        debtToEquityFromDebtCapital(row?.debt_capital);
      const interestIncomePct = interestIncomePctFromIncomeAndRevenue(interestIncome, totalRevenue);
      const sector = isValidSectorName(row?.sector) ? String(row?.sector).trim() : undefined;
      const candidate: EnrichmentMetrics = {
        debtValue: debtValue ?? undefined,
        equityValue: equityValue ?? undefined,
        debtToEquity: debtToEquity ?? undefined,
        totalRevenue: totalRevenue ?? undefined,
        interestIncome: interestIncome ?? undefined,
        interestIncomePct: interestIncomePct ?? undefined,
        sector,
        source: `local:${market}`,
      };
      if (metricsScore(candidate) === 0) continue;

      for (const alias of buildSymbolAliases(symbol)) {
        upsertMetrics(index, `${market}:${alias}`, candidate);
        upsertMetrics(index, `GLOBAL:${alias}`, candidate);
      }
    }
  }

  const usMetricsDb = await readJsonFile<UsMetricsFile>(US_STOCKS_SOURCE_FILE);
  for (const [bucket, market] of [
    ['US', 'american'],
    ['US_ETF', 'american_etf'],
  ] as const) {
    const rows = Array.isArray(usMetricsDb?.[bucket]) ? (usMetricsDb?.[bucket] as UsMetricsRow[]) : [];
    for (const row of rows) {
      const symbol = canonicalSymbol(row?.symbol);
      if (!symbol) continue;
      const debtValue = parseNumber(row?.totalDebt);
      const equityValue = parseNumber(row?.stockholdersEquity);
      const totalRevenue = parseNumber(row?.totalRevenue);
      const interestIncome = parseNumber(row?.interestIncome);
      const debtToEquity =
        debtToEquityFromDebtAndEquity(debtValue, equityValue) ??
        parseNumber(row?.debtToEquity);
      const interestIncomePct = interestIncomePctFromIncomeAndRevenue(interestIncome, totalRevenue);
      const candidate: EnrichmentMetrics = {
        debtValue: debtValue ?? undefined,
        equityValue: equityValue ?? undefined,
        debtToEquity: debtToEquity ?? undefined,
        totalRevenue: totalRevenue ?? undefined,
        interestIncome: interestIncome ?? undefined,
        interestIncomePct: interestIncomePct ?? undefined,
        sector: isValidSectorName(row?.sector) ? String(row?.sector).trim() : undefined,
        source: `local:us_stocks_database:${bucket}`,
      };
      if (metricsScore(candidate) === 0) continue;
      for (const alias of buildSymbolAliases(symbol)) {
        upsertMetrics(index, `${market}:${alias}`, candidate);
        upsertMetrics(index, `GLOBAL:${alias}`, candidate);
      }
    }
  }

  localMetricsIndexCache = index;
  return index;
}

function buildStockRow(
  item: any,
  marketCode: string,
  fallbackRow?: string[],
  metrics?: EnrichmentMetrics | null,
  datasetLastUpdatedAt?: string
): string[] | null {
  const symbol = String(item?.symbol ?? fallbackRow?.[0] ?? '').trim().toUpperCase();
  if (!symbol) return null;

  const name = String(item?.name ?? fallbackRow?.[1] ?? symbol).trim();
  const exchange = String(item?.market ?? fallbackRow?.[2] ?? marketCode).trim();
  const grade = normalizeGrade(item?.sharia?.grade ?? item?.grade ?? fallbackRow?.[3]);
  const statusMark = resolveMark(item?.sharia?.status ?? item?.status, fallbackRow?.[4]);

  const recommendationFromSource = String(
    item?.recommendation ?? item?.sharia?.recommendation ?? ''
  ).trim();
  const recommendation = recommendationFromSource || String(fallbackRow?.[5] ?? '').trim() || toRecommendation(statusMark);

  const sourceSector = String(item?.sector ?? item?.industry ?? '').trim();
  const fallbackSector = String(fallbackRow?.[6] ?? '').trim();
  const metricsSector = String(metrics?.sector ?? '').trim();
  const symbolDbSector = lookupSectorFromSymbolDb(symbol, marketCode);
  const sector = isValidSectorName(sourceSector)
    ? sourceSector
    : isValidSectorName(fallbackSector)
      ? fallbackSector
      : isValidSectorName(metricsSector)
        ? metricsSector
        : symbolDbSector;

  const debtRatio = item?.shariaDetails?.alBilad?.debtRatio ?? item?.debtRatio;
  const purificationPct = toPercent(debtRatio) || String(fallbackRow?.[7] ?? '').trim();

  const bilad = resolveMark(item?.shariaDetails?.alBilad?.status, fallbackRow?.[8]);
  const rajhi = resolveMark(item?.shariaDetails?.alRajhi?.status, fallbackRow?.[9]);
  const maqasid = resolveMark(
    item?.shariaDetails?.maqased?.status ?? item?.shariaDetails?.maqasid?.status,
    fallbackRow?.[10]
  );
  const zero = resolveMark(item?.shariaDetails?.zeroDebt?.status, fallbackRow?.[11]);

  const debtValue =
    parseNumber(item?.totalDebt) ??
    parseNumber(item?.debt) ??
    metrics?.debtValue ??
    parseNumber(fallbackRow?.[12]);
  const equityValue =
    parseNumber(item?.stockholdersEquity) ??
    parseNumber(item?.equity) ??
    parseNumber(item?.eqt) ??
    metrics?.equityValue ??
    parseNumber(fallbackRow?.[13]);
  const debtToEquity =
    debtToEquityFromDebtAndEquity(debtValue, equityValue) ??
    parseNumber(item?.debtToEquity) ??
    metrics?.debtToEquity ??
    parseNumber(fallbackRow?.[14]) ??
    parseNumber(fallbackRow?.[12]);

  const totalRevenue =
    parseNumber(item?.totalRevenue) ??
    metrics?.totalRevenue ??
    parseNumber(fallbackRow?.[15]);
  const interestIncome =
    parseNumber(item?.interestIncome) ??
    metrics?.interestIncome ??
    parseNumber(fallbackRow?.[16]);
  const interestIncomePct =
    interestIncomePctFromIncomeAndRevenue(interestIncome, totalRevenue) ??
    parseNumber(item?.interestIncomeRatio) ??
    parseNumber(item?.interestIncomeToRevenue) ??
    metrics?.interestIncomePct ??
    parseNumber(fallbackRow?.[17]) ??
    parseNumber(fallbackRow?.[13]);
  const lastUpdated = formatLastUpdatedDate(
    item?.lastUpdate ??
    item?.lastUpdated ??
    item?.updatedAt ??
    fallbackRow?.[18] ??
    datasetLastUpdatedAt
  );

  return [
    symbol,               // 0 symbol
    name,                 // 1 name
    exchange,             // 2 exchange
    grade,                // 3 grade
    statusMark,           // 4 overall
    recommendation,       // 5 recommendation
    sector,               // 6 sector
    purificationPct,      // 7 purification
    bilad,                // 8 bilad
    rajhi,                // 9 rajhi
    maqasid,              // 10 maqasid
    zero,                 // 11 zero debt
    formatMoneyValue(debtValue),          // 12 debt
    formatMoneyValue(equityValue),        // 13 equity
    formatDebtToEquity(debtToEquity),     // 14 debt/equity
    formatMoneyValue(totalRevenue),       // 15 total revenue
    formatMoneyValue(interestIncome),     // 16 interest income
    formatInterestIncomePercent(interestIncomePct), // 17 interest income ratio
    lastUpdated,            // 18 last update (Gregorian date)
  ];
}

function buildFundRow(
  item: any,
  metrics?: EnrichmentMetrics | null,
  datasetLastUpdatedAt?: string
): string[] | null {
  const name = String(item?.name ?? '').trim();
  if (!name) return null;
  const symbol = String(item?.symbol ?? name).trim();
  const manager = String(item?.manager ?? item?.provider ?? '—').trim();
  const status = item?.shariaCompliant ? '✅' : '❌';
  const ret = Number(item?.return2026 ?? item?.ytdReturn ?? 0);
  const unitPrice = Number(item?.unitPrice ?? item?.nav ?? 0);
  const size = Number(item?.sizeMillion ?? 0);
  const distributes = item?.distributes ? 'نعم' : 'لا';
  const risk = String(item?.riskLevel ?? '—').trim();
  const objective = String(item?.objective ?? '—').trim();
  const debtValue =
    parseNumber(item?.totalDebt) ??
    parseNumber(item?.debt) ??
    metrics?.debtValue;
  const equityValue =
    parseNumber(item?.stockholdersEquity) ??
    parseNumber(item?.equity) ??
    parseNumber(item?.eqt) ??
    metrics?.equityValue;
  const debtToEquity =
    debtToEquityFromDebtAndEquity(debtValue, equityValue) ??
    parseNumber(item?.debtToEquity) ??
    metrics?.debtToEquity;
  const totalRevenue =
    parseNumber(item?.totalRevenue) ??
    metrics?.totalRevenue;
  const interestIncome =
    parseNumber(item?.interestIncome) ??
    metrics?.interestIncome;
  const interestIncomePct =
    interestIncomePctFromIncomeAndRevenue(interestIncome, totalRevenue) ??
    parseNumber(item?.interestIncomeRatio) ??
    parseNumber(item?.interestIncomeToRevenue) ??
    metrics?.interestIncomePct;
  const lastUpdated = formatLastUpdatedDate(
    item?.lastUpdate ??
    item?.lastUpdated ??
    item?.updatedAt ??
    datasetLastUpdatedAt
  );

  // Keep shape aligned with existing `fn` table usage.
  return [
    symbol,                                 // 0
    `${name} — ${manager}`,                 // 1
    status,                                 // 2
    Number.isFinite(ret) ? ret.toFixed(2) : '0',       // 3
    Number.isFinite(unitPrice) ? unitPrice.toFixed(4) : '0', // 4
    Number.isFinite(size) ? size.toFixed(2) : '0',     // 5
    distributes,                            // 6
    risk,                                   // 7
    objective,                              // 8
    formatMoneyValue(debtValue),            // 9 debt
    formatMoneyValue(equityValue),          // 10 equity
    formatDebtToEquity(debtToEquity),       // 11 debt/equity
    formatMoneyValue(totalRevenue),         // 12 total revenue
    formatMoneyValue(interestIncome),       // 13 interest income
    formatInterestIncomePercent(interestIncomePct), // 14 interest income ratio
    lastUpdated,                            // 15 last update (Gregorian date)
  ];
}

function applyMetricsToStockRow(
  row: string[],
  metrics: EnrichmentMetrics | null | undefined
) {
  if (!metrics || metricsScore(metrics) === 0) return;
  if (!isValidSectorName(row[6]) && isValidSectorName(metrics.sector)) {
    row[6] = String(metrics.sector).trim();
  }
  row[12] = String(row[12] ?? '').trim() || formatMoneyValue(metrics.debtValue);
  row[13] = String(row[13] ?? '').trim() || formatMoneyValue(metrics.equityValue);
  row[14] = String(row[14] ?? '').trim() || formatDebtToEquity(
    debtToEquityFromDebtAndEquity(row[12], row[13]) ??
    metrics.debtToEquity
  );
  row[15] = String(row[15] ?? '').trim() || formatMoneyValue(metrics.totalRevenue);
  row[16] = String(row[16] ?? '').trim() || formatMoneyValue(metrics.interestIncome);
  row[17] = String(row[17] ?? '').trim() || formatInterestIncomePercent(
    interestIncomePctFromIncomeAndRevenue(row[16], row[15]) ??
    metrics.interestIncomePct
  );
}

function applyMetricsToFundRow(
  row: string[],
  metrics: EnrichmentMetrics | null | undefined
) {
  if (!metrics || metricsScore(metrics) === 0) return;
  row[9] = String(row[9] ?? '').trim() || formatMoneyValue(metrics.debtValue);
  row[10] = String(row[10] ?? '').trim() || formatMoneyValue(metrics.equityValue);
  row[11] = String(row[11] ?? '').trim() || formatDebtToEquity(
    debtToEquityFromDebtAndEquity(row[9], row[10]) ??
    metrics.debtToEquity
  );
  row[12] = String(row[12] ?? '').trim() || formatMoneyValue(metrics.totalRevenue);
  row[13] = String(row[13] ?? '').trim() || formatMoneyValue(metrics.interestIncome);
  row[14] = String(row[14] ?? '').trim() || formatInterestIncomePercent(
    interestIncomePctFromIncomeAndRevenue(row[13], row[12]) ??
    metrics.interestIncomePct
  );
}

function sortRows(rows: string[][]) {
  rows.sort((a, b) => String(a[0] || '').localeCompare(String(b[0] || '')));
}

function computeMeta(
  shariaMarkets: ShariaMarketData,
  refreshMode: RefreshMode,
  source: string
): ShariaDatasetMeta {
  const now = new Date();
  const next = new Date(now.getTime() + AUTO_REFRESH_MS);
  const marketCounts: Record<string, number> = {};
  let totalRows = 0;
  for (const [key, rows] of Object.entries(shariaMarkets)) {
    marketCounts[key] = Array.isArray(rows) ? rows.length : 0;
    totalRows += marketCounts[key];
  }
  return {
    schemaVersion: DATASET_SCHEMA_VERSION,
    lastUpdatedAt: now.toISOString(),
    nextAutoUpdateAt: next.toISOString(),
    refreshMode,
    source,
    totalRows,
    marketCounts,
  };
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function saveRuntime(payload: ShariaDatasetPayload) {
  try {
    await fs.mkdir(RUNTIME_DIR, { recursive: true });
    await fs.writeFile(RUNTIME_FILE, JSON.stringify(payload), 'utf-8');
  } catch {
    // runtime persistence is best-effort
  }
}

function isStale(meta: ShariaDatasetMeta | undefined): boolean {
  if (!meta?.lastUpdatedAt) return true;
  const ts = new Date(meta.lastUpdatedAt).getTime();
  if (!Number.isFinite(ts)) return true;
  return Date.now() - ts >= AUTO_REFRESH_MS;
}

function hasExpectedMetricsColumns(shariaMarkets: ShariaMarketData): boolean {
  const stockMarketKeys: Array<keyof ShariaMarketData> = ['sa', 'ae', 'kw', 'qa', 'bh', 'om', 'eg', 'jo', 'us'];
  for (const marketKey of stockMarketKeys) {
    const rows = shariaMarkets[marketKey] || [];
    if (rows.length === 0) continue;
    const hasExtendedShape = rows.some((row) => Array.isArray(row) && row.length >= 19);
    if (!hasExtendedShape) return false;
  }

  const fundRows = shariaMarkets.fn || [];
  if (fundRows.length > 0) {
    const hasExtendedShape = fundRows.some((row) => Array.isArray(row) && row.length >= 16);
    if (!hasExtendedShape) return false;
  }
  return true;
}

function buildFallbackPayload(): ShariaDatasetPayload {
  const shariaMarkets = cloneBundledSharia();
  const funds = cloneBundledFunds();
  return {
    shariaMarkets,
    funds,
    meta: computeMeta(shariaMarkets, 'bootstrap', 'bundled-fallback'),
  };
}

function ensureRequiredKeys(data: ShariaMarketData): ShariaMarketData {
  const cloned = { ...data };
  for (const key of ['sa', 'ae', 'kw', 'qa', 'bh', 'om', 'eg', 'jo', 'us', 'fn']) {
    if (!Array.isArray(cloned[key])) cloned[key] = [];
  }
  return cloned;
}

function fundMarketToMarketCode(market: unknown, symbol: unknown): string {
  const normalizedMarket = normalizeMarketCode(market);
  if (normalizedMarket === 'SA') return 'TADAWUL';
  if (normalizedMarket === 'US') return 'US_ETF';
  if (normalizedMarket === 'UAE') return 'ADX';
  if (normalizedMarket === 'QA') return 'QE';
  if (normalizedMarket === 'KW') return 'KSE';
  if (normalizedMarket === 'BH') return 'BHB';
  if (normalizedMarket === 'OM') return 'MSM';
  if (normalizedMarket === 'EG') return 'EGX';
  if (normalizedMarket === 'JO') return 'ASE';

  const sym = String(symbol ?? '').toUpperCase();
  if (sym.endsWith('.SR')) return 'TADAWUL';
  if (sym.endsWith('.AD')) return 'ADX';
  if (sym.endsWith('.DU')) return 'DFM';
  if (sym.endsWith('.QA')) return 'QE';
  if (sym.endsWith('.KW')) return 'KSE';
  if (sym.endsWith('.BH')) return 'BHB';
  if (sym.endsWith('.OM')) return 'MSM';
  if (sym.endsWith('.CA')) return 'EGX';
  if (sym.endsWith('.JO')) return 'ASE';

  return 'US_ETF';
}

async function buildFromLocalSources(refreshMode: RefreshMode): Promise<ShariaDatasetPayload> {
  const fallbackSharia = cloneBundledSharia();
  const fallbackFunds = cloneBundledFunds();
  const datasetLastUpdatedAt = new Date().toISOString();

  const stocksDb = await readJsonFile<Record<string, any[]>>(STOCKS_SOURCE_FILE);
  const fundsDb = (await readJsonFile<any[]>(FUNDS_SOURCE_FILE)) ?? fallbackFunds;
  const localMetricsIndex = await buildLocalMetricsIndex();
  const metricsCache = await readMetricsCache();
  const remoteLimit = REMOTE_ENRICH_LIMIT[refreshMode] ?? 0;

  if (!stocksDb) {
    const shariaMarkets = ensureRequiredKeys(fallbackSharia);
    const payload: ShariaDatasetPayload = {
      shariaMarkets,
      funds: fundsDb,
      meta: computeMeta(shariaMarkets, refreshMode, 'bundled-sharia + local-funds'),
    };
    return payload;
  }

  const nextSharia = ensureRequiredKeys({ ...fallbackSharia });
  const stockMarketKeys: Array<keyof ShariaMarketData> = ['sa', 'ae', 'kw', 'qa', 'bh', 'om', 'eg', 'us', 'jo'];
  const marketMaps: Partial<Record<keyof ShariaMarketData, Map<string, string[]>>> = {};
  const remoteCandidates = new Map<string, {
    symbol: string;
    marketCode: string;
    priority: number;
    apply: Array<(metrics: EnrichmentMetrics) => void>;
  }>();

  const resolveMetricsFor = (symbol: unknown, marketCode: string): EnrichmentMetrics | null => {
    const local = resolveLocalMetrics(localMetricsIndex, marketCode, symbol);
    const cached = resolveCachedMetrics(metricsCache, marketCode, symbol);
    const merged = mergeMetrics(local, cached);
    return metricsScore(merged) > 0 ? merged : null;
  };

  const queueRemoteMetrics = (
    symbol: string,
    marketCode: string,
    priority: number,
    apply: (metrics: EnrichmentMetrics) => void
  ) => {
    if (remoteLimit <= 0) return;
    const symbolKey = canonicalSymbol(symbol);
    if (!symbolKey || !/[A-Z0-9]/.test(symbolKey)) return;
    const key = metricsCacheKey(marketCode, symbolKey);
    const prev = remoteCandidates.get(key);
    if (prev) {
      prev.priority = Math.max(prev.priority, priority);
      prev.apply.push(apply);
      return;
    }
    remoteCandidates.set(key, {
      symbol: symbolKey,
      marketCode,
      priority,
      apply: [apply],
    });
  };

  for (const marketKey of stockMarketKeys) {
    const seeded = new Map<string, string[]>();
    for (const row of nextSharia[marketKey] || []) {
      const key = canonicalSymbol(row?.[0]);
      if (!key) continue;
      seeded.set(key, row);
    }
    marketMaps[marketKey] = seeded;
  }

  for (const [marketCode, rows] of Object.entries(stocksDb)) {
    if (!Array.isArray(rows)) continue;
    const marketKey = MARKET_CODE_MAP[marketCode];
    if (!marketKey || !marketMaps[marketKey]) continue;
    const targetMap = marketMaps[marketKey]!;

    for (const item of rows) {
      const symbolKey = canonicalSymbol(item?.symbol);
      // Ignore malformed rows (e.g. imported table headers / non-ticker values)
      // to avoid overriding trusted fallback rows with incomplete records.
      if (!symbolKey || !/[A-Z0-9]/.test(symbolKey)) continue;
      const fallbackRow = symbolKey ? targetMap.get(symbolKey) : undefined;
      const metrics = resolveMetricsFor(symbolKey, marketCode);
      const row = buildStockRow(item, marketCode, fallbackRow, metrics, datasetLastUpdatedAt);
      if (!row) continue;
      applyMetricsToStockRow(row, metrics);
      targetMap.set(canonicalSymbol(row[0]), row);

      const missingDebt = !String(row[12] ?? '').trim();
      const missingEquity = !String(row[13] ?? '').trim();
      const missingDebtEqt = !String(row[14] ?? '').trim();
      const missingRevenue = !String(row[15] ?? '').trim();
      const missingInterest = !String(row[16] ?? '').trim();
      const missingInterestRatio = !String(row[17] ?? '').trim();
      const missingSector = !isValidSectorName(row[6]);
      if (missingDebt || missingEquity || missingDebtEqt || missingRevenue || missingInterest || missingInterestRatio || missingSector) {
        const priority =
          (missingDebt ? 2 : 0) +
          (missingEquity ? 2 : 0) +
          (missingDebtEqt ? 2 : 0) +
          (missingRevenue ? 2 : 0) +
          (missingInterest ? 3 : 0) +
          (missingInterestRatio ? 2 : 0) +
          (missingSector ? 1 : 0) +
          ((marketCode === 'US' || marketCode === 'US_ETF') ? 3 : 0);
        queueRemoteMetrics(symbolKey, marketCode, priority, (remoteMetrics) => {
          applyMetricsToStockRow(row, remoteMetrics);
          const marketKeyCache = metricsCacheKey(marketCode, symbolKey);
          const globalKeyCache = metricsCacheKey('GLOBAL', symbolKey);
          metricsCache[marketKeyCache] = mergeMetrics(metricsCache[marketKeyCache], remoteMetrics);
          metricsCache[globalKeyCache] = mergeMetrics(metricsCache[globalKeyCache], remoteMetrics);
        });
      }
    }
  }

  const fnRows = fundsDb
    .map((fund) => {
      const symbol = String(fund?.symbol ?? '').trim();
      const marketCode = fundMarketToMarketCode(fund?.market, symbol);
      const metrics = resolveMetricsFor(symbol, marketCode);
      const row = buildFundRow(fund, metrics, datasetLastUpdatedAt);
      if (row) applyMetricsToFundRow(row, metrics);
      const missingDebt = !String(row?.[9] ?? '').trim();
      const missingEquity = !String(row?.[10] ?? '').trim();
      const missingDebtEqt = !String(row?.[11] ?? '').trim();
      const missingRevenue = !String(row?.[12] ?? '').trim();
      const missingInterest = !String(row?.[13] ?? '').trim();
      const missingInterestRatio = !String(row?.[14] ?? '').trim();
      if (row && (missingDebt || missingEquity || missingDebtEqt || missingRevenue || missingInterest || missingInterestRatio)) {
        const priority =
          (missingDebt ? 2 : 0) +
          (missingEquity ? 2 : 0) +
          (missingDebtEqt ? 2 : 0) +
          (missingRevenue ? 2 : 0) +
          (missingInterest ? 3 : 0) +
          (missingInterestRatio ? 2 : 0) +
          ((marketCode === 'US' || marketCode === 'US_ETF') ? 3 : 0);
        queueRemoteMetrics(symbol, marketCode, priority, (remoteMetrics) => {
          applyMetricsToFundRow(row, remoteMetrics);
          const marketKeyCache = metricsCacheKey(marketCode, symbol);
          const globalKeyCache = metricsCacheKey('GLOBAL', symbol);
          metricsCache[marketKeyCache] = mergeMetrics(metricsCache[marketKeyCache], remoteMetrics);
          metricsCache[globalKeyCache] = mergeMetrics(metricsCache[globalKeyCache], remoteMetrics);
        });
      }
      return row;
    })
    .filter((r): r is string[] => Array.isArray(r));

  // Ensure seeded fallback rows (that may not exist in local stocks_database.json)
  // still receive debt/equity + interest enrichment before sorting/output.
  for (const marketKey of stockMarketKeys) {
    const rowsMap = marketMaps[marketKey];
    if (!rowsMap) continue;
    for (const row of rowsMap.values()) {
      const symbol = canonicalSymbol(row?.[0]);
      if (!symbol) continue;
      const exchange = normalizeMarketCode(row?.[2] ?? marketKeyDefaultCode(marketKey));
      const marketCode = exchange || marketKeyDefaultCode(marketKey);
      const metrics = resolveMetricsFor(symbol, marketCode);
      applyMetricsToStockRow(row, metrics);
      row[18] = String(row[18] ?? '').trim() || formatLastUpdatedDate(datasetLastUpdatedAt);
      const missingDebt = !String(row[12] ?? '').trim();
      const missingEquity = !String(row[13] ?? '').trim();
      const missingDebtEqt = !String(row[14] ?? '').trim();
      const missingRevenue = !String(row[15] ?? '').trim();
      const missingInterest = !String(row[16] ?? '').trim();
      const missingInterestRatio = !String(row[17] ?? '').trim();
      const missingSector = !isValidSectorName(row[6]);
      if (missingDebt || missingEquity || missingDebtEqt || missingRevenue || missingInterest || missingInterestRatio || missingSector) {
        const priority =
          (missingDebt ? 2 : 0) +
          (missingEquity ? 2 : 0) +
          (missingDebtEqt ? 2 : 0) +
          (missingRevenue ? 2 : 0) +
          (missingInterest ? 3 : 0) +
          (missingInterestRatio ? 2 : 0) +
          (missingSector ? 1 : 0) +
          ((marketCode === 'US' || marketCode === 'US_ETF') ? 3 : 0);
        queueRemoteMetrics(symbol, marketCode, priority, (remoteMetrics) => {
          applyMetricsToStockRow(row, remoteMetrics);
          const marketKeyCache = metricsCacheKey(marketCode, symbol);
          const globalKeyCache = metricsCacheKey('GLOBAL', symbol);
          metricsCache[marketKeyCache] = mergeMetrics(metricsCache[marketKeyCache], remoteMetrics);
          metricsCache[globalKeyCache] = mergeMetrics(metricsCache[globalKeyCache], remoteMetrics);
        });
      }
    }
  }

  const prioritizedRemoteCandidates = remoteLimit > 0
    ? [...remoteCandidates.values()].sort((a, b) => b.priority - a.priority).slice(0, remoteLimit)
    : [];

  if (prioritizedRemoteCandidates.length > 0) {
    const marketDataKeys = await loadMarketDataApiKeys();
    await runWithConcurrency(prioritizedRemoteCandidates, REMOTE_ENRICH_CONCURRENCY, async (candidate) => {
      const remoteMetrics = await fetchRemoteMetrics(candidate.symbol, candidate.marketCode, marketDataKeys);
      if (!remoteMetrics || metricsScore(remoteMetrics) === 0) return;
      for (const apply of candidate.apply) {
        apply(remoteMetrics);
      }
    });
    await writeMetricsCache(metricsCache);
  }

  for (const marketKey of stockMarketKeys) {
    const rowsMap = marketMaps[marketKey];
    if (!rowsMap) continue;
    const rows = [...rowsMap.values()];
    sortRows(rows);
    nextSharia[marketKey] = rows;
  }

  sortRows(fnRows);
  nextSharia.fn = fnRows.length > 0 ? fnRows : fallbackSharia.fn;

  const payload: ShariaDatasetPayload = {
    shariaMarkets: nextSharia,
    funds: fundsDb,
    meta: computeMeta(
      nextSharia,
      refreshMode,
      'local-stocks_database.json + local-us_stocks_database.json + local-funds_merged.json + data/stocks enrichment + multi-provider fundamentals fallback (Yahoo/FMP/EODHD/Finnhub) + bundled-sharia-backfill'
    ),
  };
  sanitizeShariaSectors(payload.shariaMarkets);
  return payload;
}

async function readRuntimeCache(): Promise<ShariaDatasetPayload | null> {
  if (cache) return cache;

  const runtime = await readJsonFile<ShariaDatasetPayload>(RUNTIME_FILE);
  if (runtime?.shariaMarkets && runtime?.meta) {
    const schemaVersion = Number((runtime.meta as Partial<ShariaDatasetMeta>).schemaVersion ?? 0);
    if (schemaVersion !== DATASET_SCHEMA_VERSION || !hasExpectedMetricsColumns(runtime.shariaMarkets)) {
      return null;
    }

    const normalizedMarkets = ensureRequiredKeys(runtime.shariaMarkets);
    const changed = sanitizeShariaSectors(normalizedMarkets);
    cache = {
      ...runtime,
      shariaMarkets: normalizedMarkets,
      funds: Array.isArray(runtime.funds) ? runtime.funds : cloneBundledFunds(),
    };
    if (changed) {
      void saveRuntime(cache as ShariaDatasetPayload);
    }
    return cache;
  }

  return null;
}

export async function refreshShariaDataset(refreshMode: RefreshMode = 'manual'): Promise<ShariaDatasetPayload> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const payload = await buildFromLocalSources(refreshMode);
      cache = payload;
      await saveRuntime(payload);
      return payload;
    } catch {
      const fallback = buildFallbackPayload();
      cache = fallback;
      await saveRuntime(fallback);
      return fallback;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function getShariaDatasetSnapshot(options?: {
  autoRefresh?: boolean;
}): Promise<ShariaDatasetSnapshot> {
  const autoRefresh = options?.autoRefresh !== false;

  let payload = await readRuntimeCache();
  if (!payload) {
    payload = await refreshShariaDataset('bootstrap');
    return { payload, autoRefreshed: false };
  }

  if (!autoRefresh || !isStale(payload.meta)) {
    return { payload, autoRefreshed: false };
  }

  const refreshed = await refreshShariaDataset('auto');
  return { payload: refreshed, autoRefreshed: true };
}

export async function getShariaMarketsData(options?: { autoRefresh?: boolean }): Promise<ShariaMarketData> {
  const { payload } = await getShariaDatasetSnapshot({ autoRefresh: options?.autoRefresh });
  return payload.shariaMarkets;
}
