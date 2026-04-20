'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { usePortfolioSnapshot } from '@/hooks/use-portfolio-snapshot';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Filter,
  ListTree,
  Loader2,
  RefreshCw,
  Search,
  TableProperties,
  TrendingUp,
} from 'lucide-react';
import { fetchAllPortfoliosSnapshots, type PortfolioOption, type PortfolioSnapshot } from '@/lib/export-utils';

type AssetType = 'stock' | 'fund' | 'bond' | 'sukuk' | 'forex' | 'crypto' | 'commodity' | 'unknown';
type EventCategory = 'corporate_action' | 'earnings' | 'listing_status';
type EventStatus = 'upcoming' | 'announced' | 'beat' | 'miss' | 'inline' | 'suspended' | 'delisted';

interface AssetPayload {
  symbol: string;
  name: string;
  assetType: AssetType;
  market?: string | null;
  source?: string;
  sources?: string[];
}

interface AssetOption extends AssetPayload {
  key: string;
  label: string;
  coverage: Array<'portfolio' | 'watchlist' | 'other'>;
}

interface PortfolioAssetPayload extends AssetPayload {
  portfolioId: string;
  portfolioName: string;
}

interface WatchlistAssetPayload extends AssetPayload {
  watchlistId: string;
  watchlistName: string;
}

interface WatchlistLoadResult {
  assets: WatchlistAssetPayload[];
  lists: Array<{ id: string; name: string }>;
}

interface UnifiedEvent {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  assetTypeAr: string;
  assetSources: string[];
  eventCategory: EventCategory;
  eventType: string;
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
  sourceLinks?: Array<{ label: string; url: string }>;
  reasonAr?: string;
}

interface ListingHealth {
  symbol: string;
  name: string;
  assetType: AssetType;
  assetTypeAr: string;
  status: 'active' | 'suspended' | 'delisted' | 'unverified';
  statusAr: string;
  reasonAr: string;
  source: string;
}

