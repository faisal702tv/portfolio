import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// معايير الشريعة الإسلامية - 4 معايير فقط
// ═══════════════════════════════════════════════════════════════════════════

export const SHARIA_STANDARDS = {
  alBilad: {
    name: "البلاد",
    nameAr: "معايير بنك البلاد",
    debtThreshold: 30,
    incomeThreshold: 5,
    investmentThreshold: 30,
    description: "التمويل غير الإسلامي ≤ 30% من الأصول",
    source: "البلاد المالية",
    color: "bg-teal-500"
  },
  alRajhi: {
    name: "الراجحي",
    nameAr: "معايير بنك الراجحي",
    debtThreshold: 25,
    incomeThreshold: 5,
    description: "الديون ذات الفوائد ≤ 25% من الأصول",
    source: "مصرف الراجحي",
    color: "bg-green-600"
  },
  maqased: {
    name: "مكتب المقاصد",
    nameAr: "مكتب المقاصد - د. محمد العصيمي",
    debtThreshold: 30,
    cashThreshold: 30,
    description: "الدين ≤ 30%, النقد ≤ 30%",
    website: "https://almaqased.net",
    source: "مكتب المقاصد",
    color: "bg-amber-500"
  },
  zeroDebt: {
    name: "صفر ديون",
    nameAr: "معايير صفر ديون",
    debtThreshold: 0,
    incomeThreshold: 0,
    description: "0% ديون + النشاط المحرم",
    source: "معايير الأسهم النقية",
    color: "bg-red-500"
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// الأسواق المدعومة
// ═══════════════════════════════════════════════════════════════════════════

export const MARKETS_INFO = {
  // الأسواق العربية
  TADAWUL: { name: "السوق السعودي", nameEn: "Saudi Stock Exchange", country: "السعودية", flag: "🇸🇦", currency: "SAR" },
  ADX: { name: "سوق أبوظبي", nameEn: "Abu Dhabi Securities Exchange", country: "الإمارات", flag: "🇦🇪", currency: "AED" },
  DFM: { name: "سوق دبي", nameEn: "Dubai Financial Market", country: "الإمارات", flag: "🇦🇪", currency: "AED" },
  QE: { name: "السوق القطري", nameEn: "Qatar Stock Exchange", country: "قطر", flag: "🇶🇦", currency: "QAR" },
  KSE: { name: "السوق الكويتي", nameEn: "Kuwait Stock Exchange", country: "الكويت", flag: "🇰🇼", currency: "KWD" },
  BHB: { name: "السوق البحريني", nameEn: "Bahrain Stock Exchange", country: "البحرين", flag: "🇧🇭", currency: "BHD" },
  MSM: { name: "السوق العماني", nameEn: "Muscat Stock Exchange", country: "عمان", flag: "🇴🇲", currency: "OMR" },
  EGX: { name: "السوق المصري", nameEn: "Egyptian Stock Exchange", country: "مصر", flag: "🇪🇬", currency: "EGP" },
  
  // الأسواق الأمريكية
  US: { name: "السوق الأمريكي", nameEn: "US Stock Market", country: "أمريكا", flag: "🇺🇸", currency: "USD" },
  US_ETF: { name: "صناديق ETF", nameEn: "US ETFs", country: "أمريكا", flag: "🇺🇸", currency: "USD" },
  
  // السلع والعملات
  COMMODITIES: { name: "السلع", nameEn: "Commodities", country: "عالمي", flag: "🥇", currency: "USD" },
  CRYPTO: { name: "العملات الرقمية", nameEn: "Cryptocurrencies", country: "عالمي", flag: "₿", currency: "USD" },
  FOREX: { name: "العملات", nameEn: "Forex", country: "عالمي", flag: "💱", currency: "USD" }
};

// ═══════════════════════════════════════════════════════════════════════════
// التخزين المؤقت
// ═══════════════════════════════════════════════════════════════════════════

let cachedData: any = null;
let cacheTime = 0;
const CACHE_TTL = 60000;

function loadDatabase() {
  const now = Date.now();
  if (cachedData && (now - cacheTime) < CACHE_TTL) {
    return cachedData;
  }
  
  const dataPath = path.join(process.cwd(), 'src/data/stocks_database.json');
  
  if (!fs.existsSync(dataPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(dataPath, 'utf-8');
    cachedData = JSON.parse(content);
    cacheTime = now;
    return cachedData;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market');
  const symbol = searchParams.get('symbol');
  const status = searchParams.get('status');
  const standard = searchParams.get('standard');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search')?.toLowerCase();
  const statsOnly = searchParams.get('statsOnly') === 'true';

  try {
    const data = loadDatabase();
    
    if (!data) {
      return NextResponse.json({
        error: 'Database not found',
        stats: { total: 0 },
        markets: MARKETS_INFO,
        standards: SHARIA_STANDARDS
      });
    }

    // تجميع كل الأسهم
    let allStocks: any[] = [];
    
    for (const [marketCode, stocks] of Object.entries(data)) {
      if (marketCode === 'metadata' || !Array.isArray(stocks)) continue;
      
      for (const stock of stocks) {
        if (typeof stock === 'object' && stock.symbol) {
          allStocks.push({
            ...stock,
            market: marketCode,
            marketInfo: MARKETS_INFO[marketCode as keyof typeof MARKETS_INFO] || {}
          });
        }
      }
    }

    // فلترة حسب السوق
    if (market && market !== 'all') {
      allStocks = allStocks.filter(s => s.market === market);
    }

    // البحث عن سهم محدد
    if (symbol) {
      const stock = allStocks.find(s => s.symbol?.toLowerCase() === symbol.toLowerCase());
      if (!stock) {
        return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
      }
      return NextResponse.json({ stock, standards: SHARIA_STANDARDS });
    }

    // البحث النصي
    if (search) {
      allStocks = allStocks.filter(s =>
        s.symbol?.toLowerCase().includes(search) ||
        s.name?.toLowerCase().includes(search)
      );
    }

    // فلترة حسب الحالة الشرعية
    if (status && status !== 'all') {
      allStocks = allStocks.filter(s => s.sharia?.status === status);
    }

    // فلترة حسب المعيار الشرعي
    if (standard && standard !== 'all' && SHARIA_STANDARDS[standard as keyof typeof SHARIA_STANDARDS]) {
      allStocks = allStocks.filter(s => s.shariaDetails?.[standard]?.status === 'compliant');
    }

    // إحصائيات عامة
    const stats = {
      total: allStocks.length,
      compliant: allStocks.filter(s => s.sharia?.status === 'compliant').length,
      nonCompliant: allStocks.filter(s => s.sharia?.status === 'non_compliant').length,
      pending: allStocks.filter(s => s.sharia?.status === 'pending').length,
    };

    // إحصائيات كل سوق
    const marketStats: any = {};
    for (const marketCode of Object.keys(MARKETS_INFO)) {
      const marketStocks = allStocks.filter(s => s.market === marketCode);
      marketStats[marketCode] = {
        total: marketStocks.length,
        compliant: marketStocks.filter(s => s.sharia?.status === 'compliant').length
      };
    }

    // إحصائيات كل معيار
    const standardStats: any = {};
    for (const std of Object.keys(SHARIA_STANDARDS)) {
      standardStats[std] = {
        compliant: allStocks.filter(s => s.shariaDetails?.[std]?.status === 'compliant').length,
        nonCompliant: allStocks.filter(s => s.shariaDetails?.[std]?.status === 'non_compliant').length
      };
    }

    // إذا كان الطلب للإحصائيات فقط
    if (statsOnly) {
      return NextResponse.json({
        stats,
        marketStats,
        standardStats,
        markets: MARKETS_INFO,
        standards: SHARIA_STANDARDS,
        metadata: data.metadata
      });
    }

    // تقسيم الصفحات
    const totalPages = Math.ceil(allStocks.length / limit);
    const startIndex = (page - 1) * limit;
    const paginatedStocks = allStocks.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      stats,
      marketStats,
      standardStats,
      markets: MARKETS_INFO,
      standards: SHARIA_STANDARDS,
      metadata: data.metadata,
      pagination: {
        page,
        limit,
        total: allStocks.length,
        totalPages
      },
      stocks: paginatedStocks
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
