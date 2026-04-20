'use client';

import {
  ChartConfig,
  ChartContainer,
} from '@/components/ui/chart';
import {
  Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis,
  CartesianGrid, ResponsiveContainer, Area, AreaChart, Tooltip,
  Legend, RadialBarChart, RadialBar,
} from 'recharts';
import { formatCurrency } from '@/lib/helpers';

const GRADIENT_PALETTE = [
  { from: '#6366f1', to: '#8b5cf6' },
  { from: '#22c55e', to: '#10b981' },
  { from: '#f59e0b', to: '#f97316' },
  { from: '#ef4444', to: '#f97316' },
  { from: '#3b82f6', to: '#06b6d4' },
  { from: '#ec4899', to: '#f43f5e' },
  { from: '#8b5cf6', to: '#a855f7' },
  { from: '#14b8a6', to: '#06b6d4' },
  { from: '#f97316', to: '#eab308' },
  { from: '#06b6d4', to: '#0ea5e9' },
];

const SECTOR_COLORS: Record<string, string> = {
  'تقنية': '#6366f1', 'مالية': '#22c55e', 'Cryptocurrency': '#f7931a',
  'Forex': '#14b8a6', 'تجزئة': '#f97316', 'متنوع': '#64748b',
  'رعاية صحية': '#ef4444', 'أخرى': '#94a3b8', 'الطاقة': '#f59e0b',
  'البنوك': '#3b82f6', 'الاتصالات': '#8b5cf6', 'العقارات': '#ec4899',
  'التطوير العقاري': '#ec4899', 'التأمين': '#06b6d4', 'الأسمنت': '#84cc16',
  'النقل': '#14b8a6', 'الصناعة': '#6366f1', 'الصحة': '#ef4444',
  'التعليم': '#a855f7', 'السياحة': '#e11d48', 'التكنولوجيا': '#0ea5e9',
  'المالية': '#22c55e', 'السلع الأساسية': '#d97706', 'الخدمات': '#64748b',
  'استثمار اجنبي': '#6d28d9', 'تصنيع': '#8b5cf6', 'سلع معمرة': '#d97706',
  'معادن': '#f59e0b', 'خدمات صحية': '#14b8a6', 'خدمات تجارية': '#06b6d4',
  'خدمات استهلاكية': '#84cc16', 'US Stocks': '#2563eb',
  'العملات المشفرة': '#f7931a', 'الفوركس': '#14b8a6', 'السلع والمعادن': '#f59e0b',
  'صناديق': '#3b82f6', 'صكوك': '#22c55e',
};

const ASSET_TYPE_COLORS: Record<string, { from: string; to: string }> = {
  'سهم': { from: '#6366f1', to: '#8b5cf6' },
  'مشفرة': { from: '#f7931a', to: '#f59e0b' },
  'فوركس': { from: '#14b8a6', to: '#06b6d4' },
  'صك/سند': { from: '#22c55e', to: '#10b981' },
  'صندوق': { from: '#3b82f6', to: '#06b6d4' },
  'سلعة': { from: '#f59e0b', to: '#f97316' },
};

function getColor(index: number): string {
  return GRADIENT_PALETTE[index % GRADIENT_PALETTE.length].from;
}

interface StockItem {
  id: string; symbol: string; name: string; sector?: string;
  qty: number; buyPrice: number; currentPrice?: number;
  totalCost?: number; currentValue?: number;
  profitLoss?: number; profitLossPct?: number;
  valueSAR?: number; costSAR?: number; plSAR?: number;
  buyCurrency?: string;
}

interface BondItem {
  id: string; symbol: string; name: string; type: string;
  faceValue: number; qty: number; buyPrice: number;
  currentPrice?: number; valueSAR?: number; costSAR?: number;
  valueSARS?: number; couponRate?: number;
  plSAR?: number;
}

interface FundItem {
  id: string; symbol?: string; name: string; fundType?: string;
  units: number; buyPrice: number; currentPrice?: number;
  valueSAR?: number; costSAR?: number;
  faceValue?: number; qty?: number;
  plSAR?: number;
}

