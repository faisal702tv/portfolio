// قاعدة بيانات الأسهم الشرعية
// المعايير الأربعة المعتمدة:
// 1. البلاد - معيار بنك البلاد
// 2. الراجحي - معيار مصرف الراجحي
// 3. مكتب المقاصد - مكوب المقاصد الشرعية
// 4. صفر ديون - معيار عدم وجود ديون ربوية

export interface ShariaStandard {
  id: string;
  name: string;
  nameEn: string;
  description: string;
}

export const shariaStandards: ShariaStandard[] = [
  {
    id: 'albilad',
    name: 'البلاد',
    nameEn: 'Albilad Standard',
    description: 'معيار بنك البلاد للأسهم الشرعية',
  },
  {
    id: 'alrajhi',
    name: 'الراجحي',
    nameEn: 'Al Rajhi Standard',
    description: 'معيار مصرف الراجحي للأسهم الشرعية',
  },
  {
    id: 'maqasid',
    name: 'مكتب المقاصد',
    nameEn: 'Maqasid Office',
    description: 'معيار مكتب المقاصد للأسهم الشرعية',
  },
  {
    id: 'zerodebt',
    name: 'صفر ديون',
    nameEn: 'Zero Debt',
    description: 'معيار عدم وجود ديون ربوية',
  },
];

export interface ShariaStock {
  symbol: string;
  name: string;
  nameEn: string;
  market: string;
  sector: string;
  // نتائج الفحص الشرعي لكل معيار
  shariaStatus: {
    albilad: 'compliant' | 'non_compliant' | 'questionable';
    alrajhi: 'compliant' | 'non_compliant' | 'questionable';
    maqasid: 'compliant' | 'non_compliant' | 'questionable';
    zerodebt: 'compliant' | 'non_compliant' | 'questionable';
  };
  // المعايير المالية
  debtRatio: number; // نسبة الدين
  nonHalalIncome: number; // نسبة الدخل غير الحلال
  interestBearingAssets: number; // نسبة الأصول ذات الفائدة
  // معلومات إضافية
  lastUpdate: string;
  notes?: string;
}

// الأسهم الشرعية من السوق السعودي
export const saudiShariaStocks: ShariaStock[] = [
  // البنوك الإسلامية - متوافقة مع جميع المعايير
  {
    symbol: '2222.SR',
    name: 'أرامكو السعودية',
    nameEn: 'Saudi Aramco',
    market: 'TADAWUL',
    sector: 'الطاقة',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 5.2,
    nonHalalIncome: 0,
    interestBearingAssets: 2.1,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: '1120.SR',
    name: 'مصرف الراجحي',
    nameEn: 'Al Rajhi Bank',
    market: 'TADAWUL',
    sector: 'البنوك',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 0,
    nonHalalIncome: 0,
    interestBearingAssets: 0,
    lastUpdate: '2024-03-20',
    notes: 'بنك إسلامي بالكامل',
  },
  {
    symbol: '4002.SR',
    name: 'بنك الرياض',
    nameEn: 'Riyad Bank',
    market: 'TADAWUL',
    sector: 'البنوك',
    shariaStatus: { albilad: 'questionable', alrajhi: 'non_compliant', maqasid: 'non_compliant', zerodebt: 'non_compliant' },
    debtRatio: 45.3,
    nonHalalIncome: 15.2,
    interestBearingAssets: 35.1,
    lastUpdate: '2024-03-20',
    notes: 'بنك تقليدي',
  },
  {
    symbol: '7010.SR',
    name: 'الاتصالات السعودية',
    nameEn: 'Saudi Telecom',
    market: 'TADAWUL',
    sector: 'الاتصالات',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 8.5,
    nonHalalIncome: 0.5,
    interestBearingAssets: 3.2,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: '2010.SR',
    name: 'سابك',
    nameEn: 'SABIC',
    market: 'TADAWUL',
    sector: 'البتروكيماويات',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'questionable' },
    debtRatio: 25.8,
    nonHalalIncome: 1.2,
    interestBearingAssets: 12.5,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: '4280.SR',
    name: 'المملكة القابضة',
    nameEn: 'Kingdom Holding',
    market: 'TADAWUL',
    sector: 'الاستثمار',
    shariaStatus: { albilad: 'non_compliant', alrajhi: 'non_compliant', maqasid: 'non_compliant', zerodebt: 'non_compliant' },
    debtRatio: 55.2,
    nonHalalIncome: 25.8,
    interestBearingAssets: 42.3,
    lastUpdate: '2024-03-20',
    notes: 'تستثمر في فنادق تقدم خدمات غير شرعية',
  },
  {
    symbol: '2380.SR',
    name: 'الإنماء للتعمير',
    nameEn: 'Alinma REIT',
    market: 'TADAWUL',
    sector: 'العقارات',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 15.2,
    nonHalalIncome: 0,
    interestBearingAssets: 8.5,
    lastUpdate: '2024-03-20',
  },
  // المزيد من الأسهم السعودية
  {
    symbol: '4160.SR',
    name: 'البنك العربي الوطني',
    nameEn: 'Arab National Bank',
    market: 'TADAWUL',
    sector: 'البنوك',
    shariaStatus: { albilad: 'non_compliant', alrajhi: 'non_compliant', maqasid: 'non_compliant', zerodebt: 'non_compliant' },
    debtRatio: 42.5,
    nonHalalIncome: 18.3,
    interestBearingAssets: 38.2,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: '4230.SR',
    name: 'بنك الإنماء',
    nameEn: 'Alinma Bank',
    market: 'TADAWUL',
    sector: 'البنوك',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 0,
    nonHalalIncome: 0,
    interestBearingAssets: 0,
    lastUpdate: '2024-03-20',
    notes: 'بنك إسلامي بالكامل',
  },
  {
    symbol: '5110.SR',
    name: 'معادن',
    nameEn: 'Maaden',
    market: 'TADAWUL',
    sector: 'التعدين',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'questionable' },
    debtRatio: 22.5,
    nonHalalIncome: 0.8,
    interestBearingAssets: 10.2,
    lastUpdate: '2024-03-20',
  },
];

