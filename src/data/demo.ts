// Demo Data for Portfolio Manager

import { Stock, Bond, Fund, Portfolio, MarketData } from '@/types';

// Re-export types for convenience
export type { Stock, Bond, Fund, Portfolio, MarketData } from '@/types';

// بيانات الأسهم التجريبية
export const demoStocks: Stock[] = [
  {
    id: '1',
    symbol: '2222.SR',
    name: 'أرامكو السعودية',
    exchange: 'TADAWUL',
    sector: 'الطاقة',
    qty: 200,
    buyPrice: 32.50,
    currentPrice: 28.75,
    change: -0.45,
    changePct: -1.54,
    totalCost: 6500,
    currentValue: 5750,
    profitLoss: -750,
    profitLossPct: -11.54,
    isShariaCompliant: true,
  },
  {
    id: '2',
    symbol: '1120.SR',
    name: 'مصرف الراجحي',
    exchange: 'TADAWUL',
    sector: 'البنوك',
    qty: 150,
    buyPrice: 95.00,
    currentPrice: 108.50,
    change: 2.25,
    changePct: 2.12,
    totalCost: 14250,
    currentValue: 16275,
    profitLoss: 2025,
    profitLossPct: 14.21,
    isShariaCompliant: true,
  },
  {
    id: '3',
    symbol: '4280.SR',
    name: 'المملكة القابضة',
    exchange: 'TADAWUL',
    sector: 'التطوير العقاري',
    qty: 500,
    buyPrice: 8.75,
    currentPrice: 9.20,
    change: 0.15,
    changePct: 1.66,
    totalCost: 4375,
    currentValue: 4600,
    profitLoss: 225,
    profitLossPct: 5.14,
    isShariaCompliant: true,
  },
  {
    id: '4',
    symbol: '7010.SR',
    name: 'شركة الاتصالات السعودية',
    exchange: 'TADAWUL',
    sector: 'الاتصالات',
    qty: 100,
    buyPrice: 145.00,
    currentPrice: 138.25,
    change: -1.80,
    changePct: -1.28,
    totalCost: 14500,
    currentValue: 13825,
    profitLoss: -675,
    profitLossPct: -4.66,
    isShariaCompliant: true,
  },
  {
    id: '5',
    symbol: '2380.SR',
    name: 'الإنماء للتعمير',
    exchange: 'TADAWUL',
    sector: 'التطوير العقاري',
    qty: 300,
    buyPrice: 28.00,
    currentPrice: 32.40,
    change: 0.85,
    changePct: 2.69,
    totalCost: 8400,
    currentValue: 9720,
    profitLoss: 1320,
    profitLossPct: 15.71,
    isShariaCompliant: true,
  },
];

// بيانات السندات والصكوك
export const demoBonds: Bond[] = [
  {
    id: 'b1',
    symbol: 'SUKUK-2025',
    name: 'صكوك حكومية 2025',
    type: 'sukuk',
    faceValue: 1000,
    couponRate: 3.5,
    maturityDate: new Date('2025-12-31'),
    qty: 10,
    buyPrice: 98.5,
    currentPrice: 99.2,
    isShariaCompliant: true,
  },
  {
    id: 'b2',
    symbol: 'SUKUK-2026',
    name: 'صكوك أرامكو 2026',
    type: 'sukuk',
    faceValue: 1000,
    couponRate: 4.25,
    maturityDate: new Date('2026-06-30'),
    qty: 5,
    buyPrice: 97.0,
    currentPrice: 98.8,
    isShariaCompliant: true,
  },
];

// بيانات الصناديق
export const demoFunds: Fund[] = [
  {
    id: 'f1',
    symbol: 'ALINMA-ETF',
    name: 'صندوق الإنماء للأسهم السعودية',
    fundType: 'equity',
    units: 50,
    buyPrice: 45.20,
    currentPrice: 48.75,
    ytdReturn: 12.5,
    isShariaCompliant: true,
  },
  {
    id: 'f2',
    symbol: 'RIYADH-REIT',
    name: 'صندوق الرياض العقاري',
    fundType: 'real_estate',
    units: 100,
    buyPrice: 12.50,
    currentPrice: 13.80,
    ytdReturn: 8.2,
    isShariaCompliant: true,
  },
];

