/**
 * Market Hub — Public Entry Point
 *
 * استخدام نموذجي من أي صفحة:
 *
 *   // من الخادم / Route handler:
 *   import { fetchDomain } from '@/lib/market-hub';
 *   const quotes = await fetchDomain('crypto');
 *
 *   // من أي صفحة Client:
 *   import { useMarketHub } from '@/hooks/use-market-hub';
 *   const { data, loading, refresh } = useMarketHub({ domain: 'crypto' });
 */

export * from './types';
export {
  MARKET_DOMAINS,
  ALL_DOMAINS,
  DEFAULT_REFRESH_MS,
  FAST_REFRESH_MS,
  SLOW_REFRESH_MS,
  getDomain,
  isKnownDomain,
  resolveUpstream,
} from './registry';
export {
  adaptPricesResponse,
  adaptTickerResponse,
  adaptForexResponse,
  adaptRealPricesResponse,
  adaptFundsResponse,
} from './adapters';
export { fetchDomain } from './server';
export {
  PAGES,
  PAGE_CATEGORIES,
  getPage,
  getPagesByCategory,
  type PageEntry,
  type PageCategory,
} from './pages-registry';
export {
  EXTERNAL_SOURCES,
  SOURCE_CATEGORIES,
  getSourcesForDomain,
  getSourcesByCategory,
  type ExternalSource,
  type SourceCategory,
} from './sources-registry';
export {
  ACCOUNT_DOMAINS,
  ALL_ACCOUNT_DOMAINS,
  getAccountDomain,
  isKnownAccountDomain,
  type AccountDomain,
  type AccountRegistryEntry,
} from './account-registry';
