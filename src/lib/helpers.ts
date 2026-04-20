// Portfolio Manager Utility Functions

// تنسيق الأرقام مع الفواصل (أرقام عربية)
export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('ar-SA-u-ca-gregory', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// تنسيق الأرقام مع فاصلة الآلاف (أرقام غربية)
export function fmtN(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// Constants for standard exchange rates (relative to base SAR = 1)
export const EXCHANGE_RATES: Record<string, number> = {
  SAR: 1,
  USD: 3.75,
  EUR: 4.05,
  GBP: 4.75,
  JPY: 0.025,
  CHF: 4.2,
  CAD: 2.75,
  AUD: 2.45,
  CNY: 0.52,
  AED: 1.021,
  KWD: 12.18,
  QAR: 1.03,
  EGP: 0.075,
  BHD: 9.95,
  OMR: 9.74,
  JOD: 5.29,
};

// تحويل العملات
export function convertCurrency(amount: number, from: string, to: string): number {
  if (!from || !to || from.toUpperCase() === to.toUpperCase()) return amount;
  const fromRate = EXCHANGE_RATES[from.toUpperCase()] || 1;
  const toRate = EXCHANGE_RATES[to.toUpperCase()] || 1;
  return amount * (fromRate / toRate);
}

// تنسيق العملة
export function formatCurrency(amount: number, currency: string = 'SAR'): string {
  const symbols: Record<string, string> = {
    SAR: 'ر.س',
    AED: 'د.إ',
    KWD: 'د.ك',
    QAR: 'ر.ق',
    EGP: 'ج.م',
    BHD: 'د.ب',
    JOD: 'د.أ',
    OMR: 'ر.ع',
    USD: '$',
  };

  return `${formatNumber(amount)} ${symbols[currency] || currency}`;
}

// تنسيق العملة مع تحديد المنازل العشرية حسب العملة
export function formatCurrencyByCode(amount: number, currency: string = 'SAR'): string {
  const currencyConfig: Record<string, { symbol: string; decimals: number }> = {
    SAR: { symbol: 'ر.س', decimals: 2 },
    AED: { symbol: 'د.إ', decimals: 2 },
    KWD: { symbol: 'د.ك', decimals: 3 },
    QAR: { symbol: 'ر.ق', decimals: 2 },
    EGP: { symbol: 'ج.م', decimals: 2 },
    BHD: { symbol: 'د.ب', decimals: 3 },
    JOD: { symbol: 'د.أ', decimals: 3 },
    OMR: { symbol: 'ر.ع', decimals: 3 },
    USD: { symbol: '$', decimals: 2 },
  };

  const config = currencyConfig[currency] || { symbol: currency, decimals: 2 };
  
  const formatted = new Intl.NumberFormat('ar-SA-u-ca-gregory', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
  
  return `${formatted} ${config.symbol}`;
}

// تنسيق النسبة المئوية
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatNumber(value, decimals)}%`;
}

// حساب الربح/الخسارة
export function calculateProfitLoss(
  qty: number,
  buyPrice: number,
  currentPrice: number
): { profitLoss: number; profitLossPct: number } {
  const totalCost = qty * buyPrice;
  const currentValue = qty * currentPrice;
  const profitLoss = currentValue - totalCost;
  const profitLossPct = (profitLoss / totalCost) * 100;

  return { profitLoss, profitLossPct };
}

// تنسيق التاريخ
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions =
    format === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
      : { year: 'numeric', month: 'short', day: 'numeric' };

  return d.toLocaleDateString('ar-SA-u-ca-gregory', options);
}

// تنسيق الوقت النسبي
export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;

  return formatDate(d);
}

// حساب القيمة الإجمالية للمحفظة
export function calculatePortfolioTotals(stocks: { qty: number; buyPrice: number; currentPrice?: number }[]) {
  let totalCost = 0;
  let totalValue = 0;

  stocks.forEach((stock) => {
    totalCost += stock.qty * stock.buyPrice;
    totalValue += stock.qty * (stock.currentPrice || stock.buyPrice);
  });

  const profitLoss = totalValue - totalCost;
  const profitLossPct = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

  return { totalCost, totalValue, profitLoss, profitLossPct };
}

// تحديد لون التغيير
export function getChangeColor(value: number): string {
  if (value > 0) return 'text-green-600 dark:text-green-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
}

// تحديد خلفية التغيير
export function getChangeBgColor(value: number): string {
  if (value > 0) return 'bg-green-100 dark:bg-green-900/30';
  if (value < 0) return 'bg-red-100 dark:bg-red-900/30';
  return 'bg-muted';
}

// اختصار الأرقام الكبيرة
export function abbreviateNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)} تر`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)} مليار`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)} مليون`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)} ألف`;
  return formatNumber(num);
}

// إنشاء معرف فريد
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// تأخير التنفيذ
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// التحقق من صلاحية السعر
export function isValidPrice(price: number | undefined | null): boolean {
  return typeof price === 'number' && !isNaN(price) && price >= 0;
}

// حساب التقلب (Volatility)
export function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;

  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / prices.length;

  return Math.sqrt(variance);
}
