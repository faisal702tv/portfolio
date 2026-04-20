/**
 * Market Hub — Unified Types
 *
 * نقطة مركزية واحدة لتعريف أنواع بيانات السوق عبر جميع صفحات المشروع:
 * الأسهم، المؤشرات، العملات المشفرة، الفوركس، السلع، المعادن، الصكوك،
 * السندات، الصناديق، REITs، ETFs، وأشرطة التمرير.
 *
 * جميع صفحات المشروع يجب أن تستهلك البيانات عبر هذه الأنواع، وبالتالي:
 *   - أي تغيير في شكل البيانات يحدث في مكان واحد فقط.
 *   - أي صفحة جديدة تضاف في المستقبل ترث نفس العقود تلقائياً.
 */

/** معرّفات النطاقات (Domains) المدعومة في المشروع. */
export type MarketDomain =
  | 'stocks'
  | 'indices'
  | 'crypto'
  | 'forex'
  | 'commodities'
  | 'metals'
  | 'energy'
  | 'bonds'
  | 'sukuk'
  | 'funds'
  | 'etfs'
  | 'reits'
  | 'saudi';

/** الشكل الموحّد لسعر أصل مباشر — يستخدمه كل شيء في المشروع. */
export interface MarketQuote {
  /** رمز الأصل القانوني (TADAWUL:2222, BTC, EURUSD, GC=F ...). */
  symbol: string;
  /** الاسم المقروء للعرض. */
  name?: string;
  /** السعر الحالي. */
  price: number;
  /** التغيّر المطلق (قد يكون null إن لم يتوفر). */
  change: number | null;
  /** التغيّر النسبي ٪. */
  changePct: number | null;
  /** أعلى اليوم. */
  high?: number | null;
  /** أدنى اليوم. */
  low?: number | null;
  /** أعلى 52 أسبوع. */
  high52w?: number | null;
  /** أدنى 52 أسبوع. */
  low52w?: number | null;
  /** حجم التداول. */
  volume?: number | null;
  /** متوسط الحجم. */
  averageVolume?: number | null;
  /** القيمة السوقية. */
  marketCap?: number | null;
  /** العملة. */
  currency?: string;
  /** البورصة. */
  exchange?: string;
  /** النطاق الذي ينتمي إليه هذا الأصل. */
  domain: MarketDomain;
  /** مصدر البيانات (yahoo, coingecko, fallback, cache ...). */
  source?: string | null;
  /** هل البيانات مباشرة أم من ذاكرة تخزين مؤقت / ثابتة. */
  live: boolean;
  /** طابع زمني للتحديث الأخير (ms). */
  lastUpdate: number;
}

/** استجابة موحّدة من `/api/market-hub`. */
export interface MarketHubResponse {
  success: boolean;
  domain: MarketDomain | 'all';
  cached: boolean;
  timestamp: number;
  count: number;
  /** قاموس الرموز → أسعار. */
  data: Record<string, MarketQuote>;
  /** رسالة خطأ اختيارية (لا تكسر الصفحات — `success=false` ومصفوفة فارغة). */
  error?: string;
}

/** خيارات الاستعلام عن النطاقات. */
export interface MarketHubQuery {
  domain: MarketDomain | 'all';
  symbols?: string[];
  /** هل نفرض تحديث الكاش. */
  fresh?: boolean;
}

/** تعريف نطاق في السجل (Registry). */
export interface DomainRegistryEntry {
  id: MarketDomain;
  /** تسمية عربية للعرض. */
  labelAr: string;
  /** تسمية إنجليزية. */
  labelEn: string;
  /** المسار (route) الداخلي الذي يخدم هذا النطاق حالياً. */
  sourceEndpoint: string;
  /** فئة مقابلة في `/api/prices` إن وجدت (للتوافق مع useLivePrices القديم). */
  pricesCategory?:
    | 'crypto'
    | 'forex'
    | 'metals'
    | 'indices'
    | 'energy'
    | 'saudi'
    | 'all';
  /** فاصل التحديث التلقائي الافتراضي بالملّي ثانية. */
  refreshMs: number;
  /** صفحات المشروع المرتبطة بهذا النطاق (ثابتة — للتنقل والاكتشاف). */
  pages: readonly string[];
  /** مكونات UI المشتركة التي تستهلك هذا النطاق. */
  components?: readonly string[];
  /** ملفات البيانات الثابتة المرتبطة (للرموز والميتاداتا). */
  staticData?: readonly string[];
  /** وصف مختصر. */
  description: string;
}
