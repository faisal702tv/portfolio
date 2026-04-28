import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-request';
import { withApiTelemetry } from '@/lib/api-telemetry';
import { LOCAL_SYMBOL_DB } from '@/data/symbols-database';

type AssetType = 'stock' | 'fund' | 'bond' | 'sukuk' | 'forex' | 'crypto' | 'commodity' | 'unknown';
type EventCategory = 'corporate_action' | 'earnings' | 'listing_status';
type EventType =
  | 'split'
  | 'reverse_split'
  | 'bonus_issue'
  | 'rights_issue'
  | 'dividend'
  | 'earnings_expected'
  | 'earnings_actual'
  | 'suspension'
  | 'delisting';
type EventStatus = 'upcoming' | 'announced' | 'beat' | 'miss' | 'inline' | 'suspended' | 'delisted';
type ListingHealthStatus = 'active' | 'suspended' | 'delisted' | 'unverified';

interface AssetInput {
  symbol?: string;
  name?: string;
  assetType?: string;
  market?: string;
  source?: string;
}

interface NormalizedAsset {
  symbol: string;
  name: string;
  assetType: AssetType;
  market: string | null;
  sources: string[];
}

interface UnifiedEvent {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  assetTypeAr: string;
  assetSources: string[];
  eventCategory: EventCategory;
  eventType: EventType;
  eventTypeAr: string;
  titleAr: string;
  subtitleAr: string;
  date: string;
  datePrecision: 'exact' | 'estimated';
  status: EventStatus;
  statusAr: string;
  source: string;
  currency: string;
  currencySymbol: string;
  importance: number;
  url?: string;
  sourceLinks?: SourceLink[];
  reasonAr?: string;
  reasonEn?: string;
  details?: Record<string, unknown>;
}

interface ListingHealth {
  symbol: string;
  name: string;
  assetType: AssetType;
  assetTypeAr: string;
  assetSources: string[];
  currency: string;
  currencySymbol: string;
  status: ListingHealthStatus;
  statusAr: string;
  reasonAr: string;
  reasonEn?: string;
  source: string;
}

interface HubResponse {
  success: true;
  updatedAt: string;
  assets: NormalizedAsset[];
  health: ListingHealth[];
  events: UnifiedEvent[];
  stats: {
    assets: number;
    events: number;
    corporateActions: number;
    bonusNews: number;
    earningsExpected: number;
    earningsActual: number;
    suspended: number;
    delisted: number;
  };
  warnings: string[];
}

interface QuoteLite {
  symbol?: string;
  quoteType?: string;
  marketState?: string;
  regularMarketPrice?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
  averageDailyVolume10Day?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: number;
  currency?: string;
  financialCurrency?: string;
  regularMarketTime?: number;
  tradeable?: boolean;
  fullExchangeName?: string;
  exchange?: string;
  longName?: string;
  shortName?: string;
  exDividendDate?: number;
  dividendDate?: number;
  dividendRate?: number;
  dividendYield?: number;
  trailingAnnualDividendRate?: number;
  trailingAnnualDividendYield?: number;
  payoutRatio?: number;
  earningsTimestamp?: number;
  earningsTimestampStart?: number;
  earningsTimestampEnd?: number;
  epsForward?: number;
  epsCurrentYear?: number;
  epsTrailingTwelveMonths?: number;
}

type DividendFrequency = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'irregular' | 'unknown';

interface DividendHistoryEntry {
  date: string;
  amount: number;
  paymentDate?: string | null;
  source: 'api' | 'db';
}

interface DividendProfile {
  frequency: DividendFrequency;
  frequencyAr: string;
  annualDividend: number | null;
  yieldPct: number | null;
  payoutRatioPct: number | null;
  last12mDividend: number | null;
  averageDividend: number | null;
  historyCount: number;
  nextExDate: string | null;
  nextPaymentDate: string | null;
}

interface MarketDataSnapshotLite {
  price: number | null;
  volume: number | null;
  week52High: number | null;
  week52Low: number | null;
  marketCap: number | null;
}

interface EarningsCalculation {
  surprise: number | null;
  surprisePct: number | null;
  result: 'beat' | 'miss' | 'inline' | null;
}

interface SourceLink {
  label: string;
  url: string;
}

interface ManualCorporateActionRow {
  symbol: string;
  name: string;
  type: string;
  ratio: string | null;
  ratioFrom: number | null;
  ratioTo: number | null;
  dividendAmount: number | null;
  effectiveDate: Date | null;
  currency: string;
  source: string;
  notes: string | null;
  createdAt: Date;
}