// الأسهم الشرعية من السوق الإماراتي
export const uaeShariaStocks: ShariaStock[] = [
  {
    symbol: 'DIB',
    name: 'بنك دبي الإسلامي',
    nameEn: 'Dubai Islamic Bank',
    market: 'DFM',
    sector: 'البنوك',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 0,
    nonHalalIncome: 0,
    interestBearingAssets: 0,
    lastUpdate: '2024-03-20',
    notes: 'بنك إسلامي',
  },
  {
    symbol: 'ADIB',
    name: 'بنك أبوظبي الإسلامي',
    nameEn: 'Abu Dhabi Islamic Bank',
    market: 'ADX',
    sector: 'البنوك',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 0,
    nonHalalIncome: 0,
    interestBearingAssets: 0,
    lastUpdate: '2024-03-20',
    notes: 'بنك إسلامي',
  },
  {
    symbol: 'EMAAR',
    name: 'إعمار العقارية',
    nameEn: 'Emaar Properties',
    market: 'DFM',
    sector: 'العقارات',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'questionable', zerodebt: 'questionable' },
    debtRatio: 28.5,
    nonHalalIncome: 3.2,
    interestBearingAssets: 15.8,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: 'ETISALAT',
    name: 'اتصالات',
    nameEn: 'Etisalat',
    market: 'ADX',
    sector: 'الاتصالات',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 12.3,
    nonHalalIncome: 1.5,
    interestBearingAssets: 5.8,
    lastUpdate: '2024-03-20',
  },
];

// الأسهم الشرعية من السوق الكويتي
export const kuwaitShariaStocks: ShariaStock[] = [
  {
    symbol: 'KFH',
    name: 'بيت التمويل الكويتي',
    nameEn: 'Kuwait Finance House',
    market: 'KSE',
    sector: 'البنوك',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 0,
    nonHalalIncome: 0,
    interestBearingAssets: 0,
    lastUpdate: '2024-03-20',
    notes: 'بنك إسلامي',
  },
  {
    symbol: 'BOUBYAN',
    name: 'بنك بوبيان',
    nameEn: 'Boubyan Bank',
    market: 'KSE',
    sector: 'البنوك',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 0,
    nonHalalIncome: 0,
    interestBearingAssets: 0,
    lastUpdate: '2024-03-20',
    notes: 'بنك إسلامي',
  },
  {
    symbol: 'ZAIN',
    name: 'زين الكويت',
    nameEn: 'Zain Kuwait',
    market: 'KSE',
    sector: 'الاتصالات',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 15.2,
    nonHalalIncome: 1.8,
    interestBearingAssets: 6.5,
    lastUpdate: '2024-03-20',
  },
];

