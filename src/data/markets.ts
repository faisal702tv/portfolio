// Multi-Market Configuration
// بيانات الأسواق المالية المتعددة

export interface Market {
  code: string;
  name: string;
  nameEn: string;
  country: string;
  countryAr: string;
  currency: string;
  currencySymbol: string;
  currencyName: string;
  timezone: string;
  openTime: string;
  closeTime: string;
  tradingDays: string;
  mainIndex: string;
  mainIndexName: string;
  flag: string;
  type: 'stock' | 'crypto' | 'commodity' | 'forex';
}

export interface MarketIndex {
  symbol: string;
  name: string;
  market: string;
  yahoo?: string;
  price: number;
  change: number;
  changePct: number;
  currency: string;
  currencySymbol: string;
}

// أنواع الأسواق
export const marketTypes = {
  stock: { name: 'أسهم', nameEn: 'Stocks', icon: '📈' },
  crypto: { name: 'عملات رقمية', nameEn: 'Cryptocurrencies', icon: '₿' },
  commodity: { name: 'سلع', nameEn: 'Commodities', icon: '🥇' },
  forex: { name: 'عملات', nameEn: 'Forex', icon: '💱' },
};

// الأسواق المدعومة
export const markets: Market[] = [
  // ═══════════════════════════════════════════════════════════════
  // أسواق الأسهم
  // ═══════════════════════════════════════════════════════════════
  {
    code: 'TADAWUL',
    name: 'سوق الأسهم السعودية',
    nameEn: 'Saudi Stock Exchange (Tadawul)',
    country: 'SA',
    countryAr: 'المملكة العربية السعودية',
    currency: 'SAR',
    currencySymbol: 'ر.س',
    currencyName: 'ريال سعودي',
    timezone: 'Asia/Riyadh',
    openTime: '10:00',
    closeTime: '15:00',
    tradingDays: 'الأحد - الخميس',
    mainIndex: 'TASI',
    mainIndexName: 'مؤشر تداول جميع الأسهم',
    flag: '🇸🇦',
    type: 'stock',
  },
  {
    code: 'ADX',
    name: 'سوق أبوظبي للأوراق المالية',
    nameEn: 'Abu Dhabi Securities Exchange',
    country: 'AE',
    countryAr: 'الإمارات العربية المتحدة - أبوظبي',
    currency: 'AED',
    currencySymbol: 'د.إ',
    currencyName: 'درهم إماراتي',
    timezone: 'Asia/Dubai',
    openTime: '10:00',
    closeTime: '14:00',
    tradingDays: 'الإثنين - الجمعة',
    mainIndex: 'FTSEADX',
    mainIndexName: 'مؤشر فوتسي أبوظبي العام',
    flag: '🇦🇪',
    type: 'stock',
  },
  {
    code: 'DFM',
    name: 'سوق دبي المالي',
    nameEn: 'Dubai Financial Market',
    country: 'AE',
    countryAr: 'الإمارات العربية المتحدة - دبي',
    currency: 'AED',
    currencySymbol: 'د.إ',
    currencyName: 'درهم إماراتي',
    timezone: 'Asia/Dubai',
    openTime: '10:00',
    closeTime: '14:00',
    tradingDays: 'الإثنين - الجمعة',
    mainIndex: 'DFMGI',
    mainIndexName: 'مؤشر دبي المالي العام',
    flag: '🇦🇪',
    type: 'stock',
  },
  {
    code: 'NASDAQ_DUBAI',
    name: 'سوق ناسداك دبي',
    nameEn: 'Nasdaq Dubai',
    country: 'AE',
    countryAr: 'الإمارات العربية المتحدة - ناسداك دبي',
    currency: 'AED',
    currencySymbol: 'د.إ',
    currencyName: 'درهم إماراتي',
    timezone: 'Asia/Dubai',
    openTime: '10:00',
    closeTime: '14:00',
    tradingDays: 'الإثنين - الجمعة',
    mainIndex: 'DIFX',
    mainIndexName: 'مؤشر ناسداك دبي',
    flag: '🇦🇪',
    type: 'stock',
  },
  {
    code: 'ASE',
    name: 'بورصة عمان',
    nameEn: 'Amman Stock Exchange',
    country: 'JO',
    countryAr: 'المملكة الأردنية الهاشمية',
    currency: 'JOD',
    currencySymbol: 'د.أ',
    currencyName: 'دينار أردني',
    timezone: 'Asia/Amman',
    openTime: '10:00',
    closeTime: '12:00',
    tradingDays: 'الأحد - الخميس',
    mainIndex: 'ASE',
    mainIndexName: 'مؤشر عمان العام',
    flag: '🇯🇴',
    type: 'stock',
  },
  {
    code: 'KSE',
    name: 'بورصة الكويت',
    nameEn: 'Kuwait Stock Exchange',
    country: 'KW',
    countryAr: 'دولة الكويت',
    currency: 'KWD',
    currencySymbol: 'د.ك',
    currencyName: 'دينار كويتي',
    timezone: 'Asia/Kuwait',
    openTime: '09:00',
    closeTime: '13:00',
    tradingDays: 'الأحد - الخميس',
    mainIndex: 'KSE',
    mainIndexName: 'مؤشر الكويت العام',
    flag: '🇰🇼',
    type: 'stock',
  },
  {
    code: 'BHB',
    name: 'بورصة البحرين',
    nameEn: 'Bahrain Bourse',
    country: 'BH',
    countryAr: 'مملكة البحرين',
    currency: 'BHD',
    currencySymbol: 'د.ب',
    currencyName: 'دينار بحريني',
    timezone: 'Asia/Bahrain',
    openTime: '09:00',
    closeTime: '13:00',
    tradingDays: 'الأحد - الخميس',
    mainIndex: 'BHX',
    mainIndexName: 'مؤشر البحرين العام',
    flag: '🇧🇭',
    type: 'stock',
  },
  {
    code: 'QE',
    name: 'بورصة قطر',
    nameEn: 'Qatar Stock Exchange',
    country: 'QA',
    countryAr: 'دولة قطر',
    currency: 'QAR',
    currencySymbol: 'ر.ق',
    currencyName: 'ريال قطري',
    timezone: 'Asia/Qatar',
    openTime: '09:00',
    closeTime: '13:00',
    tradingDays: 'الأحد - الخميس',
    mainIndex: 'QSE',
    mainIndexName: 'مؤشر قطر العام',
    flag: '🇶🇦',
    type: 'stock',
  },
  {
    code: 'MSX',
    name: 'بورصة مسقط',
    nameEn: 'Muscat Stock Exchange',
    country: 'OM',
    countryAr: 'سلطنة عُمان',
    currency: 'OMR',
    currencySymbol: 'ر.ع',
    currencyName: 'ريال عماني',
    timezone: 'Asia/Muscat',
    openTime: '10:00',
    closeTime: '14:00',
    tradingDays: 'الأحد - الخميس',
    mainIndex: 'MSX30',
    mainIndexName: 'مؤشر مسقط 30',
    flag: '🇴🇲',
    type: 'stock',
  },
  {
    code: 'EGX',
    name: 'البورصة المصرية',
    nameEn: 'Egyptian Exchange',
    country: 'EG',
    countryAr: 'جمهورية مصر العربية',
    currency: 'EGP',
    currencySymbol: 'ج.م',
    currencyName: 'جنيه مصري',
    timezone: 'Africa/Cairo',
    openTime: '10:00',
    closeTime: '14:00',
    tradingDays: 'الأحد - الخميس',
    mainIndex: 'EGX30',
    mainIndexName: 'مؤشر مصر 30',
    flag: '🇪🇬',
    type: 'stock',
  },
  {
    code: 'US',
    name: 'الأسواق الأمريكية',
    nameEn: 'US Stock Markets',
    country: 'US',
    countryAr: 'الولايات المتحدة الأمريكية',
    currency: 'USD',
    currencySymbol: '$',
    currencyName: 'دولار أمريكي',
    timezone: 'America/New_York',
    openTime: '16:30',
    closeTime: '23:00',
    tradingDays: 'الإثنين - الجمعة',
    mainIndex: 'SPX',
    mainIndexName: 'مؤشر S&P 500',
    flag: '🇺🇸',
    type: 'stock',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // أسواق العملات المشفرة
  // ═══════════════════════════════════════════════════════════════
  {
    code: 'CRYPTO',
    name: 'سوق العملات المشفرة',
    nameEn: 'Cryptocurrency Market',
    country: 'GLOBAL',
    countryAr: 'عالمي',
    currency: 'USD',
    currencySymbol: '$',
    currencyName: 'دولار أمريكي',
    timezone: 'UTC',
    openTime: '24/7',
    closeTime: '24/7',
    tradingDays: 'طوال الأسبوع',
    mainIndex: 'BTC',
    mainIndexName: 'بيتكوين',
    flag: '🌐',
    type: 'crypto',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // أسواق السلع
  // ═══════════════════════════════════════════════════════════════
  {
    code: 'COMMODITIES',
    name: 'سوق السلع والمعادن',
    nameEn: 'Commodities Market',
    country: 'GLOBAL',
    countryAr: 'عالمي',
    currency: 'USD',
    currencySymbol: '$',
    currencyName: 'دولار أمريكي',
    timezone: 'America/New_York',
    openTime: '18:00',
    closeTime: '17:00',
    tradingDays: 'الأحد - الجمعة',
    mainIndex: 'XAU',
    mainIndexName: 'الذهب',
    flag: '🥇',
    type: 'commodity',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // سوق العملات (Forex)
  // ═══════════════════════════════════════════════════════════════
  {
    code: 'FOREX',
    name: 'سوق العملات الأجنبية',
    nameEn: 'Foreign Exchange Market',
    country: 'GLOBAL',
    countryAr: 'عالمي',
    currency: 'USD',
    currencySymbol: '$',
    currencyName: 'دولار أمريكي',
    timezone: 'UTC',
    openTime: '00:00',
    closeTime: '24:00',
    tradingDays: 'طوال الأسبوع',
    mainIndex: 'EURUSD',
    mainIndexName: 'اليورو/دولار',
    flag: '💱',
    type: 'forex',
  },
];

// بيانات المؤشرات لكل سوق
export const marketIndices: MarketIndex[] = [
  // السوق السعودي
  { symbol: 'TASI', name: 'مؤشر تداول جميع الأسهم', market: 'TADAWUL', yahoo: '^TASI.SR', price: 12185.45, change: 45.30, changePct: 0.37, currency: 'SAR', currencySymbol: 'ر.س' },
  { symbol: 'TASI-BNK', name: 'مؤشر البنوك', market: 'TADAWUL', yahoo: '^TASI.BK', price: 5425.80, change: 35.20, changePct: 0.65, currency: 'SAR', currencySymbol: 'ر.س' },
  { symbol: 'TASI-ENR', name: 'مؤشر الطاقة', market: 'TADAWUL', yahoo: '^TASI.EN', price: 4125.30, change: -18.50, changePct: -0.45, currency: 'SAR', currencySymbol: 'ر.س' },
  { symbol: 'TASI-TEL', name: 'مؤشر الاتصالات', market: 'TADAWUL', yahoo: '^TASI.TC', price: 2245.60, change: 12.80, changePct: 0.57, currency: 'SAR', currencySymbol: 'ر.س' },
  
  // سوق أبوظبي
  { symbol: 'FTSEADX', name: 'مؤشر فوتسي أبوظبي العام', market: 'ADX', yahoo: '^FTFADGI', price: 9125.50, change: 45.80, changePct: 0.50, currency: 'AED', currencySymbol: 'د.إ' },
  { symbol: 'ADX-BNK', name: 'مؤشر البنوك في أبوظبي', market: 'ADX', yahoo: '^FADBI', price: 4850.20, change: 38.50, changePct: 0.80, currency: 'AED', currencySymbol: 'د.إ' },
  { symbol: 'ADX-RLE', name: 'مؤشر العقارات في أبوظبي', market: 'ADX', yahoo: '^FADRI', price: 3125.80, change: 25.60, changePct: 0.83, currency: 'AED', currencySymbol: 'د.إ' },
  { symbol: 'ADX-ENR', name: 'مؤشر الطاقة في أبوظبي', market: 'ADX', yahoo: '^FADEI', price: 2450.40, change: 18.20, changePct: 0.75, currency: 'AED', currencySymbol: 'د.إ' },
  { symbol: 'ADX-INS', name: 'مؤشر التأمين في أبوظبي', market: 'ADX', yahoo: '^FADII', price: 1850.60, change: 12.40, changePct: 0.68, currency: 'AED', currencySymbol: 'د.إ' },
  
  // سوق دبي المالي (السوق الرئيسي)
  { symbol: 'DFMGI', name: 'مؤشر دبي المالي العام', market: 'DFM', yahoo: '^DFMGI', price: 4450.80, change: 32.50, changePct: 0.74, currency: 'AED', currencySymbol: 'د.إ' },
  { symbol: 'DFM-BNK', name: 'مؤشر البنوك في دبي', market: 'DFM', yahoo: '^DFMBI', price: 3125.40, change: 28.60, changePct: 0.92, currency: 'AED', currencySymbol: 'د.إ' },
  { symbol: 'DFM-RLE', name: 'مؤشر العقارات في دبي', market: 'DFM', yahoo: '^DFMRI', price: 2150.60, change: 15.80, changePct: 0.74, currency: 'AED', currencySymbol: 'د.إ' },
  { symbol: 'DFM-IND', name: 'مؤشر الصناعة في دبي', market: 'DFM', yahoo: '^DFMII', price: 1850.20, change: 12.40, changePct: 0.68, currency: 'AED', currencySymbol: 'د.إ' },
  { symbol: 'DFM-INS', name: 'مؤشر التأمين في دبي', market: 'DFM', yahoo: '^DFMINS', price: 1250.80, change: 8.50, changePct: 0.69, currency: 'AED', currencySymbol: 'د.إ' },
  
  // سوق ناسداك دبي
  { symbol: 'DIFX', name: 'مؤشر ناسداك دبي العام', market: 'NASDAQ_DUBAI', yahoo: '^DIFX', price: 1250.50, change: 15.80, changePct: 1.28, currency: 'AED', currencySymbol: 'د.إ' },
  { symbol: 'DIFX-SUKUK', name: 'مؤشر الصكوك في ناسداك دبي', market: 'NASDAQ_DUBAI', yahoo: '^DIFXSK', price: 185.60, change: 2.40, changePct: 1.31, currency: 'AED', currencySymbol: 'د.إ' },
  { symbol: 'DIFX-REIT', name: 'مؤشر صناديق العقارات', market: 'NASDAQ_DUBAI', yahoo: '^DIFXRE', price: 245.80, change: 3.20, changePct: 1.32, currency: 'AED', currencySymbol: 'د.إ' },
  { symbol: 'DIFX-ETF', name: 'مؤشر صناديق المؤشرات', market: 'NASDAQ_DUBAI', yahoo: '^DIFXET', price: 325.40, change: 4.80, changePct: 1.50, currency: 'AED', currencySymbol: 'د.إ' },
  
  // بورصة عمان
  { symbol: 'ASE', name: 'مؤشر عمان العام', market: 'ASE', yahoo: '^AMMANGI', price: 2512.40, change: 15.20, changePct: 0.61, currency: 'JOD', currencySymbol: 'د.أ' },
  { symbol: 'ASE-FF', name: 'مؤشر عمان للتداول الحر', market: 'ASE', yahoo: '^AMMANFF', price: 1892.30, change: 12.50, changePct: 0.66, currency: 'JOD', currencySymbol: 'د.أ' },
  { symbol: 'ASE-WGT', name: 'مؤشر عمان الموزون', market: 'ASE', yahoo: '^AMMANWT', price: 1425.80, change: 8.60, changePct: 0.61, currency: 'JOD', currencySymbol: 'د.أ' },
  { symbol: 'ASE-BNK', name: 'مؤشر البنوك', market: 'ASE', yahoo: '^AMMANBK', price: 1285.50, change: 10.40, changePct: 0.82, currency: 'JOD', currencySymbol: 'د.أ' },
  
  // بورصة الكويت
  { symbol: 'KSE', name: 'مؤشر الكويت العام', market: 'KSE', yahoo: '^KWSE', price: 7925.60, change: -35.40, changePct: -0.45, currency: 'KWD', currencySymbol: 'د.ك' },
  { symbol: 'KSE-50', name: 'مؤشر الكويت 50', market: 'KSE', yahoo: '^BKP', price: 4585.20, change: 22.80, changePct: 0.50, currency: 'KWD', currencySymbol: 'د.ك' },
  
  // بورصة البحرين
  { symbol: 'BHX', name: 'مؤشر البحرين العام', market: 'BHB', yahoo: '^BSEX', price: 1912.50, change: 10.50, changePct: 0.55, currency: 'BHD', currencySymbol: 'د.ب' },
  { symbol: 'BHX-BNK', name: 'مؤشر البنوك', market: 'BHB', yahoo: '^BSEXBK', price: 1012.40, change: 7.20, changePct: 0.72, currency: 'BHD', currencySymbol: 'د.ب' },
  
  // بورصة قطر
  { symbol: 'QSE', name: 'مؤشر قطر العام', market: 'QE', yahoo: '^QSI', price: 10485.60, change: 72.50, changePct: 0.70, currency: 'QAR', currencySymbol: 'ر.ق' },
  { symbol: 'QE-20', name: 'مؤشر قطر 20', market: 'QE', yahoo: '^QSI20', price: 4925.80, change: 38.20, changePct: 0.78, currency: 'QAR', currencySymbol: 'ر.ق' },
  { symbol: 'QE-BNK', name: 'مؤشر البنوك القطري', market: 'QE', yahoo: '^QSIBK', price: 3312.40, change: 25.60, changePct: 0.78, currency: 'QAR', currencySymbol: 'ر.ق' },
  
  // بورصة مسقط
  { symbol: 'MSX30', name: 'مؤشر مسقط 30', market: 'MSX', yahoo: '^MSI30', price: 4712.80, change: 28.40, changePct: 0.61, currency: 'OMR', currencySymbol: 'ر.ع' },
  { symbol: 'MSX-Services', name: 'مؤشر الخدمات', market: 'MSX', yahoo: '^MSISV', price: 1892.50, change: 12.80, changePct: 0.68, currency: 'OMR', currencySymbol: 'ر.ع' },
  { symbol: 'MSX-Industry', name: 'مؤشر الصناعة', market: 'MSX', yahoo: '^MSIIN', price: 2312.60, change: 15.40, changePct: 0.67, currency: 'OMR', currencySymbol: 'ر.ع' },
  
  // البورصة المصرية
  { symbol: 'EGX30', name: 'مؤشر مصر 30', market: 'EGX', yahoo: '^CASE30', price: 29125.80, change: 185.40, changePct: 0.64, currency: 'EGP', currencySymbol: 'ج.م' },
  { symbol: 'EGX70', name: 'مؤشر مصر 70', market: 'EGX', yahoo: '^EGX70.CA', price: 4312.50, change: 28.40, changePct: 0.66, currency: 'EGP', currencySymbol: 'ج.م' },
  { symbol: 'EGX100', name: 'مؤشر مصر 100', market: 'EGX', yahoo: '^EGX100.CA', price: 9125.40, change: 52.80, changePct: 0.58, currency: 'EGP', currencySymbol: 'ج.م' },
  
  // الأسواق الأمريكية - المؤشرات الرئيسية - أسعار مارس 2025
  { symbol: 'SPX', name: 'مؤشر S&P 500', market: 'US', yahoo: '^GSPC', price: 5780.00, change: 42.50, changePct: 0.74, currency: 'USD', currencySymbol: '$' },
  { symbol: 'DJI', name: 'مؤشر داو جونز الصناعي', market: 'US', yahoo: '^DJI', price: 42350.00, change: 285.00, changePct: 0.68, currency: 'USD', currencySymbol: '$' },
  { symbol: 'IXIC', name: 'مؤشر ناسداك المركب', market: 'US', yahoo: '^IXIC', price: 18250.00, change: 165.00, changePct: 0.91, currency: 'USD', currencySymbol: '$' },

  // مؤشرات راسيل
  { symbol: 'RUT', name: 'مؤشر راسيل 2000 (الشركات الصغيرة)', market: 'US', yahoo: '^RUT', price: 2085.00, change: 18.50, changePct: 0.89, currency: 'USD', currencySymbol: '$' },
  { symbol: 'RUI', name: 'مؤشر راسيل 1000 (الشركات الكبيرة)', market: 'US', yahoo: '^RUI', price: 3285.00, change: 25.40, changePct: 0.78, currency: 'USD', currencySymbol: '$' },
  { symbol: 'RUA', name: 'مؤشر راسيل 3000 (السوق الشامل)', market: 'US', yahoo: '^RUA', price: 3325.00, change: 28.60, changePct: 0.87, currency: 'USD', currencySymbol: '$' },

  // مؤشر ناسداك 100
  { symbol: 'NDX', name: 'مؤشر ناسداك 100', market: 'US', yahoo: '^NDX', price: 20350.00, change: 185.00, changePct: 0.92, currency: 'USD', currencySymbol: '$' },

  // مؤشر VIX (مؤشر الخوف)
  { symbol: 'VIX', name: 'مؤشر الخوف (VIX)', market: 'US', yahoo: '^VIX', price: 16.25, change: -0.55, changePct: -3.27, currency: 'USD', currencySymbol: '$' },

  // مؤشرات S&P للشركات المتوسطة والصغيرة
  { symbol: 'MID', name: 'مؤشر S&P 400 للشركات المتوسطة', market: 'US', yahoo: '^MID', price: 2985.00, change: 22.40, changePct: 0.76, currency: 'USD', currencySymbol: '$' },
  { symbol: 'SML', name: 'مؤشر S&P 600 للشركات الصغيرة', market: 'US', yahoo: '^SML', price: 1345.00, change: 11.80, changePct: 0.89, currency: 'USD', currencySymbol: '$' },

  // مؤشرات داو جونز المتخصصة
  { symbol: 'DJT', name: 'مؤشر داو جونز للنقل', market: 'US', yahoo: '^DJT', price: 16125.40, change: 112.50, changePct: 0.70, currency: 'USD', currencySymbol: '$' },
  { symbol: 'DJU', name: 'مؤشر داو جونز للمرافق', market: 'US', yahoo: '^DJU', price: 1012.50, change: 7.40, changePct: 0.74, currency: 'USD', currencySymbol: '$' },

  // مؤشر NYSE المركب
  { symbol: 'NYA', name: 'مؤشر NYSE المركب', market: 'US', yahoo: '^NYA', price: 18215.60, change: 125.40, changePct: 0.69, currency: 'USD', currencySymbol: '$' },

  // مؤشر ويلشاير
  { symbol: 'W5000', name: 'مؤشر ويلشاير 5000 (السوق الكلي)', market: 'US', yahoo: '^W5000', price: 54125.80, change: 485.20, changePct: 0.90, currency: 'USD', currencySymbol: '$' },

  // مؤشرات إضافية - الفئات القطاعية S&P
  { symbol: 'SPX-TECH', name: 'مؤشر S&P لتكنولوجيا المعلومات', market: 'US', yahoo: '^SP500-45', price: 3258.40, change: 45.20, changePct: 1.41, currency: 'USD', currencySymbol: '$' },
  { symbol: 'SPX-Health', name: 'مؤشر S&P للرعاية الصحية', market: 'US', yahoo: '^SP500-35', price: 1585.60, change: 12.40, changePct: 0.79, currency: 'USD', currencySymbol: '$' },
  { symbol: 'SPX-Fin', name: 'مؤشر S&P للقطاع المالي', market: 'US', yahoo: '^SP500-40', price: 685.40, change: 5.80, changePct: 0.85, currency: 'USD', currencySymbol: '$' },
  { symbol: 'SPX-Energy', name: 'مؤشر S&P للطاقة', market: 'US', yahoo: '^SP500-10', price: 542.80, change: -8.50, changePct: -1.54, currency: 'USD', currencySymbol: '$' },
  { symbol: 'SPX-Cons', name: 'مؤشر S&P للسلع الاستهلاكية', market: 'US', yahoo: '^SP500-25', price: 785.60, change: 6.20, changePct: 0.80, currency: 'USD', currencySymbol: '$' },
];

// ═══════════════════════════════════════════════════════════════
// بيانات العملات المشفرة
// ═══════════════════════════════════════════════════════════════
export const cryptoData = {
  // المعاملات (Market Indices)
  indices: [
    { symbol: 'TOTAL', name: 'إجمالي القيمة السوقية', market: 'CRYPTO', price: 2650000000000, change: 45000000000, changePct: 1.72, currency: 'USD', currencySymbol: '$' },
    { symbol: 'BTC.D', name: 'هيمنة البيتكوين', market: 'CRYPTO', price: 52.35, change: 0.45, changePct: 0.87, currency: 'USD', currencySymbol: '%' },
    { symbol: 'ETH.D', name: 'هيمنة الإيثيريوم', market: 'CRYPTO', price: 17.80, change: -0.25, changePct: -1.38, currency: 'USD', currencySymbol: '%' },
  ],
  
  // العملات المشفرة - أسعار مارس 2025
  coins: [
    // العملات الرئيسية
    { symbol: 'BTC', name: 'بيتكوين', nameEn: 'Bitcoin', price: 87500.00, change: 1250.00, changePct: 1.45, marketCap: 1720000000000, volume: 35000000000, icon: '₿', category: 'main' },
    { symbol: 'ETH', name: 'إيثيريوم', nameEn: 'Ethereum', price: 2150.00, change: 45.00, changePct: 2.14, marketCap: 258000000000, volume: 18500000000, icon: 'Ξ', category: 'main' },
    { symbol: 'BNB', name: 'بينانس', nameEn: 'BNB', price: 625.00, change: 12.50, changePct: 2.04, marketCap: 89000000000, volume: 1800000000, icon: '🔷', category: 'main' },
    { symbol: 'SOL', name: 'سولانا', nameEn: 'Solana', price: 145.00, change: 5.80, changePct: 4.16, marketCap: 68000000000, volume: 3200000000, icon: '◎', category: 'main' },
    { symbol: 'XRP', name: 'ريبل', nameEn: 'XRP', price: 2.45, change: 0.08, changePct: 3.38, marketCap: 140000000000, volume: 8500000000, icon: '✕', category: 'main' },
    
    // العملات المستقرة
    { symbol: 'USDT', name: 'تيثر', nameEn: 'Tether', price: 1.00, change: 0.001, changePct: 0.01, marketCap: 105000000000, volume: 55000000000, icon: '₮', category: 'stable' },
    { symbol: 'USDC', name: 'يوسد كوين', nameEn: 'USD Coin', price: 1.00, change: 0.0005, changePct: 0.00, marketCap: 34000000000, volume: 5000000000, icon: '🔵', category: 'stable' },
    
    // DeFi
    { symbol: 'ADA', name: 'كاردانو', nameEn: 'Cardano', price: 0.58, change: 0.028, changePct: 5.07, marketCap: 20500000000, volume: 650000000, icon: '₳', category: 'defi' },
    { symbol: 'AVAX', name: 'أفالانش', nameEn: 'Avalanche', price: 42.50, change: 1.85, changePct: 4.55, marketCap: 16000000000, volume: 520000000, icon: '🔺', category: 'defi' },
    { symbol: 'DOT', name: 'بولكادوت', nameEn: 'Polkadot', price: 8.25, change: 0.35, changePct: 4.43, marketCap: 11000000000, volume: 380000000, icon: '●', category: 'defi' },
    { symbol: 'LINK', name: 'تشين لينك', nameEn: 'Chainlink', price: 18.50, change: 0.85, changePct: 4.82, marketCap: 10800000000, volume: 620000000, icon: '⬡', category: 'defi' },
    { symbol: 'UNI', name: 'يونيسواب', nameEn: 'Uniswap', price: 12.80, change: 0.45, changePct: 3.64, marketCap: 7700000000, volume: 280000000, icon: '🦄', category: 'defi' },
    
    // Meme Coins
    { symbol: 'DOGE', name: 'دوج كوين', nameEn: 'Dogecoin', price: 0.185, change: 0.015, changePct: 8.82, marketCap: 26500000000, volume: 2100000000, icon: '🐕', category: 'meme' },
    { symbol: 'SHIB', name: 'شبا إينو', nameEn: 'Shiba Inu', price: 0.0000285, change: 0.0000025, changePct: 9.61, marketCap: 16800000000, volume: 1200000000, icon: '🐕', category: 'meme' },
    { symbol: 'PEPE', name: 'بيبي', nameEn: 'Pepe', price: 0.0000085, change: 0.0000008, changePct: 10.39, marketCap: 3500000000, volume: 850000000, icon: '🐸', category: 'meme' },
    
    // Layer 2
    { symbol: 'MATIC', name: 'بوليجون', nameEn: 'Polygon', price: 0.92, change: 0.045, changePct: 5.15, marketCap: 8500000000, volume: 420000000, icon: '⬡', category: 'layer2' },
    { symbol: 'ARB', name: 'أربيتروم', nameEn: 'Arbitrum', price: 1.25, change: 0.08, changePct: 6.84, marketCap: 4500000000, volume: 280000000, icon: '🔵', category: 'layer2' },
    { symbol: 'OP', name: 'أوبتيميزم', nameEn: 'Optimism', price: 2.85, change: 0.15, changePct: 5.56, marketCap: 3200000000, volume: 180000000, icon: '🔴', category: 'layer2' },
    
    // AI Coins
    { symbol: 'FET', name: 'فيتش', nameEn: 'Fetch.ai', price: 2.45, change: 0.18, changePct: 7.93, marketCap: 2100000000, volume: 320000000, icon: '🤖', category: 'ai' },
    { symbol: 'RENDER', name: 'ريندر', nameEn: 'Render', price: 8.50, change: 0.65, changePct: 8.28, marketCap: 3300000000, volume: 250000000, icon: '🎨', category: 'ai' },
    { symbol: 'TAO', name: 'بايتنس', nameEn: 'Bittensor', price: 485.00, change: 35.00, changePct: 7.78, marketCap: 3600000000, volume: 180000000, icon: '🧠', category: 'ai' },
  ],
  
  // بورصات العملات المشفرة
  exchanges: [
    { code: 'BINANCE', name: 'بينانس', nameEn: 'Binance', country: 'عالمي', volume24h: 18500000000, pairs: 1450, flag: '🔷' },
    { code: 'COINBASE', name: 'كوين بيز', nameEn: 'Coinbase', country: 'أمريكا', volume24h: 4500000000, pairs: 280, flag: '🇺🇸' },
    { code: 'KRAKEN', name: 'كراكن', nameEn: 'Kraken', country: 'أمريكا', volume24h: 1200000000, pairs: 350, flag: '🇺🇸' },
    { code: 'BYBIT', name: 'باي بت', nameEn: 'Bybit', country: 'عالمي', volume24h: 8500000000, pairs: 520, flag: '🌐' },
    { code: 'OKX', name: 'أو كي إكس', nameEn: 'OKX', country: 'عالمي', volume24h: 6200000000, pairs: 680, flag: '🌐' },
    { code: 'KUCOIN', name: 'كو كوين', nameEn: 'KuCoin', country: 'عالمي', volume24h: 1800000000, pairs: 850, flag: '🌐' },
    { code: 'GATE', name: 'جيت', nameEn: 'Gate.io', country: 'عالمي', volume24h: 950000000, pairs: 1700, flag: '🌐' },
    { code: 'BITTREX', name: 'بيتريكس', nameEn: 'Bittrex', country: 'أمريكا', volume24h: 120000000, pairs: 450, flag: '🇺🇸' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// بيانات السلع
// ═══════════════════════════════════════════════════════════════
export const commoditiesData = {
  // مؤشرات السلع
  indices: [
    { symbol: 'BCOM', name: 'مؤشر بلومبرج للسلع', market: 'COMMODITIES', price: 98.50, change: 1.25, changePct: 1.28, currency: 'USD', currencySymbol: '$' },
    { symbol: 'CRB', name: 'مؤشر رويترز/جيفري للسلع', market: 'COMMODITIES', price: 312.45, change: 4.80, changePct: 1.56, currency: 'USD', currencySymbol: '$' },
    { symbol: 'GSCI', name: 'مؤشر سب لسلع الذهب', market: 'COMMODITIES', price: 3850.20, change: 45.30, changePct: 1.19, currency: 'USD', currencySymbol: '$' },
  ],
  
  // المعادن الثمينة - أسعار مارس 2025
  preciousMetals: [
    { symbol: 'XAU', name: 'الذهب', nameEn: 'Gold', price: 3025.50, change: 18.30, changePct: 0.61, unit: 'أونصة', unitAr: 'oz', icon: '🥇', category: 'precious' },
    { symbol: 'XAG', name: 'الفضة', nameEn: 'Silver', price: 34.25, change: 0.45, changePct: 1.33, unit: 'أونصة', unitAr: 'oz', icon: '🥈', category: 'precious' },
    { symbol: 'XPT', name: 'البلاتين', nameEn: 'Platinum', price: 985.00, change: 12.50, changePct: 1.28, unit: 'أونصة', unitAr: 'oz', icon: '⬜', category: 'precious' },
    { symbol: 'XPD', name: 'البلاديوم', nameEn: 'Palladium', price: 950.00, change: -8.50, changePct: -0.89, unit: 'أونصة', unitAr: 'oz', icon: '⚪', category: 'precious' },
  ],
  
  // المعادن الصناعية
  industrialMetals: [
    { symbol: 'HG', name: 'النحاس', nameEn: 'Copper', price: 4.28, change: 0.08, changePct: 1.90, unit: 'رطل', unitAr: 'lb', icon: '🟤', category: 'industrial' },
    { symbol: 'ALU', name: 'الألمنيوم', nameEn: 'Aluminum', price: 2.45, change: 0.03, changePct: 1.24, unit: 'طن', unitAr: 'ton', icon: '⚙️', category: 'industrial' },
    { symbol: 'ZINC', name: 'الزنك', nameEn: 'Zinc', price: 2.85, change: 0.05, changePct: 1.78, unit: 'طن', unitAr: 'ton', icon: '🔩', category: 'industrial' },
    { symbol: 'NICKEL', name: 'النيكل', nameEn: 'Nickel', price: 16850.00, change: 285.00, changePct: 1.72, unit: 'طن', unitAr: 'ton', icon: '🔧', category: 'industrial' },
    { symbol: 'TIN', name: 'القصدير', nameEn: 'Tin', price: 28500.00, change: 420.00, changePct: 1.49, unit: 'طن', unitAr: 'ton', icon: '🔨', category: 'industrial' },
  ],
  
  // الطاقة - أسعار مارس 2025
  energy: [
    { symbol: 'WTI', name: 'النفط الخام (WTI)', nameEn: 'Crude Oil WTI', price: 71.50, change: 0.85, changePct: 1.20, unit: 'برميل', unitAr: 'bbl', icon: '🛢️', category: 'energy' },
    { symbol: 'BRENT', name: 'نفط برنت', nameEn: 'Brent Crude', price: 75.35, change: 0.92, changePct: 1.24, unit: 'برميل', unitAr: 'bbl', icon: '🛢️', category: 'energy' },
    { symbol: 'NATGAS', name: 'الغاز الطبيعي', nameEn: 'Natural Gas', price: 3.85, change: 0.12, changePct: 3.21, unit: 'MMBtu', unitAr: 'MMBtu', icon: '🔥', category: 'energy' },
    { symbol: 'HEAT', name: 'زيت التدفئة', nameEn: 'Heating Oil', price: 2.65, change: 0.04, changePct: 1.54, unit: 'جالون', unitAr: 'gal', icon: '⛽', category: 'energy' },
    { symbol: 'RBOB', name: 'البنزين', nameEn: 'Gasoline RBOB', price: 2.45, change: 0.05, changePct: 2.08, unit: 'جالون', unitAr: 'gal', icon: '⛽', category: 'energy' },
    { symbol: 'COAL', name: 'الفحم', nameEn: 'Coal', price: 142.50, change: 3.20, changePct: 2.30, unit: 'طن', unitAr: 'ton', icon: '⬛', category: 'energy' },
  ],
  
  // المنتجات الزراعية
  agriculture: [
    { symbol: 'WHEAT', name: 'القمح', nameEn: 'Wheat', price: 5.85, change: 0.12, changePct: 2.09, unit: 'بوشل', unitAr: 'bu', icon: '🌾', category: 'agriculture' },
    { symbol: 'CORN', name: 'الذرة', nameEn: 'Corn', price: 4.45, change: 0.08, changePct: 1.83, unit: 'بوشل', unitAr: 'bu', icon: '🌽', category: 'agriculture' },
    { symbol: 'SOYB', name: 'فول الصويا', nameEn: 'Soybeans', price: 11.85, change: 0.22, changePct: 1.89, unit: 'بوشل', unitAr: 'bu', icon: '🫘', category: 'agriculture' },
    { symbol: 'RICE', name: 'الأرز', nameEn: 'Rice', price: 17.25, change: 0.35, changePct: 2.07, unit: 'cwt', unitAr: 'cwt', icon: '🍚', category: 'agriculture' },
    { symbol: 'COFFEE', name: 'القهوة', nameEn: 'Coffee', price: 185.50, change: 4.20, changePct: 2.31, unit: 'رطل', unitAr: 'lb', icon: '☕', category: 'agriculture' },
    { symbol: 'COCOA', name: 'الكاكاو', nameEn: 'Cocoa', price: 8250.00, change: 185.00, changePct: 2.29, unit: 'طن', unitAr: 'ton', icon: '🍫', category: 'agriculture' },
    { symbol: 'SUGAR', name: 'السكر', nameEn: 'Sugar', price: 0.245, change: 0.008, changePct: 3.37, unit: 'رطل', unitAr: 'lb', icon: '🍬', category: 'agriculture' },
    { symbol: 'COTTON', name: 'القطن', nameEn: 'Cotton', price: 0.88, change: 0.015, changePct: 1.73, unit: 'رطل', unitAr: 'lb', icon: '☁️', category: 'agriculture' },
    { symbol: 'OJ', name: 'عصير البرتقال', nameEn: 'Orange Juice', price: 2.85, change: 0.05, changePct: 1.78, unit: 'رطل', unitAr: 'lb', icon: '🍊', category: 'agriculture' },
  ],
  
  // الماشية
  livestock: [
    { symbol: 'CATTLE', name: 'المواشي الحية', nameEn: 'Live Cattle', price: 185.50, change: 2.80, changePct: 1.53, unit: 'رطل', unitAr: 'lb', icon: '🐄', category: 'livestock' },
    { symbol: 'FEEDER', name: 'ماشية التسمين', nameEn: 'Feeder Cattle', price: 258.20, change: 4.50, changePct: 1.77, unit: 'رطل', unitAr: 'lb', icon: '🐄', category: 'livestock' },
  ],
};

// أسهم مختارة من كل سوق - أسعار مارس 2025
export const marketStocks = {
  // السوق السعودي - 50 سهم
  TADAWUL: [
    // البنوك
    { symbol: '1180.SR', name: 'مصرف الراجحي', price: 112.50, change: 2.80, changePct: 2.55, sector: 'البنوك' },
    { symbol: '4002.SR', name: 'بنك الرياض', price: 32.80, change: 0.55, changePct: 1.71, sector: 'البنوك' },
    { symbol: '4160.SR', name: 'البنك العربي الوطني', price: 25.80, change: 0.38, changePct: 1.49, sector: 'البنوك' },
    { symbol: '1060.SR', name: 'البنك السعودي البريطاني', price: 42.50, change: 0.65, changePct: 1.55, sector: 'البنوك' },
    { symbol: '4190.SR', name: 'بنك الجزيرة', price: 21.45, change: 0.32, changePct: 1.51, sector: 'البنوك' },
    { symbol: '4050.SR', name: 'البنك السعودي الفرنسي', price: 48.90, change: 0.72, changePct: 1.49, sector: 'البنوك' },
    { symbol: '4040.SR', name: 'البنك السعودي الأمريكي', price: 52.60, change: 0.78, changePct: 1.50, sector: 'البنوك' },
    { symbol: '4100.SR', name: 'البنك السعودي للاستثمار', price: 28.75, change: 0.42, changePct: 1.48, sector: 'البنوك' },
    { symbol: '4060.SR', name: 'البنك السعودي الهولندي', price: 35.15, change: 0.52, changePct: 1.50, sector: 'البنوك' },
    { symbol: '4180.SR', name: 'بنك البلاد', price: 42.15, change: 0.85, changePct: 2.06, sector: 'البنوك' },
    // الطاقة والبتروكيماويات
    { symbol: '1120.SR', name: 'أرامكو السعودية', price: 27.85, change: 0.35, changePct: 1.27, sector: 'الطاقة' },
    { symbol: '2002.SR', name: 'سابك', price: 92.50, change: 1.45, changePct: 1.59, sector: 'البتروكيماويات' },
    { symbol: '2020.SR', name: 'سافكو', price: 138.50, change: 3.20, changePct: 2.37, sector: 'البتروكيماويات' },
    { symbol: '2050.SR', name: 'ينساب', price: 72.40, change: 1.25, changePct: 1.76, sector: 'البتروكيماويات' },
    { symbol: '2010.SR', name: 'صناعة الكيماويات', price: 95.20, change: 1.68, changePct: 1.80, sector: 'البتروكيماويات' },
    { symbol: '2201.SR', name: 'بتروكيم', price: 9.45, change: 0.14, changePct: 1.50, sector: 'البتروكيماويات' },
    { symbol: '2381.SR', name: 'الدريس', price: 48.30, change: 0.95, changePct: 2.01, sector: 'الخدمات' },
    // الاتصالات
    { symbol: '7010.SR', name: 'الاتصالات السعودية', price: 145.20, change: 1.85, changePct: 1.29, sector: 'الاتصالات' },
    { symbol: '7020.SR', name: 'موبايلي', price: 58.80, change: 0.85, changePct: 1.47, sector: 'الاتصالات' },
    { symbol: '7030.SR', name: 'زين السعودية', price: 18.40, change: 0.32, changePct: 1.77, sector: 'الاتصالات' },
    // العقارات
    { symbol: '2222.SR', name: 'المملكة القابضة', price: 10.15, change: 0.12, changePct: 1.20, sector: 'العقارات' },
    { symbol: '2380.SR', name: 'الإنماء للتعمير', price: 38.50, change: 0.75, changePct: 1.99, sector: 'العقارات' },
    { symbol: '4250.SR', name: 'العقارية العربية', price: 22.60, change: 0.42, changePct: 1.89, sector: 'العقارات' },
    { symbol: '4300.SR', name: 'طيبة للاستثمار', price: 138.50, change: 2.65, changePct: 1.95, sector: 'العقارات' },
    // التجزئة
    { symbol: '4210.SR', name: 'التموين والتجارة', price: 235.80, change: 4.20, changePct: 1.81, sector: 'التجزئة' },
    { symbol: '4230.SR', name: 'العثيم', price: 42.40, change: 0.78, changePct: 1.87, sector: 'التجزئة' },
    { symbol: '4200.SR', name: 'الصحراء للتجارة', price: 32.90, change: 0.52, changePct: 1.61, sector: 'التجزئة' },
    // الصناعة
    { symbol: '3000.SR', name: 'سابك للمغنيسيوم', price: 52.20, change: 0.98, changePct: 1.91, sector: 'الصناعة' },
    { symbol: '3010.SR', name: 'الصحراء للبتروكيماويات', price: 62.80, change: 1.35, changePct: 2.20, sector: 'الصناعة' },
    { symbol: '3040.SR', name: 'الزامل للصناعة', price: 28.50, change: 0.42, changePct: 1.50, sector: 'الصناعة' },
    // التأمين
    { symbol: '8070.SR', name: 'التعاونية', price: 135.80, change: 2.45, changePct: 1.84, sector: 'التأمين' },
    { symbol: '8010.SR', name: 'الدرع العربية', price: 52.60, change: 0.88, changePct: 1.70, sector: 'التأمين' },
    { symbol: '8020.SR', name: 'ميدغلف', price: 75.40, change: 1.35, changePct: 1.82, sector: 'التأمين' },
    { symbol: '8080.SR', name: 'الأهلي للتكافل', price: 155.50, change: 3.20, changePct: 2.10, sector: 'التأمين' },
    // الزراعة والغذاء
    { symbol: '6002.SR', name: 'صافولا', price: 168.50, change: 2.80, changePct: 1.69, sector: 'الغذاء' },
    { symbol: '6010.SR', name: 'المراعي', price: 58.25, change: 0.95, changePct: 1.66, sector: 'الغذاء' },
    { symbol: '6030.SR', name: 'القصيم الزراعية', price: 32.50, change: 0.48, changePct: 1.50, sector: 'الزراعة' },
    // النقل
    { symbol: '4110.SR', name: 'البحري', price: 38.80, change: 0.65, changePct: 1.70, sector: 'النقل' },
    { symbol: '4140.SR', name: 'ملاذ للتأمين', price: 22.20, change: 0.35, changePct: 1.60, sector: 'التأمين' },
    // الاستثمار
    { symbol: '4150.SR', name: 'البلاد للاستثمار', price: 29.80, change: 0.48, changePct: 1.64, sector: 'الاستثمار' },
    { symbol: '4170.SR', name: 'الإنماء للاستثمار', price: 24.50, change: 0.38, changePct: 1.57, sector: 'الاستثمار' },
    // الفنادق والسياحة
    { symbol: '2350.SR', name: 'طيبة للاستثمار', price: 138.40, change: 2.45, changePct: 1.80, sector: 'السياحة' },
    { symbol: '2360.SR', name: 'مكة للإنشاء والتعمير', price: 95.60, change: 1.65, changePct: 1.76, sector: 'العقارات' },
    // الكهرباء والمياه
    { symbol: '5110.SR', name: 'الشركة السعودية للكهرباء', price: 41.50, change: 0.65, changePct: 1.59, sector: 'المرافق' },
    { symbol: '2080.SR', name: 'التصنيع', price: 32.90, change: 0.52, changePct: 1.61, sector: 'الصناعة' },
    { symbol: '2090.SR', name: 'المتطورة', price: 42.20, change: 0.75, changePct: 1.81, sector: 'الصناعة' },
    { symbol: '2100.SR', name: 'أسمنت السعودية', price: 75.40, change: 1.35, changePct: 1.82, sector: 'الصناعة' },
    { symbol: '2110.SR', name: 'أسمنت القصيم', price: 58.80, change: 0.95, changePct: 1.64, sector: 'الصناعة' },
    { symbol: '2120.SR', name: 'أسمنت الشرقية', price: 52.60, change: 0.88, changePct: 1.70, sector: 'الصناعة' },
    { symbol: '2130.SR', name: 'أسمنت ينبع', price: 45.20, change: 0.68, changePct: 1.53, sector: 'الصناعة' },
  ],
  
  // سوق أبوظبي - 30 سهم
  ADX: [
    // البنوك
    { symbol: 'ADCB', name: 'بنك أبوظبي التجاري', price: 8.25, change: 0.15, changePct: 1.85, sector: 'البنوك' },
    { symbol: 'FAB', name: 'بنك أبوظبي الأول', price: 15.80, change: 0.25, changePct: 1.61, sector: 'البنوك' },
    { symbol: 'ADIB', name: 'بنك أبوظبي الإسلامي', price: 5.85, change: 0.08, changePct: 1.39, sector: 'البنوك' },
    { symbol: 'UNB', name: 'الاتحاد الوطني', price: 12.50, change: 0.18, changePct: 1.46, sector: 'البنوك' },
    { symbol: 'ABKB', name: 'بنك الخليج الأول', price: 8.20, change: 0.12, changePct: 1.48, sector: 'البنوك' },
    { symbol: 'WIO', name: 'وفر إنفست', price: 3.45, change: 0.05, changePct: 1.47, sector: 'الاستثمار' },
    // الاتصالات
    { symbol: 'ETISALAT', name: 'اتصالات', price: 28.50, change: -0.30, changePct: -1.04, sector: 'الاتصالات' },
    // العقارات
    { symbol: 'ALDAR', name: 'ألدار العقارية', price: 4.85, change: 0.12, changePct: 2.54, sector: 'العقارات' },
    { symbol: 'RASMALA', name: 'رأس المال', price: 3.20, change: 0.05, changePct: 1.59, sector: 'العقارات' },
    { symbol: 'MANAZEL', name: 'منازل', price: 1.85, change: 0.03, changePct: 1.65, sector: 'العقارات' },
    { symbol: 'QAQ', name: 'القابضة المتحدة', price: 1.50, change: 0.02, changePct: 1.35, sector: 'العقارات' },
    // الطاقة
    { symbol: 'ADNOC', name: 'أدنوك للتوزيع', price: 5.20, change: 0.08, changePct: 1.56, sector: 'الطاقة' },
    { symbol: 'TAQA', name: 'طاقة', price: 3.45, change: 0.05, changePct: 1.47, sector: 'الطاقة' },
    { symbol: 'ADNOCGAS', name: 'أدنوك للغاز', price: 4.80, change: 0.07, changePct: 1.48, sector: 'الطاقة' },
    // الخدمات المالية
    { symbol: 'RAKCAP', name: 'رأس الخيمة للمال', price: 2.85, change: 0.04, changePct: 1.42, sector: 'الخدمات المالية' },
    { symbol: 'IHCC', name: 'الإنماء للاستثمار', price: 1.20, change: 0.02, changePct: 1.69, sector: 'الاستثمار' },
    // الصناعة
    { symbol: 'EMIRATESINT', name: 'الإمارات الدولية', price: 125.50, change: 2.10, changePct: 1.70, sector: 'الصناعة' },
    { symbol: 'ALKHALEEJ', name: 'الخليج للاستثمار', price: 1.45, change: 0.02, changePct: 1.40, sector: 'الاستثمار' },
    // التأمين
    { symbol: 'ABNIC', name: 'أبوظبي الوطنية للتأمين', price: 6.80, change: 0.10, changePct: 1.49, sector: 'التأمين' },
    { symbol: 'ADNIC', name: 'أبوظبي للتأمين', price: 4.50, change: 0.07, changePct: 1.58, sector: 'التأمين' },
    { symbol: 'DANA', name: 'دانة للتأمين', price: 0.85, change: 0.01, changePct: 1.19, sector: 'التأمين' },
    // التجزئة
    { symbol: 'AGTHIA', name: 'أغاثيا', price: 4.20, change: 0.06, changePct: 1.45, sector: 'الغذاء' },
    { symbol: 'AMANA', name: 'أمانة', price: 2.15, change: 0.03, changePct: 1.41, sector: 'التجزئة' },
    // النقل
    { symbol: 'ADPORTS', name: 'موانئ أبوظبي', price: 4.50, change: 0.07, changePct: 1.58, sector: 'النقل' },
    { symbol: 'ETIHAD', name: 'الاتحاد للطيران', price: 2.85, change: 0.04, changePct: 1.42, sector: 'النقل' },
    // السياحة والفنادق
    { symbol: 'TOURISM', name: 'أبوظبي للسياحة', price: 1.85, change: 0.03, changePct: 1.65, sector: 'السياحة' },
    { symbol: 'MIRAL', name: 'ميرال', price: 2.50, change: 0.04, changePct: 1.62, sector: 'السياحة' },
    // الاستثمار
    { symbol: 'ADQ', name: 'أبوظبي للتنمية', price: 3.80, change: 0.06, changePct: 1.60, sector: 'الاستثمار' },
    { symbol: 'CHIM', name: 'الصناعات الكيميائية', price: 1.20, change: 0.02, changePct: 1.69, sector: 'الصناعة' },
  ],
  
  // سوق دبي - 30 سهم
  DFM: [
    // العقارات
    { symbol: 'EMAAR', name: 'إعمار العقارية', price: 8.50, change: 0.25, changePct: 3.03, sector: 'العقارات' },
    { symbol: 'DAMAC', name: 'داماك العقارية', price: 0.45, change: 0.02, changePct: 4.65, sector: 'العقارات' },
    { symbol: 'DIERA', name: 'ديرة للاستثمار', price: 0.32, change: 0.01, changePct: 3.23, sector: 'العقارات' },
    { symbol: 'UNION', name: 'الاتحاد العقارية', price: 1.85, change: 0.05, changePct: 2.78, sector: 'العقارات' },
    { symbol: 'EMAARDEV', name: 'إعمار للتطوير', price: 6.20, change: 0.15, changePct: 2.48, sector: 'العقارات' },
    // البنوك
    { symbol: 'EMIRATESNBD', name: 'مصرف الإمارات دبي الوطني', price: 18.20, change: 0.35, changePct: 1.96, sector: 'البنوك' },
    { symbol: 'DIB', name: 'بنك دبي الإسلامي', price: 6.80, change: 0.12, changePct: 1.80, sector: 'البنوك' },
    { symbol: 'CBD', name: 'بنك دبي التجاري', price: 4.85, change: 0.08, changePct: 1.68, sector: 'البنوك' },
    { symbol: 'AJM', name: 'بنك عجم', price: 2.50, change: 0.04, changePct: 1.63, sector: 'البنوك' },
    { symbol: 'MASHREQ', name: 'بنك المشرق', price: 115.50, change: 2.10, changePct: 1.85, sector: 'البنوك' },
    // النقل والطيران
    { symbol: 'AIRARABIA', name: 'العربية للطيران', price: 2.15, change: -0.05, changePct: -2.27, sector: 'النقل' },
    { symbol: 'ARAMEX', name: 'أرامكس', price: 3.85, change: 0.08, changePct: 2.12, sector: 'النقل' },
    { symbol: 'DNATA', name: 'دناتا', price: 1.50, change: 0.02, changePct: 1.35, sector: 'النقل' },
    // المرافق
    { symbol: 'DEWA', name: 'هيئة كهرباء ومياه دبي', price: 2.85, change: 0.08, changePct: 2.89, sector: 'المرافق' },
    { symbol: 'TABREED', name: 'تبريد', price: 1.35, change: 0.02, changePct: 1.50, sector: 'المرافق' },
    // التأمين
    { symbol: 'TAKAFUL', name: 'التكافل الإماراتي', price: 1.85, change: 0.03, changePct: 1.65, sector: 'التأمين' },
    { symbol: 'DIN', name: 'دبي للتأمين', price: 3.20, change: 0.05, changePct: 1.59, sector: 'التأمين' },
    { symbol: 'ISLAMIC', name: 'الإسلامية للتأمين', price: 0.85, change: 0.01, changePct: 1.19, sector: 'التأمين' },
    // التجزئة والغذاء
    { symbol: 'GF', name: 'الموارد الغذائية', price: 1.20, change: 0.02, changePct: 1.69, sector: 'الغذاء' },
    { symbol: 'CARREFOUR', name: 'كارفور الإمارات', price: 5.50, change: 0.08, changePct: 1.48, sector: 'التجزئة' },
    // الاستثمار
    { symbol: 'DFM', name: 'سوق دبي المالي', price: 1.45, change: 0.03, changePct: 2.11, sector: 'الاستثمار' },
    { symbol: 'SHUAA', name: 'شعاع كابيتال', price: 0.65, change: 0.01, changePct: 1.56, sector: 'الاستثمار' },
    { symbol: 'ICD', name: 'مؤسسة دبي للاستثمارات', price: 3.80, change: 0.06, changePct: 1.60, sector: 'الاستثمار' },
    // الصناعة
    { symbol: 'GULFNAV', name: 'الملاحة الخليجية', price: 0.45, change: 0.01, changePct: 2.27, sector: 'النقل' },
    { symbol: 'DUCAB', name: 'كابلات دبي', price: 2.50, change: 0.04, changePct: 1.63, sector: 'الصناعة' },
    // السياحة
    { symbol: 'DUBAI', name: 'دبي للسياحة', price: 1.50, change: 0.02, changePct: 1.35, sector: 'السياحة' },
    { symbol: 'SKY', name: 'دبي للاستثمار', price: 0.85, change: 0.01, changePct: 1.19, sector: 'الاستثمار' },
    // الخدمات المالية
    { symbol: 'SHARJAH', name: 'الشارقة الإسلامية', price: 0.42, change: 0.01, changePct: 2.44, sector: 'البنوك' },
    { symbol: 'COMM', name: 'التجاري الدولي', price: 0.85, change: 0.01, changePct: 1.19, sector: 'الاستثمار' },
    { symbol: 'GULF', name: 'الخليج للاستثمار', price: 1.20, change: 0.02, changePct: 1.69, sector: 'الاستثمار' },
  ],
  
  // بورصة عمان - 15 سهم
  ASE: [
    { symbol: 'ARBK', name: 'البنك العربي', price: 5.25, change: 0.08, changePct: 1.55, sector: 'البنوك' },
    { symbol: 'JOPH', name: 'الصيدلية الأردنية', price: 3.80, change: 0.05, changePct: 1.33, sector: 'الأدوية' },
    { symbol: 'JTHM', name: 'مجموعة التميمي', price: 2.15, change: -0.03, changePct: -1.38, sector: 'التجارة' },
    { symbol: 'AQSA', name: 'المقاصة المركزية', price: 1.85, change: 0.02, changePct: 1.09, sector: 'الخدمات المالية' },
    { symbol: 'ULTC', name: 'الاتحاد للأوراق المالية', price: 4.50, change: 0.06, changePct: 1.35, sector: 'الاستثمار' },
    { symbol: 'JGBI', name: 'بنك الاستثمار الأردني', price: 1.50, change: 0.02, changePct: 1.35, sector: 'البنوك' },
    { symbol: 'JIF', name: 'الصناعات الأردنية', price: 3.20, change: 0.05, changePct: 1.59, sector: 'الصناعة' },
    { symbol: 'APOT', name: 'الشركة العربية للأدوية', price: 6.80, change: 0.10, changePct: 1.49, sector: 'الأدوية' },
    { symbol: 'JMNG', name: 'مناجم الفوسفات', price: 2.85, change: 0.04, changePct: 1.42, sector: 'التعدين' },
    { symbol: 'JPOL', name: 'القدس للتجارة', price: 1.20, change: 0.02, changePct: 1.69, sector: 'التجارة' },
    { symbol: 'JHEA', name: 'الأردنية للفنادق', price: 0.85, change: 0.01, changePct: 1.19, sector: 'السياحة' },
    { symbol: 'JTEL', name: 'الأردنية للاتصالات', price: 4.20, change: 0.06, changePct: 1.45, sector: 'الاتصالات' },
    { symbol: 'JBWK', name: 'بنك عمان الأردني', price: 2.50, change: 0.04, changePct: 1.63, sector: 'البنوك' },
    { symbol: 'JREM', name: 'العقارية الأردنية', price: 1.45, change: 0.02, changePct: 1.40, sector: 'العقارات' },
    { symbol: 'JTRA', name: 'للنقل الأردنية', price: 0.75, change: 0.01, changePct: 1.35, sector: 'النقل' },
  ],
  
  // بورصة الكويت - 20 سهم
  KSE: [
    // البنوك
    { symbol: 'NBK', name: 'بنك الكويت الوطني', price: 0.850, change: 0.012, changePct: 1.43, sector: 'البنوك' },
    { symbol: 'KFH', name: 'بيت التمويل الكويتي', price: 0.720, change: 0.008, changePct: 1.12, sector: 'البنوك' },
    { symbol: 'BOUBYAN', name: 'بنك بوبيان', price: 0.580, change: 0.007, changePct: 1.22, sector: 'البنوك' },
    { symbol: 'KIB', name: 'بنك الكويت الدولي', price: 0.185, change: 0.003, changePct: 1.65, sector: 'البنوك' },
    { symbol: 'ABK', name: 'بنك الأهلي المتحد', price: 0.250, change: 0.004, changePct: 1.63, sector: 'البنوك' },
    { symbol: 'CBK', name: 'البنك التجاري الكويتي', price: 0.145, change: 0.002, changePct: 1.40, sector: 'البنوك' },
    // الاتصالات
    { symbol: 'ZAIN', name: 'زين الكويت', price: 0.850, change: -0.005, changePct: -0.59, sector: 'الاتصالات' },
    { symbol: 'OOREDOO', name: 'أوريدو الكويت', price: 1.250, change: 0.015, changePct: 1.21, sector: 'الاتصالات' },
    // الغذاء والتجزئة
    { symbol: 'AGTHIA', name: 'أغاثيا', price: 2.850, change: 0.035, changePct: 1.24, sector: 'الغذاء' },
    { symbol: 'AMERICANA', name: 'الأمريكانا', price: 1.450, change: 0.018, changePct: 1.26, sector: 'الغذاء' },
    // الاستثمار
    { symbol: 'KAMCO', name: 'كامكو للاستثمار', price: 0.285, change: 0.004, changePct: 1.42, sector: 'الاستثمار' },
    { symbol: 'GLOBAL', name: 'غلوبال', price: 0.125, change: 0.002, changePct: 1.63, sector: 'الاستثمار' },
    { symbol: 'KIC', name: 'الكويت للاستثمار', price: 0.420, change: 0.006, changePct: 1.45, sector: 'الاستثمار' },
    // العقارات
    { symbol: 'MAZAYA', name: 'مزايا العقارية', price: 0.065, change: 0.001, changePct: 1.56, sector: 'العقارات' },
    { symbol: 'ARJAN', name: 'أرجان العقارية', price: 0.125, change: 0.002, changePct: 1.63, sector: 'العقارات' },
    // الصناعة
    { symbol: 'EQUATE', name: 'إيكويت', price: 1.850, change: 0.025, changePct: 1.37, sector: 'الصناعة' },
    { symbol: 'KPPC', name: 'البتروكيماويات الكويتية', price: 0.850, change: 0.012, changePct: 1.43, sector: 'البتروكيماويات' },
    // التأمين
    { symbol: 'GULF', name: 'الخليج للتأمين', price: 0.420, change: 0.006, changePct: 1.45, sector: 'التأمين' },
    { symbol: 'WARBA', name: 'وقاية للتأمين', price: 0.185, change: 0.003, changePct: 1.65, sector: 'التأمين' },
    { symbol: 'AHLI', name: 'الأهلي للتأمين', price: 0.250, change: 0.004, changePct: 1.63, sector: 'التأمين' },
  ],
  
  // بورصة البحرين - 10 أسهم
  BHB: [
    { symbol: 'BBK', name: 'بنك البحرين والكويت', price: 0.485, change: 0.008, changePct: 1.68, sector: 'البنوك' },
    { symbol: 'NBB', name: 'البنك الوطني البحريني', price: 0.620, change: 0.010, changePct: 1.64, sector: 'البنوك' },
    { symbol: 'BATELCO', name: 'بتلكو البحرين', price: 0.285, change: 0.005, changePct: 1.78, sector: 'الاتصالات' },
    { symbol: 'ALBA', name: 'ألبا', price: 0.850, change: -0.012, changePct: -1.39, sector: 'الصناعة' },
    { symbol: 'GPIC', name: 'شركة الخليج للبتروكيماويات', price: 1.250, change: 0.018, changePct: 1.46, sector: 'البتروكيماويات' },
    { symbol: 'BARKA', name: 'بنك البركة', price: 0.185, change: 0.003, changePct: 1.65, sector: 'البنوك' },
    { symbol: 'SALAM', name: 'السلام البحرينية', price: 0.125, change: 0.002, changePct: 1.63, sector: 'الاستثمار' },
    { symbol: 'ARCAP', name: 'أركاب', price: 0.420, change: 0.006, changePct: 1.45, sector: 'الاستثمار' },
    { symbol: 'INOV', name: 'الابتكار البحرينية', price: 0.285, change: 0.004, changePct: 1.42, sector: 'التأمين' },
    { symbol: 'TAJ', name: 'تاج البحرين', price: 0.850, change: 0.012, changePct: 1.43, sector: 'العقارات' },
  ],
  
  // بورصة قطر - 15 سهم
  QE: [
    // البنوك
    { symbol: 'QNB', name: 'بنك قطر الوطني', price: 18.50, change: 0.35, changePct: 1.93, sector: 'البنوك' },
    { symbol: 'QIB', name: 'بنك قطر الإسلامي', price: 12.80, change: 0.22, changePct: 1.75, sector: 'البنوك' },
    { symbol: 'MAS', name: 'مؤسسة قطر للمالية', price: 45.20, change: 0.85, changePct: 1.92, sector: 'الخدمات المالية' },
    { symbol: 'QIIB', name: 'بنك قطر الدولي الإسلامي', price: 8.50, change: 0.15, changePct: 1.80, sector: 'البنوك' },
    { symbol: 'CBQ', name: 'البنك التجاري القطري', price: 5.20, change: 0.08, changePct: 1.56, sector: 'البنوك' },
    // الاتصالات
    { symbol: 'OOREDOO-QA', name: 'أوريدو قطر', price: 8.50, change: 0.15, changePct: 1.80, sector: 'الاتصالات' },
    // الصناعة والبتروكيماويات
    { symbol: 'INDUSTRY', name: 'الصناعات القطرية', price: 22.30, change: 0.45, changePct: 2.06, sector: 'الصناعة' },
    { symbol: 'QAFCO', name: 'قافكو', price: 15.80, change: 0.28, changePct: 1.80, sector: 'البتروكيماويات' },
    { symbol: 'EZZ', name: 'عز للصناعات', price: 28.50, change: 0.52, changePct: 1.86, sector: 'الصناعة' },
    // العقارات
    { symbol: 'BARWA', name: 'بروة العقارية', price: 2.85, change: 0.05, changePct: 1.79, sector: 'العقارات' },
    { symbol: 'EZDAN', name: 'إيزان العقارية', price: 1.45, change: 0.02, changePct: 1.40, sector: 'العقارات' },
    // التأمين
    { symbol: 'QATARIN', name: 'قطر للتأمين', price: 5.80, change: 0.10, changePct: 1.75, sector: 'التأمين' },
    { symbol: 'DAMAAN', name: 'الضمان للتأمين', price: 3.20, change: 0.05, changePct: 1.59, sector: 'التأمين' },
    // التجزئة
    { symbol: 'SALAM', name: 'السلام الدولية', price: 8.50, change: 0.15, changePct: 1.80, sector: 'التجزئة' },
    { symbol: 'MANN', name: 'المناعي القابضة', price: 2.50, change: 0.04, changePct: 1.63, sector: 'الاستثمار' },
  ],
  
  // بورصة مسقط - 15 سهم
  MSX: [
    // البنوك
    { symbol: 'BANKMUSCAT', name: 'بنك مسقط', price: 0.485, change: 0.008, changePct: 1.68, sector: 'البنوك' },
    { symbol: 'BANKDOHA', name: 'بنك الدوحة', price: 0.320, change: 0.005, changePct: 1.59, sector: 'البنوك' },
    { symbol: 'NBO', name: 'البنك الوطني العماني', price: 0.250, change: 0.004, changePct: 1.63, sector: 'البنوك' },
    { symbol: 'SAB', name: 'البنك العربي العماني', price: 0.185, change: 0.003, changePct: 1.65, sector: 'البنوك' },
    // الاتصالات
    { symbol: 'OMANTEL', name: 'عمانتل', price: 0.850, change: 0.012, changePct: 1.43, sector: 'الاتصالات' },
    { symbol: 'OOREDOO-OM', name: 'أوريدو عُمان', price: 0.580, change: 0.008, changePct: 1.40, sector: 'الاتصالات' },
    // الاستثمار
    { symbol: 'OIFC', name: 'عمان للاستثمار', price: 0.125, change: 0.002, changePct: 1.63, sector: 'الاستثمار' },
    { symbol: 'OMANINV', name: 'الاستثمارات العمانية', price: 0.420, change: 0.006, changePct: 1.45, sector: 'الاستثمار' },
    // الغذاء
    { symbol: 'OMANFLOUR', name: 'مطاحن عُمان', price: 0.185, change: 0.003, changePct: 1.65, sector: 'الغذاء' },
    { symbol: 'OMANFOOD', name: 'الأغذية العمانية', price: 0.285, change: 0.004, changePct: 1.42, sector: 'الغذاء' },
    // الطاقة
    { symbol: 'SHELL-OM', name: 'شل عُمان', price: 0.920, change: 0.015, changePct: 1.66, sector: 'الطاقة' },
    { symbol: 'OOMCO', name: 'العمانية للنفط', price: 0.650, change: 0.010, changePct: 1.56, sector: 'الطاقة' },
    // الصناعة
    { symbol: 'OMAN-IND', name: 'الصناعات العمانية', price: 0.450, change: 0.007, changePct: 1.58, sector: 'الصناعة' },
    { symbol: 'OMAN-CEMENT', name: 'أسمنت عُمان', price: 0.385, change: 0.006, changePct: 1.58, sector: 'الصناعة' },
    { symbol: 'GULF-INT', name: 'الخليج الدولية', price: 0.520, change: 0.008, changePct: 1.56, sector: 'الاستثمار' },
  ],
  
  // البورصة المصرية - 30 سهم
  EGX: [
    // البنوك
    { symbol: 'COMI', name: 'بنك التجاري الدولي', price: 85.50, change: 2.20, changePct: 2.64, sector: 'البنوك' },
    { symbol: 'CAI', name: 'بنك القاهرة', price: 22.50, change: 0.55, changePct: 2.51, sector: 'البنوك' },
    { symbol: 'EGB', name: 'البنك المصري الخليجي', price: 18.20, change: 0.45, changePct: 2.54, sector: 'البنوك' },
    { symbol: 'NSGB', name: 'بنك Société Générale', price: 25.80, change: 0.65, changePct: 2.58, sector: 'البنوك' },
    { symbol: 'ADIB-E', name: 'بنك أبوظبي الإسلامي مصر', price: 4.50, change: 0.12, changePct: 2.74, sector: 'البنوك' },
    // الاتصالات
    { symbol: 'ETEL', name: 'المصرية للاتصالات', price: 18.25, change: 0.35, changePct: 1.96, sector: 'الاتصالات' },
    { symbol: 'VODAFONE', name: 'فودافون مصر', price: 12.50, change: 0.25, changePct: 2.04, sector: 'الاتصالات' },
    { symbol: 'ORASCOM', name: 'أوراسكوم للاتصالات', price: 28.50, change: 0.55, changePct: 1.97, sector: 'الاتصالات' },
    // الصناعة
    { symbol: 'SWDY', name: 'السويدي الكهربائيات', price: 42.80, change: 0.85, changePct: 2.03, sector: 'الصناعة' },
    { symbol: 'ORHD', name: 'أوراسكوم للإنشاءات', price: 520.00, change: 15.00, changePct: 2.97, sector: 'الإنشاءات' },
    { symbol: 'ECAR', name: 'الصناعات المصرية', price: 15.20, change: 0.35, changePct: 2.36, sector: 'الصناعة' },
    { symbol: 'EGC', name: 'الكيماويات المصرية', price: 32.50, change: 0.75, changePct: 2.36, sector: 'الصناعة' },
    { symbol: 'MISR', name: 'مصر للألمنيوم', price: 85.20, change: 2.10, changePct: 2.53, sector: 'الصناعة' },
    // العقارات
    { symbol: 'TMGH', name: 'طلعت مصطفى جروب', price: 28.50, change: 0.65, changePct: 2.34, sector: 'العقارات' },
    { symbol: 'HELIOP', name: 'هليوبوليس للإسكان', price: 8.50, change: 0.18, changePct: 2.16, sector: 'العقارات' },
    { symbol: 'MNHD', name: 'مدينة نصر للإسكان', price: 42.80, change: 1.05, changePct: 2.52, sector: 'العقارات' },
    { symbol: 'ORASCOM-H', name: 'أوراسكوم العقارية', price: 285.50, change: 7.20, changePct: 2.59, sector: 'العقارات' },
    // البتروكيماويات
    { symbol: 'AMOC', name: 'أموك', price: 8.85, change: 0.18, changePct: 2.08, sector: 'البتروكيماويات' },
    { symbol: 'SIDPEC', name: 'سيدي كرير', price: 28.50, change: 0.65, changePct: 2.34, sector: 'البتروكيماويات' },
    { symbol: 'EPC', name: 'البتروكيماويات المصرية', price: 15.80, change: 0.35, changePct: 2.27, sector: 'البتروكيماويات' },
    // الغذاء
    { symbol: 'EFID', name: 'إي فيت', price: 15.20, change: 0.28, changePct: 1.87, sector: 'الغذاء' },
    { symbol: 'JUHAYNA', name: 'جهينة', price: 12.50, change: 0.28, changePct: 2.29, sector: 'الغذاء' },
    { symbol: 'EDITA', name: 'إيديتا', price: 18.20, change: 0.42, changePct: 2.36, sector: 'الغذاء' },
    // التجارة
    { symbol: 'OA', name: 'العربيائية', price: 22.50, change: 0.55, changePct: 2.51, sector: 'التجارة' },
    { symbol: 'MMI', name: 'المتحدة للمستثمرين', price: 35.80, change: 0.85, changePct: 2.43, sector: 'الاستثمار' },
    // التأمين
    { symbol: 'MISR-I', name: 'مصر للتأمين', price: 42.50, change: 1.05, changePct: 2.53, sector: 'التأمين' },
    { symbol: 'GIG', name: 'الخليج للتأمين', price: 18.50, change: 0.45, changePct: 2.49, sector: 'التأمين' },
    // السياحة
    { symbol: 'EGOTH', name: 'مصر للفنادق', price: 28.50, change: 0.65, changePct: 2.34, sector: 'السياحة' },
    { symbol: 'MFI', name: 'القاهرة للإسكان', price: 12.80, change: 0.30, changePct: 2.40, sector: 'العقارات' },
    { symbol: 'PHDC', name: 'بالم هيلز', price: 5.50, change: 0.12, changePct: 2.23, sector: 'العقارات' },
  ],
  
  // الأسواق الأمريكية - 30 سهم
  US: [
    // التكنولوجيا الكبرى
    { symbol: 'AAPL', name: 'Apple Inc.', price: 178.50, change: 2.35, changePct: 1.33, sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.20, change: 5.80, changePct: 1.56, sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.80, change: 1.95, changePct: 1.38, sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.50, change: 3.20, changePct: 1.82, sector: 'Consumer' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.40, change: 25.60, changePct: 3.01, sector: 'Technology' },
    { symbol: 'META', name: 'Meta Platforms', price: 505.20, change: 8.45, changePct: 1.70, sector: 'Technology' },
    // السيارات الكهربائية
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.80, change: -5.20, changePct: -2.07, sector: 'Automotive' },
    { symbol: 'RIVN', name: 'Rivian Automotive', price: 12.50, change: 0.35, changePct: 2.88, sector: 'Automotive' },
    { symbol: 'LCID', name: 'Lucid Group', price: 2.85, change: 0.08, changePct: 2.89, sector: 'Automotive' },
    // البنوك
    { symbol: 'JPM', name: 'JPMorgan Chase', price: 195.30, change: 2.85, changePct: 1.48, sector: 'Financial' },
    { symbol: 'BAC', name: 'Bank of America', price: 35.20, change: 0.45, changePct: 1.29, sector: 'Financial' },
    { symbol: 'WFC', name: 'Wells Fargo', price: 52.80, change: 0.75, changePct: 1.44, sector: 'Financial' },
    { symbol: 'GS', name: 'Goldman Sachs', price: 385.50, change: 5.80, changePct: 1.53, sector: 'Financial' },
    // الرعاية الصحية
    { symbol: 'JNJ', name: 'Johnson & Johnson', price: 158.20, change: 1.85, changePct: 1.18, sector: 'Healthcare' },
    { symbol: 'UNH', name: 'UnitedHealth', price: 525.80, change: 8.50, changePct: 1.64, sector: 'Healthcare' },
    { symbol: 'PFE', name: 'Pfizer Inc.', price: 28.50, change: 0.35, changePct: 1.24, sector: 'Healthcare' },
    { symbol: 'ABBV', name: 'AbbVie Inc.', price: 158.50, change: 2.10, changePct: 1.34, sector: 'Healthcare' },
    // الطاقة
    { symbol: 'XOM', name: 'Exxon Mobil', price: 105.20, change: 1.45, changePct: 1.40, sector: 'Energy' },
    { symbol: 'CVX', name: 'Chevron Corp.', price: 155.80, change: 2.10, changePct: 1.37, sector: 'Energy' },
    { symbol: 'COP', name: 'ConocoPhillips', price: 118.50, change: 1.85, changePct: 1.59, sector: 'Energy' },
    // التجزئة
    { symbol: 'WMT', name: 'Walmart Inc.', price: 165.20, change: 2.35, changePct: 1.44, sector: 'Retail' },
    { symbol: 'COST', name: 'Costco Wholesale', price: 725.50, change: 12.80, changePct: 1.80, sector: 'Retail' },
    { symbol: 'TGT', name: 'Target Corp.', price: 158.80, change: 2.15, changePct: 1.37, sector: 'Retail' },
    // الترفيه والإعلام
    { symbol: 'DIS', name: 'Walt Disney', price: 95.50, change: 1.25, changePct: 1.33, sector: 'Entertainment' },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: 585.20, change: 8.50, changePct: 1.47, sector: 'Entertainment' },
    // أشباه الموصلات
    { symbol: 'AMD', name: 'AMD Inc.', price: 158.50, change: 4.20, changePct: 2.72, sector: 'Technology' },
    { symbol: 'INTC', name: 'Intel Corp.', price: 32.50, change: 0.45, changePct: 1.40, sector: 'Technology' },
    { symbol: 'AVGO', name: 'Broadcom Inc.', price: 1285.50, change: 18.50, changePct: 1.46, sector: 'Technology' },
    // الطيران والدفاع
    { symbol: 'BA', name: 'Boeing Co.', price: 185.20, change: -2.50, changePct: -1.33, sector: 'Aerospace' },
    { symbol: 'RTX', name: 'RTX Corp.', price: 88.50, change: 1.20, changePct: 1.37, sector: 'Aerospace' },
  ],
  
  // العملات المشفرة
  CRYPTO: cryptoData.coins.map(coin => ({
    symbol: coin.symbol,
    name: coin.name,
    price: coin.price,
    change: coin.change,
    changePct: coin.changePct,
    sector: coin.category,
  })),
  
  // السلع
  COMMODITIES: [
    ...commoditiesData.preciousMetals.map(item => ({
      symbol: item.symbol,
      name: item.name,
      price: item.price,
      change: item.change,
      changePct: item.changePct,
      sector: 'معادن ثمينة',
    })),
    ...commoditiesData.energy.map(item => ({
      symbol: item.symbol,
      name: item.name,
      price: item.price,
      change: item.change,
      changePct: item.changePct,
      sector: 'طاقة',
    })),
    ...commoditiesData.agriculture.map(item => ({
      symbol: item.symbol,
      name: item.name,
      price: item.price,
      change: item.change,
      changePct: item.changePct,
      sector: 'زراعة',
    })),
  ],
};

// ═══════════════════════════════════════════════════════════════
// بيانات سوق العملات (Forex)
// ═══════════════════════════════════════════════════════════════
export const forexData = {
  // أزواج العملات الرئيسية (Major Pairs)
  majorPairs: [
    { symbol: 'EURUSD', name: 'يورو/دولار', nameEn: 'EUR/USD', baseCurrency: 'EUR', quoteCurrency: 'USD', price: 1.0845, change: 0.0025, changePct: 0.23, bid: 1.0844, ask: 1.0846, spread: 0.0002, high: 1.0872, low: 1.0815, category: 'major' },
    { symbol: 'GBPUSD', name: 'جنيه إسترليني/دولار', nameEn: 'GBP/USD', baseCurrency: 'GBP', quoteCurrency: 'USD', price: 1.2685, change: 0.0045, changePct: 0.36, bid: 1.2684, ask: 1.2686, spread: 0.0002, high: 1.2720, low: 1.2645, category: 'major' },
    { symbol: 'USDJPY', name: 'دولار/ين ياباني', nameEn: 'USD/JPY', baseCurrency: 'USD', quoteCurrency: 'JPY', price: 151.25, change: -0.45, changePct: -0.30, bid: 151.24, ask: 151.26, spread: 0.02, high: 151.85, low: 150.95, category: 'major' },
    { symbol: 'USDCHF', name: 'دولار/فرنك سويسري', nameEn: 'USD/CHF', baseCurrency: 'USD', quoteCurrency: 'CHF', price: 0.8925, change: -0.0015, changePct: -0.17, bid: 0.8924, ask: 0.8926, spread: 0.0002, high: 0.8950, low: 0.8905, category: 'major' },
    { symbol: 'AUDUSD', name: 'دولار أسترالي/دولار', nameEn: 'AUD/USD', baseCurrency: 'AUD', quoteCurrency: 'USD', price: 0.6525, change: 0.0032, changePct: 0.49, bid: 0.6524, ask: 0.6526, spread: 0.0002, high: 0.6555, low: 0.6495, category: 'major' },
    { symbol: 'USDCAD', name: 'دولار/دولار كندي', nameEn: 'USD/CAD', baseCurrency: 'USD', quoteCurrency: 'CAD', price: 1.3625, change: 0.0018, changePct: 0.13, bid: 1.3624, ask: 1.3626, spread: 0.0002, high: 1.3650, low: 1.3595, category: 'major' },
    { symbol: 'NZDUSD', name: 'دولار نيوزيلندي/دولار', nameEn: 'NZD/USD', baseCurrency: 'NZD', quoteCurrency: 'USD', price: 0.5985, change: 0.0025, changePct: 0.42, bid: 0.5984, ask: 0.5986, spread: 0.0002, high: 0.6015, low: 0.5960, category: 'major' },
  ],
  
  // أزواج العملات الثانوية (Minor Pairs/Crosses)
  minorPairs: [
    { symbol: 'EURGBP', name: 'يورو/جنيه إسترليني', nameEn: 'EUR/GBP', baseCurrency: 'EUR', quoteCurrency: 'GBP', price: 0.8550, change: -0.0015, changePct: -0.18, bid: 0.8549, ask: 0.8551, spread: 0.0002, high: 0.8580, low: 0.8525, category: 'minor' },
    { symbol: 'EURJPY', name: 'يورو/ين ياباني', nameEn: 'EUR/JPY', baseCurrency: 'EUR', quoteCurrency: 'JPY', price: 164.05, change: 0.25, changePct: 0.15, bid: 164.04, ask: 164.06, spread: 0.02, high: 164.85, low: 163.45, category: 'minor' },
    { symbol: 'GBPJPY', name: 'جنيه إسترليني/ين ياباني', nameEn: 'GBP/JPY', baseCurrency: 'GBP', quoteCurrency: 'JPY', price: 191.85, change: 0.65, changePct: 0.34, bid: 191.84, ask: 191.86, spread: 0.02, high: 192.85, low: 190.95, category: 'minor' },
    { symbol: 'EURCHF', name: 'يورو/فرنك سويسري', nameEn: 'EUR/CHF', baseCurrency: 'EUR', quoteCurrency: 'CHF', price: 0.9680, change: 0.0012, changePct: 0.12, bid: 0.9679, ask: 0.9681, spread: 0.0002, high: 0.9705, low: 0.9655, category: 'minor' },
    { symbol: 'AUDJPY', name: 'دولار أسترالي/ين ياباني', nameEn: 'AUD/JPY', baseCurrency: 'AUD', quoteCurrency: 'JPY', price: 98.72, change: 0.35, changePct: 0.36, bid: 98.71, ask: 98.73, spread: 0.02, high: 99.25, low: 98.15, category: 'minor' },
    { symbol: 'EURAUD', name: 'يورو/دولار أسترالي', nameEn: 'EUR/AUD', baseCurrency: 'EUR', quoteCurrency: 'AUD', price: 1.6615, change: -0.0085, changePct: -0.51, bid: 1.6614, ask: 1.6616, spread: 0.0002, high: 1.6720, low: 1.6560, category: 'minor' },
    { symbol: 'GBPAUD', name: 'جنيه إسترليني/دولار أسترالي', nameEn: 'GBP/AUD', baseCurrency: 'GBP', quoteCurrency: 'AUD', price: 1.9440, change: -0.0125, changePct: -0.64, bid: 1.9439, ask: 1.9441, spread: 0.0002, high: 1.9585, low: 1.9360, category: 'minor' },
    { symbol: 'EURNZD', name: 'يورو/دولار نيوزيلندي', nameEn: 'EUR/NZD', baseCurrency: 'EUR', quoteCurrency: 'NZD', price: 1.8125, change: -0.0085, changePct: -0.47, bid: 1.8124, ask: 1.8126, spread: 0.0002, high: 1.8250, low: 1.8050, category: 'minor' },
  ],
  
  // أزواج العملات الناشئة (Emerging Market Pairs)
  emergingPairs: [
    { symbol: 'USDSAR', name: 'دولار/ريال سعودي', nameEn: 'USD/SAR', baseCurrency: 'USD', quoteCurrency: 'SAR', price: 3.7500, change: 0.0000, changePct: 0.00, bid: 3.7499, ask: 3.7501, spread: 0.0002, high: 3.7505, low: 3.7495, category: 'emerging' },
    { symbol: 'USDAED', name: 'دولار/درهم إماراتي', nameEn: 'USD/AED', baseCurrency: 'USD', quoteCurrency: 'AED', price: 3.6725, change: 0.0000, changePct: 0.00, bid: 3.6724, ask: 3.6726, spread: 0.0002, high: 3.6730, low: 3.6720, category: 'emerging' },
    { symbol: 'USDKWD', name: 'دولار/دينار كويتي', nameEn: 'USD/KWD', baseCurrency: 'USD', quoteCurrency: 'KWD', price: 0.3085, change: 0.0000, changePct: 0.00, bid: 0.3084, ask: 0.3086, spread: 0.0002, high: 0.3090, low: 0.3080, category: 'emerging' },
    { symbol: 'USDEGP', name: 'دولار/جنيه مصري', nameEn: 'USD/EGP', baseCurrency: 'USD', quoteCurrency: 'EGP', price: 30.85, change: 0.05, changePct: 0.16, bid: 30.84, ask: 30.86, spread: 0.02, high: 30.95, low: 30.75, category: 'emerging' },
    { symbol: 'USDMXN', name: 'دولار/بيزو مكسيكي', nameEn: 'USD/MXN', baseCurrency: 'USD', quoteCurrency: 'MXN', price: 16.85, change: -0.15, changePct: -0.88, bid: 16.84, ask: 16.86, spread: 0.02, high: 17.05, low: 16.70, category: 'emerging' },
    { symbol: 'USDZAR', name: 'دولار/راند جنوب أفريقي', nameEn: 'USD/ZAR', baseCurrency: 'USD', quoteCurrency: 'ZAR', price: 18.65, change: 0.12, changePct: 0.65, bid: 18.64, ask: 18.66, spread: 0.02, high: 18.85, low: 18.50, category: 'emerging' },
    { symbol: 'USDTRY', name: 'دولار/ليرة تركية', nameEn: 'USD/TRY', baseCurrency: 'USD', quoteCurrency: 'TRY', price: 32.15, change: 0.25, changePct: 0.78, bid: 32.14, ask: 32.16, spread: 0.02, high: 32.45, low: 31.95, category: 'emerging' },
    { symbol: 'USDCNY', name: 'دولار/يوان صيني', nameEn: 'USD/CNY', baseCurrency: 'USD', quoteCurrency: 'CNY', price: 7.2450, change: 0.0085, changePct: 0.12, bid: 7.2449, ask: 7.2451, spread: 0.0002, high: 7.2550, low: 7.2350, category: 'emerging' },
    { symbol: 'USDINR', name: 'دولار/روبية هندية', nameEn: 'USD/INR', baseCurrency: 'USD', quoteCurrency: 'INR', price: 83.25, change: 0.08, changePct: 0.10, bid: 83.24, ask: 83.26, spread: 0.02, high: 83.45, low: 83.10, category: 'emerging' },
  ],
  
  // العملات العربية
  arabPairs: [
    { symbol: 'SARAED', name: 'ريال سعودي/درهم إماراتي', nameEn: 'SAR/AED', baseCurrency: 'SAR', quoteCurrency: 'AED', price: 0.9793, change: 0.0000, changePct: 0.00, bid: 0.9792, ask: 0.9794, spread: 0.0002, high: 0.9795, low: 0.9790, category: 'arab' },
    { symbol: 'SARKWD', name: 'ريال سعودي/دينار كويتي', nameEn: 'SAR/KWD', baseCurrency: 'SAR', quoteCurrency: 'KWD', price: 0.0823, change: 0.0000, changePct: 0.00, bid: 0.0822, ask: 0.0824, spread: 0.0002, high: 0.0825, low: 0.0820, category: 'arab' },
    { symbol: 'SARBHD', name: 'ريال سعودي/دينار بحريني', nameEn: 'SAR/BHD', baseCurrency: 'SAR', quoteCurrency: 'BHD', price: 0.1005, change: 0.0000, changePct: 0.00, bid: 0.1004, ask: 0.1006, spread: 0.0002, high: 0.1008, low: 0.1002, category: 'arab' },
    { symbol: 'SAREGP', name: 'ريال سعودي/جنيه مصري', nameEn: 'SAR/EGP', baseCurrency: 'SAR', quoteCurrency: 'EGP', price: 8.2275, change: 0.0150, changePct: 0.18, bid: 8.2270, ask: 8.2280, spread: 0.0010, high: 8.2450, low: 8.2100, category: 'arab' },
    { symbol: 'SARJOD', name: 'ريال سعودي/دينار أردني', nameEn: 'SAR/JOD', baseCurrency: 'SAR', quoteCurrency: 'JOD', price: 0.1895, change: 0.0000, changePct: 0.00, bid: 0.1894, ask: 0.1896, spread: 0.0002, high: 0.1898, low: 0.1892, category: 'arab' },
  ],
  
  // مؤشرات الدولار
  dollarIndex: {
    symbol: 'DXY',
    name: 'مؤشر الدولار الأمريكي',
    nameEn: 'US Dollar Index',
    price: 104.25,
    change: 0.15,
    changePct: 0.14,
    open: 104.10,
    high: 104.45,
    low: 103.95,
  },
};

// عملات الأسواق
export const currencies = {
  SAR: { symbol: 'ر.س', name: 'ريال سعودي', nameEn: 'Saudi Riyal', decimals: 2 },
  AED: { symbol: 'د.إ', name: 'درهم إماراتي', nameEn: 'UAE Dirham', decimals: 2 },
  JOD: { symbol: 'د.أ', name: 'دينار أردني', nameEn: 'Jordanian Dinar', decimals: 3 },
  KWD: { symbol: 'د.ك', name: 'دينار كويتي', nameEn: 'Kuwaiti Dinar', decimals: 3 },
  BHD: { symbol: 'د.ب', name: 'دينار بحريني', nameEn: 'Bahraini Dinar', decimals: 3 },
  QAR: { symbol: 'ر.ق', name: 'ريال قطري', nameEn: 'Qatari Riyal', decimals: 2 },
  OMR: { symbol: 'ر.ع', name: 'ريال عماني', nameEn: 'Omani Rial', decimals: 3 },
  EGP: { symbol: 'ج.م', name: 'جنيه مصري', nameEn: 'Egyptian Pound', decimals: 2 },
  USD: { symbol: '$', name: 'دولار أمريكي', nameEn: 'US Dollar', decimals: 2 },
};

// سعر صرف العملات مقابل الريال السعودي
export const exchangeRates = {
  SAR: 1.0,
  AED: 1.02,
  JOD: 5.28,
  KWD: 8.17,
  BHD: 9.95,
  QAR: 1.02,
  OMR: 9.74,
  EGP: 0.12,
  USD: 3.75,
};

// الحصول على بيانات السوق
export function getMarketByCode(code: string): Market | undefined {
  return markets.find(m => m.code === code);
}

// الحصول على مؤشرات السوق
export function getIndicesByMarket(marketCode: string): MarketIndex[] {
  if (marketCode === 'CRYPTO') {
    return cryptoData.indices;
  }
  if (marketCode === 'COMMODITIES') {
    return commoditiesData.indices;
  }
  if (marketCode === 'FOREX') {
    return [
      { symbol: 'DXY', name: 'مؤشر الدولار الأمريكي', market: 'FOREX', price: forexData.dollarIndex.price, change: forexData.dollarIndex.change, changePct: forexData.dollarIndex.changePct, currency: 'USD', currencySymbol: '' },
    ];
  }
  return marketIndices.filter(i => i.market === marketCode);
}

// الحصول على أسهم السوق
export function getStocksByMarket(marketCode: string) {
  return marketStocks[marketCode as keyof typeof marketStocks] || [];
}

// الحصول على العملات المشفرة حسب الفئة
export function getCryptoByCategory(category: string) {
  return cryptoData.coins.filter(coin => coin.category === category);
}

// الحصول على السلع حسب الفئة
export function getCommoditiesByCategory(category: string) {
  const categoryMap: Record<string, keyof typeof commoditiesData> = {
    'precious': 'preciousMetals',
    'industrial': 'industrialMetals',
    'energy': 'energy',
    'agriculture': 'agriculture',
    'livestock': 'livestock',
  };
  
  const key = categoryMap[category];
  return key ? commoditiesData[key] : [];
}

// تنسيق العملة حسب السوق
export function formatMarketCurrency(amount: number, marketCode: string): string {
  const market = getMarketByCode(marketCode);
  if (!market) return amount.toFixed(2);
  
  const currency = currencies[market.currency as keyof typeof currencies];
  const decimals = currency?.decimals || 2;
  
  const formatted = new Intl.NumberFormat('ar-SA-u-ca-gregory', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  
  return `${formatted} ${market.currencySymbol}`;
}

// تنسيق الأرقام الكبيرة (للسوق المشفرة)
export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)} تريليون`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)} مليار`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)} مليون`;
  return num.toLocaleString('ar-SA-u-ca-gregory');
}

// الحصول على الأسواق حسب النوع
export function getMarketsByType(type: 'stock' | 'crypto' | 'commodity' | 'forex'): Market[] {
  return markets.filter(m => m.type === type);
}

// الحصول على أزواج العملات حسب الفئة
export function getForexByCategory(category: 'major' | 'minor' | 'emerging' | 'arab') {
  const categoryMap: Record<string, keyof typeof forexData> = {
    'major': 'majorPairs',
    'minor': 'minorPairs',
    'emerging': 'emergingPairs',
    'arab': 'arabPairs',
  };
  
  const key = categoryMap[category];
  return key ? forexData[key] : [];
}

// الحصول على جميع أزواج العملات
export function getAllForexPairs() {
  return [
    ...forexData.majorPairs,
    ...forexData.minorPairs,
    ...forexData.emergingPairs,
    ...forexData.arabPairs,
  ];
}