interface ManualEarningsRow {
  symbol: string;
  name: string;
  quarter: string;
  year: number;
  announcementDate: Date | null;
  expectedEPS: number | null;
  actualEPS: number | null;
  surprise: number | null;
  surprisePct: number | null;
  result: string | null;
  currency: string;
  source: string;
  notes: string | null;
  createdAt: Date;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

const MAX_ASSETS = 180;
const FETCH_CONCURRENCY = 6;
const CACHE_TTL_MS = 10 * 60 * 1000;
const YAHOO_HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'] as const;

const corporateCache = new Map<string, CacheEntry<UnifiedEvent[]>>();
const earningsCache = new Map<string, CacheEntry<UnifiedEvent[]>>();
const bonusNewsCache = new Map<string, CacheEntry<UnifiedEvent[]>>();
const chartHintCache = new Map<string, CacheEntry<string>>();
const verifyCache = new Map<string, CacheEntry<{
  checked: string[];
  available: string[];
}>>();

// مصادر موثوقة مستمدة من صفحة "المصادر والروابط" داخل المشروع.
const TRUSTED_SOURCE_LABELS = {
  yahoo: 'Yahoo Finance',
  alpha: 'Alpha Vantage',
  fmp: 'Financial Modeling Prep',
  twelve: 'Twelve Data',
} as const;

const MARKET_CURRENCY_MAP: Record<string, string> = {
  TADAWUL: 'SAR',
  SAUDI: 'SAR',
  TASI: 'SAR',
  ADX: 'AED',
  DFM: 'AED',
  NASDAQ_DUBAI: 'AED',
  KSE: 'KWD',
  BOURSA: 'KWD',
  QSE: 'QAR',
  QE: 'QAR',
  QATAR: 'QAR',
  BHB: 'BHD',
  BAHRAIN: 'BHD',
  EGX: 'EGP',
  EGYPT: 'EGP',
  MSX: 'OMR',
  OMAN: 'OMR',
  ASE: 'JOD',
  JORDAN: 'JOD',
  US: 'USD',
  NYSE: 'USD',
  NASDAQ: 'USD',
  AMEX: 'USD',
  OTC: 'USD',
  CRYPTO: 'USD',
  FOREX: 'USD',
  COMMODITIES: 'USD',
  COMMODITY: 'USD',
};

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  SAR: 'ر.س',
  AED: 'د.إ',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  EGP: 'ج.م',
  OMR: 'ر.ع',
  JOD: 'د.أ',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

const BONUS_NEWS_REGEX = /(bonus issue|bonus shares?|stock bonus|free shares?|stock dividend|rights issue|rights offering|rights shares?|منحة|منح|أسهم مجانية|توزيع أسهم|زيادة رأس المال|حقوق أولوية|حقوق الأولوية|أسهم حقوق الأولوية)/i;
const RIGHTS_ISSUE_REGEX = /(rights issue|rights offering|rights shares?|زيادة رأس المال عبر حقوق|حقوق أولوية|حقوق الأولوية|أسهم حقوق الأولوية|طرح حقوق)/i;

function isFresh<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return Boolean(entry && Date.now() - entry.timestamp <= CACHE_TTL_MS);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(input: unknown): string {
  if (typeof input === 'number') {
    const d = new Date(input * 1000);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }
  if (typeof input === 'string' && input.trim()) {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }
  return '';
}

function quarterToApproxDate(quarter: string, year: number): string {
  const q = quarter.toUpperCase();
  if (!Number.isFinite(year)) return '';
  if (q === 'Q1') return `${year}-03-31`;
  if (q === 'Q2') return `${year}-06-30`;
  if (q === 'Q3') return `${year}-09-30`;
  return `${year}-12-31`;
}

function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('ar-SA-u-ca-gregory', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeRatioToPercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (Math.abs(value) <= 2) return value * 100;
  return value;
}

function determineDividendFrequency(history: DividendHistoryEntry[]): DividendFrequency {
  if (history.length < 2) return 'unknown';
  const ascending = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const intervals: number[] = [];
  for (let i = 1; i < ascending.length; i += 1) {
    const prev = new Date(ascending[i - 1].date);
    const current = new Date(ascending[i].date);
    const diffDays = (current.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
    if (Number.isFinite(diffDays) && diffDays >= 10 && diffDays <= 430) {
      intervals.push(diffDays);
    }
  }
  if (intervals.length === 0) return 'unknown';
  const sorted = intervals.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (median <= 45) return 'monthly';
  if (median <= 120) return 'quarterly';
  if (median <= 220) return 'semiannual';
  if (median <= 400) return 'annual';
  return 'irregular';
}

function dividendFrequencyLabelAr(freq: DividendFrequency): string {
  switch (freq) {
    case 'monthly':
      return 'شهري';
    case 'quarterly':
      return 'ربع سنوي';
    case 'semiannual':
      return 'نصف سنوي';
    case 'annual':
      return 'سنوي';
    case 'irregular':
      return 'غير منتظم';
    default:
      return 'غير متاح';
  }
}

function expectedPaymentsPerYear(freq: DividendFrequency): number | null {
  if (freq === 'monthly') return 12;
  if (freq === 'quarterly') return 4;
  if (freq === 'semiannual') return 2;
  if (freq === 'annual') return 1;
  return null;
}

function mergeDividendHistory(primary: DividendHistoryEntry[], fallback: DividendHistoryEntry[]): DividendHistoryEntry[] {
  const map = new Map<string, DividendHistoryEntry>();
  for (const item of fallback) {
    const key = `${item.date}|${item.amount.toFixed(6)}`;
    map.set(key, item);
  }
  for (const item of primary) {
    const key = `${item.date}|${item.amount.toFixed(6)}`;
    map.set(key, item);
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

function buildDividendProfile(history: DividendHistoryEntry[], quote?: QuoteLite): DividendProfile {
  const frequency = determineDividendFrequency(history);
  const frequencyAr = dividendFrequencyLabelAr(frequency);
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoIso = oneYearAgo.toISOString().slice(0, 10);

  const last12mRows = history.filter((row) => row.date >= oneYearAgoIso);
  const last12mDividendRaw = last12mRows.reduce((sum, row) => sum + row.amount, 0);
  const last12mDividend = Number.isFinite(last12mDividendRaw) && last12mDividendRaw > 0 ? last12mDividendRaw : null;

  const avgRaw = history.length > 0 ? history.reduce((sum, row) => sum + row.amount, 0) / history.length : null;
  const averageDividend = avgRaw != null && Number.isFinite(avgRaw) ? avgRaw : null;

  const quoteAnnualRate = toFiniteNumber(quote?.dividendRate) ?? toFiniteNumber(quote?.trailingAnnualDividendRate);
  let annualDividend = quoteAnnualRate;
  if (annualDividend == null || !Number.isFinite(annualDividend) || annualDividend <= 0) {
    annualDividend = last12mDividend;
  }
  if ((annualDividend == null || annualDividend <= 0) && history.length > 0) {
    const latestAmount = history[0].amount;
    const expected = expectedPaymentsPerYear(frequency);
    if (expected != null && Number.isFinite(latestAmount)) {
      annualDividend = latestAmount * expected;
    }
  }
  if (annualDividend != null && !Number.isFinite(annualDividend)) {
    annualDividend = null;
  }

  const marketPrice = toFiniteNumber(quote?.regularMarketPrice);
  const quoteYield = normalizeRatioToPercent(
    toFiniteNumber(quote?.dividendYield) ?? toFiniteNumber(quote?.trailingAnnualDividendYield)
  );
  const derivedYield = marketPrice && annualDividend ? (annualDividend / marketPrice) * 100 : null;
  const yieldPct = quoteYield ?? derivedYield;

  const payoutRatioPct = normalizeRatioToPercent(toFiniteNumber(quote?.payoutRatio));
  const nextExDate = toIsoDate(quote?.exDividendDate);
  const nextPaymentDate = toIsoDate(quote?.dividendDate);

  return {
    frequency,
    frequencyAr,
    annualDividend: annualDividend != null && Number.isFinite(annualDividend) ? annualDividend : null,
    yieldPct: yieldPct != null && Number.isFinite(yieldPct) ? yieldPct : null,
    payoutRatioPct: payoutRatioPct != null && Number.isFinite(payoutRatioPct) ? payoutRatioPct : null,
    last12mDividend,
    averageDividend,
    historyCount: history.length,
    nextExDate: nextExDate || null,
    nextPaymentDate: nextPaymentDate || null,
  };
}

function getDividendMarketMetrics(quote?: QuoteLite) {
  const currentPrice = toFiniteNumber(quote?.regularMarketPrice);
  const week52High = toFiniteNumber(quote?.fiftyTwoWeekHigh);
  const week52Low = toFiniteNumber(quote?.fiftyTwoWeekLow);
  const volume = toFiniteNumber(quote?.regularMarketVolume);
  const avgVolume = toFiniteNumber(quote?.averageDailyVolume3Month) ?? toFiniteNumber(quote?.averageDailyVolume10Day);
  const marketCap = toFiniteNumber(quote?.marketCap);
  let pricePositionPct: number | null = null;

  if (currentPrice != null && week52Low != null && week52High != null && week52High > week52Low) {
    const raw = ((currentPrice - week52Low) / (week52High - week52Low)) * 100;
    pricePositionPct = Math.max(0, Math.min(100, raw));
  }

  return {
    currentPrice,
    week52High,
    week52Low,
    volume,
    avgVolume,
    marketCap,
    pricePositionPct,
  };
}

function buildDividendSubtitle(
  amount: number | null,
  currencyCode: string,
  profile: DividendProfile,
  isUpcoming: boolean
): string {
  const parts: string[] = [];
  if (amount != null && Number.isFinite(amount)) {
    parts.push(`قيمة التوزيع ${formatNumber(amount, 4)} ${currencyCode}`);
  } else if (isUpcoming) {
    parts.push('توزيع متوقع من بيانات السوق');
  } else {
    parts.push('توزيع نقدي');
  }
  if (profile.frequency !== 'unknown') {
    parts.push(`التكرار: ${profile.frequencyAr}`);
  }
  if (profile.yieldPct != null) {
    parts.push(`عائد التوزيع: ${formatNumber(profile.yieldPct, 2)}%`);
  }
  return `${parts.join(' | ')}.`;
}

function normalizeSymbol(symbol: unknown): string {
  return String(symbol || '').trim().toUpperCase();
}

function resolveYahooSymbol(asset: Pick<NormalizedAsset, 'symbol' | 'market'>): string {
  const symbol = normalizeSymbol(asset.symbol);
  if (!symbol) return '';
  if (/[.=/-]/.test(symbol) || /\.[A-Z]{1,4}$/.test(symbol)) return symbol;

  if (!/^\d{3,5}$/.test(symbol)) return symbol;

  const marketUpper = String(asset.market || '').toUpperCase().trim();
  const orderedSuffixes = marketUpper.includes('TADAWUL') || marketUpper.includes('SAUDI') || marketUpper.includes('TASI')
    ? ['SR', 'AD', 'DU', 'KW', 'QA', 'BH', 'OM', 'CA', 'JO']
    : marketUpper.includes('ADX')
      ? ['AD', 'SR', 'DU', 'KW', 'QA', 'BH', 'OM', 'CA', 'JO']
      : marketUpper.includes('DFM') || marketUpper.includes('DUBAI')
        ? ['DU', 'SR', 'AD', 'KW', 'QA', 'BH', 'OM', 'CA', 'JO']
        : ['SR', 'AD', 'DU', 'KW', 'QA', 'BH', 'OM', 'CA', 'JO'];

  const db = LOCAL_SYMBOL_DB as Record<string, { n?: string }>;
  for (const suffix of orderedSuffixes) {
    const candidate = `${symbol}.${suffix}`;
    if (db[candidate]) return candidate;
  }

  if (orderedSuffixes.length > 0) return `${symbol}.${orderedSuffixes[0]}`;
  return symbol;
}

function normalizeAssetType(raw: unknown): AssetType {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return 'unknown';
  if (['stock', 'stocks', 'equity', 'equities'].includes(v)) return 'stock';
  if (['fund', 'funds', 'etf', 'mutual_fund'].includes(v)) return 'fund';
  if (['bond', 'bonds'].includes(v)) return 'bond';
  if (['sukuk', 'صكوك'].includes(v)) return 'sukuk';
  if (['forex', 'fx', 'currency'].includes(v)) return 'forex';
  if (['crypto', 'cryptocurrency', 'coin'].includes(v)) return 'crypto';
  if (['commodity', 'commodities', 'metal', 'metals'].includes(v)) return 'commodity';
  return 'unknown';
}

function inferAssetTypeBySymbol(symbol: string, market?: string | null): AssetType {
  const m = String(market || '').toUpperCase();
  if (m.includes('FOREX') || symbol.endsWith('=X')) return 'forex';
  if (m.includes('CRYPTO') || symbol.endsWith('-USD')) return 'crypto';
  if (m.includes('COMMOD') || symbol.endsWith('=F')) return 'commodity';
  if (m.includes('BOND')) return 'bond';
  if (m.includes('SUKUK')) return 'sukuk';
  if (m.includes('FUND') || m.includes('ETF') || m.includes('REIT')) return 'fund';
  return 'stock';
}

function inferCurrencyFromSymbol(symbol: string): string | null {
  const sym = normalizeSymbol(symbol);
  if (!sym) return null;
  if (sym.endsWith('=X') || sym.endsWith('=F') || sym.endsWith('-USD')) return 'USD';
  if (sym.endsWith('.SR')) return 'SAR';
  if (sym.endsWith('.AD') || sym.endsWith('.DU')) return 'AED';
  if (sym.endsWith('.KW')) return 'KWD';
  if (sym.endsWith('.QA')) return 'QAR';
  if (sym.endsWith('.BH')) return 'BHD';
  if (sym.endsWith('.OM')) return 'OMR';
  if (sym.endsWith('.CA')) return 'EGP';
  if (sym.endsWith('.JO')) return 'JOD';
  return null;
}

function inferCurrencyFromMarket(market: string | null | undefined): string | null {
  const m = String(market || '').toUpperCase().trim();
  if (!m) return null;
  for (const [key, currency] of Object.entries(MARKET_CURRENCY_MAP)) {
    if (m.includes(key)) return currency;
  }
  return null;
}

function currencySymbol(currency: string | null | undefined): string {
  const c = String(currency || '').toUpperCase();
  return CURRENCY_SYMBOL_MAP[c] || c || '—';
}

function normalizeSourceTag(tag: string): string {
  const value = String(tag || '').toLowerCase();
  if (value.includes('watchlist')) return 'watchlist';
  if (value.includes('portfolio')) return 'portfolio';
  if (value.includes('query')) return 'query';
  if (value.includes('request')) return 'request';
  return value || 'unknown';
}

function normalizeAssetSources(sources: string[] | undefined): string[] {
  if (!Array.isArray(sources)) return ['unknown'];
  const normalized = sources.map((s) => normalizeSourceTag(s)).filter(Boolean);
  return normalized.length > 0 ? [...new Set(normalized)] : ['unknown'];
}

function resolveAssetCurrency(asset: NormalizedAsset, quote?: QuoteLite): { code: string; symbol: string } {
  const fromQuote = String(quote?.currency || quote?.financialCurrency || '').toUpperCase().trim();
  const code =
    fromQuote ||
    inferCurrencyFromMarket(asset.market) ||
    inferCurrencyFromSymbol(asset.symbol) ||
    'USD';

  return { code, symbol: currencySymbol(code) };
}

function assetTypeAr(assetType: AssetType): string {
  switch (assetType) {
    case 'stock':
      return 'سهم';
    case 'fund':
      return 'صندوق';
    case 'bond':
      return 'سند';
    case 'sukuk':
      return 'صك';
    case 'forex':
      return 'فوركس';
    case 'crypto':
      return 'عملة مشفرة';
    case 'commodity':
      return 'سلعة/معدن';
    default:
      return 'أصل';
  }
}

function statusAr(status: EventStatus): string {
  switch (status) {
    case 'upcoming':
      return 'متوقع';
    case 'announced':
      return 'معلن';
    case 'beat':
      return 'تفوق على التوقعات';
    case 'miss':
      return 'أقل من التوقعات';
    case 'inline':
      return 'مطابق للتوقعات';
    case 'suspended':
      return 'إيقاف';
    case 'delisted':
      return 'شطب';
    default:
      return '—';
  }
}

function buildId(parts: Array<string | number | null | undefined>): string {
  return parts
    .map((p) => String(p ?? '').trim())
    .filter(Boolean)
    .join(':')
    .replace(/\s+/g, '_');
}

function parseQuarterYear(raw: unknown): { quarter: string; year: number } | null {
  const value = String(raw || '').trim();
  if (!value) return null;

  const p1 = value.match(/(\d)Q(\d{4})/i);
  if (p1) {
    return { quarter: `Q${p1[1]}`, year: Number.parseInt(p1[2], 10) };
  }

  const p2 = value.match(/Q(\d)\s*(\d{4})/i);
  if (p2) {
    return { quarter: `Q${p2[1]}`, year: Number.parseInt(p2[2], 10) };
  }

  return null;
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(String(value || '').trim());
}

function getLocalSymbolName(symbol: string, market?: string | null): string | null {
  const db = LOCAL_SYMBOL_DB as Record<string, { n?: string }>;
  const normalized = normalizeSymbol(symbol);
  const marketUpper = String(market || '').toUpperCase().trim();
  if (!normalized) return null;

  const direct = db[normalized]?.n;
  if (direct) return direct;

  const suffixCandidates: string[] = [];
  if (/^\d{3,5}$/.test(normalized)) {
    if (marketUpper.includes('TADAWUL') || marketUpper.includes('SAUDI') || marketUpper.includes('TASI')) {
      suffixCandidates.push(`${normalized}.SR`);
    } else if (marketUpper.includes('ADX')) {
      suffixCandidates.push(`${normalized}.AD`);
    } else if (marketUpper.includes('DFM') || marketUpper.includes('DUBAI')) {
      suffixCandidates.push(`${normalized}.DU`);
    } else if (marketUpper.includes('KSE') || marketUpper.includes('KUWAIT')) {
      suffixCandidates.push(`${normalized}.KW`);
    } else if (marketUpper.includes('QSE') || marketUpper.includes('QATAR')) {
      suffixCandidates.push(`${normalized}.QA`);
    } else if (marketUpper.includes('BHB') || marketUpper.includes('BAHRAIN')) {
      suffixCandidates.push(`${normalized}.BH`);
    } else {
      suffixCandidates.push(
        `${normalized}.SR`,
        `${normalized}.AD`,
        `${normalized}.DU`,
        `${normalized}.KW`,
        `${normalized}.QA`,
        `${normalized}.BH`,
      );
    }
  }

  for (const candidate of suffixCandidates) {
    if (db[candidate]?.n) return db[candidate]?.n || null;
  }

  const base = normalized
    .replace(/=X$/i, '')
    .replace(/-USD$/i, '')
    .replace(/\.(SR|AD|DU|KW|QA|BH|OM|CA|JO|L)$/i, '');

  if (base && db[base]?.n) return db[base]?.n || null;

  const keyed = Object.entries(db).find(([sym]) => normalizeSymbol(sym) === normalized);
  if (keyed?.[1]?.n) return keyed[1].n || null;
  return null;
}

function normalizeSourceUrl(url: string): string {
  const raw = String(url || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`.toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

function isLandingOrSearchSource(url: string): boolean {
  const value = String(url || '').toLowerCase();
  const isYahooGenericQuote = /finance\.yahoo\.com\/quote\/[^/?#]+(?:\?.*)?$/.test(value);
  return (
    value.includes('news.google.com/search') ||
    value.includes('google.com/search') ||
    value.includes('/search?') ||
    value.includes('/search/') ||
    value.includes('/lookup') ||
    value.includes('tradingview.com/symbols/') ||
    value.includes('investing.com/search') ||
    isYahooGenericQuote
  );
}

function scoreSourceLink(link: SourceLink, eventType?: EventType): number {
  const label = String(link.label || '').toLowerCase();
  const url = String(link.url || '').toLowerCase();
  let score = 0;

  if (/الخبر|خبر|article|news/i.test(label)) score += 80;
  if (/yahoo earnings|earnings calendar|corporate actions|dividends|nasdaq earnings/i.test(label)) score += 60;
  if (/\/market-activity\/stocks\/.+\/earnings/.test(url)) score += 70;
  if (/\/analysis\?p=|\/history\?p=|\/analysis\/|\/history\//.test(url)) score += 55;
  if (/\/news\/|\/article|\/story/.test(url)) score += 50;
  if (/finance\.yahoo\.com\/quote\//.test(url)) score += 22;

  if ((eventType === 'earnings_expected' || eventType === 'earnings_actual') && /earnings|analysis/.test(url + label)) score += 18;
  if (eventType === 'dividend' && /dividend|history/.test(url + label)) score += 16;
  if ((eventType === 'split' || eventType === 'reverse_split') && /split/.test(url + label)) score += 16;
  if ((eventType === 'bonus_issue' || eventType === 'rights_issue') && /bonus|rights|منحة|أولوية/.test(url + label)) score += 16;

  if (/google news/.test(label) || url.includes('news.google.com/search')) score -= 20;
  if (isLandingOrSearchSource(url)) score -= 40;
  return score;
}

function normalizeSourceLinks(links: SourceLink[], eventType?: EventType): SourceLink[] {
  const unique = new Map<string, { link: SourceLink; score: number }>();
  for (const link of links) {
    const label = String(link.label || '').trim();
    const url = String(link.url || '').trim();
    if (!label || !url || !looksLikeUrl(url)) continue;
    const key = normalizeSourceUrl(url);
    if (!key) continue;
    const scoredLink = { label, url };
    const score = scoreSourceLink(scoredLink, eventType);
    const current = unique.get(key);
    if (!current || score > current.score) {
      unique.set(key, { link: scoredLink, score });
    }
  }
  return [...unique.values()]
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.link);
}

function selectPrimaryUrl(links: SourceLink[], eventType?: EventType): string | undefined {
  return normalizeSourceLinks(links, eventType)[0]?.url;
}

function parseUrlsFromText(text: string | null | undefined): string[] {
  const value = String(text || '').trim();
  if (!value) return [];
  const matches = value.match(/https?:\/\/[^\s)]+/gi) || [];
  const unique = new Set<string>();
  for (const raw of matches) {
    const url = String(raw || '').trim().replace(/[)\],.;،]+$/g, '');
    if (looksLikeUrl(url)) unique.add(url);
  }
  return [...unique];
}

function buildSourceLinks(
  asset: NormalizedAsset,
  eventType: EventType,
  custom: SourceLink[] = []
): SourceLink[] {
  const symbol = resolveYahooSymbol(asset) || normalizeSymbol(asset.symbol);
  const links: SourceLink[] = [...custom];

  if (symbol) {
    links.push({ label: 'Yahoo Finance', url: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}` });
    links.push({ label: 'TradingView', url: `https://www.tradingview.com/symbols/${encodeURIComponent(symbol.replace('.', '-'))}/` });
    links.push({ label: 'Investing', url: `https://www.investing.com/search/?q=${encodeURIComponent(symbol)}` });
    links.push({ label: 'Google News', url: `https://news.google.com/search?q=${encodeURIComponent(symbol)}` });
  }

  if (eventType === 'earnings_expected' || eventType === 'earnings_actual') {
    const usLike = /^[A-Z]{1,5}$/.test(symbol);
    if (usLike) {
      links.push({
        label: 'Nasdaq Earnings',
        url: `https://www.nasdaq.com/market-activity/stocks/${encodeURIComponent(symbol.toLowerCase())}/earnings`,
      });
    }
    links.push({
      label: 'Google News (Earnings)',
      url: `https://news.google.com/search?q=${encodeURIComponent(`${symbol} earnings`)}`,
    });
  }

  if (eventType === 'split' || eventType === 'reverse_split') {
    links.push({
      label: 'Google News (Split)',
      url: `https://news.google.com/search?q=${encodeURIComponent(`${symbol} stock split`)}`,
    });
  }

  if (eventType === 'bonus_issue') {
    links.push({
      label: 'Google News (Bonus)',
      url: `https://news.google.com/search?q=${encodeURIComponent(`${symbol} bonus shares`)}`,
    });
    links.push({
      label: 'Google News (منحة)',
      url: `https://news.google.com/search?q=${encodeURIComponent(`${symbol} منحة أسهم`)}`,
    });
  }

  if (eventType === 'rights_issue') {
    links.push({
      label: 'Google News (Rights Issue)',
      url: `https://news.google.com/search?q=${encodeURIComponent(`${symbol} rights issue`)}`,
    });
    links.push({
      label: 'Google News (حقوق أولوية)',
      url: `https://news.google.com/search?q=${encodeURIComponent(`${symbol} حقوق أولوية`)}`,
    });
  }

  if (symbol.endsWith('.SR')) {
    links.push({
      label: 'تداول - أخبار وإعلانات',
      url: 'https://www.saudiexchange.sa/wps/portal/saudiexchange/newsandreports/issuer-news',
    });
    links.push({
      label: 'أرقام',
      url: `https://www.argaam.com/ar/search?keyword=${encodeURIComponent(symbol.replace('.SR', ''))}`,
    });
    links.push({
      label: 'مباشر',
      url: `https://www.mubasher.info/ar/search?query=${encodeURIComponent(symbol.replace('.SR', ''))}`,
    });
  }

  return normalizeSourceLinks(links, eventType);
}

function enrichAssetsWithNames(assets: NormalizedAsset[], quotesMap: Map<string, QuoteLite>): NormalizedAsset[] {
  return assets.map((asset) => {
    const quote = resolveQuoteForAsset(asset, quotesMap);
    const quoteName = String(quote?.longName || quote?.shortName || '').trim();
    const localName = getLocalSymbolName(asset.symbol, asset.market) || '';
    const currentName = String(asset.name || '').trim();
    const needsFallback =
      !currentName ||
      currentName === asset.symbol ||
      currentName.toLowerCase() === 'unknown';

    const nextName = needsFallback
      ? (quoteName || localName || asset.symbol)
      : currentName;

    return { ...asset, name: nextName };
  });
}

function calcSurprise(expected: number | null, actual: number | null): EarningsCalculation {
  if (expected == null || actual == null) return { surprise: null, surprisePct: null, result: null };
  const surprise = actual - expected;
  const surprisePct = Math.abs(expected) > 0 ? (surprise / Math.abs(expected)) * 100 : 0;
  const result = surprise > 0.01 ? 'beat' : surprise < -0.01 ? 'miss' : 'inline';
  return { surprise, surprisePct, result };
}

async function fetchYahooJson(pathname: string): Promise<unknown | null> {
  for (const host of YAHOO_HOSTS) {
    try {
      const res = await fetch(`https://${host}${pathname}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PortfolioHub/1.0)',
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;
      return await res.json();
    } catch {
      continue;
    }
  }
  return null;
}

async function mapWithLimit<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];

  const out: R[] = new Array(items.length);
  let cursor = 0;
  const pool = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) break;
      out[index] = await worker(items[index], index);
    }
  });
  await Promise.all(pool);
  return out;
}

function mergeAssetCandidates(candidates: NormalizedAsset[]): NormalizedAsset[] {
  const merged = new Map<string, NormalizedAsset>();

  for (const item of candidates) {
    if (!item.symbol) continue;
    const key = item.symbol;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...item, sources: [...new Set(item.sources)] });
      continue;
    }

    const nextType = existing.assetType === 'unknown' && item.assetType !== 'unknown'
      ? item.assetType
      : existing.assetType;
    const nextName = existing.name === existing.symbol && item.name && item.name !== item.symbol
      ? item.name
      : existing.name;
    const nextMarket = existing.market || item.market || null;
    merged.set(key, {
      symbol: existing.symbol,
      name: nextName,
      assetType: nextType,
      market: nextMarket,
      sources: [...new Set([...existing.sources, ...item.sources])],
    });
  }

  return [...merged.values()]
    .slice(0, MAX_ASSETS)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

function supportsCorporateActions(assetType: AssetType): boolean {
  return assetType === 'stock' || assetType === 'fund' || assetType === 'bond' || assetType === 'sukuk';
}

function supportsEarnings(assetType: AssetType): boolean {
  return assetType === 'stock' || assetType === 'fund';
}

function supportsListingStatus(assetType: AssetType): boolean {
  return assetType === 'stock' || assetType === 'fund' || assetType === 'bond' || assetType === 'sukuk';
}

async function readUserAssets(userId: string): Promise<NormalizedAsset[]> {
  const portfolios = await db.portfolio.findMany({
    where: { userId },
    include: {
      stocks: {
        select: {
          symbol: true,
          name: true,
          exchange: { select: { code: true } },
          sector: true,
        },
      },
      bonds: {
        select: {
          symbol: true,
          name: true,
          type: true,
        },
      },
      funds: {
        select: {
          symbol: true,
          name: true,
          fundType: true,
        },
      },
    },
  });

  const watchlists = await db.watchlist.findMany({
    where: { userId },
    include: { items: { select: { symbol: true, name: true, market: true } } },
  });

  const items: NormalizedAsset[] = [];

  for (const p of portfolios) {
    for (const s of p.stocks) {
      const symbol = normalizeSymbol(s.symbol);
      if (!symbol) continue;
      const exchangeCode = s.exchange?.code?.toUpperCase() || '';
      const byExchange =
        exchangeCode.includes('FOREX')
          ? 'forex'
          : exchangeCode.includes('CRYPTO')
            ? 'crypto'
            : inferAssetTypeBySymbol(symbol, exchangeCode || s.sector || null);

      items.push({
        symbol,
        name: s.name || symbol,
        assetType: byExchange,
        market: exchangeCode || null,
        sources: ['portfolio'],
      });
    }

    for (const b of p.bonds) {
      const symbol = normalizeSymbol(b.symbol);
      if (!symbol) continue;
      items.push({
        symbol,
        name: b.name || symbol,
        assetType: String(b.type || '').toLowerCase() === 'sukuk' ? 'sukuk' : 'bond',
        market: String(b.type || '').toLowerCase() || null,
        sources: ['portfolio'],
      });
    }

    for (const f of p.funds) {
      const symbol = normalizeSymbol(f.symbol || f.name);
      if (!symbol) continue;
      const type = String(f.fundType || '').toLowerCase();
      items.push({
        symbol,
        name: f.name || symbol,
        assetType: type === 'commodities' || type === 'commodity' ? 'commodity' : 'fund',
        market: type || null,
        sources: ['portfolio'],
      });
    }
  }

  for (const wl of watchlists) {
    for (const item of wl.items) {
      const symbol = normalizeSymbol(item.symbol);
      if (!symbol) continue;
      const market = item.market || null;
      items.push({
        symbol,
        name: item.name || symbol,
        assetType: inferAssetTypeBySymbol(symbol, market),
        market,
        sources: ['watchlist'],
      });
    }
  }

  return items;
}

function normalizeRequestAssets(raw: unknown[]): NormalizedAsset[] {
  const out: NormalizedAsset[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as AssetInput;
    const symbol = normalizeSymbol(item.symbol);
    if (!symbol) continue;

    const market = item.market ? String(item.market) : null;
    const hintedType = normalizeAssetType(item.assetType);
    const inferredType = inferAssetTypeBySymbol(symbol, market);

    out.push({
      symbol,
      name: String(item.name || symbol).trim() || symbol,
      assetType: hintedType === 'unknown' ? inferredType : hintedType,
      market,
      sources: [item.source ? String(item.source) : 'request'],
    });
  }

  return out;
}

function buildQuoteCandidates(asset: NormalizedAsset): string[] {
  const base = normalizeSymbol(asset.symbol);
  const preferredYahoo = resolveYahooSymbol(asset);
  if (!base) return [];
  const set = new Set<string>([base]);

  if (preferredYahoo && preferredYahoo !== base) {
    set.add(preferredYahoo);
  }

  if (asset.assetType === 'crypto' && !base.includes('-')) {
    set.add(`${base}-USD`);
  }
  if (asset.assetType === 'forex' && !base.endsWith('=X') && /^[A-Z]{6}$/.test(base)) {
    set.add(`${base}=X`);
  }
  if (base.endsWith('.SR') && /^\d{3,5}\.SR$/.test(base)) {
    set.add(base.replace(/\.SR$/i, ''));
  }

  return [...set];
}

async function fetchQuotesMap(symbols: string[]): Promise<Map<string, QuoteLite>> {
  const map = new Map<string, QuoteLite>();
  const unique = [...new Set(symbols.map((s) => normalizeSymbol(s)).filter(Boolean))];
  if (unique.length === 0) return map;

  for (let i = 0; i < unique.length; i += 40) {
    const batch = unique.slice(i, i + 40);
    const payload = await fetchYahooJson(`/v7/finance/quote?symbols=${encodeURIComponent(batch.join(','))}`);
    const rows = (payload as { quoteResponse?: { result?: QuoteLite[] } })?.quoteResponse?.result;
    if (!Array.isArray(rows)) continue;

    for (const row of rows) {
      const sym = normalizeSymbol(row?.symbol);
      if (!sym) continue;
      map.set(sym, row);
    }
  }

  return map;
}

async function fetchChartHint(symbol: string): Promise<string> {
  const key = normalizeSymbol(symbol);
  const cached = chartHintCache.get(key);
  if (isFresh(cached)) return cached.value;

  const payload = await fetchYahooJson(`/v8/finance/chart/${encodeURIComponent(key)}?interval=1d&range=1mo`);
  const hint = String((payload as { chart?: { error?: { description?: string } } })?.chart?.error?.description || '').trim();
  chartHintCache.set(key, { value: hint, timestamp: Date.now() });
  return hint;
}

async function checkYahooSearchSymbol(symbol: string): Promise<boolean> {
  const payload = await fetchYahooJson(
    `/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=10&newsCount=0`
  );
  const quotes = (payload as { quotes?: Array<{ symbol?: string }> })?.quotes;
  if (!Array.isArray(quotes)) return false;
  const target = normalizeSymbol(symbol);
  return quotes.some((q) => normalizeSymbol(q.symbol) === target);
}

async function checkFmpSymbol(symbol: string): Promise<boolean | null> {
  const key = process.env.FMP_API_KEY;
  if (!key) return null;
  try {
    const url = `https://financialmodelingprep.com/stable/search-symbol?query=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!res.ok) return false;
    const rows = await res.json();
    if (!Array.isArray(rows)) return false;
    const target = normalizeSymbol(symbol);
    return rows.some((item) => normalizeSymbol(item?.symbol) === target);
  } catch {
    return false;
  }
}

async function checkAlphaSymbol(symbol: string): Promise<boolean | null> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return null;
  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!res.ok) return false;
    const json = await res.json();
    const rows = Array.isArray(json?.bestMatches) ? json.bestMatches : [];
    const target = normalizeSymbol(symbol);
    return rows.some((item: Record<string, string>) => normalizeSymbol(item?.['1. symbol']) === target);
  } catch {
    return false;
  }
}

async function checkTwelveSymbol(symbol: string): Promise<boolean | null> {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) return null;
  try {
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!res.ok) return false;
    const q = await res.json();
    if (q?.status === 'error') return false;
    return q?.symbol || q?.name || q?.close ? true : false;
  } catch {
    return false;
  }
}