// الأسهم الشرعية من السوق القطري
export const qatarShariaStocks: ShariaStock[] = [
  {
    symbol: 'QIB',
    name: 'بنك قطر الإسلامي',
    nameEn: 'Qatar Islamic Bank',
    market: 'QE',
    sector: 'البنوك',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 0,
    nonHalalIncome: 0,
    interestBearingAssets: 0,
    lastUpdate: '2024-03-20',
    notes: 'بنك إسلامي',
  },
  {
    symbol: 'QNB',
    name: 'بنك قطر الوطني',
    nameEn: 'Qatar National Bank',
    market: 'QE',
    sector: 'البنوك',
    shariaStatus: { albilad: 'non_compliant', alrajhi: 'non_compliant', maqasid: 'non_compliant', zerodebt: 'non_compliant' },
    debtRatio: 52.3,
    nonHalalIncome: 22.5,
    interestBearingAssets: 45.8,
    lastUpdate: '2024-03-20',
    notes: 'بنك تقليدي',
  },
];

// الأسهم الشرعية من السوق البحريني
export const bahrainShariaStocks: ShariaStock[] = [
  {
    symbol: 'BBK',
    name: 'بنك البحرين والكويت',
    nameEn: 'Bahrain Kuwait Bank',
    market: 'BHB',
    sector: 'البنوك',
    shariaStatus: { albilad: 'non_compliant', alrajhi: 'non_compliant', maqasid: 'non_compliant', zerodebt: 'non_compliant' },
    debtRatio: 48.5,
    nonHalalIncome: 20.2,
    interestBearingAssets: 40.5,
    lastUpdate: '2024-03-20',
  },
];

// الأسهم الشرعية من السوق العماني
export const omanShariaStocks: ShariaStock[] = [
  {
    symbol: 'BANKMUSCAT',
    name: 'بنك مسقط',
    nameEn: 'Bank Muscat',
    market: 'MSX',
    sector: 'البنوك',
    shariaStatus: { albilad: 'non_compliant', alrajhi: 'non_compliant', maqasid: 'non_compliant', zerodebt: 'non_compliant' },
    debtRatio: 45.2,
    nonHalalIncome: 18.5,
    interestBearingAssets: 38.2,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: 'OMANTEL',
    name: 'عمانتل',
    nameEn: 'Omantel',
    market: 'MSX',
    sector: 'الاتصالات',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 18.5,
    nonHalalIncome: 2.2,
    interestBearingAssets: 8.5,
    lastUpdate: '2024-03-20',
  },
];

// الأسهم الشرعية من السوق المصري
export const egyptShariaStocks: ShariaStock[] = [
  {
    symbol: 'COMI',
    name: 'بنك التجاري الدولي',
    nameEn: 'Commercial International Bank',
    market: 'EGX',
    sector: 'البنوك',
    shariaStatus: { albilad: 'non_compliant', alrajhi: 'non_compliant', maqasid: 'non_compliant', zerodebt: 'non_compliant' },
    debtRatio: 55.2,
    nonHalalIncome: 28.5,
    interestBearingAssets: 48.2,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: 'ETEL',
    name: 'المصرية للاتصالات',
    nameEn: 'Telecom Egypt',
    market: 'EGX',
    sector: 'الاتصالات',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'questionable' },
    debtRatio: 20.5,
    nonHalalIncome: 1.8,
    interestBearingAssets: 9.2,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: 'TMGH',
    name: 'طلعت مصطفى جروب',
    nameEn: 'Talaat Moustafa Group',
    market: 'EGX',
    sector: 'العقارات',
    shariaStatus: { albilad: 'questionable', alrajhi: 'questionable', maqasid: 'questionable', zerodebt: 'non_compliant' },
    debtRatio: 35.8,
    nonHalalIncome: 5.2,
    interestBearingAssets: 22.5,
    lastUpdate: '2024-03-20',
  },
];

