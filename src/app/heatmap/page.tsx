'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Thermometer,
  Grid3X3,
  List,
  Info,
  X,
  BarChart3,
  Star,
  ArrowUpDown,
  DollarSign,
  Activity,
  PieChart,
  Search,
  RefreshCw,
  ExternalLink,
  Bell,
  LayoutGrid,
  Filter,
  ChevronRight,
  Maximize2,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// نوع بيانات السهم
interface StockData {
  symbol: string;
  name: string;
  change: number;
  price: number;
}

interface SectorData {
  sector: string;
  stocks: StockData[];
}

// دالة توليد التغير العشوائي بناء على الرمز
function seedChange(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
  const d = new Date();
  hash += d.getDate() * 100 + d.getMonth() * 1000;
  const x = Math.sin(hash) * 10000;
  return parseFloat(((x - Math.floor(x)) * 10 - 5).toFixed(2));
}

// دالة توليد حجم تداول عشوائي
function seedVolume(symbol: string, price: number): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = ((hash << 5) - hash) + symbol.charCodeAt(i) * 7;
  const x = Math.sin(hash * 3.14) * 10000;
  const base = (x - Math.floor(x));
  if (price > 500) return Math.floor(base * 5000000 + 500000);
  if (price > 100) return Math.floor(base * 10000000 + 1000000);
  if (price > 10) return Math.floor(base * 20000000 + 2000000);
  return Math.floor(base * 50000000 + 5000000);
}

// دالة توليد P/E عشوائي
function seedPE(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = ((hash << 5) - hash) + symbol.charCodeAt(i) * 13;
  const x = Math.sin(hash * 2.71) * 10000;
  return parseFloat((8 + (x - Math.floor(x)) * 22).toFixed(1));
}

// دالة توليد العائد الربحي
function seedDividend(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = ((hash << 5) - hash) + symbol.charCodeAt(i) * 17;
  const x = Math.sin(hash * 1.41) * 10000;
  return parseFloat(((x - Math.floor(x)) * 6).toFixed(2));
}

// دالة توليد القيمة السوقية
function seedMarketCap(symbol: string, price: number): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = ((hash << 5) - hash) + symbol.charCodeAt(i) * 23;
  const x = Math.sin(hash * 1.73) * 10000;
  const multiplier = (x - Math.floor(x)) * 500 + 50;
  const cap = price * multiplier * 1000000;
  if (cap >= 1e12) return (cap / 1e12).toFixed(2) + ' تريليون';
  if (cap >= 1e9) return (cap / 1e9).toFixed(2) + ' مليار';
  return (cap / 1e6).toFixed(2) + ' مليون';
}

// معلومات الأسواق
const marketInfo: Record<string, { label: string; currency: string }> = {
  tasi: { label: '\u{1F1F8}\u{1F1E6} السوق السعودي (تداول)', currency: 'ر.س' },
  us: { label: '\u{1F1FA}\u{1F1F8} السوق الأمريكي', currency: '$' },
  uae: { label: '\u{1F1E6}\u{1F1EA} سوق الإمارات (DFM/ADX)', currency: 'د.إ' },
  kw: { label: '\u{1F1F0}\u{1F1FC} السوق الكويتي', currency: 'د.ك' },
  qa: { label: '\u{1F1F6}\u{1F1E6} السوق القطري', currency: 'ر.ق' },
  eg: { label: '\u{1F1EA}\u{1F1EC} السوق المصري', currency: 'ج.م' },
  bh: { label: '\u{1F1E7}\u{1F1ED} السوق البحريني', currency: 'د.ب' },
  om: { label: '\u{1F1F4}\u{1F1F2} السوق العماني', currency: 'ر.ع' },
  jo: { label: '\u{1F1EF}\u{1F1F4} السوق الأردني (عمّان)', currency: 'د.أ' },
};

// خريطة رموز TradingView لكل سوق
const MARKET_TV_PREFIX: Record<string, string> = {
  tasi: 'TADAWUL',
  us: '',
  uae: 'DFM',
  kw: 'KSE',
  qa: 'QSE',
  eg: 'EGX',
  bh: 'BHB',
  om: 'MSM',
  jo: 'ASE',
};

// روابط الأسواق الداخلية
const MARKET_INTERNAL_PATH: Record<string, string> = {
  tasi: 'TADAWUL',
  us: 'NASDAQ',
  uae: 'DFM',
  kw: 'KSE',
  qa: 'QSE',
  eg: 'EGX',
  bh: 'BHB',
  om: 'MSM',
  jo: 'ASE',
};

function getTradingViewUrl(symbol: string, market: string): string {
  const prefix = MARKET_TV_PREFIX[market];
  return `https://www.tradingview.com/chart/?symbol=${prefix ? prefix + ':' : ''}${symbol}`;
}

// بيانات الخريطة الحرارية - مع توليد التغير تلقائيا
function makeStock(symbol: string, name: string, price: number): StockData {
  return { symbol, name, change: seedChange(symbol), price };
}