async function verifyTrustedSources(symbol: string): Promise<{ checked: string[]; available: string[] }> {
  const key = normalizeSymbol(symbol);
  const cached = verifyCache.get(key);
  if (isFresh(cached)) return cached.value;

  const checked: string[] = [];
  const available: string[] = [];

  const yahooFound = await checkYahooSearchSymbol(key);
  checked.push(TRUSTED_SOURCE_LABELS.yahoo);
  if (yahooFound) available.push(TRUSTED_SOURCE_LABELS.yahoo);

  const [alpha, fmp, twelve] = await Promise.all([
    checkAlphaSymbol(key),
    checkFmpSymbol(key),
    checkTwelveSymbol(key),
  ]);

  if (alpha != null) {
    checked.push(TRUSTED_SOURCE_LABELS.alpha);
    if (alpha) available.push(TRUSTED_SOURCE_LABELS.alpha);
  }
  if (fmp != null) {
    checked.push(TRUSTED_SOURCE_LABELS.fmp);
    if (fmp) available.push(TRUSTED_SOURCE_LABELS.fmp);
  }
  if (twelve != null) {
    checked.push(TRUSTED_SOURCE_LABELS.twelve);
    if (twelve) available.push(TRUSTED_SOURCE_LABELS.twelve);
  }

  const result = { checked: [...new Set(checked)], available: [...new Set(available)] };
  verifyCache.set(key, { value: result, timestamp: Date.now() });
  return result;
}