interface EventsHubResponse {
  success: true;
  updatedAt: string;
  assets: AssetPayload[];
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

const LOCAL_WATCHLIST_KEY = 'watchlist_data';

const REFERENCE_CRYPTO_ASSETS: AssetPayload[] = [
  { symbol: 'BTC-USD', name: 'بيتكوين', assetType: 'crypto', market: 'CRYPTO', source: 'reference_crypto' },
  { symbol: 'ETH-USD', name: 'إيثيريوم', assetType: 'crypto', market: 'CRYPTO', source: 'reference_crypto' },
  { symbol: 'BNB-USD', name: 'BNB', assetType: 'crypto', market: 'CRYPTO', source: 'reference_crypto' },
  { symbol: 'SOL-USD', name: 'سولانا', assetType: 'crypto', market: 'CRYPTO', source: 'reference_crypto' },
  { symbol: 'XRP-USD', name: 'ريبل', assetType: 'crypto', market: 'CRYPTO', source: 'reference_crypto' },
  { symbol: 'ADA-USD', name: 'كاردانو', assetType: 'crypto', market: 'CRYPTO', source: 'reference_crypto' },
  { symbol: 'DOGE-USD', name: 'دوج كوين', assetType: 'crypto', market: 'CRYPTO', source: 'reference_crypto' },
  { symbol: 'AVAX-USD', name: 'أفالانش', assetType: 'crypto', market: 'CRYPTO', source: 'reference_crypto' },
  { symbol: 'LINK-USD', name: 'تشين لينك', assetType: 'crypto', market: 'CRYPTO', source: 'reference_crypto' },
  { symbol: 'DOT-USD', name: 'بولكادوت', assetType: 'crypto', market: 'CRYPTO', source: 'reference_crypto' },
];

const REFERENCE_FOREX_ASSETS: AssetPayload[] = [
  { symbol: 'EURUSD=X', name: 'يورو/دولار', assetType: 'forex', market: 'FOREX', source: 'reference_forex' },
  { symbol: 'GBPUSD=X', name: 'جنيه/دولار', assetType: 'forex', market: 'FOREX', source: 'reference_forex' },
  { symbol: 'USDJPY=X', name: 'دولار/ين', assetType: 'forex', market: 'FOREX', source: 'reference_forex' },
  { symbol: 'USDCHF=X', name: 'دولار/فرنك', assetType: 'forex', market: 'FOREX', source: 'reference_forex' },
  { symbol: 'AUDUSD=X', name: 'دولار أسترالي/دولار', assetType: 'forex', market: 'FOREX', source: 'reference_forex' },
  { symbol: 'USDCAD=X', name: 'دولار/دولار كندي', assetType: 'forex', market: 'FOREX', source: 'reference_forex' },
  { symbol: 'SAR=X', name: 'دولار/ريال سعودي', assetType: 'forex', market: 'FOREX', source: 'reference_forex' },
  { symbol: 'AED=X', name: 'دولار/درهم إماراتي', assetType: 'forex', market: 'FOREX', source: 'reference_forex' },
  { symbol: 'KWD=X', name: 'دولار/دينار كويتي', assetType: 'forex', market: 'FOREX', source: 'reference_forex' },
  { symbol: 'QAR=X', name: 'دولار/ريال قطري', assetType: 'forex', market: 'FOREX', source: 'reference_forex' },
];

const REFERENCE_COMMODITY_ASSETS: AssetPayload[] = [
  { symbol: 'GC=F', name: 'الذهب', assetType: 'commodity', market: 'COMMODITIES', source: 'reference_commodity' },
  { symbol: 'SI=F', name: 'الفضة', assetType: 'commodity', market: 'COMMODITIES', source: 'reference_commodity' },
  { symbol: 'PL=F', name: 'البلاتين', assetType: 'commodity', market: 'COMMODITIES', source: 'reference_commodity' },
  { symbol: 'PA=F', name: 'البلاديوم', assetType: 'commodity', market: 'COMMODITIES', source: 'reference_commodity' },
  { symbol: 'CL=F', name: 'نفط خام WTI', assetType: 'commodity', market: 'COMMODITIES', source: 'reference_commodity' },
  { symbol: 'BZ=F', name: 'نفط برنت', assetType: 'commodity', market: 'COMMODITIES', source: 'reference_commodity' },
  { symbol: 'NG=F', name: 'الغاز الطبيعي', assetType: 'commodity', market: 'COMMODITIES', source: 'reference_commodity' },
  { symbol: 'HG=F', name: 'النحاس', assetType: 'commodity', market: 'COMMODITIES', source: 'reference_commodity' },
  { symbol: 'ZC=F', name: 'الذرة', assetType: 'commodity', market: 'COMMODITIES', source: 'reference_commodity' },
  { symbol: 'ZW=F', name: 'القمح', assetType: 'commodity', market: 'COMMODITIES', source: 'reference_commodity' },
];

const REFERENCE_ASSETS: AssetPayload[] = [
  ...REFERENCE_CRYPTO_ASSETS,
  ...REFERENCE_FOREX_ASSETS,
  ...REFERENCE_COMMODITY_ASSETS,
];

function buildAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (typeof window === 'undefined') return headers;
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function normalizeSymbol(value: string): string {
  return (value || '').trim().toUpperCase();
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

function inferStockAssetType(symbol: string, exchange?: string, sector?: string): AssetType {
  const upperExchange = String(exchange || '').toUpperCase();
  const upperSector = String(sector || '').toUpperCase();

  if (upperExchange.includes('FOREX') || symbol.endsWith('=X')) return 'forex';
  if (upperExchange.includes('CRYPTO') || upperSector.includes('CRYPTO') || upperSector.includes('CURRENCY')) return 'crypto';
  if (symbol.endsWith('-USD')) return 'crypto';
  return 'stock';
}

function assetTypeLabel(assetType: AssetType): string {
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

function normalizeSymbolCore(symbol: string): string {
  return normalizeSymbol(symbol)
    .replace(/=X$/i, '')
    .replace(/-USD$/i, '')
    .replace(/\.(SR|AD|DU|KW|QA|BH|OM|CA|JO|L)$/i, '');
}

function symbolsEquivalent(a: string, b: string): boolean {
  const x = normalizeSymbol(a);
  const y = normalizeSymbol(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return normalizeSymbolCore(x) === normalizeSymbolCore(y);
}

function buildAssetOptionKey(symbol: string, assetType: AssetType): string {
  return `${normalizeSymbol(symbol)}::${assetType}`;
}

function parseAssetOptionKey(key: string): { symbol: string; assetType: AssetType } | null {
  if (!key || key === 'all') return null;
  const [rawSymbol, rawType] = key.split('::');
  const symbol = normalizeSymbol(rawSymbol || '');
  const allowedTypes: AssetType[] = ['stock', 'fund', 'bond', 'sukuk', 'forex', 'crypto', 'commodity', 'unknown'];
  const assetType = allowedTypes.includes(rawType as AssetType) ? (rawType as AssetType) : 'unknown';
  if (!symbol) return null;
  return { symbol, assetType };
}

function marketHintForAssetType(assetType: AssetType): string | null {
  switch (assetType) {
    case 'crypto':
      return 'CRYPTO';
    case 'forex':
      return 'FOREX';
    case 'commodity':
      return 'COMMODITIES';
    case 'fund':
      return 'FUND';
    case 'bond':
      return 'BOND';
    case 'sukuk':
      return 'SUKUK';
    default:
      return null;
  }
}

function toAssetRoute(assetType: AssetType): string {
  switch (assetType) {
    case 'stock':
      return '/stocks';
    case 'fund':
      return '/funds';
    case 'bond':
    case 'sukuk':
      return '/bonds';
    case 'forex':
      return '/forex';
    case 'crypto':
      return '/crypto';
    case 'commodity':
      return '/commodities';
    default:
      return '/watchlist';
  }
}

function statusBadgeClass(status: EventStatus) {
  if (status === 'beat') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
  if (status === 'miss') return 'bg-red-500/10 text-red-600 border-red-500/30';
  if (status === 'suspended' || status === 'delisted') return 'bg-orange-500/10 text-orange-700 border-orange-500/30';
  if (status === 'upcoming') return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
  return 'bg-muted text-foreground border-border';
}

function categoryLabel(category: EventCategory) {
  switch (category) {
    case 'corporate_action':
      return 'إجراء مؤسسي';
    case 'earnings':
      return 'أرباح';
    case 'listing_status':
      return 'شطب/إيقاف';
    default:
      return 'حدث';
  }
}

function eventTypeLabel(eventType: string) {
  switch (eventType) {
    case 'split':
      return 'تقسيم';
    case 'reverse_split':
      return 'تقسيم عكسي';
    case 'bonus_issue':
      return 'منحة أسهم';
    case 'rights_issue':
      return 'حقوق أولوية';
    case 'dividend':
      return 'توزيع نقدي';
    case 'earnings_expected':
      return 'أرباح متوقعة';
    case 'earnings_actual':
      return 'أرباح فعلية';
    case 'suspension':
      return 'إيقاف';
    case 'delisting':
      return 'شطب';
    default:
      return 'كل الأنواع';
  }
}

function normalizeCoverageTag(source: string): 'portfolio' | 'watchlist' | 'other' {
  const value = String(source || '').toLowerCase();
  if (value.includes('portfolio')) return 'portfolio';
  if (value.includes('watchlist')) return 'watchlist';
  return 'other';
}

function readLocalWatchlistsDetailed(): WatchlistLoadResult {
  if (typeof window === 'undefined') return { assets: [], lists: [] };
  try {
    const raw = localStorage.getItem(LOCAL_WATCHLIST_KEY);
    if (!raw) return { assets: [], lists: [] };
    const parsed = JSON.parse(raw) as Array<{ id?: string; name?: string; items?: Array<{ symbol?: string; name?: string; market?: string }> }>;
    const assets: WatchlistAssetPayload[] = [];
    const lists: Array<{ id: string; name: string }> = [];

    for (let i = 0; i < (parsed || []).length; i += 1) {
      const list = parsed[i];
      const id = String(list?.id || `local-${i + 1}`);
      const name = String(list?.name || `قائمة متابعة ${i + 1}`);
      lists.push({ id, name });
      for (const item of list?.items || []) {
        const symbol = normalizeSymbol(String(item.symbol || ''));
        if (!symbol) continue;
        assets.push({
          symbol,
          name: String(item.name || symbol),
          assetType: inferAssetTypeBySymbol(symbol, item.market),
          market: item.market || null,
          source: `watchlist:${id}`,
          watchlistId: id,
          watchlistName: name,
        });
      }
    }
    return { assets, lists };
  } catch {
    return { assets: [], lists: [] };
  }
}

async function readApiWatchlistsDetailed(): Promise<WatchlistLoadResult> {
  try {
    const res = await fetch('/api/watchlists', {
      cache: 'no-store',
      headers: buildAuthHeaders(),
    });
    if (!res.ok) return { assets: [], lists: [] };
    const data = await res.json();
    const watchlists = Array.isArray(data?.watchlists) ? data.watchlists : [];
    const assets: WatchlistAssetPayload[] = [];
    const lists: Array<{ id: string; name: string }> = [];

    for (const list of watchlists) {
      const id = String(list?.id || '').trim();
      const name = String(list?.name || id || 'قائمة متابعة').trim() || 'قائمة متابعة';
      if (id) lists.push({ id, name });
      const items = Array.isArray(list?.items) ? list.items : [];
      for (const item of items) {
        const symbol = normalizeSymbol(String(item?.symbol || ''));
        if (!symbol) continue;
        assets.push({
          symbol,
          name: String(item?.name || symbol),
          assetType: inferAssetTypeBySymbol(symbol, item?.market),
          market: item?.market || null,
          source: `watchlist:${id || 'api'}`,
          watchlistId: id || 'api',
          watchlistName: name,
        });
      }
    }
    return { assets, lists };
  } catch {
    return { assets: [], lists: [] };
  }
}

function snapshotToAssets(snapshot: PortfolioSnapshot | null): PortfolioAssetPayload[] {
  if (!snapshot) return [];
  const assets: PortfolioAssetPayload[] = [];
  const portfolioId = String(snapshot.portfolioId || snapshot.portfolioName || 'portfolio');
  const portfolioName = String(snapshot.portfolioName || snapshot.portfolioId || 'المحفظة');

  for (const stock of snapshot.stocks || []) {
    const symbol = normalizeSymbol(stock.symbol);
    if (!symbol) continue;
    assets.push({
      symbol,
      name: stock.name || symbol,
      assetType: inferStockAssetType(symbol, stock.exchange, stock.sector),
      market: stock.exchange || null,
      source: `portfolio:${portfolioId}`,
      portfolioId,
      portfolioName,
    });
  }

  for (const bond of snapshot.bonds || []) {
    const symbol = normalizeSymbol(bond.symbol);
    if (!symbol) continue;
    assets.push({
      symbol,
      name: bond.name || symbol,
      assetType: String(bond.type || '').toLowerCase() === 'sukuk' ? 'sukuk' : 'bond',
      market: bond.type || null,
      source: `portfolio:${portfolioId}`,
      portfolioId,
      portfolioName,
    });
  }

  for (const fund of snapshot.funds || []) {
    const symbol = normalizeSymbol(fund.symbol || fund.name || '');
    if (!symbol) continue;
    const fundType = String(fund.fundType || '').toLowerCase();
    assets.push({
      symbol,
      name: fund.name || symbol,
      assetType: fundType === 'commodities' || fundType === 'commodity' ? 'commodity' : 'fund',
      market: fundType || null,
      source: `portfolio:${portfolioId}`,
      portfolioId,
      portfolioName,
    });
  }

  return assets;
}

function mergeAssets(items: AssetPayload[]): AssetPayload[] {
  const merged = new Map<string, AssetPayload>();
  for (const item of items) {
    const symbol = normalizeSymbol(item.symbol);
    if (!symbol) continue;
    const current = merged.get(symbol);
    if (!current) {
      merged.set(symbol, {
        symbol,
        name: item.name || symbol,
        assetType: item.assetType || 'unknown',
        market: item.market || null,
        source: item.source || 'unknown',
      });
      continue;
    }

    const betterType = current.assetType === 'unknown' && item.assetType !== 'unknown'
      ? item.assetType
      : current.assetType;
    const betterName = current.name === current.symbol && item.name ? item.name : current.name;
    merged.set(symbol, {
      symbol,
      name: betterName,
      assetType: betterType,
      market: current.market || item.market || null,
      source: current.source || item.source || 'unknown',
    });
  }

  return [...merged.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
}

function mergeAssetOptions(items: AssetPayload[]): AssetOption[] {
  const map = new Map<string, AssetOption>();
  for (const item of items) {
    const symbol = normalizeSymbol(item.symbol);
    if (!symbol) continue;
    const assetType = item.assetType || inferAssetTypeBySymbol(symbol, item.market);
    const key = buildAssetOptionKey(symbol, assetType);
    const current = map.get(key);
    const sourceList = Array.isArray(item.sources) && item.sources.length > 0
      ? item.sources
      : [item.source || 'unknown'];
    const coverage = [...new Set(sourceList.map((src) => normalizeCoverageTag(src)))];

    if (!current) {
      const name = String(item.name || symbol).trim() || symbol;
      map.set(key, {
        key,
        symbol,
        name,
        assetType,
        market: item.market || null,
        source: item.source || 'unknown',
        sources: sourceList,
        coverage,
        label: `${name} (${symbol}) • ${assetTypeLabel(assetType)}`,
      });
      continue;
    }

    const betterName = (current.name === current.symbol || !current.name.trim()) && item.name
      ? String(item.name).trim()
      : current.name;
    const mergedSources = [...new Set([...(current.sources || []), ...sourceList])];
    const mergedCoverage = [...new Set([...(current.coverage || []), ...coverage])];
    map.set(key, {
      ...current,
      name: betterName || current.symbol,
      market: current.market || item.market || null,
      sources: mergedSources,
      coverage: mergedCoverage,
      label: `${betterName || current.symbol} (${current.symbol}) • ${assetTypeLabel(assetType)}`,
    });
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}

interface SymbolMembership {
  portfolioIds: Set<string>;
  watchlistIds: Set<string>;
}

function symbolAliasKeys(symbol: string): string[] {
  const normalized = normalizeSymbol(symbol);
  const core = normalizeSymbolCore(symbol);
  return [...new Set([normalized, core].filter(Boolean))];
}

function upsertMembership(
  map: Map<string, SymbolMembership>,
  symbol: string,
  updater: (membership: SymbolMembership) => void
) {
  for (const key of symbolAliasKeys(symbol)) {
    const current = map.get(key) || { portfolioIds: new Set<string>(), watchlistIds: new Set<string>() };
    updater(current);
    map.set(key, current);
  }
}

function buildSymbolMembershipMap(
  portfolioAssets: PortfolioAssetPayload[],
  watchlistAssets: WatchlistAssetPayload[]
): Map<string, SymbolMembership> {
  const map = new Map<string, SymbolMembership>();

  for (const asset of portfolioAssets) {
    if (!asset.symbol || !asset.portfolioId) continue;
    upsertMembership(map, asset.symbol, (entry) => {
      entry.portfolioIds.add(asset.portfolioId);
    });
  }

  for (const asset of watchlistAssets) {
    if (!asset.symbol || !asset.watchlistId) continue;
    upsertMembership(map, asset.symbol, (entry) => {
      entry.watchlistIds.add(asset.watchlistId);
    });
  }

  return map;
}

function membershipForSymbol(map: Map<string, SymbolMembership>, symbol: string): SymbolMembership {
  const result: SymbolMembership = { portfolioIds: new Set<string>(), watchlistIds: new Set<string>() };
  for (const key of symbolAliasKeys(symbol)) {
    const current = map.get(key);
    if (!current) continue;
    current.portfolioIds.forEach((id) => result.portfolioIds.add(id));
    current.watchlistIds.forEach((id) => result.watchlistIds.add(id));
  }
  return result;
}

function fmtDate(date: string) {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('ar-SA-u-ca-gregory');
  } catch {
    return date;
  }
}

function normalizeUrlKey(url: string): string {
  const raw = String(url || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    const search = parsed.search;
    return `${parsed.protocol}//${parsed.host}${path}${search}`.toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

function isSearchOrLandingSource(url: string): boolean {
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

function scoreSourceLink(link: { label: string; url: string }, event: UnifiedEvent): number {
  const label = String(link.label || '').toLowerCase();
  const url = String(link.url || '').toLowerCase();
  let score = 0;

  if (/الخبر|خبر|article|news/i.test(label)) score += 80;
  if (/yahoo earnings|earnings calendar|corporate actions|dividends|nasdaq earnings/i.test(label)) score += 60;
  if (/\/market-activity\/stocks\/.+\/earnings/.test(url)) score += 70;
  if (/\/analysis\?p=|\/history\?p=|\/analysis\/|\/history\//.test(url)) score += 55;
  if (/\/news\/|\/article|\/story/.test(url)) score += 50;
  if (/finance\.yahoo\.com\/quote\//.test(url)) score += 22;

  if (event.eventCategory === 'earnings' && /earnings|analysis/.test(url + label)) score += 18;
  if (event.eventType === 'dividend' && /dividend|history/.test(url + label)) score += 16;
  if ((event.eventType === 'split' || event.eventType === 'reverse_split') && /split/.test(url + label)) score += 16;

  if (/google news/.test(label) || url.includes('news.google.com/search')) score -= 20;
  if (isSearchOrLandingSource(url)) score -= 40;

  return score;
}

function eventSourceLinks(event: UnifiedEvent): Array<{ label: string; url: string }> {
  const links = Array.isArray(event.sourceLinks) ? event.sourceLinks : [];
  const fallback = event.url ? [{ label: 'فتح الخبر', url: event.url }] : [];
  const merged = [...links, ...fallback]
    .map((link) => ({ label: String(link.label || '').trim(), url: String(link.url || '').trim() }))
    .filter((link) => link.label && /^https?:\/\//i.test(link.url));

  const deduped = new Map<string, { label: string; url: string; score: number }>();
  for (const link of merged) {
    const key = normalizeUrlKey(link.url);
    if (!key) continue;
    const score = scoreSourceLink(link, event);
    const current = deduped.get(key);
    if (!current || score > current.score) {
      deduped.set(key, { ...link, score });
    }
  }

  return [...deduped.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ label, url }) => ({ label, url }));
}

function pickDirectSourceLink(event: UnifiedEvent): { label: string; url: string } | null {
  const links = eventSourceLinks(event);
  if (links.length === 0) return null;
  const explicit = links.find((link) => /الخبر|خبر|article|news/i.test(link.label));
  if (explicit) return explicit;
  const directPreferred = links.find(
    (link) => !isSearchOrLandingSource(link.url) && scoreSourceLink(link, event) >= 10
  );
  if (directPreferred) return directPreferred;
  const direct = links.find((link) => !isSearchOrLandingSource(link.url));
  return direct || links[0] || null;
}

function applyFocusPreset(
  focus: string,
  setCategoryFilter: (value: string) => void,
  setEventTypeFilter: (value: string) => void,
  setStatusFilter: (value: string) => void
) {
  const normalized = String(focus || '').trim().toLowerCase();
  if (!normalized) return;

  if (normalized === 'earnings') {
    setCategoryFilter('earnings');
    setEventTypeFilter('all');
    setStatusFilter('all');
    return;
  }
  if (normalized === 'corporate') {
    setCategoryFilter('corporate_action');
    setEventTypeFilter('all');
    setStatusFilter('all');
    return;
  }
  if (normalized === 'listing') {
    setCategoryFilter('listing_status');
    setEventTypeFilter('all');
    setStatusFilter('all');
    return;
  }
  if (normalized === 'split') {
    setCategoryFilter('corporate_action');
    setEventTypeFilter('split');
    setStatusFilter('all');
    return;
  }
  if (normalized === 'reverse_split') {
    setCategoryFilter('corporate_action');
    setEventTypeFilter('reverse_split');
    setStatusFilter('all');
    return;
  }
  if (normalized === 'bonus') {
    setCategoryFilter('corporate_action');
    setEventTypeFilter('bonus_issue');
    setStatusFilter('all');
    return;
  }
  if (normalized === 'suspension') {
    setCategoryFilter('listing_status');
    setEventTypeFilter('suspension');
    setStatusFilter('suspended');
    return;
  }
  if (normalized === 'delisting') {
    setCategoryFilter('listing_status');
    setEventTypeFilter('delisting');
    setStatusFilter('delisted');
  }
}

export default function CorporateActionsPage() {
  const { snapshot, portfolios } = usePortfolioSnapshot();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const appliedFocusRef = useRef<string>('');
  const appliedSymbolRef = useRef<string>('');

  const [hub, setHub] = useState<EventsHubResponse | null>(null);
  const [allSnapshots, setAllSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [watchlistAssets, setWatchlistAssets] = useState<WatchlistAssetPayload[]>([]);
  const [watchlistOptions, setWatchlistOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [selectedAssetKey, setSelectedAssetKey] = useState<string>('all');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [coverageFilter, setCoverageFilter] = useState<string>('all');
  const [portfolioScopeId, setPortfolioScopeId] = useState<string>('all');
  const [watchlistScopeId, setWatchlistScopeId] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [view, setView] = useState<'timeline' | 'table'>('timeline');

  const focusParam = (searchParams.get('focus') || '').trim().toLowerCase();
  const symbolParam = normalizeSymbol(searchParams.get('symbol') || '');

  const allPortfolioSnapshots = useMemo(() => {
    if (allSnapshots.length > 0) return allSnapshots;
    return snapshot ? [snapshot] : [];
  }, [allSnapshots, snapshot]);

  const portfolioAssets = useMemo(
    () => allPortfolioSnapshots.flatMap((portfolioSnapshot) => snapshotToAssets(portfolioSnapshot)),
    [allPortfolioSnapshots]
  );

  const portfolioFingerprint = useMemo(() => {
    return portfolioAssets
      .map((a) => `${a.portfolioId}:${a.symbol}:${a.assetType}`)
      .sort()
      .join('|');
  }, [portfolioAssets]);

  const portfolioOptions = useMemo(() => {
    const map = new Map<string, string>();
    portfolios.forEach((portfolio: PortfolioOption) => {
      if (portfolio.id) map.set(portfolio.id, portfolio.name || portfolio.id);
    });
    allPortfolioSnapshots.forEach((portfolioSnapshot) => {
      const id = String(portfolioSnapshot.portfolioId || '').trim();
      if (!id) return;
      map.set(id, String(portfolioSnapshot.portfolioName || id));
    });
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [allPortfolioSnapshots, portfolios]);

  useEffect(() => {
    let cancelled = false;
    const loadAllSnapshots = async () => {
      if (!portfolios.length) {
        setAllSnapshots(snapshot ? [snapshot] : []);
        return;
      }
      try {
        const snapshots = await fetchAllPortfoliosSnapshots(portfolios);
        if (cancelled) return;
        setAllSnapshots(snapshots.length > 0 ? snapshots : (snapshot ? [snapshot] : []));
      } catch {
        if (cancelled) return;
        setAllSnapshots(snapshot ? [snapshot] : []);
      }
    };
    void loadAllSnapshots();
    return () => { cancelled = true; };
  }, [portfolios, snapshot]);
  const referenceAssets = useMemo(() => REFERENCE_ASSETS, []);

  const assetOptions = useMemo(() => {
    const fromHub = (hub?.assets || []).map((asset) => ({
      symbol: normalizeSymbol(asset.symbol),
      name: asset.name || normalizeSymbol(asset.symbol),
      assetType: asset.assetType || inferAssetTypeBySymbol(normalizeSymbol(asset.symbol), asset.market),
      market: asset.market || null,
      source: asset.source || 'events_hub',
      sources: Array.isArray(asset.sources) ? asset.sources : [],
    })) as AssetPayload[];

    return mergeAssetOptions([
      ...referenceAssets,
      ...portfolioAssets,
      ...watchlistAssets,
      ...fromHub,
    ]);
  }, [hub?.assets, portfolioAssets, referenceAssets, watchlistAssets]);

  const selectedAssetPayload = useMemo(() => {
    const parsed = parseAssetOptionKey(selectedAssetKey);
    if (!parsed) return null;
    return {
      symbol: parsed.symbol,
      name: parsed.symbol,
      assetType: parsed.assetType,
      market: marketHintForAssetType(parsed.assetType),
      source: 'selected_asset',
    } satisfies AssetPayload;
  }, [selectedAssetKey]);

  useEffect(() => {
    if (symbolParam && appliedSymbolRef.current !== symbolParam) {
      setSearch(symbolParam);
      const matchedOption = assetOptions.find((option) => symbolsEquivalent(option.symbol, symbolParam));
      if (matchedOption) {
        setSelectedAssetKey(matchedOption.key);
      }
      appliedSymbolRef.current = symbolParam;
    }

    if (focusParam && appliedFocusRef.current !== focusParam) {
      applyFocusPreset(focusParam, setCategoryFilter, setEventTypeFilter, setStatusFilter);
      appliedFocusRef.current = focusParam;
    }
  }, [assetOptions, focusParam, symbolParam]);

  useEffect(() => {
    if (portfolioScopeId === 'all') return;
    if (!portfolioOptions.some((option) => option.id === portfolioScopeId)) {
      setPortfolioScopeId('all');
    }
  }, [portfolioOptions, portfolioScopeId]);

  useEffect(() => {
    if (watchlistScopeId === 'all') return;
    if (!watchlistOptions.some((option) => option.id === watchlistScopeId)) {
      setWatchlistScopeId('all');
    }
  }, [watchlistOptions, watchlistScopeId]);

  const loadHub = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [apiWatchlists] = await Promise.all([readApiWatchlistsDetailed()]);
      const localWatchlists = readLocalWatchlistsDetailed();
      const mergedWatchlistAssets = [
        ...apiWatchlists.assets,
        ...localWatchlists.assets,
      ];
      const mergedWatchlistOptions = [...new Map(
        [...apiWatchlists.lists, ...localWatchlists.lists]
          .filter((list) => list.id)
          .map((list) => [list.id, list])
      ).values()];
      setWatchlistAssets(mergedWatchlistAssets);
      setWatchlistOptions(mergedWatchlistOptions.sort((a, b) => a.name.localeCompare(b.name, 'ar')));

      const baseAssets = mergeAssets([...portfolioAssets, ...mergedWatchlistAssets]);
      const assets = selectedAssetPayload
        ? mergeAssets([...baseAssets, selectedAssetPayload])
        : baseAssets;

      const res = await fetch('/api/market/events-hub', {
        method: 'POST',
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ assets }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'فشل تحميل مركز الأحداث');
      setHub(data as EventsHubResponse);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر تحميل البيانات';
      setError(msg);
      toast({ title: 'تعذر جلب الأحداث', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [portfolioAssets, selectedAssetPayload, toast]);

  useEffect(() => {
    void loadHub(false);
  }, [portfolioFingerprint, loadHub]);

  const events = hub?.events || [];
  const coverageBySymbol = useMemo(() => {
    const map = new Map<string, Set<'portfolio' | 'watchlist' | 'other'>>();
    for (const asset of hub?.assets || []) {
      const symbol = normalizeSymbol(asset.symbol);
      if (!symbol) continue;
      const set = map.get(symbol) || new Set<'portfolio' | 'watchlist' | 'other'>();
      const rawSources = Array.isArray(asset.sources) && asset.sources.length > 0
        ? asset.sources
        : [asset.source || 'unknown'];
      rawSources.forEach((src) => set.add(normalizeCoverageTag(src)));
      map.set(symbol, set);
    }
    return map;
  }, [hub?.assets]);

  const symbolMembershipMap = useMemo(
    () => buildSymbolMembershipMap(portfolioAssets, watchlistAssets),
    [portfolioAssets, watchlistAssets]
  );

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((event) => {
      const membership = membershipForSymbol(symbolMembershipMap, event.symbol);
      const hasPortfolioMembership = membership.portfolioIds.size > 0;
      const hasWatchlistMembership = membership.watchlistIds.size > 0;

      if (selectedAssetPayload && !symbolsEquivalent(event.symbol, selectedAssetPayload.symbol)) return false;
      if (assetFilter !== 'all' && event.assetType !== assetFilter) return false;
      if (eventTypeFilter !== 'all' && event.eventType !== eventTypeFilter) return false;
      if (categoryFilter !== 'all' && event.eventCategory !== categoryFilter) return false;
      if (statusFilter !== 'all' && event.status !== statusFilter) return false;

      if (portfolioScopeId !== 'all' && !membership.portfolioIds.has(portfolioScopeId)) return false;
      if (watchlistScopeId !== 'all' && !membership.watchlistIds.has(watchlistScopeId)) return false;

      if (coverageFilter !== 'all') {
        const sourceSet = coverageBySymbol.get(event.symbol) || new Set(
          (event.assetSources || []).map((src) => normalizeCoverageTag(src))
        );
        const hasPortfolio = hasPortfolioMembership || sourceSet.has('portfolio');
        const hasWatchlist = hasWatchlistMembership || sourceSet.has('watchlist');
        if (coverageFilter === 'portfolio' && !hasPortfolio) return false;
        if (coverageFilter === 'watchlist' && !hasWatchlist) return false;
        if (coverageFilter === 'both' && !(hasPortfolio && hasWatchlist)) return false;
      }

      if (q) {
        const haystack = [
          event.symbol,
          event.name,
          event.titleAr,
          event.subtitleAr,
          event.eventTypeAr,
          event.eventType,
          event.currency,
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    events,
    search,
    selectedAssetPayload,
    assetFilter,
    coverageFilter,
    portfolioScopeId,
    watchlistScopeId,
    categoryFilter,
    eventTypeFilter,
    statusFilter,
    coverageBySymbol,
    symbolMembershipMap,
  ]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setSelectedAssetKey('all');
    setAssetFilter('all');
    setCoverageFilter('all');
    setPortfolioScopeId('all');
    setWatchlistScopeId('all');
    setCategoryFilter('all');
    setEventTypeFilter('all');
    setStatusFilter('all');
  }, []);

  const hasActiveFilters = useMemo(() => (
    search.trim().length > 0 ||
    selectedAssetKey !== 'all' ||
    assetFilter !== 'all' ||
    coverageFilter !== 'all' ||
    portfolioScopeId !== 'all' ||
    watchlistScopeId !== 'all' ||
    categoryFilter !== 'all' ||
    eventTypeFilter !== 'all' ||
    statusFilter !== 'all'
  ), [
    search,
    selectedAssetKey,
    assetFilter,
    coverageFilter,
    portfolioScopeId,
    watchlistScopeId,
    categoryFilter,
    eventTypeFilter,
    statusFilter,
  ]);

  const hiddenByFiltersCount = Math.max(0, events.length - filteredEvents.length);

  const health = hub?.health || [];
  const healthRisk = useMemo(
    () => health.filter((h) => h.status === 'suspended' || h.status === 'delisted'),
    [health]
  );

  const insights = useMemo(() => {
    const earningsActual = events.filter((event) => event.eventType === 'earnings_actual');
    const beatCount = earningsActual.filter((event) => event.status === 'beat').length;
    const missCount = earningsActual.filter((event) => event.status === 'miss').length;
    const inlineCount = earningsActual.filter((event) => event.status === 'inline').length;
    const evaluatedCount = beatCount + missCount + inlineCount;
    const beatRate = evaluatedCount > 0 ? (beatCount / evaluatedCount) * 100 : 0;

    const upcomingEvents = events.filter((event) => event.status === 'upcoming').length;
    const highImportance = events.filter((event) => event.importance >= 80).length;
    const splitEvents = events.filter((event) => event.eventType === 'split' || event.eventType === 'reverse_split').length;

    return {
      beatCount,
      missCount,
      inlineCount,
      beatRate,
      upcomingEvents,
      highImportance,
      splitEvents,
      evaluatedCount,
    };
  }, [events]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 transition-all duration-300 lg:mr-64">
        <TopBar title="🏛️ مركز الإجراءات المؤسسية والأرباح" />
        <main className="space-y-6 p-6">
          <Card className="overflow-hidden border-primary/20">
            <CardContent className="bg-gradient-to-br from-primary/10 via-background to-amber-500/10 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black">مركز الأحداث المؤسسية والأرباح</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    تقسيمات الأسهم، الإعلانات المتوقعة، النتائج الفعلية، وتنبيهات الشطب/الإيقاف مترجمة للعربية.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => setView('timeline')}>
                    <ListTree className="h-4 w-4" />
                    مخطط زمني
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => setView('table')}>
                    <TableProperties className="h-4 w-4" />
                    جدول
                  </Button>
                  <Button onClick={() => void loadHub(true)} className="gap-2">
                    {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    تحديث شامل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">الأصول المغطاة</p><p className="text-2xl font-black">{hub?.stats.assets ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">إجمالي الأحداث</p><p className="text-2xl font-black">{hub?.stats.events ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">إجراءات مؤسسية</p><p className="text-2xl font-black">{hub?.stats.corporateActions ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">أخبار منح الأسهم</p><p className="text-2xl font-black text-indigo-600">{hub?.stats.bonusNews ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">أرباح متوقعة</p><p className="text-2xl font-black text-blue-600">{hub?.stats.earningsExpected ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">أرباح فعلية</p><p className="text-2xl font-black text-emerald-600">{hub?.stats.earningsActual ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">شطب/إيقاف</p><p className="text-2xl font-black text-orange-600">{(hub?.stats.suspended ?? 0) + (hub?.stats.delisted ?? 0)}</p></CardContent></Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">نسبة تفوق نتائج الأرباح</p>
                <p className="text-2xl font-black text-emerald-600">{insights.beatRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  تفوق: {insights.beatCount} • أقل: {insights.missCount} • مطابق: {insights.inlineCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">أحداث قادمة</p>
                <p className="text-2xl font-black text-blue-600">{insights.upcomingEvents}</p>
                <p className="text-xs text-muted-foreground mt-1">متوقعة خلال الفترات المعلنة من المصادر</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">أحداث عالية الأهمية</p>
                <p className="text-2xl font-black text-amber-600">{insights.highImportance}</p>
                <p className="text-xs text-muted-foreground mt-1">مؤشر أهمية ≥ 80 بحسب مركز الأحداث</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">تقسيم/تقسيم عكسي</p>
                <p className="text-2xl font-black">{insights.splitEvents}</p>
                <p className="text-xs text-muted-foreground mt-1">يشمل split + reverse split</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">اختصارات فلترة سريعة:</span>
                <Button variant="outline" size="sm" onClick={() => { setCategoryFilter('all'); setEventTypeFilter('all'); setStatusFilter('all'); }}>
                  الكل
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setCategoryFilter('earnings'); setEventTypeFilter('all'); setStatusFilter('all'); }}>
                  الأرباح
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setCategoryFilter('corporate_action'); setEventTypeFilter('all'); setStatusFilter('all'); }}>
                  الإجراءات المؤسسية
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setCategoryFilter('listing_status'); setEventTypeFilter('all'); setStatusFilter('all'); }}>
                  الشطب/الإيقاف
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setCategoryFilter('corporate_action'); setEventTypeFilter('bonus_issue'); setStatusFilter('all'); }}>
                  منح الأسهم
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setCategoryFilter('corporate_action'); setEventTypeFilter('rights_issue'); setStatusFilter('all'); }}>
                  حقوق أولوية
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setCategoryFilter('corporate_action'); setEventTypeFilter('reverse_split'); setStatusFilter('all'); }}>
                  التقسيم العكسي
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Filter className="h-4 w-4" /> فلاتر متقدمة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالرمز أو اسم الأصل أو نوع الحدث..." className="pr-9" />
              </div>
              <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-9">
                <Select value={selectedAssetKey} onValueChange={setSelectedAssetKey}>
                  <SelectTrigger><SelectValue placeholder="الأصل بالاسم" /></SelectTrigger>
                  <SelectContent className="max-h-[320px]">
                    <SelectItem value="all">كل الأصول (بدون تحديد)</SelectItem>
                    {assetOptions.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={assetFilter} onValueChange={setAssetFilter}>
                  <SelectTrigger><SelectValue placeholder="نوع الأصل" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأصول</SelectItem>
                    <SelectItem value="stock">الأسهم</SelectItem>
                    <SelectItem value="fund">الصناديق</SelectItem>
                    <SelectItem value="sukuk">الصكوك</SelectItem>
                    <SelectItem value="bond">السندات</SelectItem>
                    <SelectItem value="forex">الفوركس</SelectItem>
                    <SelectItem value="crypto">العملات المشفرة</SelectItem>
                    <SelectItem value="commodity">السلع والمعادن</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={coverageFilter} onValueChange={setCoverageFilter}>
                  <SelectTrigger><SelectValue placeholder="النطاق" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المصادر</SelectItem>
                    <SelectItem value="portfolio">المحافظ فقط</SelectItem>
                    <SelectItem value="watchlist">قوائم المتابعة فقط</SelectItem>
                    <SelectItem value="both">الموجود في الاثنين</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={portfolioScopeId} onValueChange={setPortfolioScopeId}>
                  <SelectTrigger><SelectValue placeholder="محفظة محددة" /></SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    <SelectItem value="all">كل المحافظ</SelectItem>
                    {portfolioOptions.map((portfolio) => (
                      <SelectItem key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={watchlistScopeId} onValueChange={setWatchlistScopeId}>
                  <SelectTrigger><SelectValue placeholder="قائمة متابعة محددة" /></SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    <SelectItem value="all">كل قوائم المتابعة</SelectItem>
                    {watchlistOptions.map((watchlist) => (
                      <SelectItem key={watchlist.id} value={watchlist.id}>
                        {watchlist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger><SelectValue placeholder="فئة الحدث" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفئات</SelectItem>
                    <SelectItem value="corporate_action">الإجراءات المؤسسية</SelectItem>
                    <SelectItem value="earnings">الأرباح</SelectItem>
                    <SelectItem value="listing_status">الشطب/الإيقاف</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger><SelectValue placeholder="نوع الحدث" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الأنواع</SelectItem>
                    <SelectItem value="split">تقسيم</SelectItem>
                    <SelectItem value="reverse_split">تقسيم عكسي</SelectItem>
                    <SelectItem value="bonus_issue">منحة أسهم</SelectItem>
                    <SelectItem value="rights_issue">حقوق أولوية</SelectItem>
                    <SelectItem value="dividend">توزيع نقدي</SelectItem>
                    <SelectItem value="earnings_expected">أرباح متوقعة</SelectItem>
                    <SelectItem value="earnings_actual">أرباح فعلية</SelectItem>
                    <SelectItem value="suspension">إيقاف</SelectItem>
                    <SelectItem value="delisting">شطب</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="upcoming">متوقع</SelectItem>
                    <SelectItem value="announced">معلن</SelectItem>
                    <SelectItem value="beat">تفوق</SelectItem>
                    <SelectItem value="miss">أقل من المتوقع</SelectItem>
                    <SelectItem value="inline">مطابق للتوقعات</SelectItem>
                    <SelectItem value="suspended">إيقاف</SelectItem>
                    <SelectItem value="delisted">شطب</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="gap-2" onClick={resetFilters}>
                  إعادة ضبط الفلاتر
                </Button>
              </div>
            </CardContent>
          </Card>

          {hub?.warnings?.length ? (
            <Card className="border-amber-300">
              <CardContent className="space-y-2 p-4">
                <p className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> تنبيهات المصدر</p>
                {hub.warnings.map((warning, idx) => (
                  <p key={`${warning}_${idx}`} className="text-sm text-muted-foreground">• {warning}</p>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {healthRisk.length > 0 && (
            <Card className="border-orange-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" /> حالات الشطب/الإيقاف</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {healthRisk.map((item) => (
                    <div key={item.symbol} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold">{item.symbol} <span className="font-normal text-muted-foreground">• {item.name}</span></p>
                          <p className="text-xs text-muted-foreground mt-1">{item.reasonAr}</p>
                        </div>
                        <Badge className={cn('shrink-0 border', item.status === 'suspended' ? 'bg-orange-500/10 text-orange-700 border-orange-500/30' : 'bg-red-500/10 text-red-700 border-red-500/30')}>
                          {item.statusAr}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري بناء مركز الأحداث وتحليل المصادر...
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-red-300">
              <CardContent className="space-y-2 p-6">
                <p className="font-bold text-red-600">تعذر تحميل البيانات</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button onClick={() => void loadHub(true)} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  إعادة المحاولة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {view === 'timeline' ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Clock3 className="h-4 w-4" /> المخطط الزمني ({filteredEvents.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {filteredEvents.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                        <p>لا توجد أحداث مطابقة للفلاتر الحالية.</p>
                        {events.length > 0 && hasActiveFilters ? (
                          <div className="mt-3 space-y-2">
                            <p>تم إخفاء {hiddenByFiltersCount} حدث بسبب الفلاتر المحددة.</p>
                            <Button variant="outline" size="sm" onClick={resetFilters}>
                              عرض جميع الأحداث
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : filteredEvents.map((event) => {
                      const links = eventSourceLinks(event).slice(0, 4);
                      const directSource = pickDirectSourceLink(event);
                      return (
                        <div key={event.id} className="rounded-xl border p-4 hover:bg-muted/40 transition-colors">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-black">{event.titleAr}</p>
                                <Badge variant="outline">{event.symbol}</Badge>
                                <Badge variant="outline">{event.assetTypeAr}</Badge>
                                <Badge className={cn('border', statusBadgeClass(event.status))}>{event.statusAr}</Badge>
                                <Badge variant="secondary">{categoryLabel(event.eventCategory)}</Badge>
                                <Badge variant="outline">{eventTypeLabel(event.eventType)}</Badge>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">الاسم: {event.name}</p>
                              <p className="mt-2 text-sm text-muted-foreground">{event.subtitleAr}</p>
                              {event.reasonAr ? (
                                <p className="mt-1 text-xs text-orange-700">{event.reasonAr}</p>
                              ) : null}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold">{fmtDate(event.date)}</p>
                              <p className="text-xs text-muted-foreground">{event.datePrecision === 'estimated' ? 'تاريخ تقديري' : 'تاريخ فعلي'}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                              المصدر: {event.source} • العملة: {event.currency} ({event.currencySymbol})
                              {directSource ? (
                                <>
                                  {' '}•{' '}
                                  <a href={directSource.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                    الرابط المباشر
                                  </a>
                                </>
                              ) : null}
                            </p>
                            <div className="flex items-center gap-2">
                              {links.map((link) => {
                                const isDirect = directSource?.url === link.url;
                                return (
                                  <Button key={`${event.id}_${link.url}`} asChild size="sm" variant={isDirect ? 'secondary' : 'outline'}>
                                    <a href={link.url} target="_blank" rel="noreferrer">
                                      {isDirect ? 'الرابط المباشر' : link.label}
                                    </a>
                                  </Button>
                                );
                              })}
                              <Button asChild size="sm" variant="outline">
                                <Link href={`${toAssetRoute(event.assetType)}?symbol=${encodeURIComponent(event.symbol)}`}>
                                  فتح صفحة الأصل
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><TableProperties className="h-4 w-4" /> جدول الأحداث ({filteredEvents.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الرمز</TableHead>
                          <TableHead>الاسم</TableHead>
                          <TableHead>الأصل</TableHead>
                          <TableHead>الحدث</TableHead>
                          <TableHead>الفئة</TableHead>
                          <TableHead>التاريخ</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>العملة</TableHead>
                          <TableHead>المصدر</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEvents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-muted-foreground">
                              <div className="flex flex-col items-center gap-2 py-2">
                                <p>لا توجد نتائج.</p>
                                {events.length > 0 && hasActiveFilters ? (
                                  <>
                                    <p className="text-xs">تم إخفاء {hiddenByFiltersCount} حدث بسبب الفلاتر الحالية.</p>
                                    <Button variant="outline" size="sm" onClick={resetFilters}>
                                      عرض جميع الأحداث
                                    </Button>
                                  </>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : filteredEvents.map((event) => {
                          const directSource = pickDirectSourceLink(event);
                          return (
                            <TableRow key={event.id}>
                              <TableCell className="font-bold">{event.symbol}</TableCell>
                              <TableCell className="max-w-[220px] truncate" title={event.name}>{event.name}</TableCell>
                              <TableCell>{event.assetTypeAr}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-semibold">{eventTypeLabel(event.eventType)}</p>
                                  <p className="text-xs text-muted-foreground">{event.titleAr}</p>
                                </div>
                              </TableCell>
                              <TableCell>{categoryLabel(event.eventCategory)}</TableCell>
                              <TableCell>{fmtDate(event.date)}</TableCell>
                              <TableCell>
                                <Badge className={cn('border', statusBadgeClass(event.status))}>{event.statusAr}</Badge>
                              </TableCell>
                              <TableCell>{event.currency}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="max-w-[220px] truncate" title={event.source}>{event.source}</p>
                                  {directSource ? (
                                    <a
                                      href={directSource.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-primary hover:underline"
                                    >
                                      رابط المصدر المباشر
                                    </a>
                                  ) : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 p-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> التواريخ الموسومة "تقديري" هي تواريخ ربعية تقريبية عند عدم توفر تاريخ إعلان فعلي من المصدر.</div>
              <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> الربط يشمل الأصول من جميع المحافظ + قوائم المتابعة + صفحات الأسهم/الصناديق/السندات/الصكوك/الفوركس/العملات المشفرة/السلع والمعادن.</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> آخر تحديث: {hub?.updatedAt ? new Date(hub.updatedAt).toLocaleString('ar-SA-u-ca-gregory') : '—'}</div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