const heatmapData: Record<string, SectorData[]> = {
  tasi: [
    { sector: 'البنوك', stocks: [
      makeStock('1120', 'الراجحي', 108.50),
      makeStock('1180', 'الأهلي', 45.20),
      makeStock('1060', 'الرياض', 32.40),
      makeStock('1050', 'الجزيرة', 18.75),
      makeStock('4260', 'الإنماء', 28.90),
      makeStock('4002', 'الرياض', 25.60),
      makeStock('1030', 'ساب', 38.50),
      makeStock('1010', 'الأهلي', 45.20),
      makeStock('4050', 'الاستثمار', 16.80),
      makeStock('4190', 'الجزيرة', 22.30),
    ]},
    { sector: 'الطاقة', stocks: [
      makeStock('2222', 'أرامكو', 28.75),
      makeStock('2002', 'سابك', 85.30),
      makeStock('2290', 'ينساب', 42.50),
      makeStock('2310', 'الزامل', 28.60),
      makeStock('2001', 'كيمانول', 12.45),
      makeStock('2170', 'اللجين', 55.80),
      makeStock('2060', 'تكوين', 9.85),
      makeStock('2280', 'المتقدمة', 68.20),
      makeStock('2210', 'نماء', 45.30),
      makeStock('2250', 'المجموعة السعودية', 15.70),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('7010', 'STC', 138.25),
      makeStock('7020', 'موبايلي', 52.80),
      makeStock('7030', 'زين', 15.90),
      makeStock('7040', 'عذيب', 8.45),
      makeStock('7050', 'اتحاد اتصالات', 22.10),
      makeStock('6001', 'هرفي', 35.60),
      makeStock('7201', 'جرير', 168.40),
      makeStock('4070', 'تهامة', 42.80),
      makeStock('4071', 'اتزان', 18.90),
      makeStock('7200', 'بترومين', 95.20),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('4150', 'دار الأركان', 22.50),
      makeStock('4320', 'جبل عمر', 85.20),
      makeStock('4300', 'المعذر', 14.60),
      makeStock('4310', 'إعمار', 18.90),
      makeStock('4020', 'العقارية', 32.40),
      makeStock('4250', 'جبل', 25.80),
      makeStock('4100', 'مكة', 115.00),
      makeStock('4230', 'البحر الأحمر', 48.50),
      makeStock('4240', 'فيبكو', 28.30),
      makeStock('4260B', 'بدجت', 35.70),
    ]},
    { sector: 'التجزئة', stocks: [
      makeStock('4001', 'العثيم', 42.30),
      makeStock('4003', 'إكسترا', 28.90),
      makeStock('4004', 'بنده', 55.60),
      makeStock('4005', 'ساكو', 38.20),
      makeStock('4006', 'فتيحي', 12.80),
      makeStock('4007', 'ثوب الأصيل', 45.90),
      makeStock('4160', 'صافولا', 32.40),
      makeStock('4161', 'بن داود', 128.50),
      makeStock('4162', 'المنجم', 72.30),
      makeStock('4163', 'الدواء', 58.40),
    ]},
    { sector: 'المواد الأساسية', stocks: [
      makeStock('2010', 'سابك للصناعات', 35.60),
      makeStock('2020', 'سافكو', 88.40),
      makeStock('2030', 'ينبع', 62.30),
      makeStock('2040', 'بتروكيم', 28.45),
      makeStock('2050', 'صافولا', 42.80),
      makeStock('2070', 'المجموعة', 18.60),
      makeStock('2080', 'غاز', 25.40),
      makeStock('2090', 'جبسكو', 15.80),
      makeStock('2100', 'وفرة', 32.90),
      makeStock('2110', 'سدافكو', 145.20),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('8010', 'التعاونية', 98.50),
      makeStock('8020', 'ملاذ', 22.30),
      makeStock('8030', 'ميدغلف', 18.90),
      makeStock('8040', 'بوبا', 145.60),
      makeStock('8050', 'سلامة', 28.40),
      makeStock('8060', 'ولاء', 35.80),
      makeStock('8070', 'الراجحي تكافل', 85.20),
      makeStock('8080', 'العربية', 42.60),
      makeStock('8100', 'سايكو', 15.30),
      makeStock('8110', 'أسيج', 22.80),
    ]},
    { sector: 'الرعاية الصحية', stocks: [
      makeStock('4002H', 'المواساة', 185.40),
      makeStock('4004H', 'دله', 128.60),
      makeStock('4005H', 'رعاية', 75.30),
      makeStock('4007H', 'الحمادي', 52.80),
      makeStock('4009', 'المتكاملة', 88.90),
      makeStock('4013', 'سليمان الحبيب', 285.00),
      makeStock('4014', 'دواء', 62.40),
      makeStock('4015', 'المتوسط', 38.70),
      makeStock('4016', 'تبوك', 25.30),
      makeStock('4017', 'فقيه', 45.80),
    ]},
    { sector: 'المرافق العامة', stocks: [
      makeStock('5110', 'SEC', 22.80),
      makeStock('5120', 'ماريدايف', 8.45),
      makeStock('5130', 'تطوير', 15.60),
      makeStock('5140', 'كيان', 12.30),
      makeStock('5150', 'بحري', 38.50),
      makeStock('5160', 'ثمار', 28.90),
      makeStock('5170', 'المتطورة', 62.40),
      makeStock('5180', 'بترورابغ', 18.70),
      makeStock('5190', 'شمس', 42.30),
      makeStock('5200', 'ملكية', 25.60),
    ]},
    { sector: 'النقل', stocks: [
      makeStock('4030', 'بحري', 35.80),
      makeStock('4031', 'سابتكو', 22.40),
      makeStock('4040', 'سار', 48.90),
      makeStock('4050N', 'العبداللطيف', 62.30),
      makeStock('4060', 'النقل الجماعي', 15.60),
      makeStock('4080', 'طيبة', 28.40),
      makeStock('4081', 'النايفات', 85.20),
      makeStock('4082', 'المطاحن', 125.60),
      makeStock('4083', 'سلوشنز', 298.00),
      makeStock('4084', 'جاهز', 185.40),
    ]},
  ],
  us: [
    { sector: 'التقنية', stocks: [
      makeStock('AAPL', 'Apple', 228),
      makeStock('MSFT', 'Microsoft', 425),
      makeStock('GOOGL', 'Google', 178),
      makeStock('AMZN', 'Amazon', 195),
      makeStock('NVDA', 'NVIDIA', 890),
      makeStock('META', 'Meta', 510),
      makeStock('TSLA', 'Tesla', 178),
      makeStock('AMD', 'AMD', 165),
      makeStock('INTC', 'Intel', 32),
      makeStock('CRM', 'Salesforce', 298),
    ]},
    { sector: 'المالية', stocks: [
      makeStock('JPM', 'JPMorgan', 198),
      makeStock('BAC', 'BofA', 38),
      makeStock('GS', 'Goldman Sachs', 485),
      makeStock('MS', 'Morgan Stanley', 98),
      makeStock('WFC', 'Wells Fargo', 62),
      makeStock('C', 'Citigroup', 68),
      makeStock('BRK.B', 'Berkshire', 425),
      makeStock('AXP', 'American Express', 235),
      makeStock('V', 'Visa', 298),
      makeStock('MA', 'Mastercard', 485),
    ]},
    { sector: 'الرعاية الصحية', stocks: [
      makeStock('JNJ', 'J&J', 158),
      makeStock('PFE', 'Pfizer', 28),
      makeStock('UNH', 'UnitedHealth', 525),
      makeStock('MRK', 'Merck', 128),
      makeStock('ABBV', 'AbbVie', 178),
      makeStock('TMO', 'Thermo Fisher', 585),
      makeStock('ABT', 'Abbott', 112),
      makeStock('LLY', 'Eli Lilly', 798),
      makeStock('BMY', 'Bristol-Myers', 52),
      makeStock('AMGN', 'Amgen', 298),
    ]},
    { sector: 'الطاقة', stocks: [
      makeStock('XOM', 'Exxon', 108),
      makeStock('CVX', 'Chevron', 158),
      makeStock('COP', 'ConocoPhillips', 118),
      makeStock('SLB', 'Schlumberger', 52),
      makeStock('EOG', 'EOG Resources', 128),
      makeStock('PXD', 'Pioneer', 258),
      makeStock('MPC', 'Marathon', 168),
      makeStock('OXY', 'Occidental', 62),
      makeStock('DVN', 'Devon', 48),
      makeStock('HAL', 'Halliburton', 38),
    ]},
    { sector: 'الاستهلاك', stocks: [
      makeStock('WMT', 'Walmart', 178),
      makeStock('PG', 'P&G', 168),
      makeStock('KO', 'Coca-Cola', 62),
      makeStock('PEP', 'PepsiCo', 178),
      makeStock('COST', 'Costco', 728),
      makeStock('NKE', 'Nike', 98),
      makeStock('MCD', "McDonald's", 298),
      makeStock('SBUX', 'Starbucks', 98),
      makeStock('TGT', 'Target', 148),
      makeStock('HD', 'Home Depot', 358),
    ]},
    { sector: 'الصناعة', stocks: [
      makeStock('BA', 'Boeing', 185),
      makeStock('CAT', 'Caterpillar', 358),
      makeStock('GE', 'GE', 168),
      makeStock('HON', 'Honeywell', 208),
      makeStock('UPS', 'UPS', 148),
      makeStock('RTX', 'Raytheon', 108),
      makeStock('DE', 'Deere', 398),
      makeStock('LMT', 'Lockheed', 458),
      makeStock('MMM', '3M', 108),
      makeStock('FDX', 'FedEx', 268),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('DIS', 'Disney', 108),
      makeStock('NFLX', 'Netflix', 628),
      makeStock('CMCSA', 'Comcast', 42),
      makeStock('T', 'AT&T', 18),
      makeStock('VZ', 'Verizon', 42),
      makeStock('TMUS', 'T-Mobile', 178),
      makeStock('CHTR', 'Charter', 298),
      makeStock('SPOT', 'Spotify', 328),
      makeStock('ROKU', 'Roku', 68),
      makeStock('PARA', 'Paramount', 12),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('AMT', 'American Tower', 208),
      makeStock('PLD', 'Prologis', 128),
      makeStock('CCI', 'Crown Castle', 108),
      makeStock('EQIX', 'Equinix', 798),
      makeStock('SPG', 'Simon Property', 158),
      makeStock('O', 'Realty Income', 58),
      makeStock('PSA', 'Public Storage', 298),
      makeStock('DLR', 'Digital Realty', 148),
      makeStock('VICI', 'VICI', 32),
      makeStock('WELL', 'Welltower', 98),
    ]},
    { sector: 'المرافق العامة', stocks: [
      makeStock('NEE', 'NextEra', 78),
      makeStock('DUK', 'Duke', 108),
      makeStock('SO', 'Southern Co', 78),
      makeStock('D', 'Dominion', 52),
      makeStock('AEP', 'AEP', 98),
      makeStock('EXC', 'Exelon', 42),
      makeStock('XEL', 'Xcel', 68),
      makeStock('WEC', 'WEC Energy', 98),
      makeStock('ED', 'ConEd', 98),
      makeStock('PEG', 'PSEG', 68),
    ]},
    { sector: 'المواد الأساسية', stocks: [
      makeStock('LIN', 'Linde', 458),
      makeStock('APD', 'Air Products', 298),
      makeStock('SHW', 'Sherwin', 348),
      makeStock('ECL', 'Ecolab', 228),
      makeStock('NEM', 'Newmont', 42),
      makeStock('FCX', 'Freeport', 48),
      makeStock('NUE', 'Nucor', 168),
      makeStock('DOW', 'Dow', 58),
      makeStock('DD', 'DuPont', 78),
      makeStock('PPG', 'PPG', 138),
    ]},
  ],
  uae: [
    { sector: 'البنوك', stocks: [
      makeStock('ENBD', 'الإمارات دبي الوطني', 18.20),
      makeStock('FAB', 'أبوظبي الأول', 14.85),
      makeStock('DIB', 'دبي الإسلامي', 6.30),
      makeStock('ADCB', 'أبوظبي التجاري', 9.45),
      makeStock('MASQ', 'مصرف عجمان', 2.15),
      makeStock('CBD', 'دبي التجاري', 7.80),
      makeStock('NBF', 'الفجيرة الوطني', 5.20),
      makeStock('RAK', 'رأس الخيمة الوطني', 4.85),
      makeStock('SIB', 'الشارقة الإسلامي', 2.45),
      makeStock('UAB', 'البنك العربي المتحد', 3.10),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('EMAAR', 'إعمار العقارية', 9.75),
      makeStock('ALDAR', 'الدار العقارية', 7.20),
      makeStock('DAMAC', 'داماك العقارية', 4.85),
      makeStock('DEYAR', 'ديار للتطوير', 0.85),
      makeStock('ESHRAQ', 'إشراق للاستثمار', 0.52),
      makeStock('UPP', 'يونيون العقارية', 0.68),
      makeStock('MAZAYA', 'مزايا القابضة', 1.25),
      makeStock('REEM', 'ريم للاستثمارات', 3.40),
      makeStock('ABYAAR', 'أبيار', 0.35),
      makeStock('RAKPROP', 'رأس الخيمة العقارية', 0.92),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('ETISALAT', 'اتصالات (e&)', 24.50),
      makeStock('DU', 'دو (EITC)', 6.85),
      makeStock('YAHSAT', 'الياه سات', 4.20),
      makeStock('KHAZNA', 'خزنة داتا', 8.50),
      makeStock('BAYANAT', 'بيانات', 1.85),
      makeStock('PRESIGHT', 'بريسايت', 5.40),
      makeStock('EDGEGROUP', 'مجموعة إيدج', 12.30),
      makeStock('G42', 'جي 42', 15.80),
      makeStock('AINDATA', 'عين للبيانات', 3.20),
      makeStock('DEWA', 'ديوا', 2.85),
    ]},
    { sector: 'الطاقة', stocks: [
      makeStock('ADNOC', 'أدنوك للتوزيع', 4.25),
      makeStock('ADNOCD', 'أدنوك للحفر', 5.80),
      makeStock('TAQA', 'طاقة', 3.45),
      makeStock('MASDAR', 'مصدر', 2.90),
      makeStock('ADNOCL', 'أدنوك للخدمات', 4.60),
      makeStock('DANA', 'دانة غاز', 1.15),
      makeStock('FERTIGLOBE', 'فيرتيغلوب', 3.25),
      makeStock('BOROUGE', 'بروج', 2.65),
      makeStock('ADNOCGAS', 'أدنوك للغاز', 3.85),
      makeStock('ENOC', 'إينوك', 6.20),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('SALAMA', 'سلامة للتأمين', 0.85),
      makeStock('ORIENT', 'المشرق للتأمين', 2.45),
      makeStock('DHAFRA', 'ظفرة للتأمين', 5.80),
      makeStock('WATANIA', 'الوطنية للتأمين', 4.20),
      makeStock('ASCANA', 'أسكانا للتأمين', 1.35),
      makeStock('HAYAH', 'حياة للتأمين', 0.72),
      makeStock('METHAQ', 'ميثاق للتأمين', 1.80),
      makeStock('AMAN', 'أمان للتأمين', 3.60),
      makeStock('AIR', 'العين للتأمين', 22.50),
      makeStock('AXA', 'أكسا الخليج', 1.25),
    ]},
    { sector: 'الصناعة', stocks: [
      makeStock('ARKAN', 'أركان', 2.15),
      makeStock('AGTHIA', 'أغذية', 7.80),
      makeStock('JULPHAR', 'جلفار', 1.45),
      makeStock('RAK_CER', 'سيراميك رأس الخيمة', 3.80),
      makeStock('ABAR', 'أبار للطاقة', 0.95),
      makeStock('GULF_PHARMA', 'الخليج للصناعات الدوائية', 2.30),
      makeStock('NATL_CEMENT', 'الوطنية للأسمنت', 1.75),
      makeStock('FUJAIRAH', 'أسمنت الفجيرة', 2.40),
      makeStock('SHARJAH', 'أسمنت الشارقة', 1.60),
      makeStock('UMAQ', 'أم القيوين للصناعات', 0.85),
    ]},
    { sector: 'السياحة', stocks: [
      makeStock('AIR_ARABIA', 'العربية للطيران', 3.40),
      makeStock('DNATA', 'دناتا', 8.50),
      makeStock('SALIK', 'سالك', 4.20),
      makeStock('PARKIN', 'باركن', 5.60),
      makeStock('MALL_EMIRATES', 'مجموعة ماجد الفطيم', 12.80),
      makeStock('ROTANA', 'روتانا', 6.40),
      makeStock('JUMEIRAH', 'جميرا', 9.20),
      makeStock('MERAAS', 'مراس', 7.50),
      makeStock('DUBAIHOLD', 'دبي القابضة', 5.80),
      makeStock('EMARGROUP', 'إعمار الترفيه', 2.90),
    ]},
    { sector: 'النقل', stocks: [
      makeStock('ARAMEX', 'أرامكس', 4.85),
      makeStock('AGILITY', 'أجيليتي', 3.20),
      makeStock('DPWORLD', 'دي بي وورلد', 18.50),
      makeStock('GULF_NAV', 'الخليج للملاحة', 6.80),
      makeStock('TRISTAR', 'تراي ستار', 2.40),
      makeStock('ADPORTS', 'موانئ أبوظبي', 5.60),
      makeStock('NWTN', 'نيوتن', 1.85),
      makeStock('ALBARIK', 'الباريك', 0.95),
      makeStock('GULFMAR', 'الخليج البحرية', 3.40),
      makeStock('ADSHIP', 'أبوظبي للبناء البحري', 2.15),
    ]},
    { sector: 'التجزئة', stocks: [
      makeStock('LANDMARK', 'لاندمارك', 5.40),
      makeStock('LULU', 'لولو', 8.20),
      makeStock('SPINNEYS', 'سبينيز', 3.85),
      makeStock('CHOITHRAMS', 'شويترامس', 4.60),
      makeStock('SHARAF', 'شرف دي جي', 2.90),
      makeStock('EROS', 'إيروس', 1.45),
      makeStock('BRANDS', 'براندز المتحدة', 3.20),
      makeStock('MAFGROUP', 'ماف القابضة', 6.80),
      makeStock('ALSHAYA', 'الشايع', 5.10),
      makeStock('TABLEZ', 'تيبلز', 2.60),
    ]},
    { sector: 'الخدمات المالية', stocks: [
      makeStock('SHUAA', 'شعاع كابيتال', 0.85),
      makeStock('WAHA', 'وها كابيتال', 1.65),
      makeStock('APEX', 'أبيكس', 2.30),
      makeStock('AMLAK', 'أملاك للتمويل', 1.20),
      makeStock('TAMWEEL', 'تمويل', 0.95),
      makeStock('DUBAIINVEST', 'دبي للاستثمار', 2.85),
      makeStock('NOOR', 'نور كابيتال', 1.40),
      makeStock('GFH', 'مجموعة GFH', 1.85),
      makeStock('CHIMERA', 'كيميرا كابيتال', 3.20),
      makeStock('INTL_HOLDING', 'القابضة الدولية', 385.00),
    ]},
  ],
  kw: [
    { sector: 'البنوك', stocks: [
      makeStock('NBK', 'بنك الكويت الوطني', 1.05),
      makeStock('KFH', 'بيت التمويل الكويتي', 0.92),
      makeStock('BURG', 'بنك برقان', 0.245),
      makeStock('GBK', 'بنك الخليج', 0.310),
      makeStock('ABK', 'البنك الأهلي الكويتي', 0.285),
      makeStock('CBK', 'البنك التجاري', 0.520),
      makeStock('KIB', 'بنك الكويت الدولي', 0.198),
      makeStock('BKME', 'بنك الشرق الأوسط', 0.145),
      makeStock('WARBA', 'بنك وربة', 0.275),
      makeStock('BOUBYAN', 'بنك بوبيان', 0.680),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('ZAIN_KW', 'زين الكويت', 0.580),
      makeStock('OOREDOO_KW', 'أوريدو الكويت', 0.820),
      makeStock('STC_KW', 'STC الكويت', 0.740),
      makeStock('VIVA_KW', 'فيفا الكويت', 0.650),
      makeStock('KNET', 'كي نت', 1.20),
      makeStock('QUALITYNET', 'كواليتي نت', 0.890),
      makeStock('FAST_KW', 'فاست تيليكوم', 0.420),
      makeStock('MENA_KW', 'مينا تيليكوم', 0.350),
      makeStock('ZAJIL', 'زاجل', 0.280),
      makeStock('ITS_KW', 'الحلول المتكاملة', 0.195),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('MABANEE', 'مباني', 0.850),
      makeStock('TAMDEEN', 'تمدين', 0.420),
      makeStock('SALHIA', 'الصالحية', 0.380),
      makeStock('NREC', 'العقارية الوطنية', 0.125),
      makeStock('URC_KW', 'المتحدة العقارية', 0.098),
      makeStock('ALIMTIAZ', 'الامتياز', 0.145),
      makeStock('ARZAN', 'أرزان', 0.082),
      makeStock('KPC_RE', 'الكويت العقارية', 0.195),
      makeStock('ALKOUT', 'الكوت', 0.320),
      makeStock('MUNSHA', 'المنشآت العقارية', 0.115),
    ]},
    { sector: 'الطاقة', stocks: [
      makeStock('KPPC', 'البترولية الكويتية', 0.420),
      makeStock('IPC_KW', 'البترول المستقلة', 0.285),
      makeStock('SOOR', 'سور للوقود', 0.195),
      makeStock('NAPESCO', 'نابيسكو', 1.10),
      makeStock('KGOC', 'نفط الخليج', 0.380),
      makeStock('KAFCO', 'الكيماويات الكويتية', 0.240),
      makeStock('QURAIN', 'القرين القابضة', 0.145),
      makeStock('EQUATE', 'إيكويت', 0.520),
      makeStock('PIC_KW', 'الصناعات البترولية', 0.680),
      makeStock('DOW_KW', 'داو الكويت', 0.310),
    ]},
    { sector: 'الأغذية', stocks: [
      makeStock('AMERICANA', 'أمريكانا', 0.350),
      makeStock('AQAR', 'أمريكانا للأغذية', 0.285),
      makeStock('KFOOD', 'الكويتية للأغذية', 0.195),
      makeStock('SULTAN', 'سلطان سنتر', 0.145),
      makeStock('NFOOD', 'الغذائية الوطنية', 0.120),
      makeStock('DANAH', 'دانة الصفاة', 0.098),
      makeStock('GFOOD', 'الخليج للأغذية', 0.175),
      makeStock('KFC_KW', 'مطاعم كويتية', 0.420),
      makeStock('MZAYA', 'مزايا للأغذية', 0.085),
      makeStock('ALDANA', 'الدانة', 0.210),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('GIG', 'الخليج للتأمين', 0.850),
      makeStock('KINSURANCE', 'الكويتية للتأمين', 0.320),
      makeStock('WETHAQ', 'وثاق للتأمين', 0.185),
      makeStock('AHLEIA', 'الأهلية للتأمين', 0.275),
      makeStock('FIRSTTAKAFUL', 'التكافل الأولى', 0.145),
      makeStock('GULF_INS', 'الخليج للتأمين', 0.420),
      makeStock('WARBA_INS', 'وربة للتأمين', 0.195),
      makeStock('KSE_INS', 'الكويت والشرق الأوسط', 0.098),
      makeStock('TAKAFUL_KW', 'التكافل الكويتي', 0.135),
      makeStock('BAHRAIN_INS', 'البحرين الكويتي', 0.210),
    ]},
    { sector: 'الخدمات المالية', stocks: [
      makeStock('KAMCO', 'كامكو إنفست', 0.120),
      makeStock('MARKAZ', 'المركز المالي', 0.185),
      makeStock('GIC_KW', 'الاستثمارات الخليجية', 0.095),
      makeStock('AAYAN', 'أعيان', 0.145),
      makeStock('KFG', 'كيو إف جي', 0.280),
      makeStock('KIPCO', 'كيبكو', 0.220),
      makeStock('NIGS', 'الوطنية للاستثمار', 0.165),
      makeStock('ITHMAAR', 'إثمار القابضة', 0.085),
      makeStock('COAST', 'كوست إنفست', 0.135),
      makeStock('ARGAN', 'أرجان', 0.310),
    ]},
    { sector: 'الصناعة', stocks: [
      makeStock('HEISCO', 'هيسكو', 1.45),
      makeStock('KCPC', 'الأسمنت الكويتية', 0.380),
      makeStock('ACICO', 'أسيكو', 0.245),
      makeStock('BPCC', 'البورسلين الكويتي', 0.165),
      makeStock('KCCC', 'الكابلات الكويتية', 0.520),
      makeStock('KPIPE', 'الأنابيب الكويتية', 0.285),
      makeStock('METAL', 'المعادن الكويتية', 0.195),
      makeStock('SCEMENT', 'أسمنت الشمال', 0.145),
      makeStock('UGLASS', 'الزجاج المتحدة', 0.120),
      makeStock('KPAINT', 'الدهانات الكويتية', 0.310),
    ]},
    { sector: 'النقل', stocks: [
      makeStock('AGILITY_KW', 'أجيليتي', 0.920),
      makeStock('ALAFCO', 'ألافكو', 0.280),
      makeStock('FLEET', 'فليت', 0.185),
      makeStock('KGL', 'كي جي إل', 0.095),
      makeStock('NATL_AVN', 'الطيران الوطنية', 0.165),
      makeStock('JAZ_SHIP', 'الجزيرة للنقل', 0.120),
      makeStock('TRISTAR_KW', 'تراي ستار الكويت', 0.145),
      makeStock('GOLF_SHIP', 'الخليج للشحن', 0.085),
      makeStock('PORT_KW', 'موانئ الكويت', 0.350),
      makeStock('LOG_KW', 'الكويت للخدمات اللوجستية', 0.210),
    ]},
    { sector: 'التجزئة', stocks: [
      makeStock('MEZZAN', 'مزان القابضة', 0.720),
      makeStock('KOUT', 'كاوت فود', 0.580),
      makeStock('XCITE', 'إكس سايت', 0.420),
      makeStock('TSC_KW', 'الشركة التجارية', 0.195),
      makeStock('ALBABTAIN', 'البابطين', 0.165),
      makeStock('YIACO', 'ياكو', 0.285),
      makeStock('HSA', 'حسن عبدالله', 0.135),
      makeStock('SHUAIBA', 'الشعيبة', 0.098),
      makeStock('RETAIL_KW', 'التجزئة الكويتية', 0.245),
      makeStock('SAFWAN', 'صفوان', 0.175),
    ]},
  ],
  qa: [
    { sector: 'البنوك', stocks: [
      makeStock('QNB', 'بنك قطر الوطني', 14.50),
      makeStock('CBQK', 'البنك التجاري القطري', 5.85),
      makeStock('MARK', 'مصرف المريخ', 4.20),
      makeStock('QIIB', 'مصرف قطر الإسلامي', 8.75),
      makeStock('DHBK', 'بنك الدوحة', 2.45),
      makeStock('ABQK', 'أحمد بن علي', 3.80),
      makeStock('QFBQ', 'بنك قطر الأول', 1.85),
      makeStock('KCBK', 'الخليجي التجاري', 2.10),
      makeStock('QATR', 'مصرف قطر', 3.40),
      makeStock('IBQK', 'البنك الدولي القطري', 9.20),
    ]},
    { sector: 'الطاقة', stocks: [
      makeStock('IQCD', 'صناعات قطر', 12.40),
      makeStock('QGTS', 'ناقلات قطر', 4.85),
      makeStock('QAMC', 'الأسمنت القطرية', 3.20),
      makeStock('GISS', 'الخليج الدولية', 1.95),
      makeStock('MPHC', 'مسيعيد للبتروكيماويات', 2.15),
      makeStock('QGMD', 'قطر لصناعة الألمنيوم', 1.45),
      makeStock('QLMI', 'صناعات كهربائية', 3.80),
      makeStock('QEWS', 'الكهرباء والماء', 15.80),
      makeStock('QFLS', 'الوقود القطرية', 18.50),
      makeStock('RDES', 'راس ديكان', 2.60),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('ORDS', 'أوريدو قطر', 7.25),
      makeStock('VFQS', 'فودافون قطر', 1.65),
      makeStock('QTEL', 'قطر للاتصالات', 8.40),
      makeStock('QNCD', 'الملاحة القطرية', 5.20),
      makeStock('QISI', 'أنظمة المعلومات', 2.85),
      makeStock('MEZA', 'ميزة للتقنية', 1.40),
      makeStock('BRES', 'بروة للتقنية', 3.60),
      makeStock('TECH_QA', 'قطر للتقنية', 4.80),
      makeStock('DIGI_QA', 'الرقمية القطرية', 2.30),
      makeStock('NET_QA', 'شبكات قطر', 1.85),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('BRES_RE', 'بروة العقارية', 3.40),
      makeStock('UDCD', 'يونايتد ديفلوبمنت', 1.55),
      makeStock('ERES', 'إزدان القابضة', 1.20),
      makeStock('MERS', 'المزايا القطرية', 0.85),
      makeStock('ZHCD', 'زاد القابضة', 12.50),
      makeStock('QNNS', 'الملاحة القطرية', 6.80),
      makeStock('LUSAIL', 'لوسيل العقارية', 2.40),
      makeStock('PEARL', 'اللؤلؤة', 4.20),
      makeStock('QREAL', 'قطر العقارية', 3.15),
      makeStock('WEST_QA', 'الغرب القطرية', 1.90),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('QATI', 'التأمين القطري', 2.85),
      makeStock('QGRI', 'الدوحة للتأمين', 1.45),
      makeStock('ARIG', 'المجموعة العربية', 5.20),
      makeStock('QLII', 'التأمين الإسلامي', 7.80),
      makeStock('BEEMA', 'بيمة للتأمين', 1.20),
      makeStock('DAMAN_QA', 'ضمان للتأمين', 3.40),
      makeStock('GULF_QA', 'الخليج القطري', 2.60),
      makeStock('QLIFE', 'قطر لايف', 1.85),
      makeStock('SAQR', 'صقر للتأمين', 0.95),
      makeStock('NQINS', 'التأمين الوطني', 4.50),
    ]},
    { sector: 'الصناعة', stocks: [
      makeStock('QIMD', 'الصناعية القطرية', 3.60),
      makeStock('QNCD_IND', 'الأسمنت الوطنية', 4.20),
      makeStock('QCON', 'المقاولات القطرية', 2.85),
      makeStock('QAMC_IND', 'الألمنيوم القطري', 1.65),
      makeStock('STEEL_QA', 'الحديد القطرية', 2.30),
      makeStock('GLASS_QA', 'الزجاج القطرية', 1.40),
      makeStock('CERAMIC_QA', 'السيراميك القطري', 3.10),
      makeStock('PAINT_QA', 'الدهانات القطرية', 2.50),
      makeStock('PAPER_QA', 'الورق القطرية', 1.80),
      makeStock('PACK_QA', 'التغليف القطرية', 2.90),
    ]},
    { sector: 'النقل', stocks: [
      makeStock('QATR_AIR', 'الخطوط القطرية', 15.20),
      makeStock('QNNS_TR', 'ناقلات قطر', 4.85),
      makeStock('MWANI', 'موانئ قطر', 8.40),
      makeStock('GULF_SHIP', 'الخليج للشحن', 3.20),
      makeStock('QLOG', 'قطر للخدمات اللوجستية', 5.60),
      makeStock('MEENA', 'ميناء الدوحة', 2.40),
      makeStock('QCARGO', 'قطر كارغو', 6.80),
      makeStock('DOHA_TR', 'الدوحة للنقل', 1.95),
      makeStock('METRO_QA', 'مترو الدوحة', 4.30),
      makeStock('TAXI_QA', 'كروا الدوحة', 1.20),
    ]},
    { sector: 'الخدمات المالية', stocks: [
      makeStock('QNBFS', 'QNB للخدمات المالية', 6.40),
      makeStock('QIC', 'قطر للاستثمار', 3.85),
      makeStock('DLALA', 'دلالة', 1.65),
      makeStock('INVESTMENT_QA', 'الاستثمار القطري', 2.80),
      makeStock('WEALTH_QA', 'الثروة القطرية', 1.40),
      makeStock('ASSET_QA', 'إدارة الأصول', 3.20),
      makeStock('CAPITAL_QA', 'رأس المال القطري', 5.60),
      makeStock('VENTURE_QA', 'المغامرة القطرية', 2.10),
      makeStock('FUND_QA', 'الصناديق القطرية', 4.50),
      makeStock('BROKER_QA', 'الوساطة القطرية', 1.85),
    ]},
    { sector: 'الأغذية', stocks: [
      makeStock('BALADNA', 'بلدنا', 1.55),
      makeStock('WIDAM', 'ودام', 4.20),
      makeStock('AGRI_QA', 'الزراعة القطرية', 2.80),
      makeStock('DAIRY_QA', 'الألبان القطرية', 3.40),
      makeStock('MEAT_QA', 'اللحوم القطرية', 1.90),
      makeStock('FISH_QA', 'الأسماك القطرية', 2.60),
      makeStock('BAKERY_QA', 'المخابز القطرية', 1.20),
      makeStock('JUICE_QA', 'العصائر القطرية', 3.80),
      makeStock('WATER_QA', 'المياه القطرية', 5.40),
      makeStock('GRAIN_QA', 'الحبوب القطرية', 2.15),
    ]},
    { sector: 'التجزئة', stocks: [
      makeStock('MALL_QA', 'المولات القطرية', 8.50),
      makeStock('HYPER_QA', 'هايبر ماركت قطر', 4.20),
      makeStock('FASHION_QA', 'أزياء قطر', 2.85),
      makeStock('ELECTRO_QA', 'الإلكترونيات القطرية', 3.60),
      makeStock('HOME_QA', 'المنزل القطري', 1.95),
      makeStock('AUTO_QA', 'السيارات القطرية', 6.40),
      makeStock('LUXURY_QA', 'الفاخرة القطرية', 12.80),
      makeStock('SPORT_QA', 'الرياضة القطرية', 2.30),
      makeStock('PHARM_QA', 'الصيدليات القطرية', 5.10),
      makeStock('BOOK_QA', 'المكتبات القطرية', 1.45),
    ]},
  ],
  eg: [
    { sector: 'البنوك', stocks: [
      makeStock('COMI', 'التجاري الدولي (CIB)', 78.50),
      makeStock('NBE', 'البنك الأهلي المصري', 32.10),
      makeStock('QNBA', 'قطر الوطني الأهلي', 28.40),
      makeStock('ADIB_EG', 'مصرف أبوظبي الإسلامي', 42.80),
      makeStock('CRED', 'كريدي أجريكول', 18.90),
      makeStock('FAISAL', 'بنك فيصل الإسلامي', 55.60),
      makeStock('HDBK', 'بنك التعمير والإسكان', 15.20),
      makeStock('CIEB', 'البنك المصري الخليجي', 22.40),
      makeStock('SAIB', 'بنك الشركة المصرفية', 12.80),
      makeStock('AUDI', 'بنك عودة', 8.90),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('TMGH', 'طلعت مصطفى', 55.20),
      makeStock('OCDI', 'أوراسكوم للتنمية', 12.80),
      makeStock('PHDC', 'بالم هيلز', 8.45),
      makeStock('MNHD', 'مدينة نصر للإسكان', 5.60),
      makeStock('EMFD', 'إعمار مصر', 7.20),
      makeStock('SODIC', 'سوديك', 22.80),
      makeStock('AREH', 'أوراسكوم للفنادق', 15.40),
      makeStock('HELI', 'هليوبوليس', 9.80),
      makeStock('AMER', 'عامر القابضة', 1.85),
      makeStock('PORT_EG', 'بورتو القابضة', 3.20),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('VODE', 'فودافون مصر', 18.40),
      makeStock('ETEL', 'المصرية للاتصالات', 28.50),
      makeStock('OREG', 'أورانج مصر', 15.80),
      makeStock('LINK', 'لينك للتنمية', 8.90),
      makeStock('OTMT', 'أوراسكوم للتكنولوجيا', 5.40),
      makeStock('RAYA', 'راية القابضة', 3.85),
      makeStock('IDSC', 'مركز المعلومات', 2.60),
      makeStock('FAWRY', 'فوري', 6.20),
      makeStock('SWDY', 'سويدي', 12.40),
      makeStock('XCEED', 'إكسيد', 4.80),
    ]},
    { sector: 'الطاقة', stocks: [
      makeStock('AMOC', 'العامرية للبترول', 8.50),
      makeStock('MOIL', 'مصر للبترول', 5.20),
      makeStock('ASEC', 'أسيك للتعدين', 15.60),
      makeStock('EGCH', 'مصر للكيماويات', 7.80),
      makeStock('SIDI', 'سيدبك', 22.40),
      makeStock('MOPCO', 'موبكو', 185.00),
      makeStock('ABUK', 'أبوقير للأسمدة', 95.80),
      makeStock('NAGR', 'النصر للملابس', 12.30),
      makeStock('ESRS', 'مصر لصناعة الكيماويات', 18.40),
      makeStock('SPIN', 'النساجون الشرقيون', 5.60),
    ]},
    { sector: 'الأغذية', stocks: [
      makeStock('JUFO', 'جهينة', 28.50),
      makeStock('EAST', 'ايسترن كومباني', 32.40),
      makeStock('OBIC', 'العربية للأغذية', 8.90),
      makeStock('DSCW', 'الدلتا للسكر', 42.80),
      makeStock('CANA', 'قنا للسكر', 15.60),
      makeStock('EFID', 'إيديتا', 22.30),
      makeStock('MNHP', 'النيل للحاصلات', 65.40),
      makeStock('DOMTY', 'دومتي', 12.80),
      makeStock('ISMA', 'العامرية للسكر', 8.40),
      makeStock('POUL', 'القاهرة للدواجن', 5.20),
    ]},
    { sector: 'المواد الأساسية', stocks: [
      makeStock('IRON', 'حديد عز', 42.50),
      makeStock('EGSB', 'السويدي للكابلات', 15.80),
      makeStock('ACEM', 'العربي للأسمنت', 8.60),
      makeStock('SUCE', 'السويس للأسمنت', 22.40),
      makeStock('ECEM', 'مصر للأسمنت', 12.50),
      makeStock('SINA', 'سيناء للأسمنت', 18.80),
      makeStock('PRCL', 'البورسلين', 7.40),
      makeStock('ELEC_EG', 'الكابلات الكهربائية', 5.60),
      makeStock('STEE', 'المصرية للحديد', 28.90),
      makeStock('ALUM', 'مصر للألمنيوم', 55.20),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('MISR_INS', 'مصر للتأمين', 18.50),
      makeStock('DELTA_INS', 'الدلتا للتأمين', 28.40),
      makeStock('ISMA_INS', 'الإسماعيلية للتأمين', 5.80),
      makeStock('ARAB_INS', 'العربي للتأمين', 12.60),
      makeStock('GIG_EG', 'الخليج مصر للتأمين', 8.20),
      makeStock('WAFA', 'وفاء للتأمين', 15.40),
      makeStock('SARW', 'سارية للتأمين', 3.80),
      makeStock('MOHANDS', 'المهندسين للتأمين', 22.80),
      makeStock('ORIENT_EG', 'المشرق للتأمين', 6.40),
      makeStock('ALLIANZ_EG', 'أليانز مصر', 45.60),
    ]},
    { sector: 'الصناعة', stocks: [
      makeStock('ORCI', 'أوراسكوم للإنشاء', 85.40),
      makeStock('EGAS', 'الغاز الطبيعي', 32.80),
      makeStock('ELKA', 'الكيماويات المصرية', 15.60),
      makeStock('NMET', 'النصر للتعدين', 8.40),
      makeStock('EGSA', 'المصرية للصناعات', 5.20),
      makeStock('PACK_EG', 'التغليف المصرية', 22.80),
      makeStock('AUTO_EG', 'غبور أوتو', 42.60),
      makeStock('ELMS', 'مصر للصناعات', 12.40),
      makeStock('MOSR', 'مصر للطيران', 7.80),
      makeStock('SHAR', 'الشرقية للدخان', 18.40),
    ]},
    { sector: 'السياحة', stocks: [
      makeStock('MFPC', 'القلعة القابضة', 3.80),
      makeStock('ORHD', 'الأوائل القابضة', 5.20),
      makeStock('MTQN', 'متقن', 8.40),
      makeStock('EGTS', 'مصر للسياحة', 12.80),
      makeStock('MASR', 'مصر الجديدة', 22.40),
      makeStock('TRVL', 'ترافكو', 6.80),
      makeStock('RIAD', 'رمادا', 15.60),
      makeStock('PICC', 'بيكو', 3.20),
      makeStock('HOTL', 'الفنادق المصرية', 42.80),
      makeStock('MARI', 'مارينا', 8.60),
    ]},
    { sector: 'الرعاية الصحية', stocks: [
      makeStock('CLHO', 'كليوباترا', 8.20),
      makeStock('IBMD', 'ابن سينا فارما', 12.60),
      makeStock('EPHA', 'الفرعونية للأدوية', 22.40),
      makeStock('AMRH', 'المصرية للأدوية', 5.80),
      makeStock('PHAR', 'فاركو', 15.40),
      makeStock('GLAX', 'جلاكسو مصر', 42.80),
      makeStock('MEMR', 'ممفيس للأدوية', 28.60),
      makeStock('NILE', 'النيل للأدوية', 8.40),
      makeStock('HPHO', 'مستشفى الحياة', 18.20),
      makeStock('MEDCO', 'ميدكو فارما', 6.80),
    ]},
  ],
  bh: [
    { sector: 'البنوك', stocks: [
      makeStock('AUB', 'الأهلي المتحد', 0.850),
      makeStock('NBB', 'بنك البحرين الوطني', 0.720),
      makeStock('BBK', 'بنك البحرين والكويت', 0.580),
      makeStock('BISB', 'بنك البحرين الإسلامي', 0.125),
      makeStock('KHB', 'بنك الخليج المتحد', 0.245),
      makeStock('SALAM', 'بنك السلام', 0.098),
      makeStock('ITHMAAR_BH', 'إثمار القابضة', 0.065),
      makeStock('ABC_BH', 'بنك ABC', 0.380),
      makeStock('BARKA', 'بنك البركة الإسلامي', 0.420),
      makeStock('CITI_BH', 'سيتي بنك البحرين', 1.20),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('BATEL', 'بتلكو', 0.450),
      makeStock('VIVA_BH', 'فيفا البحرين', 0.320),
      makeStock('STC_BH', 'STC البحرين', 0.285),
      makeStock('ZAIN_BH', 'زين البحرين', 0.195),
      makeStock('KALAAM', 'كلام تيليكوم', 0.145),
      makeStock('BNET', 'بنت', 0.380),
      makeStock('DIGI_BH', 'الرقمية البحرينية', 0.120),
      makeStock('CLOUD_BH', 'السحابة البحرينية', 0.210),
      makeStock('TECH_BH', 'التقنية البحرينية', 0.165),
      makeStock('DATA_BH', 'البيانات البحرينية', 0.285),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('SEEF', 'مجموعة السيف', 0.420),
      makeStock('PROM_BH', 'البحرين للعقارات', 0.185),
      makeStock('INOVEST', 'إنوفست', 0.125),
      makeStock('ESTATE_BH', 'العقارية البحرينية', 0.295),
      makeStock('RIFFA', 'الرفاع للعقارات', 0.165),
      makeStock('AMWAJ', 'أمواج', 0.380),
      makeStock('DURRAT', 'درة البحرين', 0.245),
      makeStock('DILMUNIA', 'دلمونيا', 0.310),
      makeStock('MARINA_BH', 'مارينا البحرين', 0.195),
      makeStock('HARBOUR', 'الميناء المالي', 0.520),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('BKIC', 'البحرين الكويتية للتأمين', 0.350),
      makeStock('TAKAFUL_BH', 'التكافل البحريني', 0.195),
      makeStock('SOLIDARITY', 'سوليدرتي', 0.145),
      makeStock('GULFINS_BH', 'الخليج للتأمين', 0.285),
      makeStock('MEDGULF', 'ميدغلف البحرين', 0.120),
      makeStock('NATL_BH', 'الوطنية للتأمين', 0.380),
      makeStock('ARAB_INS_BH', 'العربي للتأمين', 0.210),
      makeStock('AXA_BH', 'أكسا البحرين', 0.165),
      makeStock('BAHRAINI', 'البحريني للتأمين', 0.098),
      makeStock('LIFE_BH', 'الحياة للتأمين', 0.245),
    ]},
    { sector: 'الصناعة', stocks: [
      makeStock('ALBA', 'ألبا', 1.20),
      makeStock('BAPCO', 'بابكو', 0.850),
      makeStock('NASS', 'ناس للصناعة', 0.420),
      makeStock('ALUM_BH', 'الألمنيوم البحرينية', 0.350),
      makeStock('STEEL_BH', 'الحديد البحرينية', 0.285),
      makeStock('GPIC', 'جيبك', 0.520),
      makeStock('CEMENT_BH', 'أسمنت البحرين', 0.195),
      makeStock('PAINT_BH', 'الدهانات البحرينية', 0.145),
      makeStock('FOOD_IND_BH', 'الغذائية البحرينية', 0.310),
      makeStock('PACK_BH', 'التغليف البحرينية', 0.120),
    ]},
    { sector: 'الخدمات المالية', stocks: [
      makeStock('GFH_BH', 'GFH المالية', 0.285),
      makeStock('OSOOL', 'أصول المالية', 0.165),
      makeStock('VENTURE_BH', 'فنتشر البحرين', 0.095),
      makeStock('INVEST_BH', 'الاستثمار البحريني', 0.380),
      makeStock('CAPITAL_BH', 'رأس المال البحريني', 0.245),
      makeStock('WEALTH_BH', 'الثروة البحرينية', 0.120),
      makeStock('ASSET_BH', 'الأصول البحرينية', 0.185),
      makeStock('BROKER_BH', 'الوساطة البحرينية', 0.145),
      makeStock('FUND_BH', 'الصناديق البحرينية', 0.210),
      makeStock('FINANCE_BH', 'المالية البحرينية', 0.320),
    ]},
    { sector: 'الأغذية', stocks: [
      makeStock('TRAFCO', 'ترافكو جروب', 0.520),
      makeStock('DELMON', 'دلمون للأغذية', 0.285),
      makeStock('BMMI', 'BMMI', 0.780),
      makeStock('DAIRY_BH', 'الألبان البحرينية', 0.195),
      makeStock('MEAT_BH', 'اللحوم البحرينية', 0.145),
      makeStock('BAKERY_BH', 'المخابز البحرينية', 0.120),
      makeStock('FISH_BH', 'الأسماك البحرينية', 0.210),
      makeStock('JUICE_BH', 'العصائر البحرينية', 0.165),
      makeStock('WATER_BH', 'المياه البحرينية', 0.380),
      makeStock('SNACK_BH', 'الوجبات البحرينية', 0.095),
    ]},
    { sector: 'السياحة', stocks: [
      makeStock('GULF_AIR', 'طيران الخليج', 0.620),
      makeStock('GULF_HTL', 'فنادق الخليج', 0.450),
      makeStock('BAHRAIN_HTL', 'فندق البحرين', 1.10),
      makeStock('TOURISM_BH', 'السياحة البحرينية', 0.285),
      makeStock('TRAVEL_BH', 'السفر البحريني', 0.195),
      makeStock('RESORT_BH', 'المنتجعات البحرينية', 0.350),
      makeStock('ENTERTAIN_BH', 'الترفيه البحريني', 0.145),
      makeStock('CATERING_BH', 'التموين البحريني', 0.420),
      makeStock('EVENT_BH', 'الفعاليات البحرينية', 0.120),
      makeStock('LEISURE_BH', 'الترويح البحريني', 0.210),
    ]},
    { sector: 'النقل', stocks: [
      makeStock('APM_BH', 'موانئ البحرين', 0.580),
      makeStock('SHIPPING_BH', 'الشحن البحريني', 0.320),
      makeStock('LOGISTICS_BH', 'اللوجستية البحرينية', 0.245),
      makeStock('CARGO_BH', 'كارغو البحرين', 0.195),
      makeStock('TAXI_BH', 'تاكسي البحرين', 0.145),
      makeStock('BUS_BH', 'النقل العام البحريني', 0.285),
      makeStock('MARINE_BH', 'البحرية البحرينية', 0.165),
      makeStock('AIR_BH', 'الطيران البحريني', 0.420),
      makeStock('RAIL_BH', 'السكك البحرينية', 0.120),
      makeStock('TRANSPORT_BH', 'النقل المتكامل', 0.350),
    ]},
    { sector: 'التجزئة', stocks: [
      makeStock('BFC_BH', 'البحرين للتجزئة', 0.420),
      makeStock('JAWAD', 'مجموعة جواد', 0.580),
      makeStock('ALOSRA', 'الأسرة', 0.310),
      makeStock('LULU_BH', 'لولو البحرين', 0.850),
      makeStock('FAKHRO', 'فخرو للتجارة', 0.195),
      makeStock('KANOO', 'كانو القابضة', 0.450),
      makeStock('YOUSIF', 'يوسف بن أحمد', 0.285),
      makeStock('RETAIL_BH', 'التجزئة البحرينية', 0.145),
      makeStock('ELECT_BH', 'الإلكترونيات البحرينية', 0.210),
      makeStock('MALL_BH', 'المولات البحرينية', 0.380),
    ]},
  ],
  om: [
    { sector: 'البنوك', stocks: [
      makeStock('BKMB', 'بنك مسقط', 0.480),
      makeStock('BKSB', 'بنك صحار', 0.145),
      makeStock('BKDB', 'بنك ظفار', 0.185),
      makeStock('BKNB', 'البنك الوطني العماني', 0.220),
      makeStock('HSBC_OM', 'HSBC عمان', 0.125),
      makeStock('BKAB', 'بنك العز الإسلامي', 0.098),
      makeStock('MEZAN', 'ميزان الإسلامي', 0.135),
      makeStock('ALIZZ', 'العز الإسلامي', 0.085),
      makeStock('AHLI_OM', 'البنك الأهلي', 0.165),
      makeStock('OMAN_ARAB', 'عمان العربي', 0.195),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('OTEL', 'عمانتل', 0.750),
      makeStock('OORD', 'أوريدو عمان', 0.520),
      makeStock('AWASR', 'أواصر', 0.380),
      makeStock('RENNA', 'رنّة', 0.285),
      makeStock('FRIENDI', 'فريندي', 0.195),
      makeStock('DIGI_OM', 'الرقمية العمانية', 0.145),
      makeStock('NET_OM', 'شبكات عمان', 0.120),
      makeStock('TECH_OM', 'التقنية العمانية', 0.210),
      makeStock('CLOUD_OM', 'السحابة العمانية', 0.165),
      makeStock('DATA_OM', 'بيانات عمان', 0.310),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('BARKA_RE', 'بركاء العقارية', 0.195),
      makeStock('OMRAN', 'عمران', 0.420),
      makeStock('ALARGAN', 'الأرجان العقارية', 0.285),
      makeStock('TILAL', 'تلال', 0.350),
      makeStock('MUSCAT_RE', 'مسقط العقارية', 0.145),
      makeStock('SARAYA', 'سرايا', 0.120),
      makeStock('OMAN_RE', 'العقارية العمانية', 0.185),
      makeStock('SOHAR_RE', 'صحار العقارية', 0.165),
      makeStock('NIZWA_RE', 'نزوى العقارية', 0.098),
      makeStock('WAVE', 'الموج', 0.520),
    ]},
    { sector: 'الطاقة', stocks: [
      makeStock('OQEP', 'أوكيو للطاقة', 1.20),
      makeStock('ORPIC', 'أوربك', 0.850),
      makeStock('OMAN_OIL', 'نفط عمان', 0.680),
      makeStock('ACME', 'أسمنت عمان', 0.380),
      makeStock('SHELL_OM', 'شل عمان', 1.45),
      makeStock('BP_OM', 'BP عمان', 0.520),
      makeStock('PTTEP_OM', 'بتيب عمان', 0.285),
      makeStock('DALEEL', 'دليل للنفط', 0.420),
      makeStock('PETROGAS', 'بتروغاز', 0.195),
      makeStock('RAYSUT', 'ريسوت للأسمنت', 0.350),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('NLIF', 'الحياة الوطنية', 0.285),
      makeStock('DHOF', 'ظفار للتأمين', 0.195),
      makeStock('MUSI', 'مسقط للتأمين', 0.145),
      makeStock('OUIS', 'عمان المتحدة للتأمين', 0.320),
      makeStock('ARSI', 'العربي للتأمين', 0.120),
      makeStock('VISI', 'فيجن للتأمين', 0.165),
      makeStock('TAKA_OM', 'تكافل عمان', 0.098),
      makeStock('GULF_OM', 'الخليج العماني', 0.210),
      makeStock('NATL_OM', 'الوطنية للتأمين', 0.185),
      makeStock('AMAN_OM', 'أمان عمان', 0.245),
    ]},
    { sector: 'الصناعة', stocks: [
      makeStock('OCEI', 'عمان للكابلات', 0.420),
      makeStock('OGCI', 'عمان للكروم', 0.285),
      makeStock('OMAN_CEMENT', 'أسمنت عمان', 0.350),
      makeStock('OMAN_FLOUR', 'مطاحن عمان', 0.520),
      makeStock('OMAN_PACK', 'التغليف العمانية', 0.195),
      makeStock('OMAN_FIBER', 'الألياف العمانية', 0.145),
      makeStock('STEEL_OM', 'الحديد العمانية', 0.310),
      makeStock('GLASS_OM', 'الزجاج العمانية', 0.120),
      makeStock('PAINT_OM', 'الدهانات العمانية', 0.185),
      makeStock('CERAMIC_OM', 'السيراميك العماني', 0.165),
    ]},
    { sector: 'الأغذية', stocks: [
      makeStock('OMAN_FOOD', 'الأغذية العمانية', 0.580),
      makeStock('SALALAH', 'صلالة للأغذية', 0.420),
      makeStock('OMAN_DAIRY', 'الألبان العمانية', 0.310),
      makeStock('OMAN_FISH', 'الأسماك العمانية', 1.85),
      makeStock('OMAN_MEAT', 'اللحوم العمانية', 0.245),
      makeStock('OMAN_BAKERY', 'المخابز العمانية', 0.195),
      makeStock('OMAN_JUICE', 'العصائر العمانية', 0.145),
      makeStock('AREEJ', 'أريج للأغذية', 0.350),
      makeStock('SWEETS', 'الحلويات العمانية', 0.120),
      makeStock('DATES_OM', 'التمور العمانية', 0.285),
    ]},
    { sector: 'الخدمات المالية', stocks: [
      makeStock('OMAN_INV', 'عمان للاستثمار', 0.165),
      makeStock('MUSCAT_FIN', 'مسقط المالية', 0.285),
      makeStock('OMAN_CAP', 'رأس المال العماني', 0.120),
      makeStock('SOHAR_FIN', 'صحار المالية', 0.195),
      makeStock('NIZWA_FIN', 'نزوى المالية', 0.145),
      makeStock('UBHAR', 'أبهار كابيتال', 0.310),
      makeStock('KAAFI', 'كافي للاستثمار', 0.085),
      makeStock('OMAN_FUND', 'الصناديق العمانية', 0.210),
      makeStock('WEALTH_OM', 'الثروة العمانية', 0.165),
      makeStock('BROKER_OM', 'الوساطة العمانية', 0.245),
    ]},
    { sector: 'النقل', stocks: [
      makeStock('OMAN_AIR', 'الطيران العماني', 0.580),
      makeStock('OMAN_SHIP', 'الشحن العماني', 0.420),
      makeStock('SOHAR_PORT', 'ميناء صحار', 0.310),
      makeStock('SALALAH_PORT', 'ميناء صلالة', 0.520),
      makeStock('OMAN_LOG', 'اللوجستية العمانية', 0.245),
      makeStock('OMAN_TAXI', 'سيارات الأجرة العمانية', 0.165),
      makeStock('OMAN_BUS', 'مواصلات عمان', 0.195),
      makeStock('OMAN_MARINE', 'البحرية العمانية', 0.285),
      makeStock('CARGO_OM', 'كارغو عمان', 0.145),
      makeStock('ASYAD', 'أسياد للنقل', 0.380),
    ]},
    { sector: 'المرافق', stocks: [
      makeStock('OEPW', 'كهرباء ومياه عمان', 0.420),
      makeStock('NAMA', 'نماء القابضة', 0.350),
      makeStock('MZOON', 'مزون للكهرباء', 0.285),
      makeStock('MUSANDAM', 'مسندم للطاقة', 0.195),
      makeStock('SOHAR_POWER', 'صحار للطاقة', 0.520),
      makeStock('BARKA_POWER', 'بركاء للطاقة', 0.310),
      makeStock('DHOFAR_POWER', 'ظفار للطاقة', 0.145),
      makeStock('WATER_OM', 'المياه العمانية', 0.185),
      makeStock('WASTE_OM', 'بيئة عمان', 0.120),
      makeStock('SOLAR_OM', 'الطاقة الشمسية العمانية', 0.245),
    ]},
  ],
  jo: [
    { sector: 'البنوك', stocks: [
      makeStock('ARBK', 'البنك العربي', 5.20),
      makeStock('BOJX', 'بنك الأردن', 2.85),
      makeStock('SGBJ', 'بنك سوسيته جنرال', 1.45),
      makeStock('JOKB', 'البنك الأردني الكويتي', 1.10),
      makeStock('CABK', 'بنك القاهرة عمان', 1.25),
      makeStock('AHLI_JO', 'البنك الأهلي', 1.85),
      makeStock('INVB', 'بنك الاستثمار', 1.15),
      makeStock('UBSI', 'بنك الاتحاد', 2.10),
      makeStock('ABCO', 'بنك ABC', 0.95),
      makeStock('HBTF', 'بنك الإسكان', 2.45),
    ]},
    { sector: 'الاتصالات', stocks: [
      makeStock('JTEL', 'أورانج الأردن', 4.50),
      makeStock('ZAIN_JO', 'زين الأردن', 1.85),
      makeStock('UMNIAH', 'أمنية', 0.95),
      makeStock('JPTL', 'بالتل', 3.20),
      makeStock('JOEP', 'الشرق الأوسط للكهرباء', 1.10),
      makeStock('MANE', 'المناصير', 0.75),
      makeStock('ELEC_JO', 'كهرباء الأردن', 1.45),
      makeStock('NAQL', 'النقل الحضري', 0.85),
      makeStock('IDIT', 'إديتا', 2.10),
      makeStock('PHOS', 'الفوسفات', 8.50),
    ]},
    { sector: 'العقارات', stocks: [
      makeStock('AIEI', 'العربية الدولية', 1.20),
      makeStock('MANE_RE', 'المناصير العقارية', 0.75),
      makeStock('ZARA', 'زارا', 3.50),
      makeStock('IHLC', 'مستشفى الإسلامي', 2.80),
      makeStock('APOT', 'الصيدلة', 1.95),
      makeStock('NATP', 'الوطنية للبترول', 0.65),
      makeStock('AMMN', 'أمانة عمان', 1.10),
      makeStock('JOPC', 'البترول الأردنية', 4.20),
      makeStock('DURA', 'الدرة', 0.85),
      makeStock('RMCC', 'الملكية', 1.45),
    ]},
    { sector: 'التأمين', stocks: [
      makeStock('JOIT', 'التأمين الأردني', 2.40),
      makeStock('ARMI', 'العربية للتأمين', 1.85),
      makeStock('MENA_INS', 'الشرق الأوسط للتأمين', 1.20),
      makeStock('DELTA_JO', 'الدلتا للتأمين', 0.95),
      makeStock('HINS', 'هيئة التأمين', 1.45),
      makeStock('FIRST_INS', 'الأولى للتأمين', 0.75),
      makeStock('NATL_INS', 'الوطنية للتأمين', 1.10),
      makeStock('ARAB_LIFE', 'العربية لتأمين الحياة', 2.30),
      makeStock('EURO_INS', 'المتحدة الأوروبية', 0.85),
      makeStock('GLOB_INS', 'العالمية للتأمين', 1.65),
    ]},
    { sector: 'الصناعة', stocks: [
      makeStock('JOPH', 'الفوسفات الأردنية', 8.50),
      makeStock('JOPT', 'البوتاس الأردنية', 25.80),
      makeStock('AALU', 'الألمنيوم الأردنية', 1.20),
      makeStock('NAUR', 'النوارس الأردنية', 0.85),
      makeStock('JOST', 'الحديد والصلب', 1.65),
      makeStock('NATA', 'الوطنية للصناعات', 0.95),
      makeStock('JOCE', 'أسمنت الأردن', 3.40),
      makeStock('ACEM_JO', 'العربي للأسمنت', 2.10),
      makeStock('JOPA', 'الورق الأردنية', 0.75),
      makeStock('GLASS_JO', 'الزجاج الأردنية', 1.30),
    ]},
    { sector: 'الأغذية', stocks: [
      makeStock('NATP_FD', 'الوطنية للأغذية', 1.85),
      makeStock('JODA', 'ألبان الأردن', 2.40),
      makeStock('NUTRI', 'نيوتري', 0.95),
      makeStock('FLOV', 'مطاحن الأردن', 3.20),
      makeStock('SIGA', 'سجاير الأردن', 5.80),
      makeStock('JOCF', 'الأردنية للدواجن', 1.10),
      makeStock('SUKAR', 'السكر الأردنية', 0.75),
      makeStock('OLIVE', 'الزيتون الأردنية', 1.45),
      makeStock('BAKR_JO', 'المخابز الأردنية', 0.85),
      makeStock('DAIRY_JO', 'ألبان الوادي', 2.60),
    ]},
    { sector: 'التعدين', stocks: [
      makeStock('JOPH_MN', 'الفوسفات للتعدين', 8.20),
      makeStock('JOPT_MN', 'البوتاس للتعدين', 24.50),
      makeStock('NQMI', 'التعدين الأردنية', 1.85),
      makeStock('CEMENT_JO', 'الأسمنت للتعدين', 3.40),
      makeStock('QUARRY_JO', 'المحاجر الأردنية', 0.95),
      makeStock('STONE_JO', 'الحجر الأردنية', 0.65),
      makeStock('SAND_JO', 'الرمال الأردنية', 0.45),
      makeStock('MARBLE_JO', 'الرخام الأردني', 1.20),
      makeStock('COPPER_JO', 'النحاس الأردنية', 0.80),
      makeStock('MINERAL_JO', 'المعادن الأردنية', 1.50),
    ]},
    { sector: 'الخدمات المالية', stocks: [
      makeStock('JOFN', 'المالية الأردنية', 1.65),
      makeStock('SPIC', 'الأوراق المالية', 2.40),
      makeStock('AMAD', 'عمّاد للاستثمار', 0.85),
      makeStock('JCAP', 'رأس المال الأردني', 1.10),
      makeStock('SAFWA', 'صفوة المالية', 0.95),
      makeStock('OFIN', 'الشرق المالية', 1.45),
      makeStock('JOIB', 'الإسلامي للاستثمار', 2.80),
      makeStock('BROKER_JO', 'الوساطة الأردنية', 0.65),
      makeStock('ASSET_JO', 'إدارة الأصول', 1.20),
      makeStock('FUND_JO', 'الصناديق الأردنية', 0.75),
    ]},
    { sector: 'الرعاية الصحية', stocks: [
      makeStock('IHLC_H', 'الإسلامي (مستشفى)', 2.80),
      makeStock('SPEC', 'التخصصي الأردني', 3.40),
      makeStock('KHALDI', 'مستشفى الخالدي', 5.20),
      makeStock('ISTISHARI', 'الاستشاري', 2.10),
      makeStock('PHARMA_JO', 'الأدوية الأردنية', 4.80),
      makeStock('HIKMA', 'حكمة للأدوية', 6.50),
      makeStock('DAR_DAWA', 'دار الدواء', 3.80),
      makeStock('MEDLAB_JO', 'المختبرات الأردنية', 1.65),
      makeStock('DENTAL_JO', 'طب الأسنان', 0.95),
      makeStock('OPTIC_JO', 'البصريات الأردنية', 1.20),
    ]},
    { sector: 'النقل', stocks: [
      makeStock('RJAL', 'الملكية الأردنية', 0.85),
      makeStock('JETT', 'جت للنقل', 2.40),
      makeStock('AQABA_PORT', 'ميناء العقبة', 3.80),
      makeStock('CARGO_JO', 'كارغو الأردن', 1.10),
      makeStock('TAXI_JO', 'سيارات الأجرة', 0.65),
      makeStock('BUS_JO', 'النقل العام الأردني', 0.95),
      makeStock('SHIP_JO', 'الشحن الأردني', 1.45),
      makeStock('LOG_JO', 'اللوجستية الأردنية', 0.75),
      makeStock('FAST_JO', 'التوصيل السريع', 2.10),
      makeStock('RAIL_JO', 'السكك الأردنية', 0.55),
    ]},
  ],
};