function toListingStatusActive(
  asset: NormalizedAsset,
  reasonAr: string,
  source = 'Trusted Sources',
  quote?: QuoteLite
): ListingHealth {
  const resolvedCurrency = resolveAssetCurrency(asset, quote);
  return {
    symbol: asset.symbol,
    name: asset.name,
    assetType: asset.assetType,
    assetTypeAr: assetTypeAr(asset.assetType),
    assetSources: normalizeAssetSources(asset.sources),
    currency: resolvedCurrency.code,
    currencySymbol: resolvedCurrency.symbol,
    status: 'active',
    statusAr: 'نشط',
    reasonAr,
    source,
  };
}

async function evaluateListingStatus(
  asset: NormalizedAsset,
  quote: QuoteLite | undefined,
  chartHint: string
): Promise<ListingHealth> {
  if (!supportsListingStatus(asset.assetType)) {
    return toListingStatusActive(
      asset,
      'هذا الأصل (فوركس/كريبتو/سلعة) لا يخضع لتصنيف شطب/إيقاف إدراج في هذا المركز.',
      'Portfolio Rules'
    );
  }

  const resolvedCurrency = resolveAssetCurrency(asset, quote);
  const normalizedSources = normalizeAssetSources(asset.sources);

  const marketState = String(quote?.marketState || '').toUpperCase();
  const exchange = String(quote?.fullExchangeName || quote?.exchange || '').trim() || 'السوق';
  const quoteType = String(quote?.quoteType || '').toUpperCase();
  const hint = String(chartHint || '').trim();
  const hasStrongDelistHint = /symbol may be delisted|possibly delisted|no data found, symbol may be delisted/i.test(hint);

  const isHalted = marketState.includes('HALT') || marketState.includes('SUSPEND');
  const isUnavailable = !quote || quoteType === 'NONE';
  const hasPrice = Number.isFinite(Number(quote?.regularMarketPrice)) && Number(quote?.regularMarketPrice) > 0;
  const nonTradeableNoPrice = quote?.tradeable === false && !hasPrice;

  if (!isUnavailable && hasPrice && !isHalted) {
    return toListingStatusActive(asset, `الرمز متاح ويتداول على ${exchange}.`, 'Yahoo Finance', quote);
  }

  if (isHalted || nonTradeableNoPrice) {
    const reasonAr = isHalted
      ? `السوق يشير إلى حالة إيقاف (${marketState || 'HALTED'}).`
      : 'الأصل غير قابل للتداول حالياً ولا يظهر له سعر سوقي مباشر.';
    return {
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.assetType,
      assetTypeAr: assetTypeAr(asset.assetType),
      assetSources: normalizedSources,
      currency: resolvedCurrency.code,
      currencySymbol: resolvedCurrency.symbol,
      status: 'suspended',
      statusAr: 'موقوف',
      reasonAr,
      reasonEn: marketState || undefined,
      source: 'Yahoo Finance',
    };
  }

  const verification = await verifyTrustedSources(asset.symbol);
  if (verification.available.length > 0) {
    return toListingStatusActive(
      asset,
      `الرمز ما زال موجوداً في مصادر موثوقة: ${verification.available.join('، ')}.`,
      verification.available[0],
      quote
    );
  }

  // لا نُصدر حكم "شطب" إلا عند وجود إشارة قوية + تحقق متعدد المصادر.
  if (hasStrongDelistHint && verification.checked.length >= 2) {
    return {
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.assetType,
      assetTypeAr: assetTypeAr(asset.assetType),
      assetSources: normalizedSources,
      currency: resolvedCurrency.code,
      currencySymbol: resolvedCurrency.symbol,
      status: 'delisted',
      statusAr: 'مشطوب/غير مدرج',
      reasonAr: `تم رصد إشارة شطب قوية من المزود الأساسي (${hint}) مع عدم العثور على الرمز في المصادر الموثوقة التالية: ${verification.checked.join('، ')}.`,
      reasonEn: hint || undefined,
      source: verification.checked.join(' + '),
    };
  }

  // عدم كفاية الأدلة: لا نعتبره مشطوبًا.
  return {
    symbol: asset.symbol,
    name: asset.name,
    assetType: asset.assetType,
    assetTypeAr: assetTypeAr(asset.assetType),
    assetSources: normalizedSources,
    currency: resolvedCurrency.code,
    currencySymbol: resolvedCurrency.symbol,
    status: 'unverified',
    statusAr: 'غير مؤكد',
    reasonAr: verification.checked.length > 0
      ? `تعذر تأكيد حالة الإدراج بدقة. لم يتم العثور على دليل كافٍ للشطب من المصادر الموثوقة (${verification.checked.join('، ')}).`
      : 'تعذر التحقق من حالة الإدراج حالياً. لم نعتبر الرمز مشطوباً لتجنب الإنذار الخاطئ.',
    reasonEn: hint || undefined,
    source: verification.checked.length > 0 ? verification.checked.join(' + ') : 'Trusted Sources',
  };
}

function listingToEvent(health: ListingHealth): UnifiedEvent | null {
  if (health.status !== 'suspended' && health.status !== 'delisted') return null;

  const isSuspended = health.status === 'suspended';
  const links = buildSourceLinks(
    {
      symbol: health.symbol,
      name: health.name,
      assetType: health.assetType,
      market: null,
      sources: health.assetSources,
    },
    isSuspended ? 'suspension' : 'delisting'
  );
  return {
    id: buildId(['listing', health.symbol, health.status, todayIso()]),
    symbol: health.symbol,
    name: health.name,
    assetType: health.assetType,
    assetTypeAr: health.assetTypeAr,
    assetSources: health.assetSources,
    eventCategory: 'listing_status',
    eventType: isSuspended ? 'suspension' : 'delisting',
    eventTypeAr: isSuspended ? 'إيقاف تداول' : 'شطب/إلغاء إدراج',
    titleAr: isSuspended ? 'تنبيه إيقاف تداول' : 'تنبيه شطب أو عدم إدراج',
    subtitleAr: health.reasonAr,
    date: todayIso(),
    datePrecision: 'exact',
    status: isSuspended ? 'suspended' : 'delisted',
    statusAr: isSuspended ? 'إيقاف' : 'شطب',
    source: health.source,
    currency: health.currency,
    currencySymbol: health.currencySymbol,
    importance: isSuspended ? 97 : 99,
    url: selectPrimaryUrl(links, isSuspended ? 'suspension' : 'delisting'),
    sourceLinks: links,
    reasonAr: health.reasonAr,
    reasonEn: health.reasonEn,
    details: {
      listingStatus: health.status,
    },
  };
}

