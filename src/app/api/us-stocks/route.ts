import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// معايير الشريعة الإسلامية - 4 معايير فقط
// Islamic Sharia Standards - Only 4 Standards
// ═══════════════════════════════════════════════════════════════════════════

export const SHARIA_STANDARDS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. معايير بنك البلاد (المصدر: albilad-capital.com)
  // ═══════════════════════════════════════════════════════════════════════════
  alBilad: {
    name: "البلاد",
    nameAr: "معايير بنك البلاد",
    // التمويل غير الإسلامي ≤ 30% من إجمالي الأصول
    debtThreshold: 30,
    // تكلفة التمويل غير الإسلامي ≤ 5% من إجمالي النفقات
    incomeThreshold: 5,
    // الاستثمارات غير الإسلامية ≤ 30% من إجمالي الأصول
    investmentThreshold: 30,
    description: "التمويل غير الإسلامي ≤ 30%، التكلفة ≤ 5%، الاستثمارات ≤ 30%",
    source: "البلاد المالية - albilad-capital.com",
    color: "bg-teal-500"
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 2. معايير بنك الراجحي
  // ═══════════════════════════════════════════════════════════════════════════
  alRajhi: {
    name: "الراجحي",
    nameAr: "معايير بنك الراجحي",
    // الديون ذات الفوائد ≤ 25% من إجمالي الأصول
    debtThreshold: 25,
    // الإيرادات غير الشرعية ≤ 5% من إجمالي الإيرادات
    incomeThreshold: 5,
    description: "الديون الربوية ≤ 25%، الإيرادات غير الشرعية ≤ 5%",
    source: "مصرف الراجحي",
    color: "bg-green-600"
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 3. معايير مكتب المقاصد - د. محمد العصيمي
  // ═══════════════════════════════════════════════════════════════════════════
  maqased: {
    name: "مكتب المقاصد",
    nameAr: "مكتب المقاصد للاستشارات الاستثمارية - د. محمد العصيمي",
    // الدين ≤ 30%
    debtThreshold: 30,
    // النقد المحرم ≤ 30%
    cashThreshold: 30,
    description: "الدين الربوي ≤ 30%، النقد والاستثمارات المحرمة ≤ 30%",
    website: "https://almaqased.net",
    source: "مكتب المقاصد - د. محمد بن سعود العصيمي",
    color: "bg-amber-500"
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 4. معايير صفر ديون (الأكثر صرامة)
  // ═══════════════════════════════════════════════════════════════════════════
  zeroDebt: {
    name: "صفر ديون",
    nameAr: "معايير صفر قروض وصفر ديون",
    // صفر ديون ربوية
    debtThreshold: 0,
    // صفر إيرادات محرمة
    incomeThreshold: 0,
    description: "صفر ديون ربوية، صفر إيرادات محرمة (الأكثر صرامة)",
    source: "معايير الأسهم النقية",
    color: "bg-red-500"
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// القطاعات المحرمة حسب الشريعة الإسلامية
// ═══════════════════════════════════════════════════════════════════════════

interface ProhibitedSector {
  nameAr: string;
  keywords: string[];
  needsReview?: boolean;
}

export const PROHIBITED_SECTORS: Record<string, ProhibitedSector> = {
  alcohol: {
    nameAr: "الكحول والمسكرات",
    keywords: ["Alcohol", "Beverages - Alcoholic", "Breweries", "Wineries", "Distilleries", "Beer", "Wine", "Spirits", "Liquor"]
  },
  gambling: {
    nameAr: "القمار والمراهنات",
    keywords: ["Gambling", "Casinos", "Betting", "Gaming", "Resorts & Casinos"]
  },
  pork: {
    nameAr: "لحم الخنزير",
    keywords: ["Pork", "Meat Products", "Food - Meat"]
  },
  conventionalFinance: {
    nameAr: "البنوك التقليدية والتأمين",
    keywords: ["Banks", "Banks - Regional", "Banks - Diversified", "Insurance", "Insurance - Life", "Insurance - Property", "Credit Services", "Mortgage Finance", "Financial Services", "Investment Banking"]
  },
  tobacco: {
    nameAr: "التبغ والسجائر",
    keywords: ["Tobacco", "Cigarettes", "Smoking"]
  },
  adultEntertainment: {
    nameAr: "الترفيه للبالغين",
    keywords: ["Adult Entertainment", "Adult Content"]
  },
  entertainment: {
    nameAr: "الترفيه والموسيقى (مختلط - يحتاج مراجعة)",
    keywords: ["Entertainment", "Media", "Broadcasting", "Movies", "Music", "Recording", "Studios"],
    needsReview: true
  },
  hospitality: {
    nameAr: "الفنادق والسياحة (مختلط - يحتاج مراجعة)",
    keywords: ["Hotels", "Lodging", "Resorts", "Travel Services", "Tourism"],
    needsReview: true
  }
};

// دالة للتحقق من القطاع المحرم
export function checkProhibitedSector(sector: string, industry: string): { 
  isProhibited: boolean; 
  prohibitedCategory?: string;
  needsReview: boolean;
  reason?: string;
} {
  const sectorLower = (sector || '').toLowerCase();
  const industryLower = (industry || '').toLowerCase();
  
  for (const [key, category] of Object.entries(PROHIBITED_SECTORS)) {
    for (const keyword of category.keywords) {
      if (sectorLower.includes(keyword.toLowerCase()) || industryLower.includes(keyword.toLowerCase())) {
        return {
          isProhibited: !category.needsReview,
          prohibitedCategory: category.nameAr,
          needsReview: category.needsReview || false,
          reason: category.needsReview ? `${category.nameAr}: يحتاج مراجعة إضافية` : `قطاع محرم: ${category.nameAr}`
        };
      }
    }
  }
  
  return { isProhibited: false, needsReview: false };
}

// ═══════════════════════════════════════════════════════════════════════════
// Cached Data - للتخزين المؤقت
// ═══════════════════════════════════════════════════════════════════════════

let cachedStocksData: any = null;
let cachedMetadata: any = null;
let lastLoadTime = 0;
const CACHE_TTL = 60000; // 1 minute cache

function loadStocksData() {
  const now = Date.now();
  if (cachedStocksData && (now - lastLoadTime) < CACHE_TTL) {
    return { stocksData: cachedStocksData, metadata: cachedMetadata };
  }
  
  const dataPath = path.join(process.cwd(), 'src/data/us_stocks_database.json');
  
  if (!fs.existsSync(dataPath)) {
    return null;
  }
  
  try {
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Extract metadata
    const { metadata, US, US_ETF, ...rest } = data;
    cachedMetadata = metadata || { lastUpdate: new Date().toISOString() };
    cachedStocksData = { US: US || [], US_ETF: US_ETF || [] };
    lastLoadTime = now;
    
    return { stocksData: cachedStocksData, metadata: cachedMetadata };
  } catch (error) {
    console.error('Error loading stocks data:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const standard = searchParams.get('standard');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search')?.toLowerCase();
  const statsOnly = searchParams.get('statsOnly') === 'true';

  try {
    const dataResult = loadStocksData();
    
    if (!dataResult) {
      return NextResponse.json({
        stats: { total: 0, compliant: 0, nonCompliant: 0, pending: 0 },
        standardStats: {},
        standards: SHARIA_STANDARDS,
        prohibitedSectors: PROHIBITED_SECTORS,
        metadata: { lastUpdate: new Date().toISOString() },
        count: 0,
        stocks: []
      });
    }
    
    const { stocksData, metadata } = dataResult;

    // تجميع كل الأسهم
    let allStocks: any[] = [];
    if (Array.isArray(stocksData.US)) {
      allStocks = allStocks.concat(stocksData.US.map((s: any) => ({ ...s, market: 'US' })));
    }
    if (Array.isArray(stocksData.US_ETF)) {
      allStocks = allStocks.concat(stocksData.US_ETF.map((s: any) => ({ ...s, market: 'US_ETF' })));
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

    // فلترة حسب المعيار الشرعي
    if (standard && standard !== 'all' && SHARIA_STANDARDS[standard as keyof typeof SHARIA_STANDARDS]) {
      allStocks = allStocks.filter(s => s.shariaDetails?.[standard]?.status === 'compliant');
    }

    // فلترة حسب الحالة
    if (status && status !== 'all') {
      allStocks = allStocks.filter(s => s.sharia?.status === status);
    }

    // إحصائيات
    const stats = {
      total: allStocks.length,
      compliant: allStocks.filter(s => s.sharia?.status === 'compliant').length,
      nonCompliant: allStocks.filter(s => s.sharia?.status === 'non_compliant').length,
      pending: allStocks.filter(s => s.sharia?.status === 'pending').length,
    };

    // إحصائيات كل معيار
    const standardStats: any = {};
    Object.keys(SHARIA_STANDARDS).forEach(std => {
      const stdInfo = SHARIA_STANDARDS[std as keyof typeof SHARIA_STANDARDS];
      standardStats[std] = {
        compliant: allStocks.filter(s => s.shariaDetails?.[std]?.status === 'compliant').length,
        nonCompliant: allStocks.filter(s => s.shariaDetails?.[std]?.status === 'non_compliant').length,
        threshold: stdInfo.debtThreshold,
        nameAr: stdInfo.nameAr
      };
    });

    // إذا كان الطلب للإحصائيات فقط
    if (statsOnly) {
      return NextResponse.json({
        stats,
        standardStats,
        standards: SHARIA_STANDARDS,
        prohibitedSectors: PROHIBITED_SECTORS,
        metadata,
        count: allStocks.length
      });
    }

    // تقسيم الصفحات
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedStocks = allStocks.slice(startIndex, endIndex);

    return NextResponse.json({
      stats,
      standardStats,
      standards: SHARIA_STANDARDS,
      prohibitedSectors: PROHIBITED_SECTORS,
      metadata,
      count: allStocks.length,
      page,
      totalPages: Math.ceil(allStocks.length / limit),
      stocks: paginatedStocks,
    });
  } catch (error) {
    console.error('Error reading US stocks database:', error);
    return NextResponse.json(
      { error: 'Failed to load US stocks database' },
      { status: 500 }
    );
  }
}
