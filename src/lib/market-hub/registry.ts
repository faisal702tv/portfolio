/**
 * Market Hub — Domain Registry (Single Source of Truth)
 *
 * هذا الملف هو "الخريطة" الثابتة لكل نطاقات البيانات في المشروع.
 * عند إضافة صفحة جديدة أو API جديد:
 *   1) أضف/حدّث المدخلة المناسبة هنا فقط.
 *   2) جميع الصفحات والـ hooks ستستهلكها تلقائياً عبر `useMarketHub`.
 *
 * القاعدة الذهبية: لا تربط أي صفحة بـ fetch مباشر لـ `/api/...`. اربطها
 * دائماً عبر `useMarketHub({ domain })` حتى لو تغيّر الـ endpoint الخلفي
 * لاحقاً، لن تحتاج لتعديل أي صفحة.
 */

import type { DomainRegistryEntry, MarketDomain } from './types';

export const DEFAULT_REFRESH_MS = 60_000;
export const FAST_REFRESH_MS = 30_000;
export const SLOW_REFRESH_MS = 5 * 60_000;

export const MARKET_DOMAINS: Record<MarketDomain, DomainRegistryEntry> = {
  stocks: {
    id: 'stocks',
    labelAr: 'الأسهم',
    labelEn: 'Stocks',
    sourceEndpoint: '/api/ticker',
    pricesCategory: 'all',
    refreshMs: DEFAULT_REFRESH_MS,
    pages: ['/stocks', '/markets', '/markets/[market]', '/heatmap', '/screener'],
    components: ['StockMovers', 'MarketTicker', 'GlobalMarketTicker'],
    staticData: [
      'src/data/saudi_stocks_database.ts',
      'src/data/uae_stocks_database.ts',
      'src/data/kuwait_stocks_database.ts',
      'src/data/qatar_stocks_database.ts',
      'src/data/bahrain_stocks_database.ts',
      'src/data/oman_stocks_database.ts',
      'src/data/egypt_stocks_database.ts',
      'src/data/us_stocks_database.json',
      'src/data/symbols-database.ts',
    ],
    description: 'الأسهم المحلية والعالمية مع بيانات مباشرة + أعلى/أدنى 52 أسبوع.',
  },
  indices: {
    id: 'indices',
    labelAr: 'المؤشرات',
    labelEn: 'Indices',
    sourceEndpoint: '/api/ticker',
    pricesCategory: 'indices',
    refreshMs: FAST_REFRESH_MS,
    pages: ['/markets', '/heatmap', '/'],
    components: ['MarketOverviewBar', 'GlobalMarketTicker', 'MarketTicker'],
    staticData: ['src/data/markets.ts'],
    description: 'مؤشرات الأسواق العالمية (TASI, S&P500, DAX, NIKKEI ...).',
  },
  crypto: {
    id: 'crypto',
    labelAr: 'العملات المشفرة',
    labelEn: 'Crypto',
    sourceEndpoint: '/api/real-prices',
    pricesCategory: 'crypto',
    refreshMs: FAST_REFRESH_MS,
    pages: ['/crypto', '/markets', '/'],
    components: ['GlobalMarketTicker'],
    staticData: ['src/data/markets.ts'],
    description: 'العملات المشفرة مباشرة من CoinGecko.',
  },
  forex: {
    id: 'forex',
    labelAr: 'العملات الأجنبية',
    labelEn: 'Forex',
    sourceEndpoint: '/api/forex',
    pricesCategory: 'forex',
    refreshMs: DEFAULT_REFRESH_MS,
    pages: ['/forex', '/markets', '/'],
    components: ['GlobalMarketTicker'],
    staticData: ['src/data/markets.ts'],
    description: 'أزواج العملات (Majors / Minors / Arab / Emerging).',
  },
  commodities: {
    id: 'commodities',
    labelAr: 'السلع',
    labelEn: 'Commodities',
    sourceEndpoint: '/api/prices',
    pricesCategory: 'metals',
    refreshMs: DEFAULT_REFRESH_MS,
    pages: ['/commodities', '/markets'],
    staticData: ['src/data/markets.ts'],
    description: 'السلع الزراعية والصناعية + المعادن والطاقة.',
  },
  metals: {
    id: 'metals',
    labelAr: 'المعادن الثمينة',
    labelEn: 'Precious Metals',
    sourceEndpoint: '/api/prices',
    pricesCategory: 'metals',
    refreshMs: DEFAULT_REFRESH_MS,
    pages: ['/commodities', '/markets'],
    staticData: ['src/data/markets.ts'],
    description: 'الذهب والفضة والبلاتين والبلاديوم.',
  },
  energy: {
    id: 'energy',
    labelAr: 'الطاقة',
    labelEn: 'Energy',
    sourceEndpoint: '/api/prices',
    pricesCategory: 'energy',
    refreshMs: DEFAULT_REFRESH_MS,
    pages: ['/commodities', '/markets'],
    staticData: ['src/data/markets.ts'],
    description: 'النفط والغاز ومشتقاتهما.',
  },
  bonds: {
    id: 'bonds',
    labelAr: 'السندات',
    labelEn: 'Bonds',
    sourceEndpoint: '/api/funds',
    refreshMs: SLOW_REFRESH_MS,
    pages: ['/bonds'],
    description: 'السندات السيادية والشركات.',
  },
  sukuk: {
    id: 'sukuk',
    labelAr: 'الصكوك',
    labelEn: 'Sukuk',
    sourceEndpoint: '/api/funds',
    refreshMs: SLOW_REFRESH_MS,
    pages: ['/bonds', '/funds'],
    description: 'الصكوك الإسلامية السيادية والشركات.',
  },
  funds: {
    id: 'funds',
    labelAr: 'الصناديق',
    labelEn: 'Funds',
    sourceEndpoint: '/api/funds',
    refreshMs: SLOW_REFRESH_MS,
    pages: ['/funds'],
    staticData: ['src/data/funds_database.json', 'src/data/funds_merged.json'],
    description: 'الصناديق السعودية والخليجية والعالمية.',
  },
  etfs: {
    id: 'etfs',
    labelAr: 'صناديق ETF',
    labelEn: 'ETFs',
    sourceEndpoint: '/api/funds',
    refreshMs: SLOW_REFRESH_MS,
    pages: ['/funds'],
    description: 'صناديق الاستثمار المتداولة.',
  },
  reits: {
    id: 'reits',
    labelAr: 'الصناديق العقارية',
    labelEn: 'REITs',
    sourceEndpoint: '/api/funds',
    refreshMs: SLOW_REFRESH_MS,
    pages: ['/funds'],
    description: 'صناديق الاستثمار العقاري المتداولة.',
  },
  saudi: {
    id: 'saudi',
    labelAr: 'السوق السعودي',
    labelEn: 'Saudi Market',
    sourceEndpoint: '/api/ticker',
    pricesCategory: 'saudi',
    refreshMs: FAST_REFRESH_MS,
    pages: ['/markets/tadawul', '/heatmap', '/stocks'],
    staticData: ['src/data/saudi_stocks_database.ts'],
    description: 'الأسهم السعودية + مؤشرات تداول ونمو.',
  },
};

/** قائمة كل النطاقات. */
export const ALL_DOMAINS: readonly MarketDomain[] = Object.keys(
  MARKET_DOMAINS,
) as MarketDomain[];

/** جلب مدخلة النطاق بأمان. */
export function getDomain(domain: MarketDomain): DomainRegistryEntry {
  return MARKET_DOMAINS[domain];
}

/** التحقق من أن السلسلة النصية هي نطاق معروف. */
export function isKnownDomain(value: string): value is MarketDomain {
  return value in MARKET_DOMAINS;
}

/** مفتاح التوجيه (route key) من النطاق — يستخدم في `/api/market-hub`. */
export function resolveUpstream(domain: MarketDomain): {
  endpoint: string;
  pricesCategory?: string;
} {
  const entry = MARKET_DOMAINS[domain];
  return { endpoint: entry.sourceEndpoint, pricesCategory: entry.pricesCategory };
}
