import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const MARKET_KEY_REGEX = /^[a-z_]+$/i;
const ALLOWED_METHODOLOGIES = new Set(['all', 'bilad', 'rajhi', 'maqasid', 'fiqh']);

// معلومات الأسواق
const MARKETS_INFO: Record<string, { name: string; flag: string; currency: string }> = {
  american: { name: 'الأسهم الأمريكية', flag: '🇺🇸', currency: '$' },
  american_etf: { name: 'صناديق ETF الأمريكية', flag: '🇺🇸', currency: '$' },
  saudi: { name: 'السوق السعودي', flag: '🇸🇦', currency: 'ر.س' },
  uae: { name: 'السوق الإماراتي', flag: '🇦🇪', currency: 'درهم' },
  egypt: { name: 'السوق المصري', flag: '🇪🇬', currency: 'ج.م' },
  kuwait: { name: 'السوق الكويتي', flag: '🇰🇼', currency: 'د.ك' },
  qatar: { name: 'السوق القطري', flag: '🇶🇦', currency: 'ر.ق' },
  oman: { name: 'السوق العماني', flag: '🇴🇲', currency: 'ر.ع' },
  jordan: { name: 'السوق الأردني', flag: '🇯🇴', currency: 'د.أ' },
  bahrain: { name: 'السوق البحريني', flag: '🇧🇭', currency: 'د.ب' },
};

interface Stock {
  symbol: string;
  name: string;
  price: number;
  actual_price: number;
  change_pct: number;
  pe_ratio: number;
  dividend_pct: number;
  eps: number;
  eps_growth: number;
  debt_capital: number;
  debt_assets: number;
  purification: number;
  market_cap: string;
  sector: string;
  grade: string;
  status: string;
  recommendation: string;
}

interface MarketData {
  market: string;
  summary: {
    total: number;
    bilad_count: number;
    rajhi_count: number;
    pure_count: number;
    mixed_count: number;
    fiqh_count: number;
    forbidden_count: number;
  };
  all_stocks: Stock[];
  bilad: any[];
  rajhi: any[];
  maqasid: any[];
  fiqh: any[];
}

function readJsonFile(filePath: string): any {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const market = searchParams.get('market');
  const methodology = searchParams.get('methodology');
  const search = searchParams.get('search');
  const min_quality = searchParams.get('min_quality');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '100');

  // الحصول على ملخص جميع الأسواق
  if (market === 'summaries' || market === 'all' || !market) {
    const marketsInfo = readJsonFile(path.join(DATA_DIR, 'stocks', 'markets_info.json')) || {};
    const summaries: any[] = [];
    let totalStocks = 0;
    let totalBilad = 0;
    let totalRajhi = 0;
    let totalMaqasid = 0;
    let totalFiqh = 0;

    for (const [key, info] of Object.entries(marketsInfo)) {
      const marketInfo = MARKETS_INFO[key];
      if (marketInfo) {
        const summary = info as any;
        summaries.push({
          key,
          name: marketInfo.name,
          flag: marketInfo.flag,
          currency: marketInfo.currency,
          total: summary.total || 0,
          bilad_count: summary.bilad_count || 0,
          rajhi_count: summary.rajhi_count || 0,
          maqasid_count: summary.maqasid_count || 0,
          fiqh_count: summary.fiqh_count || 0,
        });
        totalStocks += summary.total || 0;
        totalBilad += summary.bilad_count || 0;
        totalRajhi += summary.rajhi_count || 0;
        totalMaqasid += summary.maqasid_count || 0;
        totalFiqh += summary.fiqh_count || 0;
      }
    }

    // إضافة الصناديق السعودية
    const fundsData = readJsonFile(path.join(DATA_DIR, 'funds', 'saudi_funds.json'));
    let totalFunds = 0;
    let shariaFunds = 0;
    if (fundsData) {
      totalFunds = fundsData.all_funds?.length || 0;
      shariaFunds = fundsData.all_funds?.filter((f: any) => f.sharia_compliant === '✅').length || 0;
    }

    return NextResponse.json({
      summaries,
      totalStocks,
      totalFunds,
      shariaFunds,
      stats: {
        totalBilad,
        totalRajhi,
        totalMaqasid,
        totalFiqh,
      }
    });
  }

  // الحصول على بيانات سوق محدد
  if (!MARKET_KEY_REGEX.test(market)) {
    return NextResponse.json({ error: 'قيمة market غير صالحة' }, { status: 400 });
  }

  if (methodology && !ALLOWED_METHODOLOGIES.has(methodology)) {
    return NextResponse.json({ error: 'قيمة methodology غير صالحة' }, { status: 400 });
  }

  const marketFile = path.join(DATA_DIR, 'stocks', `${market}.json`);
  const marketData: MarketData | null = readJsonFile(marketFile);

  if (!marketData) {
    return NextResponse.json({ error: 'Market not found' }, { status: 404 });
  }

  const marketInfo = MARKETS_INFO[market] || { name: market, flag: '🏳️', currency: '' };

  // اختيار البيانات حسب المنهجية
  let stocks = marketData.all_stocks || [];
  if (methodology && marketData[methodology as keyof MarketData]) {
    stocks = marketData[methodology as keyof MarketData] as Stock[];
  }

  // تطبيق الفلاتر
  if (search) {
    const searchLower = search.toLowerCase();
    stocks = stocks.filter((s: Stock) =>
      s.symbol?.toLowerCase().includes(searchLower) ||
      s.name?.toLowerCase().includes(searchLower) ||
      s.sector?.toLowerCase().includes(searchLower)
    );
  }

  if (status) {
    stocks = stocks.filter((s: Stock) => {
      if (status === 'halal') return s.status?.includes('متوافق') || s.status?.includes('✅');
      if (status === 'forbidden') return s.status?.includes('غير') || s.status?.includes('❌');
      return true;
    });
  }

  // التصفح
  const startIndex = (page - 1) * limit;
  const paginatedStocks = stocks.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    market: marketInfo,
    summary: marketData.summary,
    stocks: paginatedStocks,
    methodology: methodology || 'all',
    total: stocks.length,
    page,
    limit,
    totalPages: Math.ceil(stocks.length / limit),
  });
}