// دالة لون التغير
function getChangeColor(change: number) {
  if (change >= 3) return 'bg-green-600 text-white';
  if (change >= 2) return 'bg-green-500 text-white';
  if (change >= 1) return 'bg-green-400 text-white';
  if (change >= 0) return 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (change >= -1) return 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200';
  if (change >= -2) return 'bg-red-400 text-white';
  if (change >= -3) return 'bg-red-500 text-white';
  return 'bg-red-600 text-white';
}

// مكون خلية الخريطة الحرارية
function HeatmapCell({
  stock,
  size = 'normal',
  currency = '',
  extraClass = '',
  highlighted = false,
  onClick,
}: {
  stock: StockData;
  size?: 'small' | 'normal' | 'large' | 'xlarge';
  currency?: string;
  extraClass?: string;
  highlighted?: boolean;
  onClick?: () => void;
}) {
  const sizeClasses = {
    small:  'p-1.5 min-w-[56px] min-h-[52px]',
    normal: 'p-2.5 min-w-[90px]  min-h-[70px]',
    large:  'p-3   min-w-[120px] min-h-[90px]',
    xlarge: 'p-4   min-w-[160px] min-h-[110px]',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'rounded-xl cursor-pointer transition-all duration-200',
              'hover:scale-[1.06] hover:shadow-xl hover:z-10 relative',
              'flex flex-col justify-between select-none',
              getChangeColor(stock.change),
              sizeClasses[size],
              extraClass,
              highlighted && 'ring-2 ring-white/60 scale-[1.03]'
            )}
            onClick={onClick}
          >
            <div className={cn('font-bold leading-tight', size === 'xlarge' ? 'text-sm' : size === 'large' ? 'text-xs' : 'text-[10px]')}>
              {stock.symbol}
            </div>
            {size !== 'small' && (
              <div className={cn('truncate opacity-80', size === 'xlarge' ? 'text-xs' : 'text-[9px]')}>
                {stock.name}
              </div>
            )}
            {(size === 'large' || size === 'xlarge') && currency && (
              <div className="text-[9px] opacity-70 mt-0.5">
                {stock.price.toLocaleString()} {currency}
              </div>
            )}
            <div className={cn('font-semibold flex items-center gap-0.5 mt-0.5', size === 'xlarge' ? 'text-sm' : 'text-[10px]')}>
              {stock.change >= 0 ? <TrendingUp className="h-2.5 w-2.5 shrink-0" /> : <TrendingDown className="h-2.5 w-2.5 shrink-0" />}
              {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs" dir="rtl">
          <p className="font-bold">{stock.symbol} – {stock.name}</p>
          <p>{stock.price.toLocaleString()} {currency}</p>
          <p className={stock.change >= 0 ? 'text-green-400' : 'text-red-400'}>
            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// مكون مقياس الألوان
function ColorScale() {
  return (
    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
      <span className="text-xs text-muted-foreground">انخفاض كبير</span>
      <div className="flex gap-0.5">
        <div className="w-8 h-4 rounded bg-red-600" />
        <div className="w-8 h-4 rounded bg-red-500" />
        <div className="w-8 h-4 rounded bg-red-400" />
        <div className="w-8 h-4 rounded bg-red-200 dark:bg-red-900" />
        <div className="w-8 h-4 rounded bg-green-200 dark:bg-green-900" />
        <div className="w-8 h-4 rounded bg-green-400" />
        <div className="w-8 h-4 rounded bg-green-500" />
        <div className="w-8 h-4 rounded bg-green-600" />
      </div>
      <span className="text-xs text-muted-foreground">ارتفاع كبير</span>
    </div>
  );
}

export default function HeatmapPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { toast } = useToast();

  // ─── حالة الصفحة ────────────────────────────────────────────────
  const [market, setMarket] = useState<string>('tasi');
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'proportional'>('grid');
  const [selectedStock, setSelectedStock] = useState<{ stock: StockData; sector: string } | null>(null);
  const [liveData, setLiveData] = useState<Record<string, SectorData[]>>(heatmapData);

  // فلاتر
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [changeFilter, setChangeFilter] = useState<'all' | 'gainers' | 'losers' | 'strong_gain' | 'strong_loss'>('all');

  // تحديث تلقائي
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);

  // بيانات شرعية للسهم المحدد
  const [shariaData, setShariaData] = useState<{
    found: boolean;
    grade?: string;
    overall?: string;
    recommendation?: string;
    purification?: string;
    bilad?: string;
    rajhi?: string;
    maqasid?: string;
    zerodebt?: string;
  } | null>(null);
  const [shariaLoading, setShariaLoading] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // ─── جلب الأسعار ────────────────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const res = await fetch(`${apiUrl}/api/prices`);
      if (!res.ok) return;
      const prices = await res.json();
      if (!prices || typeof prices !== 'object') return;
      setLiveData((prev) => {
        const updated = { ...prev };
        for (const marketKey of Object.keys(updated)) {
          updated[marketKey] = updated[marketKey].map((sector) => ({
            ...sector,
            stocks: sector.stocks.map((stock) => {
              const livePrice = prices[stock.symbol];
              if (livePrice && typeof livePrice === 'object') {
                return {
                  ...stock,
                  price: livePrice.price ?? stock.price,
                  change: livePrice.change ?? livePrice.changePercent ?? stock.change,
                };
              }
              return stock;
            }),
          }));
        }
        return updated;
      });
    } catch { /* fallback to static data silently */ }
    finally { setIsRefreshing(false); }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  // ─── التحديث التلقائي ───────────────────────────────────────────
  useEffect(() => {
    if (!autoRefresh) { setCountdown(30); return; }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { fetchPrices(); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchPrices]);

  // ─── اختصار لوحة المفاتيح: Ctrl+F يركّز البحث ─────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ─── جلب البيانات الشرعية عند فتح نافذة السهم ────────────────
  useEffect(() => {
    if (!selectedStock) { setShariaData(null); return; }
    let cancelled = false;
    setShariaLoading(true);
    setShariaData(null);
    const { symbol } = selectedStock.stock;
    fetch(`/api/sharia-lookup?symbol=${encodeURIComponent(symbol)}&market=${encodeURIComponent(market)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setShariaData(data); })
      .catch(() => { if (!cancelled) setShariaData({ found: false }); })
      .finally(() => { if (!cancelled) setShariaLoading(false); });
    return () => { cancelled = true; };
  }, [selectedStock, market]);

  const currentMarket = marketInfo[market];
  const allSectors = useMemo(() => (liveData[market] || []).map((s) => s.sector), [liveData, market]);

  // ─── البيانات المُصفَّاة ────────────────────────────────────────
  const filteredData = useMemo(() => {
    let data = liveData[market] || [];
    if (sectorFilter) data = data.filter((s) => s.sector === sectorFilter);
    const q = search.toLowerCase();
    return data
      .map((sector) => ({
        ...sector,
        stocks: sector.stocks.filter((stock) => {
          const matchSearch = !q || stock.symbol.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q);
          const matchChange =
            changeFilter === 'all'        ? true :
            changeFilter === 'gainers'    ? stock.change > 0 :
            changeFilter === 'losers'     ? stock.change < 0 :
            changeFilter === 'strong_gain'? stock.change >= 2 :
            changeFilter === 'strong_loss'? stock.change <= -2 : true;
          return matchSearch && matchChange;
        }),
      }))
      .filter((s) => s.stocks.length > 0);
  }, [liveData, market, sectorFilter, search, changeFilter]);

  // ─── إحصائيات السوق الكاملة (غير مُصفَّاة) ────────────────────
  const allStocks = useMemo(() => (liveData[market] || []).flatMap((s) => s.stocks), [liveData, market]);
  const gainers = allStocks.filter((s) => s.change > 0).length;
  const losers  = allStocks.filter((s) => s.change < 0).length;
  const neutral = allStocks.filter((s) => s.change === 0).length;
  const avgChange = allStocks.length ? (allStocks.reduce((a, s) => a + s.change, 0) / allStocks.length) : 0;

  // ─── أداء القطاعات ─────────────────────────────────────────────
  const sectorPerformance = useMemo(() =>
    (liveData[market] || []).map((s) => ({
      sector: s.sector,
      avg: s.stocks.reduce((a, st) => a + st.change, 0) / (s.stocks.length || 1),
    })).sort((a, b) => b.avg - a.avg),
  [liveData, market]);

  // ─── حجم خلية النسبية ──────────────────────────────────────────
  const getProportionalSize = useCallback((price: number, sectorStocks: StockData[]): 'small' | 'normal' | 'large' | 'xlarge' => {
    const max = Math.max(...sectorStocks.map((s) => s.price));
    const r = price / max;
    if (r > 0.6) return 'xlarge';
    if (r > 0.3) return 'large';
    if (r > 0.1) return 'normal';
    return 'small';
  }, []);

  // ─── إضافة لقائمة المتابعة ─────────────────────────────────────
  const handleAddToWatchlist = useCallback(async () => {
    if (!selectedStock) return;
    if (!token) {
      toast({ title: 'يجب تسجيل الدخول', description: 'سجّل دخولك أولاً لإضافة أسهم لقائمة المتابعة', variant: 'destructive' });
      return;
    }
    setIsAddingToWatchlist(true);
    try {
      // نحاول إنشاء قائمة مشاهدة جديدة بنفس اسم السهم
      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: `${selectedStock.stock.symbol} – ${selectedStock.stock.name}` }),
      });
      if (res.ok) {
        toast({ title: 'تمت الإضافة ✓', description: `${selectedStock.stock.name} أُضيف لقائمة المتابعة` });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: 'فشلت الإضافة', description: err?.error ?? 'حدث خطأ', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'فشلت الإضافة', description: 'تحقق من اتصالك بالشبكة', variant: 'destructive' });
    } finally { setIsAddingToWatchlist(false); }
  }, [selectedStock, token, toast]);

  // ─── بيانات تداول السهم المحدد ────────────────────────────────
  const selectedStockExtras = selectedStock ? {
    volume: seedVolume(selectedStock.stock.symbol, selectedStock.stock.price),
    dayHigh: parseFloat((selectedStock.stock.price * (1 + Math.abs(seedChange(selectedStock.stock.symbol + 'H')) * 0.005)).toFixed(2)),
    dayLow:  parseFloat((selectedStock.stock.price * (1 - Math.abs(seedChange(selectedStock.stock.symbol + 'L')) * 0.005)).toFixed(2)),
    marketCap: seedMarketCap(selectedStock.stock.symbol, selectedStock.stock.price),
    pe:        seedPE(selectedStock.stock.symbol),
    dividend:  seedDividend(selectedStock.stock.symbol),
  } : null;

  // ─── تصيير ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="mr-16 lg:mr-64 transition-all duration-300">
        <TopBar title="🗺️ الخريطة الحرارية" />
        <main className="p-6 space-y-6">

          {/* ── شريط التحكم العلوي ── */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">الخريطة الحرارية للأسهم</h2>
                <p className="text-sm text-muted-foreground">
                  عرض مرئي لأداء الأسهم · انقر على أي سهم للتفاصيل والروابط
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* اختيار السوق */}
                <Select value={market} onValueChange={(v) => { setMarket(v); setSectorFilter(null); }}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="اختر السوق" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(marketInfo).map(([key, info]) => (
                      <SelectItem key={key} value={key}>{info.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* التحديث التلقائي */}
                <Button
                  variant={autoRefresh ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAutoRefresh((v) => !v)}
                  className="gap-1.5"
                >
                  <Clock className="h-4 w-4" />
                  {autoRefresh ? `${countdown}ث` : 'تحديث تلقائي'}
                </Button>

                {/* تحديث يدوي */}
                <Button variant="outline" size="sm" onClick={fetchPrices} disabled={isRefreshing} className="gap-1.5">
                  <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                  تحديث
                </Button>

                {/* أوضاع العرض */}
                <div className="flex items-center border rounded-lg overflow-hidden">
                  {([
                    { mode: 'grid',         icon: Grid3X3,   label: 'شبكة' },
                    { mode: 'compact',      icon: List,       label: 'مضغوط' },
                    { mode: 'proportional', icon: Maximize2,  label: 'نسبي' },
                  ] as const).map(({ mode, icon: Icon, label }) => (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode(mode)}
                      title={label}
                      className="rounded-none border-0 px-2.5"
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── بار الحالة (Breadth) ── */}
            <div className="flex items-center gap-3 flex-wrap">
              <ColorScale />
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <span className="text-xs text-muted-foreground whitespace-nowrap">اتساع السوق</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden bg-red-200 dark:bg-red-900/40">
                  <div
                    className="h-full bg-green-500 dark:bg-green-600 rounded-full transition-all"
                    style={{ width: allStocks.length ? `${(gainers / allStocks.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {gainers}↑ {losers}↓ {neutral}–
                </span>
                <Badge variant={avgChange >= 0 ? 'default' : 'destructive'} className="text-xs">
                  متوسط: {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>

          {/* ── إحصائيات سريعة ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'أسهم مرتفعة', value: gainers,           color: 'green', Icon: TrendingUp },
              { label: 'أسهم منخفضة', value: losers,            color: 'red',   Icon: TrendingDown },
              { label: 'أسهم ثابتة',  value: neutral,           color: 'blue',  Icon: Minus },
              { label: 'إجمالي الأسهم', value: allStocks.length, color: 'amber', Icon: Thermometer },
            ].map(({ label, value, color, Icon }) => (
              <Card key={label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 text-${color}-600`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── أداء القطاعات ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                أداء القطاعات – {currentMarket?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sectorPerformance.map(({ sector, avg }) => (
                  <button
                    key={sector}
                    className={cn(
                      'w-full flex items-center gap-3 group rounded-lg px-2 py-1.5 transition-colors',
                      'hover:bg-muted/60',
                      sectorFilter === sector && 'bg-muted'
                    )}
                    onClick={() => setSectorFilter(sectorFilter === sector ? null : sector)}
                  >
                    <span className="text-xs text-muted-foreground w-24 text-right shrink-0 truncate">{sector}</span>
                    <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden relative">
                      <div
                        className={cn('h-full rounded-full transition-all', avg >= 0 ? 'bg-green-500' : 'bg-red-500')}
                        style={{ width: `${Math.min(Math.abs(avg) * 15, 100)}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-semibold w-14 text-left shrink-0', avg >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {avg >= 0 ? '+' : ''}{avg.toFixed(2)}%
                    </span>
                    <ChevronRight className={cn('h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0', sectorFilter === sector && 'opacity-100 rotate-90')} />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── شريط الفلاتر ── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* بحث */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                className="pr-9"
                placeholder="بحث بالرمز أو الاسم… (Ctrl+F)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* فلاتر التغيير */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {([
                { id: 'all',         label: 'الكل',       variant: 'outline' },
                { id: 'gainers',     label: '↑ مرتفعة',   variant: 'outline' },
                { id: 'strong_gain', label: '↑↑ قوية',    variant: 'outline' },
                { id: 'losers',      label: '↓ منخفضة',   variant: 'outline' },
                { id: 'strong_loss', label: '↓↓ هبوط حاد',variant: 'outline' },
              ] as const).map(({ id, label }) => (
                <Button
                  key={id}
                  size="sm"
                  variant={changeFilter === id ? 'default' : 'outline'}
                  onClick={() => setChangeFilter(id)}
                  className="text-xs h-8"
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* مسح فلتر القطاع */}
            {sectorFilter && (
              <Button size="sm" variant="secondary" onClick={() => setSectorFilter(null)} className="gap-1.5 text-xs">
                <X className="h-3.5 w-3.5" />
                {sectorFilter}
              </Button>
            )}

            {/* عدد النتائج */}
            <span className="text-xs text-muted-foreground mr-auto">
              {filteredData.flatMap((s) => s.stocks).length} سهم
            </span>
          </div>

          {/* ── الخريطة الحرارية ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                توزيع الأداء حسب القطاعات – {currentMarket?.label}
                {viewMode === 'proportional' && (
                  <Badge variant="secondary" className="text-[10px]">حجم الخلية نسبي للسعر</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredData.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>لا توجد نتائج مطابقة للبحث</p>
                </div>
              ) : (
              <div className="space-y-6">
                {filteredData.map((sector) => {
                  const sectorAvg = sector.stocks.reduce((a, s) => a + s.change, 0) / sector.stocks.length;
                  return (
                  <div key={sector.sector}>
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        className="text-sm font-semibold hover:text-primary transition-colors"
                        onClick={() => setSectorFilter(sectorFilter === sector.sector ? null : sector.sector)}
                      >
                        {sector.sector}
                      </button>
                      <Badge variant="outline" className="text-[10px]">{sector.stocks.length} سهم</Badge>
                      <div className="flex-1 h-px bg-border" />
                      <span className={cn('text-sm font-semibold', sectorAvg >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {sectorAvg >= 0 ? '+' : ''}{sectorAvg.toFixed(2)}%
                      </span>
                    </div>
                    <div className={cn('flex flex-wrap', viewMode === 'compact' ? 'gap-1' : 'gap-2')}>
                      {sector.stocks.map((stock) => {
                        const size = viewMode === 'compact'      ? 'small'
                                   : viewMode === 'proportional' ? getProportionalSize(stock.price, sector.stocks)
                                   : 'normal';
                        return (
                          <HeatmapCell
                            key={stock.symbol}
                            stock={stock}
                            size={size}
                            currency={currentMarket?.currency}
                            highlighted={!!search && (
                              stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
                              stock.name.toLowerCase().includes(search.toLowerCase())
                            )}
                            onClick={() => setSelectedStock({ stock, sector: sector.sector })}
                          />
                        );
                      })}
                    </div>
                  </div>
                );})}
              </div>
              )}
            </CardContent>
          </Card>

          {/* ── أفضل وأسوأ الأسهم (قابلة للنقر) ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* أعلى الارتفاعات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  أعلى الارتفاعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allStocks
                    .sort((a, b) => b.change - a.change)
                    .slice(0, 7)
                    .map((stock, index) => {
                      const sectorName = (liveData[market] || []).find((s) => s.stocks.some((st) => st.symbol === stock.symbol))?.sector ?? '';
                      return (
                        <button
                          key={stock.symbol}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-right"
                          onClick={() => setSelectedStock({ stock, sector: sectorName })}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-[10px] font-bold text-green-700 shrink-0">
                              {index + 1}
                            </span>
                            <div className="text-right">
                              <p className="font-semibold text-sm">{stock.symbol}</p>
                              <p className="text-[10px] text-muted-foreground">{stock.name}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-green-600 text-sm">+{stock.change.toFixed(2)}%</p>
                            <p className="text-[10px] text-muted-foreground">{stock.price.toLocaleString()} {currentMarket?.currency}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* أعلى الانخفاضات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  أعلى الانخفاضات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allStocks
                    .sort((a, b) => a.change - b.change)
                    .slice(0, 7)
                    .map((stock, index) => {
                      const sectorName = (liveData[market] || []).find((s) => s.stocks.some((st) => st.symbol === stock.symbol))?.sector ?? '';
                      return (
                        <button
                          key={stock.symbol}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-right"
                          onClick={() => setSelectedStock({ stock, sector: sectorName })}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-[10px] font-bold text-red-700 shrink-0">
                              {index + 1}
                            </span>
                            <div className="text-right">
                              <p className="font-semibold text-sm">{stock.symbol}</p>
                              <p className="text-[10px] text-muted-foreground">{stock.name}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-red-600 text-sm">{stock.change.toFixed(2)}%</p>
                            <p className="text-[10px] text-muted-foreground">{stock.price.toLocaleString()} {currentMarket?.currency}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── ملاحظات وروابط ── */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-blue-800 dark:text-blue-200">حول الخريطة الحرارية</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    اللون الأخضر = ارتفاع · الأحمر = انخفاض · كثافة اللون تعكس حجم التغيير.
                    انقر على أي خلية للاطلاع على التفاصيل وفتح الرسم البياني أو صفحة السوق.
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-[10px]">Ctrl+F</kbd>
                    للبحث السريع
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* ── نافذة تفاصيل السهم (محسّنة بالروابط الحقيقية) ── */}
      <Dialog open={!!selectedStock} onOpenChange={(open) => { if (!open) setSelectedStock(null); }}>
        <DialogContent className="sm:max-w-[520px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Thermometer className="h-5 w-5" />
              تفاصيل السهم
            </DialogTitle>
          </DialogHeader>
          {selectedStock && selectedStockExtras && (
            <div className="space-y-4 pt-1">

              {/* ── رأس السهم ── */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-14 w-14 rounded-xl flex flex-col items-center justify-center text-sm font-bold shrink-0',
                  getChangeColor(selectedStock.stock.change)
                )}>
                  {selectedStock.stock.change >= 0
                    ? <TrendingUp className="h-5 w-5" />
                    : <TrendingDown className="h-5 w-5" />}
                  <span className="text-[9px] mt-0.5">
                    {selectedStock.stock.change >= 0 ? '+' : ''}{selectedStock.stock.change.toFixed(2)}%
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-bold">{selectedStock.stock.symbol}</p>
                  <p className="text-sm text-muted-foreground truncate">{selectedStock.stock.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{selectedStock.sector}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{currentMarket?.label}</Badge>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-2xl font-bold">{selectedStock.stock.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{currentMarket?.currency}</p>
                </div>
              </div>

              <Separator />

              {/* ── بيانات التداول ── */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5" /> بيانات التداول
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'أعلى اليوم',   value: `${selectedStockExtras.dayHigh.toLocaleString()} ${currentMarket?.currency}`, cls: 'text-green-600' },
                    { label: 'أدنى اليوم',   value: `${selectedStockExtras.dayLow.toLocaleString()} ${currentMarket?.currency}`,  cls: 'text-red-600' },
                    { label: 'حجم التداول',  value: selectedStockExtras.volume.toLocaleString(),   cls: '' },
                    { label: 'القيمة السوقية', value: selectedStockExtras.marketCap,                cls: '' },
                    { label: 'مكرر الأرباح', value: `${selectedStockExtras.pe}x`,                  cls: '' },
                    { label: 'العائد الربحي', value: `${selectedStockExtras.dividend}%`,            cls: 'text-blue-600' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                      <p className={cn('text-xs font-semibold', cls)}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* ── المعايير الشرعية ── */}
              {shariaLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  جاري تحميل البيانات الشرعية…
                </div>
              ) : shariaData?.found ? (
                <div className="space-y-3">
                  {/* الحالة الإجمالية */}
                  <div className="flex items-center justify-between p-3 rounded-xl border-2
                    bg-gradient-to-l from-transparent
                    data-[status=halal]:border-green-400 data-[status=halal]:from-green-50/60
                    data-[status=haram]:border-red-400   data-[status=haram]:from-red-50/60
                    data-[status=mixed]:border-yellow-400 data-[status=mixed]:from-yellow-50/60
                    dark:data-[status=halal]:from-green-900/20
                    dark:data-[status=haram]:from-red-900/20
                    dark:data-[status=mixed]:from-yellow-900/20"
                    data-status={
                      shariaData.overall === '✅' ? 'halal' :
                      shariaData.overall === '❌' ? 'haram' : 'mixed'
                    }
                  >
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-0.5">التقييم الشرعي الإجمالي</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{shariaData.overall ?? '🟡'}</span>
                        <span className={cn(
                          'font-bold text-sm',
                          shariaData.overall === '✅' ? 'text-green-700 dark:text-green-400' :
                          shariaData.overall === '❌' ? 'text-red-700 dark:text-red-400' :
                          'text-yellow-700 dark:text-yellow-400'
                        )}>
                          {shariaData.overall === '✅' ? 'متوافق شرعياً' :
                           shariaData.overall === '❌' ? 'غير متوافق شرعياً' :
                           'يحتاج مراجعة'}
                        </span>
                      </div>
                    </div>
                    <div className="text-left space-y-0.5">
                      {shariaData.grade && (
                        <div>
                          <span className="text-[10px] text-muted-foreground">التقدير: </span>
                          <span className="font-bold text-sm">{shariaData.grade}</span>
                        </div>
                      )}
                      {shariaData.recommendation && shariaData.recommendation !== '—' && (
                        <div className="text-sm">{shariaData.recommendation}</div>
                      )}
                    </div>
                  </div>

                  {/* الأربعة معايير */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">المعايير الأربعة</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'بنك البلاد',      value: shariaData.bilad   },
                        { label: 'مصرف الراجحي',    value: shariaData.rajhi   },
                        { label: 'مكتب المقاصد',    value: shariaData.maqasid },
                        { label: 'معيار صفر ديون',  value: shariaData.zerodebt },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className={cn(
                            'flex items-center justify-between rounded-lg px-3 py-2 border',
                            value === '✅'
                              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                              : value === '❌'
                              ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                              : 'bg-muted/50 border-border'
                          )}
                        >
                          <span className="text-xs font-medium">{label}</span>
                          <span className="text-base leading-none">{value ?? '🟡'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* نسبة التطهير */}
                  {shariaData.purification && shariaData.purification !== '—' && (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">نسبة التطهير</span>
                      <span className="font-bold text-sm text-blue-700 dark:text-blue-300">
                        {shariaData.purification}
                      </span>
                    </div>
                  )}
                </div>
              ) : shariaData && !shariaData.found ? (
                <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0" />
                  لا توجد بيانات شرعية لهذا الرمز في قاعدة البيانات
                </div>
              ) : null}

              <Separator />

              {/* ── روابط (حقيقية) ── */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="h-3.5 w-3.5" /> روابط سريعة
                </p>

                {/* رابط TradingView مع البورصة الصحيحة */}
                <a
                  href={getTradingViewUrl(selectedStock.stock.symbol, market)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/60 transition-colors group"
                >
                  <BarChart3 className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">الرسم البياني – TradingView</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {MARKET_TV_PREFIX[market] ? `${MARKET_TV_PREFIX[market]}:${selectedStock.stock.symbol}` : selectedStock.stock.symbol}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>

                {/* رابط صفحة السوق الداخلية */}
                <Link
                  href={`/markets/${MARKET_INTERNAL_PATH[market] ?? market.toUpperCase()}`}
                  onClick={() => setSelectedStock(null)}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/60 transition-colors group"
                >
                  <Layers className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">صفحة السوق – {currentMarket?.label}</p>
                    <p className="text-[10px] text-muted-foreground">عرض مؤشرات وبيانات السوق الكاملة</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                {/* رابط الفلتر بالقطاع في الخريطة */}
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/60 transition-colors group text-right"
                  onClick={() => {
                    setSectorFilter(selectedStock.sector);
                    setSelectedStock(null);
                  }}
                >
                  <Filter className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">عرض قطاع {selectedStock.sector} فقط</p>
                    <p className="text-[10px] text-muted-foreground">تصفية الخريطة بهذا القطاع</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>

                {/* رابط التنبيهات */}
                <Link
                  href="/profile?tab=alerts"
                  onClick={() => setSelectedStock(null)}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/60 transition-colors group"
                >
                  <Bell className="h-5 w-5 text-violet-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">إضافة تنبيه سعري</p>
                    <p className="text-[10px] text-muted-foreground">ضبط تنبيه لـ {selectedStock.stock.symbol} في صفحة الملف الشخصي</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </div>

              {/* ── إضافة لقائمة المتابعة ── */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleAddToWatchlist}
                  disabled={isAddingToWatchlist}
                >
                  <Star className="h-4 w-4" />
                  {isAddingToWatchlist ? 'جاري الإضافة…' : 'إضافة لقائمة المتابعة'}
                </Button>
                <DialogClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
