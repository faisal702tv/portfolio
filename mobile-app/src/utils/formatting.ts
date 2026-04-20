// Portfolio Manager Mobile - Formatting Utilities

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString('ar-SA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(amount: number, currency: string = 'SAR'): string {
  const symbols: Record<string, string> = {
    SAR: 'ر.س',
    AED: 'د.إ',
    KWD: 'د.ك',
    QAR: 'ر.ق',
    EGP: 'ج.م',
    BHD: 'د.ب',
    OMR: 'ر.ع',
    USD: '$',
  };

  return `${formatNumber(amount)} ${symbols[currency] || currency}`;
}

export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatNumber(value, decimals)}%`;
}

export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions =
    format === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
      : { year: 'numeric', month: 'short', day: 'numeric' };

  return d.toLocaleDateString('ar-SA', options);
}

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

export function abbreviateNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)} تر`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)} مليار`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)} مليون`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)} ألف`;
  return formatNumber(num);
}