// الأسهم الأمريكية الشرعية (مختارة)
export const usShariaStocks: ShariaStock[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    nameEn: 'Apple Inc.',
    market: 'US',
    sector: 'Technology',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 15.2,
    nonHalalIncome: 0,
    interestBearingAssets: 8.5,
    lastUpdate: '2024-03-20',
    notes: 'شركة تقنية - متوافقة شرعاً',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    nameEn: 'Microsoft Corp.',
    market: 'US',
    sector: 'Technology',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'questionable' },
    debtRatio: 22.5,
    nonHalalIncome: 0.5,
    interestBearingAssets: 12.8,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    nameEn: 'Alphabet Inc.',
    market: 'US',
    sector: 'Technology',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 8.5,
    nonHalalIncome: 0.2,
    interestBearingAssets: 5.2,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    nameEn: 'Amazon.com Inc.',
    market: 'US',
    sector: 'Consumer',
    shariaStatus: { albilad: 'questionable', alrajhi: 'questionable', maqasid: 'questionable', zerodebt: 'non_compliant' },
    debtRatio: 35.2,
    nonHalalIncome: 2.5,
    interestBearingAssets: 18.5,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    nameEn: 'NVIDIA Corp.',
    market: 'US',
    sector: 'Technology',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 12.8,
    nonHalalIncome: 0.1,
    interestBearingAssets: 6.5,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: 'META',
    name: 'Meta Platforms',
    nameEn: 'Meta Platforms',
    market: 'US',
    sector: 'Technology',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 5.2,
    nonHalalIncome: 0.3,
    interestBearingAssets: 3.8,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    nameEn: 'Tesla Inc.',
    market: 'US',
    sector: 'Automotive',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'questionable' },
    debtRatio: 18.5,
    nonHalalIncome: 0.8,
    interestBearingAssets: 10.2,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase',
    nameEn: 'JPMorgan Chase',
    market: 'US',
    sector: 'Financial',
    shariaStatus: { albilad: 'non_compliant', alrajhi: 'non_compliant', maqasid: 'non_compliant', zerodebt: 'non_compliant' },
    debtRatio: 85.2,
    nonHalalIncome: 45.5,
    interestBearingAssets: 78.2,
    lastUpdate: '2024-03-20',
    notes: 'بنك تقليدي - غير متوافق شرعاً',
  },
  {
    symbol: 'BAC',
    name: 'Bank of America',
    nameEn: 'Bank of America',
    market: 'US',
    sector: 'Financial',
    shariaStatus: { albilad: 'non_compliant', alrajhi: 'non_compliant', maqasid: 'non_compliant', zerodebt: 'non_compliant' },
    debtRatio: 88.5,
    nonHalalIncome: 48.2,
    interestBearingAssets: 82.5,
    lastUpdate: '2024-03-20',
    notes: 'بنك تقليدي - غير متوافق شرعاً',
  },
  // المزيد من الأسهم الأمريكية
  {
    symbol: 'ORCL',
    name: 'Oracle Corp.',
    nameEn: 'Oracle Corp.',
    market: 'US',
    sector: 'Technology',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'questionable' },
    debtRatio: 28.5,
    nonHalalIncome: 1.2,
    interestBearingAssets: 15.8,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: 'INTC',
    name: 'Intel Corp.',
    nameEn: 'Intel Corp.',
    market: 'US',
    sector: 'Technology',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'questionable' },
    debtRatio: 25.2,
    nonHalalIncome: 0.5,
    interestBearingAssets: 12.5,
    lastUpdate: '2024-03-20',
  },
  {
    symbol: 'AMD',
    name: 'AMD Inc.',
    nameEn: 'Advanced Micro Devices',
    market: 'US',
    sector: 'Technology',
    shariaStatus: { albilad: 'compliant', alrajhi: 'compliant', maqasid: 'compliant', zerodebt: 'compliant' },
    debtRatio: 8.2,
    nonHalalIncome: 0.1,
    interestBearingAssets: 4.5,
    lastUpdate: '2024-03-20',
  },
];

// دمج جميع الأسهم
export const allShariaStocks: ShariaStock[] = [
  ...saudiShariaStocks,
  ...uaeShariaStocks,
  ...kuwaitShariaStocks,
  ...qatarShariaStocks,
  ...bahrainShariaStocks,
  ...omanShariaStocks,
  ...egyptShariaStocks,
  ...usShariaStocks,
];

// دوال مساعدة
export function getStocksByStandard(standardId: string): ShariaStock[] {
  return allShariaStocks.filter(stock => {
    const status = stock.shariaStatus[standardId as keyof typeof stock.shariaStatus];
    return status === 'compliant';
  });
}

export function getStocksByMarket(market: string): ShariaStock[] {
  return allShariaStocks.filter(stock => stock.market === market);
}

export function getCompliantStocks(): ShariaStock[] {
  return allShariaStocks.filter(stock => {
    const statuses = Object.values(stock.shariaStatus);
    return statuses.every(s => s === 'compliant');
  });
}

export function getStockShariaStatus(symbol: string): ShariaStock | undefined {
  return allShariaStocks.find(stock => stock.symbol === symbol);
}
