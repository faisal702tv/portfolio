/**
 * External Data Sources Registry
 *
 * سجل المصادر الخارجية الموثوقة التي يعتمد عليها المشروع. مرتبط بنطاقات
 * Market Hub عبر `domains: MarketDomain[]`. يُستخدم:
 *   - للعرض في صفحة `/api-registry` (الشفافية).
 *   - للاحتياط (fallback) عند الحاجة لتبديل مصدر.
 *   - كوثائق حيّة للفريق والمراجعين.
 */

import type { MarketDomain } from './types';

export type SourceCategory =
  | 'quote_provider'      // مزوّد أسعار (Yahoo, Google, FMP, Alpha Vantage, Twelve Data)
  | 'crypto_provider'     // مزوّد عملات مشفرة (CoinGecko, CoinMarketCap, Binance)
  | 'official_exchange'   // بورصة رسمية (Tadawul, DFM, NYSE, NASDAQ ...)
  | 'index_provider'      // مزوّد مؤشرات (S&P, FTSE, STOXX ...)
  | 'news'                // أخبار مالية
  | 'regulator'           // هيئة تنظيمية
  | 'reference';          // مرجعي

export interface ExternalSource {
  id: string;
  labelAr: string;
  labelEn: string;
  url: string;
  /** نوع المصدر. */
  category: SourceCategory;
  /** النطاقات التي يغذّيها. */
  domains: readonly MarketDomain[];
  /** هل يتطلب مفتاح API. */
  requiresApiKey: boolean;
  /** درجة الثقة الذاتية (1-5). */
  reliability: 1 | 2 | 3 | 4 | 5;
  /** ملاحظات للمطوّر. */
  notes?: string;
  /** موقع صفحة Terms / Policy إن وُجد. */
  termsUrl?: string;
}