// المحفظة التجريبية
export const demoPortfolio: Portfolio = {
  id: 'p1',
  name: 'المحفظة الرئيسية',
  description: 'محفظة استثمارية متنوعة',
  type: 'mixed',
  currency: 'SAR',
  isActive: true,
  stocks: demoStocks,
  bonds: demoBonds,
  funds: demoFunds,
};

// بيانات السوق المباشرة - Multi-Market
export const demoMarketData: MarketData[] = [
  // السوق السعودي
  { symbol: 'TASI', name: 'مؤشر تداول جميع الأسهم', price: 12450.32, change: 85.45, changePct: 0.69 },
  { symbol: 'TASI-BNK', name: 'مؤشر البنوك', price: 5230.18, change: 42.30, changePct: 0.82 },
  { symbol: 'TASI-ENR', name: 'مؤشر الطاقة', price: 3890.55, change: -25.10, changePct: -0.64 },
  { symbol: 'TASI-TEL', name: 'مؤشر الاتصالات', price: 2150.80, change: 15.25, changePct: 0.71 },
  { symbol: 'TASI-RLE', name: 'مؤشر العقارات', price: 1890.45, change: 28.60, changePct: 1.54 },
  
  // سوق أبوظبي
  { symbol: 'ADI', name: 'مؤشر أبوظبي العام', price: 9850.20, change: 65.40, changePct: 0.67 },
  
  // سوق دبي
  { symbol: 'DFMGI', name: 'مؤشر دبي المالي', price: 4120.30, change: 35.80, changePct: 0.88 },
  
  // بورصة الكويت
  { symbol: 'KSE', name: 'مؤشر الكويت', price: 7850.90, change: -42.30, changePct: -0.54 },
  
  // بورصة مصر
  { symbol: 'EGX30', name: 'مؤشر مصر 30', price: 28450.75, change: 125.30, changePct: 0.44 },
  
  // الأسواق الأمريكية
  { symbol: 'SPX', name: 'S&P 500', price: 5120.50, change: 45.30, changePct: 0.89 },
  { symbol: 'DJI', name: 'داو جونز', price: 38500.20, change: 320.50, changePct: 0.84 },
  { symbol: 'IXIC', name: 'ناسداك', price: 16250.80, change: 185.20, changePct: 1.15 },
];

// توزيع القطاعات
export const demoSectorAllocation = [
  { sector: 'البنوك', value: 16275, percentage: 35.2, count: 1 },
  { sector: 'الاتصالات', value: 13825, percentage: 29.9, count: 1 },
  { sector: 'الطاقة', value: 5750, percentage: 12.4, count: 1 },
  { sector: 'التطوير العقاري', value: 14320, percentage: 31.0, count: 2 },
];

// بيانات الأداء الشهري
export const demoMonthlyPerformance = [
  { month: 'يناير', value: 45000, profit: 1200 },
  { month: 'فبراير', value: 46500, profit: 1500 },
  { month: 'مارس', value: 44200, profit: -800 },
  { month: 'أبريل', value: 47800, profit: 3600 },
  { month: 'مايو', value: 49100, profit: 1300 },
  { month: 'يونيو', value: 48500, profit: -600 },
  { month: 'يوليو', value: 50200, profit: 1700 },
  { month: 'أغسطس', value: 51800, profit: 1600 },
  { month: 'سبتمبر', value: 49500, profit: -2300 },
  { month: 'أكتوبر', value: 51200, profit: 1700 },
  { month: 'نوفمبر', value: 52800, profit: 1600 },
  { month: 'ديسمبر', value: 50170, profit: -2630 },
];

// أخبار السوق
export const demoNews = [
  {
    id: 'n1',
    title: 'أرامكو تعلن عن نتائج الربع الثالث',
    summary: 'حققت أرامكو السعودية أرباحاً صافية بلغت 32.6 مليار ريال في الربع الثالث...',
    date: new Date(),
    source: 'تداول',
    category: 'أرباح',
  },
  {
    id: 'n2',
    title: 'مؤشر تداول يرتفع 0.7% مع مكاسب البنوك',
    summary: 'صعد المؤشر العام لسوق الأسهم السعودية مدعوماً بارتفاع قطاع البنوك...',
    date: new Date(),
    source: 'الاقتصادية',
    category: 'سوق',
  },
  {
    id: 'n3',
    title: 'البنك المركزي يثبت أسعار الفائدة',
    summary: 'قرر البنك المركزي السعودي تثبيت سعر الفائدة عند 5.25%...',
    date: new Date(),
    source: 'الرياض',
    category: 'اقتصاد',
  },
];