function getStockValue(s: StockItem): number {
  return s.valueSAR ?? s.qty * (s.currentPrice || s.buyPrice);
}
function getBondValue(b: BondItem): number {
  return b.valueSAR ?? b.qty * b.faceValue * ((b.currentPrice || b.buyPrice) / 100);
}
function getFundValue(f: FundItem): number {
  return f.valueSAR ?? f.units * (f.currentPrice || f.buyPrice);
}
function getStockCost(s: StockItem): number {
  return s.costSAR ?? s.qty * s.buyPrice;
}
function getBondCost(b: BondItem): number {
  return b.costSAR ?? b.qty * b.faceValue * (b.buyPrice / 100);
}
function getFundCost(f: FundItem): number {
  return f.costSAR ?? f.units * f.buyPrice;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-md px-4 py-3 shadow-2xl text-xs min-w-[180px]">
      {label && <p className="font-bold text-foreground mb-2 text-sm border-b border-border/30 pb-1.5">{label}</p>}
      {payload.map((item: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{item.name}</span>
          </div>
          <span className="font-bold text-foreground tabular-nums">{typeof item.value === 'number' ? formatCurrency(item.value) : item.value}</span>
        </div>
      ))}
    </div>
  );
}

function PercentTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-md px-4 py-3 shadow-2xl text-xs min-w-[180px]">
      {label && <p className="font-bold text-foreground mb-2 text-sm border-b border-border/30 pb-1.5">{label}</p>}
      {payload.map((item: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{item.name}</span>
          </div>
          <span className="font-bold text-foreground tabular-nums">{typeof item.value === 'number' ? `${item.value.toFixed(2)}%` : item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Asset Allocation Donut ───
interface AssetAllocationChartProps {
  stocks: StockItem[];
  bonds: BondItem[];
  funds: FundItem[];
  cryptoTotal?: number;
  forexTotal?: number;
  commodityTotal?: number;
  stockCount?: number;
  cryptoCount?: number;
  forexCount?: number;
  commodityCount?: number;
}

export function AssetAllocationChart({ stocks, bonds, funds, cryptoTotal = 0, forexTotal = 0, commodityTotal = 0, stockCount, cryptoCount, forexCount, commodityCount }: AssetAllocationChartProps) {
  const regularStocksValue = stocks.reduce((s, st) => {
    const sector = st.sector || '';
    if (sector === 'Cryptocurrency' || sector === 'Forex') return s;
    return s + getStockValue(st);
  }, 0);
  const bondsValue = bonds.reduce((s, b) => s + getBondValue(b), 0);
  const fundsValue = funds.reduce((s, f) => {
    if (f.fundType === 'commodities') return s;
    return s + getFundValue(f);
  }, 0);
  const total = regularStocksValue + bondsValue + fundsValue + cryptoTotal + forexTotal + commodityTotal;
  if (total === 0) return null;

  const actualStockCount = stockCount ?? stocks.filter(s => s.sector !== 'Cryptocurrency' && s.sector !== 'Forex').length;
  const actualCryptoCount = cryptoCount ?? stocks.filter(s => s.sector === 'Cryptocurrency').length;
  const actualForexCount = forexCount ?? stocks.filter(s => s.sector === 'Forex').length;
  const actualCommodityCount = commodityCount ?? funds.filter(f => f.fundType === 'commodities').length;

  const data = [
    { name: 'الأسهم', value: regularStocksValue, gradient: GRADIENT_PALETTE[0], count: actualStockCount },
    { name: 'العملات المشفرة', value: cryptoTotal, gradient: { from: '#f7931a', to: '#f59e0b' }, count: actualCryptoCount },
    { name: 'الفوركس', value: forexTotal, gradient: { from: '#14b8a6', to: '#06b6d4' }, count: actualForexCount },
    { name: 'الصكوك والسندات', value: bondsValue, gradient: GRADIENT_PALETTE[1], count: bonds.length },
    { name: 'الصناديق', value: fundsValue, gradient: { from: '#3b82f6', to: '#06b6d4' }, count: funds.filter(f => f.fundType !== 'commodities').length },
    { name: 'السلع والمعادن', value: commodityTotal, gradient: GRADIENT_PALETTE[2], count: actualCommodityCount },
  ].filter(d => d.value > 0);

  const chartConfig = data.reduce((acc, d) => {
    acc[d.name] = { label: d.name, color: d.gradient.from };
    return acc;
  }, {} as ChartConfig);

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[340px]">
        <PieChart>
          <defs>
            {data.map((d, i) => (
              <linearGradient key={i} id={`assetGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={d.gradient.from} stopOpacity={1} />
                <stop offset="100%" stopColor={d.gradient.to} stopOpacity={0.85} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data} dataKey="value" nameKey="name"
            cx="50%" cy="50%" innerRadius={75} outerRadius={125}
            paddingAngle={3} strokeWidth={0}
            cornerRadius={6}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={`url(#assetGrad${index})`} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ChartContainer>
      <div className="mt-4 space-y-2.5">
        {data.map((item) => {
          const pct = (item.value / total * 100).toFixed(1);
          return (
            <div key={item.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-md shadow-sm" style={{ background: `linear-gradient(135deg, ${item.gradient.from}, ${item.gradient.to})` }} />
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-muted-foreground text-xs">({item.count})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base">{pct}%</span>
                  <span className="text-muted-foreground text-xs">{formatCurrency(item.value)}</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${item.gradient.from}, ${item.gradient.to})` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sector Allocation Pie ───
interface SectorAllocationChartProps {
  stocks: StockItem[];
  bonds?: BondItem[];
  funds?: FundItem[];
  includeCrypto?: boolean;
  includeForex?: boolean;
  includeCommodities?: boolean;
}

export function SectorAllocationChart({ stocks, bonds = [], funds = [], includeCrypto = true, includeForex = true, includeCommodities = true }: SectorAllocationChartProps) {
  const sectorMap = new Map<string, { value: number; count: number }>();

  stocks.forEach(s => {
    const sector = s.sector || 'أخرى';
    if (!includeCrypto && sector === 'Cryptocurrency') return;
    if (!includeForex && sector === 'Forex') return;
    const displaySector = sector === 'Cryptocurrency' ? 'العملات المشفرة' : sector === 'Forex' ? 'الفوركس' : sector;
    const val = getStockValue(s);
    const existing = sectorMap.get(displaySector) || { value: 0, count: 0 };
    sectorMap.set(displaySector, { value: existing.value + val, count: existing.count + 1 });
  });

  if (bonds.length > 0) {
    const bondsValue = bonds.reduce((s, b) => s + getBondValue(b), 0);
    if (bondsValue > 0) sectorMap.set('الصكوك والسندات', { value: bondsValue, count: bonds.length });
  }

  if (funds.length > 0) {
    const regularFunds = funds.filter(f => f.fundType !== 'commodities');
    const commodityFunds = funds.filter(f => f.fundType === 'commodities');
    const regularVal = regularFunds.reduce((s, f) => s + getFundValue(f), 0);
    if (regularVal > 0) sectorMap.set('الصناديق الاستثمارية', { value: regularVal, count: regularFunds.length });
    if (includeCommodities && commodityFunds.length > 0) {
      const comVal = commodityFunds.reduce((s, f) => s + getFundValue(f), 0);
      if (comVal > 0) sectorMap.set('السلع والمعادن', { value: comVal, count: commodityFunds.length });
    }
  }

  const data = Array.from(sectorMap.entries())
    .map(([sector, info]) => ({ sector, ...info }))
    .sort((a, b) => b.value - a.value);
  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  const chartConfig = data.reduce((acc, d, i) => {
    acc[d.sector] = { label: d.sector, color: SECTOR_COLORS[d.sector] || getColor(i) };
    return acc;
  }, {} as ChartConfig);

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[320px]">
        <PieChart>
          <defs>
            {data.map((d, i) => (
              <linearGradient key={i} id={`sectorGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={SECTOR_COLORS[d.sector] || getColor(i)} stopOpacity={1} />
                <stop offset="100%" stopColor={SECTOR_COLORS[d.sector] || getColor(i)} stopOpacity={0.65} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data} dataKey="value" nameKey="sector"
            cx="50%" cy="50%" innerRadius={65} outerRadius={115}
            paddingAngle={3} strokeWidth={0} cornerRadius={5}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={`url(#sectorGrad${index})`} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ChartContainer>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item, index) => {
          const color = SECTOR_COLORS[item.sector] || getColor(index);
          const pct = total > 0 ? (item.value / total * 100).toFixed(1) : '0';
          return (
            <div key={item.sector} className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="h-3 w-3 rounded-sm flex-shrink-0 shadow-sm" style={{ backgroundColor: color }} />
              <span className="truncate flex-1 font-medium">{item.sector}</span>
              <span className="text-muted-foreground tabular-nums font-semibold">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Profit/Loss Bar Chart (All Assets) ───
interface ProfitLossChartProps {
  stocks: StockItem[];
  bonds?: BondItem[];
  funds?: FundItem[];
}

export function ProfitLossBarChart({ stocks, bonds = [], funds = [] }: ProfitLossChartProps) {
  const allAssets: { name: string; pl: number; type: string }[] = [];

  stocks.forEach(s => {
    const pl = s.plSAR ?? s.profitLoss ?? 0;
    const sector = s.sector || '';
    const type = sector === 'Cryptocurrency' ? 'مشفرة' : sector === 'Forex' ? 'فوركس' : 'سهم';
    const displayName = s.symbol.replace('.SR', '').replace('-USD', '').replace('-USDT', '').substring(0, 10);
    allAssets.push({ name: displayName, pl, type });
  });

  bonds.forEach(b => {
    const pl = b.plSAR ?? 0;
    allAssets.push({ name: b.symbol.substring(0, 10), pl, type: 'صك/سند' });
  });

  funds.forEach(f => {
    const pl = f.plSAR ?? 0;
    const type = f.fundType === 'commodities' ? 'سلعة' : 'صندوق';
    const displayName = (f.symbol || f.name).substring(0, 10);
    allAssets.push({ name: displayName, pl, type });
  });

  const sorted = [...allAssets]
    .sort((a, b) => Math.abs(b.pl) - Math.abs(a.pl))
    .slice(0, 12);

  const data = sorted.map(item => ({
    name: item.name,
    type: item.type,
    ربح: item.pl >= 0 ? item.pl : 0,
    خسارة: item.pl < 0 ? Math.abs(item.pl) : 0,
  }));

  const chartConfig = {
    ربح: { label: 'ربح', color: '#22c55e' },
    خسارة: { label: 'خسارة', color: '#ef4444' },
  } satisfies ChartConfig;

  if (data.length === 0) return null;

  return (
    <ChartContainer config={chartConfig} className="h-[400px]">
      <BarChart data={data} layout="vertical" barCategoryGap="18%" margin={{ left: 10, right: 20 }}>
        <defs>
          <linearGradient id="plGain" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="plLoss" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
        <XAxis type="number" axisLine={false} tickLine={false} className="text-[11px]" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
        <YAxis dataKey="name" type="category" className="text-xs font-medium" width={80} tickMargin={6} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="ربح" fill="url(#plGain)" radius={[0, 8, 8, 0]} stackId="a" />
        <Bar dataKey="خسارة" fill="url(#plLoss)" radius={[0, 8, 8, 0]} stackId="a" />
      </BarChart>
    </ChartContainer>
  );
}

// ─── Portfolio Value Area Chart (All Assets) ───
interface PortfolioValueChartProps {
  stocks: StockItem[];
  bonds?: BondItem[];
  funds?: FundItem[];
  cryptoTotal?: number;
  forexTotal?: number;
  commodityTotal?: number;
}

export function PortfolioValueChart({ stocks, bonds = [], funds = [], cryptoTotal = 0, forexTotal = 0, commodityTotal = 0 }: PortfolioValueChartProps) {
  const stockCost = stocks.reduce((s, st) => s + getStockCost(st), 0);
  const stockValue = stocks.reduce((s, st) => s + getStockValue(st), 0);
  const bondCost = bonds.reduce((s, b) => s + getBondCost(b), 0);
  const bondValue = bonds.reduce((s, b) => s + getBondValue(b), 0);
  const fundCost = funds.reduce((s, f) => s + getFundCost(f), 0);
  const fundValue = funds.reduce((s, f) => s + getFundValue(f), 0);

  const totalCost = stockCost + bondCost + fundCost;
  const totalValue = stockValue + bondValue + fundValue + cryptoTotal + forexTotal + commodityTotal;

  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const baseValue = totalCost * 0.85;
  const now = new Date().getMonth();
  const diff = totalValue - totalCost;

  const data = months.map((month, i) => {
    const progress = i / Math.max(now, 1);
    const value = baseValue + (totalValue - baseValue) * progress + (Math.sin(i * 0.8) * diff * 0.12);
    const cost = baseValue + (totalCost - baseValue) * progress;
    return { month, القيمة: Math.round(value), التكلفة: Math.round(cost) };
  }).slice(0, now + 1);

  const chartConfig = {
    القيمة: { label: 'القيمة الحالية', color: '#6366f1' },
    التكلفة: { label: 'التكلفة', color: '#94a3b8' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[380px]">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="valueAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
            <stop offset="40%" stopColor="#8b5cf6" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="costAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="valueLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={12} className="text-[11px]" interval={Math.max(0, Math.floor(now / 6))} />
        <YAxis tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-[11px]" />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone" dataKey="التكلفة"
          stroke="#94a3b8" strokeDasharray="5 5" fillOpacity={1} fill="url(#costAreaGrad)"
          strokeWidth={2} dot={false}
        />
        <Area
          type="monotone" dataKey="القيمة"
          stroke="url(#valueLineGrad)" fillOpacity={1} fill="url(#valueAreaGrad)"
          strokeWidth={3} dot={false}
          activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

// ─── Sparkline ───
interface SparklineProps { data: number[]; height?: number }

export function Sparkline({ data, height = 40 }: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));
  const isPositive = data[data.length - 1] >= data[0];
  const color = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} fill="url(#sparkGrad)" strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Currency Distribution ───
interface CurrencyDistributionProps { stocks: StockItem[] }

export function CurrencyDistributionChart({ stocks }: CurrencyDistributionProps) {
  const currencyMap = new Map<string, number>();
  stocks.forEach(s => {
    const currency = (s as StockItem & { buyCurrency?: string }).buyCurrency || 'SAR';
    const val = getStockValue(s);
    currencyMap.set(currency, (currencyMap.get(currency) || 0) + val);
  });

  const data = Array.from(currencyMap.entries())
    .map(([currency, value]) => ({ currency, value }))
    .sort((a, b) => b.value - a.value);

  const CURRENCY_COLORS: Record<string, string> = {
    SAR: '#22c55e', USD: '#3b82f6', AED: '#f59e0b', EUR: '#8b5cf6', KWD: '#ec4899',
  };
  if (data.length <= 1) return null;

  const chartConfig = data.reduce((acc, d) => {
    acc[d.currency] = { label: d.currency, color: CURRENCY_COLORS[d.currency] || getColor(0) };
    return acc;
  }, {} as ChartConfig);

  return (
    <div>
      <ChartContainer config={chartConfig} className="h-[300px]">
        <PieChart>
          <defs>
            {data.map((d, i) => (
              <linearGradient key={i} id={`currGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={CURRENCY_COLORS[d.currency] || getColor(i)} stopOpacity={1} />
                <stop offset="100%" stopColor={CURRENCY_COLORS[d.currency] || getColor(i)} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <Pie data={data} dataKey="value" nameKey="currency" cx="50%" cy="50%" innerRadius={50} outerRadius={95} paddingAngle={3} strokeWidth={0} cornerRadius={4}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={`url(#currGrad${index})`} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ChartContainer>
      <div className="mt-3 flex flex-wrap gap-3 justify-center">
        {data.map((item, i) => (
          <div key={item.currency} className="flex items-center gap-1.5 text-xs bg-muted/30 px-2.5 py-1.5 rounded-lg">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CURRENCY_COLORS[item.currency] || getColor(i) }} />
            <span className="font-medium">{item.currency}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top Performers (All Asset Types) ───
interface TopPerformersProps {
  stocks: StockItem[];
  bonds?: BondItem[];
  funds?: FundItem[];
}

export function TopPerformersChart({ stocks, bonds = [], funds = [] }: TopPerformersProps) {
  const allAssets: { name: string; pct: number; type: string }[] = [];

  stocks.forEach(s => {
    const pct = s.profitLossPct || 0;
    const sector = s.sector || '';
    const type = sector === 'Cryptocurrency' ? 'مشفرة' : sector === 'Forex' ? 'فوركس' : 'سهم';
    const displayName = s.symbol.replace('.SR', '').replace('-USD', '').replace('-USDT', '').substring(0, 10);
    allAssets.push({ name: displayName, pct, type });
  });

  bonds.forEach(b => {
    const cost = getBondCost(b);
    const value = getBondValue(b);
    const pct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
    allAssets.push({ name: b.symbol.substring(0, 10), pct, type: 'صك/سند' });
  });

  funds.forEach(f => {
    const cost = getFundCost(f);
    const value = getFundValue(f);
    const pct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
    const type = f.fundType === 'commodities' ? 'سلعة' : 'صندوق';
    const displayName = (f.symbol || f.name).substring(0, 10);
    allAssets.push({ name: displayName, pct, type });
  });

  const sorted = [...allAssets].sort((a, b) => b.pct - a.pct);
  const top5 = sorted.slice(0, 6);
  const bottom5 = sorted.length > 6 ? sorted.slice(-6).reverse() : [];

  const data = [
    ...top5.map(s => ({ name: s.name, value: s.pct, type: s.type })),
    ...bottom5.map(s => ({ name: s.name, value: s.pct, type: s.type })),
  ];

  const chartConfig = {
    value: { label: 'التغيير %', color: '#6366f1' },
  } satisfies ChartConfig;

  if (data.length === 0) return null;

  return (
    <ChartContainer config={chartConfig} className="h-[400px]">
      <BarChart data={data} barCategoryGap="20%" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="barGain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
            <stop offset="100%" stopColor="#16a34a" stopOpacity={0.75} />
          </linearGradient>
          <linearGradient id="barLoss" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.75} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} className="text-[10px] font-medium" interval={0} angle={-35} textAnchor="end" height={60} />
        <YAxis tickLine={false} axisLine={false} className="text-[11px]" tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<PercentTooltip />} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={45}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.value >= 0 ? 'url(#barGain)' : 'url(#barLoss)'} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// ─── Asset Type Comparison (Horizontal Bar) ───
interface AssetComparisonProps {
  categories: Array<{ label: string; valueSAR: number; costSAR: number; plSAR: number; count: number }>;
}

export function AssetComparisonChart({ categories }: AssetComparisonProps) {
  if (!categories || categories.length === 0) return null;

  const data = categories
    .filter(c => c.valueSAR > 0)
    .map(c => ({
      name: c.label,
      القيمة: Math.round(c.valueSAR),
      التكلفة: Math.round(c.costSAR),
      count: c.count,
    }));

  const chartConfig = {
    القيمة: { label: 'القيمة الحالية', color: '#6366f1' },
    التكلفة: { label: 'التكلفة', color: '#94a3b8' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="h-[350px]">
      <BarChart data={data} layout="vertical" barCategoryGap="25%" margin={{ left: 10, right: 20 }}>
        <defs>
          <linearGradient id="compValue" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="compCost" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
        <XAxis type="number" axisLine={false} tickLine={false} className="text-[11px]" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
        <YAxis dataKey="name" type="category" className="text-xs font-medium" width={100} tickMargin={6} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="التكلفة" fill="url(#compCost)" radius={[0, 4, 4, 0]} barSize={14} />
        <Bar dataKey="القيمة" fill="url(#compValue)" radius={[0, 8, 8, 0]} barSize={14} />
      </BarChart>
    </ChartContainer>
  );
}
