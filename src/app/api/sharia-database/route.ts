import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

interface StockData {
  symbol: string;
  name: string;
  sector: string;
  debt_pct: number;
  purification_pct: number;
  albilad: string;
  alrajhi: string;
  almaqasid: string;
  fiqh: string;
  quality: number;
  recommendation: string;
  market: string;
  market_flag: string;
}

interface FundData {
  rank: number;
  name: string;
  manager: string;
  return_2026: number;
  unit_price: number;
  rating: string;
  indicator: string;
  is_sharia: boolean;
}

interface MarketSummary {
  market: string;
  market_key: string;
  market_flag: string;
  total: number;
  albilad_compliant: number;
  alrajhi_compliant: number;
  almaqasid_pure: number;
  almaqasid_mixed: number;
  fiqh_compliant: number;
  forbidden_sector: number;
  buy_recommendations: number;
  quality_80plus: number;
  halal_ratio: string;
}

// Market file mapping
const MARKET_FILES: Record<string, { file: string; name: string; flag: string }> = {
  saudi: { file: 'Saudi_stock.xlsx', name: 'السعودية', flag: '🇸🇦' },
  american: { file: 'American_stock_.xlsx', name: 'أمريكا', flag: '🇺🇸' },
  uae: { file: 'UAE_stock.xlsx', name: 'الإمارات', flag: '🇦🇪' },
  egypt: { file: 'Egypt_stock.xlsx', name: 'مصر', flag: '🇪🇬' },
  qatar: { file: 'Qatar_stock.xlsx', name: 'قطر', flag: '🇶🇦' },
  bahrain: { file: 'Bahrain_stock.xlsx', name: 'البحرين', flag: '🇧🇭' },
  jordan: { file: 'Jordan_stock.xlsx', name: 'الأردن', flag: '🇯🇴' },
  oman: { file: 'Oman_stock.xlsx', name: 'عُمان', flag: '🇴🇲' },
};

const UPLOAD_DIR = '/home/z/my-project/upload';

function readStockData(marketKey: string): { stocks: StockData[]; summary: MarketSummary | null } {
  const marketInfo = MARKET_FILES[marketKey];
  if (!marketInfo) {
    return { stocks: [], summary: null };
  }

  const filePath = path.join(UPLOAD_DIR, marketInfo.file);
  
  if (!fs.existsSync(filePath)) {
    return { stocks: [], summary: null };
  }

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON, starting from row 8 (index 7)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: ['idx', 'symbol', 'name', 'sector', 'debt_pct', 'purification_pct', 
               'albilad', 'alrajhi', 'almaqasid', 'fiqh', 'quality', 'recommendation'],
      range: 7
    });

    const stocks: StockData[] = [];
    
    for (const row of jsonData as any[]) {
      if (!row.symbol || typeof row.symbol !== 'string') continue;
      if (row.symbol.includes('جدول') || row.symbol.includes('إجمالي') || row.symbol.includes('مقارنة')) continue;
      
      stocks.push({
        symbol: String(row.symbol || ''),
        name: String(row.name || ''),
        sector: String(row.sector || ''),
        debt_pct: parseFloat(row.debt_pct) || 0,
        purification_pct: parseFloat(row.purification_pct) || 0,
        albilad: String(row.albilad || ''),
        alrajhi: String(row.alrajhi || ''),
        almaqasid: String(row.almaqasid || ''),
        fiqh: String(row.fiqh || ''),
        quality: parseInt(row.quality) || 0,
        recommendation: String(row.recommendation || ''),
        market: marketInfo.name,
        market_flag: marketInfo.flag,
      });
    }

    // Calculate summary
    const summary: MarketSummary = {
      market: marketInfo.name,
      market_key: marketKey,
      market_flag: marketInfo.flag,
      total: stocks.length,
      albilad_compliant: stocks.filter(s => s.albilad.includes('✅')).length,
      alrajhi_compliant: stocks.filter(s => s.alrajhi.includes('✅')).length,
      almaqasid_pure: stocks.filter(s => s.almaqasid.includes('نقية')).length,
      almaqasid_mixed: stocks.filter(s => s.almaqasid.includes('مختلطة')).length,
      fiqh_compliant: stocks.filter(s => s.fiqh.includes('✅')).length,
      forbidden_sector: stocks.filter(s => 
        !s.albilad.includes('✅') && 
        !s.alrajhi.includes('✅') && 
        !s.almaqasid.includes('نقية')
      ).length,
      buy_recommendations: stocks.filter(s => s.recommendation.includes('شراء')).length,
      quality_80plus: stocks.filter(s => s.quality >= 80).length,
      halal_ratio: '0%',
    };

    if (stocks.length > 0) {
      const halalCount = stocks.filter(s => 
        s.albilad.includes('✅') || s.alrajhi.includes('✅') || 
        s.almaqasid.includes('نقية') || s.fiqh.includes('✅')
      ).length;
      summary.halal_ratio = Math.round((halalCount / stocks.length) * 100) + '%';
    }

    return { stocks, summary };
  } catch (error) {
    console.error(`Error reading ${marketKey}:`, error);
    return { stocks: [], summary: null };
  }
}