export const EXTERNAL_SOURCES: ExternalSource[] = [
  // ============================================================
  // مزوّدو الأسعار العامة (الأسهم، المؤشرات، السلع، الفوركس)
  // ============================================================
  {
    id: 'yahoo_finance',
    labelAr: 'ياهو فاينانس',
    labelEn: 'Yahoo Finance',
    url: 'https://finance.yahoo.com',
    category: 'quote_provider',
    domains: ['stocks', 'indices', 'forex', 'commodities', 'metals', 'energy', 'etfs', 'reits', 'saudi'],
    requiresApiKey: false,
    reliability: 4,
    notes: 'مصدر رئيسي — يُستخدم كـ upstream في /api/ticker و /api/live-prices. يدعم رموز السعودية (2222.SR)، الإمارات (.AD/.DU)، قطر (.QA)، البحرين (.BH)، مصر (.CA)، الأردن (.JO)، عُمان (.OM)، الكويت (.KW).',
    termsUrl: 'https://legal.yahoo.com/us/en/yahoo/terms/product-atos/apiforydn/index.html',
  },
  {
    id: 'google_finance',
    labelAr: 'جوجل فاينانس',
    labelEn: 'Google Finance',
    url: 'https://www.google.com/finance',
    category: 'quote_provider',
    domains: ['stocks', 'indices', 'forex', 'commodities'],
    requiresApiKey: false,
    reliability: 4,
    notes: 'مصدر احتياطي للتحقق. الرموز بصيغة EXCHANGE:TICKER (TADAWUL:2222, NASDAQ:AAPL).',
  },
  {
    id: 'alpha_vantage',
    labelAr: 'Alpha Vantage',
    labelEn: 'Alpha Vantage',
    url: 'https://www.alphavantage.co',
    category: 'quote_provider',
    domains: ['stocks', 'indices', 'forex', 'crypto', 'commodities'],
    requiresApiKey: true,
    reliability: 4,
    notes: 'يستخدم في /api/market/quote. حد مجاني: 25 طلب/يوم.',
  },
  {
    id: 'fmp',
    labelAr: 'Financial Modeling Prep',
    labelEn: 'FMP',
    url: 'https://financialmodelingprep.com',
    category: 'quote_provider',
    domains: ['stocks', 'indices', 'etfs'],
    requiresApiKey: true,
    reliability: 4,
    notes: 'بيانات أساسية وميزانيات. يستخدم في /api/market/quote.',
  },
  {
    id: 'twelve_data',
    labelAr: 'Twelve Data',
    labelEn: 'Twelve Data',
    url: 'https://twelvedata.com',
    category: 'quote_provider',
    domains: ['stocks', 'indices', 'forex', 'crypto'],
    requiresApiKey: true,
    reliability: 4,
  },
  {
    id: 'tradingview',
    labelAr: 'TradingView',
    labelEn: 'TradingView',
    url: 'https://www.tradingview.com',
    category: 'quote_provider',
    domains: ['stocks', 'indices', 'forex', 'crypto', 'commodities'],
    requiresApiKey: false,
    reliability: 5,
    notes: 'تستخدم للرسوم البيانية والروابط الخارجية من الخريطة الحرارية (TADAWUL:, DFM:, KSE:, QSE:, EGX:, BHB:, MSM:, ASE:).',
  },
  {
    id: 'investing',
    labelAr: 'Investing.com',
    labelEn: 'Investing.com',
    url: 'https://www.investing.com',
    category: 'quote_provider',
    domains: ['stocks', 'indices', 'forex', 'commodities', 'bonds'],
    requiresApiKey: false,
    reliability: 4,
  },

  // ============================================================
  // العملات المشفرة
  // ============================================================
  {
    id: 'coingecko',
    labelAr: 'CoinGecko',
    labelEn: 'CoinGecko',
    url: 'https://www.coingecko.com',
    category: 'crypto_provider',
    domains: ['crypto'],
    requiresApiKey: false,
    reliability: 5,
    notes: 'المصدر الرئيسي في /api/real-prices?type=crypto. واجهة مجانية مع حدود معقولة.',
  },
  {
    id: 'coinmarketcap',
    labelAr: 'CoinMarketCap',
    labelEn: 'CoinMarketCap',
    url: 'https://coinmarketcap.com',
    category: 'crypto_provider',
    domains: ['crypto'],
    requiresApiKey: true,
    reliability: 5,
  },
  {
    id: 'binance',
    labelAr: 'Binance',
    labelEn: 'Binance',
    url: 'https://www.binance.com',
    category: 'crypto_provider',
    domains: ['crypto'],
    requiresApiKey: false,
    reliability: 5,
  },

  // ============================================================
  // البورصات الرسمية — الشرق الأوسط
  // ============================================================
  {
    id: 'saudi_exchange',
    labelAr: 'السوق المالية السعودية (تداول)',
    labelEn: 'Saudi Exchange (Tadawul)',
    url: 'https://www.saudiexchange.sa',
    category: 'official_exchange',
    domains: ['saudi', 'stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
    notes: 'المصدر الرسمي لـ TASI, MT30, NOMUC والسوق الرئيسي وسوق نمو.',
  },
  {
    id: 'adx',
    labelAr: 'سوق أبوظبي للأوراق المالية',
    labelEn: 'Abu Dhabi Securities Exchange',
    url: 'https://www.adx.ae',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'dfm',
    labelAr: 'سوق دبي المالي',
    labelEn: 'Dubai Financial Market',
    url: 'https://www.dfm.ae',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'boursa_kuwait',
    labelAr: 'بورصة الكويت',
    labelEn: 'Boursa Kuwait',
    url: 'https://www.boursakuwait.com.kw',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'qatar_exchange',
    labelAr: 'بورصة قطر',
    labelEn: 'Qatar Stock Exchange',
    url: 'https://www.qe.com.qa',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'bahrain_bourse',
    labelAr: 'بورصة البحرين',
    labelEn: 'Bahrain Bourse',
    url: 'https://www.bahrainbourse.com',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'msx',
    labelAr: 'بورصة مسقط',
    labelEn: 'Muscat Stock Exchange',
    url: 'https://www.msx.om',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'egx',
    labelAr: 'البورصة المصرية',
    labelEn: 'Egyptian Exchange',
    url: 'https://www.egx.com.eg',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'ase',
    labelAr: 'بورصة عمّان',
    labelEn: 'Amman Stock Exchange',
    url: 'https://www.ase.com.jo',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },

  // ============================================================
  // البورصات الرسمية — العالمية
  // ============================================================
  {
    id: 'nyse',
    labelAr: 'بورصة نيويورك',
    labelEn: 'NYSE',
    url: 'https://www.nyse.com',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'nasdaq',
    labelAr: 'ناسداك',
    labelEn: 'NASDAQ',
    url: 'https://www.nasdaq.com',
    category: 'official_exchange',
    domains: ['stocks', 'indices', 'etfs'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'lse',
    labelAr: 'بورصة لندن',
    labelEn: 'London Stock Exchange',
    url: 'https://www.londonstockexchange.com',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'xetra',
    labelAr: 'بورصة فرانكفورت',
    labelEn: 'Deutsche Börse / XETRA',
    url: 'https://www.deutsche-boerse.com',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'euronext',
    labelAr: 'يورونكست',
    labelEn: 'Euronext',
    url: 'https://www.euronext.com',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'jpx',
    labelAr: 'بورصة طوكيو',
    labelEn: 'Japan Exchange Group',
    url: 'https://www.jpx.co.jp/english/',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'hkex',
    labelAr: 'بورصة هونغ كونغ',
    labelEn: 'HKEX',
    url: 'https://www.hkex.com.hk',
    category: 'official_exchange',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 5,
  },

  // ============================================================
  // مزوّدو المؤشرات
  // ============================================================
  {
    id: 'sp_dow_jones',
    labelAr: 'S&P Dow Jones Indices',
    labelEn: 'S&P Dow Jones Indices',
    url: 'https://www.spglobal.com/spdji/en/',
    category: 'index_provider',
    domains: ['indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'ftse_russell',
    labelAr: 'FTSE Russell',
    labelEn: 'FTSE Russell',
    url: 'https://www.lseg.com/en/ftse-russell',
    category: 'index_provider',
    domains: ['indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'stoxx',
    labelAr: 'STOXX',
    labelEn: 'STOXX',
    url: 'https://www.stoxx.com',
    category: 'index_provider',
    domains: ['indices'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'msci',
    labelAr: 'MSCI',
    labelEn: 'MSCI',
    url: 'https://www.msci.com',
    category: 'index_provider',
    domains: ['indices'],
    requiresApiKey: false,
    reliability: 5,
  },

  // ============================================================
  // السلع والطاقة
  // ============================================================
  {
    id: 'cme',
    labelAr: 'CME Group',
    labelEn: 'CME Group',
    url: 'https://www.cmegroup.com',
    category: 'official_exchange',
    domains: ['commodities', 'metals', 'energy'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'lbma',
    labelAr: 'London Bullion Market',
    labelEn: 'LBMA',
    url: 'https://www.lbma.org.uk',
    category: 'index_provider',
    domains: ['metals'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'opec',
    labelAr: 'أوبك',
    labelEn: 'OPEC',
    url: 'https://www.opec.org',
    category: 'reference',
    domains: ['energy'],
    requiresApiKey: false,
    reliability: 5,
  },

  // ============================================================
  // الهيئات التنظيمية
  // ============================================================
  {
    id: 'cma_sa',
    labelAr: 'هيئة السوق المالية السعودية',
    labelEn: 'Saudi CMA',
    url: 'https://cma.org.sa',
    category: 'regulator',
    domains: ['stocks', 'funds', 'sukuk', 'saudi'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'sec',
    labelAr: 'هيئة الأوراق المالية الأمريكية',
    labelEn: 'U.S. SEC',
    url: 'https://www.sec.gov',
    category: 'regulator',
    domains: ['stocks', 'funds', 'etfs'],
    requiresApiKey: false,
    reliability: 5,
  },

  // ============================================================
  // الأخبار
  // ============================================================
  {
    id: 'reuters',
    labelAr: 'رويترز',
    labelEn: 'Reuters',
    url: 'https://www.reuters.com',
    category: 'news',
    domains: ['stocks', 'indices', 'forex', 'commodities'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'bloomberg',
    labelAr: 'بلومبرغ',
    labelEn: 'Bloomberg',
    url: 'https://www.bloomberg.com',
    category: 'news',
    domains: ['stocks', 'indices', 'forex', 'commodities'],
    requiresApiKey: false,
    reliability: 5,
  },
  {
    id: 'cnbc',
    labelAr: 'CNBC',
    labelEn: 'CNBC',
    url: 'https://www.cnbc.com',
    category: 'news',
    domains: ['stocks', 'indices'],
    requiresApiKey: false,
    reliability: 4,
  },
  {
    id: 'argaam',
    labelAr: 'أرقام',
    labelEn: 'Argaam',
    url: 'https://www.argaam.com',
    category: 'news',
    domains: ['saudi', 'stocks'],
    requiresApiKey: false,
    reliability: 5,
    notes: 'المصدر الرائد للأخبار المالية في السوق السعودي والخليجي.',
  },
  {
    id: 'mubasher',
    labelAr: 'مباشر',
    labelEn: 'Mubasher',
    url: 'https://www.mubasher.info',
    category: 'news',
    domains: ['stocks', 'indices', 'saudi'],
    requiresApiKey: false,
    reliability: 4,
  },
];

export const SOURCE_CATEGORIES: Record<SourceCategory, { labelAr: string; labelEn: string }> = {
  quote_provider: { labelAr: 'مزوّدو الأسعار', labelEn: 'Quote Providers' },
  crypto_provider: { labelAr: 'مزوّدو العملات المشفرة', labelEn: 'Crypto Providers' },
  official_exchange: { labelAr: 'البورصات الرسمية', labelEn: 'Official Exchanges' },
  index_provider: { labelAr: 'مزوّدو المؤشرات', labelEn: 'Index Providers' },
  news: { labelAr: 'مصادر الأخبار', labelEn: 'News Sources' },
  regulator: { labelAr: 'الهيئات التنظيمية', labelEn: 'Regulators' },
  reference: { labelAr: 'مراجع', labelEn: 'Reference' },
};

export function getSourcesForDomain(domain: MarketDomain): ExternalSource[] {
  return EXTERNAL_SOURCES.filter((s) => s.domains.includes(domain));
}

export function getSourcesByCategory(category: SourceCategory): ExternalSource[] {
  return EXTERNAL_SOURCES.filter((s) => s.category === category);
}