async function fetchCorporateActionEvents(
  asset: NormalizedAsset,
  resolvedCurrency: { code: string; symbol: string },
  quote?: QuoteLite
): Promise<UnifiedEvent[]> {
  const key = asset.symbol;
  const yahooSymbol = resolveYahooSymbol(asset) || asset.symbol;
  const cached = corporateCache.get(key);
  if (isFresh(cached)) return cached.value;

  const assetSources = normalizeAssetSources(asset.sources);
  const [splitsData, divsData, dbDividendHistory, dbMarketData] = await Promise.all([
    fetchYahooJson(`/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=max&events=splits`),
    fetchYahooJson(`/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5y&events=div`),
    readDividendHistoryFromDb(asset),
    readMarketDataSnapshotFromDb(asset.symbol),
  ]);

  const splitCurrency =
    String((splitsData as { chart?: { result?: Array<{ meta?: { currency?: string } }> } })?.chart?.result?.[0]?.meta?.currency || '')
      .toUpperCase()
      .trim() || resolvedCurrency.code;
  const divCurrency =
    String((divsData as { chart?: { result?: Array<{ meta?: { currency?: string } }> } })?.chart?.result?.[0]?.meta?.currency || '')
      .toUpperCase()
      .trim() || resolvedCurrency.code;

  const out: UnifiedEvent[] = [];
  const quoteMetrics = getDividendMarketMetrics(quote);
  const marketMetrics = {
    currentPrice: quoteMetrics.currentPrice ?? dbMarketData?.price ?? null,
    week52High: quoteMetrics.week52High ?? dbMarketData?.week52High ?? null,
    week52Low: quoteMetrics.week52Low ?? dbMarketData?.week52Low ?? null,
    volume: quoteMetrics.volume ?? dbMarketData?.volume ?? null,
    avgVolume: quoteMetrics.avgVolume ?? null,
    marketCap: quoteMetrics.marketCap ?? dbMarketData?.marketCap ?? null,
    pricePositionPct: quoteMetrics.pricePositionPct,
  };
  if (
    marketMetrics.pricePositionPct == null &&
    marketMetrics.currentPrice != null &&
    marketMetrics.week52Low != null &&
    marketMetrics.week52High != null &&
    marketMetrics.week52High > marketMetrics.week52Low
  ) {
    const raw = ((marketMetrics.currentPrice - marketMetrics.week52Low) / (marketMetrics.week52High - marketMetrics.week52Low)) * 100;
    marketMetrics.pricePositionPct = Math.max(0, Math.min(100, raw));
  }
  const splits = (splitsData as { chart?: { result?: Array<{ events?: { splits?: Record<string, Record<string, unknown>> } }> } })
    ?.chart?.result?.[0]?.events?.splits;

  if (splits) {
    for (const split of Object.values(splits)) {
      const date = toIsoDate(split.date);
      if (!date) continue;
      const numerator = Number(split.numerator) || 1;
      const denominator = Number(split.denominator) || 1;
      const isReverse = numerator < denominator;
      const ratio = isReverse ? `${denominator}:${numerator}` : `${numerator}:${denominator}`;
      const eventType: EventType = isReverse ? 'reverse_split' : 'split';
      const links = buildSourceLinks(asset, eventType, [
        {
          label: 'Yahoo Corporate Actions',
          url: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}/history?p=${encodeURIComponent(yahooSymbol)}`,
        },
      ]);

      out.push({
        id: buildId(['ca', asset.symbol, eventType, date, ratio]),
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.assetType,
        assetTypeAr: assetTypeAr(asset.assetType),
        assetSources,
        eventCategory: 'corporate_action',
        eventType,
        eventTypeAr: isReverse ? 'تقسيم عكسي' : 'تقسيم أسهم',
        titleAr: isReverse ? 'إجراء تقسيم عكسي' : 'إجراء تقسيم أسهم',
        subtitleAr: `نسبة التقسيم ${ratio}.`,
        date,
        datePrecision: 'exact',
        status: 'announced',
        statusAr: statusAr('announced'),
        source: 'Yahoo Finance + Market Sources',
        currency: splitCurrency,
        currencySymbol: currencySymbol(splitCurrency),
        importance: isReverse ? 86 : 82,
        url: selectPrimaryUrl(links, eventType),
        sourceLinks: links,
        details: {
          ratio,
          ratioFrom: isReverse ? numerator : denominator,
          ratioTo: isReverse ? denominator : numerator,
        },
      });
    }
  }

  const divs = (divsData as { chart?: { result?: Array<{ events?: { dividends?: Record<string, Record<string, unknown>> } }> } })
    ?.chart?.result?.[0]?.events?.dividends;
  const apiDividendHistory: DividendHistoryEntry[] = [];
  if (divs) {
    for (const div of Object.values(divs)) {
      const date = toIsoDate(div.date);
      const amount = toFiniteNumber(div.amount);
      if (!date || amount == null) continue;
      apiDividendHistory.push({
        date,
        amount,
        paymentDate: null,
        source: 'api',
      });
    }
  }

  const mergedDividendHistory = mergeDividendHistory(apiDividendHistory, dbDividendHistory);
  const dividendProfile = buildDividendProfile(mergedDividendHistory, quote);

  if (mergedDividendHistory.length > 0) {
    for (const row of mergedDividendHistory.slice(0, 24)) {
      const amount = row.amount;
      const links = buildSourceLinks(asset, 'dividend', [
        {
          label: 'Yahoo Dividends',
          url: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}/history?p=${encodeURIComponent(yahooSymbol)}`,
        },
      ]);
      const sourceLabel = row.source === 'db'
        ? 'قاعدة بيانات التوزيعات بالمشروع + Market Sources'
        : 'Yahoo Finance + Market Sources';

      out.push({
        id: buildId(['ca', asset.symbol, 'dividend', row.date, amount.toFixed(6)]),
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.assetType,
        assetTypeAr: assetTypeAr(asset.assetType),
        assetSources,
        eventCategory: 'corporate_action',
        eventType: 'dividend',
        eventTypeAr: 'توزيع نقدي',
        titleAr: 'توزيعات نقدية',
        subtitleAr: buildDividendSubtitle(amount, divCurrency, dividendProfile, false),
        date: row.date,
        datePrecision: 'exact',
        status: 'announced',
        statusAr: statusAr('announced'),
        source: sourceLabel,
        currency: divCurrency,
        currencySymbol: currencySymbol(divCurrency),
        importance: 72,
        url: selectPrimaryUrl(links, 'dividend'),
        sourceLinks: links,
        details: {
          amount,
          currency: divCurrency,
          currentPrice: marketMetrics.currentPrice,
          week52High: marketMetrics.week52High,
          week52Low: marketMetrics.week52Low,
          pricePositionPct: marketMetrics.pricePositionPct,
          volume: marketMetrics.volume,
          avgVolume: marketMetrics.avgVolume,
          marketCap: marketMetrics.marketCap,
          dividendFrequency: dividendProfile.frequency,
          dividendFrequencyAr: dividendProfile.frequencyAr,
          dividendAnnual: dividendProfile.annualDividend,
          dividendLast12m: dividendProfile.last12mDividend,
          dividendAverage: dividendProfile.averageDividend,
          dividendHistoryCount: dividendProfile.historyCount,
          dividendYieldPct: dividendProfile.yieldPct,
          payoutRatioPct: dividendProfile.payoutRatioPct,
          nextExDate: dividendProfile.nextExDate,
          nextPaymentDate: dividendProfile.nextPaymentDate,
          cacheSource: row.source,
        },
      });
    }
  }

  if (dividendProfile.nextExDate && dividendProfile.nextExDate >= todayIso()) {
    const existsByDate = out.some(
      (event) => event.eventType === 'dividend' && event.date === dividendProfile.nextExDate
    );

    if (!existsByDate) {
      const paymentsPerYear = expectedPaymentsPerYear(dividendProfile.frequency);
      const projectedAmount =
        dividendProfile.annualDividend != null && paymentsPerYear != null && paymentsPerYear > 0
          ? dividendProfile.annualDividend / paymentsPerYear
          : mergedDividendHistory[0]?.amount ?? null;
      const links = buildSourceLinks(asset, 'dividend', [
        {
          label: 'Yahoo Quote',
          url: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}?p=${encodeURIComponent(yahooSymbol)}`,
        },
      ]);

      out.push({
        id: buildId(['ca', asset.symbol, 'dividend_upcoming', dividendProfile.nextExDate, projectedAmount ?? 'na']),
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.assetType,
        assetTypeAr: assetTypeAr(asset.assetType),
        assetSources,
        eventCategory: 'corporate_action',
        eventType: 'dividend',
        eventTypeAr: 'توزيع نقدي',
        titleAr: 'توزيع نقدي قادم',
        subtitleAr: buildDividendSubtitle(projectedAmount, divCurrency, dividendProfile, true),
        date: dividendProfile.nextExDate,
        datePrecision: 'exact',
        status: 'upcoming',
        statusAr: statusAr('upcoming'),
        source: 'Yahoo Quote + Dividend Cache',
        currency: divCurrency,
        currencySymbol: currencySymbol(divCurrency),
        importance: 85,
        url: selectPrimaryUrl(links, 'dividend'),
        sourceLinks: links,
        details: {
          amount: projectedAmount,
          currency: divCurrency,
          currentPrice: marketMetrics.currentPrice,
          week52High: marketMetrics.week52High,
          week52Low: marketMetrics.week52Low,
          pricePositionPct: marketMetrics.pricePositionPct,
          volume: marketMetrics.volume,
          avgVolume: marketMetrics.avgVolume,
          marketCap: marketMetrics.marketCap,
          dividendFrequency: dividendProfile.frequency,
          dividendFrequencyAr: dividendProfile.frequencyAr,
          dividendAnnual: dividendProfile.annualDividend,
          dividendLast12m: dividendProfile.last12mDividend,
          dividendAverage: dividendProfile.averageDividend,
          dividendHistoryCount: dividendProfile.historyCount,
          dividendYieldPct: dividendProfile.yieldPct,
          payoutRatioPct: dividendProfile.payoutRatioPct,
          nextExDate: dividendProfile.nextExDate,
          nextPaymentDate: dividendProfile.nextPaymentDate,
          projectedFromQuote: true,
        },
      });
    }
  }

  if (apiDividendHistory.length > 0) {
    await persistDividendHistoryToDb(asset, divCurrency, apiDividendHistory);
  }
  await upsertMarketDataFromQuote(asset, quote);

  const hasSplitEvent = out.some((event) => event.eventType === 'split' || event.eventType === 'reverse_split');
  if (!hasSplitEvent && (asset.assetType === 'stock' || asset.assetType === 'fund')) {
    try {
      out.push(...(await fetchSplitNewsFallbackEvents(asset, resolvedCurrency)));
    } catch {
      // Ignore split news fallback failure to keep core corporate-actions path resilient.
    }
  }

  const sorted = out.sort((a, b) => b.date.localeCompare(a.date));
  corporateCache.set(key, { value: sorted, timestamp: Date.now() });
  return sorted;
}

async function fetchBonusIssueNewsEvents(
  asset: NormalizedAsset,
  resolvedCurrency: { code: string; symbol: string }
): Promise<UnifiedEvent[]> {
  const key = asset.symbol;
  const yahooSymbol = resolveYahooSymbol(asset) || asset.symbol;
  const cached = bonusNewsCache.get(key);
  if (isFresh(cached)) return cached.value;

  const queries = [...new Set([
    yahooSymbol,
    `${yahooSymbol} bonus shares`,
    `${yahooSymbol} stock bonus`,
    `${yahooSymbol} rights issue`,
    `${yahooSymbol} منحة أسهم`,
    `${yahooSymbol} حقوق أولوية`,
    asset.name,
    `${asset.name} bonus shares`,
    `${asset.name} rights issue`,
    `${asset.name} منحة أسهم`,
    `${asset.name} حقوق أولوية`,
  ].map((query) => String(query || '').trim()).filter(Boolean))].slice(0, 8);

  const allNews: Array<{
    title?: string;
    publisher?: string;
    providerPublishTime?: number;
    link?: string;
    uuid?: string;
    query?: string;
  }> = [];

  for (const query of queries) {
    const payload = await fetchYahooJson(
      `/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=1&newsCount=20`
    );
    const news = (payload as {
      news?: Array<{
        title?: string;
        publisher?: string;
        providerPublishTime?: number;
        link?: string;
        uuid?: string;
      }>;
    })?.news;

    if (!Array.isArray(news) || news.length === 0) continue;
    for (const item of news) {
      allNews.push({ ...item, query });
    }
  }

  if (allNews.length === 0) {
    bonusNewsCache.set(key, { value: [], timestamp: Date.now() });
    return [];
  }

  const assetSources = normalizeAssetSources(asset.sources);
  const out: UnifiedEvent[] = [];

  for (const item of allNews) {
    const title = String(item.title || '').trim();
    const titleLower = title.toLowerCase();
    const symbolLower = yahooSymbol.toLowerCase();
    const symbolCore = normalizeSymbolCore(yahooSymbol).toLowerCase();
    const nameLower = asset.name.toLowerCase();
    const symbolLooksLikeWord = /^[a-z]{3,5}$/.test(symbolCore);
    const hasDirectSymbolMention = symbolLooksLikeWord
      ? false
      : titleLower.includes(symbolLower) || titleLower.includes(symbolCore);
    const symbolInTickerContext = new RegExp(`(?:nasdaq|nyse|tadawul|ticker|رمز|سهم)\\s*[:\\-]?\\s*${symbolCore}\\b`, 'i').test(title)
      || new RegExp(`\\b${symbolCore}\\b\\s*(?:stock|shares?|inc\\.?|corp\\.?|co\\.?|سهم)`, 'i').test(title);
    const fullNameInTitle = nameLower.length >= 4 && titleLower.includes(nameLower);
    const nameTokenHits = nameLower
      .split(/\s+/)
      .filter((part) => part.length >= 4)
      .filter((part) => titleLower.includes(part.toLowerCase()))
      .length;
    const relatedToAsset =
      symbolInTickerContext ||
      hasDirectSymbolMention ||
      fullNameInTitle ||
      nameTokenHits >= 2;

    if (!title) continue;
    if (!BONUS_NEWS_REGEX.test(title) && !relatedToAsset) continue;
    if (!relatedToAsset) continue;

    const publishDate = item.providerPublishTime
      ? toIsoDate(item.providerPublishTime)
      : todayIso();
    const publisher = String(item.publisher || 'Yahoo News').trim();
    const isRightsIssue = RIGHTS_ISSUE_REGEX.test(title);
    const eventType: EventType = isRightsIssue ? 'rights_issue' : 'bonus_issue';
    const links = buildSourceLinks(asset, eventType, [
      ...(item.link ? [{ label: `الخبر: ${publisher}`, url: item.link }] : []),
    ]);

    out.push({
      id: buildId(['bonus', asset.symbol, eventType, publishDate, item.uuid || title.slice(0, 50)]),
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.assetType,
      assetTypeAr: assetTypeAr(asset.assetType),
      assetSources,
      eventCategory: 'corporate_action',
      eventType,
      eventTypeAr: isRightsIssue ? 'خبر حقوق أولوية' : 'خبر منح أسهم',
      titleAr: isRightsIssue ? `خبر حقوق أولوية - ${asset.name}` : `خبر منحة أسهم - ${asset.name}`,
      subtitleAr: `${title} | الناشر: ${publisher}`,
      date: publishDate || todayIso(),
      datePrecision: 'exact',
      status: 'announced',
      statusAr: statusAr('announced'),
      source: 'Yahoo News + Google News + Market Sources',
      currency: resolvedCurrency.code,
      currencySymbol: resolvedCurrency.symbol,
      importance: 78,
      url: item.link || selectPrimaryUrl(links, eventType),
      sourceLinks: links,
      details: {
        publisher,
        originalTitle: title,
        query: item.query || null,
      },
    });
  }

  const deduped = [...new Map(out.map((event) => [event.id, event])).values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  bonusNewsCache.set(key, { value: deduped, timestamp: Date.now() });
  return deduped;
}

async function fetchSplitNewsFallbackEvents(
  asset: NormalizedAsset,
  resolvedCurrency: { code: string; symbol: string }
): Promise<UnifiedEvent[]> {
  const yahooSymbol = resolveYahooSymbol(asset) || asset.symbol;
  const queries = [...new Set([
    `${yahooSymbol} stock split`,
    `${yahooSymbol} reverse split`,
    `${asset.name} stock split`,
    `${asset.name} reverse split`,
  ].map((query) => String(query || '').trim()).filter(Boolean))].slice(0, 4);
  const splitRegex = /(reverse stock split|reverse split|stock split|share split|تقسيم عكسي|تقسيم أسهم)/i;
  const reverseRegex = /(reverse split|reverse stock split|تقسيم عكسي)/i;

  const allNews: Array<{
    title?: string;
    publisher?: string;
    providerPublishTime?: number;
    link?: string;
    uuid?: string;
  }> = [];

  for (const query of queries) {
    const payload = await fetchYahooJson(
      `/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=1&newsCount=20`
    );
    const news = (payload as {
      news?: Array<{
        title?: string;
        publisher?: string;
        providerPublishTime?: number;
        link?: string;
        uuid?: string;
      }>;
    })?.news;

    if (!Array.isArray(news) || news.length === 0) continue;
    allNews.push(...news);
  }

  if (allNews.length === 0) return [];

  const assetSources = normalizeAssetSources(asset.sources);
  const symbolLower = yahooSymbol.toLowerCase();
  const symbolCore = normalizeSymbolCore(yahooSymbol).toLowerCase();
  const nameLower = asset.name.toLowerCase();
  const out: UnifiedEvent[] = [];

  for (const item of allNews) {
    const title = String(item.title || '').trim();
    if (!title) continue;
    if (RIGHTS_ISSUE_REGEX.test(title)) continue;

    const titleLower = title.toLowerCase();
    const symbolLooksLikeWord = /^[a-z]{3,5}$/.test(symbolCore);
    const hasDirectSymbolMention = symbolLooksLikeWord
      ? false
      : titleLower.includes(symbolLower) || titleLower.includes(symbolCore);
    const symbolInTickerContext = new RegExp(`(?:nasdaq|nyse|tadawul|ticker|رمز|سهم)\\s*[:\\-]?\\s*${symbolCore}\\b`, 'i').test(title)
      || new RegExp(`\\b${symbolCore}\\b\\s*(?:stock|shares?|inc\\.?|corp\\.?|co\\.?|سهم)`, 'i').test(title);
    const fullNameInTitle = nameLower.length >= 4 && titleLower.includes(nameLower);
    const nameTokenHits = nameLower
      .split(/\s+/)
      .filter((part) => part.length >= 4)
      .filter((part) => titleLower.includes(part.toLowerCase()))
      .length;
    const relatedToAsset =
      symbolInTickerContext ||
      hasDirectSymbolMention ||
      fullNameInTitle ||
      nameTokenHits >= 2;
    if (!relatedToAsset || !splitRegex.test(title)) continue;

    const isReverse = reverseRegex.test(title);
    const type: EventType = isReverse ? 'reverse_split' : 'split';
    const publishDate = item.providerPublishTime ? toIsoDate(item.providerPublishTime) : todayIso();
    const publisher = String(item.publisher || 'Yahoo News').trim();
    const links = buildSourceLinks(asset, type, [
      ...(item.link ? [{ label: `الخبر: ${publisher}`, url: item.link }] : []),
    ]);

    out.push({
      id: buildId(['split_news', asset.symbol, type, publishDate, item.uuid || title.slice(0, 50)]),
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.assetType,
      assetTypeAr: assetTypeAr(asset.assetType),
      assetSources,
      eventCategory: 'corporate_action',
      eventType: type,
      eventTypeAr: isReverse ? 'تقسيم عكسي (خبر)' : 'تقسيم أسهم (خبر)',
      titleAr: isReverse ? `خبر تقسيم عكسي - ${asset.name}` : `خبر تقسيم أسهم - ${asset.name}`,
      subtitleAr: `${title} | الناشر: ${publisher}`,
      date: publishDate || todayIso(),
      datePrecision: 'exact',
      status: 'announced',
      statusAr: statusAr('announced'),
      source: 'Yahoo News + Google News + Market Sources',
      currency: resolvedCurrency.code,
      currencySymbol: resolvedCurrency.symbol,
      importance: isReverse ? 84 : 78,
      url: item.link || selectPrimaryUrl(links, type),
      sourceLinks: links,
      details: {
        publisher,
        originalTitle: title,
        fromNewsFallback: true,
      },
    });
  }

  return [...new Map(out.map((event) => [event.id, event])).values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
}

async function fetchEarningsEvents(
  asset: NormalizedAsset,
  resolvedCurrency: { code: string; symbol: string },
  quote?: QuoteLite
): Promise<UnifiedEvent[]> {
  const key = asset.symbol;
  const yahooSymbol = resolveYahooSymbol(asset) || asset.symbol;
  const cached = earningsCache.get(key);
  if (isFresh(cached)) return cached.value;

  const assetSources = normalizeAssetSources(asset.sources);
  const payload = await fetchYahooJson(
    `/v10/finance/quoteSummary/${encodeURIComponent(yahooSymbol)}?modules=earnings,earningsTrend,calendarEvents,price`
  );

  const result = (payload as { quoteSummary?: { result?: unknown[] } })?.quoteSummary?.result?.[0] as
    | {
        earnings?: { earningsChart?: { quarterly?: Array<Record<string, unknown>> } };
        earningsTrend?: { trend?: Array<Record<string, unknown>> };
        calendarEvents?: {
          earnings?: {
            earningsDate?: Array<{ raw?: number; fmt?: string }>;
            earningsAverage?: { raw?: number };
          };
        };
        price?: { currency?: string; financialCurrency?: string };
      }
    | undefined;

  const earningsCurrency = String(
    result?.price?.financialCurrency ||
    result?.price?.currency ||
    quote?.financialCurrency ||
    quote?.currency ||
    ''
  ).toUpperCase().trim() || resolvedCurrency.code;
  const out: UnifiedEvent[] = [];
  const quarterly = result?.earnings?.earningsChart?.quarterly;
  if (Array.isArray(quarterly)) {
    for (const q of quarterly.slice(-8)) {
      const parsed = parseQuarterYear(q.date);
      if (!parsed) continue;

      const expectedRaw = (q.estimate as { raw?: number })?.raw;
      const actualRaw = (q.actual as { raw?: number })?.raw;
      const expected = expectedRaw ?? (typeof q.estimate === 'number' ? q.estimate : null);
      const actual = actualRaw ?? (typeof q.actual === 'number' ? q.actual : null);

      if (expected == null && actual == null) continue;

      const surpriseCalc = calcSurprise(expected, actual);
      const date = quarterToApproxDate(parsed.quarter, parsed.year);

      const subtitleParts = [
        `الربع ${parsed.quarter} ${parsed.year}`,
        `المتوقع: ${formatNumber(expected, 2)} ${earningsCurrency}`,
        `الفعلي: ${formatNumber(actual, 2)} ${earningsCurrency}`,
      ];
      if (surpriseCalc.surprisePct != null) {
        subtitleParts.push(`المفاجأة: ${formatNumber(surpriseCalc.surprisePct, 2)}%`);
      }
      const links = buildSourceLinks(asset, 'earnings_actual', [
        {
          label: 'Yahoo Earnings',
          url: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}/analysis?p=${encodeURIComponent(yahooSymbol)}`,
        },
      ]);

      out.push({
        id: buildId(['er', asset.symbol, parsed.year, parsed.quarter, 'actual']),
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.assetType,
        assetTypeAr: assetTypeAr(asset.assetType),
        assetSources,
        eventCategory: 'earnings',
        eventType: 'earnings_actual',
        eventTypeAr: 'إعلان أرباح فعلي',
        titleAr: `نتائج ${parsed.quarter} ${parsed.year}`,
        subtitleAr: subtitleParts.join(' | '),
        date,
        datePrecision: 'estimated',
        status: surpriseCalc.result || 'announced',
        statusAr: statusAr(surpriseCalc.result || 'announced'),
        source: 'Yahoo Finance + Earnings Sources',
        currency: earningsCurrency,
        currencySymbol: currencySymbol(earningsCurrency),
        importance: surpriseCalc.result === 'miss' ? 92 : surpriseCalc.result === 'beat' ? 88 : 84,
        url: selectPrimaryUrl(links, 'earnings_actual'),
        sourceLinks: links,
        details: {
          quarter: parsed.quarter,
          year: parsed.year,
          expectedEPS: expected,
          actualEPS: actual,
          surprise: surpriseCalc.surprise,
          surprisePct: surpriseCalc.surprisePct,
        },
      });
    }
  }

  const cal = result?.calendarEvents?.earnings;
  const earningsDate = cal?.earningsDate?.[0]?.raw
    ? toIsoDate(cal.earningsDate[0].raw)
    : toIsoDate(cal?.earningsDate?.[0]?.fmt);

  if (earningsDate) {
    let expectedEPS: number | null = null;
    const trends = result?.earningsTrend?.trend;
    if (Array.isArray(trends)) {
      const currentQ = trends.find((t) => t.period === '0q');
      const trendEstimate = (currentQ?.earningsEstimate as { avg?: { raw?: number } } | undefined)?.avg?.raw;
      if (trendEstimate != null) {
        expectedEPS = trendEstimate;
      }
    }
    if (expectedEPS == null) {
      const avg = cal?.earningsAverage?.raw;
      if (avg != null) expectedEPS = avg;
    }

    const links = buildSourceLinks(asset, 'earnings_expected', [
      {
        label: 'Yahoo Earnings Calendar',
        url: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}/analysis?p=${encodeURIComponent(yahooSymbol)}`,
      },
    ]);

    out.push({
      id: buildId(['er', asset.symbol, earningsDate, 'expected']),
      symbol: asset.symbol,
      name: asset.name,
      assetType: asset.assetType,
      assetTypeAr: assetTypeAr(asset.assetType),
      assetSources,
      eventCategory: 'earnings',
      eventType: 'earnings_expected',
      eventTypeAr: 'إعلان أرباح متوقع',
      titleAr: 'موعد إعلان أرباح متوقع',
      subtitleAr: expectedEPS != null
        ? `ربحية السهم المتوقعة: ${formatNumber(expectedEPS, 2)} ${earningsCurrency}`
        : 'لا توجد قيمة توقع EPS متاحة حالياً.',
      date: earningsDate,
      datePrecision: 'exact',
      status: 'upcoming',
      statusAr: statusAr('upcoming'),
      source: 'Yahoo Finance + Earnings Sources',
      currency: earningsCurrency,
      currencySymbol: currencySymbol(earningsCurrency),
      importance: 90,
      url: selectPrimaryUrl(links, 'earnings_expected'),
      sourceLinks: links,
      details: {
        expectedEPS,
      },
    });
  }

  if (!earningsDate && quote) {
    const earningsTs = Number(quote.earningsTimestamp || quote.earningsTimestampStart || quote.earningsTimestampEnd || 0);
    const estimatedDate = toIsoDateFromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    const fallbackDate = earningsTs > 0 ? toIsoDate(earningsTs) : estimatedDate;
    const expectedFromQuote = Number.isFinite(Number(quote.epsForward)) ? Number(quote.epsForward) : null;
    const hasAnyExpectedSignal = expectedFromQuote != null || earningsTs > 0;

    if (fallbackDate && hasAnyExpectedSignal) {
      const links = buildSourceLinks(asset, 'earnings_expected', [
        {
          label: 'Yahoo Quote',
          url: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}?p=${encodeURIComponent(yahooSymbol)}`,
        },
      ]);
      out.push({
        id: buildId(['er', asset.symbol, fallbackDate, 'expected_quote']),
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.assetType,
        assetTypeAr: assetTypeAr(asset.assetType),
        assetSources,
        eventCategory: 'earnings',
        eventType: 'earnings_expected',
        eventTypeAr: 'إعلان أرباح متوقع',
        titleAr: 'موعد إعلان أرباح (مستمد من بيانات السوق)',
        subtitleAr: expectedFromQuote != null
          ? `ربحية السهم المتوقعة: ${formatNumber(expectedFromQuote, 2)} ${earningsCurrency}`
          : 'تم استخراج الموعد من بيانات السوق، بدون قيمة EPS متوقعة.',
        date: fallbackDate,
        datePrecision: earningsTs > 0 ? 'exact' : 'estimated',
        status: 'upcoming',
        statusAr: statusAr('upcoming'),
        source: earningsTs > 0 ? 'Yahoo Quote' : 'Yahoo Quote (Estimated)',
        currency: earningsCurrency,
        currencySymbol: currencySymbol(earningsCurrency),
        importance: 82,
        url: selectPrimaryUrl(links, 'earnings_expected'),
        sourceLinks: links,
        details: {
          expectedEPS: expectedFromQuote,
          fallbackFromQuote: true,
        },
      });
    }
  }

  const hasActual = out.some((event) => event.eventType === 'earnings_actual');
  if (!hasActual && quote) {
    const trailingActual = Number.isFinite(Number(quote.epsTrailingTwelveMonths))
      ? Number(quote.epsTrailingTwelveMonths)
      : null;

    if (trailingActual != null) {
      const links = buildSourceLinks(asset, 'earnings_actual', [
        {
          label: 'Yahoo Quote',
          url: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}?p=${encodeURIComponent(yahooSymbol)}`,
        },
      ]);

      out.push({
        id: buildId(['er', asset.symbol, todayIso(), 'actual_quote_ttm']),
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.assetType,
        assetTypeAr: assetTypeAr(asset.assetType),
        assetSources,
        eventCategory: 'earnings',
        eventType: 'earnings_actual',
        eventTypeAr: 'إعلان أرباح فعلي',
        titleAr: 'ربحية فعلية (TTM) من بيانات السوق',
        subtitleAr: `ربحية السهم الفعلية (آخر 12 شهر): ${formatNumber(trailingActual, 2)} ${earningsCurrency}`,
        date: todayIso(),
        datePrecision: 'estimated',
        status: 'announced',
        statusAr: statusAr('announced'),
        source: 'Yahoo Quote',
        currency: earningsCurrency,
        currencySymbol: currencySymbol(earningsCurrency),
        importance: 78,
        url: selectPrimaryUrl(links, 'earnings_actual'),
        sourceLinks: links,
        details: {
          actualEPS: trailingActual,
          derivedFrom: 'epsTrailingTwelveMonths',
        },
      });
    }
  }

  const sorted = [...new Map(out.map((event) => [event.id, event])).values()]
    .sort((a, b) => b.date.localeCompare(a.date));
  earningsCache.set(key, { value: sorted, timestamp: Date.now() });
  return sorted;
}

function buildAssetFromQuery(request: NextRequest): NormalizedAsset[] {
  const symbolsRaw = new URL(request.url).searchParams.get('symbols');
  if (!symbolsRaw) return [];
  return symbolsRaw
    .split(',')
    .map((s) => normalizeSymbol(s))
    .filter(Boolean)
    .map((symbol) => ({
      symbol,
      name: symbol,
      assetType: inferAssetTypeBySymbol(symbol),
      market: null,
      sources: ['query'],
    }));
}

async function resolveAssets(request: NextRequest, bodyAssets: unknown[] | null): Promise<NormalizedAsset[]> {
  const candidates: NormalizedAsset[] = [];
  const queryAssets = buildAssetFromQuery(request);
  if (queryAssets.length > 0) candidates.push(...queryAssets);

  if (Array.isArray(bodyAssets)) {
    candidates.push(...normalizeRequestAssets(bodyAssets));
  }

  const user = getUserFromRequest(request);
  if (user) {
    try {
      candidates.push(...(await readUserAssets(user.id)));
    } catch {
      // Ignore DB failures to keep endpoint usable in local/demo mode.
    }
  }

  return mergeAssetCandidates(candidates);
}

function parseBodyAssets(body: unknown): unknown[] | null {
  if (!body || typeof body !== 'object') return null;
  const assets = (body as { assets?: unknown[] }).assets;
  return Array.isArray(assets) ? assets : null;
}

function resolveQuoteForAsset(asset: NormalizedAsset, quotesMap: Map<string, QuoteLite>): QuoteLite | undefined {
  return buildQuoteCandidates(asset)
    .map((candidate) => quotesMap.get(candidate))
    .find(Boolean);
}

async function readDividendHistoryFromDb(asset: NormalizedAsset): Promise<DividendHistoryEntry[]> {
  try {
    const rows = await db.dividend.findMany({
      where: { symbol: asset.symbol },
      orderBy: [{ exDividendDate: 'desc' }],
      take: 32,
      select: {
        amount: true,
        exDividendDate: true,
        paymentDate: true,
      },
    });
    const history: DividendHistoryEntry[] = [];
    for (const row of rows) {
      const amount = toFiniteNumber(row.amount);
      const date = toIsoDateFromDate(row.exDividendDate);
      if (amount == null || !date) continue;
      const paymentDate = toIsoDateFromDate(row.paymentDate);
      history.push({
        date,
        amount,
        paymentDate: paymentDate || null,
        source: 'db',
      });
    }
    return history;
  } catch {
    return [];
  }
}

async function readMarketDataSnapshotFromDb(symbol: string): Promise<MarketDataSnapshotLite | null> {
  try {
    const row = await db.marketData.findUnique({
      where: { symbol },
      select: {
        price: true,
        volume: true,
        week52High: true,
        week52Low: true,
        marketCap: true,
      },
    });
    if (!row) return null;
    return {
      price: toFiniteNumber(row.price),
      volume: toFiniteNumber(row.volume),
      week52High: toFiniteNumber(row.week52High),
      week52Low: toFiniteNumber(row.week52Low),
      marketCap: toFiniteNumber(row.marketCap),
    };
  } catch {
    return null;
  }
}

async function persistDividendHistoryToDb(
  asset: NormalizedAsset,
  currencyCode: string,
  history: DividendHistoryEntry[]
): Promise<void> {
  const validRows = history
    .filter((row) => row.source === 'api' && Number.isFinite(row.amount) && row.date)
    .slice(0, 24);
  if (validRows.length === 0) return;

  try {
    const existing = await db.dividend.findMany({
      where: { symbol: asset.symbol },
      select: {
        exDividendDate: true,
        amount: true,
      },
    });
    const existingSet = new Set(
      existing.map((row) => `${toIsoDateFromDate(row.exDividendDate)}|${Number(row.amount).toFixed(6)}`)
    );
    const currency = String(currencyCode || 'USD').toUpperCase();
    const today = todayIso();

    for (const row of validRows) {
      const key = `${row.date}|${row.amount.toFixed(6)}`;
      if (existingSet.has(key)) continue;
      await db.dividend.create({
        data: {
          symbol: asset.symbol,
          name: asset.name || asset.symbol,
          amount: row.amount,
          currency,
          exDividendDate: new Date(`${row.date}T00:00:00.000Z`),
          paymentDate: row.paymentDate ? new Date(`${row.paymentDate}T00:00:00.000Z`) : null,
          status: row.date >= today ? 'pending' : 'paid',
        },
      });
      existingSet.add(key);
    }
  } catch {
    // DB cache is best-effort only; do not block core response.
  }
}

async function upsertMarketDataFromQuote(asset: NormalizedAsset, quote?: QuoteLite): Promise<void> {
  if (!quote) return;

  const price = toFiniteNumber(quote.regularMarketPrice);
  const volume = toFiniteNumber(quote.regularMarketVolume);
  const week52High = toFiniteNumber(quote.fiftyTwoWeekHigh);
  const week52Low = toFiniteNumber(quote.fiftyTwoWeekLow);
  const marketCap = toFiniteNumber(quote.marketCap);
  const hasAnyMetric = [price, volume, week52High, week52Low, marketCap].some((value) => value != null);
  if (!hasAnyMetric) return;

  try {
    await db.marketData.upsert({
      where: { symbol: asset.symbol },
      update: {
        name: asset.name || asset.symbol,
        price: price ?? undefined,
        volume: volume ?? undefined,
        week52High: week52High ?? undefined,
        week52Low: week52Low ?? undefined,
        marketCap: marketCap ?? undefined,
        lastUpdated: new Date(),
      },
      create: {
        symbol: asset.symbol,
        name: asset.name || asset.symbol,
        price: price ?? undefined,
        volume: volume ?? undefined,
        week52High: week52High ?? undefined,
        week52Low: week52Low ?? undefined,
        marketCap: marketCap ?? undefined,
        lastUpdated: new Date(),
      },
    });
  } catch {
    // Market cache write is non-blocking.
  }
}

function toIsoDateFromDate(value: Date | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function normalizeSymbolCore(symbol: string): string {
  return normalizeSymbol(symbol)
    .replace(/=X$/i, '')
    .replace(/-USD$/i, '')
    .replace(/\.(SR|AD|DU|KW|QA|BH|OM|CA|JO|L)$/i, '');
}

function buildSymbolAliasSet(symbol: string): Set<string> {
  const normalized = normalizeSymbol(symbol);
  const core = normalizeSymbolCore(symbol);
  const out = new Set<string>();

  if (normalized) out.add(normalized);
  if (core && core !== normalized) out.add(core);

  if (/^\d{3,5}$/.test(core)) {
    out.add(`${core}.SR`);
    out.add(`${core}.AD`);
    out.add(`${core}.DU`);
    out.add(`${core}.KW`);
    out.add(`${core}.QA`);
    out.add(`${core}.BH`);
  }

  return out;
}

function symbolsEquivalent(a: string, b: string): boolean {
  const aAliases = buildSymbolAliasSet(a);
  const bAliases = buildSymbolAliasSet(b);
  for (const alias of aAliases) {
    if (bAliases.has(alias)) return true;
  }
  return false;
}

function findAssetBySymbol(assets: NormalizedAsset[], symbol: string): NormalizedAsset | null {
  const normalized = normalizeSymbol(symbol);
  const exact = assets.find((asset) => normalizeSymbol(asset.symbol) === normalized);
  if (exact) return exact;
  return assets.find((asset) => symbolsEquivalent(asset.symbol, normalized)) || null;
}

async function fetchManualEventsFromRecords(
  userId: string,
  assets: NormalizedAsset[],
  quotesMap: Map<string, QuoteLite>
): Promise<{ corporate: UnifiedEvent[]; earnings: UnifiedEvent[] }> {
  const assetAliasSet = new Set<string>();
  for (const asset of assets) {
    for (const alias of buildSymbolAliasSet(asset.symbol)) {
      assetAliasSet.add(alias);
    }
  }
  if (assetAliasSet.size === 0) return { corporate: [], earnings: [] };

  let corporateRows: ManualCorporateActionRow[] = [];
  let earningsRows: ManualEarningsRow[] = [];

  try {
    corporateRows = await db.userCorporateActionRecord.findMany({
      where: { userId },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
      select: {
        symbol: true,
        name: true,
        type: true,
        ratio: true,
        ratioFrom: true,
        ratioTo: true,
        dividendAmount: true,
        effectiveDate: true,
        currency: true,
        source: true,
        notes: true,
        createdAt: true,
      },
    });
    corporateRows = corporateRows.filter((row) => {
      const rowAliases = buildSymbolAliasSet(row.symbol);
      return [...rowAliases].some((alias) => assetAliasSet.has(alias));
    });
  } catch {
    corporateRows = [];
  }

  try {
    earningsRows = await db.userEarningsRecord.findMany({
      where: { userId },
      orderBy: [{ announcementDate: 'desc' }, { createdAt: 'desc' }],
      select: {
        symbol: true,
        name: true,
        quarter: true,
        year: true,
        announcementDate: true,
        expectedEPS: true,
        actualEPS: true,
        surprise: true,
        surprisePct: true,
        result: true,
        currency: true,
        source: true,
        notes: true,
        createdAt: true,
      },
    });
    earningsRows = earningsRows.filter((row) => {
      const rowAliases = buildSymbolAliasSet(row.symbol);
      return [...rowAliases].some((alias) => assetAliasSet.has(alias));
    });
  } catch {
    earningsRows = [];
  }

  const corporateEvents: UnifiedEvent[] = corporateRows.map((row) => {
    const symbol = normalizeSymbol(row.symbol);
    const matchedAsset = findAssetBySymbol(assets, symbol);
    const fallbackAsset: NormalizedAsset = matchedAsset || {
      symbol,
      name: row.name || symbol,
      assetType: inferAssetTypeBySymbol(symbol),
      market: null,
      sources: ['manual_records'],
    };
    const quote = resolveQuoteForAsset(fallbackAsset, quotesMap);
    const resolvedCurrency = {
      code: String(row.currency || resolveAssetCurrency(fallbackAsset, quote).code || 'USD').toUpperCase(),
      symbol: currencySymbol(String(row.currency || resolveAssetCurrency(fallbackAsset, quote).code || 'USD').toUpperCase()),
    };
    const effectiveDate = toIsoDateFromDate(row.effectiveDate) || toIsoDateFromDate(row.createdAt) || todayIso();
    const normalizedType = String(row.type || '').trim().toLowerCase();
    const type: EventType =
      normalizedType === 'reverse_split'
        ? 'reverse_split'
        : normalizedType === 'dividend'
          ? 'dividend'
          : normalizedType === 'rights_issue' || normalizedType === 'rights'
            ? 'rights_issue'
            : normalizedType === 'bonus_issue' || normalizedType === 'bonus'
            ? 'bonus_issue'
            : 'split';
    const noteUrls = parseUrlsFromText(row.notes);
    const links = buildSourceLinks(fallbackAsset, type, [
      ...noteUrls.map((url, index) => ({ label: `رابط الخبر (سجل ${index + 1})`, url })),
    ]);

    return {
      id: buildId(['manual_ca', symbol, type, effectiveDate, row.ratio || row.dividendAmount || '']),
      symbol,
      name: row.name || fallbackAsset.name || symbol,
      assetType: fallbackAsset.assetType,
      assetTypeAr: assetTypeAr(fallbackAsset.assetType),
      assetSources: normalizeAssetSources(fallbackAsset.sources),
      eventCategory: 'corporate_action',
      eventType: type,
      eventTypeAr:
        type === 'reverse_split'
          ? 'تقسيم عكسي'
          : type === 'dividend'
            ? 'توزيع نقدي'
            : type === 'rights_issue'
              ? 'حقوق أولوية'
            : type === 'bonus_issue'
              ? 'منحة أسهم'
              : 'تقسيم أسهم',
      titleAr:
        type === 'reverse_split'
          ? 'تقسيم عكسي (من السجل)'
          : type === 'dividend'
            ? 'توزيع نقدي (من السجل)'
            : type === 'rights_issue'
              ? 'حقوق أولوية (من السجل)'
            : type === 'bonus_issue'
              ? 'منحة أسهم (من السجل)'
              : 'تقسيم أسهم (من السجل)',
      subtitleAr:
        type === 'dividend'
          ? `توزيع نقدي: ${formatNumber(row.dividendAmount, 4)} ${resolvedCurrency.code}`
          : type === 'rights_issue'
            ? row.ratio
              ? `حقوق أولوية بنسبة: ${row.ratio}`
              : row.notes?.trim()
                ? row.notes.trim()
                : 'تم تسجيل إعلان حقوق أولوية.'
          : type === 'bonus_issue'
            ? row.ratio
              ? `نسبة المنحة: ${row.ratio}`
              : row.notes?.trim()
                ? row.notes.trim()
                : 'تم تسجيل خبر منحة أسهم.'
            : row.ratio
              ? `نسبة الإجراء: ${row.ratio}`
              : 'تم إدخال الإجراء يدوياً.',
      date: effectiveDate,
      datePrecision: 'exact',
      status: 'announced',
      statusAr: statusAr('announced'),
      source: row.source === 'manual' ? 'Manual Records + Market/News Sources' : 'Auto Records + Market/News Sources',
      currency: resolvedCurrency.code,
      currencySymbol: resolvedCurrency.symbol,
      importance: type === 'bonus_issue' || type === 'rights_issue' ? (row.source === 'manual' ? 94 : 87) : (row.source === 'manual' ? 93 : 85),
      url: selectPrimaryUrl(links, type),
      sourceLinks: links,
      details: {
        ratio: row.ratio,
        ratioFrom: row.ratioFrom,
        ratioTo: row.ratioTo,
        dividendAmount: row.dividendAmount,
        notes: row.notes || null,
      },
    };
  });

  const earningsEvents: UnifiedEvent[] = earningsRows.map((row) => {
    const symbol = normalizeSymbol(row.symbol);
    const matchedAsset = findAssetBySymbol(assets, symbol);
    const fallbackAsset: NormalizedAsset = matchedAsset || {
      symbol,
      name: row.name || symbol,
      assetType: inferAssetTypeBySymbol(symbol),
      market: null,
      sources: ['manual_records'],
    };
    const quote = resolveQuoteForAsset(fallbackAsset, quotesMap);
    const resolvedCurrency = {
      code: String(row.currency || resolveAssetCurrency(fallbackAsset, quote).code || 'USD').toUpperCase(),
      symbol: currencySymbol(String(row.currency || resolveAssetCurrency(fallbackAsset, quote).code || 'USD').toUpperCase()),
    };
    const recordDate = toIsoDateFromDate(row.announcementDate) || toIsoDateFromDate(row.createdAt) || todayIso();
    const isActual = row.actualEPS != null;
    const type: EventType = isActual ? 'earnings_actual' : 'earnings_expected';
    const normalizedResult = row.result === 'beat' || row.result === 'miss' || row.result === 'inline'
      ? row.result
      : null;
    const status: EventStatus = isActual ? (normalizedResult || 'announced') : 'upcoming';
    const noteUrls = parseUrlsFromText(row.notes);
    const links = buildSourceLinks(fallbackAsset, type, [
      ...noteUrls.map((url, index) => ({ label: `رابط الخبر (سجل ${index + 1})`, url })),
    ]);

    return {
      id: buildId(['manual_er', symbol, row.year, row.quarter, type, recordDate]),
      symbol,
      name: row.name || fallbackAsset.name || symbol,
      assetType: fallbackAsset.assetType,
      assetTypeAr: assetTypeAr(fallbackAsset.assetType),
      assetSources: normalizeAssetSources(fallbackAsset.sources),
      eventCategory: 'earnings',
      eventType: type,
      eventTypeAr: isActual ? 'إعلان أرباح فعلي' : 'إعلان أرباح متوقع',
      titleAr: `${isActual ? 'نتائج' : 'موعد'} ${row.quarter} ${row.year} (من السجل)`,
      subtitleAr: isActual
        ? `المتوقع: ${formatNumber(row.expectedEPS, 2)} ${resolvedCurrency.code} | الفعلي: ${formatNumber(row.actualEPS, 2)} ${resolvedCurrency.code}`
        : `ربحية السهم المتوقعة: ${formatNumber(row.expectedEPS, 2)} ${resolvedCurrency.code}`,
      date: recordDate,
      datePrecision: 'exact',
      status,
      statusAr: statusAr(status),
      source: row.source === 'manual' ? 'Manual Records + Earnings Sources' : 'Auto Records + Earnings Sources',
      currency: resolvedCurrency.code,
      currencySymbol: resolvedCurrency.symbol,
      importance: row.source === 'manual' ? 92 : 84,
      url: selectPrimaryUrl(links, type),
      sourceLinks: links,
      details: {
        quarter: row.quarter,
        year: row.year,
        expectedEPS: row.expectedEPS,
        actualEPS: row.actualEPS,
        surprise: row.surprise,
        surprisePct: row.surprisePct,
        notes: row.notes || null,
      },
    };
  });

  return {
    corporate: corporateEvents,
    earnings: earningsEvents,
  };
}

async function buildEventsHub(request: NextRequest, body: unknown | null): Promise<HubResponse> {
  const user = getUserFromRequest(request);
  const assetsRaw = await resolveAssets(request, parseBodyAssets(body));
  const warnings: string[] = [];

  if (assetsRaw.length === 0) {
    return {
      success: true,
      updatedAt: new Date().toISOString(),
      assets: [],
      health: [],
      events: [],
      stats: {
        assets: 0,
        events: 0,
        corporateActions: 0,
        bonusNews: 0,
        earningsExpected: 0,
        earningsActual: 0,
        suspended: 0,
        delisted: 0,
      },
      warnings: ['لا توجد رموز أصول متاحة للتحليل.'],
    };
  }

  const candidateSymbols = assetsRaw.flatMap((a) => buildQuoteCandidates(a));
  const quotesMap = await fetchQuotesMap(candidateSymbols);
  const assets = enrichAssetsWithNames(assetsRaw, quotesMap);

  const health = await mapWithLimit(assets, FETCH_CONCURRENCY, async (asset) => {
    if (!supportsListingStatus(asset.assetType)) {
      const resolvedCurrency = resolveAssetCurrency(asset);
      return {
        symbol: asset.symbol,
        name: asset.name,
        assetType: asset.assetType,
        assetTypeAr: assetTypeAr(asset.assetType),
        assetSources: normalizeAssetSources(asset.sources),
        currency: resolvedCurrency.code,
        currencySymbol: resolvedCurrency.symbol,
        status: 'active' as ListingHealthStatus,
        statusAr: 'نشط',
        reasonAr: 'لا ينطبق تصنيف الشطب/الإيقاف على نوع هذا الأصل.',
        source: 'Portfolio Rules',
      };
    }

    const quote = resolveQuoteForAsset(asset, quotesMap);

    const maybeMissing = !quote || String(quote.quoteType || '').toUpperCase() === 'NONE';
    const lookupSymbol = resolveYahooSymbol(asset) || asset.symbol;
    const chartHint = maybeMissing ? await fetchChartHint(lookupSymbol) : '';
    return evaluateListingStatus(asset, quote, chartHint);
  });

  const listingEvents = health
    .map((h) => listingToEvent(h))
    .filter((e): e is UnifiedEvent => Boolean(e));

  const assetsForCorporate = assets.filter((a) => supportsCorporateActions(a.assetType));
  const assetsForEarnings = assets.filter((a) => supportsEarnings(a.assetType));

  const corporateEventsNested = await mapWithLimit(assetsForCorporate, FETCH_CONCURRENCY, async (asset) => {
    try {
      const quote = resolveQuoteForAsset(asset, quotesMap);
      const resolvedCurrency = resolveAssetCurrency(asset, quote);
      return await fetchCorporateActionEvents(asset, resolvedCurrency, quote);
    } catch {
      warnings.push(`تعذر جلب الإجراءات المؤسسية للرمز ${asset.symbol}.`);
      return [];
    }
  });

  const bonusAssets = assetsForCorporate.filter((asset) => asset.assetType === 'stock' || asset.assetType === 'fund');
  const bonusEventsNested = await mapWithLimit(bonusAssets, FETCH_CONCURRENCY, async (asset) => {
    try {
      const quote = resolveQuoteForAsset(asset, quotesMap);
      const resolvedCurrency = resolveAssetCurrency(asset, quote);
      return await fetchBonusIssueNewsEvents(asset, resolvedCurrency);
    } catch {
      warnings.push(`تعذر جلب أخبار منح الأسهم للرمز ${asset.symbol}.`);
      return [];
    }
  });

  const earningsEventsNested = await mapWithLimit(assetsForEarnings, FETCH_CONCURRENCY, async (asset) => {
    try {
      const quote = resolveQuoteForAsset(asset, quotesMap);
      const resolvedCurrency = resolveAssetCurrency(asset, quote);
      return await fetchEarningsEvents(asset, resolvedCurrency, quote);
    } catch {
      warnings.push(`تعذر جلب بيانات الأرباح للرمز ${asset.symbol}.`);
      return [];
    }
  });

  let manualCorporateEvents: UnifiedEvent[] = [];
  let manualEarningsEvents: UnifiedEvent[] = [];
  if (user) {
    try {
      const manual = await fetchManualEventsFromRecords(user.id, assets, quotesMap);
      manualCorporateEvents = manual.corporate;
      manualEarningsEvents = manual.earnings;
    } catch {
      warnings.push('تعذر تحميل سجلاتك اليدوية للأحداث المؤسسية/الأرباح.');
    }
  }

  const allEvents = [
    ...listingEvents,
    ...corporateEventsNested.flat(),
    ...bonusEventsNested.flat(),
    ...earningsEventsNested.flat(),
    ...manualCorporateEvents,
    ...manualEarningsEvents,
  ];

  const deduped = [...new Map(allEvents.map((event) => [event.id, event])).values()];
  deduped.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.importance - a.importance;
  });

  return {
    success: true,
    updatedAt: new Date().toISOString(),
    assets,
    health,
    events: deduped,
    stats: {
      assets: assets.length,
      events: deduped.length,
      corporateActions: deduped.filter((e) => e.eventCategory === 'corporate_action').length,
      bonusNews: deduped.filter((e) => e.eventType === 'bonus_issue').length,
      earningsExpected: deduped.filter((e) => e.eventType === 'earnings_expected').length,
      earningsActual: deduped.filter((e) => e.eventType === 'earnings_actual').length,
      suspended: health.filter((h) => h.status === 'suspended').length,
      delisted: health.filter((h) => h.status === 'delisted').length,
    },
    warnings,
  };
}

async function getEventsHub(request: NextRequest) {
  const data = await buildEventsHub(request, null);
  return NextResponse.json(data);
}

async function postEventsHub(request: NextRequest) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const data = await buildEventsHub(request, body);
  return NextResponse.json(data);
}

export const GET = withApiTelemetry('/api/market/events-hub', getEventsHub);
export const POST = withApiTelemetry('/api/market/events-hub', postEventsHub);