function readFundsData(): FundData[] {
  const filePath = path.join(UPLOAD_DIR, 'Saudi-Funds.xlsx');
  
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: ['idx', 'rank', 'name', 'manager', 'return_2026', 'unit_price', 'rating', 'indicator'],
      range: 7
    });

    const funds: FundData[] = [];
    
    for (const row of jsonData as any[]) {
      if (!row.name || typeof row.name !== 'string') continue;
      if (!row.name.includes('صندوق')) continue;
      
      const rank = parseInt(row.rank) || 0;
      if (rank === 0) continue;
      
      funds.push({
        rank,
        name: String(row.name || ''),
        manager: String(row.manager || ''),
        return_2026: parseFloat(row.return_2026) || 0,
        unit_price: parseFloat(row.unit_price) || 0,
        rating: String(row.rating || ''),
        indicator: String(row.indicator || ''),
        is_sharia: true,
      });
    }

    return funds;
  } catch (error) {
    console.error('Error reading funds:', error);
    return [];
  }
}

function readETFData(): StockData[] {
  const filePath = path.join(UPLOAD_DIR, 'American_stock_.xlsx');
  
  // Try to read ETF sheet if exists
  // For now, return empty array as we need to check the file structure
  return [];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const market = searchParams.get('market');
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const sharia_filter = searchParams.get('sharia');
  const min_quality = searchParams.get('min_quality');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  // Get all summaries
  if (market === 'summaries') {
    const summaries: MarketSummary[] = [];
    for (const key of Object.keys(MARKET_FILES)) {
      const { summary } = readStockData(key);
      if (summary) {
        summaries.push(summary);
      }
    }
    return NextResponse.json({ summaries });
  }

  // Get funds data
  if (type === 'funds') {
    let funds = readFundsData();
    
    if (search) {
      const searchLower = search.toLowerCase();
      funds = funds.filter(f => 
        f.name.toLowerCase().includes(searchLower) ||
        f.manager.toLowerCase().includes(searchLower)
      );
    }
    
    return NextResponse.json({ funds, total: funds.length });
  }

  // Get stocks for specific market
  if (market && market !== 'all' && MARKET_FILES[market]) {
    const { stocks, summary } = readStockData(market);
    
    let filteredStocks = stocks;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredStocks = filteredStocks.filter(s => 
        s.symbol.toLowerCase().includes(searchLower) ||
        s.name.toLowerCase().includes(searchLower) ||
        s.sector.toLowerCase().includes(searchLower)
      );
    }
    
    if (sharia_filter) {
      switch (sharia_filter) {
        case 'albilad':
          filteredStocks = filteredStocks.filter(s => s.albilad.includes('✅'));
          break;
        case 'alrajhi':
          filteredStocks = filteredStocks.filter(s => s.alrajhi.includes('✅'));
          break;
        case 'almaqasid':
          filteredStocks = filteredStocks.filter(s => s.almaqasid.includes('نقية'));
          break;
        case 'fiqh':
          filteredStocks = filteredStocks.filter(s => s.fiqh.includes('✅'));
          break;
      }
    }
    
    if (min_quality) {
      const minQ = parseInt(min_quality);
      filteredStocks = filteredStocks.filter(s => s.quality >= minQ);
    }
    
    const startIndex = (page - 1) * limit;
    const paginatedStocks = filteredStocks.slice(startIndex, startIndex + limit);
    
    return NextResponse.json({ 
      stocks: paginatedStocks, 
      summary,
      total: filteredStocks.length,
      page,
      limit,
      totalPages: Math.ceil(filteredStocks.length / limit),
      market: MARKET_FILES[market]
    });
  }

  // Get all markets overview
  const summaries: MarketSummary[] = [];
  let totalStocks = 0;
  
  for (const key of Object.keys(MARKET_FILES)) {
    const { stocks, summary } = readStockData(key);
    if (summary) {
      summaries.push(summary);
      totalStocks += stocks.length;
    }
  }

  const funds = readFundsData();

  return NextResponse.json({ 
    summaries,
    totalStocks,
    totalFunds: funds.length,
    markets: Object.entries(MARKET_FILES).map(([key, value]) => ({
      key,
      name: value.name,
      flag: value.flag
    }))
  });
}
